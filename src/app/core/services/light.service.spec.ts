import { TestBed } from '@angular/core/testing';
import { LightService } from './light.service';
import { GameObject } from '../models/game-object.model';

describe('LightService', () => {
  let service: LightService;
  let items: Map<string, GameObject>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LightService);

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
          properties: { isLight: true, isLit: true },
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
          properties: { isLight: true, isLit: false },
        },
      ],
      [
        'sword',
        {
          id: 'sword',
          name: 'sword',
          description: 'A sharp sword',
          portable: true,
          visible: true,
          location: 'inventory',
          properties: { value: 10 },
        },
      ],
    ]);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('isPlayerLit', () => {
    it('should return true when player has a lit light source', () => {
      const result = service.isPlayerLit(['lamp'], items);
      expect(result).toBe(true);
    });

    it('should return false when player has no lit light sources', () => {
      const result = service.isPlayerLit(['torch', 'sword'], items);
      expect(result).toBe(false);
    });

    it('should return false when player has no items', () => {
      const result = service.isPlayerLit([], items);
      expect(result).toBe(false);
    });

    it('should return true when player has multiple lit light sources', () => {
      // Light the torch
      items.get('torch')!.properties!.isLit = true;

      const result = service.isPlayerLit(['lamp', 'torch'], items);
      expect(result).toBe(true);
    });

    it('should return false when player has unlit light source', () => {
      const result = service.isPlayerLit(['torch'], items);
      expect(result).toBe(false);
    });

    it('should return false when player has non-light items', () => {
      const result = service.isPlayerLit(['sword'], items);
      expect(result).toBe(false);
    });

    it('should handle items not in the map', () => {
      const result = service.isPlayerLit(['nonexistent'], items);
      expect(result).toBe(false);
    });

    it('should handle items without light properties', () => {
      items.set('book', {
        id: 'book',
        name: 'book',
        description: 'A dusty book',
        portable: true,
        visible: true,
        location: 'inventory',
        properties: {},
      });

      const result = service.isPlayerLit(['book'], items);
      expect(result).toBe(false);
    });
  });

  describe('isLitLightSource', () => {
    it('should return true for a lit light source', () => {
      const result = service.isLitLightSource('lamp', items);
      expect(result).toBe(true);
    });

    it('should return false for an unlit light source', () => {
      const result = service.isLitLightSource('torch', items);
      expect(result).toBe(false);
    });

    it('should return false for a non-light item', () => {
      const result = service.isLitLightSource('sword', items);
      expect(result).toBe(false);
    });

    it('should return false for a non-existent item', () => {
      const result = service.isLitLightSource('nonexistent', items);
      expect(result).toBe(false);
    });
  });

  describe('updatePlayerLight', () => {
    it('should detect when player goes from lit to unlit (STOLE-LIGHT case)', () => {
      const result = service.updatePlayerLight(true, ['sword'], items);

      expect(result.isLit).toBe(false);
      expect(result.stateChanged).toBe(true);
      expect(result.leftInDark).toBe(true);
      expect(result.message).toBe('The thief seems to have left you in the dark.');
    });

    it('should detect when player goes from unlit to lit', () => {
      const result = service.updatePlayerLight(false, ['lamp'], items);

      expect(result.isLit).toBe(true);
      expect(result.stateChanged).toBe(true);
      expect(result.leftInDark).toBe(false);
      expect(result.message).toBeUndefined();
    });

    it('should detect no change when player remains lit', () => {
      const result = service.updatePlayerLight(true, ['lamp'], items);

      expect(result.isLit).toBe(true);
      expect(result.stateChanged).toBe(false);
      expect(result.leftInDark).toBe(false);
      expect(result.message).toBeUndefined();
    });

    it('should detect no change when player remains unlit', () => {
      const result = service.updatePlayerLight(false, ['sword'], items);

      expect(result.isLit).toBe(false);
      expect(result.stateChanged).toBe(false);
      expect(result.leftInDark).toBe(false);
      expect(result.message).toBeUndefined();
    });

    it('should not show message when player goes from unlit to unlit', () => {
      const result = service.updatePlayerLight(false, ['torch'], items);

      expect(result.isLit).toBe(false);
      expect(result.stateChanged).toBe(false);
      expect(result.leftInDark).toBe(false);
      expect(result.message).toBeUndefined();
    });

    it('should handle player with multiple lit light sources', () => {
      items.get('torch')!.properties!.isLit = true;

      const result = service.updatePlayerLight(true, ['lamp', 'torch'], items);

      expect(result.isLit).toBe(true);
      expect(result.stateChanged).toBe(false);
      expect(result.leftInDark).toBe(false);
      expect(result.message).toBeUndefined();
    });

    it('should handle player losing one of multiple light sources', () => {
      items.get('torch')!.properties!.isLit = true;

      // Player has both lamp and torch lit, loses one but still has light
      const result = service.updatePlayerLight(true, ['lamp'], items);

      expect(result.isLit).toBe(true);
      expect(result.stateChanged).toBe(false);
      expect(result.leftInDark).toBe(false);
      expect(result.message).toBeUndefined();
    });

    it('should handle player losing last light source among multiple', () => {
      items.get('torch')!.properties!.isLit = true;

      // Player had both lamp and torch lit, now has only unlit sword
      const result = service.updatePlayerLight(true, ['sword'], items);

      expect(result.isLit).toBe(false);
      expect(result.stateChanged).toBe(true);
      expect(result.leftInDark).toBe(true);
      expect(result.message).toBe('The thief seems to have left you in the dark.');
    });

    it('should handle empty inventory', () => {
      const result = service.updatePlayerLight(true, [], items);

      expect(result.isLit).toBe(false);
      expect(result.stateChanged).toBe(true);
      expect(result.leftInDark).toBe(true);
      expect(result.message).toBe('The thief seems to have left you in the dark.');
    });
  });
});
