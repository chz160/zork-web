import { TestBed } from '@angular/core/testing';
import { MessageService } from './message.service';
import { RandomService } from './random.service';

describe('MessageService', () => {
  let service: MessageService;
  let randomService: RandomService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MessageService, RandomService],
    });
    service = TestBed.inject(MessageService);
    randomService = TestBed.inject(RandomService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('registerTable', () => {
    it('should register a message table', () => {
      const table = {
        tables: {
          TEST_CATEGORY: ['Message 1', 'Message 2'],
        },
      };

      service.registerTable('test', table);

      expect(service.hasTable('test')).toBe(true);
    });

    it('should allow multiple tables to be registered', () => {
      service.registerTable('table1', { tables: { CAT1: ['Msg1'] } });
      service.registerTable('table2', { tables: { CAT2: ['Msg2'] } });

      expect(service.hasTable('table1')).toBe(true);
      expect(service.hasTable('table2')).toBe(true);
    });
  });

  describe('hasTable', () => {
    it('should return false for unregistered table', () => {
      expect(service.hasTable('nonexistent')).toBe(false);
    });

    it('should return true for registered table', () => {
      service.registerTable('test', { tables: {} });
      expect(service.hasTable('test')).toBe(true);
    });
  });

  describe('hasCategory', () => {
    beforeEach(() => {
      service.registerTable('test', {
        tables: {
          EXISTS: ['Message'],
        },
      });
    });

    it('should return true for existing category', () => {
      expect(service.hasCategory('test', 'EXISTS')).toBe(true);
    });

    it('should return false for non-existing category', () => {
      expect(service.hasCategory('test', 'NOT_EXISTS')).toBe(false);
    });

    it('should return false for non-existing table', () => {
      expect(service.hasCategory('nonexistent', 'ANY')).toBe(false);
    });
  });

  describe('getAllMessages', () => {
    beforeEach(() => {
      service.registerTable('test', {
        tables: {
          CATEGORY: ['Message 1', 'Message 2', 'Message 3'],
        },
      });
    });

    it('should return all messages from a category', () => {
      const messages = service.getAllMessages('test', 'CATEGORY');
      expect(messages).toEqual(['Message 1', 'Message 2', 'Message 3']);
    });

    it('should return undefined for non-existing category', () => {
      const messages = service.getAllMessages('test', 'NOT_EXISTS');
      expect(messages).toBeUndefined();
    });

    it('should return undefined for non-existing table', () => {
      const messages = service.getAllMessages('nonexistent', 'CATEGORY');
      expect(messages).toBeUndefined();
    });
  });

  describe('getRandomMessage', () => {
    beforeEach(() => {
      service.registerTable('test', {
        tables: {
          SINGLE: ['Only message'],
          MULTIPLE: ['Message 1', 'Message 2', 'Message 3'],
          EMPTY: [],
        },
      });
    });

    it('should return the only message when category has one message', () => {
      const message = service.getRandomMessage('test', 'SINGLE');
      expect(message).toBe('Only message');
    });

    it('should return undefined for empty category', () => {
      const message = service.getRandomMessage('test', 'EMPTY');
      expect(message).toBeUndefined();
    });

    it('should return undefined for non-existing category', () => {
      const message = service.getRandomMessage('test', 'NOT_EXISTS');
      expect(message).toBeUndefined();
    });

    it('should return undefined for non-existing table', () => {
      const message = service.getRandomMessage('nonexistent', 'CATEGORY');
      expect(message).toBeUndefined();
    });

    it('should use RandomService for selection', () => {
      // Set seed for deterministic selection
      randomService.setSeed(42);

      const message1 = service.getRandomMessage('test', 'MULTIPLE');
      expect(message1).toBeDefined();

      // Reset to same seed should give same result
      randomService.setSeed(42);
      const message2 = service.getRandomMessage('test', 'MULTIPLE');
      expect(message2).toBe(message1);
    });

    it('should return different messages with different seeds', () => {
      const messages = new Set<string>();

      // Try multiple seeds to get different messages
      for (let seed = 0; seed < 100; seed++) {
        randomService.setSeed(seed);
        const message = service.getRandomMessage('test', 'MULTIPLE');
        if (message) {
          messages.add(message);
        }
      }

      // Should have gotten at least 2 different messages
      expect(messages.size).toBeGreaterThan(1);
    });

    describe('with replacements', () => {
      beforeEach(() => {
        service.registerTable('test', {
          tables: {
            TEMPLATE: [
              'You swing your {weapon} at the {enemy}.',
              'The {enemy} dodges your {weapon}.',
            ],
            MULTI_VAR: ['The {adj} {noun} is very {adj}.'],
          },
        });
      });

      it('should replace template variables', () => {
        randomService.setSeed(42);
        const message = service.getRandomMessage('test', 'TEMPLATE', {
          weapon: 'sword',
          enemy: 'troll',
        });

        expect(message).toBeDefined();
        expect(message).toContain('sword');
        expect(message).toContain('troll');
        expect(message).not.toContain('{weapon}');
        expect(message).not.toContain('{enemy}');
      });

      it('should replace multiple instances of same variable', () => {
        const message = service.getRandomMessage('test', 'MULTI_VAR', {
          adj: 'shiny',
          noun: 'gem',
        });

        expect(message).toBe('The shiny gem is very shiny.');
      });

      it('should work without replacements object', () => {
        const message = service.getRandomMessage('test', 'TEMPLATE');
        expect(message).toBeDefined();
        expect(message).toContain('{weapon}');
      });

      it('should leave unreplaced variables intact', () => {
        const message = service.getRandomMessage('test', 'TEMPLATE', {
          weapon: 'sword',
        });

        expect(message).toBeDefined();
        expect(message).toContain('sword');
        expect(message).toContain('{enemy}');
      });
    });
  });

  describe('deterministic behavior', () => {
    beforeEach(() => {
      service.registerTable('thief', {
        tables: {
          MELEE_MISS: [
            'The thief stabs nonchalantly with his stiletto and misses.',
            'You dodge as the thief comes in low.',
            'You parry a lightning thrust.',
            'The thief tries to sneak past your guard.',
          ],
        },
      });
    });

    it('should produce consistent sequence with same seed', () => {
      randomService.setSeed(12345);
      const messages1 = [];
      for (let i = 0; i < 10; i++) {
        messages1.push(service.getRandomMessage('thief', 'MELEE_MISS'));
      }

      randomService.setSeed(12345);
      const messages2 = [];
      for (let i = 0; i < 10; i++) {
        messages2.push(service.getRandomMessage('thief', 'MELEE_MISS'));
      }

      expect(messages2).toEqual(messages1);
    });

    it('should produce different sequence with different seed', () => {
      randomService.setSeed(11111);
      const messages1 = [];
      for (let i = 0; i < 5; i++) {
        messages1.push(service.getRandomMessage('thief', 'MELEE_MISS'));
      }

      randomService.setSeed(22222);
      const messages2 = [];
      for (let i = 0; i < 5; i++) {
        messages2.push(service.getRandomMessage('thief', 'MELEE_MISS'));
      }

      // Sequences should differ
      expect(messages2).not.toEqual(messages1);
    });
  });
});
