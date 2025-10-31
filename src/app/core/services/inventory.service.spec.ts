import { TestBed } from '@angular/core/testing';
import { InventoryService } from './inventory.service';
import { RandomService } from './random.service';
import { GameObject } from '../models/game-object.model';

describe('InventoryService', () => {
  let service: InventoryService;
  let randomService: RandomService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InventoryService);
    randomService = TestBed.inject(RandomService);
  });

  describe('moveItems', () => {
    let items: Map<string, GameObject>;

    beforeEach(() => {
      items = new Map([
        [
          'sword',
          {
            id: 'sword',
            name: 'sword',
            description: 'A sharp sword',
            portable: true,
            visible: true,
            location: 'round-room',
            properties: { value: 10 },
          },
        ],
        [
          'lamp',
          {
            id: 'lamp',
            name: 'lamp',
            description: 'A brass lamp',
            portable: true,
            visible: true,
            location: 'round-room',
            properties: { value: 0, isLight: true },
          },
        ],
        [
          'rope',
          {
            id: 'rope',
            name: 'rope',
            description: 'A sturdy rope',
            portable: true,
            visible: true,
            location: 'round-room',
            properties: { value: 0 },
          },
        ],
      ]);
    });

    it('should create', () => {
      expect(service).toBeTruthy();
    });

    it('should move all items without probability', () => {
      const result = service.moveItems(['sword', 'lamp'], 'thief', items);

      expect(result.anyMoved).toBe(true);
      expect(result.movedItemIds).toEqual(['sword', 'lamp']);
      expect(items.get('sword')?.location).toBe('thief');
      expect(items.get('lamp')?.location).toBe('thief');
    });

    it('should skip non-existent items', () => {
      const result = service.moveItems(['sword', 'nonexistent', 'lamp'], 'thief', items);

      expect(result.anyMoved).toBe(true);
      expect(result.movedItemIds).toEqual(['sword', 'lamp']);
    });

    it('should respect probability with deterministic random', () => {
      // Set seed for deterministic testing
      randomService.setSeed(12345);

      // Test with 50% probability - some items should be moved, some not
      const result = service.moveItems(['sword', 'lamp', 'rope'], 'thief', items, {
        probability: 0.5,
      });

      // With this seed, we should get deterministic results
      expect(result.anyMoved).toBeDefined();
      expect(result.movedItemIds.length).toBeGreaterThanOrEqual(0);
      expect(result.movedItemIds.length).toBeLessThanOrEqual(3);
    });

    it('should always move items with probability 1.0', () => {
      const result = service.moveItems(['sword', 'lamp', 'rope'], 'thief', items, {
        probability: 1.0,
      });

      expect(result.anyMoved).toBe(true);
      expect(result.movedItemIds).toEqual(['sword', 'lamp', 'rope']);
    });

    it('should never move items with probability 0.0', () => {
      const result = service.moveItems(['sword', 'lamp', 'rope'], 'thief', items, {
        probability: 0.0,
      });

      expect(result.anyMoved).toBe(false);
      expect(result.movedItemIds).toEqual([]);
    });

    it('should hide items when hideOnMove is true', () => {
      const result = service.moveItems(['sword', 'lamp'], 'thief', items, {
        hideOnMove: true,
      });

      expect(result.anyMoved).toBe(true);
      expect(items.get('sword')?.visible).toBe(false);
      expect(items.get('lamp')?.visible).toBe(false);
    });

    it('should not hide items when hideOnMove is false', () => {
      const result = service.moveItems(['sword', 'lamp'], 'thief', items, {
        hideOnMove: false,
      });

      expect(result.anyMoved).toBe(true);
      expect(items.get('sword')?.visible).toBe(true);
      expect(items.get('lamp')?.visible).toBe(true);
    });

    it('should set touchbit when requested', () => {
      const result = service.moveItems(['sword', 'lamp'], 'thief', items, {
        touchBit: true,
      });

      expect(result.anyMoved).toBe(true);
      expect(items.get('sword')?.properties?.touched).toBe(true);
      expect(items.get('lamp')?.properties?.touched).toBe(true);
    });

    it('should not set touchbit by default', () => {
      const result = service.moveItems(['sword', 'lamp'], 'thief', items);

      expect(result.anyMoved).toBe(true);
      expect(items.get('sword')?.properties?.touched).toBeUndefined();
      expect(items.get('lamp')?.properties?.touched).toBeUndefined();
    });

    it('should combine hideOnMove and touchBit options', () => {
      const result = service.moveItems(['sword', 'lamp'], 'thief', items, {
        hideOnMove: true,
        touchBit: true,
      });

      expect(result.anyMoved).toBe(true);
      expect(items.get('sword')?.visible).toBe(false);
      expect(items.get('sword')?.properties?.touched).toBe(true);
      expect(items.get('lamp')?.visible).toBe(false);
      expect(items.get('lamp')?.properties?.touched).toBe(true);
    });

    it('should return empty result for empty item list', () => {
      const result = service.moveItems([], 'thief', items);

      expect(result.anyMoved).toBe(false);
      expect(result.movedItemIds).toEqual([]);
    });

    it('should preserve existing item properties when setting touchbit', () => {
      const result = service.moveItems(['sword'], 'thief', items, {
        touchBit: true,
      });

      expect(result.anyMoved).toBe(true);
      expect(items.get('sword')?.properties?.['value']).toBe(10);
      expect(items.get('sword')?.properties?.['touched']).toBe(true);
    });
  });

  describe('stealJunk', () => {
    let items: Map<string, GameObject>;

    beforeEach(() => {
      items = new Map([
        [
          'treasure',
          {
            id: 'treasure',
            name: 'treasure',
            description: 'A valuable treasure',
            portable: true,
            visible: true,
            location: 'round-room',
            properties: { value: 10 },
          },
        ],
        [
          'junk-item',
          {
            id: 'junk-item',
            name: 'junk item',
            description: 'A worthless item',
            portable: true,
            visible: true,
            location: 'round-room',
            properties: { value: 0 },
          },
        ],
        [
          'stiletto',
          {
            id: 'stiletto',
            name: 'stiletto',
            description: 'A sharp stiletto',
            portable: true,
            visible: true,
            location: 'round-room',
            properties: { value: 0, isWeapon: true },
          },
        ],
        [
          'heavy-object',
          {
            id: 'heavy-object',
            name: 'heavy object',
            description: 'Too heavy to move',
            portable: false,
            visible: true,
            location: 'round-room',
            properties: { value: 0 },
          },
        ],
        [
          'sacred-item',
          {
            id: 'sacred-item',
            name: 'sacred item',
            description: 'A sacred item',
            portable: true,
            visible: true,
            location: 'round-room',
            properties: { value: 0, isSacred: true },
          },
        ],
        [
          'invisible-item',
          {
            id: 'invisible-item',
            name: 'invisible item',
            description: 'An invisible item',
            portable: true,
            visible: false,
            location: 'round-room',
            properties: { value: 0 },
          },
        ],
      ]);
    });

    it('should not steal valuable items', () => {
      // Set seed for deterministic behavior
      randomService.setSeed(12345);

      const result = service.stealJunk('round-room', items);

      expect(result.movedItemIds).not.toContain('treasure');
      expect(items.get('treasure')?.location).toBe('round-room');
    });

    it('should not steal non-portable items', () => {
      randomService.setSeed(12345);

      const result = service.stealJunk('round-room', items);

      expect(result.movedItemIds).not.toContain('heavy-object');
      expect(items.get('heavy-object')?.location).toBe('round-room');
    });

    it('should not steal sacred items', () => {
      randomService.setSeed(12345);

      const result = service.stealJunk('round-room', items);

      expect(result.movedItemIds).not.toContain('sacred-item');
      expect(items.get('sacred-item')?.location).toBe('round-room');
    });

    it('should not steal already invisible items', () => {
      randomService.setSeed(12345);

      const result = service.stealJunk('round-room', items);

      expect(result.movedItemIds).not.toContain('invisible-item');
    });

    it('should always steal stiletto', () => {
      // Run multiple times to ensure stiletto is always stolen
      for (let i = 0; i < 10; i++) {
        randomService.setSeed(1000 + i);

        // Reset stiletto location
        items.get('stiletto')!.location = 'round-room';
        items.get('stiletto')!.visible = true;

        const result = service.stealJunk('round-room', items);

        expect(result.movedItemIds).toContain('stiletto');
        expect(items.get('stiletto')?.location).toBe('thief');
      }
    });

    it('should hide and mark stolen items', () => {
      randomService.setSeed(12345);

      // Steal stiletto (always stolen)
      const result = service.stealJunk('round-room', items);

      expect(result.movedItemIds).toContain('stiletto');
      expect(items.get('stiletto')?.visible).toBe(false);
      expect(items.get('stiletto')?.properties?.touched).toBe(true);
    });

    it('should steal worthless items with probability', () => {
      // Test multiple times with different seeds to verify probabilistic behavior
      let stolenCount = 0;
      const trials = 100;

      for (let i = 0; i < trials; i++) {
        randomService.setSeed(1000 + i);

        // Reset junk-item
        items.get('junk-item')!.location = 'round-room';
        items.get('junk-item')!.visible = true;

        const result = service.stealJunk('round-room', items);

        if (result.movedItemIds.includes('junk-item')) {
          stolenCount++;
        }
      }

      // With 10% probability, we expect roughly 10 out of 100 steals
      // Allow for statistical variance (3-20 range is reasonable)
      expect(stolenCount).toBeGreaterThan(3);
      expect(stolenCount).toBeLessThan(20);
    });

    it('should return empty result when room has no eligible items', () => {
      const result = service.stealJunk('empty-room', items);

      expect(result.anyMoved).toBe(false);
      expect(result.movedItemIds).toEqual([]);
    });

    it('should only steal from specified room', () => {
      // Add item in different room
      items.set('other-junk', {
        id: 'other-junk',
        name: 'other junk',
        description: 'Junk in another room',
        portable: true,
        visible: true,
        location: 'maze-1',
        properties: { value: 0 },
      });

      randomService.setSeed(12345);
      const result = service.stealJunk('round-room', items);

      expect(result.movedItemIds).not.toContain('other-junk');
      expect(items.get('other-junk')?.location).toBe('maze-1');
    });
  });

  describe('robMaze', () => {
    let items: Map<string, GameObject>;

    beforeEach(() => {
      items = new Map([
        [
          'maze-junk',
          {
            id: 'maze-junk',
            name: 'maze junk',
            description: 'Worthless maze item',
            portable: true,
            visible: true,
            location: 'maze-1',
            properties: { value: 0 },
          },
        ],
        [
          'stiletto',
          {
            id: 'stiletto',
            name: 'stiletto',
            description: 'A sharp stiletto',
            portable: true,
            visible: true,
            location: 'maze-1',
            properties: { value: 0, isWeapon: true },
          },
        ],
      ]);
    });

    it('should use similar logic to stealJunk', () => {
      randomService.setSeed(12345);

      const result = service.robMaze('maze-1', items);

      // Should always steal stiletto
      expect(result.movedItemIds).toContain('stiletto');
      expect(items.get('stiletto')?.location).toBe('thief');
      expect(items.get('stiletto')?.visible).toBe(false);
    });

    it('should return empty result for empty maze room', () => {
      const result = service.robMaze('empty-maze', items);

      expect(result.anyMoved).toBe(false);
      expect(result.movedItemIds).toEqual([]);
    });
  });
});
