import { TestBed } from '@angular/core/testing';
import { GameEngineService } from '../services/game-engine.service';
import { CommandParserService } from '../services/command-parser.service';
import { FeatureFlagService } from '../services/feature-flag.service';
import { RandomService } from '../services/random.service';

/**
 * Deterministic seed for random number generator.
 * Ensures consistent combat outcomes across test runs.
 */
const DETERMINISTIC_SEED = 12345;

/**
 * Integration tests for TrollActor behavior.
 *
 * Purpose:
 * These tests verify that the TrollActor implementation produces correct
 * user-visible outputs and state changes. The troll migration is complete,
 * so all tests now use the actor-based system exclusively.
 *
 * Test Scenarios:
 * - Blocked crossing (east and west passages)
 * - Combat mechanics and state transitions
 * - Save and load with troll state preservation
 * - Output message consistency
 */
describe('Troll Integration Tests', () => {
  let engine: GameEngineService;
  let parser: CommandParserService;

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
   * Helper to set up the test environment with deterministic random seed.
   */
  function setupTest(): void {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [GameEngineService, CommandParserService, FeatureFlagService, RandomService],
    });
    engine = TestBed.inject(GameEngineService);
    parser = TestBed.inject(CommandParserService);
    const randomService = TestBed.inject(RandomService);
    randomService.setSeed(DETERMINISTIC_SEED);
    engine.initializeGame();
  }

  afterEach(() => {
    localStorage.clear();
  });

  describe('Scenario: Blocked Crossing - East Passage', () => {
    it('should block east passage when troll is armed', () => {
      setupTest();
      navigateToTrollRoom();

      // Try to go east (should be blocked)
      const result = engine.executeCommand(parser.parse('east'));

      // Verify blocking behavior
      expect(result.success).toBe(false);
      expect(result.type).toBe('error');

      // Verify we didn't move
      const currentRoom = engine.getCurrentRoom();
      expect(currentRoom?.id).toBe('troll-room');

      // Should mention troll blocking
      const text = result.messages.join(' ').toLowerCase();
      expect(text).toContain('troll');
    });
  });

  describe('Scenario: Blocked Crossing - West Passage', () => {
    it('should block west passage when troll is armed', () => {
      setupTest();
      navigateToTrollRoom();

      // Try to go west (should be blocked)
      const result = engine.executeCommand(parser.parse('west'));

      // Verify blocking behavior
      expect(result.success).toBe(false);
      expect(result.type).toBe('error');

      // Verify we didn't move
      const currentRoom = engine.getCurrentRoom();
      expect(currentRoom?.id).toBe('troll-room');

      // Should mention troll blocking
      const text = result.messages.join(' ').toLowerCase();
      expect(text).toContain('troll');
    });
  });

  describe('Scenario: Combat - Attack Troll', () => {
    it('should produce combat messages when attacking with sword', () => {
      setupTest();
      navigateToTrollRoom();

      // Attack troll once
      const result = engine.executeCommand(parser.parse('attack troll with sword'));

      // Verify attack was accepted
      expect(result.success).toBe(true);

      // Verify troll state was updated
      const troll = engine.getObject('troll');
      expect(troll?.properties?.actorState).toBeDefined();

      // Should mention sword
      const text = result.messages.join(' ').toLowerCase();
      expect(text).toContain('sword');
    });

    it('should handle troll becoming unconscious correctly', () => {
      setupTest();
      navigateToTrollRoom();

      // Attack until unconscious (max 20 attempts)
      let attempts = 0;
      let troll = engine.getObject('troll');

      while (troll?.properties?.actorState !== 'unconscious' && attempts < 20) {
        engine.executeCommand(parser.parse('attack troll with sword'));
        troll = engine.getObject('troll');
        attempts++;
      }

      // Verify final state
      expect(troll?.properties?.actorState).toBe('unconscious');
      expect(troll?.properties?.blocksPassage).toBe(false);

      // Verify axe was dropped
      const axe = engine.getObject('axe');
      expect(axe?.location).toBe('troll-room');
    });

    it('should allow passage after troll is unconscious', () => {
      setupTest();
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

  describe('Scenario: Bare-Handed Attack', () => {
    it('should reject bare-handed attacks', () => {
      setupTest();
      navigateToTrollRoom();

      // Drop the sword
      engine.executeCommand(parser.parse('drop sword'));

      // Try to attack without weapon
      const result = engine.executeCommand(parser.parse('attack troll'));

      // Verify troll wasn't damaged
      const troll = engine.getObject('troll');
      expect(troll?.properties?.strength).toBe(2);

      // Should mention bare hands
      const text = result.messages.join(' ').toLowerCase();
      expect(text).toContain('bare hands');
    });
  });

  describe('Scenario: State Persistence', () => {
    it('should persist troll state across room transitions', () => {
      setupTest();
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

    it('should persist unconscious state across room transitions', () => {
      setupTest();
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

  describe('Scenario: Save and Load', () => {
    it('should preserve troll initial state through save/load', () => {
      setupTest();
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

    it('should preserve troll state after combat through save/load', () => {
      setupTest();
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

    it('should preserve troll unconscious state through save/load', () => {
      setupTest();
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

  describe('Scenario: Attacking Unconscious Troll', () => {
    it('should reject attacks on unconscious troll', () => {
      setupTest();
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

      // Verify attack was rejected
      expect(result.success).toBe(false);

      // Should mention unconscious
      const text = result.messages.join(' ').toLowerCase();
      expect(text).toContain('unconscious');
    });
  });
});
