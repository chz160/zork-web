/**
 * Strategy for troll conversation and message templates.
 * Provides templated responses matching characterization test expectations.
 *
 * Responsibilities:
 * - Provide message templates for troll responses
 * - Support message key lookup with replacements
 * - Match messages from characterization tests
 */
export class TrollConversationStrategy {
  /**
   * Message templates for troll responses.
   * Keys match those used by TrollBehaviorStrategy.
   */
  private readonly messages: Record<string, string[]> = {
    // Passage blocking
    TROLL_BLOCKS_PASSAGE: [
      'The troll fends you off with a menacing gesture.',
      'The troll refuses to let you pass.',
    ],

    // Unconscious state
    TROLL_UNCONSCIOUS: ['The troll is unconscious and cannot respond.'],

    TROLL_ALREADY_UNCONSCIOUS: ['The troll is already unconscious.'],

    // Bribe responses
    TROLL_ACCEPTS_BRIBE: [
      'The troll, in a rare moment of generosity (and greed), reluctantly lets you pass.',
      'The troll accepts your offer and stands aside.',
    ],

    TROLL_REJECTS_BRIBE: [
      'The troll spits on your measly offer.',
      'The troll is not impressed by such a small bribe.',
    ],

    TROLL_ASKS_FOR_TOLL: [
      'The troll demands payment for passage.',
      'The troll blocks your way and grunts for payment.',
    ],

    // Food responses
    TROLL_EATS_FOOD: [
      'The troll, satiated, steps aside.',
      'The troll eagerly devours the {item} and allows you to pass.',
    ],

    TROLL_REFUSES_ITEM: [
      'The troll has no interest in your offering.',
      'The troll looks at you with disdain.',
    ],

    // Combat responses
    TROLL_HIT: ['The troll reels from your attack.', 'The troll staggers from the blow.'],

    TROLL_KNOCKED_UNCONSCIOUS: [
      'The troll collapses to the floor, unconscious.',
      'The mighty troll falls in a heap.',
    ],

    TROLL_COUNTERATTACK: [
      'The troll swings his bloody axe, and it crashes against your shield.',
      "The troll's axe barely misses your head.",
      'The troll attacks with his axe, wounding you.',
    ],

    TROLL_ATTACK_MISS: ['The troll swings wildly and misses.'],

    // Room description additions
    TROLL_DESCRIPTION_ARMED: [
      'A nasty-looking troll, brandishing a bloody axe, blocks all passages out of the room.',
    ],

    TROLL_DESCRIPTION_UNCONSCIOUS: [
      'An unconscious troll is sprawled on the floor. All passages out of the room are open.',
    ],
  };

  /**
   * Get a message for the given key.
   * Returns the first message in the array (deterministic).
   * If replacements are provided, tries to find a template that uses them.
   *
   * @param messageKey The message key
   * @param replacements Optional template variable replacements
   * @returns The message string, or undefined if key not found
   */
  getMessage(messageKey: string, replacements?: Record<string, string>): string | undefined {
    const templates = this.messages[messageKey];
    if (!templates || templates.length === 0) {
      return undefined;
    }

    let message = templates[0];

    // If replacements are provided, try to find a template that uses them
    if (replacements) {
      const keys = Object.keys(replacements);
      for (const template of templates) {
        // Check if this template contains any of the replacement keys
        const hasPlaceholder = keys.some((key) => template.includes(`{${key}}`));
        if (hasPlaceholder) {
          message = template;
          break;
        }
      }

      // Apply replacements
      Object.entries(replacements).forEach(([key, value]) => {
        message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
      });
    }

    return message;
  }

  /**
   * Get a random message for the given key.
   * Useful for combat variation.
   *
   * @param messageKey The message key
   * @param randomIndex Random index (0 to templates.length - 1)
   * @param replacements Optional template variable replacements
   * @returns The message string, or undefined if key not found
   */
  getRandomMessage(
    messageKey: string,
    randomIndex: number,
    replacements?: Record<string, string>
  ): string | undefined {
    const templates = this.messages[messageKey];
    if (!templates || templates.length === 0) {
      return undefined;
    }

    const index = Math.floor(randomIndex) % templates.length;
    let message = templates[index];

    // Apply replacements if provided
    if (replacements) {
      Object.entries(replacements).forEach(([key, value]) => {
        message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
      });
    }

    return message;
  }

  /**
   * Get all message templates for a key (for testing).
   *
   * @param messageKey The message key
   * @returns Array of message templates
   */
  getMessageTemplates(messageKey: string): string[] {
    return this.messages[messageKey] || [];
  }

  /**
   * Check if a message key exists.
   *
   * @param messageKey The message key to check
   * @returns True if the key exists
   */
  hasMessage(messageKey: string): boolean {
    return messageKey in this.messages && this.messages[messageKey].length > 0;
  }
}
