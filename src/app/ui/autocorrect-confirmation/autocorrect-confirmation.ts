import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * AutocorrectConfirmationComponent displays an inline prompt when the parser
 * detects a likely typo and offers an autocorrect suggestion.
 *
 * Features:
 * - Inline display of original input vs suggested correction
 * - Accept/decline buttons with keyboard shortcuts (y/n)
 * - Accessible markup with ARIA roles and labels
 * - Non-blocking UI that doesn't disrupt game flow
 * - Emits accept/reject events for game engine integration
 *
 * Usage:
 * ```html
 * <app-autocorrect-confirmation
 *   [originalInput]="'mailbax'"
 *   [suggestion]="'mailbox'"
 *   [confidence]="0.92"
 *   (accepted)="onAccepted()"
 *   (rejected)="onRejected()"
 * />
 * ```
 *
 * Accessibility:
 * - role="alert" with proper ARIA labels
 * - Keyboard shortcuts (y for yes, n for no, Escape for no)
 * - Focus management
 * - Screen reader announcements
 */
@Component({
  selector: 'app-autocorrect-confirmation',
  imports: [CommonModule],
  templateUrl: './autocorrect-confirmation.html',
  styleUrl: './autocorrect-confirmation.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutocorrectConfirmationComponent implements AfterViewInit {
  /** Original input text with potential typo */
  readonly originalInput = input.required<string>();

  /** Suggested correction */
  readonly suggestion = input.required<string>();

  /** Confidence score (0-1) of the suggestion */
  readonly confidence = input<number>(0.85);

  /** Emitted when user accepts the suggestion */
  readonly accepted = output<void>();

  /** Emitted when user rejects the suggestion */
  readonly rejected = output<void>();

  /** Reference to the confirmation container for focus management */
  @ViewChild('confirmationContainer')
  confirmationContainer?: ElementRef<HTMLDivElement>;

  /** Whether the component is currently visible */
  readonly isVisible = signal<boolean>(true);

  ngAfterViewInit(): void {
    // Focus the confirmation prompt for keyboard accessibility
    this.focusConfirmation();
  }

  /**
   * Focus the confirmation container for keyboard accessibility
   */
  private focusConfirmation(): void {
    setTimeout(() => {
      this.confirmationContainer?.nativeElement.focus();
    }, 0);
  }

  /**
   * Handle acceptance of the suggestion
   */
  accept(): void {
    this.isVisible.set(false);
    this.accepted.emit();
  }

  /**
   * Handle rejection of the suggestion
   */
  reject(): void {
    this.isVisible.set(false);
    this.rejected.emit();
  }

  /**
   * Handle keyboard events for shortcuts (y/n/Escape)
   */
  onKeyDown(event: KeyboardEvent): void {
    // Handle 'y' or 'Y' for accept
    if (event.key === 'y' || event.key === 'Y') {
      event.preventDefault();
      this.accept();
    }

    // Handle 'n' or 'N' or Escape for reject
    if (event.key === 'n' || event.key === 'N' || event.key === 'Escape') {
      event.preventDefault();
      this.reject();
    }
  }

  /**
   * Get ARIA label for the confirmation prompt
   */
  getAriaLabel(): string {
    return `Did you mean ${this.suggestion()}? Press Y to accept or N to reject`;
  }

  /**
   * Get formatted confidence percentage
   */
  getConfidencePercent(): string {
    return `${(this.confidence() * 100).toFixed(0)}%`;
  }
}
