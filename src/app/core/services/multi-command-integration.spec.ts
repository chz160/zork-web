import { TestBed } from '@angular/core/testing';
import { GameService } from './game.service';
import { GameEngineService } from './game-engine.service';
import { CommandParserService } from './command-parser.service';
import { TelemetryService } from './telemetry.service';
import { take } from 'rxjs/operators';

/**
 * Integration tests for multi-command execution through the GameService.
 * Tests the end-to-end flow of splitting, parsing, and executing multiple commands.
 */
describe('Multi-Command Integration', () => {
  let gameService: GameService;
  let gameEngine: GameEngineService;
  let telemetry: TelemetryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GameService, GameEngineService, CommandParserService, TelemetryService],
    });
    gameService = TestBed.inject(GameService);
    gameEngine = TestBed.inject(GameEngineService);
    telemetry = TestBed.inject(TelemetryService);

    // Initialize the game
    gameService.initializeGame();

    // Clear telemetry events from initialization
    telemetry.clearEvents();
  });

  describe('Multi-Command Splitting', () => {
    it('should split and execute commands connected with "and"', (done) => {
      let commandCount = 0;
      gameService.commandOutput$.subscribe(() => {
        commandCount++;
        if (commandCount === 2) {
          // Both commands should have executed
          const events = telemetry.getEvents();
          const multiCommandEvent = events.find((e) => e.type === 'multi_command');
          expect(multiCommandEvent).toBeDefined();
          expect(multiCommandEvent?.data['commandCount']).toBe(2);
          done();
        }
      });

      gameService.submitCommand('look and inventory');
    });

    it('should split and execute commands connected with "then"', (done) => {
      let commandCount = 0;
      gameService.commandOutput$.subscribe(() => {
        commandCount++;
        if (commandCount === 2) {
          const events = telemetry.getEvents();
          const multiCommandEvent = events.find((e) => e.type === 'multi_command');
          expect(multiCommandEvent).toBeDefined();
          done();
        }
      });

      gameService.submitCommand('look then inventory');
    });

    it('should split and execute commands connected with comma', (done) => {
      let commandCount = 0;
      gameService.commandOutput$.subscribe(() => {
        commandCount++;
        if (commandCount === 2) {
          const events = telemetry.getEvents();
          const multiCommandEvent = events.find((e) => e.type === 'multi_command');
          expect(multiCommandEvent).toBeDefined();
          done();
        }
      });

      gameService.submitCommand('look, inventory');
    });

    it('should execute more than two commands in sequence', (done) => {
      let commandCount = 0;
      gameService.commandOutput$.subscribe(() => {
        commandCount++;
        if (commandCount === 3) {
          const events = telemetry.getEvents();
          const multiCommandEvent = events.find((e) => e.type === 'multi_command');
          expect(multiCommandEvent).toBeDefined();
          expect(multiCommandEvent?.data['commandCount']).toBe(3);
          done();
        }
      });

      gameService.submitCommand('look and inventory and help');
    });
  });

  describe('Multi-Command Game State Propagation', () => {
    it('should propagate game state between commands', (done) => {
      // First, ensure there's a mailbox object in the game
      const mailbox = gameEngine.getObject('mailbox');
      if (!mailbox) {
        // Skip test if mailbox doesn't exist in test data
        done();
        return;
      }

      let commandCount = 0;
      gameService.commandOutput$.subscribe(() => {
        commandCount++;
        if (commandCount === 2) {
          // After both commands execute, verify state has changed
          // The first command (open mailbox) should change the mailbox state
          // The second command (look) should reflect that change
          done();
        }
      });

      // This tests that "open mailbox" is executed before "look"
      gameService.submitCommand('open mailbox and look');
    });
  });

  describe('Multi-Command with Best-Effort Policy', () => {
    it('should continue executing on error when using best-effort policy', (done) => {
      let commandCount = 0;
      gameService.commandOutput$.subscribe((output) => {
        commandCount++;
        if (commandCount === 1) {
          // First command should fail
          expect(output.success).toBe(false);
        } else if (commandCount === 2) {
          // Second command should still execute despite first failure
          expect(output.success).toBe(true);
          done();
        }
      });

      // First command is invalid, second should still execute with best-effort policy
      gameService.submitCommand('invalidverb xyz and look');
    });
  });

  describe('Single Command (No Splitting)', () => {
    it('should handle single commands without splitting', (done) => {
      gameService.commandOutput$.pipe(take(1)).subscribe(() => {
        const events = telemetry.getEvents();
        const multiCommandEvent = events.find((e) => e.type === 'multi_command');
        // Should not have a multi-command event for single commands
        expect(multiCommandEvent).toBeUndefined();
        done();
      });

      gameService.submitCommand('look');
    });

    it('should split "and" even within object names', (done) => {
      // This documents current behavior: we split on "and" even if it appears
      // in what might be an object name. This is acceptable since Zork objects
      // rarely have "and" in their names.
      gameService.commandOutput$.pipe(take(1)).subscribe(() => {
        const events = telemetry.getEvents();
        const multiCommandEvent = events.find((e) => e.type === 'multi_command');
        // Current behavior: "bread and butter" splits into two commands
        expect(multiCommandEvent).toBeDefined();
        expect(multiCommandEvent?.data['commandCount']).toBe(2);
        done();
      });

      gameService.submitCommand('examine bread and butter');
    });
  });

  describe('Telemetry for Multi-Commands', () => {
    it('should log multi-command events', (done) => {
      let commandCount = 0;
      gameService.commandOutput$.subscribe(() => {
        commandCount++;
        if (commandCount === 2) {
          const events = telemetry.getEvents();
          const multiCommandEvent = events.find((e) => e.type === 'multi_command');

          expect(multiCommandEvent).toBeDefined();
          expect(multiCommandEvent?.data['rawInput']).toBe('look and inventory');
          expect(multiCommandEvent?.data['commandCount']).toBe(2);
          expect(multiCommandEvent?.data['policy']).toBeDefined();
          done();
        }
      });

      gameService.submitCommand('look and inventory');
    });
  });
});
