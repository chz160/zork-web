import { TrollActor } from './troll-actor';
import {
  serializeTrollActor,
  deserializeTrollActor,
  isLegacyTrollData,
  migrateLegacyTrollData,
  SerializedTrollActor,
  LegacyTrollData,
} from './troll-serializer';
import { DEFAULT_TROLL_CONFIG } from './troll-config';

describe('TrollActor Serialization', () => {
  describe('serializeTrollActor', () => {
    it('should serialize troll with initial state', () => {
      const troll = new TrollActor(DEFAULT_TROLL_CONFIG);

      const serialized = serializeTrollActor(troll);

      expect(serialized).toEqual({
        id: 'troll',
        type: 'TrollActor',
        locationId: 'troll-room',
        health: 2,
        inventory: ['axe'],
        isConscious: true,
        isFighting: true,
        blocksPassage: true,
        flags: jasmine.objectContaining({
          strength: 2,
          actorState: 'armed',
          isFighting: true,
          blocksPassage: true,
        }),
      });
    });

    it('should serialize troll with modified location', () => {
      const troll = new TrollActor(DEFAULT_TROLL_CONFIG);
      troll.locationId = 'cellar';

      const serialized = serializeTrollActor(troll);

      expect(serialized.locationId).toBe('cellar');
    });

    it('should serialize troll after taking damage', () => {
      const troll = new TrollActor(DEFAULT_TROLL_CONFIG);
      troll.onDamage(1);

      const serialized = serializeTrollActor(troll);

      expect(serialized.health).toBe(1);
      expect(serialized.isConscious).toBe(true);
      expect(serialized.inventory).toContain('axe');
    });

    it('should serialize unconscious troll without axe', () => {
      const troll = new TrollActor(DEFAULT_TROLL_CONFIG);
      troll.onDamage(2); // Reduce strength to 0, making unconscious

      const serialized = serializeTrollActor(troll);

      expect(serialized.health).toBe(0);
      expect(serialized.isConscious).toBe(false);
      expect(serialized.inventory).not.toContain('axe');
      expect(serialized.blocksPassage).toBe(false);
    });

    it('should serialize troll inventory correctly', () => {
      const troll = new TrollActor(DEFAULT_TROLL_CONFIG);
      troll.inventory.push('treasure', 'sword');

      const serialized = serializeTrollActor(troll);

      expect(serialized.inventory).toEqual(['axe', 'treasure', 'sword']);
    });
  });

  describe('deserializeTrollActor', () => {
    it('should deserialize troll with initial state', () => {
      const data: SerializedTrollActor = {
        id: 'troll',
        type: 'TrollActor',
        locationId: 'troll-room',
        health: 2,
        inventory: ['axe'],
        isConscious: true,
        isFighting: true,
        blocksPassage: true,
        flags: {
          strength: 2,
          actorState: 'armed',
          isFighting: true,
          blocksPassage: true,
        },
      };

      const troll = deserializeTrollActor(data);

      expect(troll.id).toBe('troll');
      expect(troll.locationId).toBe('troll-room');
      expect(troll.inventory).toEqual(['axe']);
      expect(troll.flags.get('strength')).toBe(2);
      expect(troll.flags.get('actorState')).toBe('armed');
      expect(troll.getState().isConscious).toBe(true);
    });

    it('should deserialize troll with modified location', () => {
      const data: SerializedTrollActor = {
        id: 'troll',
        type: 'TrollActor',
        locationId: 'cellar',
        health: 2,
        inventory: ['axe'],
        isConscious: true,
        isFighting: true,
        blocksPassage: true,
        flags: {
          strength: 2,
          actorState: 'armed',
          isFighting: true,
          blocksPassage: true,
        },
      };

      const troll = deserializeTrollActor(data);

      expect(troll.locationId).toBe('cellar');
    });

    it('should deserialize unconscious troll', () => {
      const data: SerializedTrollActor = {
        id: 'troll',
        type: 'TrollActor',
        locationId: 'troll-room',
        health: 0,
        inventory: [],
        isConscious: false,
        isFighting: false,
        blocksPassage: false,
        flags: {
          strength: 0,
          actorState: 'unconscious',
          isFighting: false,
          blocksPassage: false,
        },
      };

      const troll = deserializeTrollActor(data);

      expect(troll.flags.get('strength')).toBe(0);
      expect(troll.flags.get('actorState')).toBe('unconscious');
      expect(troll.getState().isConscious).toBe(false);
      expect(troll.inventory).toEqual([]);
    });

    it('should throw error for invalid id', () => {
      const data: SerializedTrollActor = {
        id: 'invalid',
        type: 'TrollActor',
        locationId: 'troll-room',
        health: 2,
        inventory: ['axe'],
        isConscious: true,
        isFighting: true,
        blocksPassage: true,
        flags: {},
      };

      expect(() => deserializeTrollActor(data)).toThrowError(/expected id 'troll'/);
    });

    it('should throw error for invalid type', () => {
      const data = {
        id: 'troll',
        type: 'InvalidType',
        locationId: 'troll-room',
        health: 2,
        inventory: ['axe'],
        isConscious: true,
        isFighting: true,
        blocksPassage: true,
        flags: {},
      } as unknown as SerializedTrollActor;

      expect(() => deserializeTrollActor(data)).toThrowError(/expected type 'TrollActor'/);
    });

    it('should throw error for invalid health', () => {
      const data = {
        id: 'troll',
        type: 'TrollActor',
        locationId: 'troll-room',
        health: 'invalid',
        inventory: ['axe'],
        isConscious: true,
        isFighting: true,
        blocksPassage: true,
        flags: {},
      } as unknown as SerializedTrollActor;

      expect(() => deserializeTrollActor(data)).toThrowError(/health must be a number/);
    });
  });

  describe('roundtrip serialization', () => {
    it('should preserve troll state through serialize/deserialize cycle', () => {
      const original = new TrollActor(DEFAULT_TROLL_CONFIG);

      const serialized = serializeTrollActor(original);
      const restored = deserializeTrollActor(serialized);

      expect(restored.id).toBe(original.id);
      expect(restored.locationId).toBe(original.locationId);
      expect(restored.inventory).toEqual(original.inventory);
      expect(restored.flags.get('strength')).toBe(original.flags.get('strength'));
      expect(restored.flags.get('actorState')).toBe(original.flags.get('actorState'));
    });

    it('should preserve damaged troll state through roundtrip', () => {
      const original = new TrollActor(DEFAULT_TROLL_CONFIG);
      original.onDamage(1);

      const serialized = serializeTrollActor(original);
      const restored = deserializeTrollActor(serialized);

      expect(restored.flags.get('strength')).toBe(1);
      expect(restored.getState().isConscious).toBe(true);
      expect(restored.inventory).toContain('axe');
    });

    it('should preserve unconscious troll state through roundtrip', () => {
      const original = new TrollActor(DEFAULT_TROLL_CONFIG);
      original.onDamage(2); // Make unconscious

      const serialized = serializeTrollActor(original);
      const restored = deserializeTrollActor(serialized);

      expect(restored.flags.get('strength')).toBe(0);
      expect(restored.getState().isConscious).toBe(false);
      expect(restored.inventory).not.toContain('axe');
      expect(restored.getState().blocksPassage).toBe(false);
    });

    it('should preserve troll with modified inventory through roundtrip', () => {
      const original = new TrollActor(DEFAULT_TROLL_CONFIG);
      original.inventory.push('treasure');

      const serialized = serializeTrollActor(original);
      const restored = deserializeTrollActor(serialized);

      expect(restored.inventory).toEqual(['axe', 'treasure']);
    });
  });

  describe('isLegacyTrollData', () => {
    it('should detect legacy troll GameObject format', () => {
      const gameObjects = new Map<string, unknown>();
      gameObjects.set('troll', {
        id: 'troll',
        location: 'troll-room',
        properties: {
          strength: 2,
          actorState: 'armed',
          isFighting: true,
          blocksPassage: true,
        },
      });

      expect(isLegacyTrollData(gameObjects)).toBe(true);
    });

    it('should return false for new TrollActor format', () => {
      const gameObjects = new Map<string, unknown>();
      gameObjects.set('troll', {
        id: 'troll',
        type: 'TrollActor',
        locationId: 'troll-room',
        health: 2,
        inventory: ['axe'],
        isConscious: true,
        isFighting: true,
        blocksPassage: true,
        flags: {},
      });

      expect(isLegacyTrollData(gameObjects)).toBe(false);
    });

    it('should return false when troll is not present', () => {
      const gameObjects = new Map<string, unknown>();

      expect(isLegacyTrollData(gameObjects)).toBe(false);
    });

    it('should detect legacy format with minimal properties', () => {
      const gameObjects = new Map<string, unknown>();
      gameObjects.set('troll', {
        id: 'troll',
        location: 'troll-room',
      });

      expect(isLegacyTrollData(gameObjects)).toBe(true);
    });
  });

  describe('migrateLegacyTrollData', () => {
    it('should migrate legacy armed troll', () => {
      const legacy: LegacyTrollData = {
        id: 'troll',
        location: 'troll-room',
        properties: {
          strength: 2,
          actorState: 'armed',
          isFighting: true,
          blocksPassage: true,
        },
      };

      const migrated = migrateLegacyTrollData(legacy);

      expect(migrated).toEqual({
        id: 'troll',
        type: 'TrollActor',
        locationId: 'troll-room',
        health: 2,
        inventory: ['axe'],
        isConscious: true,
        isFighting: true,
        blocksPassage: true,
        flags: {
          strength: 2,
          actorState: 'armed',
          isFighting: true,
          blocksPassage: true,
        },
      });
    });

    it('should migrate legacy unconscious troll', () => {
      const legacy: LegacyTrollData = {
        id: 'troll',
        location: 'troll-room',
        properties: {
          strength: 0,
          actorState: 'unconscious',
          isFighting: false,
          blocksPassage: false,
        },
      };

      const migrated = migrateLegacyTrollData(legacy);

      expect(migrated.isConscious).toBe(false);
      expect(migrated.health).toBe(0);
      expect(migrated.inventory).toEqual([]);
      expect(migrated.blocksPassage).toBe(false);
    });

    it('should migrate legacy troll with missing properties', () => {
      const legacy: LegacyTrollData = {
        id: 'troll',
        location: 'troll-room',
      };

      const migrated = migrateLegacyTrollData(legacy);

      expect(migrated.health).toBe(2); // Default strength
      expect(migrated.isConscious).toBe(true); // Default armed state
      expect(migrated.inventory).toEqual(['axe']);
      expect(migrated.isFighting).toBe(true);
      expect(migrated.blocksPassage).toBe(true);
    });

    it('should throw error for invalid legacy id', () => {
      const legacy: LegacyTrollData = {
        id: 'invalid',
        location: 'troll-room',
      };

      expect(() => migrateLegacyTrollData(legacy)).toThrowError(/missing or incorrect id/);
    });

    it('should roundtrip through migration and serialization', () => {
      const legacy: LegacyTrollData = {
        id: 'troll',
        location: 'troll-room',
        properties: {
          strength: 1,
          actorState: 'armed',
          isFighting: true,
          blocksPassage: true,
        },
      };

      // Migrate from legacy format
      const migrated = migrateLegacyTrollData(legacy);

      // Deserialize to TrollActor
      const troll = deserializeTrollActor(migrated);

      // Verify state
      expect(troll.locationId).toBe('troll-room');
      expect(troll.flags.get('strength')).toBe(1);
      expect(troll.getState().isConscious).toBe(true);
      expect(troll.inventory).toContain('axe');
    });
  });

  describe('integration with TrollActor', () => {
    it('should restore troll behavior after deserialization', () => {
      const original = new TrollActor(DEFAULT_TROLL_CONFIG);
      const serialized = serializeTrollActor(original);
      const restored = deserializeTrollActor(serialized);

      // Test that restored troll blocks exits correctly
      expect(restored.blocksExit('ew-passage')).toBe(true);
      expect(restored.blocksExit('maze-1')).toBe(true);
      expect(restored.blocksExit('south')).toBe(false);
    });

    it('should restore unconscious troll that does not block', () => {
      const original = new TrollActor(DEFAULT_TROLL_CONFIG);
      original.onDamage(2); // Make unconscious

      const serialized = serializeTrollActor(original);
      const restored = deserializeTrollActor(serialized);

      // Unconscious troll should not block
      expect(restored.blocksExit('ew-passage')).toBe(false);
      expect(restored.blocksExit('maze-1')).toBe(false);
    });

    it('should allow re-serialization after deserialization', () => {
      const original = new TrollActor(DEFAULT_TROLL_CONFIG);
      const serialized1 = serializeTrollActor(original);
      const restored = deserializeTrollActor(serialized1);
      const serialized2 = serializeTrollActor(restored);

      // Both serializations should be equivalent
      expect(serialized2).toEqual(serialized1);
    });
  });
});
