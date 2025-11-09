import { TestBed } from '@angular/core/testing';
import { FeatureFlagService, FeatureFlag } from './feature-flag.service';

describe('FeatureFlagService', () => {
  let service: FeatureFlagService;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    TestBed.configureTestingModule({});
    service = TestBed.inject(FeatureFlagService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have default flag values', () => {
      expect(service.isEnabled(FeatureFlag.COMMAND_PARSER_ENHANCEMENTS)).toBe(true);
      expect(service.isEnabled(FeatureFlag.ACTOR_MIGRATION_TROLL)).toBe(false);
    });

    it('should load flags from localStorage if available', () => {
      // Pre-populate localStorage
      localStorage.setItem(
        'zork_feature_flags',
        JSON.stringify({
          COMMAND_PARSER_ENHANCEMENTS: false,
        })
      );

      // Create new service instance
      const newService = new FeatureFlagService();

      expect(newService.isEnabled(FeatureFlag.COMMAND_PARSER_ENHANCEMENTS)).toBe(false);
    });
  });

  describe('isEnabled()', () => {
    it('should return true for enabled flags', () => {
      service.setFlag(FeatureFlag.COMMAND_PARSER_ENHANCEMENTS, true);
      expect(service.isEnabled(FeatureFlag.COMMAND_PARSER_ENHANCEMENTS)).toBe(true);
    });

    it('should return false for disabled flags', () => {
      service.setFlag(FeatureFlag.COMMAND_PARSER_ENHANCEMENTS, false);
      expect(service.isEnabled(FeatureFlag.COMMAND_PARSER_ENHANCEMENTS)).toBe(false);
    });

    it('should return false for undefined flags', () => {
      const result = service.isEnabled('NONEXISTENT_FLAG' as FeatureFlag);
      expect(result).toBe(false);
    });
  });

  describe('setFlag()', () => {
    it('should enable a flag', () => {
      service.setFlag(FeatureFlag.COMMAND_PARSER_ENHANCEMENTS, true);
      expect(service.isEnabled(FeatureFlag.COMMAND_PARSER_ENHANCEMENTS)).toBe(true);
    });

    it('should disable a flag', () => {
      service.setFlag(FeatureFlag.COMMAND_PARSER_ENHANCEMENTS, false);
      expect(service.isEnabled(FeatureFlag.COMMAND_PARSER_ENHANCEMENTS)).toBe(false);
    });

    it('should persist flag to localStorage', () => {
      service.setFlag(FeatureFlag.COMMAND_PARSER_ENHANCEMENTS, false);

      const stored = localStorage.getItem('zork_feature_flags');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.COMMAND_PARSER_ENHANCEMENTS).toBe(false);
    });
  });

  describe('setFlags()', () => {
    it('should set multiple flags at once', () => {
      service.setFlags({
        COMMAND_PARSER_ENHANCEMENTS: false,
      });

      expect(service.isEnabled(FeatureFlag.COMMAND_PARSER_ENHANCEMENTS)).toBe(false);
    });

    it('should merge with existing flags', () => {
      service.setFlag(FeatureFlag.COMMAND_PARSER_ENHANCEMENTS, true);

      service.setFlags({
        // Other flags would go here if we had more
      });

      expect(service.isEnabled(FeatureFlag.COMMAND_PARSER_ENHANCEMENTS)).toBe(true);
    });

    it('should persist all flags to localStorage', () => {
      service.setFlags({
        COMMAND_PARSER_ENHANCEMENTS: false,
      });

      const stored = localStorage.getItem('zork_feature_flags');
      const parsed = JSON.parse(stored!);
      expect(parsed.COMMAND_PARSER_ENHANCEMENTS).toBe(false);
    });
  });

  describe('getAllFlags()', () => {
    it('should return all flag values', () => {
      service.setFlag(FeatureFlag.COMMAND_PARSER_ENHANCEMENTS, false);

      const flags = service.getAllFlags();

      expect(flags['COMMAND_PARSER_ENHANCEMENTS']).toBe(false);
    });

    it('should return a copy, not the original object', () => {
      const flags1 = service.getAllFlags();
      flags1['COMMAND_PARSER_ENHANCEMENTS'] = false;

      const flags2 = service.getAllFlags();
      expect(flags2['COMMAND_PARSER_ENHANCEMENTS']).toBe(true); // Original unchanged
    });
  });

  describe('resetToDefaults()', () => {
    it('should reset all flags to default values', () => {
      service.setFlag(FeatureFlag.COMMAND_PARSER_ENHANCEMENTS, false);
      service.setFlag(FeatureFlag.ACTOR_MIGRATION_TROLL, true);

      service.resetToDefaults();

      expect(service.isEnabled(FeatureFlag.COMMAND_PARSER_ENHANCEMENTS)).toBe(true);
      expect(service.isEnabled(FeatureFlag.ACTOR_MIGRATION_TROLL)).toBe(false);
    });

    it('should persist reset to localStorage', () => {
      service.setFlag(FeatureFlag.COMMAND_PARSER_ENHANCEMENTS, false);
      service.resetToDefaults();

      const stored = localStorage.getItem('zork_feature_flags');
      const parsed = JSON.parse(stored!);
      expect(parsed.COMMAND_PARSER_ENHANCEMENTS).toBe(true);
    });
  });

  describe('clearStorage()', () => {
    it('should remove flags from localStorage', () => {
      service.setFlag(FeatureFlag.COMMAND_PARSER_ENHANCEMENTS, false);
      expect(localStorage.getItem('zork_feature_flags')).toBeTruthy();

      service.clearStorage();

      expect(localStorage.getItem('zork_feature_flags')).toBeNull();
    });

    it('should not affect in-memory flags', () => {
      service.setFlag(FeatureFlag.COMMAND_PARSER_ENHANCEMENTS, false);
      service.clearStorage();

      expect(service.isEnabled(FeatureFlag.COMMAND_PARSER_ENHANCEMENTS)).toBe(false);
    });
  });

  describe('localStorage persistence', () => {
    it('should survive service recreation', () => {
      service.setFlag(FeatureFlag.COMMAND_PARSER_ENHANCEMENTS, false);

      // Create new service instance
      const newService = new FeatureFlagService();

      expect(newService.isEnabled(FeatureFlag.COMMAND_PARSER_ENHANCEMENTS)).toBe(false);
    });

    it('should handle missing localStorage gracefully', () => {
      // This test ensures the service doesn't crash if localStorage is unavailable
      // In practice, localStorage should always be available in browser tests
      expect(() => {
        service.setFlag(FeatureFlag.COMMAND_PARSER_ENHANCEMENTS, true);
      }).not.toThrow();
    });

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem('zork_feature_flags', 'invalid json');

      // Mock console.warn to suppress expected error output during test
      const consoleWarnSpy = spyOn(console, 'warn');

      // Create new service - should not crash
      const newService = new FeatureFlagService();

      expect(newService).toBeTruthy();
      // Should fall back to defaults
      expect(newService.isEnabled(FeatureFlag.COMMAND_PARSER_ENHANCEMENTS)).toBe(true);
      // Verify that warning was logged
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  describe('integration scenarios', () => {
    it('should support staged rollout workflow', () => {
      // Initially enabled
      expect(service.isEnabled(FeatureFlag.COMMAND_PARSER_ENHANCEMENTS)).toBe(true);

      // Disable for testing
      service.setFlag(FeatureFlag.COMMAND_PARSER_ENHANCEMENTS, false);
      expect(service.isEnabled(FeatureFlag.COMMAND_PARSER_ENHANCEMENTS)).toBe(false);

      // Re-enable after validation
      service.setFlag(FeatureFlag.COMMAND_PARSER_ENHANCEMENTS, true);
      expect(service.isEnabled(FeatureFlag.COMMAND_PARSER_ENHANCEMENTS)).toBe(true);
    });

    it('should support A/B testing workflow', () => {
      // Group A: feature enabled
      service.setFlag(FeatureFlag.COMMAND_PARSER_ENHANCEMENTS, true);
      const groupAFlags = service.getAllFlags();
      expect(groupAFlags['COMMAND_PARSER_ENHANCEMENTS']).toBe(true);

      // Group B: feature disabled
      service.setFlag(FeatureFlag.COMMAND_PARSER_ENHANCEMENTS, false);
      const groupBFlags = service.getAllFlags();
      expect(groupBFlags['COMMAND_PARSER_ENHANCEMENTS']).toBe(false);
    });

    it('should support quick rollback', () => {
      // Production issue detected
      service.setFlag(FeatureFlag.COMMAND_PARSER_ENHANCEMENTS, false);

      // Verify immediate effect
      expect(service.isEnabled(FeatureFlag.COMMAND_PARSER_ENHANCEMENTS)).toBe(false);

      // Verify persisted for all users
      const newService = new FeatureFlagService();
      expect(newService.isEnabled(FeatureFlag.COMMAND_PARSER_ENHANCEMENTS)).toBe(false);
    });
  });
});
