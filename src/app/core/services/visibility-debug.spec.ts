import { TestBed } from '@angular/core/testing';
import { GameEngineService } from './game-engine.service';
import { GameObject } from '../models/game-object.model';

/**
 * Integration tests for the debug visibility commands.
 * Verifies that debug commands work correctly in the game engine.
 */
describe('Debug Visibility Commands (Integration)', () => {
  let gameEngine: GameEngineService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    gameEngine = TestBed.inject(GameEngineService);
    gameEngine.initializeGame();
  });

  describe('debug command', () => {
    it('should show help when called without arguments', () => {
      const result = gameEngine.executeCommand({
        isValid: true,
        verb: 'debug',
        rawInput: 'debug',
        directObject: null,
        indirectObject: null,
        preposition: null,
      });

      expect(result.success).toBe(true);
      expect(result.messages.some((m) => m.includes('Debug commands available'))).toBe(true);
      expect(result.messages.some((m) => m.includes('debug invisible'))).toBe(true);
      expect(result.messages.some((m) => m.includes('debug touched'))).toBe(true);
    });

    it('should list invisible items', () => {
      const result = gameEngine.executeCommand({
        isValid: true,
        verb: 'debug',
        directObject: 'invisible',
        rawInput: 'debug invisible',
        indirectObject: null,
        preposition: null,
      });

      expect(result.success).toBe(true);
      expect(result.type).toBe('system');
    });

    it('should list touched items', () => {
      const result = gameEngine.executeCommand({
        isValid: true,
        verb: 'debug',
        directObject: 'touched',
        rawInput: 'debug touched',
        indirectObject: null,
        preposition: null,
      });

      expect(result.success).toBe(true);
      expect(result.type).toBe('system');
    });

    it('should inspect a specific item by id', () => {
      const result = gameEngine.executeCommand({
        isValid: true,
        verb: 'debug',
        directObject: 'item mailbox',
        rawInput: 'debug item mailbox',
        indirectObject: null,
        preposition: null,
      });

      expect(result.success).toBe(true);
      expect(result.messages.some((m) => m.includes('mailbox'))).toBe(true);
    });

    it('should inspect a location', () => {
      const result = gameEngine.executeCommand({
        isValid: true,
        verb: 'debug',
        directObject: 'location west-of-house',
        rawInput: 'debug location west-of-house',
        indirectObject: null,
        preposition: null,
      });

      expect(result.success).toBe(true);
      expect(result.messages.some((m) => m.includes('west-of-house'))).toBe(true);
    });

    it('should handle unknown debug subcommand', () => {
      const result = gameEngine.executeCommand({
        isValid: true,
        verb: 'debug',
        directObject: 'unknown',
        rawInput: 'debug unknown',
        indirectObject: null,
        preposition: null,
      });

      expect(result.success).toBe(false);
      expect(result.type).toBe('error');
      expect(result.messages.some((m) => m.includes('Unknown debug command'))).toBe(true);
    });

    it('should handle missing item id for debug item', () => {
      const result = gameEngine.executeCommand({
        isValid: true,
        verb: 'debug',
        directObject: 'item',
        rawInput: 'debug item',
        indirectObject: null,
        preposition: null,
      });

      expect(result.success).toBe(false);
      expect(result.type).toBe('error');
      expect(result.messages.some((m) => m.includes('Usage: debug item'))).toBe(true);
    });

    it('should handle missing location id for debug location', () => {
      const result = gameEngine.executeCommand({
        isValid: true,
        verb: 'debug',
        directObject: 'location',
        rawInput: 'debug location',
        indirectObject: null,
        preposition: null,
      });

      expect(result.success).toBe(false);
      expect(result.type).toBe('error');
      expect(result.messages.some((m) => m.includes('Usage: debug location'))).toBe(true);
    });

    it('should handle non-existent item id', () => {
      const result = gameEngine.executeCommand({
        isValid: true,
        verb: 'debug',
        directObject: 'item nonexistent',
        rawInput: 'debug item nonexistent',
        indirectObject: null,
        preposition: null,
      });

      expect(result.success).toBe(false);
      expect(result.type).toBe('error');
      expect(result.messages.some((m) => m.includes('not found'))).toBe(true);
    });
  });

  describe('visibility semantics', () => {
    it('should distinguish between visible and invisible items', () => {
      // Get an item and make it invisible
      const testItem: GameObject = {
        id: 'test-item',
        name: 'test item',
        description: 'A test item',
        portable: true,
        visible: false, // invisible
        location: 'west-of-house',
      };

      // This is an internal test; in real game, items are loaded from data
      // Just verifying the model supports the properties
      expect(testItem.visible).toBe(false);
      expect(testItem.hidden).toBeUndefined();
    });

    it('should support hidden flag for puzzle mechanics', () => {
      const hiddenItem: GameObject = {
        id: 'secret-door',
        name: 'secret door',
        description: 'A hidden door',
        portable: false,
        visible: true,
        hidden: true, // explicitly hidden
        location: 'library',
      };

      expect(hiddenItem.visible).toBe(true);
      expect(hiddenItem.hidden).toBe(true);
    });

    it('should support conditional visibility', () => {
      const conditionalItem: GameObject = {
        id: 'shadow',
        name: 'shadow',
        description: 'A shadow',
        portable: false,
        visible: true,
        visibleFor: ['has_lantern', 'daylight'],
        location: 'dark-room',
      };

      expect(conditionalItem.visibleFor).toEqual(['has_lantern', 'daylight']);
    });

    it('should support touchbit for tracking interactions', () => {
      const touchedItem: GameObject = {
        id: 'rope',
        name: 'rope',
        description: 'A rope',
        portable: true,
        visible: false,
        location: 'thief',
        properties: {
          touched: true,
        },
      };

      expect(touchedItem.properties?.touched).toBe(true);
    });
  });
});
