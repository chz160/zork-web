import { TestBed } from '@angular/core/testing';
import { ThiefConfigService } from '../services/thief-config.service';
import { ThiefActor } from '../models/thief-actor';
import { MessageService } from '../services/message.service';
import { TelemetryService } from '../services/telemetry.service';
import { RandomService } from '../services/random.service';

/**
 * Integration tests demonstrating thief behavior changes across difficulty modes.
 * Shows that configurable parameters produce observable differences in gameplay.
 */
describe('Thief Difficulty Modes Integration', () => {
  let configService: ThiefConfigService;
  let messageService: MessageService;
  let telemetryService: TelemetryService;
  let randomService: RandomService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ThiefConfigService, MessageService, TelemetryService, RandomService],
    });
    configService = TestBed.inject(ThiefConfigService);
    messageService = TestBed.inject(MessageService);
    telemetryService = TestBed.inject(TelemetryService);
    randomService = TestBed.inject(RandomService);

    // Set deterministic seed for reproducibility
    randomService.setSeed(54321);
  });

  describe('Difficulty Mode Switching', () => {
    it('should start with normal difficulty by default', () => {
      expect(configService.getCurrentDifficulty()).toBe('normal');
    });

    it('should switch to easy mode', () => {
      configService.setDifficulty('easy');
      expect(configService.getCurrentDifficulty()).toBe('easy');
    });

    it('should switch to hard mode', () => {
      configService.setDifficulty('hard');
      expect(configService.getCurrentDifficulty()).toBe('hard');
    });

    it('should provide different parameters per difficulty', () => {
      configService.setDifficulty('easy');
      const easyParams = configService.getThiefParameters();

      configService.setDifficulty('hard');
      const hardParams = configService.getThiefParameters();

      expect(hardParams.strength).toBeGreaterThan(easyParams.strength);
      expect(hardParams.aggressiveness).toBeGreaterThan(easyParams.aggressiveness);
      expect(hardParams.stealProbability).toBeGreaterThan(easyParams.stealProbability);
    });
  });

  describe('ThiefActor Initialization with Different Difficulties', () => {
    it('should initialize with easy mode strength', () => {
      configService.setDifficulty('easy');
      const thief = new ThiefActor(messageService, telemetryService, configService);

      const strength = thief.flags.get('strength') as number;
      const expectedStrength = configService.getThiefParameters().strength;

      expect(strength).toBe(expectedStrength);
      expect(strength).toBeLessThan(5); // Less than normal mode
    });

    it('should initialize with normal mode strength', () => {
      configService.setDifficulty('normal');
      const thief = new ThiefActor(messageService, telemetryService, configService);

      const strength = thief.flags.get('strength') as number;
      const expectedStrength = configService.getThiefParameters().strength;

      expect(strength).toBe(expectedStrength);
      expect(strength).toBe(5); // Legacy default
    });

    it('should initialize with hard mode strength', () => {
      configService.setDifficulty('hard');
      const thief = new ThiefActor(messageService, telemetryService, configService);

      const strength = thief.flags.get('strength') as number;
      const expectedStrength = configService.getThiefParameters().strength;

      expect(strength).toBe(expectedStrength);
      expect(strength).toBeGreaterThan(5); // Greater than normal mode
    });

    it('should initialize without config service (backward compatibility)', () => {
      const thief = new ThiefActor(messageService, telemetryService);

      const strength = thief.flags.get('strength') as number;
      expect(strength).toBe(5); // Should use legacy default
    });
  });

  describe('Probability Parameter Access', () => {
    it('should return configured probabilities in easy mode', () => {
      configService.setDifficulty('easy');
      const thief = new ThiefActor(messageService, telemetryService, configService);

      const stealProb = thief.getProbability('stealProbability', 0.5);
      const expectedStealProb = configService.getThiefParameters().stealProbability;

      expect(stealProb).toBe(expectedStealProb);
      expect(stealProb).toBeLessThan(0.5); // Easier = less stealing
    });

    it('should return configured probabilities in hard mode', () => {
      configService.setDifficulty('hard');
      const thief = new ThiefActor(messageService, telemetryService, configService);

      const stealProb = thief.getProbability('stealProbability', 0.5);
      const expectedStealProb = configService.getThiefParameters().stealProbability;

      expect(stealProb).toBe(expectedStealProb);
      expect(stealProb).toBeGreaterThan(0.5); // Harder = more stealing
    });

    it('should use default probability when config not available', () => {
      const thief = new ThiefActor(messageService, telemetryService); // No config

      const stealProb = thief.getProbability('stealProbability', 0.5);
      expect(stealProb).toBe(0.5); // Should use default
    });

    it('should return aggressiveness from config', () => {
      configService.setDifficulty('hard');
      const thief = new ThiefActor(messageService, telemetryService, configService);

      const aggr = thief.getAggressiveness();
      const expectedAggr = configService.getThiefParameters().aggressiveness;

      expect(aggr).toBe(expectedAggr);
      expect(aggr).toBeGreaterThan(0.6); // Hard mode is more aggressive
    });

    it('should return engrossed duration from config', () => {
      configService.setDifficulty('easy');
      const thief = new ThiefActor(messageService, telemetryService, configService);

      const duration = thief.getEngrossedDuration();
      const expectedDuration = configService.getThiefParameters().engrossedDuration;

      expect(duration).toBe(expectedDuration);
      expect(duration).toBeGreaterThan(2); // Easy mode = longer engrossed time
    });
  });

  describe('Combat Difficulty Differences', () => {
    it('should have lower hit probability in easy mode', () => {
      configService.setDifficulty('easy');
      const thief = new ThiefActor(messageService, telemetryService, configService);

      const hitProb = thief.getProbability('combatHitProbability', 0.6);
      expect(hitProb).toBeLessThan(0.6);
    });

    it('should have higher hit probability in hard mode', () => {
      configService.setDifficulty('hard');
      const thief = new ThiefActor(messageService, telemetryService, configService);

      const hitProb = thief.getProbability('combatHitProbability', 0.6);
      expect(hitProb).toBeGreaterThan(0.6);
    });

    it('should have lower disarm probability in easy mode', () => {
      configService.setDifficulty('easy');
      const thief = new ThiefActor(messageService, telemetryService, configService);

      const disarmProb = thief.getProbability('combatDisarmProbability', 0.15);
      expect(disarmProb).toBeLessThan(0.15);
    });

    it('should have higher disarm probability in hard mode', () => {
      configService.setDifficulty('hard');
      const thief = new ThiefActor(messageService, telemetryService, configService);

      const disarmProb = thief.getProbability('combatDisarmProbability', 0.15);
      expect(disarmProb).toBeGreaterThan(0.15);
    });
  });

  describe('Stealing Behavior Differences', () => {
    it('should be less likely to steal in easy mode', () => {
      configService.setDifficulty('easy');
      const params = configService.getThiefParameters();

      expect(params.stealProbability).toBeLessThan(0.5);
    });

    it('should be more likely to steal in hard mode', () => {
      configService.setDifficulty('hard');
      const params = configService.getThiefParameters();

      expect(params.stealProbability).toBeGreaterThan(0.5);
    });

    it('should drop worthless items more often in easy mode', () => {
      configService.setDifficulty('easy');
      const params = configService.getThiefParameters();

      expect(params.dropWorthlessProbability).toBeGreaterThan(0.7);
    });

    it('should keep items longer in hard mode', () => {
      configService.setDifficulty('hard');
      const params = configService.getThiefParameters();

      expect(params.dropWorthlessProbability).toBeLessThan(0.7);
    });
  });

  describe('Movement and Evasion Differences', () => {
    it('should flee more often when weak in easy mode', () => {
      configService.setDifficulty('easy');
      const params = configService.getThiefParameters();

      expect(params.fleeWhenWeakProbability).toBeGreaterThan(0.4);
    });

    it('should flee less often when weak in hard mode', () => {
      configService.setDifficulty('hard');
      const params = configService.getThiefParameters();

      expect(params.fleeWhenWeakProbability).toBeLessThan(0.4);
    });

    it('should move less frequently in easy mode', () => {
      configService.setDifficulty('easy');
      const params = configService.getThiefParameters();

      expect(params.tickMovementProbability).toBeLessThan(0.7);
    });

    it('should move more frequently in hard mode', () => {
      configService.setDifficulty('hard');
      const params = configService.getThiefParameters();

      expect(params.tickMovementProbability).toBeGreaterThan(0.7);
    });
  });

  describe('Configuration Summary Display', () => {
    it('should show easy mode in summary', () => {
      configService.setDifficulty('easy');
      const summary = configService.getConfigSummary();

      expect(summary).toContain('Easy');
      expect(summary).toContain('Strength: 3/3');
    });

    it('should show normal mode in summary', () => {
      configService.setDifficulty('normal');
      const summary = configService.getConfigSummary();

      expect(summary).toContain('Normal');
      expect(summary).toContain('Strength: 5/5');
    });

    it('should show hard mode in summary', () => {
      configService.setDifficulty('hard');
      const summary = configService.getConfigSummary();

      expect(summary).toContain('Hard');
      expect(summary).toContain('Strength: 7/7');
    });
  });

  describe('Deterministic Behavior Across Difficulties', () => {
    it('should produce same results with same seed and difficulty', () => {
      // First run
      randomService.setSeed(99999);
      configService.setDifficulty('hard');

      const hitProb1 = configService.getThiefParameters().combatHitProbability;
      const result1 = randomService.nextBoolean(hitProb1);

      // Second run with same seed and difficulty
      randomService.setSeed(99999);
      configService.setDifficulty('hard');

      const hitProb2 = configService.getThiefParameters().combatHitProbability;
      const result2 = randomService.nextBoolean(hitProb2);

      expect(hitProb1).toBe(hitProb2);
      expect(result1).toBe(result2);
    });

    it('should produce different results with different difficulties', () => {
      randomService.setSeed(88888);

      configService.setDifficulty('easy');
      const easyHitProb = configService.getThiefParameters().combatHitProbability;

      configService.setDifficulty('hard');
      const hardHitProb = configService.getThiefParameters().combatHitProbability;

      expect(hardHitProb).toBeGreaterThan(easyHitProb);
    });
  });
});
