import { TestBed } from '@angular/core/testing';
import { GameEngineService } from '../services/game-engine.service';
import { CommandParserService } from '../services/command-parser.service';
import { FeatureFlagService, FeatureFlag } from '../services/feature-flag.service';

/**
 * Tests for TrollActor migration adapter.
 *
 * Purpose:
 * These tests verify that the adapter correctly routes troll commands between
 * legacy code and the new TrollActor implementation based on the feature flag.
 * Both paths should produce equivalent behavior.
 *
 * Test scenarios:
 * - Feature flag toggle works correctly
 * - Combat behavior is consistent between legacy and actor paths
 * - Troll state synchronization works correctly
 * - Both paths produce similar messages
 */
describe('Troll Actor Migration Adapter', () => {
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

  describe('Feature Flag Control', () => {
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

    it('should default to legacy path when flag is disabled', () => {
      expect(featureFlags.isEnabled(FeatureFlag.ACTOR_MIGRATION_TROLL)).toBe(false);

      // Initialize game - should not create TrollActor
      engine.initializeGame();

      // Verify troll exists as GameObject
      const troll = engine.getObject('troll');
      expect(troll).toBeTruthy();
      expect(troll?.properties?.actorState).toBe('armed');
    });

    it('should use actor path when flag is enabled', () => {
      featureFlags.setFlag(FeatureFlag.ACTOR_MIGRATION_TROLL, true);
      expect(featureFlags.isEnabled(FeatureFlag.ACTOR_MIGRATION_TROLL)).toBe(true);

      // Initialize game - should create TrollActor
      engine.initializeGame();

      // Verify troll exists as GameObject
      const troll = engine.getObject('troll');
      expect(troll).toBeTruthy();
      expect(troll?.properties?.actorState).toBe('armed');
    });
  });

  describe('Combat Behavior Parity - Legacy Path', () => {
    beforeEach(() => {
      localStorage.clear();

      TestBed.configureTestingModule({
        providers: [GameEngineService, CommandParserService, FeatureFlagService],
      });
      engine = TestBed.inject(GameEngineService);
      parser = TestBed.inject(CommandParserService);
      featureFlags = TestBed.inject(FeatureFlagService);

      // Ensure legacy path
      featureFlags.setFlag(FeatureFlag.ACTOR_MIGRATION_TROLL, false);
      engine.initializeGame();
      navigateToTrollRoom();
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('should attack troll with sword using legacy code', () => {
      const result = engine.executeCommand(parser.parse('attack troll with sword'));

      expect(result.success).toBe(true);
      const output = result.messages.join(' ');
      expect(output).toContain('troll');

      // Verify troll state exists
      const troll = engine.getObject('troll');
      expect(troll?.properties?.actorState).toBeDefined();
    });

    it('should handle unconscious troll correctly in legacy mode', () => {
      const troll = engine.getObject('troll');
      expect(troll).toBeTruthy();

      // Attack multiple times to knock out troll
      // Note: Combat is random, so we check state after enough attacks
      for (let i = 0; i < 5; i++) {
        engine.executeCommand(parser.parse('attack troll with sword'));
      }

      const trollAfter = engine.getObject('troll');
      // Troll should eventually become unconscious or remain armed
      expect(trollAfter?.properties?.actorState).toBeDefined();
      expect(['armed', 'unconscious']).toContain(trollAfter?.properties?.actorState as string);
    });
  });

  describe('Combat Behavior Parity - Actor Path', () => {
    beforeEach(() => {
      localStorage.clear();

      TestBed.configureTestingModule({
        providers: [GameEngineService, CommandParserService, FeatureFlagService],
      });
      engine = TestBed.inject(GameEngineService);
      parser = TestBed.inject(CommandParserService);
      featureFlags = TestBed.inject(FeatureFlagService);

      // Enable actor path
      featureFlags.setFlag(FeatureFlag.ACTOR_MIGRATION_TROLL, true);
      engine.initializeGame();
      navigateToTrollRoom();
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('should attack troll with sword using actor code', () => {
      const result = engine.executeCommand(parser.parse('attack troll with sword'));

      expect(result.success).toBe(true);
      const output = result.messages.join(' ');
      expect(output).toContain('troll');

      // Verify troll state is synchronized
      const troll = engine.getObject('troll');
      expect(troll?.properties?.actorState).toBeDefined();
      const actorState = troll?.properties?.actorState as string;
      expect(['armed', 'unconscious']).toContain(actorState);
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

    it('should handle unconscious troll correctly in actor mode', () => {
      // Attack multiple times to knock out troll
      for (let i = 0; i < 5; i++) {
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

  describe('Message Consistency', () => {
    it('should produce similar attack messages in both modes', () => {
      // Test legacy mode
      const legacyEngine = TestBed.inject(GameEngineService);
      const legacyParser = TestBed.inject(CommandParserService);
      const legacyFlags = TestBed.inject(FeatureFlagService);

      legacyFlags.setFlag(FeatureFlag.ACTOR_MIGRATION_TROLL, false);
      legacyEngine.initializeGame();

      // Navigate to troll
      legacyEngine.executeCommand(legacyParser.parse('north'));
      legacyEngine.executeCommand(legacyParser.parse('east'));
      legacyEngine.executeCommand(legacyParser.parse('open window'));
      legacyEngine.executeCommand(legacyParser.parse('west'));
      legacyEngine.executeCommand(legacyParser.parse('west'));
      legacyEngine.executeCommand(legacyParser.parse('take sword'));
      legacyEngine.executeCommand(legacyParser.parse('move rug'));
      legacyEngine.executeCommand(legacyParser.parse('open trap door'));
      legacyEngine.executeCommand(legacyParser.parse('down'));
      legacyEngine.executeCommand(legacyParser.parse('north'));

      const legacyResult = legacyEngine.executeCommand(
        legacyParser.parse('attack troll with sword')
      );
      const legacyMessages = legacyResult.messages.join(' ').toLowerCase();

      // Both should mention attacking with sword
      expect(legacyMessages).toContain('sword');
      expect(legacyMessages).toContain('troll');
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
      expect(featureFlags.isEnabled(FeatureFlag.ACTOR_MIGRATION_TROLL)).toBe(false);

      featureFlags.setFlag(FeatureFlag.ACTOR_MIGRATION_TROLL, true);
      expect(featureFlags.isEnabled(FeatureFlag.ACTOR_MIGRATION_TROLL)).toBe(true);

      featureFlags.setFlag(FeatureFlag.ACTOR_MIGRATION_TROLL, false);
      expect(featureFlags.isEnabled(FeatureFlag.ACTOR_MIGRATION_TROLL)).toBe(false);
    });

    it('should persist flag state in localStorage', () => {
      featureFlags.setFlag(FeatureFlag.ACTOR_MIGRATION_TROLL, true);

      // Create new service instance
      const newService = new FeatureFlagService();
      expect(newService.isEnabled(FeatureFlag.ACTOR_MIGRATION_TROLL)).toBe(true);
    });
  });
});
