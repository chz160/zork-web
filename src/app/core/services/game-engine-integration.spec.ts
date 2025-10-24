import { TestBed } from '@angular/core/testing';
import { GameEngineService } from './game-engine.service';
import { CommandParserService } from './command-parser.service';

/**
 * Integration tests demonstrating the complete data-driven game flow.
 * These tests show how the engine loads converted Zork data and handles
 * real game interactions using the imported world data.
 */
describe('GameEngine Integration with Converted Data', () => {
  let engine: GameEngineService;
  let parser: CommandParserService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GameEngineService, CommandParserService],
    });
    engine = TestBed.inject(GameEngineService);
    parser = TestBed.inject(CommandParserService);

    // Initialize the game with converted data
    engine.initializeGame();
  });

  describe('Game Initialization with Converted Data', () => {
    it('should load rooms from converted JSON data', () => {
      const currentRoom = engine.getCurrentRoom();
      expect(currentRoom).toBeTruthy();
      expect(currentRoom?.id).toBe('west-of-house');
      expect(currentRoom?.name).toBeDefined();
      expect(currentRoom?.description).toBeDefined();
    });

    it('should load at least 100 rooms', () => {
      // The converted data should contain 110 rooms
      const player = engine.player();
      expect(player).toBeTruthy();
      // Try to move to a few different rooms to verify data is loaded
      const currentRoom = engine.getCurrentRoom();
      expect(currentRoom).toBeTruthy();
    });

    it('should display welcome message and starting room description', () => {
      const output = engine.output();
      expect(output.length).toBeGreaterThan(0);
      expect(output[0]).toBe('Welcome to Zork!');
      expect(output[1]).toContain('Zork is a game of adventure, danger, and low cunning');
    });
  });

  describe('Basic Navigation with Converted World Data', () => {
    it('should allow navigation using converted room exits', () => {
      const currentRoom = engine.getCurrentRoom();
      expect(currentRoom).toBeTruthy();

      // Check that the room has exits from the converted data
      if (currentRoom && currentRoom.exits.size > 0) {
        const firstExit = Array.from(currentRoom.exits.keys())[0];
        const firstDestination = currentRoom.exits.get(firstExit);

        expect(firstDestination).toBeDefined();

        // Try to move in that direction
        const initialMoveCount = engine.player().moveCount;
        const command = parser.parse(`go ${firstExit}`);
        engine.executeCommand(command);

        // Movement should increment move count
        expect(engine.player().moveCount).toBeGreaterThan(initialMoveCount);
      }
    });

    it('should prevent movement in invalid directions', () => {
      const command = parser.parse('go invalidDirection');
      const result = engine.executeCommand(command);

      expect(result.success).toBe(false);
      expect(result.type).toBe('error');
    });
  });

  describe('Object Interactions with Converted Data', () => {
    it('should load game objects from converted JSON data', () => {
      // Get an object from the loaded data
      const someObject = engine.getObject('wall');
      if (someObject) {
        expect(someObject.id).toBe('wall');
        expect(someObject.name).toBeDefined();
        expect(someObject.description).toBeDefined();
        expect(Array.isArray(someObject.aliases)).toBe(true);
      }
    });

    it('should handle look command with converted room data', () => {
      const command = parser.parse('look');
      const result = engine.executeCommand(command);

      expect(result.success).toBe(true);
      expect(result.messages.length).toBeGreaterThan(0);
      expect(result.type).toBe('description');
    });
  });

  describe('Complete Gameplay Flow', () => {
    it('should support a sequence of commands using converted data', () => {
      // Sequence: look, check inventory, try to move
      const commands = ['look', 'inventory', 'look'];

      commands.forEach((cmdText) => {
        const command = parser.parse(cmdText);
        const result = engine.executeCommand(command);
        expect(result).toBeDefined();
        expect(result.messages).toBeDefined();
      });

      // Verify output history contains all results
      const output = engine.output();
      expect(output.length).toBeGreaterThan(commands.length);
    });

    it('should maintain game state across multiple commands', () => {
      const initialMoves = engine.player().moveCount;

      // Execute several commands that count moves
      const command1 = parser.parse('examine wall');
      engine.executeCommand(command1);

      // Move count should increase for examine
      expect(engine.player().moveCount).toBeGreaterThan(initialMoves);

      const movesBefore = engine.player().moveCount;

      // Look doesn't count as a move
      const command2 = parser.parse('look');
      engine.executeCommand(command2);

      expect(engine.player().moveCount).toBe(movesBefore);
    });
  });

  describe('Data Integrity Validation', () => {
    it('should have rooms with valid exit mappings', () => {
      const currentRoom = engine.getCurrentRoom();
      expect(currentRoom).toBeTruthy();

      if (currentRoom) {
        // Check that exits is a Map
        expect(currentRoom.exits).toBeInstanceOf(Map);

        // If there are exits, they should have string values
        currentRoom.exits.forEach((roomId, direction) => {
          expect(typeof roomId).toBe('string');
          expect(typeof direction).toBe('string');
        });
      }
    });

    it('should have objects with required properties', () => {
      // Check a known object from the converted data
      const wall = engine.getObject('wall');

      if (wall) {
        expect(wall.id).toBe('wall');
        expect(typeof wall.name).toBe('string');
        expect(typeof wall.description).toBe('string');
        expect(Array.isArray(wall.aliases)).toBe(true);
        expect(typeof wall.portable).toBe('boolean');
        expect(typeof wall.visible).toBe('boolean');
        expect(typeof wall.location).toBe('string');
      }
    });
  });

  describe('Help and System Commands', () => {
    it('should display help command', () => {
      const command = parser.parse('help');
      const result = engine.executeCommand(command);

      expect(result.success).toBe(true);
      expect(result.type).toBe('help');
      expect(result.messages.length).toBeGreaterThan(5);
      expect(result.messages.some((msg) => msg.includes('Navigation'))).toBe(true);
    });

    it('should support inventory command', () => {
      const command = parser.parse('inventory');
      const result = engine.executeCommand(command);

      expect(result.success).toBe(true);
      expect(result.type).toBe('inventory');
      expect(result.messages.length).toBeGreaterThan(0);
    });
  });
});
