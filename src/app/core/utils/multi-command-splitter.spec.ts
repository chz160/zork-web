import { splitCommands, isMultiCommand, getCommandCount } from './multi-command-splitter';

describe('MultiCommandSplitter', () => {
  describe('splitCommands', () => {
    it('should handle single commands', () => {
      const result = splitCommands('take lamp');
      expect(result.isMultiCommand).toBe(false);
      expect(result.commands).toEqual(['take lamp']);
      expect(result.separators).toEqual([]);
    });

    it('should split commands with "and"', () => {
      const result = splitCommands('open mailbox and take leaflet');
      expect(result.isMultiCommand).toBe(true);
      expect(result.commands).toEqual(['open mailbox', 'take leaflet']);
      expect(result.separators).toEqual(['and']);
    });

    it('should split commands with "then"', () => {
      const result = splitCommands('go north then look around');
      expect(result.isMultiCommand).toBe(true);
      expect(result.commands).toEqual(['go north', 'look around']);
      expect(result.separators).toEqual(['then']);
    });

    it('should split commands with comma', () => {
      const result = splitCommands('take lamp, examine it');
      expect(result.isMultiCommand).toBe(true);
      expect(result.commands).toEqual(['take lamp', 'examine it']);
      expect(result.separators).toEqual([',']);
    });

    it('should split commands with "and then"', () => {
      const result = splitCommands('open door and then go inside');
      expect(result.isMultiCommand).toBe(true);
      expect(result.commands).toEqual(['open door', 'go inside']);
      expect(result.separators).toEqual(['and then']);
    });

    it('should handle multiple separators', () => {
      const result = splitCommands('take lamp, open mailbox and read leaflet');
      expect(result.isMultiCommand).toBe(true);
      expect(result.commands).toEqual(['take lamp', 'open mailbox', 'read leaflet']);
      expect(result.separators.length).toBe(2);
    });

    it('should handle three or more commands', () => {
      const result = splitCommands('north and east and south');
      expect(result.isMultiCommand).toBe(true);
      expect(result.commands).toEqual(['north', 'east', 'south']);
      expect(result.separators).toEqual(['and', 'and']);
    });

    it('should trim whitespace from commands', () => {
      const result = splitCommands('  take lamp  and   open mailbox  ');
      expect(result.isMultiCommand).toBe(true);
      expect(result.commands).toEqual(['take lamp', 'open mailbox']);
    });

    it('should be case-insensitive for separators', () => {
      const result1 = splitCommands('take lamp AND open mailbox');
      expect(result1.isMultiCommand).toBe(true);
      expect(result1.commands).toEqual(['take lamp', 'open mailbox']);

      const result2 = splitCommands('go north THEN look');
      expect(result2.isMultiCommand).toBe(true);
      expect(result2.commands).toEqual(['go north', 'look']);
    });

    it('should not split on "and" within object names', () => {
      // "and" should use word boundaries, but if it's part of a larger word, it shouldn't split
      const result = splitCommands('take wand');
      expect(result.isMultiCommand).toBe(false);
      expect(result.commands).toEqual(['take wand']);
    });

    it('should handle empty input', () => {
      const result = splitCommands('');
      expect(result.isMultiCommand).toBe(false);
      expect(result.commands).toEqual([]);
      expect(result.separators).toEqual([]);
    });

    it('should handle whitespace-only input', () => {
      const result = splitCommands('   ');
      expect(result.isMultiCommand).toBe(false);
      expect(result.commands).toEqual([]);
      expect(result.separators).toEqual([]);
    });

    it('should support custom separators', () => {
      const result = splitCommands('take lamp | open mailbox', ['|']);
      expect(result.isMultiCommand).toBe(true);
      expect(result.commands).toEqual(['take lamp', 'open mailbox']);
      expect(result.separators).toEqual(['|']);
    });

    it('should handle separators at the end gracefully', () => {
      const result = splitCommands('take lamp and');
      // When separator is at end with nothing after, treat as single command
      expect(result.isMultiCommand).toBe(false);
      expect(result.commands).toEqual(['take lamp and']);
    });

    it('should handle separators at the beginning gracefully', () => {
      const result = splitCommands('and take lamp');
      // When separator is at beginning with nothing before, treat as single command
      expect(result.isMultiCommand).toBe(false);
      expect(result.commands).toEqual(['and take lamp']);
    });
  });

  describe('isMultiCommand', () => {
    it('should return false for single commands', () => {
      expect(isMultiCommand('take lamp')).toBe(false);
      expect(isMultiCommand('open mailbox')).toBe(false);
      expect(isMultiCommand('inventory')).toBe(false);
    });

    it('should return true for multi-commands', () => {
      expect(isMultiCommand('take lamp and open mailbox')).toBe(true);
      expect(isMultiCommand('go north, look')).toBe(true);
      expect(isMultiCommand('open door then go inside')).toBe(true);
    });

    it('should handle empty input', () => {
      expect(isMultiCommand('')).toBe(false);
      expect(isMultiCommand('   ')).toBe(false);
    });
  });

  describe('getCommandCount', () => {
    it('should return 1 for single commands', () => {
      expect(getCommandCount('take lamp')).toBe(1);
      expect(getCommandCount('open mailbox')).toBe(1);
    });

    it('should return correct count for multi-commands', () => {
      expect(getCommandCount('take lamp and open mailbox')).toBe(2);
      expect(getCommandCount('north and east and south')).toBe(3);
      expect(getCommandCount('a, b, c, d')).toBe(4);
    });

    it('should return 0 for empty input', () => {
      expect(getCommandCount('')).toBe(0);
      expect(getCommandCount('   ')).toBe(0);
    });
  });

  describe('Real-world Zork scenarios', () => {
    it('should handle common Zork multi-commands', () => {
      const examples = [
        {
          input: 'open mailbox and take leaflet',
          expected: ['open mailbox', 'take leaflet'],
        },
        {
          input: 'go north, look around',
          expected: ['go north', 'look around'],
        },
        {
          input: 'take lamp and turn it on',
          expected: ['take lamp', 'turn it on'],
        },
        {
          input: 'unlock door with key then open door',
          expected: ['unlock door with key', 'open door'],
        },
        {
          input: 'examine mailbox and look inside',
          expected: ['examine mailbox', 'look inside'],
        },
      ];

      examples.forEach(({ input, expected }) => {
        const result = splitCommands(input);
        expect(result.commands).toEqual(expected);
      });
    });

    it('should not split commands with prepositions', () => {
      // These should remain as single commands because "and" appears in context where it's not a separator
      const result1 = splitCommands('put lamp in mailbox');
      expect(result1.isMultiCommand).toBe(false);

      const result2 = splitCommands('unlock door with key');
      expect(result2.isMultiCommand).toBe(false);
    });

    it('should handle complex multi-commands', () => {
      const result = splitCommands('go north and east, take lamp, open mailbox and read leaflet');
      expect(result.isMultiCommand).toBe(true);
      expect(result.commands).toEqual([
        'go north',
        'east',
        'take lamp',
        'open mailbox',
        'read leaflet',
      ]);
    });
  });
});
