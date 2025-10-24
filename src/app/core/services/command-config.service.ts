import { Injectable, InjectionToken } from '@angular/core';
import commandConfigData from '../../data/command-config.json';

/**
 * Configuration for phrasal verbs
 */
export interface PhrasalVerbConfig {
  intent: string;
  preposition?: string;
}

/**
 * Parser settings for thresholds and behaviors
 */
export interface ParserSettings {
  fuzzyMatchThreshold: number;
  autoCorrectThreshold: number;
  maxDisambiguationCandidates: number;
  multiCommandSeparators: string[];
  multiCommandPolicy: string;
}

/**
 * Command configuration structure
 */
export interface CommandConfig {
  verbs: Record<string, string[]>;
  phrasalVerbs: Record<string, PhrasalVerbConfig>;
  pronouns: string[];
  determiners: string[];
  prepositions: string[];
  objectAliases: Record<string, string[]>;
  parserSettings: ParserSettings;
}

/**
 * Injection token for command parser configuration
 */
export const COMMAND_PARSER_CONFIG = new InjectionToken<CommandConfig>('COMMAND_PARSER_CONFIG', {
  providedIn: 'root',
  factory: () => commandConfigData,
});

/**
 * Service for accessing command parser configuration.
 * Provides verbs, phrasal verbs, prepositions, determiners, aliases, and parser thresholds.
 *
 * This service encapsulates all designer-editable configuration loaded from command-config.json.
 */
@Injectable({
  providedIn: 'root',
})
export class CommandConfigService {
  private readonly config: CommandConfig = commandConfigData;

  /**
   * Get all verb synonyms
   */
  getVerbs(): Record<string, string[]> {
    return this.config.verbs;
  }

  /**
   * Get all phrasal verbs
   */
  getPhrasalVerbs(): Record<string, PhrasalVerbConfig> {
    return this.config.phrasalVerbs;
  }

  /**
   * Get all pronouns
   */
  getPronouns(): string[] {
    return this.config.pronouns;
  }

  /**
   * Get all determiners (noise words)
   */
  getDeterminers(): string[] {
    return this.config.determiners;
  }

  /**
   * Get all prepositions
   */
  getPrepositions(): string[] {
    return this.config.prepositions;
  }

  /**
   * Get object aliases
   */
  getObjectAliases(): Record<string, string[]> {
    return this.config.objectAliases;
  }

  /**
   * Get parser settings (thresholds, policies)
   */
  getSettings(): ParserSettings {
    return this.config.parserSettings;
  }

  /**
   * Get the full configuration
   */
  getConfig(): CommandConfig {
    return this.config;
  }
}
