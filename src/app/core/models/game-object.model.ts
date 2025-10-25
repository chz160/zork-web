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

  /** Whether the object can be read (READBT flag) */
  isReadable?: boolean;

  /** Text content for readable objects */
  readText?: string;

  /** Whether the object has been read */
  hasBeenRead?: boolean;

  /** Whether the object is a door (DOORBT flag) */
  isDoor?: boolean;

  /** Whether the door blocks passage when closed */
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

  /** Custom state properties for specific objects */
  [key: string]: unknown;
}
