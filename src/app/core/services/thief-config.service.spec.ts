import { TestBed } from '@angular/core/testing';
import { ThiefConfigService, ThiefParameters } from './thief-config.service';

describe('ThiefConfigService', () => {
  let service: ThiefConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ThiefConfigService],
    });
    service = TestBed.inject(ThiefConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Configuration Loading', () => {
    it('should load configuration from JSON', () => {
      const config = service.getConfig();
      expect(config).toBeDefined();
      expect(config.difficulties).toBeDefined();
      expect(config.difficulties.easy).toBeDefined();
      expect(config.difficulties.normal).toBeDefined();
      expect(config.difficulties.hard).toBeDefined();
    });

    it('should default to normal difficulty', () => {
      expect(service.getCurrentDifficulty()).toBe('normal');
    });

    it('should have valid thief parameters for all difficulties', () => {
      const difficulties: ('easy' | 'normal' | 'hard')[] = ['easy', 'normal', 'hard'];

      for (const diff of difficulties) {
        const params = service.getThiefParametersForDifficulty(diff);

        expect(params.strength).toBeGreaterThan(0);
        expect(params.maxStrength).toBeGreaterThanOrEqual(params.strength);
        expect(params.aggressiveness).toBeGreaterThanOrEqual(0);
        expect(params.aggressiveness).toBeLessThanOrEqual(1);
        expect(params.appearProbability).toBeGreaterThanOrEqual(0);
        expect(params.appearProbability).toBeLessThanOrEqual(1);
        expect(params.stealProbability).toBeGreaterThanOrEqual(0);
        expect(params.stealProbability).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Difficulty Modes', () => {
    it('should retrieve easy mode parameters', () => {
      const params = service.getThiefParametersForDifficulty('easy');

      expect(params).toBeDefined();
      expect(params.strength).toBeLessThanOrEqual(
        service.getThiefParametersForDifficulty('normal').strength
      );
      expect(params.aggressiveness).toBeLessThanOrEqual(
        service.getThiefParametersForDifficulty('normal').aggressiveness
      );
    });

    it('should retrieve normal mode parameters', () => {
      const params = service.getThiefParametersForDifficulty('normal');

      expect(params).toBeDefined();
      expect(params.strength).toBe(5); // Legacy default
    });

    it('should retrieve hard mode parameters', () => {
      const params = service.getThiefParametersForDifficulty('hard');

      expect(params).toBeDefined();
      expect(params.strength).toBeGreaterThanOrEqual(
        service.getThiefParametersForDifficulty('normal').strength
      );
      expect(params.aggressiveness).toBeGreaterThanOrEqual(
        service.getThiefParametersForDifficulty('normal').aggressiveness
      );
    });

    it('should list all difficulty modes', () => {
      const modes = service.getDifficultyModes();

      expect(modes.length).toBe(3);
      expect(modes.map((m) => m.key)).toEqual(['easy', 'normal', 'hard']);

      for (const mode of modes) {
        expect(mode.name).toBeTruthy();
        expect(mode.description).toBeTruthy();
      }
    });

    it('should switch to easy difficulty', () => {
      service.setDifficulty('easy');

      expect(service.getCurrentDifficulty()).toBe('easy');
      const params = service.getThiefParameters();
      expect(params.strength).toBeLessThanOrEqual(5);
    });

    it('should switch to hard difficulty', () => {
      service.setDifficulty('hard');

      expect(service.getCurrentDifficulty()).toBe('hard');
      const params = service.getThiefParameters();
      expect(params.strength).toBeGreaterThanOrEqual(5);
    });

    it('should throw error for invalid difficulty', () => {
      expect(() => {
        service.setDifficulty('invalid' as 'easy');
      }).toThrowError('Invalid difficulty mode: invalid');
    });
  });

  describe('Current Difficulty Parameters', () => {
    it('should return parameters for current difficulty', () => {
      service.setDifficulty('easy');
      const easyParams = service.getThiefParameters();

      service.setDifficulty('hard');
      const hardParams = service.getThiefParameters();

      expect(hardParams.strength).toBeGreaterThan(easyParams.strength);
      expect(hardParams.aggressiveness).toBeGreaterThan(easyParams.aggressiveness);
    });

    it('should update parameters when difficulty changes', () => {
      const normalParams = service.getThiefParameters();

      service.setDifficulty('easy');
      const easyParams = service.getThiefParameters();

      expect(easyParams.strength).not.toBe(normalParams.strength);
    });
  });

  describe('Thief Parameter Properties', () => {
    let params: ThiefParameters;

    beforeEach(() => {
      params = service.getThiefParameters();
    });

    it('should have valid strength values', () => {
      expect(params.strength).toBeGreaterThan(0);
      expect(params.maxStrength).toBeGreaterThanOrEqual(params.strength);
    });

    it('should have valid probability values', () => {
      expect(params.appearProbability).toBeGreaterThanOrEqual(0);
      expect(params.appearProbability).toBeLessThanOrEqual(1);

      expect(params.stealProbability).toBeGreaterThanOrEqual(0);
      expect(params.stealProbability).toBeLessThanOrEqual(1);

      expect(params.combatHitProbability).toBeGreaterThanOrEqual(0);
      expect(params.combatHitProbability).toBeLessThanOrEqual(1);

      expect(params.tickMovementProbability).toBeGreaterThanOrEqual(0);
      expect(params.tickMovementProbability).toBeLessThanOrEqual(1);
    });

    it('should have valid aggressiveness value', () => {
      expect(params.aggressiveness).toBeGreaterThanOrEqual(0);
      expect(params.aggressiveness).toBeLessThanOrEqual(1);
    });

    it('should have positive engrossed duration', () => {
      expect(params.engrossedDuration).toBeGreaterThan(0);
    });

    it('should include all legacy PROB mappings', () => {
      expect(params.appearProbability).toBeDefined(); // PROB 30
      expect(params.stealProbability).toBeDefined(); // PROB 50
      expect(params.fleeWhenWeakProbability).toBeDefined(); // PROB 40
      expect(params.dropWorthlessProbability).toBeDefined(); // PROB 70
      expect(params.combatHitProbability).toBeDefined(); // PROB 60
      expect(params.combatCriticalHitProbability).toBeDefined(); // PROB 20
      expect(params.combatDisarmProbability).toBeDefined(); // PROB 15
      expect(params.tickMovementProbability).toBeDefined(); // PROB 70
      expect(params.depositBootyProbability).toBeDefined(); // PROB 80
    });

    it('should include legacy STRENGTH mapping', () => {
      expect(params.strength).toBeDefined();
      expect(params.maxStrength).toBeDefined();
    });
  });

  describe('Dev Mode and Config Reload', () => {
    it('should start with dev mode disabled', () => {
      expect(service.isDevMode()).toBe(false);
    });

    it('should enable dev mode', () => {
      service.setDevMode(true);
      expect(service.isDevMode()).toBe(true);
    });

    it('should disable dev mode', () => {
      service.setDevMode(true);
      service.setDevMode(false);
      expect(service.isDevMode()).toBe(false);
    });

    it('should throw error when reloading config without dev mode', () => {
      service.setDevMode(false);

      expect(() => {
        service.reloadConfig();
      }).toThrowError('Config reload is only available in dev mode');
    });

    it('should reload config when dev mode is enabled', () => {
      service.setDevMode(true);

      // Should not throw
      expect(() => {
        service.reloadConfig();
      }).not.toThrow();
    });

    it('should apply partial config updates in dev mode', () => {
      service.setDevMode(true);
      service.setDifficulty('normal');

      const originalStrength = service.getThiefParameters().strength;

      // Apply partial update
      service.reloadConfig({
        difficulties: {
          easy: service.getConfig().difficulties.easy,
          normal: {
            ...service.getConfig().difficulties.normal,
            thief: {
              ...service.getConfig().difficulties.normal.thief,
              strength: 10,
            },
          },
          hard: service.getConfig().difficulties.hard,
        },
      });

      const newStrength = service.getThiefParameters().strength;
      expect(newStrength).toBe(10);
      expect(newStrength).not.toBe(originalStrength);
    });

    it('should preserve current difficulty after reload', () => {
      service.setDevMode(true);
      service.setDifficulty('hard');

      service.reloadConfig();

      expect(service.getCurrentDifficulty()).toBe('hard');
    });

    it('should preserve current difficulty after reload', () => {
      service.setDevMode(true);
      service.setDifficulty('hard');

      // Reload with partial config update
      service.reloadConfig({
        devMode: true,
      });

      // Should maintain hard difficulty
      expect(service.getCurrentDifficulty()).toBe('hard');
    });
  });

  describe('Config Summary', () => {
    it('should generate a config summary', () => {
      const summary = service.getConfigSummary();

      expect(summary).toContain('Difficulty:');
      expect(summary).toContain('Dev Mode:');
      expect(summary).toContain('Thief Parameters:');
      expect(summary).toContain('Strength:');
      expect(summary).toContain('Aggressiveness:');
    });

    it('should show current difficulty in summary', () => {
      service.setDifficulty('easy');
      const summary = service.getConfigSummary();

      expect(summary).toContain('Easy');
    });

    it('should show dev mode status in summary', () => {
      service.setDevMode(true);
      const summary = service.getConfigSummary();

      expect(summary).toContain('Enabled');
    });

    it('should show percentages in summary', () => {
      const summary = service.getConfigSummary();

      expect(summary).toMatch(/\d+%/); // Should contain percentage values
    });
  });

  describe('Difficulty Progression', () => {
    it('should have increasing strength from easy to hard', () => {
      const easyStrength = service.getThiefParametersForDifficulty('easy').strength;
      const normalStrength = service.getThiefParametersForDifficulty('normal').strength;
      const hardStrength = service.getThiefParametersForDifficulty('hard').strength;

      expect(easyStrength).toBeLessThan(normalStrength);
      expect(normalStrength).toBeLessThan(hardStrength);
    });

    it('should have increasing aggressiveness from easy to hard', () => {
      const easyAggr = service.getThiefParametersForDifficulty('easy').aggressiveness;
      const normalAggr = service.getThiefParametersForDifficulty('normal').aggressiveness;
      const hardAggr = service.getThiefParametersForDifficulty('hard').aggressiveness;

      expect(easyAggr).toBeLessThan(normalAggr);
      expect(normalAggr).toBeLessThan(hardAggr);
    });

    it('should have increasing steal probability from easy to hard', () => {
      const easySteal = service.getThiefParametersForDifficulty('easy').stealProbability;
      const normalSteal = service.getThiefParametersForDifficulty('normal').stealProbability;
      const hardSteal = service.getThiefParametersForDifficulty('hard').stealProbability;

      expect(easySteal).toBeLessThan(normalSteal);
      expect(normalSteal).toBeLessThan(hardSteal);
    });

    it('should have decreasing flee probability from easy to hard', () => {
      const easyFlee = service.getThiefParametersForDifficulty('easy').fleeWhenWeakProbability;
      const normalFlee = service.getThiefParametersForDifficulty('normal').fleeWhenWeakProbability;
      const hardFlee = service.getThiefParametersForDifficulty('hard').fleeWhenWeakProbability;

      expect(easyFlee).toBeGreaterThan(normalFlee);
      expect(normalFlee).toBeGreaterThan(hardFlee);
    });

    it('should have decreasing engrossed duration from easy to hard', () => {
      const easyDuration = service.getThiefParametersForDifficulty('easy').engrossedDuration;
      const normalDuration = service.getThiefParametersForDifficulty('normal').engrossedDuration;
      const hardDuration = service.getThiefParametersForDifficulty('hard').engrossedDuration;

      expect(easyDuration).toBeGreaterThan(normalDuration);
      expect(normalDuration).toBeGreaterThan(hardDuration);
    });
  });
});
