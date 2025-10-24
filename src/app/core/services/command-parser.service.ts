import { Injectable } from '@angular/core';
import { ParserResult, Verb, VerbType } from '../models';
import synonymsData from '../../data/synonyms.json';

/**
 * Configuration for phrasal verbs loaded from synonyms.json
 */
interface PhrasalVerbConfig {
  intent: string;
  preposition?: string;
}

/**
 * Synonyms configuration loaded from data file
 */
interface SynonymsConfig {
  verbs: Record<string, string[]>;
  phrasalVerbs: Record<string, PhrasalVerbConfig>;
  pronouns: string[];
  determiners: string[];
  prepositions: string[];
  objectAliases: Record<string, string[]>;
}

/**
 * Enhanced conversational command parser service that tokenizes and parses user input
 * into actionable commands with support for natural language patterns.
 *
 * Supports verb-noun-prep-noun grammar patterns such as:
 * - Simple verbs: "look", "inventory"
 * - Verb + direct object: "take lamp", "examine mailbox"
 * - Verb + object + preposition + object: "put lamp in mailbox", "unlock door with key"
 * - Phrasal verbs: "look in mailbox", "pick up lamp", "open up door"
 * - Pronouns: "look at it", "take them"
 * - Conversational patterns: "look inside the mailbox", "pick up the leaflet"
 *
 * Features:
 * - Data-driven synonym support from JSON configuration
 * - Phrasal verb recognition ("look in", "pick up", etc.)
 * - Pronoun resolution with context tracking
 * - Fuzzy object matching with suggestions
 * - Friendly error messages with helpful hints
 * - Tokenization of raw input
 * - Verb and object recognition with alias support
 * - Preposition handling for complex commands
 * - Error handling for invalid syntax
 * - Ambiguous command resolution
 */
@Injectable({
  providedIn: 'root',
})
export class CommandParserService {
  /** Loaded synonyms configuration */
  private readonly synonyms: SynonymsConfig = synonymsData;

  /** Last referenced object for pronoun resolution */
  private lastReferencedObject: string | null = null;

  /** Common prepositions used in Zork commands - loaded from config */
  private get prepositions(): Set<string> {
    return new Set(this.synonyms.prepositions);
  }

  /** Articles and noise words to filter out - loaded from config */
  private get noiseWords(): Set<string> {
    return new Set(this.synonyms.determiners);
  }

  /** Pronouns for context resolution - loaded from config */
  private get pronouns(): Set<string> {
    return new Set(this.synonyms.pronouns);
  }

