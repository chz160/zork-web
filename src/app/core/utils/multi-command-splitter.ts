/**
 * Multi-command splitter utility for parsing compound commands.
 * Handles commands like "open mailbox and take leaflet" or "go north, look around".
 */

/**
 * Result of splitting a multi-command input
 */
export interface MultiCommandResult {
  /** Whether the input contains multiple commands */
  isMultiCommand: boolean;

  /** Array of individual command strings */
  commands: string[];

  /** The separator(s) used (for telemetry) */
  separators: string[];
}

/**
 * Default command separators
 */
const DEFAULT_SEPARATORS = ['and', 'then', ',', 'and then'];

/**
 * Split a raw input string into multiple commands if it contains separators.
 * Handles natural language conjunctions like "and", "then", and commas.
 *
 * Examples:
 * - "open mailbox and take leaflet" -> ["open mailbox", "take leaflet"]
 * - "go north, look around" -> ["go north", "look around"]
 * - "take lamp" -> ["take lamp"] (single command)
 *
 * @param rawInput The raw user input
 * @param separators Optional custom separators (defaults to ["and", "then", ",", "and then"])
 * @returns Multi-command result with split commands
 */
export function splitCommands(
  rawInput: string,
  separators: string[] = DEFAULT_SEPARATORS
): MultiCommandResult {
  if (!rawInput || rawInput.trim().length === 0) {
    return {
      isMultiCommand: false,
      commands: [],
      separators: [],
    };
  }

  const trimmedInput = rawInput.trim();

  // Sort separators by length (longest first) to handle "and then" before "and"
  const sortedSeparators = [...separators].sort((a, b) => b.length - a.length);

  // Track which separators were found
  const foundSeparators: string[] = [];

  // Build a regex pattern that matches any of the separators
  // Use word boundaries for word separators, but not for punctuation like comma
  const escapedSeparators = sortedSeparators.map((sep) => {
    if (sep.match(/^[a-z]+$/i)) {
      // Word separator - use word boundaries
      return `\\b${sep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`;
    } else {
      // Punctuation separator - no word boundaries
      return sep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
  });

  const separatorPattern = new RegExp(`(${escapedSeparators.join('|')})`, 'gi');

  // Split by separators and track which ones we found
  const parts: string[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = separatorPattern.exec(trimmedInput)) !== null) {
    const part = trimmedInput.substring(lastIndex, match.index).trim();
    if (part) {
      parts.push(part);
      foundSeparators.push(match[0].trim().toLowerCase());
    }
    lastIndex = match.index + match[0].length;
  }

  // Add the remaining part after the last separator
  const finalPart = trimmedInput.substring(lastIndex).trim();
  if (finalPart) {
    parts.push(finalPart);
  }

  // If we found separators, it's a multi-command
  if (foundSeparators.length > 0 && parts.length > 1) {
    return {
      isMultiCommand: true,
      commands: parts.filter((p) => p.length > 0),
      separators: foundSeparators,
    };
  }

  // Single command
  return {
    isMultiCommand: false,
    commands: [trimmedInput],
    separators: [],
  };
}

/**
 * Check if an input string contains multiple commands.
 *
 * @param rawInput The raw user input
 * @param separators Optional custom separators
 * @returns True if the input contains multiple commands
 */
export function isMultiCommand(rawInput: string, separators?: string[]): boolean {
  return splitCommands(rawInput, separators).isMultiCommand;
}

/**
 * Get the count of commands in an input string.
 *
 * @param rawInput The raw user input
 * @param separators Optional custom separators
 * @returns The number of commands
 */
export function getCommandCount(rawInput: string, separators?: string[]): number {
  return splitCommands(rawInput, separators).commands.length;
}
