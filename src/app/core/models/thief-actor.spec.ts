import { ThiefActor, ThiefMode } from './thief-actor';

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
});
