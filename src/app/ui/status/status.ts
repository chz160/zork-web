import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameEngineService } from '../../core/services/game-engine.service';

/**
 * StatusComponent displays the player's current score, move count, and status effects.
 *
 * Features:
 * - Displays real-time score and move count
 * - Shows status effects and player info
 * - Updates automatically with engine events via signals
 * - Responsive and accessible design
 * - Classic Zork terminal aesthetic
 *
 * Usage:
 * ```html
 * <app-status />
 * ```
 *
 * Accessibility:
 * - role="region" with proper ARIA labels
 * - Live region announcements for score changes
 * - High contrast support
 * - Screen reader friendly
 */
@Component({
  selector: 'app-status',
  imports: [CommonModule],
  templateUrl: './status.html',
  styleUrl: './status.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusComponent {
  private readonly gameEngine = inject(GameEngineService);

  /** Player state from game engine */
  private readonly player = this.gameEngine.player;

  /** Current room from game engine */
  private readonly currentRoom = this.gameEngine.currentRoom;

  /** Computed score for display */
  readonly score = computed(() => this.player().score);

  /** Computed move count for display */
  readonly moveCount = computed(() => this.player().moveCount);

  /** Computed alive status */
  readonly isAlive = computed(() => this.player().isAlive);

  /** Computed current location name */
  readonly locationName = computed(() => {
    const room = this.currentRoom();
    return room?.name || 'Unknown';
  });

  /** Computed inventory count */
  readonly inventoryCount = computed(() => this.player().inventory.length);

  /** Computed status effects from player flags */
  readonly statusEffects = computed(() => {
    const flags = this.player().flags;
    const effects: string[] = [];

    // Check common status flags
    if (flags.get('inDark')) {
      effects.push('In darkness');
    }
    if (flags.get('hasLight')) {
      effects.push('Has light');
    }
    if (flags.get('injured')) {
      effects.push('Injured');
    }
    if (flags.get('blessed')) {
      effects.push('Blessed');
    }
    if (flags.get('cursed')) {
      effects.push('Cursed');
    }

    return effects;
  });

  /**
   * Get ARIA label for status panel
   */
  getAriaLabel(): string {
    return `Game status - Score: ${this.score()}, Moves: ${this.moveCount()}`;
  }

  /**
   * Get status text for screen readers
   */
  getStatusText(): string {
    const parts: string[] = [
      `Score: ${this.score()}`,
      `Moves: ${this.moveCount()}`,
      `Location: ${this.locationName()}`,
    ];

    const effects = this.statusEffects();
    if (effects.length > 0) {
      parts.push(`Status: ${effects.join(', ')}`);
    }

    return parts.join(', ');
  }
}
