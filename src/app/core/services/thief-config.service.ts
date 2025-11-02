import { Injectable, InjectionToken } from '@angular/core';
import thiefConfigDataRaw from '../../data/thief-config.json';

/**
 * Thief behavior parameters for a specific difficulty mode.
 * Based on legacy PROB checks and STRENGTH from original ZIL code.
 */
export interface ThiefParameters {
  /** Initial and maximum strength (health) of the thief */
  strength: number;
  maxStrength: number;

  /** General aggressiveness factor (0.0 to 1.0) */
  aggressiveness: number;

  /** Probability thief appears when player enters a room (PROB 30 in legacy) */
  appearProbability: number;

  /** Probability thief steals an item per tick (PROB 50 in legacy) */
  stealProbability: number;

  /** Probability thief flees when weak (PROB 40 in legacy) */
  fleeWhenWeakProbability: number;

  /** Probability thief drops worthless items (PROB 70 in legacy) */
  dropWorthlessProbability: number;

  /** Number of ticks thief remains engrossed after receiving valuable gift */
  engrossedDuration: number;

  /** Probability thief lands a hit in combat (PROB 60 in legacy) */
  combatHitProbability: number;

  /** Probability of critical hit (PROB 20 in legacy) */
  combatCriticalHitProbability: number;

  /** Probability thief disarms player (PROB 15 in legacy) */
  combatDisarmProbability: number;

  /** Probability thief moves to new room per tick (PROB 70 in legacy) */
  tickMovementProbability: number;

  /** Probability thief deposits booty in treasure room (PROB 80 in legacy) */
  depositBootyProbability: number;
}

/**
 * Difficulty mode configuration with thief parameters.
 */
export interface DifficultyMode {
  name: string;
  description: string;
  thief: ThiefParameters;
}

/**
 * Full thief configuration including all difficulty modes.
 */
export interface ThiefConfig {
  description: string;
  devMode: boolean;
  currentDifficulty: 'easy' | 'normal' | 'hard';
  difficulties: {
    easy: DifficultyMode;
    normal: DifficultyMode;
    hard: DifficultyMode;
  };
}

// Cast the imported JSON to ThiefConfig type to ensure type safety
const thiefConfigData = thiefConfigDataRaw as ThiefConfig;

/**
 * Injection token for thief configuration
 */
export const THIEF_CONFIG = new InjectionToken<ThiefConfig>('THIEF_CONFIG', {
  providedIn: 'root',
  factory: () => thiefConfigData,
});

/**
 * Service for accessing and managing thief behavior configuration.
 * Provides tunable parameters for thief probabilities, strength, and aggressiveness.
 * Supports difficulty modes (easy, normal, hard) and runtime config updates in dev mode.
 *
 * Design:
 * - Config loaded from thief-config.json at compile time
 * - Difficulty mode can be changed at runtime
 * - Dev mode allows reloading config without restart
 *
 * Legacy mapping:
 * - Maps to PROB checks in THIEF-VS-ADVENTURER, I-THIEF
 * - Maps to STRENGTH/P?STRENGTH in ROBBER-FUNCTION
 */
@Injectable({
  providedIn: 'root',
})
export class ThiefConfigService {
  private config: ThiefConfig = thiefConfigData;
  private currentDifficultyKey: 'easy' | 'normal' | 'hard';

  constructor() {
    this.currentDifficultyKey = this.config.currentDifficulty;
  }

  /**
   * Get the full configuration.
   */
  getConfig(): ThiefConfig {
    return this.config;
  }

  /**
   * Get the current difficulty mode name.
   */
  getCurrentDifficulty(): 'easy' | 'normal' | 'hard' {
    return this.currentDifficultyKey;
  }

  /**
   * Get thief parameters for the current difficulty mode.
   */
  getThiefParameters(): ThiefParameters {
    return this.config.difficulties[this.currentDifficultyKey].thief;
  }

  /**
   * Get thief parameters for a specific difficulty mode.
   *
   * @param difficulty The difficulty mode to retrieve
   */
  getThiefParametersForDifficulty(difficulty: 'easy' | 'normal' | 'hard'): ThiefParameters {
    return this.config.difficulties[difficulty].thief;
  }

  /**
   * Get all available difficulty modes with their descriptions.
   */
  getDifficultyModes(): { key: string; name: string; description: string }[] {
    return Object.entries(this.config.difficulties).map(([key, mode]) => ({
      key,
      name: mode.name,
      description: mode.description,
    }));
  }

  /**
   * Switch to a different difficulty mode.
   * This changes thief behavior for new encounters and ticks.
   *
   * @param difficulty The difficulty mode to switch to
   * @throws Error if difficulty mode is invalid
   */
  setDifficulty(difficulty: 'easy' | 'normal' | 'hard'): void {
    if (!this.config.difficulties[difficulty]) {
      throw new Error(`Invalid difficulty mode: ${difficulty}`);
    }
    this.currentDifficultyKey = difficulty;
  }

  /**
   * Check if dev mode is enabled.
   * In dev mode, configuration can be reloaded at runtime.
   */
  isDevMode(): boolean {
    return this.config.devMode;
  }

  /**
   * Enable or disable dev mode.
   * Only available in development builds.
   *
   * @param enabled Whether to enable dev mode
   */
  setDevMode(enabled: boolean): void {
    this.config.devMode = enabled;
  }

  /**
   * Reload configuration from the source.
   * Only available when dev mode is enabled.
   * Useful for testing different parameter values without restarting.
   *
   * @param newConfig Optional new configuration to apply
   * @throws Error if dev mode is not enabled
   */
  reloadConfig(newConfig?: Partial<ThiefConfig>): void {
    if (!this.config.devMode) {
      throw new Error('Config reload is only available in dev mode');
    }

    if (newConfig) {
      // Merge new config with existing (shallow merge for safety)
      this.config = {
        ...this.config,
        ...newConfig,
        difficulties: {
          ...this.config.difficulties,
          ...(newConfig.difficulties || {}),
        },
      };
    } else {
      // Reload from original source
      this.config = thiefConfigData;
    }

    // Ensure current difficulty is still valid
    if (!this.config.difficulties[this.currentDifficultyKey]) {
      this.currentDifficultyKey = this.config.currentDifficulty;
    }
  }

  /**
   * Get a summary of the current configuration for display/debugging.
   */
  getConfigSummary(): string {
    const params = this.getThiefParameters();
    return `
Difficulty: ${this.config.difficulties[this.currentDifficultyKey].name}
Dev Mode: ${this.config.devMode ? 'Enabled' : 'Disabled'}

Thief Parameters:
  Strength: ${params.strength}/${params.maxStrength}
  Aggressiveness: ${(params.aggressiveness * 100).toFixed(0)}%
  Appear Probability: ${(params.appearProbability * 100).toFixed(0)}%
  Steal Probability: ${(params.stealProbability * 100).toFixed(0)}%
  Combat Hit Probability: ${(params.combatHitProbability * 100).toFixed(0)}%
  Movement Probability: ${(params.tickMovementProbability * 100).toFixed(0)}%
    `.trim();
  }
}
