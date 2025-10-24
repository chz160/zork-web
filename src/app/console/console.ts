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
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../core/services/game.service';
import { Subscription } from 'rxjs';

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
  imports: [CommonModule],
  templateUrl: './console.html',
  styleUrl: './console.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Console implements AfterViewInit, OnDestroy {
  private readonly gameService = inject(GameService);
  private readonly subscriptions = new Subscription();

  /** Reference to scrollable output container for auto-scroll */
  @ViewChild('outputContainer') outputContainer?: ElementRef<HTMLDivElement>;

  /** All console output lines */
  readonly consoleLines = signal<ConsoleLine[]>([]);

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
}
