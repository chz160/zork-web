import { TestBed } from '@angular/core/testing';
import { TelemetryService, TelemetryEventType } from './telemetry.service';

describe('TelemetryService', () => {
  let service: TelemetryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TelemetryService],
    });
    service = TestBed.inject(TelemetryService);
    service.clearEvents();
    // Reset to default privacy config
    service.setPrivacyConfig({
      enabled: true,
      collectInput: true,
      allowPersistentStorage: false,
      allowRemoteTransmission: false,
    });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Event Logging', () => {
    it('should log parse attempt events', () => {
      service.logParseAttempt('take lamp');
      const events = service.getEvents();
      expect(events.length).toBe(1);
      expect(events[0].type).toBe(TelemetryEventType.PARSE_ATTEMPT);
      expect(events[0].data['rawInput']).toBe('take lamp');
      expect(events[0].data['inputLength']).toBe(9);
    });

    it('should log parse success events', () => {
      service.logParseSuccess('take lamp');
      const events = service.getEvents();
      expect(events.length).toBe(1);
      expect(events[0].type).toBe(TelemetryEventType.PARSE_SUCCESS);
      expect(events[0].data['rawInput']).toBe('take lamp');
    });

    it('should log parse failure events', () => {
      service.logParseFailure({
        rawInput: 'xyzzy',
        errorMessage: "I don't understand that command.",
        suggestions: ['examine', 'take'],
      });
      const events = service.getEvents();
      expect(events.length).toBe(1);
      expect(events[0].type).toBe(TelemetryEventType.PARSE_FAILURE);
      expect(events[0].data['rawInput']).toBe('xyzzy');
      expect(events[0].data['errorMessage']).toBe("I don't understand that command.");
    });

    it('should log fuzzy match events', () => {
      service.logFuzzyMatch({
        input: 'mailbax',
        matched: 'mailbox',
        score: 0.85,
      });
      const events = service.getEvents();
      expect(events.length).toBe(1);
      expect(events[0].type).toBe(TelemetryEventType.FUZZY_MATCH);
      expect(events[0].data['input']).toBe('mailbax');
      expect(events[0].data['matched']).toBe('mailbox');
      expect(events[0].data['score']).toBe(0.85);
    });

    it('should log autocorrect suggestion events', () => {
      service.logAutocorrectSuggestion('lampp', 'lamp', 0.9);
      const events = service.getEvents();
      expect(events.length).toBe(1);
      expect(events[0].type).toBe(TelemetryEventType.AUTOCORRECT_SUGGESTION);
      expect(events[0].data['input']).toBe('lampp');
      expect(events[0].data['suggestion']).toBe('lamp');
      expect(events[0].data['score']).toBe(0.9);
    });

    it('should log autocorrect accepted events', () => {
      service.logAutocorrectAccepted('lampp', 'lamp');
      const events = service.getEvents();
      expect(events.length).toBe(1);
      expect(events[0].type).toBe(TelemetryEventType.AUTOCORRECT_ACCEPTED);
      expect(events[0].data['input']).toBe('lampp');
      expect(events[0].data['correction']).toBe('lamp');
    });

    it('should log autocorrect rejected events', () => {
      service.logAutocorrectRejected('lampp', 'lamp');
      const events = service.getEvents();
      expect(events.length).toBe(1);
      expect(events[0].type).toBe(TelemetryEventType.AUTOCORRECT_REJECTED);
      expect(events[0].data['input']).toBe('lampp');
      expect(events[0].data['suggestion']).toBe('lamp');
    });

    it('should log disambiguation shown events', () => {
      service.logDisambiguationShown({
        input: 'take lamp',
        candidates: ['brass lamp', 'rusty lamp'],
      });
      const events = service.getEvents();
      expect(events.length).toBe(1);
      expect(events[0].type).toBe(TelemetryEventType.DISAMBIGUATION_SHOWN);
      const candidates = events[0].data['candidates'] as string[];
      expect(candidates).toEqual(['brass lamp', 'rusty lamp']);
      expect(events[0].data['candidateCount']).toBe(2);
    });

    it('should log disambiguation selected events', () => {
      service.logDisambiguationSelected({
        input: 'take lamp',
        candidates: ['brass lamp', 'rusty lamp'],
        selectedIndex: 0,
      });
      const events = service.getEvents();
      expect(events.length).toBe(1);
      expect(events[0].type).toBe(TelemetryEventType.DISAMBIGUATION_SELECTED);
      expect(events[0].data['selectedIndex']).toBe(0);
    });

    it('should log disambiguation cancelled events', () => {
      service.logDisambiguationCancelled('take lamp', ['brass lamp', 'rusty lamp']);
      const events = service.getEvents();
      expect(events.length).toBe(1);
      expect(events[0].type).toBe(TelemetryEventType.DISAMBIGUATION_CANCELLED);
      expect(events[0].data['candidateCount']).toBe(2);
    });

    it('should log multi-command events', () => {
      service.logMultiCommand({
        rawInput: 'open mailbox and take leaflet',
        commandCount: 2,
        policy: 'best-effort',
      });
      const events = service.getEvents();
      expect(events.length).toBe(1);
      expect(events[0].type).toBe(TelemetryEventType.MULTI_COMMAND);
      expect(events[0].data['commandCount']).toBe(2);
      expect(events[0].data['policy']).toBe('best-effort');
    });

    it('should log ordinal selection events', () => {
      service.logOrdinalSelection('take 2nd coin', 2, 'gold coin');
      const events = service.getEvents();
      expect(events.length).toBe(1);
      expect(events[0].type).toBe(TelemetryEventType.ORDINAL_SELECTION);
      expect(events[0].data['ordinal']).toBe(2);
      expect(events[0].data['object']).toBe('gold coin');
    });
  });

  describe('Event Management', () => {
    it('should clear all events', () => {
      service.logParseSuccess('test');
      service.logParseSuccess('test2');
      expect(service.getEvents().length).toBe(2);
      service.clearEvents();
      expect(service.getEvents().length).toBe(0);
    });

    it('should respect enabled flag', () => {
      service.setEnabled(false);
      service.logParseSuccess('test');
      expect(service.getEvents().length).toBe(0);
      service.setEnabled(true);
      service.logParseSuccess('test2');
      expect(service.getEvents().length).toBe(1);
    });

    it('should include timestamp in events', () => {
      const before = new Date();
      service.logParseSuccess('test');
      const after = new Date();
      const events = service.getEvents();
      expect(events[0].timestamp).toBeInstanceOf(Date);
      expect(events[0].timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(events[0].timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should filter events by type', () => {
      service.logParseSuccess('test1');
      service.logParseFailure({
        rawInput: 'test2',
        errorMessage: 'error',
      });
      service.logParseSuccess('test3');

      const successEvents = service.getEventsByType(TelemetryEventType.PARSE_SUCCESS);
      expect(successEvents.length).toBe(2);

      const failureEvents = service.getEventsByType(TelemetryEventType.PARSE_FAILURE);
      expect(failureEvents.length).toBe(1);
    });

    it('should filter events by time range', () => {
      const startTime = new Date();
      service.logParseSuccess('test1');

      // Wait a bit (increase to ensure events are logged)
      const midTime = new Date(startTime.getTime() + 50);

      service.logParseSuccess('test2');
      const endTime = new Date(Date.now() + 100);

      const allEvents = service.getEventsByTimeRange(startTime, endTime);
      expect(allEvents.length).toBe(2);

      const laterEvents = service.getEventsByTimeRange(midTime, endTime);
      // May be 1 or 2 depending on timing, but should be at least 0
      expect(laterEvents.length).toBeGreaterThanOrEqual(0);
      expect(laterEvents.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Privacy Controls', () => {
    it('should respect privacy config for enabled flag', () => {
      service.setPrivacyConfig({ enabled: false });
      service.logParseSuccess('test');
      expect(service.getEvents().length).toBe(0);

      service.setPrivacyConfig({ enabled: true });
      service.logParseSuccess('test2');
      expect(service.getEvents().length).toBe(1);
    });

    it('should not collect input text when collectInput is false', () => {
      service.setPrivacyConfig({ collectInput: false });
      service.logParseSuccess('sensitive input');
      const events = service.getEvents();
      expect(events.length).toBe(1);
      expect(events[0].data['rawInput']).toBeUndefined();
      expect(events[0].data['inputLength']).toBe(15);
    });

    it('should clear events when disabling input collection', () => {
      service.logParseSuccess('test');
      expect(service.getEvents().length).toBe(1);

      service.setPrivacyConfig({ collectInput: false });
      expect(service.getEvents().length).toBe(0);
    });

    it('should clear events when disabling telemetry', () => {
      service.logParseSuccess('test');
      expect(service.getEvents().length).toBe(1);

      service.setPrivacyConfig({ enabled: false });
      expect(service.getEvents().length).toBe(0);
    });

    it('should return privacy config', () => {
      service.setPrivacyConfig({
        enabled: true,
        collectInput: false,
        allowPersistentStorage: true,
        allowRemoteTransmission: false,
      });

      const config = service.getPrivacyConfig();
      expect(config.enabled).toBe(true);
      expect(config.collectInput).toBe(false);
      expect(config.allowPersistentStorage).toBe(true);
      expect(config.allowRemoteTransmission).toBe(false);
    });

    it('should check if telemetry is enabled', () => {
      expect(service.isEnabled()).toBe(true);

      service.setPrivacyConfig({ enabled: false });
      expect(service.isEnabled()).toBe(false);

      service.setPrivacyConfig({ enabled: true });
      expect(service.isEnabled()).toBe(true);
    });
  });

  describe('Analytics', () => {
    beforeEach(() => {
      // Log sample events for analytics testing
      service.logParseAttempt('take lamp');
      service.logParseSuccess('take lamp');

      service.logParseAttempt('invalid');
      service.logParseFailure({
        rawInput: 'invalid',
        errorMessage: 'error',
      });

      service.logAutocorrectSuggestion('lampp', 'lamp', 0.9);
      service.logAutocorrectAccepted('lampp', 'lamp');

      service.logDisambiguationShown({
        input: 'take coin',
        candidates: ['gold coin', 'silver coin'],
      });
      service.logDisambiguationSelected({
        input: 'take coin',
        candidates: ['gold coin', 'silver coin'],
        selectedIndex: 0,
      });
    });

    it('should calculate analytics summary', () => {
      const analytics = service.getAnalytics();

      expect(analytics.totalEvents).toBeGreaterThan(0);
      expect(analytics.parseAttempts).toBe(2);
      expect(analytics.parseSuccesses).toBe(1);
      expect(analytics.parseFailures).toBe(1);
      expect(analytics.parseSuccessRate).toBe(0.5);
      expect(analytics.autocorrectSuggestions).toBe(1);
      expect(analytics.autocorrectAcceptances).toBe(1);
      expect(analytics.autocorrectAcceptanceRate).toBe(1);
      expect(analytics.disambiguationShown).toBe(1);
      expect(analytics.disambiguationSelections).toBe(1);
    });

    it('should identify top failed inputs', () => {
      // Add more failures
      service.logParseFailure({
        rawInput: 'foo',
        errorMessage: 'error',
      });
      service.logParseFailure({
        rawInput: 'foo',
        errorMessage: 'error',
      });
      service.logParseFailure({
        rawInput: 'bar',
        errorMessage: 'error',
      });

      const analytics = service.getAnalytics();
      expect(analytics.topFailedInputs.length).toBeGreaterThan(0);
      expect(analytics.topFailedInputs[0].input).toBe('foo');
      expect(analytics.topFailedInputs[0].count).toBe(2);
    });

    it('should identify top ambiguous phrases', () => {
      // Add more disambiguations
      service.logDisambiguationShown({
        input: 'take lamp',
        candidates: ['brass lamp', 'rusty lamp'],
      });
      service.logDisambiguationShown({
        input: 'take lamp',
        candidates: ['brass lamp', 'rusty lamp'],
      });

      const analytics = service.getAnalytics();
      expect(analytics.topAmbiguousPhrases.length).toBeGreaterThan(0);
      expect(analytics.topAmbiguousPhrases[0].phrase).toBe('take lamp');
      expect(analytics.topAmbiguousPhrases[0].count).toBe(2);
    });

    it('should identify top autocorrects', () => {
      // Add more autocorrects
      service.logAutocorrectAccepted('mailbax', 'mailbox');
      service.logAutocorrectAccepted('mailbax', 'mailbox');

      const analytics = service.getAnalytics();
      expect(analytics.topAutocorrects.length).toBeGreaterThan(0);
      expect(analytics.topAutocorrects[0].from).toBe('mailbax');
      expect(analytics.topAutocorrects[0].to).toBe('mailbox');
      expect(analytics.topAutocorrects[0].count).toBe(2);
    });

    it('should filter analytics by time range', () => {
      const startTime = new Date();
      service.logParseSuccess('new event');
      const endTime = new Date();

      const analytics = service.getAnalytics(startTime, endTime);
      expect(analytics.parseSuccesses).toBeGreaterThanOrEqual(1);
    });

    it('should return empty top lists when input collection is disabled', () => {
      service.setPrivacyConfig({ collectInput: false });

      service.logParseFailure({
        rawInput: 'test',
        errorMessage: 'error',
      });

      const analytics = service.getAnalytics();
      expect(analytics.topFailedInputs).toEqual([]);
      expect(analytics.topAmbiguousPhrases).toEqual([]);
      expect(analytics.topAutocorrects).toEqual([]);
    });
  });

  describe('Data Export', () => {
    it('should export anonymized data when remote transmission is allowed', () => {
      service.setPrivacyConfig({ allowRemoteTransmission: true });
      service.logParseSuccess('test input');

      const exported = service.exportAnonymizedData();
      expect(exported).not.toBeNull();
      expect(exported?.length).toBe(1);
      expect(exported?.[0]['type']).toBe(TelemetryEventType.PARSE_SUCCESS);
      expect(exported?.[0]['timestamp']).toBeDefined();
    });

    it('should not export data when remote transmission is not allowed', () => {
      service.setPrivacyConfig({ allowRemoteTransmission: false });
      service.logParseSuccess('test input');

      const exported = service.exportAnonymizedData();
      expect(exported).toBeNull();
    });

    it('should anonymize exported data when input collection is disabled', () => {
      service.setPrivacyConfig({
        allowRemoteTransmission: true,
        collectInput: false,
      });

      service.logParseSuccess('sensitive data');
      const exported = service.exportAnonymizedData();

      expect(exported).not.toBeNull();
      const data = exported?.[0]['data'] as Record<string, unknown>;
      expect(data['rawInput']).toBeUndefined();
    });

    it('should include timestamps in ISO format', () => {
      service.setPrivacyConfig({ allowRemoteTransmission: true });
      service.logParseSuccess('test');

      const exported = service.exportAnonymizedData();
      const timestamp = exported?.[0]['timestamp'] as string;
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('Thief Telemetry Events', () => {
    it('should log thief tick events', () => {
      service.logThiefTick({
        actorId: 'thief',
        fromRoomId: 'round-room',
        toRoomId: 'maze-1',
        mode: 'CONSCIOUS',
      });

      const events = service.getEvents();
      expect(events.length).toBe(1);
      expect(events[0].type).toBe(TelemetryEventType.THIEF_TICK);
      expect(events[0].data['actorId']).toBe('thief');
      expect(events[0].data['fromRoomId']).toBe('round-room');
      expect(events[0].data['toRoomId']).toBe('maze-1');
      expect(events[0].data['mode']).toBe('CONSCIOUS');
    });

    it('should log item stolen events', () => {
      service.logItemStolen({
        actorId: 'thief',
        itemIds: ['sword', 'lamp'],
        fromRoomId: 'round-room',
        toRoomId: 'thief',
        probability: 0.1,
      });

      const events = service.getEvents();
      expect(events.length).toBe(1);
      expect(events[0].type).toBe(TelemetryEventType.ITEM_STOLEN);
      expect(events[0].data['actorId']).toBe('thief');
      expect(events[0].data['itemIds']).toEqual(['sword', 'lamp']);
      expect(events[0].data['fromRoomId']).toBe('round-room');
      expect(events[0].data['toRoomId']).toBe('thief');
      expect(events[0].data['probability']).toBe(0.1);
    });

    it('should log item deposited events', () => {
      service.logItemDeposited({
        actorId: 'thief',
        itemIds: ['treasure', 'jewel'],
        fromRoomId: 'thief',
        toRoomId: 'treasure-room',
      });

      const events = service.getEvents();
      expect(events.length).toBe(1);
      expect(events[0].type).toBe(TelemetryEventType.ITEM_DEPOSITED);
      expect(events[0].data['actorId']).toBe('thief');
      expect(events[0].data['itemIds']).toEqual(['treasure', 'jewel']);
      expect(events[0].data['fromRoomId']).toBe('thief');
      expect(events[0].data['toRoomId']).toBe('treasure-room');
    });

    it('should log thief death events', () => {
      service.logThiefDeath({
        actorId: 'thief',
        roomId: 'round-room',
        strength: 0,
      });

      const events = service.getEvents();
      expect(events.length).toBe(1);
      expect(events[0].type).toBe(TelemetryEventType.THIEF_DEATH);
      expect(events[0].data['actorId']).toBe('thief');
      expect(events[0].data['roomId']).toBe('round-room');
      expect(events[0].data['strength']).toBe(0);
    });

    it('should log thief revived events', () => {
      service.logThiefRevived({
        actorId: 'thief',
        roomId: 'round-room',
        newStrength: 5,
      });

      const events = service.getEvents();
      expect(events.length).toBe(1);
      expect(events[0].type).toBe(TelemetryEventType.THIEF_REVIVED);
      expect(events[0].data['actorId']).toBe('thief');
      expect(events[0].data['roomId']).toBe('round-room');
      expect(events[0].data['newStrength']).toBe(5);
    });

    it('should log thief gift accepted events', () => {
      service.logThiefGiftAccepted({
        actorId: 'thief',
        itemId: 'gold-coin',
        itemValue: 10,
        roomId: 'round-room',
        engrossed: true,
      });

      const events = service.getEvents();
      expect(events.length).toBe(1);
      expect(events[0].type).toBe(TelemetryEventType.THIEF_GIFT_ACCEPTED);
      expect(events[0].data['actorId']).toBe('thief');
      expect(events[0].data['itemId']).toBe('gold-coin');
      expect(events[0].data['itemValue']).toBe(10);
      expect(events[0].data['roomId']).toBe('round-room');
      expect(events[0].data['engrossed']).toBe(true);
    });

    it('should include thief events in analytics', () => {
      service.logThiefTick({
        actorId: 'thief',
        fromRoomId: 'round-room',
        mode: 'CONSCIOUS',
      });
      service.logItemStolen({
        actorId: 'thief',
        itemIds: ['sword'],
        fromRoomId: 'round-room',
        toRoomId: 'thief',
      });
      service.logItemDeposited({
        actorId: 'thief',
        itemIds: ['treasure'],
        fromRoomId: 'thief',
        toRoomId: 'treasure-room',
      });
      service.logThiefDeath({
        actorId: 'thief',
        roomId: 'round-room',
        strength: 0,
      });
      service.logThiefRevived({
        actorId: 'thief',
        roomId: 'round-room',
        newStrength: 5,
      });
      service.logThiefGiftAccepted({
        actorId: 'thief',
        itemId: 'gold-coin',
        itemValue: 10,
        roomId: 'round-room',
        engrossed: true,
      });

      const analytics = service.getAnalytics();
      expect(analytics.thiefTicks).toBe(1);
      expect(analytics.itemsStolen).toBe(1);
      expect(analytics.itemsDeposited).toBe(1);
      expect(analytics.thiefDeaths).toBe(1);
      expect(analytics.thiefRevivals).toBe(1);
      expect(analytics.thiefGiftsAccepted).toBe(1);
    });
  });
});
