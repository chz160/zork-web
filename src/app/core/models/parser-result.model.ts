import { VerbType } from './verb.model';

/**
 * A candidate object for disambiguation
 */
export interface ObjectCandidate {
  /** The object identifier */
  id: string;

  /** Display name for the object */
  displayName: string;

  /** Similarity score (0-1) */
  score: number;

  /** Additional context for disambiguation */
  context?: string;
}

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

  /** Suggested object names when ambiguous or not found */
  suggestions?: string[];

  /** Tokenized input for debugging */
  tokens?: string[];

  /** Candidate objects for disambiguation (when multiple matches found) */
  candidates?: ObjectCandidate[];

  /** Whether disambiguation is required */
  needsDisambiguation?: boolean;

  /** Autocorrect suggestion with high confidence */
  autoCorrectSuggestion?: string;

  /** Original score of fuzzy match (for telemetry) */
  fuzzyMatchScore?: number;
}
