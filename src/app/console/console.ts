import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  effect,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameService } from '../core/services/game.service';
import { Subscription } from 'rxjs';
import { CrtEffectDirective } from '../ui/crt-effect/crt-effect.directive';

/**
 * Console interface representing a line of output with metadata.
 */
export interface ConsoleLine {
  text: string;
  type?: 'info' | 'error' | 'success' | 'description' | 'inventory' | 'help' | 'system' | 'command';
  timestamp: Date;
}

/**
 * ConsoleComponent displays game engine output chronologically.
 * Features:
 * - Renders game output with semantic styling via GameService observables
 * - Auto-scrolls to latest output
 * - Displays command history
 * - Responsive and accessible
 * - Classic Zork terminal aesthetic (DOS-style green-on-black)
 *
 * Usage:
 * ```html
 * <app-console />
 * ```
 *
 * Keyboard shortcuts:
 * - Arrow Up/Down: Navigate command history (when input is focused)
 * - Scroll wheel: Scroll through output
 * - Page Up/Down: Page through output
 * - Home/End: Jump to top/bottom
 */
@Component({
  selector: 'app-console',
  imports: [CommonModule, FormsModule, CrtEffectDirective],
  templateUrl: './console.html',
  styleUrl: './console.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Console implements AfterViewInit, OnDestroy {
  private readonly gameService = inject(GameService);
  private readonly subscriptions = new Subscription();

  /** Whether CRT effect is enabled */
  readonly crtEffectEnabled = input<boolean>(true);

  /** Reference to scrollable output container for auto-scroll */
  @ViewChild('outputContainer') outputContainer?: ElementRef<HTMLDivElement>;

  /** Reference to the input field for focus management */
  @ViewChild('commandInput') commandInput?: ElementRef<HTMLInputElement>;

  /** All console output lines */
  readonly consoleLines = signal<ConsoleLine[]>([]);

  /** Current command being typed */
  readonly currentCommand = signal<string>('');

  /** History of previously submitted commands */
  protected readonly commandHistory = signal<string[]>([]);

  /** Current position in command history (for Up/Down navigation) */
  protected readonly historyIndex = signal<number>(-1);

  /** Temporary storage for current input when navigating history */
  private temporaryCommand = '';

  /** Maximum number of commands to store in history */
  private readonly MAX_HISTORY_SIZE = 100;

  /** Whether to auto-scroll to latest output (disabled when user scrolls up) */
  private readonly autoScroll = signal<boolean>(true);

  /** Total number of lines for accessibility announcements */
  readonly totalLines = computed(() => this.consoleLines().length);

  /**
   * Subscribe to GameService output observable for real-time updates.
   */
  constructor() {
    // Subscribe to output stream from GameService
    this.subscriptions.add(
      this.gameService.output$.subscribe((output) => {
        const lines: ConsoleLine[] = output.map((text) => ({
          text,
          type: this.inferLineType(text),
          timestamp: new Date(),
        }));
        this.consoleLines.set(lines);
      })
    );
  }

  ngAfterViewInit(): void {
    // Initial scroll to bottom
    this.scrollToBottom();
    // Auto-focus the input field when component loads
    this.focusInput();
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.unsubscribe();
  }

  /**
   * Effect to auto-scroll to bottom when new content is added.
   */
  private readonly scrollEffect = effect(() => {
    // Trigger on any change to console lines
    this.consoleLines();

    // Schedule scroll for next frame to ensure DOM is updated
    if (this.autoScroll()) {
      setTimeout(() => this.scrollToBottom(), 0);
    }
  });

  /**
   * Scroll the output container to the bottom.
   */
  private scrollToBottom(): void {
    if (this.outputContainer?.nativeElement) {
      const container = this.outputContainer.nativeElement;
      container.scrollTop = container.scrollHeight;
    }
  }

  /**
   * Handle scroll events to disable auto-scroll when user scrolls up.
   */
  onScroll(): void {
    if (!this.outputContainer?.nativeElement) return;

    const container = this.outputContainer.nativeElement;
    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50; // 50px threshold

    this.autoScroll.set(isAtBottom);
  }

  /**
   * Infer the line type from content for semantic styling.
   */
  private inferLineType(
    text: string
  ): 'info' | 'error' | 'success' | 'description' | 'command' | undefined {
    if (!text) return undefined;

    const lowerText = text.toLowerCase();

    // Error indicators
    if (
      lowerText.includes("don't") ||
      lowerText.includes("can't") ||
      lowerText.includes('error') ||
      lowerText.includes('invalid') ||
      lowerText.includes('failed')
    ) {
      return 'error';
    }

    // Success indicators
    if (lowerText.includes('taken') || lowerText.includes('dropped')) {
      return 'success';
    }

    // Description indicators (room descriptions are usually longer)
    if (text.length > 100) {
      return 'description';
    }

    // Default to info
    return 'info';
  }

  /**
   * Get CSS classes for a console line based on its type.
   */
  getLineClasses(line: ConsoleLine): string[] {
    const classes = ['console-line'];
    if (line.type) {
      classes.push(`console-line--${line.type}`);
    }
    return classes;
  }

  /**
   * Track by function for ngFor optimization.
   */
  trackByIndex(index: number): number {
    return index;
  }

  /**
   * Focus the command input field.
   */
  focusInput(): void {
    setTimeout(() => {
      this.commandInput?.nativeElement.focus();
    }, 0);
  }

  /**
   * Handle input click to prevent event propagation
   */
  onInputClick(event: Event): void {
    event.stopPropagation();
  }

  /**
   * Handle command submission when Enter is pressed.
   */
  onSubmit(): void {
    const command = this.currentCommand().trim();

    if (!command) {
      return;
    }

    // Add command to history (avoiding duplicates of the last command)
    const history = this.commandHistory();
    if (history.length === 0 || history[history.length - 1] !== command) {
      const newHistory = [...history, command];
      // Keep only the last MAX_HISTORY_SIZE commands
      if (newHistory.length > this.MAX_HISTORY_SIZE) {
        newHistory.shift();
      }
      this.commandHistory.set(newHistory);
    }

    // Submit command via GameService (handles parsing and execution)
    this.gameService.submitCommand(command);

    // Clear input and reset history navigation
    this.currentCommand.set('');
    this.historyIndex.set(-1);
    this.temporaryCommand = '';

    // Maintain focus on input field
    this.focusInput();
  }

  /**
   * Handle keyboard navigation for command history.
   */
  onKeyDown(event: KeyboardEvent): void {
    const history = this.commandHistory();

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.navigateHistory('up', history);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.navigateHistory('down', history);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.clearInput();
    }
  }

  /**
   * Navigate through command history.
   * @param direction 'up' for previous command, 'down' for next command
   * @param history Current command history
   */
  private navigateHistory(direction: 'up' | 'down', history: string[]): void {
    if (history.length === 0) {
      return;
    }

    const currentIndex = this.historyIndex();

    // Save current input when starting to navigate history
    if (currentIndex === -1 && direction === 'up') {
      this.temporaryCommand = this.currentCommand();
    }

    // Calculate new index
    let newIndex = currentIndex;
    if (direction === 'up') {
      if (currentIndex === -1) {
        newIndex = history.length - 1;
      } else if (currentIndex > 0) {
        newIndex = currentIndex - 1;
      }
    } else {
      // direction === 'down'
      if (currentIndex < history.length - 1) {
        newIndex = currentIndex + 1;
      } else {
        // Reached the end, restore temporary command
        this.historyIndex.set(-1);
        this.currentCommand.set(this.temporaryCommand);
        return;
      }
    }

    // Update state
    this.historyIndex.set(newIndex);
    this.currentCommand.set(history[newIndex]);
  }

  /**
   * Clear the current input.
   */
  private clearInput(): void {
    this.currentCommand.set('');
    this.historyIndex.set(-1);
    this.temporaryCommand = '';
  }

  /**
   * Handle input changes.
   */
  onInputChange(value: string): void {
    this.currentCommand.set(value);
    // Reset history navigation when user types
    if (this.historyIndex() !== -1) {
      this.historyIndex.set(-1);
      this.temporaryCommand = '';
    }
  }

  /**
   * Get placeholder text for the input field.
   */
  getPlaceholder(): string {
    return 'Enter command (type "help" for available commands)';
  }
}
