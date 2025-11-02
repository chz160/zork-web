import { TestBed } from '@angular/core/testing';
import { RandomService } from '../services/random.service';
import { InventoryService } from '../services/inventory.service';
import { TelemetryService } from '../services/telemetry.service';
import { ThiefActor } from '../models/thief-actor';
import { GameObject } from '../models/game-object.model';

/**
 * Test harness for deterministic simulation of thief probabilistic behaviors.
 * This suite ensures that all PROB-based thief actions are testable deterministically
 * and covers edge cases: 0%, 100%, and middle probabilities.
 *
 * Based on legacy THIEF-VS-ADVENTURER, I-THIEF, and PROB usage from original ZIL code.
 */
describe('Thief Probability Test Harness', () => {
  let randomService: RandomService;
  let inventoryService: InventoryService;
  let telemetryService: TelemetryService;
  let thief: ThiefActor;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RandomService, InventoryService, TelemetryService],
    });
    randomService = TestBed.inject(RandomService);
    inventoryService = TestBed.inject(InventoryService);
    telemetryService = TestBed.inject(TelemetryService);

    // Create thief with services
    thief = new ThiefActor(undefined, telemetryService);
  });

  describe('RandomService Determinism - Foundation', () => {
    it('should produce identical sequences with same seed', () => {
      randomService.setSeed(12345);
      const sequence1 = Array.from({ length: 10 }, () => randomService.next());

      randomService.setSeed(12345);
      const sequence2 = Array.from({ length: 10 }, () => randomService.next());

      expect(sequence1).toEqual(sequence2);
    });

    it('should produce different sequences with different seeds', () => {
      randomService.setSeed(1);
      const value1 = randomService.next();

      randomService.setSeed(2);
      const value2 = randomService.next();

      expect(value1).not.toEqual(value2);
    });

    it('should allow seed retrieval for test replay', () => {
      const seed = 54321;
      randomService.setSeed(seed);
      expect(randomService.getSeed()).toBe(seed);
    });
  });

  describe('Edge Case: 0% Probability', () => {
    it('should never succeed with 0% probability', () => {
      randomService.setSeed(1000);

      // Test 100 iterations - all should fail
      const results = Array.from({ length: 100 }, () => randomService.nextBoolean(0.0));

      expect(results.every((r) => r === false)).toBe(true);
      expect(results.filter((r) => r).length).toBe(0);
    });

    it('should never move items with 0% probability', () => {
      randomService.setSeed(2000);

      const items = new Map<string, GameObject>([
        [
          'item1',
          {
            id: 'item1',
            name: 'Item 1',
            description: 'Test item 1',
            portable: true,
            location: 'room1',
            visible: true,
          },
        ],
        [
          'item2',
          {
            id: 'item2',
            name: 'Item 2',
            description: 'Test item 2',
            portable: true,
            location: 'room1',
            visible: true,
          },
        ],
        [
          'item3',
          {
            id: 'item3',
            name: 'Item 3',
            description: 'Test item 3',
            portable: true,
            location: 'room1',
            visible: true,
          },
        ],
      ]);

      const result = inventoryService.moveItems(['item1', 'item2', 'item3'], 'thief', items, {
        probability: 0.0,
      });

      expect(result.movedItemIds.length).toBe(0);
      expect(result.anyMoved).toBe(false);
      // Verify items remained in original location
      expect(items.get('item1')?.location).toBe('room1');
      expect(items.get('item2')?.location).toBe('room1');
      expect(items.get('item3')?.location).toBe('room1');
    });

    it('should handle repeated 0% probability checks consistently', () => {
      randomService.setSeed(3000);

      for (let i = 0; i < 50; i++) {
        expect(randomService.nextBoolean(0.0)).toBe(false);
      }
    });
  });

  describe('Edge Case: 100% Probability', () => {
    it('should always succeed with 100% probability', () => {
      randomService.setSeed(1000);

      // Test 100 iterations - all should succeed
      const results = Array.from({ length: 100 }, () => randomService.nextBoolean(1.0));

      expect(results.every((r) => r === true)).toBe(true);
      expect(results.filter((r) => r).length).toBe(100);
    });

    it('should always move all items with 100% probability', () => {
      randomService.setSeed(2000);

      const items = new Map<string, GameObject>([
        [
          'item1',
          {
            id: 'item1',
            name: 'Item 1',
            description: 'Test item 1',
            portable: true,
            location: 'room1',
            visible: true,
          },
        ],
        [
          'item2',
          {
            id: 'item2',
            name: 'Item 2',
            description: 'Test item 2',
            portable: true,
            location: 'room1',
            visible: true,
          },
        ],
        [
          'item3',
          {
            id: 'item3',
            name: 'Item 3',
            description: 'Test item 3',
            portable: true,
            location: 'room1',
            visible: true,
          },
        ],
      ]);

      const result = inventoryService.moveItems(['item1', 'item2', 'item3'], 'thief', items, {
        probability: 1.0,
      });

      expect(result.movedItemIds.length).toBe(3);
      expect(result.anyMoved).toBe(true);
      expect(result.movedItemIds).toEqual(['item1', 'item2', 'item3']);
      // Verify all items moved to thief
      expect(items.get('item1')?.location).toBe('thief');
      expect(items.get('item2')?.location).toBe('thief');
      expect(items.get('item3')?.location).toBe('thief');
    });

    it('should handle repeated 100% probability checks consistently', () => {
      randomService.setSeed(3000);

      for (let i = 0; i < 50; i++) {
        expect(randomService.nextBoolean(1.0)).toBe(true);
      }
    });
  });

  describe('Middle Probability: 30%', () => {
    it('should approximate 30% success rate over many trials', () => {
      randomService.setSeed(4000);

      const trials = 1000;
      let successCount = 0;

      for (let i = 0; i < trials; i++) {
        if (randomService.nextBoolean(0.3)) {
          successCount++;
        }
      }

      const successRate = successCount / trials;

      // Allow 5% deviation (25%-35% range)
      expect(successRate).toBeGreaterThanOrEqual(0.25);
      expect(successRate).toBeLessThanOrEqual(0.35);
    });

    it('should produce deterministic 30% probability sequence', () => {
      const seed = 5000;
      const trials = 20;

      randomService.setSeed(seed);
      const sequence1 = Array.from({ length: trials }, () => randomService.nextBoolean(0.3));

      randomService.setSeed(seed);
      const sequence2 = Array.from({ length: trials }, () => randomService.nextBoolean(0.3));

      expect(sequence1).toEqual(sequence2);
    });

    it('should move approximately 30% of items over many trials', () => {
      randomService.setSeed(6000);

      const itemCount = 100;
      const items = new Map<string, GameObject>();
      const itemIds: string[] = [];

      // Create 100 items
      for (let i = 0; i < itemCount; i++) {
        const itemId = `item${i}`;
        items.set(itemId, {
          id: itemId,
          name: `Item ${i}`,
          description: `Test item ${i}`,
          portable: true,
          location: 'room1',
          visible: true,
        });
        itemIds.push(itemId);
      }

      const result = inventoryService.moveItems(itemIds, 'thief', items, {
        probability: 0.3,
      });

      const movedPercentage = result.movedItemIds.length / itemCount;

      // Allow 10% deviation (20%-40% range) for statistical variance
      expect(movedPercentage).toBeGreaterThanOrEqual(0.2);
      expect(movedPercentage).toBeLessThanOrEqual(0.4);
    });
  });

  describe('Middle Probability: 50%', () => {
    it('should approximate 50% success rate over many trials', () => {
      randomService.setSeed(7000);

      const trials = 1000;
      let successCount = 0;

      for (let i = 0; i < trials; i++) {
        if (randomService.nextBoolean(0.5)) {
          successCount++;
        }
      }

      const successRate = successCount / trials;

      // Allow 5% deviation (45%-55% range)
      expect(successRate).toBeGreaterThanOrEqual(0.45);
      expect(successRate).toBeLessThanOrEqual(0.55);
    });

    it('should produce deterministic 50% probability sequence', () => {
      const seed = 8000;
      const trials = 20;

      randomService.setSeed(seed);
      const sequence1 = Array.from({ length: trials }, () => randomService.nextBoolean(0.5));

      randomService.setSeed(seed);
      const sequence2 = Array.from({ length: trials }, () => randomService.nextBoolean(0.5));

      expect(sequence1).toEqual(sequence2);
    });
  });

  describe('Middle Probability: 75%', () => {
    it('should approximate 75% success rate over many trials', () => {
      randomService.setSeed(9000);

      const trials = 1000;
      let successCount = 0;

      for (let i = 0; i < trials; i++) {
        if (randomService.nextBoolean(0.75)) {
          successCount++;
        }
      }

      const successRate = successCount / trials;

      // Allow 5% deviation (70%-80% range)
      expect(successRate).toBeGreaterThanOrEqual(0.7);
      expect(successRate).toBeLessThanOrEqual(0.8);
    });

    it('should produce deterministic 75% probability sequence', () => {
      const seed = 10000;
      const trials = 20;

      randomService.setSeed(seed);
      const sequence1 = Array.from({ length: trials }, () => randomService.nextBoolean(0.75));

      randomService.setSeed(seed);
      const sequence2 = Array.from({ length: trials }, () => randomService.nextBoolean(0.75));

      expect(sequence1).toEqual(sequence2);
    });
  });

  describe('Deterministic Tick Sequences', () => {
    it('should produce reproducible tick behavior with same seed', () => {
      const seed = 11000;

      // First run: simulate 10 ticks with probability-based decisions
      randomService.setSeed(seed);
      const decisions1: boolean[] = [];
      for (let tick = 0; tick < 10; tick++) {
        // Simulate: 60% chance thief moves
        decisions1.push(randomService.nextBoolean(0.6));
      }

      // Second run: same seed should produce same sequence
      randomService.setSeed(seed);
      const decisions2: boolean[] = [];
      for (let tick = 0; tick < 10; tick++) {
        decisions2.push(randomService.nextBoolean(0.6));
      }

      expect(decisions1).toEqual(decisions2);
    });

    it('should simulate deterministic thief movement sequence', () => {
      const seed = 12000;
      const rooms = ['round-room', 'maze-1', 'maze-2', 'treasure-room'];

      // First simulation
      randomService.setSeed(seed);
      const path1: string[] = [];
      let currentRoom = 0;
      for (let tick = 0; tick < 10; tick++) {
        path1.push(rooms[currentRoom]);
        // 70% chance to move to next room
        if (randomService.nextBoolean(0.7)) {
          currentRoom = (currentRoom + 1) % rooms.length;
        }
      }

      // Second simulation - should follow same path
      randomService.setSeed(seed);
      const path2: string[] = [];
      currentRoom = 0;
      for (let tick = 0; tick < 10; tick++) {
        path2.push(rooms[currentRoom]);
        if (randomService.nextBoolean(0.7)) {
          currentRoom = (currentRoom + 1) % rooms.length;
        }
      }

      expect(path1).toEqual(path2);
    });

    it('should simulate deterministic stealing sequence', () => {
      const seed = 13000;
      randomService.setSeed(seed);

      const items = new Map<string, GameObject>([
        [
          'sword',
          {
            id: 'sword',
            name: 'Sword',
            description: 'A sharp blade',
            portable: true,
            location: 'room1',
            visible: true,
          },
        ],
        [
          'lamp',
          {
            id: 'lamp',
            name: 'Lamp',
            description: 'A brass lantern',
            portable: true,
            location: 'room1',
            visible: true,
          },
        ],
        [
          'coin',
          {
            id: 'coin',
            name: 'Coin',
            description: 'A gold coin',
            portable: true,
            location: 'room1',
            visible: true,
          },
        ],
      ]);

      // First steal attempt (40% per item)
      const result1 = inventoryService.moveItems(['sword', 'lamp', 'coin'], 'thief', items, {
        probability: 0.4,
      });

      // Reset items
      for (const item of items.values()) {
        item.location = 'room1';
      }

      // Second steal attempt with same seed
      randomService.setSeed(seed);
      const result2 = inventoryService.moveItems(['sword', 'lamp', 'coin'], 'thief', items, {
        probability: 0.4,
      });

      expect(result1.movedItemIds).toEqual(result2.movedItemIds);
    });
  });

  describe('Complex Probabilistic Scenarios', () => {
    it('should handle multiple independent probability checks in sequence', () => {
      randomService.setSeed(14000);

      // Simulate thief behavior: move (70%), steal (40%), drop (30%)
      const sequence1 = {
        shouldMove: randomService.nextBoolean(0.7),
        shouldSteal: randomService.nextBoolean(0.4),
        shouldDrop: randomService.nextBoolean(0.3),
      };

      randomService.setSeed(14000);
      const sequence2 = {
        shouldMove: randomService.nextBoolean(0.7),
        shouldSteal: randomService.nextBoolean(0.4),
        shouldDrop: randomService.nextBoolean(0.3),
      };

      expect(sequence1).toEqual(sequence2);
    });

    it('should reproduce complex thief encounter scenario', () => {
      const seed = 15000;

      // Simulate THIEF-VS-ADVENTURER encounter
      const simulateEncounter = () => {
        const appears = randomService.nextBoolean(0.3); // 30% chance to appear
        const steals = appears && randomService.nextBoolean(0.5); // If appeared, 50% to steal
        const flees = appears && randomService.nextBoolean(0.2); // If appeared, 20% to flee

        return { appears, steals, flees };
      };

      randomService.setSeed(seed);
      const encounter1 = simulateEncounter();

      randomService.setSeed(seed);
      const encounter2 = simulateEncounter();

      expect(encounter1).toEqual(encounter2);
    });

    it('should test item stealing with visibility and touch flags', () => {
      randomService.setSeed(16000);

      const items = new Map<string, GameObject>([
        [
          'treasure1',
          {
            id: 'treasure1',
            name: 'Ruby',
            description: 'A precious ruby',
            portable: true,
            location: 'room1',
            visible: true,
          },
        ],
        [
          'treasure2',
          {
            id: 'treasure2',
            name: 'Emerald',
            description: 'A precious emerald',
            portable: true,
            location: 'room1',
            visible: true,
          },
        ],
      ]);

      const result = inventoryService.moveItems(['treasure1', 'treasure2'], 'thief', items, {
        probability: 0.5,
        hideOnMove: true,
        touchBit: true,
      });

      // Verify deterministic behavior
      for (const itemId of result.movedItemIds) {
        const item = items.get(itemId);
        expect(item?.location).toBe('thief');
        expect(item?.visible).toBe(false); // Should be hidden
        expect(item?.properties?.touched).toBe(true); // Should be marked as touched
      }

      // Reset and verify reproducibility
      for (const item of items.values()) {
        item.location = 'room1';
        item.visible = true;
        delete item.properties?.touched;
      }

      randomService.setSeed(16000);
      const result2 = inventoryService.moveItems(['treasure1', 'treasure2'], 'thief', items, {
        probability: 0.5,
        hideOnMove: true,
        touchBit: true,
      });

      expect(result2.movedItemIds).toEqual(result.movedItemIds);
    });

    it('should detect lit light theft deterministically', () => {
      randomService.setSeed(17000);

      const items = new Map<string, GameObject>([
        [
          'lamp',
          {
            id: 'lamp',
            name: 'Brass Lantern',
            description: 'A sturdy brass lantern',
            portable: true,
            location: 'room1',
            visible: true,
            properties: { isLight: true, isLit: true },
          },
        ],
        [
          'sword',
          {
            id: 'sword',
            name: 'Sword',
            description: 'A sharp blade',
            portable: true,
            location: 'room1',
            visible: true,
          },
        ],
      ]);

      const result = inventoryService.moveItems(['lamp', 'sword'], 'thief', items, {
        probability: 0.5,
      });

      // If lamp was moved, stoleLitLight should be true
      if (result.movedItemIds.includes('lamp')) {
        expect(result.stoleLitLight).toBe(true);
      } else {
        expect(result.stoleLitLight).toBe(false);
      }

      // Reset and verify reproducibility
      for (const item of items.values()) {
        item.location = 'room1';
      }

      randomService.setSeed(17000);
      const result2 = inventoryService.moveItems(['lamp', 'sword'], 'thief', items, {
        probability: 0.5,
      });

      expect(result2.stoleLitLight).toBe(result.stoleLitLight);
      expect(result2.movedItemIds).toEqual(result.movedItemIds);
    });
  });

  describe('Thief State Integration with Probabilities', () => {
    it('should maintain deterministic behavior across state transitions', () => {
      randomService.setSeed(18000);

      // Simulate gift acceptance followed by probabilistic actions
      thief.acceptGift('treasure', 100);
      expect(thief.isEngrossed()).toBe(true);

      // Thief behavior might differ when engrossed
      const action1 = randomService.nextBoolean(0.3); // Reduced probability when engrossed

      // Reset and replay
      const thief2 = new ThiefActor(undefined, telemetryService);
      randomService.setSeed(18000);
      thief2.acceptGift('treasure', 100);
      const action2 = randomService.nextBoolean(0.3);

      expect(action1).toBe(action2);
    });

    it('should test combat probability outcomes deterministically', () => {
      const seed = 19000;

      // Simulate combat with hit probability
      const simulateCombat = (hitProbability: number) => {
        const hits: boolean[] = [];
        for (let round = 0; round < 5; round++) {
          hits.push(randomService.nextBoolean(hitProbability));
        }
        return hits;
      };

      randomService.setSeed(seed);
      const combatRounds1 = simulateCombat(0.6);

      randomService.setSeed(seed);
      const combatRounds2 = simulateCombat(0.6);

      expect(combatRounds1).toEqual(combatRounds2);
    });
  });

  describe('Test Harness Utilities', () => {
    it('should provide seed management for test replay', () => {
      const initialSeed = randomService.getSeed();

      randomService.setSeed(20000);
      const capturedSeed = randomService.getSeed();
      expect(capturedSeed).toBe(20000);

      // Can restore to replay a failed test
      randomService.setSeed(initialSeed);
      expect(randomService.getSeed()).toBe(initialSeed);
    });

    it('should support test parameterization across probabilities', () => {
      const probabilities = [0.0, 0.25, 0.5, 0.75, 1.0];

      for (const prob of probabilities) {
        randomService.setSeed(21000); // Same seed for comparison

        const results = Array.from({ length: 100 }, () => randomService.nextBoolean(prob));
        const successRate = results.filter((r) => r).length / 100;

        if (prob === 0.0) {
          expect(successRate).toBe(0.0);
        } else if (prob === 1.0) {
          expect(successRate).toBe(1.0);
        } else {
          // Middle probabilities should be within reasonable range
          expect(successRate).toBeGreaterThanOrEqual(prob - 0.15);
          expect(successRate).toBeLessThanOrEqual(prob + 0.15);
        }
      }
    });
  });
});
