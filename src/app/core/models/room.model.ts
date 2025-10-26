/**
 * Condition for a conditional exit.
 */
export interface ExitCondition {
  /** Type of condition to check */
  type: 'objectOpen' | 'objectClosed' | 'hasObject' | 'flag';

  /** ID of the object to check (for objectOpen/objectClosed/hasObject) */
  objectId?: string;

  /** Flag name to check (for flag type) */
  flag?: string;

  /** Error message to show when condition is not met */
  failureMessage?: string;
}

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

  /** Additional properties for specialized rooms */
  properties?: RoomProperties;

  /** Conditional exits that require certain conditions to be met */
  conditionalExits?: Map<Direction, ExitCondition>;
}

/**
 * Additional properties for rooms with special characteristics.
 */
export interface RoomProperties {
  /** Terrain type of the room (RLAND/RWATER/RAIR flags) */
  terrain?: 'land' | 'water' | 'air';

  /** Water depth for water terrain rooms */
  waterDepth?: 'shallow' | 'deep';

  /** Whether the location has breathable air */
  breathable?: boolean;

  /** Whether this is a sacred location (RSACRD flag) */
  isSacred?: boolean;

  /** Type of sacred location */
  sacredType?: 'temple' | 'shrine' | 'altar' | 'tomb';

  /** Whether this room is part of endgame content (REND flag) */
  isEndgame?: boolean;

  /** Section grouping for endgame content */
  endgameSection?: string;

  /** Whether falling is possible from this location */
  fallRisk?: boolean;

  /** Whether flight is required to access this location */
  requiresFlight?: boolean;
}

/**
 * Cardinal and intercardinal directions for navigation.
 */
export type Direction = 'north' | 'south' | 'east' | 'west' | 'up' | 'down';

/**
 * Short aliases for directions.
 */
export type DirectionAlias = 'n' | 's' | 'e' | 'w' | 'u' | 'd';
