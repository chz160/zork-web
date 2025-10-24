import { TestBed } from '@angular/core/testing';
import { CommandConfigService } from './command-config.service';

describe('CommandConfigService', () => {
  let service: CommandConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CommandConfigService],
    });
    service = TestBed.inject(CommandConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Configuration Loading', () => {
    it('should load verbs configuration', () => {
      const verbs = service.getVerbs();
      expect(verbs).toBeTruthy();
      expect(verbs['examine']).toContain('look');
      expect(verbs['take']).toContain('get');
    });

    it('should load phrasal verbs configuration', () => {
      const phrasalVerbs = service.getPhrasalVerbs();
      expect(phrasalVerbs).toBeTruthy();
      expect(phrasalVerbs['look in']).toEqual({ intent: 'examine', preposition: 'in' });
      expect(phrasalVerbs['pick up']).toEqual({ intent: 'take' });
    });

    it('should load pronouns', () => {
      const pronouns = service.getPronouns();
      expect(pronouns).toBeTruthy();
      expect(pronouns).toContain('it');
      expect(pronouns).toContain('them');
    });

    it('should load determiners', () => {
      const determiners = service.getDeterminers();
      expect(determiners).toBeTruthy();
      expect(determiners).toContain('the');
      expect(determiners).toContain('a');
    });

    it('should load prepositions', () => {
      const prepositions = service.getPrepositions();
      expect(prepositions).toBeTruthy();
      expect(prepositions).toContain('in');
      expect(prepositions).toContain('with');
    });

    it('should load object aliases', () => {
      const aliases = service.getObjectAliases();
      expect(aliases).toBeTruthy();
      expect(aliases['mailbox']).toContain('letterbox');
      expect(aliases['lamp']).toContain('lantern');
    });

    it('should load parser settings', () => {
      const settings = service.getSettings();
      expect(settings).toBeTruthy();
      expect(settings.fuzzyMatchThreshold).toBe(0.7);
      expect(settings.autoCorrectThreshold).toBe(0.85);
      expect(settings.maxDisambiguationCandidates).toBe(5);
      expect(settings.multiCommandPolicy).toBe('best-effort');
    });

    it('should provide full configuration', () => {
      const config = service.getConfig();
      expect(config).toBeTruthy();
      expect(config.verbs).toBeTruthy();
      expect(config.phrasalVerbs).toBeTruthy();
      expect(config.parserSettings).toBeTruthy();
    });
  });
});