  /** Map of verbs with their configurations */
  private readonly verbs = new Map<string, Verb>([
    // Navigation
    [
      'go',
      {
        name: 'go',
        aliases: ['walk', 'move', 'travel', 'head'],
        requiresObject: true,
        allowsIndirectObject: false,
        description: 'Move in a direction or to a location',
      },
    ],
    [
      'look',
      {
        name: 'look',
        aliases: ['l'],
        requiresObject: false,
        allowsIndirectObject: false,
        description: 'Look around or examine something',
      },
    ],
    [
      'examine',
      {
        name: 'examine',
        aliases: ['x', 'inspect', 'check'],
        requiresObject: true,
        allowsIndirectObject: false,
        description: 'Examine something closely',
      },
    ],
    // Inventory management
    [
      'take',
      {
        name: 'take',
        aliases: ['get', 'grab', 'pick'],
        requiresObject: true,
        allowsIndirectObject: false,
        description: 'Pick up an object',
      },
    ],
    [
      'drop',
      {
        name: 'drop',
        aliases: ['discard', 'throw'],
        requiresObject: true,
        allowsIndirectObject: false,
        description: 'Drop an object',
      },
    ],
    [
      'inventory',
      {
        name: 'inventory',
        aliases: ['i', 'inv'],
        requiresObject: false,
        allowsIndirectObject: false,
        description: 'Check your inventory',
      },
    ],
    // Object interaction
    [
      'open',
      {
        name: 'open',
        aliases: [],
        requiresObject: true,
        allowsIndirectObject: false,
        description: 'Open something',
      },
    ],
    [
      'close',
      {
        name: 'close',
        aliases: ['shut'],
        requiresObject: true,
        allowsIndirectObject: false,
        description: 'Close something',
      },
    ],
    [
      'unlock',
      {
        name: 'unlock',
        aliases: [],
        requiresObject: true,
        allowsIndirectObject: true,
        description: 'Unlock something',
      },
    ],
    [
      'lock',
      {
        name: 'lock',
        aliases: [],
        requiresObject: true,
        allowsIndirectObject: true,
        description: 'Lock something',
      },
    ],
    [
      'light',
      {
        name: 'light',
        aliases: ['ignite', 'turn on'],
        requiresObject: true,
        allowsIndirectObject: false,
        description: 'Light something',
      },
    ],
    [
      'extinguish',
      {
        name: 'extinguish',
        aliases: ['turn off', 'douse'],
        requiresObject: true,
        allowsIndirectObject: false,
        description: 'Extinguish a light source',
      },
    ],
    [
      'read',
      {
        name: 'read',
        aliases: [],
        requiresObject: true,
        allowsIndirectObject: false,
        description: 'Read something',
      },
    ],
    [
      'attack',
      {
        name: 'attack',
        aliases: ['kill', 'fight', 'hit', 'strike'],
        requiresObject: true,
        allowsIndirectObject: true,
        description: 'Attack something',
      },
    ],
    [
      'use',
      {
        name: 'use',
        aliases: [],
        requiresObject: true,
        allowsIndirectObject: false,
        description: 'Use an object',
      },
    ],
    [
      'put',
      {
        name: 'put',
        aliases: ['place', 'insert'],
        requiresObject: true,
        allowsIndirectObject: true,
        description: 'Put something somewhere',
      },
    ],
    // System commands
    [
      'help',
      {
        name: 'help',
        aliases: ['?'],
        requiresObject: false,
        allowsIndirectObject: false,
        description: 'Show help information',
      },
    ],
    [
      'save',
      {
        name: 'save',
        aliases: [],
        requiresObject: false,
        allowsIndirectObject: false,
        description: 'Save the game',
      },
    ],
    [
      'load',
      {
        name: 'load',
        aliases: ['restore'],
        requiresObject: false,
        allowsIndirectObject: false,
        description: 'Load a saved game',
      },
    ],
    [
      'quit',
      {
        name: 'quit',
        aliases: ['exit', 'q'],
        requiresObject: false,
        allowsIndirectObject: false,
        description: 'Quit the game',
      },
    ],
  ]);

  /** Direction keywords that are handled specially */
  private readonly directions = new Set([
    'north',
    'south',
    'east',
    'west',
    'up',
    'down',
    'n',
    's',
    'e',
    'w',
    'u',
    'd',
    'northeast',
    'northwest',
    'southeast',
    'southwest',
    'ne',
    'nw',
    'se',
    'sw',
  ]);

  /**
   * Parse a raw input string into a structured command.
   * Enhanced with phrasal verb support, pronoun resolution, and better error messages.
   * @param rawInput The raw user input string
   * @returns A ParserResult containing the parsed command or error
   */
  parse(rawInput: string): ParserResult {
    // Basic validation
    if (!rawInput || rawInput.trim().length === 0) {
      return this.createErrorResult(rawInput, 'Please enter a command.');
    }

    // Tokenize the input
    const tokens = this.tokenize(rawInput);

    if (tokens.length === 0) {
      return this.createErrorResult(rawInput, 'Please enter a command.');
    }

    // Handle pronoun-only input (e.g., "it", "them")
    if (tokens.length === 1 && this.pronouns.has(tokens[0].toLowerCase())) {
      if (this.lastReferencedObject) {
        return {
          verb: 'examine',
          directObject: this.lastReferencedObject,
          indirectObject: null,
          preposition: null,
          rawInput,
          isValid: true,
          tokens,
        };
      } else {
        return this.createErrorResult(
          rawInput,
          "I'm not sure what you're referring to. Try being more specific."
        );
      }
    }

    // Handle direction commands specially
    if (this.directions.has(tokens[0].toLowerCase())) {
      return this.parseDirectionCommand(tokens, rawInput);
    }

    // Try to match phrasal verbs first (e.g., "look in", "pick up")
    const phrasalMatch = this.matchPhrasalVerb(tokens);
    if (phrasalMatch) {
      const { intent, preposition, restTokens } = phrasalMatch;
      const verbResult = this.findVerb(intent);

      if (verbResult) {
        // If phrasal verb has a preposition and the verb allows indirect objects,
        // prepend it to restTokens so parseCommandTokens can validate indirect object requirements
        let tokensToProcess = restTokens;
        if (preposition && verbResult.verb.allowsIndirectObject) {
          tokensToProcess = [preposition, ...restTokens];
        }

        // Parse the rest of the command with the resolved verb
        const result = this.parseCommandTokens(
          tokensToProcess,
          verbResult.verb,
          verbResult.verbName,
          rawInput
        );

        // Add phrasal verb's preposition if not set by parseCommandTokens
        if (preposition && !result.preposition) {
          result.preposition = preposition;
        }

        result.tokens = tokens;
        return result;
      }
    }

    // Extract verb (fallback to single-word verb)
    const verbResult = this.findVerb(tokens[0]);
    if (!verbResult) {
      return this.createErrorResult(rawInput, `I don't understand the word "${tokens[0]}".`);
    }

    const { verb, verbName } = verbResult;

    // Parse the rest of the command based on verb requirements
    const result = this.parseCommandTokens(tokens.slice(1), verb, verbName, rawInput);
    result.tokens = tokens; // Set full tokens array
    return result;
  }

