/**
 * Represents an interactive object in the game world.
 */
export interface GameObject {
  /** Unique identifier for the object */
  id: string;

  /** Display name of the object */
  name: string;

  /** Names that can be used to refer to this object */
  aliases: string[];

  /** Detailed description when examined */
  description: string;

  /** Whether the object can be picked up */
  portable: boolean;

  /** Whether the object is currently visible to the player */
  visible: boolean;

  /** Current location: room ID or 'inventory' if carried by player */
  location: string;

  /** Additional properties for stateful objects */
  properties?: GameObjectProperties;
}

/**
 * Additional properties for objects that have state.
 */
export interface GameObjectProperties {
  /** Whether a container is open */
  isOpen?: boolean;

  /** Whether an object is locked */
  isLocked?: boolean;

  /** IDs of objects contained within (for containers) */
  contains?: string[];

  /** Whether an object can be used as a light source */
  isLight?: boolean;

  /** Whether a light source is currently lit */
  isLit?: boolean;

  /** Custom state properties for specific objects */
  [key: string]: unknown;
}
