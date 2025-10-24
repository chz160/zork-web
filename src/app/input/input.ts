import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameEngineService } from '../core/services/game-engine.service';
import { CommandParserService } from '../core/services/command-parser.service';

/**
 * InputComponent allows players to enter commands to the game engine.
 * Features:
 * - Command submission with Enter key
 * - Command history navigation with Up/Down arrow keys
 * - Focus management for accessibility
 * - Mobile-friendly layout with responsive design
 * - Input validation and error handling
 *
 * Usage:
 * ```html
 * <app-input />
 * ```
 *
 * Keyboard shortcuts:
 * - Enter: Submit command
 * - Up Arrow: Navigate to previous command in history
 * - Down Arrow: Navigate to next command in history
 * - Esc: Clear current input
 */
@Component({
  selector: 'app-input',
  imports: [CommonModule, FormsModule],
  templateUrl: './input.html',
  styleUrl: './input.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Input implements AfterViewInit {
  private readonly gameEngine = inject(GameEngineService);
  private readonly commandParser = inject(CommandParserService);

  /** Reference to the input field for focus management */
  @ViewChild('commandInput') commandInput?: ElementRef<HTMLInputElement>;

  /** Current command being typed */
  readonly currentCommand = signal<string>('');

  /** History of previously submitted commands */
  private readonly commandHistory = signal<string[]>([]);

  /** Current position in command history (for Up/Down navigation) */
  private readonly historyIndex = signal<number>(-1);

  /** Temporary storage for current input when navigating history */
  private temporaryCommand = '';

  /** Maximum number of commands to store in history */
  private readonly MAX_HISTORY_SIZE = 100;

  ngAfterViewInit(): void {
    // Auto-focus the input field when component loads
    this.focusInput();
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

    // Parse and execute the command
    const parserResult = this.commandParser.parse(command);
    this.gameEngine.executeCommand(parserResult);

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
