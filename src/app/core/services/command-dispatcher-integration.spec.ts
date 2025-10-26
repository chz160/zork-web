import { TestBed } from '@angular/core/testing';
import { GameEngineService } from './game-engine.service';
import { CommandParserService } from './command-parser.service';
import { TelemetryService } from './telemetry.service';
import { ParserResult } from '../models';

/**
 * Integration tests for CommandDispatcher with GameEngineService.
 * Tests state propagation, UI integration, and sequential execution.
 */
describe('CommandDispatcher Integration with GameEngine', () => {
  let gameEngine: GameEngineService;
  let parser: CommandParserService;
  let telemetry: TelemetryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GameEngineService, CommandParserService, TelemetryService],
    });

    gameEngine = TestBed.inject(GameEngineService);
    parser = TestBed.inject(CommandParserService);
    telemetry = TestBed.inject(TelemetryService);

    // Initialize the game
    gameEngine.initializeGame();

    // Clear telemetry events from initialization
    telemetry.clearEvents();
  });

  describe('Sequential Command Execution', () => {
    it('should execute commands in sequence and propagate state', async () => {
      const commands = [parser.parse('look'), parser.parse('inventory')];

      const report = await gameEngine.executeParsedCommands(commands);

      expect(report.success).toBe(true);
      expect(report.totalCommands).toBe(2);
      expect(report.executedCommands).toBe(2);
      expect(report.successfulCommands).toBe(2);
      expect(report.failedCommands).toBe(0);

      // Verify execution order by checking results
      expect(report.results[0].command.verb).toBe('look');
      expect(report.results[1].command.verb).toBe('inventory');
    });

    it('should propagate state changes between commands', async () => {
      // Find the mailbox object
      const mailbox = gameEngine.getObject('mailbox');

      if (mailbox) {
        // Ensure mailbox starts closed
        expect(mailbox.properties?.isOpen).toBeFalsy();

        // Execute "open mailbox" followed by "look"
        const commands = [parser.parse('open mailbox'), parser.parse('look')];

        const report = await gameEngine.executeParsedCommands(commands);

        expect(report.success).toBe(true);
        expect(report.executedCommands).toBe(2);

        // Verify mailbox state changed
        const updatedMailbox = gameEngine.getObject('mailbox');
        expect(updatedMailbox?.properties?.isOpen).toBe(true);

        // Verify both commands succeeded
        expect(report.results[0].output.success).toBe(true);
        expect(report.results[1].output.success).toBe(true);
      }
    });
  });

  describe('Fail-Early Policy', () => {
    it('should stop execution on first error with fail-early policy', async () => {
      const commands = [
        parser.parse('take nonexistent-object'),
        parser.parse('look'),
        parser.parse('inventory'),
      ];

      const report = await gameEngine.executeParsedCommands(commands, {
        policy: 'fail-early',
      });

      expect(report.success).toBe(false);
      expect(report.totalCommands).toBe(3);
      expect(report.executedCommands).toBe(1);
      expect(report.failedCommands).toBe(1);
      expect(report.skippedCommands).toBe(2);

      // Verify first command failed
      expect(report.results[0].output.success).toBe(false);

      // Verify subsequent commands were skipped
      expect(report.results[1].skipped).toBe(true);
      expect(report.results[2].skipped).toBe(true);
    });

    it('should execute all commands if all succeed with fail-early policy', async () => {
      const commands = [parser.parse('look'), parser.parse('inventory'), parser.parse('help')];

      const report = await gameEngine.executeParsedCommands(commands, {
        policy: 'fail-early',
      });

      expect(report.success).toBe(true);
      expect(report.totalCommands).toBe(3);
      expect(report.executedCommands).toBe(3);
      expect(report.successfulCommands).toBe(3);
      expect(report.skippedCommands).toBe(0);
    });
  });

  describe('Best-Effort Policy', () => {
    it('should execute all commands even if one fails with best-effort policy', async () => {
      const commands = [
        parser.parse('take nonexistent-object'),
        parser.parse('look'),
        parser.parse('inventory'),
      ];

      const report = await gameEngine.executeParsedCommands(commands, {
        policy: 'best-effort',
      });

      expect(report.success).toBe(false); // Overall fails because one failed
      expect(report.totalCommands).toBe(3);
      expect(report.executedCommands).toBe(3);
      expect(report.successfulCommands).toBe(2);
      expect(report.failedCommands).toBe(1);
      expect(report.skippedCommands).toBe(0);

      // Verify first command failed
      expect(report.results[0].output.success).toBe(false);

      // Verify subsequent commands still executed
      expect(report.results[1].output.success).toBe(true);
      expect(report.results[2].output.success).toBe(true);
    });

    it('should report overall success if all commands succeed with best-effort', async () => {
      const commands = [parser.parse('look'), parser.parse('inventory')];

      const report = await gameEngine.executeParsedCommands(commands, {
        policy: 'best-effort',
      });

      expect(report.success).toBe(true);
      expect(report.totalCommands).toBe(2);
      expect(report.executedCommands).toBe(2);
      expect(report.successfulCommands).toBe(2);
    });
  });

  describe('Complex Multi-Command Scenarios', () => {
    it('should handle complex command sequences with state changes', async () => {
      const mailbox = gameEngine.getObject('mailbox');

      if (mailbox && mailbox.properties?.contains?.includes('leaflet')) {
        const commands = [
          parser.parse('open mailbox'), // Open container
          parser.parse('take leaflet'), // Take from opened container
          parser.parse('inventory'), // Check inventory
        ];

        const report = await gameEngine.executeParsedCommands(commands);

        expect(report.success).toBe(true);
        expect(report.executedCommands).toBe(3);
        expect(report.successfulCommands).toBe(3);

        // Verify leaflet is now in inventory
        const player = gameEngine.player();
        expect(player.inventory).toContain('leaflet');
      }
    });

    it('should handle mixed success and failure with best-effort', async () => {
      const commands = [
        parser.parse('look'), // Success
        parser.parse('take nonexistent-object'), // Failure
        parser.parse('inventory'), // Success
        parser.parse('examine nonexistent-object'), // Failure
        parser.parse('help'), // Success
      ];

      const report = await gameEngine.executeParsedCommands(commands, {
        policy: 'best-effort',
      });

      expect(report.totalCommands).toBe(5);
      expect(report.executedCommands).toBe(5);
      expect(report.successfulCommands).toBe(3);
      expect(report.failedCommands).toBe(2);
      expect(report.success).toBe(false);
    });
  });

  describe('Telemetry Integration', () => {
    it('should log dispatcher events during execution', async () => {
      const commands = [parser.parse('look'), parser.parse('inventory')];

      await gameEngine.executeParsedCommands(commands);

      const events = telemetry.getEvents();

      // Should have start, command executed (x2), and completed events
      const startEvents = events.filter((e) =>
        String(e.type).includes('commandDispatcher.started')
      );
      const execEvents = events.filter((e) =>
        String(e.type).includes('commandDispatcher.commandExecuted')
      );
      const completeEvents = events.filter((e) =>
        String(e.type).includes('commandDispatcher.completed')
      );

      expect(startEvents.length).toBeGreaterThan(0);
      expect(execEvents.length).toBe(2);
      expect(completeEvents.length).toBeGreaterThan(0);
    });

    it('should log early termination with fail-early policy', async () => {
      const commands = [parser.parse('take nonexistent-object'), parser.parse('look')];

      await gameEngine.executeParsedCommands(commands, { policy: 'fail-early' });

      const events = telemetry.getEvents();
      const earlyTermEvents = events.filter((e) =>
        String(e.type).includes('commandDispatcher.earlyTermination')
      );

      expect(earlyTermEvents.length).toBeGreaterThan(0);
    });
  });

  describe('Execution Timing', () => {
    it('should track execution time for the entire sequence', async () => {
      const commands = [parser.parse('look'), parser.parse('inventory')];

      const report = await gameEngine.executeParsedCommands(commands);

      expect(report.executionTimeMs).toBeGreaterThanOrEqual(0);
      expect(report.startTime).toBeDefined();
      expect(report.endTime).toBeDefined();
      expect(report.endTime.getTime()).toBeGreaterThanOrEqual(report.startTime.getTime());
    });

    it('should track execution time per command', async () => {
      const commands = [parser.parse('look'), parser.parse('inventory')];

      const report = await gameEngine.executeParsedCommands(commands);

      report.results.forEach((result) => {
        expect(result.startTime).toBeDefined();
        expect(result.endTime).toBeDefined();
        expect(result.endTime.getTime()).toBeGreaterThanOrEqual(result.startTime.getTime());
      });
    });
  });

  describe('Empty Command Array', () => {
    it('should handle empty command array gracefully', async () => {
      const commands: ParserResult[] = [];

      const report = await gameEngine.executeParsedCommands(commands);

      expect(report.success).toBe(true);
      expect(report.totalCommands).toBe(0);
      expect(report.executedCommands).toBe(0);
    });
  });

  describe('Default Policy', () => {
    it('should use fail-early as default policy when no options provided', async () => {
      const commands = [parser.parse('take nonexistent-object'), parser.parse('look')];

      const report = await gameEngine.executeParsedCommands(commands);

      expect(report.policy).toBe('fail-early');
      expect(report.skippedCommands).toBe(1);
    });
  });

  describe('Transaction Semantics', () => {
    it('should ensure each command sees effects of previous commands', async () => {
      const mailbox = gameEngine.getObject('mailbox');

      if (mailbox) {
        // Mailbox should start closed
        expect(mailbox.properties?.isOpen).toBeFalsy();

        const commands = [
          parser.parse('open mailbox'),
          parser.parse('close mailbox'),
          parser.parse('open mailbox'),
        ];

        const report = await gameEngine.executeParsedCommands(commands);

        expect(report.success).toBe(true);
        expect(report.executedCommands).toBe(3);

        // All commands should succeed because each sees the state from the previous
        expect(report.results[0].output.success).toBe(true); // open
        expect(report.results[1].output.success).toBe(true); // close
        expect(report.results[2].output.success).toBe(true); // open again

        // Final state should be open
        const finalMailbox = gameEngine.getObject('mailbox');
        expect(finalMailbox?.properties?.isOpen).toBe(true);
      }
    });
  });
});
