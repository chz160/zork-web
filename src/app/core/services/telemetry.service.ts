import { Injectable } from '@angular/core';

/**
 * Telemetry event types for parser interactions
 */
export enum TelemetryEventType {
  // Parser events
  PARSE_ATTEMPT = 'parse.attempt',
  PARSE_SUCCESS = 'parse_success',
  PARSE_FAILURE = 'parse_failure',

  // Fuzzy matching and autocorrect
  FUZZY_MATCH = 'fuzzy_match',
  AUTOCORRECT_SUGGESTION = 'autocorrect_suggestion',
  AUTOCORRECT_ACCEPTED = 'autocorrect_accepted',
  AUTOCORRECT_REJECTED = 'autocorrect.rejected',

  // Disambiguation
  DISAMBIGUATION_SHOWN = 'disambiguation_shown',
  DISAMBIGUATION_SELECTED = 'disambiguation_selected',
  DISAMBIGUATION_CANCELLED = 'disambiguation.cancelled',

  // Multi-command and ordinals
  MULTI_COMMAND = 'multi_command',
  ORDINAL_SELECTION = 'ordinal_selection',
}

/**
 * Base telemetry event
 */
export interface TelemetryEvent {
  type: TelemetryEventType;
  timestamp: Date;
  data: Record<string, unknown>;
}

/**
 * Parse failure event data
 */
export interface ParseFailureData extends Record<string, unknown> {
  rawInput: string;
  errorMessage: string;
  suggestions?: string[];
}

/**
 * Fuzzy match event data
 */
export interface FuzzyMatchData extends Record<string, unknown> {
  input: string;
  matched: string;
  score: number;
}

/**
 * Disambiguation event data
 */
export interface DisambiguationData extends Record<string, unknown> {
  input: string;
  candidates: string[];
  selectedIndex?: number;
}

/**
 * Multi-command event data
 */
export interface MultiCommandData extends Record<string, unknown> {
  rawInput: string;
  commandCount: number;
  policy: 'fail-fast' | 'best-effort';
}

/**
 * Privacy configuration for telemetry
 */
export interface TelemetryPrivacyConfig {
  /** Enable/disable telemetry collection */
  enabled: boolean;
  /** Collect user input text (may contain PII) */
  collectInput: boolean;
  /** Allow persistent storage of telemetry data */
  allowPersistentStorage: boolean;
  /** Allow remote transmission of telemetry data */
  allowRemoteTransmission: boolean;
}

/**
 * Analytics summary for a given time period
 */
export interface TelemetryAnalytics {
  /** Total number of events collected */
  totalEvents: number;
  /** Number of parse attempts */
  parseAttempts: number;
  /** Number of successful parses */
  parseSuccesses: number;
  /** Number of failed parses */
  parseFailures: number;
  /** Parse success rate (0-1) */
  parseSuccessRate: number;
  /** Number of fuzzy matches */
  fuzzyMatches: number;
  /** Number of autocorrect suggestions shown */
  autocorrectSuggestions: number;
  /** Number of autocorrect acceptances */
  autocorrectAcceptances: number;
  /** Number of autocorrect rejections */
  autocorrectRejections: number;
  /** Autocorrect acceptance rate (0-1) */
  autocorrectAcceptanceRate: number;
  /** Number of disambiguation prompts shown */
  disambiguationShown: number;
  /** Number of disambiguation selections made */
  disambiguationSelections: number;
  /** Number of disambiguation cancellations */
  disambiguationCancellations: number;
  /** Number of multi-command inputs */
  multiCommands: number;
  /** Number of ordinal selections */
  ordinalSelections: number;
  /** Most common failed inputs (top 10) */
  topFailedInputs: { input: string; count: number }[];
  /** Most common ambiguous phrases (top 10) */
  topAmbiguousPhrases: { phrase: string; count: number }[];
  /** Most common autocorrect suggestions (top 10) */
  topAutocorrects: { from: string; to: string; count: number }[];
  /** Time range of analysis */
  startTime: Date;
  endTime: Date;
}

