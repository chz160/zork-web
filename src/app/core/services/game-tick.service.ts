import { Injectable, signal, inject, DestroyRef } from '@angular/core';
import { interval, Subject, Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Game tick service that emits periodic ticks for driving NPC behavior.
 * Similar to the interrupt system in the legacy ZIL code.
 *
 * Features:
 * - Configurable tick cadence (default: every turn/command)
 * - Can be paused/resumed
 * - Manual tick trigger for turn-based gameplay
 * - Automatic cleanup on service destroy
 */
@Injectable({
  providedIn: 'root',
})
export class GameTickService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly tickSubject = new Subject<number>();
  private tickCount = signal(0);
  private isRunning = signal(false);
  private autoTickSubscription: Subscription | null = null;

  /** Observable stream of tick events */
  readonly tick$ = this.tickSubject.asObservable();

  /** Current tick count (read-only signal) */
  readonly count = this.tickCount.asReadonly();

  /** Whether auto-ticking is currently active */
  readonly running = this.isRunning.asReadonly();

  /**
   * Manually trigger a tick.
   * This is the primary way to advance the game in turn-based mode.
   */
  tick(): void {
    const newCount = this.tickCount() + 1;
    this.tickCount.set(newCount);
    this.tickSubject.next(newCount);
  }

  /**
   * Start automatic ticking at the specified interval.
   * Useful for testing or real-time mode.
   * @param intervalMs Interval in milliseconds between ticks
   */
  startAutoTick(intervalMs: number): void {
    if (this.isRunning()) {
      return;
    }

    this.isRunning.set(true);
    this.autoTickSubscription = interval(intervalMs)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.isRunning()) {
          this.tick();
        }
      });
  }

  /**
   * Stop automatic ticking.
   */
  stopAutoTick(): void {
    this.isRunning.set(false);
    if (this.autoTickSubscription) {
      this.autoTickSubscription.unsubscribe();
      this.autoTickSubscription = null;
    }
  }

  /**
   * Reset the tick counter to zero.
   */
  reset(): void {
    this.tickCount.set(0);
  }

  /**
   * Get the current tick count.
   */
  getCount(): number {
    return this.tickCount();
  }
}
