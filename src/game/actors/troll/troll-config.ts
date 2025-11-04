import { InjectionToken } from '@angular/core';

/**
 * Configuration parameters for Troll actor behavior.
 *
 * Based on characterization tests, the troll:
 * - Starts with strength 2 (takes 2+ hits to knock unconscious)
 * - Blocks passages when armed/conscious
 * - Drops axe when unconscious
 * - Can be bribed or fed to allow passage
 */
export interface TrollConfig {
  /** Initial strength of the troll (default: 2) */
  initialStrength: number;

  /** Maximum strength of the troll */
  maxStrength: number;

  /** Amount of toll required to pass (in treasure value) */
  tollAmount: number;

  /** Minimum bribe value to accept and allow passage */
  minBribeValue: number;

  /** List of item IDs that the troll will eat (e.g., food items) */
  edibleItems: string[];

  /** Probability troll counterattacks when attacked (0.0 to 1.0) */
  counterattackProbability: number;

  /** Probability troll successfully hits in combat (0.0 to 1.0) */
  combatHitProbability: number;

  /** Base damage dealt by troll's axe */
  axeDamage: number;
}

/**
 * Default troll configuration based on characterization tests.
 */
export const DEFAULT_TROLL_CONFIG: TrollConfig = {
  initialStrength: 2,
  maxStrength: 2,
  tollAmount: 10,
  minBribeValue: 5,
  edibleItems: ['sandwich', 'lunch', 'garlic', 'clove-of-garlic'],
  counterattackProbability: 0.7,
  combatHitProbability: 0.6,
  axeDamage: 1,
};

/**
 * Injection token for troll configuration.
 * Allows runtime configuration and testing with custom parameters.
 */
export const TROLL_CONFIG = new InjectionToken<TrollConfig>('TROLL_CONFIG', {
  providedIn: 'root',
  factory: () => DEFAULT_TROLL_CONFIG,
});
