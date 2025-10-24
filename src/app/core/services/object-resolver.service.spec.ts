import { TestBed } from '@angular/core/testing';
import { ObjectResolverService, ResolutionContext } from './object-resolver.service';
import { GameObject } from '../models';

describe('ObjectResolverService', () => {
  let service: ObjectResolverService;

  // Sample game objects for testing
  const mailbox: GameObject = {
    id: 'mailbox',
    name: 'small mailbox',
    description: 'A small wooden mailbox',
    location: 'west-of-house',
    aliases: ['letterbox', 'box'],
    portable: false,
    visible: true,
  };

  const brassLamp: GameObject = {
    id: 'brass-lamp',
    name: 'brass lamp',
    description: 'A brass oil lamp',
    location: 'west-of-house',
    aliases: ['lantern', 'lamp'],
    portable: true,
    visible: true,
  };

  const rustyLamp: GameObject = {
    id: 'rusty-lamp',
    name: 'rusty lamp',
    description: 'An old rusty lamp',
    location: 'cellar',
    aliases: ['lamp'],
    portable: true,
    visible: true,
  };

  // Unused in current tests but available for future use
  // const leaflet: GameObject = {
  //   id: 'leaflet',
  //   name: 'leaflet',
  //   description: 'A promotional leaflet',
  //   location: 'mailbox',
  //   aliases: [],
  //   portable: true,
  //   visible: true,
  // };

  const sword: GameObject = {
    id: 'sword',
    name: 'elvish sword',
    description: 'A beautiful elvish blade',
    location: 'inventory',
    aliases: ['blade', 'weapon'],
    portable: true,
    visible: true,
  };

  const goldCoin1: GameObject = {
    id: 'gold-coin-1',
    name: 'gold coin',
    description: 'A shiny gold coin',
    location: 'treasure-room',
    aliases: [],
    portable: true,
    visible: true,
  };

  const goldCoin2: GameObject = {
    id: 'gold-coin-2',
    name: 'gold coin',
    description: 'Another gold coin',
    location: 'treasure-room',
    aliases: [],
    portable: true,
    visible: true,
  };

  const goldCoin3: GameObject = {
    id: 'gold-coin-3',
    name: 'gold coin',
    description: 'Yet another gold coin',
    location: 'treasure-room',
    aliases: [],
    portable: true,
    visible: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ObjectResolverService],
    });
    service = TestBed.inject(ObjectResolverService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Exact matching', () => {
    it('should resolve exact name match', () => {
      const context: ResolutionContext = {
        roomObjects: [mailbox, brassLamp],
        inventoryObjects: [],
      };

      const result = service.resolve('brass lamp', context);
      expect(result.isResolved).toBe(true);
      expect(result.resolvedObject?.id).toBe('brass-lamp');
      expect(result.needsDisambiguation).toBe(false);
    });

    it('should resolve exact ID match', () => {
      const context: ResolutionContext = {
        roomObjects: [mailbox],
        inventoryObjects: [],
      };

      const result = service.resolve('mailbox', context);
      expect(result.isResolved).toBe(true);
      expect(result.resolvedObject?.id).toBe('mailbox');
    });

    it('should resolve exact alias match', () => {
      const context: ResolutionContext = {
        roomObjects: [mailbox],
        inventoryObjects: [],
      };

      const result = service.resolve('letterbox', context);
      expect(result.isResolved).toBe(true);
      expect(result.resolvedObject?.id).toBe('mailbox');
    });

    it('should be case-insensitive', () => {
      const context: ResolutionContext = {
        roomObjects: [mailbox],
        inventoryObjects: [],
      };

      const result = service.resolve('MAILBOX', context);
      expect(result.isResolved).toBe(true);
      expect(result.resolvedObject?.id).toBe('mailbox');
    });
  });

  describe('Disambiguation', () => {
    it('should return multiple candidates for ambiguous match', () => {
      const context: ResolutionContext = {
        roomObjects: [brassLamp, rustyLamp],
        inventoryObjects: [],
      };

      const result = service.resolve('lamp', context);
      expect(result.isResolved).toBe(false);
      expect(result.needsDisambiguation).toBe(true);
      expect(result.candidates.length).toBe(2);
    });

    it('should rank room objects higher than inventory', () => {
      const context: ResolutionContext = {
        roomObjects: [brassLamp],
        inventoryObjects: [rustyLamp],
      };

      const result = service.resolve('lamp', context);
      expect(result.candidates[0].id).toBe('brass-lamp'); // Room object first
      expect(result.candidates[1].id).toBe('rusty-lamp'); // Inventory second
    });

    it('should return top N candidates based on config', () => {
      const manyCoins = Array.from({ length: 10 }, (_, i) => ({
        ...goldCoin1,
        id: `coin-${i}`,
      }));

      const context: ResolutionContext = {
        roomObjects: manyCoins,
        inventoryObjects: [],
      };

      const result = service.resolve('coin', context);
      // Should limit based on maxDisambiguationCandidates (5 by default)
      expect(result.candidates.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Ordinal selection', () => {
    it('should resolve "1st coin"', () => {
      const context: ResolutionContext = {
        roomObjects: [goldCoin1, goldCoin2, goldCoin3],
        inventoryObjects: [],
      };

      const result = service.resolve('1st coin', context);
      expect(result.isResolved).toBe(true);
      expect(result.resolvedObject?.id).toBe('gold-coin-1');
    });

    it('should resolve "2nd coin"', () => {
      const context: ResolutionContext = {
        roomObjects: [goldCoin1, goldCoin2, goldCoin3],
        inventoryObjects: [],
      };

      const result = service.resolve('2nd coin', context);
      expect(result.isResolved).toBe(true);
      expect(result.resolvedObject?.id).toBe('gold-coin-2');
    });

    it('should resolve "3rd coin"', () => {
      const context: ResolutionContext = {
        roomObjects: [goldCoin1, goldCoin2, goldCoin3],
        inventoryObjects: [],
      };

      const result = service.resolve('3rd coin', context);
      expect(result.isResolved).toBe(true);
      expect(result.resolvedObject?.id).toBe('gold-coin-3');
    });

    it('should resolve word ordinals like "first lamp"', () => {
      const context: ResolutionContext = {
        roomObjects: [brassLamp, rustyLamp],
        inventoryObjects: [],
      };

      const result = service.resolve('first lamp', context);
      expect(result.isResolved).toBe(true);
      expect(result.resolvedObject?.id).toBe('brass-lamp');
    });

    it('should resolve "second lamp"', () => {
      const context: ResolutionContext = {
        roomObjects: [brassLamp, rustyLamp],
        inventoryObjects: [],
      };

      const result = service.resolve('second lamp', context);
      expect(result.isResolved).toBe(true);
      expect(result.resolvedObject?.id).toBe('rusty-lamp');
    });

    it('should handle out-of-range ordinals', () => {
      const context: ResolutionContext = {
        roomObjects: [goldCoin1, goldCoin2],
        inventoryObjects: [],
      };

      const result = service.resolve('5th coin', context);
      expect(result.isResolved).toBe(false);
      expect(result.needsDisambiguation).toBe(true);
      expect(result.candidates.length).toBe(2); // Show available options
    });
  });

  describe('Fuzzy matching', () => {
    it('should handle typos in object names', () => {
      const context: ResolutionContext = {
        roomObjects: [mailbox],
        inventoryObjects: [],
      };

      const result = service.resolve('mailbax', context);
      expect(result.candidates.length).toBeGreaterThan(0);
      if (result.candidates.length > 0) {
        expect(result.candidates[0].id).toBe('mailbox');
      }
    });

    it('should suggest corrections for close matches', () => {
      const context: ResolutionContext = {
        roomObjects: [brassLamp],
        inventoryObjects: [],
      };

      const result = service.resolve('lampp', context);
      expect(result.candidates.length).toBeGreaterThan(0);
      expect(result.candidates[0].id).toBe('brass-lamp');
    });

    it('should return fuzzy match metadata', () => {
      const context: ResolutionContext = {
        roomObjects: [mailbox],
        inventoryObjects: [],
      };

      const result = service.resolve('mailbax', context);
      expect(result.fuzzyMatch).toBeTruthy();
      if (result.fuzzyMatch) {
        expect(result.fuzzyMatch.matched.toLowerCase()).toContain('mail');
      }
    });

    it('should return empty result for no fuzzy match', () => {
      const context: ResolutionContext = {
        roomObjects: [mailbox],
        inventoryObjects: [],
      };

      const result = service.resolve('xyzzy', context);
      expect(result.isResolved).toBe(false);
      expect(result.candidates.length).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty phrase', () => {
      const context: ResolutionContext = {
        roomObjects: [mailbox],
        inventoryObjects: [],
      };

      const result = service.resolve('', context);
      expect(result.isResolved).toBe(false);
      expect(result.candidates.length).toBe(0);
    });

    it('should handle empty context', () => {
      const context: ResolutionContext = {
        roomObjects: [],
        inventoryObjects: [],
      };

      const result = service.resolve('lamp', context);
      expect(result.isResolved).toBe(false);
      expect(result.candidates.length).toBe(0);
    });

    it('should search all objects when provided', () => {
      const context: ResolutionContext = {
        roomObjects: [],
        inventoryObjects: [],
        allObjects: [mailbox, brassLamp],
      };

      const result = service.resolve('lamp', context);
      expect(result.candidates.length).toBeGreaterThan(0);
    });
  });

  describe('Real-world Zork scenarios', () => {
    it('should disambiguate multiple lamps', () => {
      const context: ResolutionContext = {
        roomObjects: [brassLamp],
        inventoryObjects: [rustyLamp],
      };

      const result = service.resolve('lamp', context);
      expect(result.needsDisambiguation).toBe(true);
      expect(result.candidates.length).toBe(2);
      // Room object should be first
      expect(result.candidates[0].id).toBe('brass-lamp');
    });

    it('should handle mailbox with aliases', () => {
      const context: ResolutionContext = {
        roomObjects: [mailbox],
        inventoryObjects: [],
      };

      const result1 = service.resolve('mailbox', context);
      expect(result1.isResolved).toBe(true);

      const result2 = service.resolve('letterbox', context);
      expect(result2.isResolved).toBe(true);

      const result3 = service.resolve('box', context);
      expect(result3.isResolved).toBe(true);

      // All should resolve to same object
      expect(result1.resolvedObject?.id).toBe(result2.resolvedObject?.id);
      expect(result2.resolvedObject?.id).toBe(result3.resolvedObject?.id);
    });

    it('should handle inventory objects', () => {
      const context: ResolutionContext = {
        roomObjects: [],
        inventoryObjects: [sword],
      };

      const result = service.resolve('sword', context);
      expect(result.isResolved).toBe(true);
      expect(result.resolvedObject?.id).toBe('sword');
    });
  });
});
