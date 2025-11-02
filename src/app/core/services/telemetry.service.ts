import { Injectable } from '@angular/core';

/**
 * Telemetry event types for parser interactions and thief behavior
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

  // Thief events
  THIEF_TICK = 'thief.tick',
  ITEM_STOLEN = 'thief.item_stolen',
  ITEM_DEPOSITED = 'thief.item_deposited',
  THIEF_DEATH = 'thief.death',
  THIEF_REVIVED = 'thief.revived',
  THIEF_GIFT_ACCEPTED = 'thief.gift_accepted',
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
 * Thief tick event data
 */
export interface ThiefTickData extends Record<string, unknown> {
  actorId: string;
  fromRoomId: string;
  toRoomId?: string;
  mode: string;
}

/**
 * Item stolen event data
 */
export interface ItemStolenData extends Record<string, unknown> {
  actorId: string;
  itemIds: string[];
  fromRoomId: string;
  toRoomId: string;
  probability?: number;
}

/**
 * Item deposited event data
 */
export interface ItemDepositedData extends Record<string, unknown> {
  actorId: string;
  itemIds: string[];
  fromRoomId: string;
  toRoomId: string;
}

/**
 * Thief death event data
 */
export interface ThiefDeathData extends Record<string, unknown> {
  actorId: string;
  roomId: string;
  strength: number;
}

/**
 * Thief revived event data
 */
export interface ThiefRevivedData extends Record<string, unknown> {
  actorId: string;
  roomId: string;
  newStrength: number;
}

/**
 * Thief gift accepted event data
 */
export interface ThiefGiftAcceptedData extends Record<string, unknown> {
  actorId: string;
  itemId: string;
  itemValue: number;
  roomId: string;
  engrossed: boolean;
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
  /** Number of thief tick events */
  thiefTicks: number;
  /** Number of items stolen by thief */
  itemsStolen: number;
  /** Number of items deposited by thief */
  itemsDeposited: number;
  /** Number of thief deaths */
  thiefDeaths: number;
  /** Number of thief revivals */
  thiefRevivals: number;
  /** Number of gifts accepted by thief */
  thiefGiftsAccepted: number;
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
   * Log a thief tick event
   */
  logThiefTick(data: ThiefTickData): void {
    this.logTypedEvent(TelemetryEventType.THIEF_TICK, data);
  }

  /**
   * Log an item stolen event
   */
  logItemStolen(data: ItemStolenData): void {
    this.logTypedEvent(TelemetryEventType.ITEM_STOLEN, data);
  }

  /**
   * Log an item deposited event
   */
  logItemDeposited(data: ItemDepositedData): void {
    this.logTypedEvent(TelemetryEventType.ITEM_DEPOSITED, data);
  }

  /**
   * Log a thief death event
   */
  logThiefDeath(data: ThiefDeathData): void {
    this.logTypedEvent(TelemetryEventType.THIEF_DEATH, data);
  }

  /**
   * Log a thief revived event
   */
  logThiefRevived(data: ThiefRevivedData): void {
    this.logTypedEvent(TelemetryEventType.THIEF_REVIVED, data);
  }

  /**
   * Log a thief gift accepted event
   */
  logThiefGiftAccepted(data: ThiefGiftAcceptedData): void {
    this.logTypedEvent(TelemetryEventType.THIEF_GIFT_ACCEPTED, data);
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
    const thiefTicks = events.filter((e) => e.type === TelemetryEventType.THIEF_TICK).length;
    const itemsStolen = events.filter((e) => e.type === TelemetryEventType.ITEM_STOLEN).length;
    const itemsDeposited = events.filter(
      (e) => e.type === TelemetryEventType.ITEM_DEPOSITED
    ).length;
    const thiefDeaths = events.filter((e) => e.type === TelemetryEventType.THIEF_DEATH).length;
    const thiefRevivals = events.filter((e) => e.type === TelemetryEventType.THIEF_REVIVED).length;
    const thiefGiftsAccepted = events.filter(
      (e) => e.type === TelemetryEventType.THIEF_GIFT_ACCEPTED
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
      thiefTicks,
      itemsStolen,
      itemsDeposited,
      thiefDeaths,
      thiefRevivals,
      thiefGiftsAccepted,
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
   * Export telemetry data as JSON string for download.
   * This method respects privacy settings and only exports data that is allowed.
   *
   * @param includeAnalytics Whether to include analytics summary in the export
   * @returns JSON string of telemetry data or null if export is not allowed
   */
  exportAsJSON(includeAnalytics = true): string | null {
    const data = this.exportAnonymizedData();
    if (!data) {
      return null;
    }

    const exportData: Record<string, unknown> = {
      events: data,
      exportedAt: new Date().toISOString(),
      privacyConfig: this.privacyConfig,
    };

    if (includeAnalytics) {
      exportData['analytics'] = this.getAnalytics();
    }

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Download telemetry data as a JSON file.
   * This triggers a browser download with the telemetry data.
   *
   * @param filename Optional filename for the download (default: telemetry-YYYY-MM-DD.json)
   * @param includeAnalytics Whether to include analytics summary in the export
   * @returns true if download was initiated, false if export was blocked
   */
  downloadAsJSON(filename?: string, includeAnalytics = true): boolean {
    const json = this.exportAsJSON(includeAnalytics);
    if (!json) {
      return false;
    }

    // Generate filename with timestamp if not provided
    const defaultFilename = `telemetry-${new Date().toISOString().split('T')[0]}.json`;
    const finalFilename = filename || defaultFilename;

    // Create a blob and download link
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(url);

    return true;
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
