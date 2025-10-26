import { Injectable, inject } from '@angular/core';
import {
  ParserResult,
  CommandOutput,
  ExecutionReport,
  ExecutionPolicy,
  ExecutionOptions,
  CommandExecutionResult,
} from '../models';
import { TelemetryService } from './telemetry.service';

/**
 * Command Dispatcher Service
 *
 * Coordinates the execution of multiple parsed commands, manages state propagation
 * between sequential actions, and provides configurable execution policies.
 *
 * Key Responsibilities:
 * - Sequential execution of command arrays with proper state propagation
 * - Policy enforcement (fail-early vs best-effort)
 * - Integration with UI flows (disambiguation/autocorrect) via callbacks
 * - Comprehensive telemetry and logging
 * - Transaction semantics for command sequences
 *
 * Features:
 * - **fail-early policy**: Stop execution on first error (default)
 * - **best-effort policy**: Continue executing all commands, report errors per-command
 * - **State propagation**: Each command sees effects of previous commands
 * - **UI blocking**: Await user interaction for disambiguation/autocorrect
 * - **Telemetry**: Log all execution events, user choices, and errors
 *
 * Usage:
 * ```typescript
 * const commands: ParserResult[] = [
 *   { verb: 'open', directObject: 'mailbox', ... },
 *   { verb: 'take', directObject: 'leaflet', ... }
 * ];
 *
 * const report = await dispatcher.executeParsedCommands(
 *   commands,
 *   (cmd) => gameEngine.executeCommand(cmd),
 *   { policy: 'fail-early' }
 * );
 *
 * console.log(`Executed ${report.executedCommands} commands`);
 * console.log(`Success: ${report.success}`);
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class CommandDispatcherService {
  private readonly telemetry = inject(TelemetryService);

  /**
   * Execute an array of parsed commands sequentially with proper state propagation.
   *
   * @param commands Array of parsed commands to execute
   * @param executor Function that executes a single command and returns its output
   * @param options Execution options (policy, UI blocking)
   * @returns Promise resolving to comprehensive execution report
   */
  async executeParsedCommands(
    commands: ParserResult[],
    executor: (command: ParserResult) => CommandOutput | Promise<CommandOutput>,
    options: ExecutionOptions = {}
  ): Promise<ExecutionReport> {
    const policy: ExecutionPolicy = options.policy || 'fail-early';
    const startTime = new Date();

    // Log dispatcher start
    this.telemetry.logEvent('commandDispatcher.started', {
      commandCount: commands.length,
      policy,
    });

    const results: CommandExecutionResult[] = [];
    let shouldContinue = true;

    // Execute commands sequentially
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      const commandStartTime = new Date();

      // Check if we should skip this command (fail-early policy)
      if (!shouldContinue) {
        results.push({
          command,
          output: {
            messages: ['Skipped due to previous error'],
            success: false,
            type: 'info',
          },
          index: i,
          skipped: true,
          startTime: commandStartTime,
          endTime: commandStartTime,
        });
        continue;
      }

      try {
        // Execute the command (may be async if UI interaction is needed)
        const output = await executor(command);
        const commandEndTime = new Date();

        // Create execution result
        const result: CommandExecutionResult = {
          command,
          output,
          index: i,
          skipped: false,
          startTime: commandStartTime,
          endTime: commandEndTime,
        };

        results.push(result);

        // Log command execution
        this.telemetry.logEvent('commandDispatcher.commandExecuted', {
          index: i,
          verb: command.verb,
          success: output.success,
          executionTimeMs: commandEndTime.getTime() - commandStartTime.getTime(),
        });

        // Check if we should continue based on policy
        if (policy === 'fail-early' && !output.success) {
          shouldContinue = false;

          // Log early termination
          this.telemetry.logEvent('commandDispatcher.earlyTermination', {
            index: i,
            remainingCommands: commands.length - i - 1,
          });
        }
      } catch (error) {
        const commandEndTime = new Date();

        // Handle execution error
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error during command execution';

        const result: CommandExecutionResult = {
          command,
          output: {
            messages: [errorMessage],
            success: false,
            type: 'error',
          },
          index: i,
          skipped: false,
          startTime: commandStartTime,
          endTime: commandEndTime,
        };

        results.push(result);

        // Log error
        this.telemetry.logEvent('commandDispatcher.error', {
          index: i,
          verb: command.verb,
          error: errorMessage,
        });

        // Check if we should continue based on policy
        if (policy === 'fail-early') {
          shouldContinue = false;

          // Log early termination
          this.telemetry.logEvent('commandDispatcher.earlyTermination', {
            index: i,
            remainingCommands: commands.length - i - 1,
          });
        }
      }
    }

    const endTime = new Date();
    const executionTimeMs = endTime.getTime() - startTime.getTime();

    // Calculate statistics
    const executedCommands = results.filter((r) => !r.skipped).length;
    const successfulCommands = results.filter((r) => !r.skipped && r.output.success).length;
    const failedCommands = results.filter((r) => !r.skipped && !r.output.success).length;
    const skippedCommands = results.filter((r) => r.skipped).length;
    const overallSuccess = failedCommands === 0 && skippedCommands === 0;

    // Create execution report
    const report: ExecutionReport = {
      results,
      success: overallSuccess,
      policy,
      totalCommands: commands.length,
      executedCommands,
      successfulCommands,
      failedCommands,
      skippedCommands,
      startTime,
      endTime,
      executionTimeMs,
    };

    // Log completion
    this.telemetry.logEvent('commandDispatcher.completed', {
      totalCommands: commands.length,
      executedCommands,
      successfulCommands,
      failedCommands,
      skippedCommands,
      success: overallSuccess,
      executionTimeMs,
      policy,
    });

    return report;
  }

  /**
   * Create a simple execution report for a single command.
   * Useful for maintaining API consistency when only one command is executed.
   *
   * @param command The parsed command
   * @param output The command output
   * @returns ExecutionReport with single command result
   */
  createSingleCommandReport(command: ParserResult, output: CommandOutput): ExecutionReport {
    const now = new Date();
    const result: CommandExecutionResult = {
      command,
      output,
      index: 0,
      skipped: false,
      startTime: now,
      endTime: now,
    };

    return {
      results: [result],
      success: output.success,
      policy: 'fail-early',
      totalCommands: 1,
      executedCommands: 1,
      successfulCommands: output.success ? 1 : 0,
      failedCommands: output.success ? 0 : 1,
      skippedCommands: 0,
      startTime: now,
      endTime: now,
      executionTimeMs: 0,
    };
  }
}
