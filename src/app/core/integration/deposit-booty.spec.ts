import { TestBed } from '@angular/core/testing';
import { ThiefActor } from '../models/thief-actor';
import { InventoryService } from '../services/inventory.service';
import { GameObject } from '../models/game-object.model';

/**
 * Integration tests for depositBooty functionality.
 * Demonstrates how depositBooty is used when thief dies in different scenarios.
 *
 * Based on legacy DEPOSIT-BOOTY routine from 1actions.zil (lines 1897-1909, 2037-2077).
 */
describe('depositBooty integration', () => {
  let thief: ThiefActor;
  let inventoryService: InventoryService;
  let items: Map<string, GameObject>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    inventoryService = TestBed.inject(InventoryService);

    thief = new ThiefActor();

    // Setup test items
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
    ]);
  });

  describe('thief death in generic room', () => {
    beforeEach(() => {
      thief.locationId = 'round-room';
      thief.inventory = ['chalice', 'painting', 'stiletto', 'large-bag'];
    });

    it('should deposit valuable items in current room when thief dies', () => {
      // Thief takes damage and dies
      thief.onDamage(5); // strength 5 -> 0

      // Verify thief is dead
      expect(thief.getMode()).toBe('DEAD');
      expect(thief.tickEnabled).toBe(false);

      // Deposit booty in current location
      const result = inventoryService.depositBooty(thief.inventory, thief.locationId!, items);

      // Verify valuable items were deposited
      expect(result.anyMoved).toBe(true);
      expect(result.movedItemIds).toContain('chalice');
      expect(result.movedItemIds).toContain('painting');

      // Verify items are now visible and in the room
      expect(items.get('chalice')?.location).toBe('round-room');
      expect(items.get('chalice')?.visible).toBe(true);
      expect(items.get('painting')?.location).toBe('round-room');
      expect(items.get('painting')?.visible).toBe(true);

      // Verify stiletto and bag were not deposited
      expect(result.movedItemIds).not.toContain('stiletto');
      expect(result.movedItemIds).not.toContain('large-bag');
    });

    it('should clear touchbit on deposited items', () => {
      thief.onDamage(5);

      inventoryService.depositBooty(thief.inventory, thief.locationId!, items);

      expect(items.get('chalice')?.properties?.touched).toBe(false);
      expect(items.get('painting')?.properties?.touched).toBe(false);
    });

    it('should generate message: "His booty remains."', () => {
      // This test documents the expected message for non-treasure-room death
      thief.onDamage(5);

      const result = inventoryService.depositBooty(thief.inventory, thief.locationId!, items);

      // In legacy code, when thief dies outside treasure room and deposited items:
      // The message would be: "His booty remains." (line 2065 in 1actions.zil)
      expect(result.anyMoved).toBe(true);
      expect(thief.isInTreasureRoom()).toBe(false);

      // Note: Actual message printing is handled by the combat/death system
      // This test just verifies the conditions for that message
    });
  });

  describe('thief death in treasure room', () => {
    beforeEach(() => {
      thief.locationId = 'treasure-room';
      thief.inventory = ['chalice', 'painting', 'egg', 'stiletto', 'large-bag'];

      // Add some already-deposited items in treasure room (also invisible due to magic)
      items.set('sceptre', {
        id: 'sceptre',
        name: 'sceptre',
        description: 'A jeweled sceptre',
        portable: true,
        visible: false, // Hidden by thief's magic
        location: 'treasure-room',
        properties: { value: 8 },
      });

      items.set('trident', {
        id: 'trident',
        name: 'trident',
        description: 'A crystal trident',
        portable: true,
        visible: false,
        location: 'treasure-room',
        properties: { value: 4 },
      });
    });

    it('should deposit valuable items when thief dies in treasure room', () => {
      thief.onDamage(5);

      expect(thief.isInTreasureRoom()).toBe(true);

      const result = inventoryService.depositBooty(thief.inventory, thief.locationId!, items);

      // Verify items were deposited
      expect(result.anyMoved).toBe(true);
      expect(result.movedItemIds).toContain('chalice');
      expect(result.movedItemIds).toContain('painting');
      expect(result.movedItemIds).toContain('egg');

      // Verify items are now visible and in treasure room
      expect(items.get('chalice')?.location).toBe('treasure-room');
      expect(items.get('chalice')?.visible).toBe(true);
      expect(items.get('painting')?.location).toBe('treasure-room');
      expect(items.get('painting')?.visible).toBe(true);
      expect(items.get('egg')?.location).toBe('treasure-room');
      expect(items.get('egg')?.visible).toBe(true);
    });

    it('should open egg when deposited in treasure room', () => {
      thief.onDamage(5);

      inventoryService.depositBooty(thief.inventory, thief.locationId!, items);

      expect(items.get('egg')?.properties?.isOpen).toBe(true);
    });

    it('should prepare items for "thief death in treasure room" message', () => {
      // This test documents the expected behavior for treasure room death
      thief.onDamage(5);

      const result = inventoryService.depositBooty(thief.inventory, thief.locationId!, items);

      // Verify depositBooty succeeded
      expect(result.anyMoved).toBe(true);
      expect(thief.isInTreasureRoom()).toBe(true);

      // After depositBooty, the system should:
      // 1. Iterate through ALL items in treasure room
      // 2. Make invisible items visible (except chalice, thief, adventurer)
      // 3. Print message: "As the thief dies, the power of his magic decreases,
      //    and his treasures reappear:"
      // 4. List each item with contents if applicable
      // 5. Print: "The chalice is now safe to take."

      // Get items that would need to be revealed (currently invisible in treasure room)
      const treasureRoomItems = Array.from(items.values()).filter(
        (item) => item.location === 'treasure-room'
      );

      expect(treasureRoomItems.length).toBeGreaterThan(0);

      // Verify some items are still invisible (before reveal step)
      const invisibleItems = treasureRoomItems.filter(
        (item) => !item.visible && item.id !== 'chalice'
      );

      // Note: In actual implementation, these would be made visible
      // by iterating through all treasure room items after depositBooty
      expect(invisibleItems.length).toBeGreaterThan(0);
    });

    it('should handle treasure room reveal separately from depositBooty', () => {
      thief.onDamage(5);

      // Step 1: depositBooty moves items from thief
      const depositResult = inventoryService.depositBooty(
        thief.inventory,
        thief.locationId!,
        items
      );

      expect(depositResult.anyMoved).toBe(true);

      // Step 2: Reveal all invisible items in treasure room (except chalice)
      // This mimics the legacy code behavior (lines 2040-2063 in 1actions.zil)
      const treasureRoomItems = Array.from(items.values()).filter(
        (item) =>
          item.location === 'treasure-room' &&
          item.id !== 'chalice' &&
          item.id !== 'thief' &&
          item.id !== 'adventurer'
      );

      const revealedItems: string[] = [];
      for (const item of treasureRoomItems) {
        if (!item.visible) {
          item.visible = true;
          revealedItems.push(item.id);
        }
      }

      // Verify items were revealed
      expect(revealedItems.length).toBeGreaterThan(0);
      expect(items.get('sceptre')?.visible).toBe(true);
      expect(items.get('trident')?.visible).toBe(true);

      // Verify deposited items are also visible
      expect(items.get('chalice')?.visible).toBe(true);
      expect(items.get('painting')?.visible).toBe(true);
      expect(items.get('egg')?.visible).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle thief death with no valuable items', () => {
      thief.locationId = 'round-room';
      thief.inventory = ['stiletto', 'large-bag'];

      thief.onDamage(5);

      const result = inventoryService.depositBooty(thief.inventory, thief.locationId!, items);

      expect(result.anyMoved).toBe(false);
      expect(result.movedItemIds).toEqual([]);
    });

    it('should handle thief death with empty inventory', () => {
      thief.locationId = 'round-room';
      thief.inventory = [];

      thief.onDamage(5);

      const result = inventoryService.depositBooty(thief.inventory, thief.locationId!, items);

      expect(result.anyMoved).toBe(false);
      expect(result.movedItemIds).toEqual([]);
    });

    it('should handle thief without location', () => {
      thief.locationId = null;
      thief.inventory = ['chalice'];

      thief.onDamage(5);

      // In this case, system should handle null location appropriately
      // For now, we test that depositBooty can handle any location string
      const fallbackLocation = thief.getTreasureRoomId();

      const result = inventoryService.depositBooty(thief.inventory, fallbackLocation, items);

      expect(result.anyMoved).toBe(true);
      expect(items.get('chalice')?.location).toBe('treasure-room');
    });
  });

  describe('message generation scenarios', () => {
    it('should provide data for "generic room death" message', () => {
      thief.locationId = 'round-room';
      thief.inventory = ['chalice', 'painting'];

      thief.onDamage(5);

      const result = inventoryService.depositBooty(thief.inventory, thief.locationId!, items);

      // Data for message generation:
      // - thief.isInTreasureRoom() === false
      // - result.anyMoved === true
      // Expected message: "His booty remains."

      expect(thief.isInTreasureRoom()).toBe(false);
      expect(result.anyMoved).toBe(true);
    });

    it('should provide data for "treasure room death" message', () => {
      thief.locationId = 'treasure-room';
      thief.inventory = ['chalice', 'painting', 'egg'];

      thief.onDamage(5);

      const result = inventoryService.depositBooty(thief.inventory, thief.locationId!, items);

      // Data for message generation:
      // - thief.isInTreasureRoom() === true
      // - result.movedItemIds contains items to list
      // Expected messages:
      // 1. "As the thief dies, the power of his magic decreases, and his treasures reappear:"
      // 2. List each item: "  A chalice", "  A painting", "  A egg"
      // 3. "The chalice is now safe to take."

      expect(thief.isInTreasureRoom()).toBe(true);
      expect(result.anyMoved).toBe(true);
      expect(result.movedItemIds).toContain('chalice');
      expect(result.movedItemIds).toContain('painting');
      expect(result.movedItemIds).toContain('egg');
    });
  });
});
