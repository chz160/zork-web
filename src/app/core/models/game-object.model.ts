/**
 * Represents an interactive object in the game world.
 */
export interface GameObject {
  /** Unique identifier for the object */
  id: string;

  /** Display name of the object */
  name: string;

  /** Names that can be used to refer to this object */
  aliases?: string[];

  /** Detailed description when examined */
  description: string;

  /** Whether the object can be picked up */
  portable: boolean;

  /** Whether the object is currently visible to the player */
  visible: boolean;

  /**
   * Whether the object is explicitly hidden (for puzzles/secrets).
   * Hidden items are not shown in room descriptions even if visible=true.
   * This is distinct from invisible (INVISIBLE flag in legacy) which is used
   * for items stolen by thief or moved by game mechanics.
   */
  hidden?: boolean;

  /**
   * Optional list of conditions under which this item is visible.
   * If undefined, item visibility is determined solely by visible flag.
   * If defined, item is visible only if conditions are met.
   * Examples: ['has_lantern', 'after_puzzle_solved', 'daylight']
   */
  visibleFor?: string[];

  /** Current location: room ID or 'inventory' if carried by player */
  location: string;

  /** First description shown when revealing this object (e.g., when opening a container) */
  firstDescription?: string;

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

  /** Maximum number of items this container can hold */
  capacity?: number;

  /** Whether an object can be used as a light source */
  isLight?: boolean;

  /** Whether a light source is currently lit */
  isLit?: boolean;

  /** Whether the object has been touched/interacted with (for first description) */
  touched?: boolean;

  /** Whether the container is transparent */
  transparent?: boolean;

  /** Whether the object should not be listed in room descriptions (NDESCBIT flag) */
  noDescription?: boolean;

  /** Whether the object can be read (READBT flag) */
  isReadable?: boolean;

  /** Text content for readable objects */
  readableText?: string;

  /** Whether the object has been read */
  hasBeenRead?: boolean;

  /** Whether the object is a door (DOORBT flag) */
  isDoor?: boolean;

  /** Whether the object blocks passage (for doors when closed, or actors like troll) */
  blocksPassage?: boolean;

  /** Object ID of key required to unlock */
  requiresKey?: string;

  /** Whether the object is food (FOODBT flag) */
  isFood?: boolean;

  /** Whether the object can be eaten */
  edible?: boolean;

  /** Whether the object is destroyed when consumed */
  consumable?: boolean;

  /** Whether the object is a tool (TOOLBT flag) */
  isTool?: boolean;

  /** Type classification for tools */
  toolType?: 'key' | 'rope' | 'wrench' | 'shovel' | 'pump' | 'other';

  /** Whether the object is a weapon (WEAPONBT/FITEBT flags) */
  isWeapon?: boolean;

  /** Type classification for weapons */
  weaponType?: 'sword' | 'axe' | 'knife' | 'club' | 'other';

  /** Whether the object can burn (BURNBT flag) */
  flammable?: boolean;

  /** Whether the elvish sword is glowing (proximity to enemies) */
  isGlowing?: boolean;

  /** Glow intensity level for elvish sword */
  glowIntensity?: 'none' | 'faint' | 'bright';

  /** Whether the object is an actor/NPC (ACTORBIT flag) */
  isActor?: boolean;

  /** Combat strength for actors (negative = unconscious, 0 = dead) */
  strength?: number;

  /** Maximum strength for actors */
  maxStrength?: number;

  /** Whether actor is currently fighting */
  isFighting?: boolean;

  /** Actor state for complex NPCs like troll */
  actorState?: 'armed' | 'disarmed' | 'unconscious' | 'dead' | 'awake';

  /** Treasure value of the object (TVALUE property) */
  value?: number;

  /** Whether the object is sacred and cannot be stolen or defiled (SACREDBIT flag) */
  isSacred?: boolean;

  /** Whether the object can be drunk (DRINKBIT flag) */
  drinkable?: boolean;

  /** Custom state properties for specific objects */
  [key: string]: unknown;
}
