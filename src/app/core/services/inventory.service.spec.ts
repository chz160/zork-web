import { TestBed } from '@angular/core/testing';
import { InventoryService } from './inventory.service';
import { RandomService } from './random.service';
import { TelemetryService } from './telemetry.service';
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

    it('should detect when a lit light source is moved', () => {
      // Make lamp a lit light source
      items.get('lamp')!.properties = {
        ...items.get('lamp')!.properties,
        isLight: true,
        isLit: true,
      };

      const result = service.moveItems(['lamp'], 'thief', items);

      expect(result.stoleLitLight).toBe(true);
    });

    it('should not set stoleLitLight when moving unlit light source', () => {
      // Make lamp an unlit light source
      items.get('lamp')!.properties = {
        ...items.get('lamp')!.properties,
        isLight: true,
        isLit: false,
      };

      const result = service.moveItems(['lamp'], 'thief', items);

      expect(result.stoleLitLight).toBe(false);
    });

    it('should not set stoleLitLight when moving non-light items', () => {
      const result = service.moveItems(['sword'], 'thief', items);

      expect(result.stoleLitLight).toBe(false);
    });

    it('should set stoleLitLight when moving mixed items including lit light', () => {
      // Make lamp a lit light source
      items.get('lamp')!.properties = {
        ...items.get('lamp')!.properties,
        isLight: true,
        isLit: true,
      };

      const result = service.moveItems(['sword', 'lamp', 'rope'], 'thief', items);

      expect(result.stoleLitLight).toBe(true);
    });

    it('should set stoleLitLight false for empty move', () => {
      const result = service.moveItems([], 'thief', items);

      expect(result.stoleLitLight).toBe(false);
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

    it('should support custom alwaysStealItemIds', () => {
      // Add a custom worthless item
      items.set('custom-item', {
        id: 'custom-item',
        name: 'custom item',
        description: 'A custom worthless item',
        portable: true,
        visible: true,
        location: 'round-room',
        properties: { value: 0 },
      });

      randomService.setSeed(12345);

      // Steal with custom always-steal list
      const result = service.stealJunk('round-room', items, undefined, ['custom-item']);

      // Custom item should always be stolen
      expect(result.movedItemIds).toContain('custom-item');
      expect(items.get('custom-item')?.location).toBe('thief');
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

  describe('depositBooty', () => {
    let items: Map<string, GameObject>;

    beforeEach(() => {
      items = new Map([
        [
          'chalice',
          {
            id: 'chalice',
            name: 'chalice',
            description: 'A jeweled chalice',
            portable: true,
            visible: false, // Hidden by thief's magic
            location: 'thief',
            properties: { value: 10, touched: true },
          },
        ],
        [
          'painting',
          {
            id: 'painting',
            name: 'painting',
            description: 'A beautiful painting',
            portable: true,
            visible: false,
            location: 'thief',
            properties: { value: 6, touched: true },
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
            location: 'thief',
            properties: { value: 0, isWeapon: true },
          },
        ],
        [
          'large-bag',
          {
            id: 'large-bag',
            name: 'large bag',
            description: 'A large bag',
            portable: true,
            visible: true,
            location: 'thief',
            properties: { value: 0 },
          },
        ],
        [
          'junk',
          {
            id: 'junk',
            name: 'junk',
            description: 'Worthless junk',
            portable: true,
            visible: false,
            location: 'thief',
            properties: { value: 0 },
          },
        ],
        [
          'egg',
          {
            id: 'egg',
            name: 'egg',
            description: 'A jeweled egg',
            portable: true,
            visible: false,
            location: 'thief',
            properties: { value: 5, isOpen: false, touched: true },
          },
        ],
      ]);
    });

    it('should deposit valuable items from thief to target room', () => {
      const thiefInventory = ['chalice', 'painting', 'stiletto', 'junk'];
      const result = service.depositBooty(thiefInventory, 'treasure-room', items);

      expect(result.anyMoved).toBe(true);
      expect(result.movedItemIds).toContain('chalice');
      expect(result.movedItemIds).toContain('painting');
      expect(items.get('chalice')?.location).toBe('treasure-room');
      expect(items.get('painting')?.location).toBe('treasure-room');
    });

    it('should not deposit stiletto', () => {
      const thiefInventory = ['chalice', 'stiletto'];
      const result = service.depositBooty(thiefInventory, 'treasure-room', items);

      expect(result.movedItemIds).not.toContain('stiletto');
      expect(items.get('stiletto')?.location).toBe('thief');
    });

    it('should not deposit large-bag', () => {
      const thiefInventory = ['chalice', 'large-bag'];
      const result = service.depositBooty(thiefInventory, 'treasure-room', items);

      expect(result.movedItemIds).not.toContain('large-bag');
      expect(items.get('large-bag')?.location).toBe('thief');
    });

    it('should not deposit worthless items', () => {
      const thiefInventory = ['chalice', 'junk'];
      const result = service.depositBooty(thiefInventory, 'treasure-room', items);

      expect(result.movedItemIds).not.toContain('junk');
      expect(items.get('junk')?.location).toBe('thief');
    });

    it('should make deposited items visible', () => {
      const thiefInventory = ['chalice', 'painting'];
      service.depositBooty(thiefInventory, 'treasure-room', items);

      expect(items.get('chalice')?.visible).toBe(true);
      expect(items.get('painting')?.visible).toBe(true);
    });

    it('should clear touchbit on deposited items', () => {
      const thiefInventory = ['chalice', 'painting'];
      service.depositBooty(thiefInventory, 'treasure-room', items);

      expect(items.get('chalice')?.properties?.touched).toBe(false);
      expect(items.get('painting')?.properties?.touched).toBe(false);
    });

    it('should open egg when deposited', () => {
      const thiefInventory = ['egg'];
      service.depositBooty(thiefInventory, 'treasure-room', items);

      expect(items.get('egg')?.properties?.isOpen).toBe(true);
      expect(items.get('egg')?.location).toBe('treasure-room');
      expect(items.get('egg')?.visible).toBe(true);
    });

    it('should return empty result when no valuable items', () => {
      const thiefInventory = ['stiletto', 'large-bag', 'junk'];
      const result = service.depositBooty(thiefInventory, 'treasure-room', items);

      expect(result.anyMoved).toBe(false);
      expect(result.movedItemIds).toEqual([]);
    });

    it('should skip non-existent items', () => {
      const thiefInventory = ['chalice', 'nonexistent', 'painting'];
      const result = service.depositBooty(thiefInventory, 'treasure-room', items);

      expect(result.movedItemIds).toEqual(['chalice', 'painting']);
    });

    it('should detect when a lit light source is deposited', () => {
      items.set('lamp', {
        id: 'lamp',
        name: 'lamp',
        description: 'A brass lamp',
        portable: true,
        visible: false,
        location: 'thief',
        properties: { value: 5, isLight: true, isLit: true },
      });

      const thiefInventory = ['lamp'];
      const result = service.depositBooty(thiefInventory, 'treasure-room', items);

      expect(result.stoleLitLight).toBe(true);
    });

    it('should deposit to generic room (not just treasure room)', () => {
      const thiefInventory = ['chalice', 'painting'];
      const result = service.depositBooty(thiefInventory, 'round-room', items);

      expect(result.anyMoved).toBe(true);
      expect(items.get('chalice')?.location).toBe('round-room');
      expect(items.get('painting')?.location).toBe('round-room');
    });

    it('should handle items without touched property', () => {
      items.set('crown', {
        id: 'crown',
        name: 'crown',
        description: 'A golden crown',
        portable: true,
        visible: false,
        location: 'thief',
        properties: { value: 15 },
      });

      const thiefInventory = ['crown'];
      const result = service.depositBooty(thiefInventory, 'treasure-room', items);

      expect(result.anyMoved).toBe(true);
      expect(items.get('crown')?.properties?.touched).toBeUndefined();
    });
  });

  describe('telemetry integration', () => {
    let items: Map<string, GameObject>;
    let telemetryService: jasmine.SpyObj<any>;

    beforeEach(() => {
      items = new Map([
        [
          'sword',
          {
            id: 'sword',
            name: 'sword',
            description: 'A sword',
            portable: true,
            visible: true,
            location: 'round-room',
            properties: { value: 0 },
          },
        ],
        [
          'treasure',
          {
            id: 'treasure',
            name: 'treasure',
            description: 'A treasure',
            portable: true,
            visible: false,
            location: 'thief',
            properties: { value: 10 },
          },
        ],
      ]);

      telemetryService = TestBed.inject(TelemetryService) as jasmine.SpyObj<any>;
      spyOn(telemetryService, 'logItemStolen');
      spyOn(telemetryService, 'logItemDeposited');
      spyOn(telemetryService, 'isEnabled').and.returnValue(true);
    });

    it('should log telemetry when items are stolen', () => {
      randomService.setSeed(12345);
      service.stealJunk('round-room', items, undefined, ['sword']);

      expect(telemetryService.logItemStolen).toHaveBeenCalledWith({
        actorId: 'thief',
        itemIds: ['sword'],
        fromRoomId: 'round-room',
        toRoomId: 'thief',
        probability: 0.1,
      });
    });

    it('should not log telemetry when no items are stolen', () => {
      randomService.setSeed(12345);
      service.stealJunk('empty-room', items);

      expect(telemetryService.logItemStolen).not.toHaveBeenCalled();
    });

    it('should log telemetry when items are deposited', () => {
      const thiefInventory = ['treasure'];
      service.depositBooty(thiefInventory, 'treasure-room', items);

      expect(telemetryService.logItemDeposited).toHaveBeenCalledWith({
        actorId: 'thief',
        itemIds: ['treasure'],
        fromRoomId: 'thief',
        toRoomId: 'treasure-room',
      });
    });

    it('should not log telemetry when no items are deposited', () => {
      const thiefInventory = ['stiletto'];
      service.depositBooty(thiefInventory, 'treasure-room', items);

      expect(telemetryService.logItemDeposited).not.toHaveBeenCalled();
    });

    it('should not log telemetry when telemetry is disabled', () => {
      (telemetryService.isEnabled as jasmine.Spy).and.returnValue(false);

      randomService.setSeed(12345);
      service.stealJunk('round-room', items, undefined, ['sword']);

      expect(telemetryService.logItemStolen).not.toHaveBeenCalled();
    });
  });
});
