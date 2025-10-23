/**
 * Structured output from command execution.
 * Provides semantic information for UI rendering.
 */
export interface CommandOutput {
  /** The main text messages to display */
  messages: string[];

  /** Whether the command was successful */
  success: boolean;

  /** Type of output for styling/rendering hints */
  type?: OutputType;

  /** Optional metadata for special UI handling */
  metadata?: Record<string, unknown>;
}

/**
 * Types of output for semantic rendering.
 */
export type OutputType =
  | 'info' // General information
  | 'error' // Error or failure
  | 'success' // Success confirmation
  | 'description' // Room or object description
  | 'inventory' // Inventory listing
  | 'help' // Help text
  | 'system'; // System messages (save, load, etc.)
