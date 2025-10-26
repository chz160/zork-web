import { Injectable } from '@angular/core';

/**
 * Telemetry event types for parser interactions
 */
export enum TelemetryEventType {
  PARSE_SUCCESS = 'parse_success',
  PARSE_FAILURE = 'parse_failure',
  FUZZY_MATCH = 'fuzzy_match',
  AUTOCORRECT_SUGGESTION = 'autocorrect_suggestion',
  AUTOCORRECT_ACCEPTED = 'autocorrect_accepted',
  DISAMBIGUATION_SHOWN = 'disambiguation_shown',
  DISAMBIGUATION_SELECTED = 'disambiguation_selected',
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
 * Telemetry service for tracking parser interactions and user behavior.
 * Logs all failed or ambiguous parses, autocorrect suggestions, and user choices.
 *
 * This is a stub implementation that logs to console.
 * In production, this could be wired to analytics services.
 */
@Injectable({
  providedIn: 'root',
})
export class TelemetryService {
  private events: TelemetryEvent[] = [];
  private enabled = true;

  /**
   * Enable or disable telemetry
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Log a parse success event
   */
  logParseSuccess(rawInput: string): void {
    this.logTypedEvent(TelemetryEventType.PARSE_SUCCESS, { rawInput });
  }

  /**
   * Log a parse failure event
   */
  logParseFailure(data: ParseFailureData): void {
    this.logTypedEvent(TelemetryEventType.PARSE_FAILURE, data);
  }

  /**
   * Log a fuzzy match event
   */
  logFuzzyMatch(data: FuzzyMatchData): void {
    this.logTypedEvent(TelemetryEventType.FUZZY_MATCH, data);
  }

  /**
   * Log an autocorrect suggestion event
   */
  logAutocorrectSuggestion(input: string, suggestion: string, score: number): void {
    this.logTypedEvent(TelemetryEventType.AUTOCORRECT_SUGGESTION, { input, suggestion, score });
  }

  /**
   * Log an autocorrect accepted event
   */
  logAutocorrectAccepted(input: string, correction: string): void {
    this.logTypedEvent(TelemetryEventType.AUTOCORRECT_ACCEPTED, { input, correction });
  }

  /**
   * Log a disambiguation shown event
   */
  logDisambiguationShown(data: DisambiguationData): void {
    this.logTypedEvent(TelemetryEventType.DISAMBIGUATION_SHOWN, data);
  }

  /**
   * Log a disambiguation selected event
   */
  logDisambiguationSelected(data: DisambiguationData): void {
    this.logTypedEvent(TelemetryEventType.DISAMBIGUATION_SELECTED, data);
  }

  /**
   * Log a multi-command event
   */
  logMultiCommand(data: MultiCommandData): void {
    this.logTypedEvent(TelemetryEventType.MULTI_COMMAND, data);
  }

  /**
   * Log an ordinal selection event
   */
  logOrdinalSelection(input: string, ordinal: number, object: string): void {
    this.logTypedEvent(TelemetryEventType.ORDINAL_SELECTION, { input, ordinal, object });
  }

  /**
   * Get all logged events
   */
  getEvents(): TelemetryEvent[] {
    return [...this.events];
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
    if (!this.enabled) {
      return;
    }

    const event: TelemetryEvent = {
      type,
      timestamp: new Date(),
      data,
    };

    this.events.push(event);

    // Log to console in development
    if (typeof console !== 'undefined') {
      console.log(`[Telemetry] ${type}:`, data);
    }
  }
}
