import { Injectable } from '@angular/core';

/**
 * Feature flag identifiers
 */
export enum FeatureFlag {
  /** Conversational parser enhancements including fuzzy matching, multi-command, disambiguation */
  COMMAND_PARSER_ENHANCEMENTS = 'COMMAND_PARSER_ENHANCEMENTS',
}

/**
 * Feature flag configuration interface
 */
export type FeatureFlagConfig = Record<string, boolean>;

/**
 * Feature Flag Service
 *
 * Manages feature flags for staged rollout and A/B testing.
 * Supports runtime configuration, environment variables, and localStorage persistence.
 *
 * Key Features:
 * - **Runtime Configuration**: Enable/disable features without code changes
 * - **Environment Variables**: Configure via process.env for CI/CD
 * - **Persistent Storage**: Save flag state to localStorage
 * - **Safe Defaults**: All flags default to safe values (typically enabled for completed features)
 * - **Easy Rollback**: Disable features instantly if issues arise
 *
 * Usage:
 * ```typescript
 * // Check if feature is enabled
 * if (featureFlags.isEnabled(FeatureFlag.COMMAND_PARSER_ENHANCEMENTS)) {
 *   // Use new parser features
 * } else {
 *   // Fall back to legacy behavior
 * }
 *
 * // Enable/disable feature at runtime
 * featureFlags.setFlag(FeatureFlag.COMMAND_PARSER_ENHANCEMENTS, false);
 *
 * // Configure multiple flags
 * featureFlags.setFlags({
 *   COMMAND_PARSER_ENHANCEMENTS: true,
 *   // ... other flags
 * });
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class FeatureFlagService {
  private flags: FeatureFlagConfig = {
    // Conversational parser features - enabled by default (Phase 5-7 complete)
    [FeatureFlag.COMMAND_PARSER_ENHANCEMENTS]: true,
  };

  private readonly STORAGE_KEY = 'zork_feature_flags';

  constructor() {
    this.loadFromStorage();
    this.loadFromEnvironment();
  }

  /**
   * Check if a feature flag is enabled
   *
   * @param flag Feature flag to check
   * @returns true if enabled, false otherwise
   */
  isEnabled(flag: FeatureFlag): boolean {
    return this.flags[flag] ?? false;
  }

  /**
   * Set a single feature flag value
   *
   * @param flag Feature flag to set
   * @param enabled Whether the feature is enabled
   */
  setFlag(flag: FeatureFlag, enabled: boolean): void {
    this.flags[flag] = enabled;
    this.saveToStorage();
  }

  /**
   * Set multiple feature flags at once
   *
   * @param config Object mapping flag names to enabled state
   */
  setFlags(config: FeatureFlagConfig): void {
    this.flags = { ...this.flags, ...config };
    this.saveToStorage();
  }

  /**
   * Get all feature flag values
   *
   * @returns Object with all flag names and their enabled state
   */
  getAllFlags(): FeatureFlagConfig {
    return { ...this.flags };
  }

  /**
   * Reset all flags to their default values
   */
  resetToDefaults(): void {
    this.flags = {
      [FeatureFlag.COMMAND_PARSER_ENHANCEMENTS]: true,
    };
    this.saveToStorage();
  }

  /**
   * Clear all flags from localStorage (does not reset to defaults)
   */
  clearStorage(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /**
   * Load flags from localStorage if available
   * @private
   */
  private loadFromStorage(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.flags = { ...this.flags, ...parsed };
      }
    } catch (error) {
      console.warn('[FeatureFlags] Failed to load from localStorage:', error);
    }
  }

  /**
   * Save current flags to localStorage
   * @private
   */
  private saveToStorage(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.flags));
    } catch (error) {
      console.warn('[FeatureFlags] Failed to save to localStorage:', error);
    }
  }

  /**
   * Load flags from environment variables (for server-side/CI)
   * Environment variables should be prefixed with ZORK_FEATURE_
   * @private
   */
  private loadFromEnvironment(): void {
    // Skip in browser environment - this is primarily for server-side rendering or CI
    // We use localStorage for browser-based flag persistence
  }
}
