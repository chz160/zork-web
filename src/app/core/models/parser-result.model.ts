import { VerbType } from './verb.model';

/**
 * Result of parsing a player's command input.
 */
export interface ParserResult {
  /** The verb/action to perform */
  verb: VerbType | null;

  /** Direct object of the action, if any */
  directObject: string | null;

  /** Indirect object of the action, if any (e.g., "in" for "put X in Y") */
  indirectObject: string | null;

  /** Preposition connecting objects, if any */
  preposition: string | null;

  /** Original raw input from the player */
  rawInput: string;

  /** Whether the parsing was successful */
  isValid: boolean;

  /** Error message if parsing failed */
  errorMessage?: string;
}
