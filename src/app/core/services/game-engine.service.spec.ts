import { TestBed } from '@angular/core/testing';
import { GameEngineService } from './game-engine.service';
import { Room, GameObject, ParserResult } from '../models';

describe('GameEngineService', () => {
  let service: GameEngineService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GameEngineService],
    });
    service = TestBed.inject(GameEngineService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initializeGame', () => {
    it('should display welcome message', () => {
      service.initializeGame();
      const output = service.output();
      expect(output.length).toBeGreaterThan(0);
      expect(output[0]).toBe('Welcome to Zork!');
    });
  });

  describe('player state', () => {
    it('should initialize with default player state', () => {
      const player = service.player();
      expect(player.currentRoomId).toBe('start');
      expect(player.inventory).toEqual([]);
      expect(player.score).toBe(0);
      expect(player.moveCount).toBe(0);
      expect(player.isAlive).toBe(true);
    });
  });

  describe('room management', () => {
    it('should add a room to the game world', () => {
      const room: Room = {
        id: 'test-room',
        name: 'Test Room',
        description: 'A test room',
        exits: new Map(),
        objectIds: [],
        visited: false,
      };

      service.addRoom(room);
      expect(service.getCurrentRoom).toBeDefined();
    });

    it('should move player to a room and increment move count', () => {
      const room: Room = {
        id: 'test-room',
        name: 'Test Room',
        description: 'A test room',
        exits: new Map(),
        objectIds: [],
        visited: false,
      };

      service.addRoom(room);
      const initialMoves = service.player().moveCount;
      service.moveToRoom('test-room');

      expect(service.player().currentRoomId).toBe('test-room');
      expect(service.player().moveCount).toBe(initialMoves + 1);
      expect(service.currentRoom()?.visited).toBe(true);
    });

    it('should display error when moving to non-existent room', () => {
      service.moveToRoom('non-existent');
      const output = service.output();
      expect(output[output.length - 1]).toBe("You can't go that way.");
    });
  });

  describe('object management', () => {
    it('should add an object to the game world', () => {
      const obj: GameObject = {
        id: 'test-object',
        name: 'Test Object',
        aliases: ['test'],
        description: 'A test object',
        portable: true,
        visible: true,
        location: 'test-room',
      };

      service.addObject(obj);
      const retrieved = service.getObject('test-object');
      expect(retrieved).toEqual(obj);
    });

    it('should return null for non-existent object', () => {
      const obj = service.getObject('non-existent');
      expect(obj).toBeNull();
    });
  });

  describe('executeCommand', () => {
    it('should handle invalid commands', () => {
      const invalidCommand: ParserResult = {
        verb: null,
        directObject: null,
        indirectObject: null,
        preposition: null,
        rawInput: 'invalid',
        isValid: false,
        errorMessage: 'Invalid command',
      };

      service.executeCommand(invalidCommand);
      const output = service.output();
      expect(output[output.length - 1]).toBe('Invalid command');
    });

    it('should process valid commands', () => {
      const validCommand: ParserResult = {
        verb: 'look',
        directObject: null,
        indirectObject: null,
        preposition: null,
        rawInput: 'look',
        isValid: true,
      };

      service.executeCommand(validCommand);
      const output = service.output();
      expect(output.length).toBeGreaterThan(0);
    });
  });

  describe('saveGame and loadGame', () => {
    it('should save game state as JSON string', () => {
      const saveData = service.saveGame();
      expect(saveData).toBeTruthy();
      expect(() => JSON.parse(saveData)).not.toThrow();
    });

    it('should load game state', () => {
      const saveData = service.saveGame();
      service.loadGame(saveData);
      const output = service.output();
      expect(output[output.length - 1]).toBe('Game loaded.');
    });
  });

  describe('resetGame', () => {
    it('should reset game to initial state', () => {
      // Make some changes
      service.initializeGame();
      const room: Room = {
        id: 'test-room',
        name: 'Test Room',
        description: 'A test room',
        exits: new Map(),
        objectIds: [],
        visited: false,
      };
      service.addRoom(room);
      service.moveToRoom('test-room');

      // Reset
      service.resetGame();

      // Verify reset
      const player = service.player();
      expect(player.currentRoomId).toBe('start');
      expect(player.moveCount).toBe(0);
      expect(service.output().length).toBeGreaterThan(0);
    });
  });
});
