import { Injectable } from '@angular/core';
import { ParserResult, Verb, VerbType } from '../models';

/**
 * Command parser service that tokenizes and parses user input into actionable commands.
 *
 * Supports verb-noun-prep-noun grammar patterns such as:
 * - Simple verbs: "look", "inventory"
 * - Verb + direct object: "take lamp", "examine mailbox"
 * - Verb + object + preposition + object: "put lamp in mailbox", "unlock door with key"
 *
 * Features:
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
  /** Common prepositions used in Zork commands */
  private readonly prepositions = new Set([
    'with',
    'using',
    'in',
    'into',
    'on',
    'onto',
    'under',
    'behind',
    'through',
    'from',
    'to',
    'at',
  ]);

  /** Articles and noise words to filter out */
  private readonly noiseWords = new Set(['a', 'an', 'the', 'my', 'at', 'to', 'some']);

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

    // Handle direction commands specially
    if (this.directions.has(tokens[0].toLowerCase())) {
      return this.parseDirectionCommand(tokens, rawInput);
    }

    // Extract verb
    const verbResult = this.findVerb(tokens[0]);
    if (!verbResult) {
      return this.createErrorResult(rawInput, `I don't understand the word "${tokens[0]}".`);
    }

    const { verb, verbName } = verbResult;

    // Parse the rest of the command based on verb requirements
    return this.parseCommandTokens(tokens.slice(1), verb, verbName, rawInput);
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
    };
  }

  /**
   * Parse command tokens to extract objects and prepositions.
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
    // If verb requires object but none provided
    if (verb.requiresObject && tokens.length === 0) {
      return this.createErrorResult(rawInput, `What do you want to ${verbName}?`);
    }

    // If verb doesn't require object and none provided (e.g., "look", "inventory")
    if (!verb.requiresObject && tokens.length === 0) {
      return {
        verb: verbName,
        directObject: null,
        indirectObject: null,
        preposition: null,
        rawInput,
        isValid: true,
      };
    }

    // Find preposition position if any
    let prepIndex = -1;
    let preposition: string | null = null;

    for (let i = 0; i < tokens.length; i++) {
      if (this.prepositions.has(tokens[i])) {
        prepIndex = i;
        preposition = tokens[i];
        break;
      }
    }

    // Parse based on whether we found a preposition
    if (prepIndex === -1) {
      // Simple verb + object command
      const directObject = tokens.join(' ');
      return {
        verb: verbName,
        directObject,
        indirectObject: null,
        preposition: null,
        rawInput,
        isValid: true,
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
      const directObject = prepIndex > 0 ? tokens.slice(0, prepIndex).join(' ') : null;
      const indirectObject =
        prepIndex < tokens.length - 1 ? tokens.slice(prepIndex + 1).join(' ') : null;

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
      };
    }
  }

  /**
   * Create an error result for invalid commands.
   * @param rawInput The original input
   * @param errorMessage The error message to display
   * @returns A ParserResult marked as invalid
   */
  private createErrorResult(rawInput: string, errorMessage: string): ParserResult {
    return {
      verb: null,
      directObject: null,
      indirectObject: null,
      preposition: null,
      rawInput,
      isValid: false,
      errorMessage,
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
