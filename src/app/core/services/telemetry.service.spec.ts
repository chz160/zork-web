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
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Event Logging', () => {
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
  });
});
