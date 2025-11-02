import { ThiefActor, ThiefMode, ThiefCombatMessageType } from './thief-actor';
import { MessageService } from '../services/message.service';
import { RandomService } from '../services/random.service';

describe('ThiefActor', () => {
  let thief: ThiefActor;

  beforeEach(() => {
    thief = new ThiefActor();
  });

  describe('initialization', () => {
    it('should create thief with correct initial state', () => {
      expect(thief.id).toBe('thief');
      expect(thief.name).toBe('thief');
      expect(thief.locationId).toBe('round-room');
      expect(thief.tickEnabled).toBe(true);
      expect(thief.getMode()).toBe(ThiefMode.CONSCIOUS);
    });

    it('should initialize with strength flags', () => {
      expect(thief.flags.get('strength')).toBe(5);
      expect(thief.flags.get('maxStrength')).toBe(5);
      expect(thief.flags.get('fighting')).toBe(false);
    });

    it('should start not engrossed', () => {
      expect(thief.isEngrossed()).toBe(false);
    });

    it('should start with empty inventory', () => {
      expect(thief.inventory).toEqual([]);
    });
  });

  describe('mode management', () => {
    it('should set and get mode', () => {
      thief.setMode(ThiefMode.UNCONSCIOUS);
      expect(thief.getMode()).toBe(ThiefMode.UNCONSCIOUS);

      thief.setMode(ThiefMode.DEAD);
      expect(thief.getMode()).toBe(ThiefMode.DEAD);

      thief.setMode(ThiefMode.BUSY);
      expect(thief.getMode()).toBe(ThiefMode.BUSY);
    });
  });

  describe('engrossed state', () => {
    it('should set and get engrossed state', () => {
      expect(thief.isEngrossed()).toBe(false);

      thief.setEngrossed(true);
      expect(thief.isEngrossed()).toBe(true);

      thief.setEngrossed(false);
      expect(thief.isEngrossed()).toBe(false);
    });
  });

  describe('onDamage', () => {
    it('should reduce strength when damaged', () => {
      thief.onDamage(2);
      expect(thief.flags.get('strength')).toBe(3);
    });

    it('should transition to unconscious when strength goes negative', () => {
      thief.onDamage(6); // strength 5 -> -1
      expect(thief.getMode()).toBe(ThiefMode.UNCONSCIOUS);
      expect(thief.tickEnabled).toBe(false);
      expect(thief.flags.get('fighting')).toBe(false);
    });

    it('should transition to dead when strength reaches exactly 0', () => {
      thief.onDamage(5); // strength 5 -> 0
      expect(thief.getMode()).toBe(ThiefMode.DEAD);
      expect(thief.tickEnabled).toBe(false);
    });

    it('should handle multiple damage events', () => {
      thief.onDamage(2);
      expect(thief.flags.get('strength')).toBe(3);
      expect(thief.getMode()).toBe(ThiefMode.CONSCIOUS);

      thief.onDamage(1);
      expect(thief.flags.get('strength')).toBe(2);
      expect(thief.getMode()).toBe(ThiefMode.CONSCIOUS);

      thief.onDamage(3); // Goes to -1
      expect(thief.getMode()).toBe(ThiefMode.UNCONSCIOUS);
    });
  });

  describe('onDeath', () => {
    it('should transition to dead mode', () => {
      thief.onDeath();
      expect(thief.getMode()).toBe(ThiefMode.DEAD);
    });

    it('should disable ticking', () => {
      expect(thief.tickEnabled).toBe(true);
      thief.onDeath();
      expect(thief.tickEnabled).toBe(false);
    });
  });

  describe('onConscious', () => {
    it('should transition from unconscious to conscious', () => {
      thief.setMode(ThiefMode.UNCONSCIOUS);
      thief.tickEnabled = false;

      thief.onConscious();

      expect(thief.getMode()).toBe(ThiefMode.CONSCIOUS);
      expect(thief.tickEnabled).toBe(true);
      expect(thief.flags.get('fighting')).toBe(true);
    });

    it('should enable fighting mode', () => {
      thief.flags.set('fighting', false);
      thief.onConscious();
      expect(thief.flags.get('fighting')).toBe(true);
    });
  });

  describe('acceptGift', () => {
    it('should add item to inventory', () => {
      thief.acceptGift('sword', 10);
      expect(thief.inventory).toContain('sword');
    });

    it('should become engrossed when receiving valuable item', () => {
      expect(thief.isEngrossed()).toBe(false);
      thief.acceptGift('jewel', 50);
      expect(thief.isEngrossed()).toBe(true);
    });

    it('should not become engrossed when receiving worthless item', () => {
      expect(thief.isEngrossed()).toBe(false);
      thief.acceptGift('rock', 0);
      expect(thief.isEngrossed()).toBe(false);
    });

    it('should accept multiple gifts', () => {
      thief.acceptGift('coin', 5);
      thief.acceptGift('gem', 20);
      expect(thief.inventory).toContain('coin');
      expect(thief.inventory).toContain('gem');
    });

    it('should throw error if item ID is empty', () => {
      expect(() => thief.acceptGift('', 10)).toThrowError('Item ID cannot be empty');
      expect(() => thief.acceptGift('  ', 10)).toThrowError('Item ID cannot be empty');
    });

    it('should throw error if item value is negative', () => {
      expect(() => thief.acceptGift('item', -1)).toThrowError('Item value cannot be negative');
      expect(() => thief.acceptGift('item', -100)).toThrowError('Item value cannot be negative');
    });
  });

  describe('hasStilettoInInventory', () => {
    it('should return false when stiletto not in inventory', () => {
      expect(thief.hasStilettoInInventory()).toBe(false);
    });

    it('should return true when stiletto is in inventory', () => {
      thief.inventory.push('stiletto');
      expect(thief.hasStilettoInInventory()).toBe(true);
    });

    it('should work correctly when other items are present', () => {
      thief.inventory.push('sword');
      thief.inventory.push('shield');
      expect(thief.hasStilettoInInventory()).toBe(false);

      thief.inventory.push('stiletto');
      expect(thief.hasStilettoInInventory()).toBe(true);
    });
  });

  describe('state transitions', () => {
    it('should handle conscious -> unconscious -> conscious cycle', () => {
      expect(thief.getMode()).toBe(ThiefMode.CONSCIOUS);
      expect(thief.tickEnabled).toBe(true);

      // Knock unconscious
      thief.onDamage(6);
      expect(thief.getMode()).toBe(ThiefMode.UNCONSCIOUS);
      expect(thief.tickEnabled).toBe(false);

      // Revive
      thief.flags.set('strength', 5); // Restore strength
      thief.onConscious();
      expect(thief.getMode()).toBe(ThiefMode.CONSCIOUS);
      expect(thief.tickEnabled).toBe(true);
    });

    it('should handle conscious -> dead transition', () => {
      expect(thief.getMode()).toBe(ThiefMode.CONSCIOUS);
      thief.onDamage(5); // Exactly to 0
      expect(thief.getMode()).toBe(ThiefMode.DEAD);
      expect(thief.tickEnabled).toBe(false);
    });

    it('should maintain engrossed state through damage', () => {
      thief.setEngrossed(true);
      thief.onDamage(2);
      expect(thief.isEngrossed()).toBe(true); // Should persist
    });
  });

  describe('tick and encounter placeholders', () => {
    it('should have onTick method', () => {
      expect(() => thief.onTick()).not.toThrow();
    });

    it('should have onEncounter method', () => {
      expect(() => thief.onEncounter('some-room')).not.toThrow();
    });
  });

  describe('treasure room helpers', () => {
    it('should detect when thief is in treasure room', () => {
      thief.locationId = 'treasure-room';
      expect(thief.isInTreasureRoom()).toBe(true);
    });

    it('should detect when thief is not in treasure room', () => {
      thief.locationId = 'round-room';
      expect(thief.isInTreasureRoom()).toBe(false);
    });

    it('should return treasure room ID', () => {
      expect(thief.getTreasureRoomId()).toBe('treasure-room');
    });
  });

  describe('combat messages', () => {
    describe('without MessageService', () => {
      it('should return fallback message for MISS', () => {
        const message = thief.getCombatMessage(ThiefCombatMessageType.MISS);
        expect(message).toBe('The thief attacks but misses.');
      });

      it('should return fallback message for LIGHT_WOUND', () => {
        const message = thief.getCombatMessage(ThiefCombatMessageType.LIGHT_WOUND);
        expect(message).toBe('The thief strikes, drawing blood.');
      });

      it('should return fallback message for KILL', () => {
        const message = thief.getCombatMessage(ThiefCombatMessageType.KILL);
        expect(message).toBe('The thief delivers a fatal blow.');
      });
    });

    describe('with MessageService', () => {
      let messageService: MessageService;
      let randomService: RandomService;
      let thiefWithMessages: ThiefActor;

      beforeEach(() => {
        randomService = new RandomService();
        messageService = new MessageService(randomService);

        // Register test messages
        messageService.registerTable('thief', {
          tables: {
            THIEF_MELEE_MISS: [
              'The thief stabs nonchalantly with his stiletto and misses.',
              'You dodge as the thief comes in low.',
            ],
            THIEF_MELEE_DISARM: ['The thief flips your {weapon} out of your hands.'],
          },
        });

        thiefWithMessages = new ThiefActor(messageService);
      });

      it('should use MessageService when available', () => {
        randomService.setSeed(42);
        const message = thiefWithMessages.getCombatMessage(ThiefCombatMessageType.MISS);

        expect(message).toBeDefined();
        expect(message).not.toBe('The thief attacks but misses.');
        expect(
          message === 'The thief stabs nonchalantly with his stiletto and misses.' ||
            message === 'You dodge as the thief comes in low.'
        ).toBe(true);
      });

      it('should support template replacements', () => {
        const message = thiefWithMessages.getCombatMessage(ThiefCombatMessageType.DISARM, {
          weapon: 'sword',
        });

        expect(message).toBe('The thief flips your sword out of your hands.');
      });

      it('should fall back if message not found in service', () => {
        const message = thiefWithMessages.getCombatMessage(ThiefCombatMessageType.KILL);

        // KILL not registered in test messages, should use fallback
        expect(message).toBe('The thief delivers a fatal blow.');
      });

      it('should produce deterministic messages with same seed', () => {
        randomService.setSeed(12345);
        const message1 = thiefWithMessages.getCombatMessage(ThiefCombatMessageType.MISS);

        randomService.setSeed(12345);
        const message2 = thiefWithMessages.getCombatMessage(ThiefCombatMessageType.MISS);

        expect(message2).toBe(message1);
      });
    });
  });

  describe('action messages', () => {
    describe('without MessageService', () => {
      it('should return undefined for action messages', () => {
        const message = thief.getActionMessage('THIEF_EXAMINE');
        expect(message).toBeUndefined();
      });
    });

    describe('with MessageService', () => {
      let messageService: MessageService;
      let thiefWithMessages: ThiefActor;

      beforeEach(() => {
        const randomService = new RandomService();
        messageService = new MessageService(randomService);

        messageService.registerTable('thief', {
          tables: {
            THIEF_EXAMINE: ['The thief is a slippery character with beady eyes.'],
            THIEF_GIFT_VALUABLE: ['The thief accepts the {item} and admires it.'],
          },
        });

        thiefWithMessages = new ThiefActor(messageService);
      });

      it('should retrieve action messages', () => {
        const message = thiefWithMessages.getActionMessage('THIEF_EXAMINE');
        expect(message).toBe('The thief is a slippery character with beady eyes.');
      });

      it('should support template replacements in action messages', () => {
        const message = thiefWithMessages.getActionMessage('THIEF_GIFT_VALUABLE', {
          item: 'jewel',
        });
        expect(message).toBe('The thief accepts the jewel and admires it.');
      });

      it('should return undefined for non-existent categories', () => {
        const message = thiefWithMessages.getActionMessage('NOT_EXISTS');
        expect(message).toBeUndefined();
      });
    });
  });
});