  /**
   * Tokenize raw input into words, filtering out noise words.
   * @param input Raw input string
   * @returns Array of meaningful tokens
   */
  private tokenize(input: string): string[] {
    // Normalize input: lowercase, trim, collapse whitespace
    const normalized = input.trim().toLowerCase().replace(/\s+/g, ' ');

    // Split on whitespace
    const words = normalized.split(' ');

    // Filter out empty strings and noise words (but keep prepositions)
    return words.filter((word) => {
      if (!word) return false;
      // Keep prepositions even though some might be in noise words
      if (this.prepositions.has(word)) return true;
      // Filter out noise words
      return !this.noiseWords.has(word);
    });
  }

  /**
   * Find a verb by name or alias.
   * @param token The token to match against verbs
   * @returns The matched verb and its canonical name, or null if not found
   */
  private findVerb(token: string): { verb: Verb; verbName: VerbType } | null {
    const lowerToken = token.toLowerCase();

    // Check for exact verb match
    const exactMatch = this.verbs.get(lowerToken);
    if (exactMatch) {
      return { verb: exactMatch, verbName: lowerToken as VerbType };
    }

    // Check aliases
    for (const [verbName, verb] of this.verbs.entries()) {
      if (verb.aliases.includes(lowerToken)) {
        return { verb, verbName: verbName as VerbType };
      }
    }

    return null;
  }

  /**
   * Match phrasal verbs from the beginning of token array.
   * Tries to match 2-3 word phrasal verbs from synonyms config.
   * @param tokens The token array
   * @returns Matched phrasal verb config with remaining tokens, or null
   */
  private matchPhrasalVerb(
    tokens: string[]
  ): { intent: string; preposition?: string; restTokens: string[] } | null {
    // Try matching 3-word phrasal verbs first, then 2-word
    for (let len = Math.min(3, tokens.length); len >= 2; len--) {
      const phrase = tokens.slice(0, len).join(' ').toLowerCase();
      const config = this.synonyms.phrasalVerbs[phrase];

      if (config) {
        return {
          intent: config.intent,
          preposition: config.preposition,
          restTokens: tokens.slice(len),
        };
      }
    }

    return null;
  }

  /**
   * Set the last referenced object for pronoun resolution.
   * Called by the game engine when an object is mentioned.
   * @param objectName The object name to remember
   */
  setLastReferencedObject(objectName: string | null): void {
    this.lastReferencedObject = objectName;
  }

  /**
   * Get the last referenced object.
   * @returns The last referenced object name, or null
   */
  getLastReferencedObject(): string | null {
    return this.lastReferencedObject;
  }

  /**
   * Parse a direction command (e.g., "north", "n").
   * @param tokens The command tokens
   * @param rawInput The original input
   * @returns A ParserResult with 'go' verb and direction as direct object
   */
  private parseDirectionCommand(tokens: string[], rawInput: string): ParserResult {
    const direction = tokens[0].toLowerCase();

    return {
      verb: 'go',
      directObject: direction,
      indirectObject: null,
      preposition: null,
      rawInput,
      isValid: true,
      tokens,
    };
  }

