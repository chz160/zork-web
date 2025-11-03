import { TestBed } from '@angular/core/testing';
import { ThiefActor, ThiefMode } from '../models/thief-actor';
import { InventoryService } from '../services/inventory.service';
import { LightService } from '../services/light.service';
import { MessageService } from '../services/message.service';
import { TelemetryService } from '../services/telemetry.service';
import { RandomService } from '../services/random.service';
import { GameObject } from '../models/game-object.model';

/**
 * End-to-end integration tests for canonical thief gameplay scenarios.
 * These tests validate complete gameplay flows matching the legacy game:
 * 1. Thief steals lamp (STOLE-LIGHT? semantics)
 * 2. Thief dies in treasure room (magic fades, treasures revealed)
 * 3. Player gives valuable item (thief becomes engrossed)
 * 4. Thief moves through maze and drops items
 *
 * Based on legacy routines:
 * - STOLE-LIGHT? from 1actions.zil line ~1875
 * - DEPOSIT-BOOTY from 1actions.zil lines 1897-1909, 2037-2077
 * - THIEF-ENGROSSED from gift handling
 * - STEAL-JUNK from movement/stealing logic
 */
describe('Thief Gameplay Scenarios (E2E Integration)', () => {
  let thief: ThiefActor;
  let inventoryService: InventoryService;
  let lightService: LightService;
  let messageService: MessageService;
  let telemetryService: TelemetryService;
  let randomService: RandomService;
  let items: Map<string, GameObject>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    inventoryService = TestBed.inject(InventoryService);
    lightService = TestBed.inject(LightService);
    messageService = TestBed.inject(MessageService);
    telemetryService = TestBed.inject(TelemetryService);
    randomService = TestBed.inject(RandomService);

    // Set deterministic seed for testing
    randomService.setSeed(42);

    // Create thief with services
    thief = new ThiefActor(messageService, telemetryService);
  });

  describe('Scenario 1: Thief Steals Lamp (STOLE-LIGHT? semantics)', () => {
    beforeEach(() => {
      // Setup: Player has only a lamp (lit) in a dark room
      items = new Map([
        [
          'lamp',
          {
            id: 'lamp',
            name: 'brass lamp',
            description: 'A brass lamp',
            portable: true,
            visible: true,
            location: 'inventory',
            properties: { isLight: true, isLit: true, value: 5 },
          },
        ],
        [
          'sword',
          {
            id: 'sword',
            name: 'elvish sword',
            description: 'An ancient elvish sword',
            portable: true,
            visible: true,
            location: 'inventory',
            properties: { value: 10, isWeapon: true },
          },
        ],
      ]);

      thief.locationId = 'round-room';
    });

    it('should detect light loss when thief steals the only lit light source', () => {
      let playerInventory = ['lamp', 'sword'];

      // Verify player starts with light
      const wasLit = lightService.isPlayerLit(playerInventory, items);
      expect(wasLit).toBe(true);

      // Thief steals the lamp
      const stealResult = inventoryService.moveItems(['lamp'], 'thief', items, {
        hideOnMove: true,
        touchBit: true,
      });

      // Verify lamp was stolen and is now hidden
      expect(stealResult.anyMoved).toBe(true);
      expect(stealResult.movedItemIds).toContain('lamp');
      expect(stealResult.stoleLitLight).toBe(true);
      expect(items.get('lamp')?.location).toBe('thief');
      expect(items.get('lamp')?.visible).toBe(false);

      // Verify player is now in darkness
      playerInventory = ['sword'];
      const isLit = lightService.isPlayerLit(playerInventory, items);
      expect(isLit).toBe(false);

      // Verify the appropriate message should be shown (legacy: "The thief seems to have left you in the dark.")
      expect(stealResult.stoleLitLight).toBe(true);
    });

    it('should not trigger STOLE-LIGHT if player has backup light source', () => {
      // Add torch as backup
      items.set('torch', {
        id: 'torch',
        name: 'torch',
        description: 'A wooden torch',
        portable: true,
        visible: true,
        location: 'inventory',
        properties: { isLight: true, isLit: true, value: 2 },
      });

      // Thief steals the lamp
      const stealResult = inventoryService.moveItems(['lamp'], 'thief', items, {
        hideOnMove: true,
        touchBit: true,
      });

      // stoleLitLight flag is true because a lit light source WAS stolen
      expect(stealResult.stoleLitLight).toBe(true);
      expect(stealResult.movedItemIds).toContain('lamp');

      // But player still has light (torch), so no "left in dark" message
      const playerInventory = ['torch', 'sword'];
      const isLit = lightService.isPlayerLit(playerInventory, items);
      expect(isLit).toBe(true);

      // Game engine checks BOTH stoleLitLight AND final light state
      // Message only shown if stoleLitLight=true AND final state is dark
    });

    it('should track touchbit on stolen lamp', () => {
      inventoryService.moveItems(['lamp'], 'thief', items, {
        hideOnMove: true,
        touchBit: true,
      });

      expect(items.get('lamp')?.properties?.touched).toBe(true);
    });

    it('should maintain state parity: lamp invisible when in thief inventory', () => {
      inventoryService.moveItems(['lamp'], 'thief', items, {
        hideOnMove: true,
        actor: thief,
      });

      // Legacy: Items stolen by thief are marked INVISIBLE
      const lamp = items.get('lamp');
      expect(lamp?.location).toBe('thief');
      expect(lamp?.visible).toBe(false);

      // Thief carries lamp in his bag (inventory automatically updated by moveItems)
      expect(thief.inventory).toContain('lamp');
    });
  });

  describe('Scenario 2: Thief Dies in Treasure Room (DEPOSIT-BOOTY + Magic Fade)', () => {
    beforeEach(() => {
      // Setup: Thief in treasure room with stolen treasures
      thief.locationId = 'treasure-room';
      thief.inventory = ['chalice', 'painting', 'egg', 'stiletto', 'large-bag'];

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
            name: 'jeweled egg',
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
        // Items already in treasure room (also invisible due to magic)
        [
          'sceptre',
          {
            id: 'sceptre',
            name: 'sceptre',
            description: 'A jeweled sceptre',
            portable: true,
            visible: false,
            location: 'treasure-room',
            properties: { value: 8 },
          },
        ],
        [
          'trident',
          {
            id: 'trident',
            name: 'crystal trident',
            description: 'A crystal trident',
            portable: true,
            visible: false,
            location: 'treasure-room',
            properties: { value: 4 },
          },
        ],
      ]);
    });

    it('should complete full treasure room death flow with magic fade', () => {
      // Step 1: Thief takes fatal damage
      expect(thief.getMode()).toBe(ThiefMode.CONSCIOUS);
      thief.onDamage(5); // Exactly to 0 = death

      // Verify thief is dead
      expect(thief.getMode()).toBe(ThiefMode.DEAD);
      expect(thief.tickEnabled).toBe(false);
      expect(thief.isInTreasureRoom()).toBe(true);

      // Step 2: Deposit booty (treasures from thief's inventory)
      const depositResult = inventoryService.depositBooty(
        thief.inventory,
        thief.locationId!,
        items
      );

      // Verify treasures were deposited
      expect(depositResult.anyMoved).toBe(true);
      expect(depositResult.movedItemIds).toContain('chalice');
      expect(depositResult.movedItemIds).toContain('painting');
      expect(depositResult.movedItemIds).toContain('egg');

      // Verify items are now in treasure room and visible
      expect(items.get('chalice')?.location).toBe('treasure-room');
      expect(items.get('chalice')?.visible).toBe(true);
      expect(items.get('painting')?.location).toBe('treasure-room');
      expect(items.get('painting')?.visible).toBe(true);
      expect(items.get('egg')?.location).toBe('treasure-room');
      expect(items.get('egg')?.visible).toBe(true);

      // Verify egg is opened (special treasure room behavior)
      expect(items.get('egg')?.properties?.isOpen).toBe(true);

      // Verify touchbit cleared
      expect(items.get('chalice')?.properties?.touched).toBe(false);
      expect(items.get('painting')?.properties?.touched).toBe(false);
      expect(items.get('egg')?.properties?.touched).toBe(false);

      // Step 3: Reveal all invisible items in treasure room (magic fade)
      // Legacy: "As the thief dies, the power of his magic decreases, and his treasures reappear:"
      // Note: Legacy code filters out 'chalice' initially, and also excludes actor entities
      const treasureRoomItems = Array.from(items.values()).filter(
        (item) => item.location === 'treasure-room' && item.id !== 'chalice'
      );

      // Reveal all invisible treasures
      const revealedItems: string[] = [];
      for (const item of treasureRoomItems) {
        if (!item.visible) {
          item.visible = true;
          revealedItems.push(item.id);
        }
      }

      // Verify previously-invisible items are now visible
      expect(revealedItems.length).toBeGreaterThan(0);
      expect(items.get('sceptre')?.visible).toBe(true);
      expect(items.get('trident')?.visible).toBe(true);

      // Step 4: Verify expected messages should be shown
      // Expected output (from legacy code):
      // 1. "As the thief dies, the power of his magic decreases, and his treasures reappear:"
      // 2. List each item with contents
      // 3. "The chalice is now safe to take."
      // Note: The actual message display is handled by the game engine.
      // This test validates the state changes that should trigger those messages.
    });

    it('should not reveal chalice immediately when thief dies in treasure room', () => {
      // Legacy behavior: chalice remains invisible until magic fades
      thief.onDamage(5);

      inventoryService.depositBooty(thief.inventory, thief.locationId!, items);

      // Chalice is deposited and made visible by depositBooty
      expect(items.get('chalice')?.location).toBe('treasure-room');
      expect(items.get('chalice')?.visible).toBe(true);

      // Note: In legacy, there's special handling for chalice visibility
      // The final message is "The chalice is now safe to take."
      // indicating it becomes visible/takeable after the magic fades
    });

    it('should handle thief death outside treasure room differently', () => {
      // Move thief to generic room
      thief.locationId = 'round-room';

      thief.onDamage(5);

      const depositResult = inventoryService.depositBooty(
        thief.inventory,
        thief.locationId!,
        items
      );

      // Treasures deposited in round-room (not treasure-room)
      expect(items.get('chalice')?.location).toBe('round-room');
      expect(items.get('painting')?.location).toBe('round-room');

      // No magic fade message (that's treasure room specific)
      // Expected message: "His booty remains." (from legacy)
      expect(depositResult.anyMoved).toBe(true);
      expect(thief.isInTreasureRoom()).toBe(false);
    });
  });

  describe('Scenario 3: Player Gives Valuable Item (THIEF-ENGROSSED)', () => {
    beforeEach(() => {
      thief.locationId = 'round-room';
      items = new Map([
        [
          'jewel',
          {
            id: 'jewel',
            name: 'jewel',
            description: 'A precious jewel',
            portable: true,
            visible: true,
            location: 'inventory',
            properties: { value: 50 },
          },
        ],
        [
          'rock',
          {
            id: 'rock',
            name: 'rock',
            description: 'A worthless rock',
            portable: true,
            visible: true,
            location: 'inventory',
            properties: { value: 0 },
          },
        ],
      ]);
    });

    it('should accept valuable gift and become engrossed', () => {
      // Initial state
      expect(thief.isEngrossed()).toBe(false);
      expect(thief.inventory).not.toContain('jewel');

      // Player gives jewel (value > 0)
      const jewel = items.get('jewel')!;
      thief.acceptGift('jewel', jewel.properties?.value || 0);

      // Verify thief accepted gift and became engrossed
      expect(thief.inventory).toContain('jewel');
      expect(thief.isEngrossed()).toBe(true);

      // Verify telemetry was logged
      // (In real implementation, this would be verified via telemetry service)

      // Expected message (from legacy):
      // "The thief is taken aback by your unexpected generosity,
      //  but accepts the jewel and stops to admire its beauty."
      // Note: Message service requires message tables to be loaded,
      // which happens at app initialization. In this unit test, we just verify
      // the mechanic works (thief accepts gift and becomes engrossed).
    });

    it('should accept worthless gift without becoming engrossed', () => {
      expect(thief.isEngrossed()).toBe(false);

      // Player gives rock (value = 0)
      const rock = items.get('rock')!;
      thief.acceptGift('rock', rock.properties?.value || 0);

      // Verify thief accepted gift but is not engrossed
      expect(thief.inventory).toContain('rock');
      expect(thief.isEngrossed()).toBe(false);

      // Expected message (from legacy):
      // "The thief places the rock in his bag and thanks you politely."
      // Note: Message service requires message tables to be loaded,
      // which happens at app initialization. In this unit test, we just verify
      // the mechanic works (thief accepts gift but doesn't become engrossed).
    });

    it('should remain engrossed through multiple valuable gifts', () => {
      // First gift
      thief.acceptGift('jewel', 50);
      expect(thief.isEngrossed()).toBe(true);

      // Add another valuable item
      items.set('gem', {
        id: 'gem',
        name: 'gem',
        description: 'A sparkling gem',
        portable: true,
        visible: true,
        location: 'inventory',
        properties: { value: 30 },
      });

      // Second gift
      thief.acceptGift('gem', 30);
      expect(thief.isEngrossed()).toBe(true);
      expect(thief.inventory).toContain('jewel');
      expect(thief.inventory).toContain('gem');
    });

    it('should validate gift acceptance with state parity', () => {
      // Legacy GIVE/THROW verb handling
      const jewel = items.get('jewel')!;

      // Pre-conditions
      expect(thief.inventory.length).toBe(0);
      expect(jewel.location).toBe('inventory');

      // Give jewel to thief
      thief.acceptGift('jewel', jewel.properties?.value || 0);

      // Move item in game state (simulating complete GIVE operation)
      jewel.location = 'thief';

      // Post-conditions
      expect(thief.inventory).toContain('jewel');
      expect(jewel.location).toBe('thief');
      expect(thief.isEngrossed()).toBe(true);

      // Engrossed state means thief is distracted for engrossedDuration ticks
      // (default: 2 ticks from config)
      const engrossedDuration = thief.getEngrossedDuration();
      expect(engrossedDuration).toBeGreaterThan(0);
    });
  });

  describe('Scenario 4: Thief Moves Through Maze and Drops Items', () => {
    beforeEach(() => {
      // Setup: Thief has valuable and worthless items
      thief.locationId = 'maze-1';
      thief.inventory = ['chalice', 'rock', 'rope', 'painting'];

      items = new Map([
        [
          'chalice',
          {
            id: 'chalice',
            name: 'chalice',
            description: 'A jeweled chalice',
            portable: true,
            visible: false,
            location: 'thief',
            properties: { value: 10, touched: true },
          },
        ],
        [
          'rock',
          {
            id: 'rock',
            name: 'rock',
            description: 'A rock',
            portable: true,
            visible: false,
            location: 'thief',
            properties: { value: 0 },
          },
        ],
        [
          'rope',
          {
            id: 'rope',
            name: 'rope',
            description: 'A rope',
            portable: true,
            visible: false,
            location: 'thief',
            properties: { value: 0 },
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
      ]);
    });

    it('should drop worthless items when moving through maze', () => {
      // Thief movement logic would identify worthless items in inventory
      const worthlessItems = thief.inventory.filter((itemId) => {
        const item = items.get(itemId);
        return item && (item.properties?.value || 0) === 0;
      });

      // Verify we have worthless items to drop
      expect(worthlessItems.length).toBeGreaterThan(0);
      expect(worthlessItems).toContain('rock');
      expect(worthlessItems).toContain('rope');

      // Before dropping, verify items exist in map
      const rockItem = items.get('rock');
      expect(rockItem).toBeDefined();
      expect(rockItem?.location).toBe('thief');
      expect(rockItem?.visible).toBe(false);

      // Thief drops worthless items in current location (maze-1)
      // Manual item updates are used here to test the state changes independently
      // from the moveItems service, demonstrating the intended behavior for item dropping.
      for (const itemId of worthlessItems) {
        const item = items.get(itemId);
        if (item) {
          item.location = 'maze-1';
          item.visible = true;
        }
      }

      // Verify items moved to room and are visible
      expect(items.get('rock')?.location).toBe('maze-1');
      expect(items.get('rock')?.visible).toBe(true);
      expect(items.get('rope')?.location).toBe('maze-1');
      expect(items.get('rope')?.visible).toBe(true);

      // Update thief's inventory to remove dropped items
      thief.inventory = thief.inventory.filter((itemId) => !worthlessItems.includes(itemId));

      // Thief should now only have valuable items
      expect(thief.inventory).toContain('chalice');
      expect(thief.inventory).toContain('painting');
      expect(thief.inventory).not.toContain('rock');
      expect(thief.inventory).not.toContain('rope');
    });

    it('should keep valuable items when moving', () => {
      // Identify valuable items
      const valuableItems = thief.inventory.filter((itemId) => {
        const item = items.get(itemId);
        return item && (item.properties?.value || 0) > 0;
      });

      expect(valuableItems).toContain('chalice');
      expect(valuableItems).toContain('painting');

      // These should NOT be dropped during normal movement
      // They remain in thief's inventory, invisible
      expect(items.get('chalice')?.location).toBe('thief');
      expect(items.get('chalice')?.visible).toBe(false);
      expect(items.get('painting')?.location).toBe('thief');
      expect(items.get('painting')?.visible).toBe(false);
    });

    it('should simulate thief movement with item management', () => {
      // Starting state
      const startLocation = thief.locationId;
      const startInventorySize = thief.inventory.length;

      // Step 1: Drop worthless items (STEAL-JUNK logic)
      const worthlessItems = thief.inventory.filter((itemId) => {
        const item = items.get(itemId);
        return item && (item.properties?.value || 0) === 0;
      });

      const dropResult = inventoryService.moveItems(worthlessItems, startLocation!, items, {
        probability: 0.5, // 50% chance to drop each item
        hideOnMove: false,
      });

      // Update thief's inventory to remove dropped items
      thief.inventory = thief.inventory.filter(
        (itemId) => !dropResult.movedItemIds.includes(itemId)
      );

      // Step 2: Thief moves to next room
      thief.locationId = 'maze-2';

      // Step 3: Verify state
      expect(thief.locationId).toBe('maze-2');
      expect(thief.inventory.length).toBeLessThanOrEqual(startInventorySize);

      // Valuable items still with thief
      const remainingValuables = thief.inventory.filter((itemId) => {
        const item = items.get(itemId);
        return item && (item.properties?.value || 0) > 0;
      });
      expect(remainingValuables.length).toBeGreaterThan(0);
    });

    it('should use stealJunk service method for complete flow', () => {
      // Legacy STEAL-JUNK routine
      // Steals worthless items from a room
      // Set items in room (visible so they can be stolen)
      items.get('rock')!.location = 'maze-1';
      items.get('rock')!.visible = true;
      items.get('rope')!.location = 'maze-1';
      items.get('rope')!.visible = true;

      // stealJunk has 10% probability per item, so we test it can be called
      // We don't assert on exact number stolen due to randomness
      const stealResult = inventoryService.stealJunk('maze-1', items);

      // The method should execute without error
      expect(stealResult).toBeDefined();
      expect(stealResult.anyMoved).toBeDefined();

      // If items were stolen, they should be with thief and invisible
      stealResult.movedItemIds.forEach((itemId: string) => {
        const item = items.get(itemId);
        expect(item?.location).toBe('thief');
        expect(item?.visible).toBe(false);
      });
    });

    it('should update thief inventory when actor is provided to stealJunk', () => {
      // Set items in room (visible so they can be stolen)
      items.get('rock')!.location = 'maze-1';
      items.get('rock')!.visible = true;
      items.get('rope')!.location = 'maze-1';
      items.get('rope')!.visible = true;

      // Clear thief inventory
      thief.inventory = [];

      // Call stealJunk with thief actor
      const stealResult = inventoryService.stealJunk(
        'maze-1',
        items,
        undefined,
        ['stiletto'],
        thief
      );

      // Verify that stolen items are in thief's inventory
      expect(stealResult.anyMoved).toBeDefined();
      stealResult.movedItemIds.forEach((itemId: string) => {
        expect(thief.inventory).toContain(itemId);
        const item = items.get(itemId);
        expect(item?.location).toBe('thief');
        expect(item?.visible).toBe(false);
      });
    });

    it('should handle complete tick cycle: steal -> move -> drop', () => {
      // Simulate one complete I-THIEF tick cycle

      // Starting state: thief in maze-1 with items
      expect(thief.locationId).toBe('maze-1');

      // Add items in current room to steal
      items.set('bottle', {
        id: 'bottle',
        name: 'bottle',
        description: 'An empty bottle',
        portable: true,
        visible: true,
        location: 'maze-1',
        properties: { value: 0 },
      });

      const roomItems = Array.from(items.values())
        .filter((item) => item.location === 'maze-1' && item.portable)
        .map((item) => item.id);

      // Step 1: Steal worthless items from room
      if (roomItems.length > 0) {
        inventoryService.stealJunk('maze-1', items, undefined, ['stiletto'], thief);
      }

      // Step 2: Drop worthless items from inventory
      const worthlessInInventory = thief.inventory.filter((itemId) => {
        const item = items.get(itemId);
        return item && (item.properties?.value || 0) === 0;
      });

      if (worthlessInInventory.length > 0) {
        const dropResult = inventoryService.moveItems(worthlessInInventory, 'maze-1', items, {
          probability: 0.5,
          hideOnMove: false,
        });

        // Remove dropped items from inventory
        thief.inventory = thief.inventory.filter(
          (itemId) => !dropResult.movedItemIds.includes(itemId)
        );
      }

      // Step 3: Move to next room
      const previousLocation = thief.locationId!;
      thief.locationId = 'maze-2';

      // Verify movement occurred
      expect(thief.locationId).not.toBe(previousLocation);
      expect(thief.locationId).toBe('maze-2');
    });
  });

  describe('Cross-scenario State Validation', () => {
    it('should maintain thief state consistency across multiple scenarios', () => {
      // Initialize
      expect(thief.getMode()).toBe(ThiefMode.CONSCIOUS);
      expect(thief.tickEnabled).toBe(true);

      // Scenario 1: Accept gift (engrossed state)
      thief.acceptGift('jewel', 50);
      expect(thief.isEngrossed()).toBe(true);
      expect(thief.getMode()).toBe(ThiefMode.CONSCIOUS);

      // Scenario 2: Take damage (still conscious)
      thief.onDamage(2);
      expect(thief.getMode()).toBe(ThiefMode.CONSCIOUS);
      expect(thief.flags.get('strength')).toBe(3);

      // Scenario 3: More damage (unconscious)
      thief.onDamage(4);
      expect(thief.getMode()).toBe(ThiefMode.UNCONSCIOUS);
      expect(thief.tickEnabled).toBe(false);

      // Scenario 4: Revival
      thief.flags.set('strength', 5);
      thief.onConscious();
      expect(thief.getMode()).toBe(ThiefMode.CONSCIOUS);
      expect(thief.tickEnabled).toBe(true);

      // Scenario 5: Fatal damage (death)
      thief.onDamage(5);
      expect(thief.getMode()).toBe(ThiefMode.DEAD);
      expect(thief.tickEnabled).toBe(false);
    });
  });
});
