/**
 * Represents an action the player can perform.
 */
export interface Verb {
  /** Primary verb name */
  name: string;

  /** Synonyms for this verb */
  aliases: string[];

  /** Whether the verb requires a direct object */
  requiresObject: boolean;

  /** Whether the verb can take an indirect object (e.g., "put X in Y") */
  allowsIndirectObject: boolean;

  /** Optional description/help text */
  description?: string;
}

/**
 * Standard verb types in the game.
 */
export type VerbType =
  // Navigation
  | 'go'
  | 'enter'
  | 'look'
  | 'examine'
  // Inventory management
  | 'take'
  | 'drop'
  | 'inventory'
  // Object interaction
  | 'open'
  | 'close'
  | 'unlock'
  | 'lock'
  | 'light'
  | 'extinguish'
  | 'read'
  | 'attack'
  | 'use'
  | 'put'
  | 'push'
  // System
  | 'help'
  | 'status'
  | 'map'
  | 'location'
  | 'save'
  | 'load'
  | 'quit'
  | 'debug';