  /**
   * Parse command tokens to extract objects and prepositions.
   * Enhanced with pronoun resolution support.
   * @param tokens Tokens after the verb
   * @param verb The verb configuration
   * @param verbName The canonical verb name
   * @param rawInput The original input
   * @returns A ParserResult with parsed command structure
   */
  private parseCommandTokens(
    tokens: string[],
    verb: Verb,
    verbName: VerbType,
    rawInput: string
  ): ParserResult {
    // Replace pronouns in tokens if we have a last referenced object
    const resolvedTokens = this.resolvePronounsInTokens(tokens);

    // If verb requires object but none provided
    if (verb.requiresObject && resolvedTokens.length === 0) {
      return this.createErrorResult(rawInput, `What do you want to ${verbName}?`);
    }

    // If verb doesn't require object and none provided (e.g., "look", "inventory")
    if (!verb.requiresObject && resolvedTokens.length === 0) {
      return {
        verb: verbName,
        directObject: null,
        indirectObject: null,
        preposition: null,
        rawInput,
        isValid: true,
        tokens,
      };
    }

    // Find preposition position if any
    let prepIndex = -1;
    let preposition: string | null = null;

    for (let i = 0; i < resolvedTokens.length; i++) {
      if (this.prepositions.has(resolvedTokens[i])) {
        prepIndex = i;
        preposition = resolvedTokens[i];
        break;
      }
    }

    // Parse based on whether we found a preposition
    if (prepIndex === -1) {
      // Simple verb + object command
      const directObject = resolvedTokens.join(' ');
      return {
        verb: verbName,
        directObject,
        indirectObject: null,
        preposition: null,
        rawInput,
        isValid: true,
        tokens,
      };
    } else {
      // Complex command with preposition
      if (!verb.allowsIndirectObject) {
        return this.createErrorResult(
          rawInput,
          `The command "${verbName}" doesn't take a preposition.`
        );
      }

      // Extract direct and indirect objects
      const directObject = prepIndex > 0 ? resolvedTokens.slice(0, prepIndex).join(' ') : null;
      const indirectObject =
        prepIndex < resolvedTokens.length - 1
          ? resolvedTokens.slice(prepIndex + 1).join(' ')
          : null;

      // Validate we have both objects
      if (!directObject) {
        return this.createErrorResult(rawInput, `What do you want to ${verbName}?`);
      }

      if (!indirectObject) {
        return this.createErrorResult(
          rawInput,
          `${verbName.charAt(0).toUpperCase() + verbName.slice(1)} it ${preposition} what?`
        );
      }

      return {
        verb: verbName,
        directObject,
        indirectObject,
        preposition,
        rawInput,
        isValid: true,
        tokens,
      };
    }
  }

  /**
   * Resolve pronouns in tokens by replacing them with the last referenced object.
   * @param tokens The tokens to process
   * @returns Tokens with pronouns replaced
   */
  private resolvePronounsInTokens(tokens: string[]): string[] {
    if (!this.lastReferencedObject) {
      return tokens;
    }

    return tokens.map((token) => {
      if (this.pronouns.has(token.toLowerCase())) {
        return this.lastReferencedObject as string;
      }
      return token;
    });
  }

  /**
   * Create an error result for invalid commands.
   * Enhanced with support for suggestions.
   * @param rawInput The original input
   * @param errorMessage The error message to display
   * @param suggestions Optional suggestions for the player
   * @returns A ParserResult marked as invalid
   */
  private createErrorResult(
    rawInput: string,
    errorMessage: string,
    suggestions?: string[]
  ): ParserResult {
    const tokens = this.tokenize(rawInput);
    return {
      verb: null,
      directObject: null,
      indirectObject: null,
      preposition: null,
      rawInput,
      isValid: false,
      errorMessage,
      suggestions,
      tokens,
    };
  }

  /**
   * Get all available verbs with their descriptions.
   * Useful for implementing the help command.
   * @returns Array of verb configurations
   */
  getAvailableVerbs(): Verb[] {
    return Array.from(this.verbs.values());
  }

  /**
   * Check if a word is a recognized verb.
   * @param word The word to check
   * @returns True if the word is a verb or verb alias
   */
  isVerb(word: string): boolean {
    return this.findVerb(word) !== null;
  }

  /**
   * Check if a word is a recognized direction.
   * @param word The word to check
   * @returns True if the word is a direction
   */
  isDirection(word: string): boolean {
    return this.directions.has(word.toLowerCase());
  }
}
