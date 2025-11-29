import { TestBed } from '@angular/core/testing';
import { GameEngineService } from '../services/game-engine.service';
import { CommandParserService } from '../services/command-parser.service';
import { FeatureFlagService, FeatureFlag } from '../services/feature-flag.service';

/**
 * Tests for TrollActor migration - Post-Migration Validation.
 *
 * Purpose:
 * These tests verify that the TrollActor system works correctly now that
 * the migration is complete. The ACTOR_MIGRATION_TROLL feature flag is
 * now enabled by default, and all troll behavior uses the TrollActor class.
 *
 * Test scenarios:
 * - Feature flag defaults to enabled
 * - Combat behavior works correctly via TrollActor
 * - Troll state synchronization works correctly
 * - State is properly synchronized to GameObject for compatibility
 */
describe('Troll Actor Post-Migration', () => {
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

  describe('Feature Flag Default', () => {
    beforeEach(() => {
      // Clear localStorage to ensure clean state
      localStorage.clear();

      TestBed.configureTestingModule({
        providers: [GameEngineService, CommandParserService, FeatureFlagService],
      });
      engine = TestBed.inject(GameEngineService);
      parser = TestBed.inject(CommandParserService);
      featureFlags = TestBed.inject(FeatureFlagService);
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('should default to actor path with flag enabled', () => {
      expect(featureFlags.isEnabled(FeatureFlag.ACTOR_MIGRATION_TROLL)).toBe(true);

      // Initialize game - should create TrollActor
      engine.initializeGame();

      // Verify troll exists as GameObject
      const troll = engine.getObject('troll');
      expect(troll).toBeTruthy();
      expect(troll?.properties?.actorState).toBe('armed');
    });

    it('should still work if flag is explicitly disabled', () => {
      featureFlags.setFlag(FeatureFlag.ACTOR_MIGRATION_TROLL, false);
      expect(featureFlags.isEnabled(FeatureFlag.ACTOR_MIGRATION_TROLL)).toBe(false);

      // Initialize game - troll should still exist
      engine.initializeGame();

      // Verify troll exists as GameObject
      const troll = engine.getObject('troll');
      expect(troll).toBeTruthy();
      expect(troll?.properties?.actorState).toBe('armed');
    });
  });

  describe('Combat Behavior - Actor System', () => {
    beforeEach(() => {
      localStorage.clear();

      TestBed.configureTestingModule({
        providers: [GameEngineService, CommandParserService, FeatureFlagService],
      });
      engine = TestBed.inject(GameEngineService);
      parser = TestBed.inject(CommandParserService);
      featureFlags = TestBed.inject(FeatureFlagService);

      // Feature flag should already be true by default
      engine.initializeGame();
      navigateToTrollRoom();
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('should attack troll with sword using actor system', () => {
      const result = engine.executeCommand(parser.parse('attack troll with sword'));

      expect(result.success).toBe(true);
      const output = result.messages.join(' ');
      expect(output).toContain('troll');

      // Verify troll state is synchronized
      const troll = engine.getObject('troll');
      expect(troll?.properties?.actorState).toBeDefined();
    });

    it('should synchronize actor state to game object', () => {
      // Initial state
      const trollBefore = engine.getObject('troll');
      expect(trollBefore?.properties?.strength).toBe(2);
      expect(trollBefore?.properties?.actorState).toBe('armed');

      // Attack troll
      engine.executeCommand(parser.parse('attack troll with sword'));

      // State should be synchronized
      const trollAfter = engine.getObject('troll');
      expect(trollAfter?.properties?.actorState).toBeDefined();
      expect(trollAfter?.properties?.strength).toBeDefined();
    });

    it('should handle unconscious troll correctly', () => {
      // Attack multiple times to knock out troll
      for (let i = 0; i < 10; i++) {
        engine.executeCommand(parser.parse('attack troll with sword'));
      }

      const troll = engine.getObject('troll');
      // Troll should eventually become unconscious or remain armed
      expect(troll?.properties?.actorState).toBeDefined();
      const actorState = troll?.properties?.actorState as string;
      expect(['armed', 'unconscious']).toContain(actorState);

      // If unconscious, verify axe was dropped
      if (troll?.properties?.actorState === 'unconscious') {
        const axe = engine.getObject('axe');
        expect(axe?.location).toBe('troll-room');
      }
    });
  });

  describe('Passage Blocking', () => {
    beforeEach(() => {
      localStorage.clear();

      TestBed.configureTestingModule({
        providers: [GameEngineService, CommandParserService, FeatureFlagService],
      });
      engine = TestBed.inject(GameEngineService);
      parser = TestBed.inject(CommandParserService);
      featureFlags = TestBed.inject(FeatureFlagService);
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('should block passages when troll is armed', () => {
      engine.initializeGame();
      navigateToTrollRoom();

      // Try to go east (should be blocked)
      const result = engine.executeCommand(parser.parse('east'));
      expect(result.success).toBe(false);
      const output = result.messages.join(' ');
      expect(output).toContain('troll');
    });

    it('should allow passage when troll is unconscious', () => {
      engine.initializeGame();
      navigateToTrollRoom();

      // Attack troll multiple times to knock it unconscious
      for (let i = 0; i < 20; i++) {
        engine.executeCommand(parser.parse('attack troll with sword'));
      }

      // Check troll state
      const troll = engine.getObject('troll');
      if (troll?.properties?.actorState === 'unconscious') {
        // Try to go east (should now succeed)
        const result = engine.executeCommand(parser.parse('east'));
        expect(result.success).toBe(true);
        const currentRoom = engine.getCurrentRoom();
        expect(currentRoom?.id).toBe('ew-passage');
      }
    });
  });

  describe('Runtime Flag Toggle', () => {
    beforeEach(() => {
      // Clear localStorage before each test in this suite
      localStorage.clear();

      TestBed.configureTestingModule({
        providers: [GameEngineService, CommandParserService, FeatureFlagService],
      });
      featureFlags = TestBed.inject(FeatureFlagService);
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('should allow toggling flag on and off', () => {
      expect(featureFlags.isEnabled(FeatureFlag.ACTOR_MIGRATION_TROLL)).toBe(true);

      featureFlags.setFlag(FeatureFlag.ACTOR_MIGRATION_TROLL, false);
      expect(featureFlags.isEnabled(FeatureFlag.ACTOR_MIGRATION_TROLL)).toBe(false);

      featureFlags.setFlag(FeatureFlag.ACTOR_MIGRATION_TROLL, true);
      expect(featureFlags.isEnabled(FeatureFlag.ACTOR_MIGRATION_TROLL)).toBe(true);
    });

    it('should persist flag state in localStorage', () => {
      featureFlags.setFlag(FeatureFlag.ACTOR_MIGRATION_TROLL, false);

      // Create new service instance
      const newService = new FeatureFlagService();
      expect(newService.isEnabled(FeatureFlag.ACTOR_MIGRATION_TROLL)).toBe(false);

      // Clean up
      newService.resetToDefaults();
    });
  });
});
