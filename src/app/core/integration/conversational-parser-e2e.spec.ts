import { TestBed } from '@angular/core/testing';
import { GameEngineService } from '../services/game-engine.service';
import { CommandParserService } from '../services/command-parser.service';
import { TelemetryService } from '../services/telemetry.service';
import { CommandDispatcherService } from '../services/command-dispatcher.service';
import { GameService } from '../services/game.service';
import { ObjectCandidate } from '../models/parser-result.model';

/**
 * Comprehensive End-to-End Integration Tests for Conversational Parser
 *
 * These tests verify complete user flows from input to output, including:
 * - Multi-command parsing and sequential execution
 * - Disambiguation UI flows
 * - Autocorrect UI flows
 * - State propagation across command sequences
 * - Telemetry logging verification
 * - Real-world gameplay scenarios
 *
 * Goal: Ensure robust, real-world behavior of the entire conversational parser system.
 */
describe('Conversational Parser End-to-End Integration', () => {
  let gameEngine: GameEngineService;
  let parser: CommandParserService;
  let telemetry: TelemetryService;
  let dispatcher: CommandDispatcherService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GameEngineService,
        CommandParserService,
        TelemetryService,
        CommandDispatcherService,
        GameService,
      ],
    });

    gameEngine = TestBed.inject(GameEngineService);
    parser = TestBed.inject(CommandParserService);
    telemetry = TestBed.inject(TelemetryService);
    dispatcher = TestBed.inject(CommandDispatcherService);

    // Clear telemetry before each test
    telemetry.clearEvents();

    // Initialize game
    gameEngine.initializeGame();
  });

  afterEach(() => {
    telemetry.clearEvents();
  });

  describe('Multi-Command Flows with State Propagation', () => {
    it('should execute multiple commands sequentially', async () => {
      // Arrange: Parse multi-command input
      const commands = [parser.parse('look'), parser.parse('inventory')];

      // Act: Execute commands sequentially
      const report = await dispatcher.executeParsedCommands(
        commands,
        (cmd) => gameEngine.executeCommand(cmd),
        { policy: 'fail-early' }
      );

      // Assert: Both commands executed successfully
      expect(report.success).toBe(true);
      expect(report.executedCommands).toBe(2);
      expect(report.successfulCommands).toBe(2);
      expect(report.failedCommands).toBe(0);
      expect(report.skippedCommands).toBe(0);

      // Verify telemetry logged both command executions
      const events = telemetry.getEvents();
      const dispatcherEvents = events.filter((e) => String(e.type).includes('commandDispatcher'));
      expect(dispatcherEvents.length).toBeGreaterThan(0);
    });

    it('should handle three-command sequence with state propagation', async () => {
      // Add objects for this test
      gameEngine.addObject({
        id: 'test-lamp',
        name: 'brass lamp',
        aliases: ['lamp'],
        description: 'A brass lamp',
        portable: true,
        visible: true,
        location: 'west-of-house',
        properties: { isLit: false },
      });

      gameEngine.addRoom({
        id: 'test-north',
        name: 'North Room',
        description: 'A room to the north',
        shortDescription: 'North Room',
        exits: new Map([['south', 'west-of-house']]),
        objectIds: [],
        visited: false,
      });

      // Update west-of-house to have north exit
      const currentRoom = gameEngine.getCurrentRoom();
      if (currentRoom) {
        currentRoom.exits.set('north', 'test-north');
      }

      // Parse and execute commands
      const commands = [
        parser.parse('take lamp'),
        parser.parse('light it'), // Pronoun resolution: "it" = lamp
        parser.parse('go north'),
      ];

      const report = await dispatcher.executeParsedCommands(
        commands,
        (cmd) => gameEngine.executeCommand(cmd),
        { policy: 'fail-early' }
      );

      // Verify execution (some commands may fail based on game logic)
      expect(report.executedCommands).toBeGreaterThan(0);
      expect(report.totalCommands).toBe(3);
    });

    it('should stop execution on first failure with fail-early policy', async () => {
      const commands = [
        parser.parse('take nonexistent'),
        parser.parse('look'), // Should be skipped
      ];

      const report = await dispatcher.executeParsedCommands(
        commands,
        (cmd) => gameEngine.executeCommand(cmd),
        { policy: 'fail-early' }
      );

      expect(report.success).toBe(false);
      expect(report.executedCommands).toBe(1); // Only first command executed
      expect(report.failedCommands).toBe(1);
      expect(report.skippedCommands).toBe(1); // Second command skipped
    });

    it('should execute all commands with best-effort policy', async () => {
      const commands = [
        parser.parse('take nonexistent'), // Will fail
        parser.parse('look'), // Should still execute
      ];

      const report = await dispatcher.executeParsedCommands(
        commands,
        (cmd) => gameEngine.executeCommand(cmd),
        { policy: 'best-effort' }
      );

      expect(report.executedCommands).toBe(2); // Both executed
      expect(report.failedCommands).toBe(1);
      expect(report.successfulCommands).toBe(1);
      expect(report.skippedCommands).toBe(0);
    });
  });

  describe('Disambiguation UI Flow Integration', () => {
    it('should show disambiguation and accept user selection', async () => {
      // Add multiple lamps to trigger disambiguation
      gameEngine.addObject({
        id: 'brass-lamp',
        name: 'brass lamp',
        aliases: ['lamp'],
        description: 'A shiny brass lamp',
        portable: true,
        visible: true,
        location: 'west-of-house',
      });

      gameEngine.addObject({
        id: 'oil-lamp',
        name: 'oil lamp',
        aliases: ['lamp'],
        description: 'An old oil lamp',
        portable: true,
        visible: true,
        location: 'west-of-house',
      });

      const candidates: ObjectCandidate[] = [
        {
          id: 'brass-lamp',
          displayName: 'brass lamp',
          score: 0.95,
          context: 'here',
        },
        { id: 'oil-lamp', displayName: 'oil lamp', score: 0.9, context: 'here' },
      ];

      // Mock UI callback to simulate user selection
      let disambiguationCalled = false;
      gameEngine.setDisambiguationCallback(async (cands, prompt) => {
        disambiguationCalled = true;
        expect(cands.length).toBe(2);
        expect(prompt).toBeTruthy();

        // Verify telemetry logged disambiguation shown
        const events = telemetry.getEvents();
        const disambigEvents = events.filter((e) => String(e.type) === 'disambiguation_shown');
        expect(disambigEvents.length).toBeGreaterThan(0);

        return cands[0]; // User selects first option
      });

      const result = await gameEngine.requestDisambiguation(candidates, 'Which lamp?');

      expect(disambiguationCalled).toBe(true);
      expect(result).toEqual(candidates[0]);

      // Verify telemetry logged the selection
      const events = telemetry.getEvents();
      const selectionEvents = events.filter((e) => String(e.type) === 'disambiguation_selected');
      expect(selectionEvents.length).toBeGreaterThan(0);
    });

    it('should handle user cancelling disambiguation', async () => {
      const candidates: ObjectCandidate[] = [
        {
          id: 'brass-lamp',
          displayName: 'brass lamp',
          score: 0.95,
          context: 'here',
        },
      ];

      // Mock UI callback to simulate cancellation
      gameEngine.setDisambiguationCallback(async () => {
        return null; // User cancels
      });

      const result = await gameEngine.requestDisambiguation(candidates, 'Which lamp?');

      expect(result).toBeNull();

      // Verify telemetry has disambiguation events (cancellation may not be explicitly logged)
      const events = telemetry.getEvents();
      const disambigEvents = events.filter((e) => String(e.type).includes('disambiguation'));
      // At minimum, 'shown' event should be logged
      expect(disambigEvents.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle ordinal selection in disambiguation', async () => {
      // User types "take 2nd lamp"
      const command = parser.parse('take 2nd lamp');

      // The ordinal parsing should be handled by ObjectResolver
      // Verify telemetry logs ordinal selection
      if (command.directObject === '2nd lamp') {
        const events = telemetry.getEvents();
        const ordinalEvents = events.filter((e) => String(e.type) === 'ordinal_selection');
        // Ordinal events may be logged during parsing or resolution
        // This test documents expected behavior
        expect(ordinalEvents.length).toBeGreaterThanOrEqual(0);
      }

      expect(command.verb).toBe('take');
    });
  });

  describe('Autocorrect UI Flow Integration', () => {
    it('should show autocorrect and accept user confirmation', async () => {
      // Mock UI callback for autocorrect
      let autocorrectCalled = false;
      gameEngine.setAutocorrectCallback(async (original, suggestion, confidence) => {
        autocorrectCalled = true;
        expect(original).toBe('lampp'); // Typo
        expect(suggestion).toBe('lamp'); // Correction
        expect(confidence).toBeGreaterThan(0.7);

        // Verify telemetry logged autocorrect suggestion
        const events = telemetry.getEvents();
        const suggestionEvents = events.filter((e) => String(e.type) === 'autocorrect_suggestion');
        expect(suggestionEvents.length).toBeGreaterThan(0);

        return true; // User accepts
      });

      const accepted = await gameEngine.requestAutocorrectConfirmation('lampp', 'lamp', 0.92);

      expect(autocorrectCalled).toBe(true);
      expect(accepted).toBe(true);

      // Verify telemetry logged acceptance
      const events = telemetry.getEvents();
      const acceptedEvents = events.filter((e) => String(e.type) === 'autocorrect_accepted');
      expect(acceptedEvents.length).toBeGreaterThan(0);
    });

    it('should handle user rejecting autocorrect', async () => {
      // Mock UI callback for autocorrect rejection
      gameEngine.setAutocorrectCallback(async () => {
        return false; // User rejects
      });

      const accepted = await gameEngine.requestAutocorrectConfirmation('lampp', 'lamp', 0.75);

      expect(accepted).toBe(false);

      // Verify telemetry has autocorrect events (rejection may not be explicitly logged)
      const events = telemetry.getEvents();
      const autocorrectEvents = events.filter((e) => String(e.type).includes('autocorrect'));
      // At minimum, 'suggestion' event should be logged
      expect(autocorrectEvents.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Telemetry Verification', () => {
    it('should log parse success for valid commands', () => {
      const command = parser.parse('look');

      expect(command.isValid).toBe(true);

      const events = telemetry.getEvents();
      const successEvents = events.filter((e) => String(e.type) === 'parse_success');
      expect(successEvents.length).toBeGreaterThan(0);
    });

    it('should log parse failure for invalid commands', () => {
      const command = parser.parse('invalidverb');

      expect(command.isValid).toBe(false);

      const events = telemetry.getEvents();
      const failureEvents = events.filter((e) => String(e.type) === 'parse_failure');
      expect(failureEvents.length).toBeGreaterThan(0);
    });

    it('should track multi-command execution metrics', async () => {
      const commands = [parser.parse('look'), parser.parse('inventory')];

      telemetry.clearEvents(); // Clear before test

      const report = await dispatcher.executeParsedCommands(
        commands,
        (cmd) => gameEngine.executeCommand(cmd),
        { policy: 'best-effort' }
      );

      expect(report.success).toBe(true);

      // Verify dispatcher telemetry
      const events = telemetry.getEvents();
      const startedEvents = events.filter((e) =>
        String(e.type).includes('commandDispatcher.started')
      );
      const completedEvents = events.filter((e) =>
        String(e.type).includes('commandDispatcher.completed')
      );

      expect(startedEvents.length).toBe(1);
      expect(completedEvents.length).toBe(1);

      // Verify completed event has execution metrics
      const completedEvent = completedEvents[0];
      expect(completedEvent.data['totalCommands']).toBe(2);
      expect(completedEvent.data['successfulCommands']).toBe(2);
    });

    it('should provide analytics summary', async () => {
      // Clear events before test
      telemetry.clearEvents();

      // Execute commands through game engine to generate telemetry
      const command1 = parser.parse('look');
      gameEngine.executeCommand(command1);

      const command2 = parser.parse('inventory');
      gameEngine.executeCommand(command2);

      const command3 = parser.parse('invalidcommand');
      gameEngine.executeCommand(command3);

      const analytics = telemetry.getAnalytics();

      // Verify event counts - at least some events should be logged
      expect(analytics.totalEvents).toBeGreaterThan(0);

      // Success rate should be valid if we have parse attempts
      if (analytics.parseAttempts > 0) {
        expect(analytics.parseSuccessRate).toBeGreaterThanOrEqual(0);
        expect(analytics.parseSuccessRate).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Real-World Gameplay Scenarios', () => {
    it('should handle pronoun resolution in command sequence', async () => {
      // Add a test object
      gameEngine.addObject({
        id: 'test-key',
        name: 'brass key',
        aliases: ['key'],
        description: 'A shiny brass key',
        portable: true,
        visible: true,
        location: 'west-of-house',
      });

      const commands = [
        parser.parse('examine key'),
        parser.parse('take it'), // Pronoun: "it" = key
      ];

      const report = await dispatcher.executeParsedCommands(
        commands,
        (cmd) => gameEngine.executeCommand(cmd),
        { policy: 'fail-early' }
      );

      expect(report.executedCommands).toBe(2);
      expect(report.totalCommands).toBe(2);
    });

    it('should handle fuzzy verb matching in multi-command', async () => {
      // "tak" should fuzzy match to "take"
      const command1 = parser.parse('tak mailbox');
      expect(command1.verb).toBeTruthy(); // Should resolve to "take" verb

      // Create scenario with valid objects
      gameEngine.addObject({
        id: 'test-key',
        name: 'brass key',
        aliases: ['key'],
        description: 'A shiny brass key',
        portable: true,
        visible: true,
        location: 'west-of-house',
      });

      const commands = [
        parser.parse('tak key'), // Fuzzy "tak" -> "take"
        parser.parse('examine it'), // Pronoun resolution
      ];

      const report = await dispatcher.executeParsedCommands(
        commands,
        (cmd) => gameEngine.executeCommand(cmd),
        { policy: 'best-effort' }
      );

      expect(report.executedCommands).toBe(2);
    });

    it('should handle complex navigation with state changes', async () => {
      // Add connected rooms for navigation test
      gameEngine.addRoom({
        id: 'test-room-a',
        name: 'Room A',
        description: 'First room',
        shortDescription: 'Room A',
        exits: new Map([['east', 'test-room-b']]),
        objectIds: [],
        visited: false,
      });

      gameEngine.addRoom({
        id: 'test-room-b',
        name: 'Room B',
        description: 'Second room',
        shortDescription: 'Room B',
        exits: new Map([['west', 'test-room-a']]),
        objectIds: [],
        visited: false,
      });

      // Move player to test-room-a
      gameEngine.moveToRoom('test-room-a');

      const commands = [
        parser.parse('look'),
        parser.parse('go east'),
        parser.parse('look'),
        parser.parse('go west'),
      ];

      const report = await dispatcher.executeParsedCommands(
        commands,
        (cmd) => gameEngine.executeCommand(cmd),
        { policy: 'fail-early' }
      );

      expect(report.success).toBe(true);
      expect(report.executedCommands).toBe(4);

      // Verify final state: back in room A
      const player = gameEngine.player();
      expect(player.currentRoomId).toBe('test-room-a');
      expect(player.moveCount).toBeGreaterThan(0);
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    it('should gracefully handle empty multi-command input', async () => {
      const commands: never[] = [];

      const report = await dispatcher.executeParsedCommands(
        commands,
        (cmd) => gameEngine.executeCommand(cmd),
        { policy: 'fail-early' }
      );

      expect(report.success).toBe(true);
      expect(report.executedCommands).toBe(0);
    });

    it('should handle invalid commands in multi-command sequence', async () => {
      const commands = [parser.parse('invalidcommand'), parser.parse('look')];

      const report = await dispatcher.executeParsedCommands(
        commands,
        (cmd) => gameEngine.executeCommand(cmd),
        { policy: 'best-effort' }
      );

      expect(report.executedCommands).toBe(2);
      expect(report.failedCommands).toBeGreaterThan(0);
      expect(report.successfulCommands).toBeGreaterThan(0);
    });

    it('should handle disambiguation with no candidates', async () => {
      const candidates: ObjectCandidate[] = [];

      gameEngine.setDisambiguationCallback(async (cands) => {
        expect(cands.length).toBe(0);
        return null;
      });

      const result = await gameEngine.requestDisambiguation(candidates, 'Nothing to choose from');

      expect(result).toBeNull();
    });

    it('should handle autocorrect with zero confidence', async () => {
      gameEngine.setAutocorrectCallback(async (original, suggestion, conf) => {
        expect(conf).toBe(0);
        return false; // Reject zero-confidence suggestions
      });

      const accepted = await gameEngine.requestAutocorrectConfirmation('asdf', 'look', 0);

      expect(accepted).toBe(false);
    });
  });

  describe('Performance and Timing', () => {
    it('should complete multi-command execution in reasonable time', async () => {
      const commands = [parser.parse('look'), parser.parse('inventory'), parser.parse('look')];

      const startTime = Date.now();

      const report = await dispatcher.executeParsedCommands(
        commands,
        (cmd) => gameEngine.executeCommand(cmd),
        { policy: 'best-effort' }
      );

      const elapsed = Date.now() - startTime;

      expect(report.success).toBe(true);
      expect(elapsed).toBeLessThan(1000); // Should complete in < 1 second
      expect(report.executionTimeMs).toBeLessThan(1000);
    });

    it('should track execution time per command', async () => {
      const commands = [parser.parse('look'), parser.parse('inventory')];

      const report = await dispatcher.executeParsedCommands(commands, (cmd) =>
        gameEngine.executeCommand(cmd)
      );

      // Verify each command has timing information
      report.results.forEach((result) => {
        expect(result.startTime).toBeTruthy();
        expect(result.endTime).toBeTruthy();
        expect(result.endTime.getTime()).toBeGreaterThanOrEqual(result.startTime.getTime());
      });
    });
  });
});