/**
 * Telemetry service for tracking parser interactions and user behavior.
 * Logs all failed or ambiguous parses, autocorrect suggestions, and user choices.
 *
 * Privacy Features:
 * - Memory-only storage by default (no persistent logging)
 * - Opt-in/opt-out controls
 * - Configurable input text collection (may contain PII)
 * - No remote transmission without explicit consent
 * - Anonymized export format for ML training
 *
 * Analytics Features:
 * - Comprehensive event logging with timestamps
 * - Aggregate statistics and summary reports
 * - Query by event type, time range, and filters
 * - Top failures, ambiguities, and autocorrects
 *
 * Usage:
 * ```typescript
 * // Configure privacy settings
 * telemetry.setPrivacyConfig({ enabled: true, collectInput: false });
 *
 * // Log events
 * telemetry.logParseAttempt('take lamp');
 * telemetry.logParseSuccess('take lamp');
 *
 * // Get analytics
 * const analytics = telemetry.getAnalytics();
 * console.log(`Success rate: ${analytics.parseSuccessRate * 100}%`);
 *
 * // Export for ML training (requires consent)
 * const data = telemetry.exportAnonymizedData();
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class TelemetryService {
  private events: TelemetryEvent[] = [];
  private privacyConfig: TelemetryPrivacyConfig = {
    enabled: true,
    collectInput: true,
    allowPersistentStorage: false,
    allowRemoteTransmission: false,
  };

  /**
   * Set privacy configuration for telemetry collection
   */
  setPrivacyConfig(config: Partial<TelemetryPrivacyConfig>): void {
    this.privacyConfig = { ...this.privacyConfig, ...config };

    // Clear events if telemetry is disabled
    if (config.enabled === false) {
      this.clearEvents();
    }
    // Clear events if input collection is disabled (to remove any stored input data)
    else if (config.collectInput === false) {
      this.clearEvents();
    }
  }

  /**
   * Get current privacy configuration
   */
  getPrivacyConfig(): Readonly<TelemetryPrivacyConfig> {
    return { ...this.privacyConfig };
  }

  /**
   * Enable or disable telemetry (convenience method)
   * @deprecated Use setPrivacyConfig({ enabled: ... }) instead
   */
  setEnabled(enabled: boolean): void {
    this.setPrivacyConfig({ enabled });
  }

  /**
   * Check if telemetry is currently enabled
   */
  isEnabled(): boolean {
    return this.privacyConfig.enabled;
  }

  /**
   * Log a parse attempt event (before parsing starts)
   */
  logParseAttempt(rawInput: string): void {
    const data: Record<string, unknown> = {};
    if (this.privacyConfig.collectInput) {
      data['rawInput'] = rawInput;
    }
    data['inputLength'] = rawInput.length;
    this.logTypedEvent(TelemetryEventType.PARSE_ATTEMPT, data);
  }

  /**
   * Log a parse success event
   */
  logParseSuccess(rawInput: string): void {
    const data: Record<string, unknown> = {};
    if (this.privacyConfig.collectInput) {
      data['rawInput'] = rawInput;
    }
    data['inputLength'] = rawInput.length;
    this.logTypedEvent(TelemetryEventType.PARSE_SUCCESS, data);
  }

  /**
   * Log a parse failure event
   */
  logParseFailure(data: ParseFailureData): void {
    const eventData: Record<string, unknown> = {
      errorMessage: data.errorMessage,
      suggestions: data.suggestions,
    };
    if (this.privacyConfig.collectInput) {
      eventData['rawInput'] = data.rawInput;
    }
    eventData['inputLength'] = data.rawInput?.length || 0;
    this.logTypedEvent(TelemetryEventType.PARSE_FAILURE, eventData);
  }

  /**
   * Log a fuzzy match event
   */
  logFuzzyMatch(data: FuzzyMatchData): void {
    const eventData: Record<string, unknown> = {
      matched: data.matched,
      score: data.score,
    };
    if (this.privacyConfig.collectInput) {
      eventData['input'] = data.input;
    }
    this.logTypedEvent(TelemetryEventType.FUZZY_MATCH, eventData);
  }

  /**
   * Log an autocorrect suggestion event
   */
  logAutocorrectSuggestion(input: string, suggestion: string, score: number): void {
    const data: Record<string, unknown> = { suggestion, score };
    if (this.privacyConfig.collectInput) {
      data['input'] = input;
    }
    this.logTypedEvent(TelemetryEventType.AUTOCORRECT_SUGGESTION, data);
  }

  /**
   * Log an autocorrect accepted event
   */
  logAutocorrectAccepted(input: string, correction: string): void {
    const data: Record<string, unknown> = { correction };
    if (this.privacyConfig.collectInput) {
      data['input'] = input;
    }
    this.logTypedEvent(TelemetryEventType.AUTOCORRECT_ACCEPTED, data);
  }

  /**
   * Log an autocorrect rejected event
   */
  logAutocorrectRejected(input: string, suggestion: string): void {
    const data: Record<string, unknown> = { suggestion };
    if (this.privacyConfig.collectInput) {
      data['input'] = input;
    }
    this.logTypedEvent(TelemetryEventType.AUTOCORRECT_REJECTED, data);
  }

  /**
   * Log a disambiguation shown event
   */
  logDisambiguationShown(data: DisambiguationData): void {
    const eventData: Record<string, unknown> = {
      candidates: data.candidates,
      candidateCount: data.candidates.length,
    };
    if (this.privacyConfig.collectInput) {
      eventData['input'] = data.input;
    }
    this.logTypedEvent(TelemetryEventType.DISAMBIGUATION_SHOWN, eventData);
  }

  /**
   * Log a disambiguation selected event
   */
  logDisambiguationSelected(data: DisambiguationData): void {
    const eventData: Record<string, unknown> = {
      candidates: data.candidates,
      selectedIndex: data.selectedIndex,
    };
    if (this.privacyConfig.collectInput) {
      eventData['input'] = data.input;
    }
    this.logTypedEvent(TelemetryEventType.DISAMBIGUATION_SELECTED, eventData);
  }

  /**
   * Log a disambiguation cancelled event
   */
  logDisambiguationCancelled(input: string, candidates: string[]): void {
    const data: Record<string, unknown> = {
      candidates,
      candidateCount: candidates.length,
    };
    if (this.privacyConfig.collectInput) {
      data['input'] = input;
    }
    this.logTypedEvent(TelemetryEventType.DISAMBIGUATION_CANCELLED, data);
  }

  /**
   * Log a multi-command event
   */
  logMultiCommand(data: MultiCommandData): void {
    const eventData: Record<string, unknown> = {
      commandCount: data.commandCount,
      policy: data.policy,
    };
    if (this.privacyConfig.collectInput) {
      eventData['rawInput'] = data.rawInput;
    }
    this.logTypedEvent(TelemetryEventType.MULTI_COMMAND, eventData);
  }

  /**
   * Log an ordinal selection event
   */
  logOrdinalSelection(input: string, ordinal: number, object: string): void {
    const data: Record<string, unknown> = { ordinal, object };
    if (this.privacyConfig.collectInput) {
      data['input'] = input;
    }
    this.logTypedEvent(TelemetryEventType.ORDINAL_SELECTION, data);
  }

  /**
   * Get all logged events
   */
  getEvents(): TelemetryEvent[] {
    return [...this.events];
  }

  /**
   * Get events filtered by type
   */
  getEventsByType(type: TelemetryEventType): TelemetryEvent[] {
    return this.events.filter((e) => e.type === type);
  }

  /**
   * Get events filtered by time range
   */
  getEventsByTimeRange(startTime: Date, endTime: Date): TelemetryEvent[] {
    return this.events.filter((e) => e.timestamp >= startTime && e.timestamp <= endTime);
  }

  /**
   * Get analytics summary for all collected events
   */
  getAnalytics(startTime?: Date, endTime?: Date): TelemetryAnalytics {
    let events = this.events;

    // Filter by time range if provided
    if (startTime || endTime) {
      const start = startTime || new Date(0);
      const end = endTime || new Date();
      events = this.getEventsByTimeRange(start, end);
    }

    // Count events by type
    const parseAttempts = events.filter((e) => e.type === TelemetryEventType.PARSE_ATTEMPT).length;
    const parseSuccesses = events.filter((e) => e.type === TelemetryEventType.PARSE_SUCCESS).length;
    const parseFailures = events.filter((e) => e.type === TelemetryEventType.PARSE_FAILURE).length;
    const fuzzyMatches = events.filter((e) => e.type === TelemetryEventType.FUZZY_MATCH).length;
    const autocorrectSuggestions = events.filter(
      (e) => e.type === TelemetryEventType.AUTOCORRECT_SUGGESTION
    ).length;
    const autocorrectAcceptances = events.filter(
      (e) => e.type === TelemetryEventType.AUTOCORRECT_ACCEPTED
    ).length;
    const autocorrectRejections = events.filter(
      (e) => e.type === TelemetryEventType.AUTOCORRECT_REJECTED
    ).length;
    const disambiguationShown = events.filter(
      (e) => e.type === TelemetryEventType.DISAMBIGUATION_SHOWN
    ).length;
    const disambiguationSelections = events.filter(
      (e) => e.type === TelemetryEventType.DISAMBIGUATION_SELECTED
    ).length;
    const disambiguationCancellations = events.filter(
      (e) => e.type === TelemetryEventType.DISAMBIGUATION_CANCELLED
    ).length;
    const multiCommands = events.filter((e) => e.type === TelemetryEventType.MULTI_COMMAND).length;
    const ordinalSelections = events.filter(
      (e) => e.type === TelemetryEventType.ORDINAL_SELECTION
    ).length;

    // Calculate rates
    const parseSuccessRate = parseAttempts > 0 ? parseSuccesses / parseAttempts : 0;
    const autocorrectAcceptanceRate =
      autocorrectSuggestions > 0 ? autocorrectAcceptances / autocorrectSuggestions : 0;

    // Aggregate top failures, ambiguities, and autocorrects
    const topFailedInputs = this.getTopFailedInputs(events);
    const topAmbiguousPhrases = this.getTopAmbiguousPhrases(events);
    const topAutocorrects = this.getTopAutocorrects(events);

    // Determine time range
    const timestamps = events.map((e) => e.timestamp);
    const actualStartTime = startTime || (timestamps.length > 0 ? timestamps[0] : new Date());
    const actualEndTime =
      endTime || (timestamps.length > 0 ? timestamps[timestamps.length - 1] : new Date());

    return {
      totalEvents: events.length,
      parseAttempts,
      parseSuccesses,
      parseFailures,
      parseSuccessRate,
      fuzzyMatches,
      autocorrectSuggestions,
      autocorrectAcceptances,
      autocorrectRejections,
      autocorrectAcceptanceRate,
      disambiguationShown,
      disambiguationSelections,
      disambiguationCancellations,
      multiCommands,
      ordinalSelections,
      topFailedInputs,
      topAmbiguousPhrases,
      topAutocorrects,
      startTime: actualStartTime,
      endTime: actualEndTime,
    };
  }

  /**
   * Export anonymized telemetry data for ML training.
   * Only exports if remote transmission is allowed.
   */
  exportAnonymizedData(): Record<string, unknown>[] | null {
    if (!this.privacyConfig.allowRemoteTransmission) {
      console.warn(
        'Telemetry export blocked: Remote transmission not allowed. ' +
          'Set allowRemoteTransmission: true in privacy config.'
      );
      return null;
    }

    return this.events.map((event) => ({
      type: event.type,
      timestamp: event.timestamp.toISOString(),
      // Remove any potentially identifying information
      data: this.anonymizeEventData(event.data),
    }));
  }

  /**
   * Clear all logged events
   */
  clearEvents(): void {
    this.events = [];
  }

  /**
   * Log a custom event with arbitrary type and data.
   * Useful for components and services that need to log domain-specific events.
   *
   * @param type Event type string
   * @param data Event data
   */
  logEvent(type: string, data: Record<string, unknown>): void {
    this.logTypedEvent(type as TelemetryEventType, data);
  }

  /**
   * Internal method to log an event
   */
  private logTypedEvent(type: TelemetryEventType, data: Record<string, unknown>): void {
    if (!this.privacyConfig.enabled) {
      return;
    }

    const event: TelemetryEvent = {
      type,
      timestamp: new Date(),
      data,
    };

    this.events.push(event);

    // Log to console in development (only if not in production)
    if (!this.isProduction()) {
      // eslint-disable-next-line no-console
      console.log(`[Telemetry] ${type}:`, data);
    }
  }

  /**
   * Check if running in production environment
   */
  private isProduction(): boolean {
    // In a real app, this would check Angular environment or NODE_ENV
    return false;
  }

  /**
   * Anonymize event data by removing input text if configured
   */
  private anonymizeEventData(data: Record<string, unknown>): Record<string, unknown> {
    const anonymized = { ...data };

    // Remove input fields if input collection is disabled
    if (!this.privacyConfig.collectInput) {
      delete anonymized['rawInput'];
      delete anonymized['input'];
    }

    return anonymized;
  }

  /**
   * Get top failed inputs with counts
   */
  private getTopFailedInputs(events: TelemetryEvent[]): { input: string; count: number }[] {
    if (!this.privacyConfig.collectInput) {
      return [];
    }

    const failures = events.filter((e) => e.type === TelemetryEventType.PARSE_FAILURE);
    const inputCounts = new Map<string, number>();

    for (const event of failures) {
      const input = event.data['rawInput'] as string;
      if (input) {
        inputCounts.set(input, (inputCounts.get(input) || 0) + 1);
      }
    }

    return Array.from(inputCounts.entries())
      .map(([input, count]) => ({ input, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Get top ambiguous phrases with counts
   */
  private getTopAmbiguousPhrases(events: TelemetryEvent[]): { phrase: string; count: number }[] {
    if (!this.privacyConfig.collectInput) {
      return [];
    }

    const disambiguations = events.filter(
      (e) => e.type === TelemetryEventType.DISAMBIGUATION_SHOWN
    );
    const phraseCounts = new Map<string, number>();

    for (const event of disambiguations) {
      const phrase = event.data['input'] as string;
      if (phrase) {
        phraseCounts.set(phrase, (phraseCounts.get(phrase) || 0) + 1);
      }
    }

    return Array.from(phraseCounts.entries())
      .map(([phrase, count]) => ({ phrase, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Get top autocorrect suggestions with counts
   */
  private getTopAutocorrects(
    events: TelemetryEvent[]
  ): { from: string; to: string; count: number }[] {
    if (!this.privacyConfig.collectInput) {
      return [];
    }

    const autocorrects = events.filter((e) => e.type === TelemetryEventType.AUTOCORRECT_ACCEPTED);
    const autocorrectCounts = new Map<string, number>();

    for (const event of autocorrects) {
      const from = event.data['input'] as string;
      const to = event.data['correction'] as string;
      if (from && to) {
        const key = `${from}→${to}`;
        autocorrectCounts.set(key, (autocorrectCounts.get(key) || 0) + 1);
      }
    }

    return Array.from(autocorrectCounts.entries())
      .map(([key, count]) => {
        const [from, to] = key.split('→');
        return { from, to, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
}
