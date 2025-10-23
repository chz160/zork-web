/**
 * Represents a location in the game world.
 */
export interface Room {
  /** Unique identifier for the room */
  id: string;

  /** Display name of the room */
  name: string;

  /** Detailed description shown when entering or looking */
  description: string;

  /** Available exits from this room, mapped by direction */
  exits: Map<Direction, string>;

  /** IDs of game objects currently in this room */
  objectIds: string[];

  /** Whether the room has been visited before */
  visited: boolean;

  /** Optional short description for revisits */
  shortDescription?: string;
}

/**
 * Cardinal and intercardinal directions for navigation.
 */
export type Direction = 'north' | 'south' | 'east' | 'west' | 'up' | 'down';

/**
 * Short aliases for directions.
 */
export type DirectionAlias = 'n' | 's' | 'e' | 'w' | 'u' | 'd';
