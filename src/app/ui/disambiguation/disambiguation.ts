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
import { ObjectCandidate } from '../../core/models/parser-result.model';

/**
 * DisambiguationComponent displays a list of object candidates when the parser
 * encounters ambiguous input (e.g., "take lamp" when multiple lamps exist).
 *
 * Features:
 * - Displays top-N candidates with context information
 * - Numeric keyboard shortcuts (1-5) for quick selection
 * - Click/tap selection support
 * - Accessible markup with ARIA roles and labels
 * - Cancel/abort functionality
 * - Emits selection events for game engine integration
 *
 * Usage:
 * ```html
 * <app-disambiguation
 *   [candidates]="candidates"
 *   [prompt]="'Which lamp do you mean?'"
 *   (selected)="onSelected($event)"
 *   (cancelled)="onCancelled()"
 * />
 * ```
 *
 * Accessibility:
 * - role="dialog" with proper ARIA labels
 * - Keyboard navigation (1-5, Escape)
 * - Focus management
 * - Screen reader announcements
 */
@Component({
  selector: 'app-disambiguation',
  imports: [CommonModule],
  templateUrl: './disambiguation.html',
  styleUrl: './disambiguation.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisambiguationComponent implements AfterViewInit {
  /** List of candidate objects to choose from */
  readonly candidates = input.required<ObjectCandidate[]>();

  /** Prompt text to display (e.g., "Which lamp do you mean?") */
  readonly prompt = input<string>('Which one do you mean?');

  /** Maximum number of candidates to display */
  readonly maxCandidates = input<number>(5);

  /** Emitted when user selects a candidate */
  readonly selected = output<ObjectCandidate>();

  /** Emitted when user cancels the disambiguation */
  readonly cancelled = output<void>();

  /** Reference to the dialog container for focus management */
  @ViewChild('dialogContainer') dialogContainer?: ElementRef<HTMLDivElement>;

  /** Whether the component is currently visible */
  readonly isVisible = signal<boolean>(true);

  ngAfterViewInit(): void {
    // Focus the dialog when it appears
    this.focusDialog();
  }

  /**
   * Focus the dialog container for keyboard accessibility
   */
  private focusDialog(): void {
    setTimeout(() => {
      this.dialogContainer?.nativeElement.focus();
    }, 0);
  }

  /**
   * Get the list of candidates to display (limited by maxCandidates)
   */
  getDisplayCandidates(): ObjectCandidate[] {
    const candidates = this.candidates();
    const max = this.maxCandidates();
    return candidates.slice(0, max);
  }

  /**
   * Handle candidate selection
   * @param candidate The selected candidate
   */
  selectCandidate(candidate: ObjectCandidate): void {
    this.isVisible.set(false);
    this.selected.emit(candidate);
  }

  /**
   * Handle cancel/abort action
   */
  cancel(): void {
    this.isVisible.set(false);
    this.cancelled.emit();
  }

  /**
   * Handle keyboard events for numeric shortcuts and Escape
   */
  onKeyDown(event: KeyboardEvent): void {
    const displayCandidates = this.getDisplayCandidates();

    // Handle numeric keys (1-5)
    if (event.key >= '1' && event.key <= '9') {
      const index = parseInt(event.key, 10) - 1;
      if (index >= 0 && index < displayCandidates.length) {
        event.preventDefault();
        this.selectCandidate(displayCandidates[index]);
      }
    }

    // Handle Escape key for cancel
    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancel();
    }
  }

  /**
   * Get ARIA label for the dialog
   */
  getAriaLabel(): string {
    return `${this.prompt()} - Select from ${this.getDisplayCandidates().length} options`;
  }

  /**
   * Get context description for a candidate
   * @param candidate The candidate to describe
   */
  getContextDescription(candidate: ObjectCandidate): string {
    return candidate.context || 'nearby';
  }

  /**
   * Track by function for ngFor optimization
   */
  trackByIndex(index: number): number {
    return index;
  }
}
