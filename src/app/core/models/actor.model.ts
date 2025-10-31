/**
 * Represents an NPC actor in the game that can perform actions on ticks.
 * Inspired by the legacy I-THIEF interrupt system from ZIL.
 */
export interface Actor {
  /** Unique identifier for this actor */
  id: string;

  /** Display name of the actor */
  name: string;

  /** Current room ID where the actor is located */
  locationId: string | null;

  /** IDs of objects in the actor's inventory */
  inventory: string[];

  /** Custom flags for tracking actor state */
  flags: Map<string, boolean | number | string>;

  /** Whether this actor should receive tick events */
  tickEnabled: boolean;

  /**
   * Called each game tick when tickEnabled is true.
   * This is the main hook for NPC behavior (movement, combat, stealing, etc.)
   */
  onTick(): void;

  /**
   * Called when the player enters the same room as this actor.
   * @param playerRoomId The room ID where the encounter occurred
   */
  onEncounter(playerRoomId: string): void;

  /**
   * Called when this actor is killed/dies.
   */
  onDeath(): void;

  /**
   * Called when this actor takes damage.
   * @param amount Amount of damage taken
   */
  onDamage(amount: number): void;
}

/**
 * Base implementation of Actor interface with no-op methods.
 * Extend this class to create concrete actors.
 */
export class BaseActor implements Actor {
  id: string;
  name: string;
  locationId: string | null;
  inventory: string[];
  flags: Map<string, boolean | number | string>;
  tickEnabled: boolean;

  constructor(
    id: string,
    name: string,
    options?: {
      locationId?: string | null;
      inventory?: string[];
      flags?: Map<string, boolean | number | string>;
      tickEnabled?: boolean;
    }
  ) {
    this.id = id;
    this.name = name;
    this.locationId = options?.locationId ?? null;
    this.inventory = options?.inventory ?? [];
    this.flags = options?.flags ?? new Map();
    this.tickEnabled = options?.tickEnabled ?? false;
  }

  onTick(): void {
    // Default no-op implementation
  }

  onEncounter(_playerRoomId: string): void {
    // Default no-op implementation
  }

  onDeath(): void {
    // Default no-op implementation
  }

  onDamage(_amount: number): void {
    // Default no-op implementation
  }
}
