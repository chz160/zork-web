import { Injectable } from '@angular/core';
import { RandomService } from './random.service';

/**
 * Message table interface for structured game messages.
 */
export interface MessageTable {
  description?: string;
  tables: Record<string, string[]>;
}

/**
 * Service for managing and retrieving game messages with deterministic randomness.
 * Provides access to message tables (like THIEF-MELEE from legacy) with seeded random selection.
 */
@Injectable({
  providedIn: 'root',
})
export class MessageService {
  private messageTables = new Map<string, MessageTable>();

  constructor(private randomService: RandomService) {}

  /**
   * Register a message table from JSON data.
   * @param name Identifier for the message table (e.g., 'thief')
   * @param table The message table data
   */
  registerTable(name: string, table: MessageTable): void {
    this.messageTables.set(name, table);
  }

  /**
   * Get a random message from the specified table and category.
   * Uses the RandomService for deterministic selection in tests.
   *
   * @param tableName The message table name (e.g., 'thief')
   * @param category The message category within the table (e.g., 'THIEF_MELEE_MISS')
   * @param replacements Optional object for template variable replacement (e.g., {weapon: 'sword'})
   * @returns A random message from the category, or undefined if not found
   */
  getRandomMessage(
    tableName: string,
    category: string,
    replacements?: Record<string, string>
  ): string | undefined {
    const table = this.messageTables.get(tableName);
    if (!table) {
      return undefined;
    }

    const messages = table.tables[category];
    if (!messages || messages.length === 0) {
      return undefined;
    }

    // Use RandomService to select a message deterministically
    const message = this.randomService.choice(messages);

    // Apply replacements if provided
    if (message && replacements) {
      return this.applyReplacements(message, replacements);
    }

    return message;
  }

  /**
   * Get all messages from a specific category.
   * @param tableName The message table name
   * @param category The message category within the table
   * @returns Array of all messages in the category, or undefined if not found
   */
  getAllMessages(tableName: string, category: string): string[] | undefined {
    const table = this.messageTables.get(tableName);
    if (!table) {
      return undefined;
    }

    return table.tables[category];
  }

  /**
   * Check if a message table exists.
   * @param tableName The message table name
   * @returns True if the table is registered
   */
  hasTable(tableName: string): boolean {
    return this.messageTables.has(tableName);
  }

  /**
   * Check if a category exists in a table.
   * @param tableName The message table name
   * @param category The message category within the table
   * @returns True if the category exists
   */
  hasCategory(tableName: string, category: string): boolean {
    const table = this.messageTables.get(tableName);
    return table ? category in table.tables : false;
  }

  /**
   * Apply template variable replacements to a message.
   * Replaces {varname} with the corresponding value from replacements.
   *
   * @param message The message template
   * @param replacements Key-value pairs for replacement
   * @returns The message with replacements applied
   */
  private applyReplacements(message: string, replacements: Record<string, string>): string {
    let result = message;
    for (const [key, value] of Object.entries(replacements)) {
      result = result.replaceAll(`{${key}}`, value);
    }
    return result;
  }
}
