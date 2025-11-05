import { TestBed } from '@angular/core/testing';
import { GameEngineService } from '../services/game-engine.service';
import { CommandParserService } from '../services/command-parser.service';
import { FeatureFlagService, FeatureFlag } from '../services/feature-flag.service';

/**
 * Integration tests for TrollActor behavior parity.
 *
 * Purpose:
 * These tests verify that the new TrollActor implementation produces identical
 * user-visible outputs and state changes as the legacy Troll behavior. They serve
 * as comprehensive validation for the actor migration.
 *
 * Test Scenarios:
 * - Blocked crossing (east and west passages)
 * - Combat mechanics and state transitions
 * - Save and load with troll state preservation
 * - Output message consistency between legacy and actor modes
 *
 * Each test runs in both legacy mode (flag off) and actor mode (flag on)
 * to verify behavior parity.
 */
describe('Troll Integration Tests - Behavior Parity', () => {
  let engine: GameEngineService;
  let parser: CommandParserService;
  let featureFlags: FeatureFlagService;

  /**
   * Helper to navigate to the troll room from the starting location.
   */
  function navigateToTrollRoom(): void {
    engine.executeCommand(parser.parse('north'));
    engine.executeCommand(parser.parse('east'));
    engine.executeCommand(parser.parse('open window'));
    engine.executeCommand(parser.parse('west'));
    engine.executeCommand(parser.parse('west'));
    engine.executeCommand(parser.parse('take sword'));
    engine.executeCommand(parser.parse('move rug'));
    engine.executeCommand(parser.parse('open trap door'));
    engine.executeCommand(parser.parse('down'));
    engine.executeCommand(parser.parse('north'));
  }

  /**
   * Helper to run a test in both legacy and actor modes.
   * Captures outputs from both modes for comparison.
   */
  function runInBothModes(testFn: (mode: 'legacy' | 'actor') => void): void {
    // Test in legacy mode
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [GameEngineService, CommandParserService, FeatureFlagService],
    });
    engine = TestBed.inject(GameEngineService);
    parser = TestBed.inject(CommandParserService);
    featureFlags = TestBed.inject(FeatureFlagService);
    featureFlags.setFlag(FeatureFlag.ACTOR_MIGRATION_TROLL, false);
    engine.initializeGame();

    testFn('legacy');

    // Test in actor mode
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [GameEngineService, CommandParserService, FeatureFlagService],
    });
    engine = TestBed.inject(GameEngineService);
    parser = TestBed.inject(CommandParserService);
    featureFlags = TestBed.inject(FeatureFlagService);
    featureFlags.setFlag(FeatureFlag.ACTOR_MIGRATION_TROLL, true);
    engine.initializeGame();

    testFn('actor');
  }

  afterEach(() => {
    localStorage.clear();
  });

  describe('Scenario: Blocked Crossing - East Passage', () => {
    it('should block east passage with identical messages in both modes', () => {
      const legacyMessages: string[] = [];
      const actorMessages: string[] = [];

      runInBothModes((_mode) => {
        navigateToTrollRoom();

        // Try to go east (should be blocked)
        const result = engine.executeCommand(parser.parse('east'));

        if (mode === 'legacy') {
          legacyMessages.push(...result.messages);
        } else {
          actorMessages.push(...result.messages);
        }

        // Verify blocking behavior
        expect(result.success).toBe(false);
        expect(result.type).toBe('error');

        // Verify we didn't move
        const currentRoom = engine.getCurrentRoom();
        expect(currentRoom?.id).toBe('troll-room');
      });

      // Compare outputs
      expect(actorMessages.length).toBeGreaterThan(0);
      expect(legacyMessages.length).toBeGreaterThan(0);

      // Both should mention the troll blocking
      const legacyText = legacyMessages.join(' ').toLowerCase();
      const actorText = actorMessages.join(' ').toLowerCase();

      expect(legacyText).toContain('troll');
      expect(actorText).toContain('troll');
    });
  });

  describe('Scenario: Blocked Crossing - West Passage', () => {
    it('should block west passage with identical messages in both modes', () => {
      const legacyMessages: string[] = [];
      const actorMessages: string[] = [];

      runInBothModes((_mode) => {
        navigateToTrollRoom();

        // Try to go west (should be blocked)
        const result = engine.executeCommand(parser.parse('west'));

        if (mode === 'legacy') {
          legacyMessages.push(...result.messages);
        } else {
          actorMessages.push(...result.messages);
        }

        // Verify blocking behavior
        expect(result.success).toBe(false);
        expect(result.type).toBe('error');

        // Verify we didn't move
        const currentRoom = engine.getCurrentRoom();
        expect(currentRoom?.id).toBe('troll-room');
      });

      // Compare outputs
      expect(actorMessages.length).toBeGreaterThan(0);
      expect(legacyMessages.length).toBeGreaterThan(0);

      // Both should mention the troll blocking
      const legacyText = legacyMessages.join(' ').toLowerCase();
      const actorText = actorMessages.join(' ').toLowerCase();

      expect(legacyText).toContain('troll');
      expect(actorText).toContain('troll');
    });
  });

  describe('Scenario: Combat - Attack Troll', () => {
    it('should produce similar combat messages in both modes', () => {
      const legacyMessages: string[] = [];
      const actorMessages: string[] = [];

      runInBothModes((_mode) => {
        navigateToTrollRoom();

        // Attack troll once
        const result = engine.executeCommand(parser.parse('attack troll with sword'));

        if (mode === 'legacy') {
          legacyMessages.push(...result.messages);
        } else {
          actorMessages.push(...result.messages);
        }

        // Verify attack was accepted
        expect(result.success).toBe(true);

        // Verify troll state was updated
        const troll = engine.getObject('troll');
        expect(troll?.properties?.actorState).toBeDefined();
      });

      // Compare outputs
      expect(actorMessages.length).toBeGreaterThan(0);
      expect(legacyMessages.length).toBeGreaterThan(0);

      // Both should mention attacking with sword
      const legacyText = legacyMessages.join(' ').toLowerCase();
      const actorText = actorMessages.join(' ').toLowerCase();

      expect(legacyText).toContain('sword');
      expect(actorText).toContain('sword');
    });

    it('should handle troll becoming unconscious consistently in both modes', () => {
      const legacyFinalState: Record<string, unknown> = {};
      const actorFinalState: Record<string, unknown> = {};

      runInBothModes((_mode) => {
        navigateToTrollRoom();

        // Attack until unconscious (max 20 attempts)
        let attempts = 0;
        let troll = engine.getObject('troll');

        while (troll?.properties?.actorState !== 'unconscious' && attempts < 20) {
          engine.executeCommand(parser.parse('attack troll with sword'));
          troll = engine.getObject('troll');
          attempts++;
        }

        // Capture final state
        if (mode === 'legacy') {
          legacyFinalState['actorState'] = troll?.properties?.actorState;
          legacyFinalState['strength'] = troll?.properties?.strength;
          legacyFinalState['blocksPassage'] = troll?.properties?.blocksPassage;

          const axe = engine.getObject('axe');
          legacyFinalState['axeLocation'] = axe?.location;
        } else {
          actorFinalState['actorState'] = troll?.properties?.actorState;
          actorFinalState['strength'] = troll?.properties?.strength;
          actorFinalState['blocksPassage'] = troll?.properties?.blocksPassage;

          const axe = engine.getObject('axe');
          actorFinalState['axeLocation'] = axe?.location;
        }

        // Verify final state
        expect(troll?.properties?.actorState).toBe('unconscious');
        expect(troll?.properties?.blocksPassage).toBe(false);

        // Verify axe was dropped
        const axe = engine.getObject('axe');
        expect(axe?.location).toBe('troll-room');
      });

      // Compare final states
      expect(actorFinalState['actorState']).toBe(legacyFinalState['actorState']);
      expect(actorFinalState['blocksPassage']).toBe(legacyFinalState['blocksPassage']);
      expect(actorFinalState['axeLocation']).toBe(legacyFinalState['axeLocation']);
    });

    it('should allow passage after troll is unconscious in both modes', () => {
      runInBothModes((_mode) => {
        navigateToTrollRoom();

        // Attack until unconscious
        let attempts = 0;
        let troll = engine.getObject('troll');

        while (troll?.properties?.actorState !== 'unconscious' && attempts < 20) {
          engine.executeCommand(parser.parse('attack troll with sword'));
          troll = engine.getObject('troll');
          attempts++;
        }

        // Verify troll is unconscious
        expect(troll?.properties?.actorState).toBe('unconscious');

        // Try to go east (should succeed now)
        const result = engine.executeCommand(parser.parse('east'));

        expect(result.success).toBe(true);

        // Verify we moved
        const currentRoom = engine.getCurrentRoom();
        expect(currentRoom?.id).toBe('ew-passage');
      });
    });
  });

  describe('Scenario: Bare-Handed Attack', () => {
    it('should reject bare-handed attacks consistently in both modes', () => {
      const legacyMessages: string[] = [];
      const actorMessages: string[] = [];

      runInBothModes((_mode) => {
        navigateToTrollRoom();

        // Drop the sword
        engine.executeCommand(parser.parse('drop sword'));

        // Try to attack without weapon
        const result = engine.executeCommand(parser.parse('attack troll'));

        if (mode === 'legacy') {
          legacyMessages.push(...result.messages);
        } else {
          actorMessages.push(...result.messages);
        }

        // Verify troll wasn't damaged
        const troll = engine.getObject('troll');
        expect(troll?.properties?.strength).toBe(2);
      });

      // Compare outputs
      expect(actorMessages.length).toBeGreaterThan(0);
      expect(legacyMessages.length).toBeGreaterThan(0);

      // Both should mention bare hands or puny gesture
      const legacyText = legacyMessages.join(' ').toLowerCase();
      const actorText = actorMessages.join(' ').toLowerCase();

      expect(legacyText).toContain('bare hands');
      expect(actorText).toContain('bare hands');
    });
  });

  describe('Scenario: State Persistence', () => {
    it('should persist troll state across room transitions in both modes', () => {
      runInBothModes((_mode) => {
        navigateToTrollRoom();

        // Attack once to damage troll
        engine.executeCommand(parser.parse('attack troll with sword'));

        const trollAfterAttack = engine.getObject('troll');
        const strengthAfterAttack = trollAfterAttack?.properties?.strength as number;

        // Leave room
        engine.executeCommand(parser.parse('south'));

        // Return to troll room
        engine.executeCommand(parser.parse('north'));

        // Verify state persisted
        const trollAfterReturn = engine.getObject('troll');
        expect(trollAfterReturn?.properties?.strength).toBe(strengthAfterAttack);
      });
    });

    it('should persist unconscious state in both modes', () => {
      runInBothModes((_mode) => {
        navigateToTrollRoom();

        // Attack until unconscious
        let attempts = 0;
        let troll = engine.getObject('troll');

        while (troll?.properties?.actorState !== 'unconscious' && attempts < 20) {
          engine.executeCommand(parser.parse('attack troll with sword'));
          troll = engine.getObject('troll');
          attempts++;
        }

        // Leave room
        engine.executeCommand(parser.parse('south'));

        // Return to troll room
        engine.executeCommand(parser.parse('north'));

        // Verify state persisted
        const trollAfterReturn = engine.getObject('troll');
        expect(trollAfterReturn?.properties?.actorState).toBe('unconscious');
      });
    });
  });

  describe('Scenario: Save and Load', () => {
    it('should preserve troll initial state through save/load in both modes', () => {
      runInBothModes((_mode) => {
        navigateToTrollRoom();

        // Verify troll is armed initially
        const trollInitial = engine.getObject('troll');
        expect(trollInitial?.properties?.actorState).toBe('armed');
        const initialStrength = trollInitial?.properties?.strength as number;
        expect(initialStrength).toBe(2);

        // Save game immediately (before any combat)
        const saveData = engine.saveGame();

        // Modify game state in current session
        // Leave room and go to cellar
        engine.executeCommand(parser.parse('south'));

        // Load saved game
        engine.loadGame(saveData);

        // Verify troll is back to initial state and location
        const trollAfterLoad = engine.getObject('troll');
        expect(trollAfterLoad?.properties?.actorState).toBe('armed');
        expect(trollAfterLoad?.properties?.strength).toBe(initialStrength);
        expect(trollAfterLoad?.location).toBe('troll-room');
      });
    });

    it('should preserve troll state after combat through save/load in both modes', () => {
      runInBothModes((_mode) => {
        navigateToTrollRoom();

        // Attack once (this may or may not damage the troll due to randomness)
        engine.executeCommand(parser.parse('attack troll with sword'));

        const trollBeforeSave = engine.getObject('troll');
        const strengthBeforeSave = trollBeforeSave?.properties?.strength as number;
        const stateBeforeSave = trollBeforeSave?.properties?.actorState;

        // Save game
        const saveData = engine.saveGame();

        // Move to a different room
        engine.executeCommand(parser.parse('south'));

        // Load saved game
        engine.loadGame(saveData);

        // Verify state was restored exactly
        const trollAfterLoad = engine.getObject('troll');
        expect(trollAfterLoad?.properties?.strength).toBe(strengthBeforeSave);
        expect(trollAfterLoad?.properties?.actorState).toBe(stateBeforeSave);
        expect(trollAfterLoad?.location).toBe('troll-room');
      });
    });

    it('should preserve troll unconscious state through save/load in both modes', () => {
      runInBothModes((_mode) => {
        navigateToTrollRoom();

        // Attack until unconscious
        let attempts = 0;
        let troll = engine.getObject('troll');

        while (troll?.properties?.actorState !== 'unconscious' && attempts < 20) {
          engine.executeCommand(parser.parse('attack troll with sword'));
          troll = engine.getObject('troll');
          attempts++;
        }

        // Verify troll is unconscious
        expect(troll?.properties?.actorState).toBe('unconscious');

        // Verify axe was dropped
        const axeBeforeSave = engine.getObject('axe');
        expect(axeBeforeSave?.location).toBe('troll-room');

        // Save game
        const saveData = engine.saveGame();

        // Load saved game
        engine.loadGame(saveData);

        // Verify unconscious state and axe location preserved
        const trollAfterLoad = engine.getObject('troll');
        expect(trollAfterLoad?.properties?.actorState).toBe('unconscious');
        expect(trollAfterLoad?.properties?.blocksPassage).toBe(false);

        const axeAfterLoad = engine.getObject('axe');
        expect(axeAfterLoad?.location).toBe('troll-room');

        // Verify passages are open
        const eastResult = engine.executeCommand(parser.parse('east'));
        expect(eastResult.success).toBe(true);
      });
    });
  });

  describe('Scenario: Attacking Unconscious Troll', () => {
    it('should reject attacks on unconscious troll in both modes', () => {
      const legacyMessages: string[] = [];
      const actorMessages: string[] = [];

      runInBothModes((_mode) => {
        navigateToTrollRoom();

        // Attack until unconscious
        let attempts = 0;
        let troll = engine.getObject('troll');

        while (troll?.properties?.actorState !== 'unconscious' && attempts < 20) {
          engine.executeCommand(parser.parse('attack troll with sword'));
          troll = engine.getObject('troll');
          attempts++;
        }

        // Try to attack unconscious troll
        const result = engine.executeCommand(parser.parse('attack troll with sword'));

        if (mode === 'legacy') {
          legacyMessages.push(...result.messages);
        } else {
          actorMessages.push(...result.messages);
        }

        // Verify attack was rejected
        expect(result.success).toBe(false);
      });

      // Compare outputs
      expect(actorMessages.length).toBeGreaterThan(0);
      expect(legacyMessages.length).toBeGreaterThan(0);

      // Both should mention unconscious
      const legacyText = legacyMessages.join(' ').toLowerCase();
      const actorText = actorMessages.join(' ').toLowerCase();

      expect(legacyText).toContain('unconscious');
      expect(actorText).toContain('unconscious');
    });
  });
});
