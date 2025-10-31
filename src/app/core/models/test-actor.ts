import { BaseActor } from './actor.model';

/**
 * A test/dummy actor for demonstrating and testing the actor lifecycle.
 * This serves as a simple example of how to create actors and use the ActorManager.
 *
 * Features demonstrated:
 * - Tick-based behavior (movement, state changes)
 * - Location tracking
 * - Encounter handling
 * - Damage and death events
 * - Flag-based state management
 */
export class TestActor extends BaseActor {
  private moveCounter = 0;
  private readonly moveInterval: number;
  private readonly moveLocations: string[];

  /**
   * Create a test actor that moves between locations on ticks.
   *
   * @param id Unique actor ID
   * @param name Display name
   * @param options Configuration options
   */
  constructor(
    id: string,
    name: string,
    options?: {
      locationId?: string | null;
      inventory?: string[];
      flags?: Map<string, boolean | number | string>;
      tickEnabled?: boolean;
      moveInterval?: number;
      moveLocations?: string[];
    }
  ) {
    super(id, name, options);
    this.moveInterval = options?.moveInterval ?? 3;
    this.moveLocations = options?.moveLocations ?? [];
  }

  /**
   * Called each game tick. Demonstrates simple movement behavior.
   */
  override onTick(): void {
    this.moveCounter++;
    this.flags.set('lastTickCount', this.moveCounter);

    // Move to next location every N ticks
    if (this.moveCounter % this.moveInterval === 0 && this.moveLocations.length > 0) {
      const currentIndex = this.moveLocations.indexOf(this.locationId ?? '');
      const nextIndex = (currentIndex + 1) % this.moveLocations.length;
      this.locationId = this.moveLocations[nextIndex];
      this.flags.set('lastMoveLocation', this.locationId);
    }
  }

  /**
   * Called when player enters the same room as this actor.
   */
  override onEncounter(playerRoomId: string): void {
    this.flags.set('lastEncounterRoom', playerRoomId);
    this.flags.set('encounterCount', (this.flags.get('encounterCount') as number) + 1 || 1);
  }

  /**
   * Called when this actor dies.
   */
  override onDeath(): void {
    this.flags.set('isDead', true);
    this.tickEnabled = false; // Stop ticking when dead
    this.locationId = null; // Remove from game world
  }

  /**
   * Called when this actor takes damage.
   */
  override onDamage(amount: number): void {
    const currentHealth = (this.flags.get('health') as number) || 100;
    const newHealth = Math.max(0, currentHealth - amount);
    this.flags.set('health', newHealth);
    this.flags.set('lastDamageAmount', amount);

    // Die if health reaches 0
    if (newHealth === 0) {
      this.onDeath();
    }
  }

  /**
   * Reset the move counter (useful for testing).
   */
  resetMoveCounter(): void {
    this.moveCounter = 0;
  }

  /**
   * Get the current move counter.
   */
  getMoveCounter(): number {
    return this.moveCounter;
  }
}
