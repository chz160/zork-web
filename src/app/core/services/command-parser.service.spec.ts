import { TestBed } from '@angular/core/testing';
import { CommandParserService } from './command-parser.service';

describe('CommandParserService', () => {
  let service: CommandParserService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CommandParserService],
    });
    service = TestBed.inject(CommandParserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Basic Command Parsing', () => {
    it('should parse simple verb-only commands', () => {
      const result = service.parse('look');
      expect(result.isValid).toBe(true);
      expect(result.verb).toBe('look');
      expect(result.directObject).toBeNull();
      expect(result.indirectObject).toBeNull();
      expect(result.preposition).toBeNull();
    });

    it('should parse verb with direct object', () => {
      const result = service.parse('take lamp');
      expect(result.isValid).toBe(true);
      expect(result.verb).toBe('take');
      expect(result.directObject).toBe('lamp');
      expect(result.indirectObject).toBeNull();
      expect(result.preposition).toBeNull();
    });

    it('should parse verb with multi-word direct object', () => {
      const result = service.parse('examine brass lantern');
      expect(result.isValid).toBe(true);
      expect(result.verb).toBe('examine');
      expect(result.directObject).toBe('brass lantern');
      expect(result.indirectObject).toBeNull();
    });

    it('should parse complex verb-object-prep-object commands', () => {
      const result = service.parse('put lamp in mailbox');
      expect(result.isValid).toBe(true);
      expect(result.verb).toBe('put');
      expect(result.directObject).toBe('lamp');
      expect(result.preposition).toBe('in');
      expect(result.indirectObject).toBe('mailbox');
    });

    it('should parse unlock command with key', () => {
      const result = service.parse('unlock door with key');
      expect(result.isValid).toBe(true);
      expect(result.verb).toBe('unlock');
      expect(result.directObject).toBe('door');
      expect(result.preposition).toBe('with');
      expect(result.indirectObject).toBe('key');
    });
  });

  describe('Direction Commands', () => {
    it('should parse cardinal directions as go commands', () => {
      const directions = ['north', 'south', 'east', 'west'];
      directions.forEach((dir) => {
        const result = service.parse(dir);
        expect(result.isValid).toBe(true);
        expect(result.verb).toBe('go');
        expect(result.directObject).toBe(dir);
      });
    });

    it('should parse direction abbreviations', () => {
      const abbrevs = ['n', 's', 'e', 'w', 'u', 'd'];
      abbrevs.forEach((abbrev) => {
        const result = service.parse(abbrev);
        expect(result.isValid).toBe(true);
        expect(result.verb).toBe('go');
        expect(result.directObject).toBe(abbrev);
      });
    });

    it('should parse intercardinal directions', () => {
      const result = service.parse('northeast');
      expect(result.isValid).toBe(true);
      expect(result.verb).toBe('go');
      expect(result.directObject).toBe('northeast');
    });
  });

  describe('Verb Aliases', () => {
    it('should recognize verb aliases', () => {
      const result = service.parse('get lamp');
      expect(result.isValid).toBe(true);
      expect(result.verb).toBe('take');
      expect(result.directObject).toBe('lamp');
    });

    it('should recognize "x" as examine', () => {
      const result = service.parse('x mailbox');
      expect(result.isValid).toBe(true);
      expect(result.verb).toBe('examine');
      expect(result.directObject).toBe('mailbox');
    });

    it('should recognize "i" as inventory', () => {
      const result = service.parse('i');
      expect(result.isValid).toBe(true);
      expect(result.verb).toBe('inventory');
    });

    it('should recognize "l" as look', () => {
      const result = service.parse('l');
      expect(result.isValid).toBe(true);
      expect(result.verb).toBe('look');
    });

    it('should recognize "?" as help', () => {
      const result = service.parse('?');
      expect(result.isValid).toBe(true);
      expect(result.verb).toBe('help');
    });
  });

  describe('Noise Word Filtering', () => {
    it('should filter articles from commands', () => {
      const result = service.parse('take the lamp');
      expect(result.isValid).toBe(true);
      expect(result.directObject).toBe('lamp');
    });

    it('should filter multiple noise words', () => {
      const result = service.parse('examine the rusty old mailbox');
      expect(result.isValid).toBe(true);
      expect(result.directObject).toBe('rusty old mailbox');
    });

    it('should keep prepositions even if they might be noise words', () => {
      const result = service.parse('put lamp in the box');
      expect(result.isValid).toBe(true);
      expect(result.preposition).toBe('in');
      expect(result.indirectObject).toBe('box');
    });
  });

  describe('Case Insensitivity', () => {
    it('should handle uppercase input', () => {
      const result = service.parse('TAKE LAMP');
      expect(result.isValid).toBe(true);
      expect(result.verb).toBe('take');
      expect(result.directObject).toBe('lamp');
    });

    it('should handle mixed case input', () => {
      const result = service.parse('TaKe ThE LaMp');
      expect(result.isValid).toBe(true);
      expect(result.verb).toBe('take');
      expect(result.directObject).toBe('lamp');
    });
  });

  describe('Whitespace Handling', () => {
    it('should handle leading and trailing whitespace', () => {
      const result = service.parse('  take lamp  ');
      expect(result.isValid).toBe(true);
      expect(result.verb).toBe('take');
      expect(result.directObject).toBe('lamp');
    });

    it('should handle multiple spaces between words', () => {
      const result = service.parse('take    the    lamp');
      expect(result.isValid).toBe(true);
      expect(result.verb).toBe('take');
      expect(result.directObject).toBe('lamp');
    });

    it('should handle tab characters', () => {
      const result = service.parse('take\tlamp');
      expect(result.isValid).toBe(true);
      expect(result.verb).toBe('take');
      expect(result.directObject).toBe('lamp');
    });
  });

  describe('Error Handling', () => {
    it('should reject empty input', () => {
      const result = service.parse('');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Please enter a command.');
    });

    it('should reject whitespace-only input', () => {
      const result = service.parse('   ');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Please enter a command.');
    });

    it('should reject unrecognized verbs', () => {
      const result = service.parse('dance');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain("don't understand");
      expect(result.errorMessage).toContain('dance');
    });

    it('should reject verbs that require objects when none provided', () => {
      const result = service.parse('take');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('What do you want to take?');
    });

    it('should reject verbs that require objects when only noise words provided', () => {
      const result = service.parse('take the');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('What do you want to take?');
    });

    it("should reject prepositions on verbs that don't allow them", () => {
      const result = service.parse('take lamp with hand');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain("doesn't take a preposition");
    });

    it('should reject incomplete prepositional phrases - missing direct object', () => {
      const result = service.parse('put in box');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('What do you want to put?');
    });

    it('should reject incomplete prepositional phrases - missing indirect object', () => {
      const result = service.parse('put lamp in');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('in what?');
    });
  });

  describe('Edge Cases', () => {
    it('should handle commands with only noise words after verb (excluding prepositions)', () => {
      // "a" and "the" are noise words, "look" doesn't require object
      const result = service.parse('look a the');
      expect(result.isValid).toBe(true);
      expect(result.verb).toBe('look');
      expect(result.directObject).toBeNull();
    });

    it('should preserve raw input', () => {
      const input = 'TaKe  THE   LaMp';
      const result = service.parse(input);
      expect(result.rawInput).toBe(input);
    });

    it('should handle complex object names with prepositions preserved', () => {
      const result = service.parse('put gold key in wooden box');
      expect(result.isValid).toBe(true);
      expect(result.directObject).toBe('gold key');
      expect(result.preposition).toBe('in');
      expect(result.indirectObject).toBe('wooden box');
    });

    it('should handle multiple prepositions (use first one)', () => {
      const result = service.parse('put lamp in box on table');
      expect(result.isValid).toBe(true);
      expect(result.directObject).toBe('lamp');
      expect(result.preposition).toBe('in');
      expect(result.indirectObject).toBe('box on table');
    });
  });

  describe('Specific Verb Tests', () => {
    it('should handle attack command with weapon', () => {
      const result = service.parse('attack troll with sword');
      expect(result.isValid).toBe(true);
      expect(result.verb).toBe('attack');
      expect(result.directObject).toBe('troll');
      expect(result.preposition).toBe('with');
      expect(result.indirectObject).toBe('sword');
    });

    it('should handle light command', () => {
      const result = service.parse('light lamp');
      expect(result.isValid).toBe(true);
      expect(result.verb).toBe('light');
      expect(result.directObject).toBe('lamp');
    });

    it('should handle extinguish command', () => {
      const result = service.parse('extinguish torch');
      expect(result.isValid).toBe(true);
      expect(result.verb).toBe('extinguish');
      expect(result.directObject).toBe('torch');
    });

    it('should handle read command', () => {
      const result = service.parse('read leaflet');
      expect(result.isValid).toBe(true);
      expect(result.verb).toBe('read');
      expect(result.directObject).toBe('leaflet');
    });

    it('should handle save command', () => {
      const result = service.parse('save');
      expect(result.isValid).toBe(true);
      expect(result.verb).toBe('save');
      expect(result.directObject).toBeNull();
    });

    it('should handle load command', () => {
      const result = service.parse('load');
      expect(result.isValid).toBe(true);
      expect(result.verb).toBe('load');
      expect(result.directObject).toBeNull();
    });

    it('should handle quit command', () => {
      const result = service.parse('quit');
      expect(result.isValid).toBe(true);
      expect(result.verb).toBe('quit');
      expect(result.directObject).toBeNull();
    });
  });

  describe('Helper Methods', () => {
    it('should return all available verbs', () => {
      const verbs = service.getAvailableVerbs();
      expect(verbs.length).toBeGreaterThan(0);
      expect(verbs[0].name).toBeDefined();
      expect(verbs[0].aliases).toBeDefined();
      expect(verbs[0].requiresObject).toBeDefined();
    });

    it('should correctly identify verbs', () => {
      expect(service.isVerb('take')).toBe(true);
      expect(service.isVerb('get')).toBe(true); // alias
      expect(service.isVerb('dance')).toBe(false);
    });

    it('should correctly identify directions', () => {
      expect(service.isDirection('north')).toBe(true);
      expect(service.isDirection('n')).toBe(true);
      expect(service.isDirection('lamp')).toBe(false);
    });
  });

  describe('Real-world Zork Commands', () => {
    it('should parse "open mailbox"', () => {
      const result = service.parse('open mailbox');
      expect(result.isValid).toBe(true);
      expect(result.verb).toBe('open');
      expect(result.directObject).toBe('mailbox');
    });

    it('should parse "go north"', () => {
      const result = service.parse('go north');
      expect(result.isValid).toBe(true);
      expect(result.verb).toBe('go');
      expect(result.directObject).toBe('north');
    });

    it('should parse "unlock door with brass key"', () => {
      const result = service.parse('unlock door with brass key');
      expect(result.isValid).toBe(true);
      expect(result.verb).toBe('unlock');
      expect(result.directObject).toBe('door');
      expect(result.preposition).toBe('with');
      expect(result.indirectObject).toBe('brass key');
    });

    it('should parse "put all in sack"', () => {
      const result = service.parse('put all in sack');
      expect(result.isValid).toBe(true);
      expect(result.verb).toBe('put');
      expect(result.directObject).toBe('all');
      expect(result.preposition).toBe('in');
      expect(result.indirectObject).toBe('sack');
    });

    it('should parse "attack troll with sword"', () => {
      const result = service.parse('attack troll with sword');
      expect(result.isValid).toBe(true);
      expect(result.verb).toBe('attack');
      expect(result.directObject).toBe('troll');
      expect(result.preposition).toBe('with');
      expect(result.indirectObject).toBe('sword');
    });
  });

  describe('Ambiguity Handling', () => {
    it('should parse commands with potentially ambiguous objects', () => {
      // "take lamp" could refer to "brass lamp" or "rusty lamp"
      // Parser extracts "lamp" and lets game engine resolve
      const result = service.parse('take lamp');
      expect(result.isValid).toBe(true);
      expect(result.directObject).toBe('lamp');
    });

    it('should allow specific object references', () => {
      const result = service.parse('take brass lamp');
      expect(result.isValid).toBe(true);
      expect(result.directObject).toBe('brass lamp');
    });
  });

  describe('Additional Edge Cases', () => {
    it('should parse commands with go explicitly stated', () => {
      const result = service.parse('go north');
      expect(result.isValid).toBe(true);
      expect(result.verb).toBe('go');
      expect(result.directObject).toBe('north');
    });

    it('should handle close verb with alias "shut"', () => {
      const result = service.parse('shut door');
      expect(result.isValid).toBe(true);
      expect(result.verb).toBe('close');
      expect(result.directObject).toBe('door');
    });

    it('should handle exit/quit aliases', () => {
      const exitResult = service.parse('exit');
      expect(exitResult.isValid).toBe(true);
      expect(exitResult.verb).toBe('quit');

      const qResult = service.parse('q');
      expect(qResult.isValid).toBe(true);
      expect(qResult.verb).toBe('quit');
    });

    it('should handle restore as alias for load', () => {
      const result = service.parse('restore');
      expect(result.isValid).toBe(true);
      expect(result.verb).toBe('load');
    });

    it('should handle kill/fight/hit/strike as attack aliases', () => {
      const aliases = ['kill', 'fight', 'hit', 'strike'];
      aliases.forEach((alias) => {
        const result = service.parse(`${alias} troll`);
        expect(result.isValid).toBe(true);
        expect(result.verb).toBe('attack');
        expect(result.directObject).toBe('troll');
      });
    });

    it('should handle walk/move/travel as go aliases', () => {
      const aliases = ['walk', 'move', 'travel'];
      aliases.forEach((alias) => {
        const result = service.parse(`${alias} north`);
        expect(result.isValid).toBe(true);
        expect(result.verb).toBe('go');
        expect(result.directObject).toBe('north');
      });
    });

    it('should handle intercardinal direction shortcuts', () => {
      const result = service.parse('ne');
      expect(result.isValid).toBe(true);
      expect(result.verb).toBe('go');
      expect(result.directObject).toBe('ne');
    });

    it('should handle place/insert as put aliases', () => {
      const result = service.parse('place key in box');
      expect(result.isValid).toBe(true);
      expect(result.verb).toBe('put');
      expect(result.directObject).toBe('key');
      expect(result.preposition).toBe('in');
      expect(result.indirectObject).toBe('box');
    });

    it('should handle ignite as light alias', () => {
      const result = service.parse('ignite torch');
      expect(result.isValid).toBe(true);
      expect(result.verb).toBe('light');
      expect(result.directObject).toBe('torch');
    });

    it('should handle douse as extinguish alias', () => {
      const result = service.parse('douse lamp');
      expect(result.isValid).toBe(true);
      expect(result.verb).toBe('extinguish');
      expect(result.directObject).toBe('lamp');
    });

    it('should preserve case in object names while normalizing verbs', () => {
      const result = service.parse('EXAMINE the BRASS Lamp');
      expect(result.isValid).toBe(true);
      expect(result.verb).toBe('examine');
      expect(result.directObject).toBe('brass lamp');
    });

    it('should handle discard as drop alias', () => {
      const result = service.parse('discard lamp');
      expect(result.isValid).toBe(true);
      expect(result.verb).toBe('drop');
      expect(result.directObject).toBe('lamp');
    });

    it('should handle grab/pick as take aliases', () => {
      const grabResult = service.parse('grab key');
      expect(grabResult.isValid).toBe(true);
      expect(grabResult.verb).toBe('take');

      const pickResult = service.parse('pick sword');
      expect(pickResult.isValid).toBe(true);
      expect(pickResult.verb).toBe('take');
    });

    it('should handle inspect/check as examine aliases', () => {
      const inspectResult = service.parse('inspect door');
      expect(inspectResult.isValid).toBe(true);
      expect(inspectResult.verb).toBe('examine');

      const checkResult = service.parse('check mailbox');
      expect(checkResult.isValid).toBe(true);
      expect(checkResult.verb).toBe('examine');
    });

    it('should handle head as go alias', () => {
      const result = service.parse('head south');
      expect(result.isValid).toBe(true);
      expect(result.verb).toBe('go');
      expect(result.directObject).toBe('south');
    });

    it('should handle inv as inventory alias', () => {
      const result = service.parse('inv');
      expect(result.isValid).toBe(true);
      expect(result.verb).toBe('inventory');
    });
  });
});
