import { TestBed } from '@angular/core/testing';
import { LightService } from './light.service';
import { InventoryService } from './inventory.service';
import { RandomService } from './random.service';
import { GameObject } from '../models/game-object.model';

/**
 * Integration tests for stolen light source handling (STOLE-LIGHT? semantics).
 *
 * These tests validate the complete flow of:
 * 1. The thief stealing a light source from the player
 * 2. LightService detecting the loss of light
 * 3. Appropriate message being generated
 *
 * Based on legacy STOLE-LIGHT? routine from 1actions.zil line ~1875.
 */
describe('Light Stolen Integration (STOLE-LIGHT?)', () => {
  let lightService: LightService;
  let inventoryService: InventoryService;
  let randomService: RandomService;
  let items: Map<string, GameObject>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    lightService = TestBed.inject(LightService);
    inventoryService = TestBed.inject(InventoryService);
    randomService = TestBed.inject(RandomService);

    // Set up test items
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
        'torch',
        {
          id: 'torch',
          name: 'torch',
          description: 'A wooden torch',
          portable: true,
          visible: true,
          location: 'inventory',
          properties: { isLight: true, isLit: true, value: 2 },
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
      [
        'rope',
        {
          id: 'rope',
          name: 'rope',
          description: 'A sturdy rope',
          portable: true,
          visible: true,
          location: 'inventory',
          properties: { value: 0 },
        },
      ],
    ]);
  });

  it('should create services', () => {
    expect(lightService).toBeTruthy();
    expect(inventoryService).toBeTruthy();
  });

  describe('Thief steals only light source', () => {
    it('should detect when thief steals the only lit light source', () => {
      // Player starts with only a lamp (lit)
      const playerInventory = ['lamp', 'sword'];

      // Check initial state - player is lit
      const wasLit = lightService.isPlayerLit(playerInventory, items);
      expect(wasLit).toBe(true);

      // Thief steals the lamp
      inventoryService.moveItems(['lamp'], 'thief', items);

      // Update player's inventory after theft
      const newInventory = ['sword'];

      // Check light state after theft
      const result = lightService.updatePlayerLight(wasLit, newInventory, items);

      expect(result.isLit).toBe(false);
      expect(result.stateChanged).toBe(true);
      expect(result.leftInDark).toBe(true);
      expect(result.message).toBe('The thief seems to have left you in the dark.');
    });

    it('should handle thief stealing multiple items including light source', () => {
      const playerInventory = ['lamp', 'sword', 'rope'];
      const wasLit = lightService.isPlayerLit(playerInventory, items);
      expect(wasLit).toBe(true);

      // Thief steals lamp and sword
      inventoryService.moveItems(['lamp', 'sword'], 'thief', items);

      const newInventory = ['rope'];
      const result = lightService.updatePlayerLight(wasLit, newInventory, items);

      expect(result.leftInDark).toBe(true);
      expect(result.message).toBe('The thief seems to have left you in the dark.');
    });
  });

  describe('Thief steals one of multiple light sources', () => {
    it('should NOT show dark message when player has another lit light source', () => {
      // Player has both lamp and torch (both lit)
      const playerInventory = ['lamp', 'torch', 'sword'];
      const wasLit = lightService.isPlayerLit(playerInventory, items);
      expect(wasLit).toBe(true);

      // Thief steals lamp
      inventoryService.moveItems(['lamp'], 'thief', items);

      // Player still has torch (lit)
      const newInventory = ['torch', 'sword'];
      const result = lightService.updatePlayerLight(wasLit, newInventory, items);

      expect(result.isLit).toBe(true);
      expect(result.stateChanged).toBe(false);
      expect(result.leftInDark).toBe(false);
      expect(result.message).toBeUndefined();
    });

    it('should show dark message when thief steals all light sources', () => {
      const playerInventory = ['lamp', 'torch', 'sword'];
      const wasLit = lightService.isPlayerLit(playerInventory, items);
      expect(wasLit).toBe(true);

      // Thief steals both light sources
      inventoryService.moveItems(['lamp', 'torch'], 'thief', items);

      const newInventory = ['sword'];
      const result = lightService.updatePlayerLight(wasLit, newInventory, items);

      expect(result.leftInDark).toBe(true);
      expect(result.message).toBe('The thief seems to have left you in the dark.');
    });
  });

  describe('Thief steals unlit light source', () => {
    it('should NOT show dark message when stolen light was not lit', () => {
      // Player has lit lamp and unlit torch
      items.get('torch')!.properties!.isLit = false;
      const playerInventory = ['lamp', 'torch', 'sword'];
      const wasLit = lightService.isPlayerLit(playerInventory, items);
      expect(wasLit).toBe(true);

      // Thief steals the unlit torch
      inventoryService.moveItems(['torch'], 'thief', items);

      // Player still has lit lamp
      const newInventory = ['lamp', 'sword'];
      const result = lightService.updatePlayerLight(wasLit, newInventory, items);

      expect(result.isLit).toBe(true);
      expect(result.stateChanged).toBe(false);
      expect(result.leftInDark).toBe(false);
      expect(result.message).toBeUndefined();
    });
  });

  describe('Edge cases', () => {
    it('should NOT show dark message when player was already in dark', () => {
      // Player has no lit light sources
      items.get('lamp')!.properties!.isLit = false;
      const playerInventory = ['lamp', 'sword'];
      const wasLit = lightService.isPlayerLit(playerInventory, items);
      expect(wasLit).toBe(false);

      // Thief steals lamp
      inventoryService.moveItems(['lamp'], 'thief', items);

      const newInventory = ['sword'];
      const result = lightService.updatePlayerLight(wasLit, newInventory, items);

      expect(result.isLit).toBe(false);
      expect(result.stateChanged).toBe(false);
      expect(result.leftInDark).toBe(false);
      expect(result.message).toBeUndefined();
    });

    it('should handle thief stealing non-light items', () => {
      const playerInventory = ['lamp', 'sword', 'rope'];
      const wasLit = lightService.isPlayerLit(playerInventory, items);
      expect(wasLit).toBe(true);

      // Thief steals sword and rope (not light sources)
      inventoryService.moveItems(['sword', 'rope'], 'thief', items);

      const newInventory = ['lamp'];
      const result = lightService.updatePlayerLight(wasLit, newInventory, items);

      expect(result.isLit).toBe(true);
      expect(result.stateChanged).toBe(false);
      expect(result.leftInDark).toBe(false);
      expect(result.message).toBeUndefined();
    });

    it('should handle empty initial inventory', () => {
      const playerInventory: string[] = [];
      const wasLit = lightService.isPlayerLit(playerInventory, items);
      expect(wasLit).toBe(false);

      const newInventory: string[] = [];
      const result = lightService.updatePlayerLight(wasLit, newInventory, items);

      expect(result.isLit).toBe(false);
      expect(result.stateChanged).toBe(false);
      expect(result.leftInDark).toBe(false);
      expect(result.message).toBeUndefined();
    });
  });

  describe('Probabilistic theft with light sources', () => {
    it('should check light state after probabilistic theft', () => {
      randomService.setSeed(12345);
      const playerInventory = ['lamp', 'sword', 'rope'];
      const wasLit = lightService.isPlayerLit(playerInventory, items);
      expect(wasLit).toBe(true);

      // Thief attempts to steal with 50% probability
      const result = inventoryService.moveItems(['lamp', 'sword', 'rope'], 'thief', items, {
        probability: 0.5,
      });

      // Remove stolen items from inventory
      const newInventory = playerInventory.filter((id) => !result.movedItemIds.includes(id));

      // Check if player lost light
      const lightResult = lightService.updatePlayerLight(wasLit, newInventory, items);

      // If lamp was stolen, player should be in dark
      if (result.movedItemIds.includes('lamp')) {
        expect(lightResult.leftInDark).toBe(true);
        expect(lightResult.message).toBe('The thief seems to have left you in the dark.');
      } else {
        expect(lightResult.leftInDark).toBe(false);
        expect(lightResult.message).toBeUndefined();
      }
    });
  });

  describe('STOLE-LIGHT? semantics validation', () => {
    it('should exactly match legacy STOLE-LIGHT? behavior', () => {
      // This test validates the exact semantics of the legacy STOLE-LIGHT? routine:
      // 1. Save old LIT state
      // 2. Recalculate LIT based on current state
      // 3. If went from lit to unlit, print message

      const playerInventory = ['lamp', 'sword'];

      // Step 1: Save old LIT state
      const oldLit = lightService.isPlayerLit(playerInventory, items);
      expect(oldLit).toBe(true);

      // Simulate theft
      inventoryService.moveItems(['lamp'], 'thief', items);
      const newInventory = ['sword'];

      // Step 2 & 3: Recalculate LIT and check transition
      const result = lightService.updatePlayerLight(oldLit, newInventory, items);

      // Validate: newLit should be false, and message should be shown
      expect(result.isLit).toBe(false);
      expect(result.leftInDark).toBe(true);
      expect(result.message).toBe('The thief seems to have left you in the dark.');
    });
  });
});
