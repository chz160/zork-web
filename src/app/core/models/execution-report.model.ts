import { ParserResult, ObjectCandidate } from './parser-result.model';
import { CommandOutput } from './command-output.model';

/**
 * Result of executing a single command in a sequence
 */
export interface CommandExecutionResult {
  /** The parsed command that was executed */
  command: ParserResult;

  /** The output from executing the command */
  output: CommandOutput;

  /** Index of this command in the sequence (0-based) */
  index: number;

  /** Whether this command was skipped due to a previous failure (fail-early policy) */
  skipped: boolean;

  /** Selected candidate if disambiguation occurred */
  selectedCandidate?: ObjectCandidate;

  /** Whether autocorrect was accepted for this command */
  autocorrectAccepted?: boolean;

  /** Original input before autocorrect (if applicable) */
  originalInput?: string;

  /** Timestamp when command started execution */
  startTime: Date;

  /** Timestamp when command finished execution */
  endTime: Date;
}

/**
 * Comprehensive report of multi-command execution
 */
export interface ExecutionReport {
  /** Array of results for each command */
  results: CommandExecutionResult[];

  /** Overall success - true if all executed commands succeeded */
  success: boolean;

  /** Execution policy used */
  policy: ExecutionPolicy;

  /** Total number of commands that were attempted */
  totalCommands: number;

  /** Number of commands that were actually executed (not skipped) */
  executedCommands: number;

  /** Number of commands that succeeded */
  successfulCommands: number;

  /** Number of commands that failed */
  failedCommands: number;

  /** Number of commands that were skipped */
  skippedCommands: number;

  /** Timestamp when execution started */
  startTime: Date;

  /** Timestamp when execution finished */
  endTime: Date;

  /** Total execution time in milliseconds */
  executionTimeMs: number;
}

/**
 * Execution policy for multi-command sequences
 */
export type ExecutionPolicy = 'fail-early' | 'best-effort';

/**
 * Options for command dispatcher execution
 */
export interface ExecutionOptions {
  /** Execution policy to use */
  policy?: ExecutionPolicy;

  /** Whether to block on UI interactions (disambiguation/autocorrect) */
  blockOnUI?: boolean;
}
