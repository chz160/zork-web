import { TestBed } from '@angular/core/testing';
import { GameEngineService } from './game-engine.service';
import { Room, GameObject, ParserResult, ObjectCandidate } from '../models';
import { TelemetryService } from './telemetry.service';

describe('GameEngineService', () => {
  let service: GameEngineService;
  let telemetryService: TelemetryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GameEngineService],
    });
    service = TestBed.inject(GameEngineService);
    telemetryService = TestBed.inject(TelemetryService);
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

    it('should display the starting room name only once', () => {
      service.initializeGame();
      const output = service.output();

      // Find lines that contain "West Of House"
      const roomNameLines = output.filter((line) => line === 'West Of House');

      // Should appear exactly once (the room name, not duplicated as description)
      expect(roomNameLines.length).toBe(1);
    });

    it('should display the full room description after room name', () => {
      service.initializeGame();
      const output = service.output();

      // Find the index of "West Of House"
      const roomNameIndex = output.findIndex((line) => line === 'West Of House');
      expect(roomNameIndex).toBeGreaterThanOrEqual(0);

      // The next line should be the full room description
      if (roomNameIndex >= 0 && roomNameIndex + 1 < output.length) {
        const description = output[roomNameIndex + 1];

        // Should be a proper description, not just repeating the room name
        expect(description).not.toBe('West Of House');
        expect(description).not.toBe('West of House');

        // Should contain descriptive content
        expect(description.length).toBeGreaterThan(20);
      }
    });

    it('should display canonical West Of House description on startup', () => {
      service.initializeGame();
      const output = service.output();

      // The canonical description should include key elements
      const fullOutput = output.join('\n');

      // Should contain the main description text
      expect(fullOutput).toContain('open field');
      expect(fullOutput).toContain('white house');
      expect(fullOutput).toContain('boarded front door');
    });

    it('should mention the mailbox in the location description', () => {
      service.initializeGame();
      const output = service.output();
      const fullOutput = output.join('\n').toLowerCase();

      // Mailbox should be mentioned (either in room desc or as a visible object)
      expect(fullOutput).toContain('mailbox');
    });
  });

  describe('player state', () => {
    it('should initialize with default player state', () => {
      const player = service.player();
      expect(player.currentRoomId).toBe('west-of-house');
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

      const result = service.executeCommand(invalidCommand);
      expect(result.success).toBe(false);
      expect(result.type).toBe('error');
      const output = service.output();
      expect(output[output.length - 1]).toBe('Invalid command');
    });

    it('should process valid look command', () => {
      const validCommand: ParserResult = {
        verb: 'look',
        directObject: null,
        indirectObject: null,
        preposition: null,
        rawInput: 'look',
        isValid: true,
      };

      const result = service.executeCommand(validCommand);
      expect(result).toBeDefined();
      expect(result.messages).toBeDefined();
      const output = service.output();
      expect(output.length).toBeGreaterThan(0);
    });

    it('should process inventory command', () => {
      const inventoryCommand: ParserResult = {
        verb: 'inventory',
        directObject: null,
        indirectObject: null,
        preposition: null,
        rawInput: 'inventory',
        isValid: true,
      };

      const result = service.executeCommand(inventoryCommand);
      expect(result.success).toBe(true);
      expect(result.type).toBe('inventory');
      expect(result.messages).toContain('You are empty-handed.');
    });

    it('should process help command', () => {
      const helpCommand: ParserResult = {
        verb: 'help',
        directObject: null,
        indirectObject: null,
        preposition: null,
        rawInput: 'help',
        isValid: true,
      };

      const result = service.executeCommand(helpCommand);
      expect(result.success).toBe(true);
      expect(result.type).toBe('help');
      expect(result.messages.length).toBeGreaterThan(0);
      expect(result.messages[0]).toBe('Available commands:');
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
      expect(player.currentRoomId).toBe('west-of-house');
      expect(player.moveCount).toBe(0);
      expect(service.output().length).toBeGreaterThan(0);
    });
  });

  describe('edge cases and state transitions', () => {
    it('should handle multiple state changes correctly', () => {
      const room1: Room = {
        id: 'room1',
        name: 'Room 1',
        description: 'First room',
        exits: new Map([['east', 'room2']]),
        objectIds: [],
        visited: false,
      };

      const room2: Room = {
        id: 'room2',
        name: 'Room 2',
        description: 'Second room',
        exits: new Map([['west', 'room1']]),
        objectIds: [],
        visited: false,
      };

      service.addRoom(room1);
      service.addRoom(room2);
      service.moveToRoom('room1');
      service.moveToRoom('room2');

      expect(service.player().currentRoomId).toBe('room2');
      expect(service.player().moveCount).toBe(2);
    });

    it('should handle finding object by alias', () => {
      const obj: GameObject = {
        id: 'obj-1',
        name: 'brass lamp',
        aliases: ['lamp', 'lantern', 'light'],
        description: 'A brass lamp',
        portable: true,
        visible: true,
        location: 'west-of-house',
      };

      service.addObject(obj);

      const takeCommand: ParserResult = {
        verb: 'take',
        directObject: 'lantern',
        indirectObject: null,
        preposition: null,
        rawInput: 'take lantern',
        isValid: true,
      };

      const result = service.executeCommand(takeCommand);
      expect(result.success).toBe(true);
      expect(service.player().inventory).toContain('obj-1');
    });

    it('should not increment move count for non-movement commands', () => {
      const initialMoves = service.player().moveCount;

      const lookCommand: ParserResult = {
        verb: 'look',
        directObject: null,
        indirectObject: null,
        preposition: null,
        rawInput: 'look',
        isValid: true,
      };

      service.executeCommand(lookCommand);
      expect(service.player().moveCount).toBe(initialMoves);

      const helpCommand: ParserResult = {
        verb: 'help',
        directObject: null,
        indirectObject: null,
        preposition: null,
        rawInput: 'help',
        isValid: true,
      };

      service.executeCommand(helpCommand);
      expect(service.player().moveCount).toBe(initialMoves);
    });

    it('should handle invisible objects correctly', () => {
      const obj: GameObject = {
        id: 'hidden',
        name: 'hidden object',
        aliases: ['hidden'],
        description: 'A hidden object',
        portable: true,
        visible: false,
        location: 'start',
      };

      service.addObject(obj);

      const examineCommand: ParserResult = {
        verb: 'examine',
        directObject: 'hidden',
        indirectObject: null,
        preposition: null,
        rawInput: 'examine hidden',
        isValid: true,
      };

      const result = service.executeCommand(examineCommand);
      expect(result.success).toBe(false);
      expect(result.messages[0]).toContain("don't see");
    });
  });

  describe('command handlers', () => {
    beforeEach(() => {
      // Set up a basic room
      const room: Room = {
        id: 'test-room',
        name: 'Test Room',
        description: 'A simple test room.',
        shortDescription: 'Test room.',
        exits: new Map([['north', 'next-room']]),
        objectIds: [],
        visited: false,
      };
      service.addRoom(room);
      service.moveToRoom('test-room');
    });

    describe('handleGo', () => {
      it('should move to a valid room', () => {
        const nextRoom: Room = {
          id: 'next-room',
          name: 'Next Room',
          description: 'The next room.',
          exits: new Map(),
          objectIds: [],
          visited: false,
        };
        service.addRoom(nextRoom);

        const goCommand: ParserResult = {
          verb: 'go',
          directObject: 'north',
          indirectObject: null,
          preposition: null,
          rawInput: 'go north',
          isValid: true,
        };

        const result = service.executeCommand(goCommand);
        expect(result.success).toBe(true);
        expect(service.player().currentRoomId).toBe('next-room');
      });

      it('should fail when direction has no exit', () => {
        const goCommand: ParserResult = {
          verb: 'go',
          directObject: 'south',
          indirectObject: null,
          preposition: null,
          rawInput: 'go south',
          isValid: true,
        };

        const result = service.executeCommand(goCommand);
        expect(result.success).toBe(false);
        expect(result.messages).toContain("You can't go that way.");
      });
    });

    describe('handleTake and handleDrop', () => {
      it('should take a portable object', () => {
        const obj: GameObject = {
          id: 'lamp',
          name: 'brass lamp',
          aliases: ['lamp'],
          description: 'A shiny brass lamp.',
          portable: true,
          visible: true,
          location: 'test-room',
        };
        service.addObject(obj);

        const takeCommand: ParserResult = {
          verb: 'take',
          directObject: 'lamp',
          indirectObject: null,
          preposition: null,
          rawInput: 'take lamp',
          isValid: true,
        };

        const result = service.executeCommand(takeCommand);
        expect(result.success).toBe(true);
        expect(result.messages).toContain('Taken.');
        expect(service.player().inventory).toContain('lamp');
      });

      it('should not take a non-portable object', () => {
        const obj: GameObject = {
          id: 'boulder',
          name: 'large boulder',
          aliases: ['boulder', 'rock'],
          description: 'A massive boulder.',
          portable: false,
          visible: true,
          location: 'test-room',
        };
        service.addObject(obj);

        const takeCommand: ParserResult = {
          verb: 'take',
          directObject: 'boulder',
          indirectObject: null,
          preposition: null,
          rawInput: 'take boulder',
          isValid: true,
        };

        const result = service.executeCommand(takeCommand);
        expect(result.success).toBe(false);
        expect(result.messages[0]).toContain("can't take");
      });

      it('should drop an object from inventory', () => {
        const obj: GameObject = {
          id: 'key',
          name: 'rusty key',
          aliases: ['key'],
          description: 'An old rusty key.',
          portable: true,
          visible: true,
          location: 'inventory',
        };
        service.addObject(obj);

        // Add to inventory manually for test
        service['playerState'].update((state) => ({
          ...state,
          inventory: [...state.inventory, 'key'],
        }));

        const dropCommand: ParserResult = {
          verb: 'drop',
          directObject: 'key',
          indirectObject: null,
          preposition: null,
          rawInput: 'drop key',
          isValid: true,
        };

        const result = service.executeCommand(dropCommand);
        expect(result.success).toBe(true);
        expect(result.messages).toContain('Dropped.');
        expect(service.player().inventory).not.toContain('key');
      });
    });

    describe('handleExamine', () => {
      it('should examine a visible object', () => {
        const obj: GameObject = {
          id: 'painting',
          name: 'old painting',
          aliases: ['painting', 'picture'],
          description: 'A beautiful landscape painting.',
          portable: false,
          visible: true,
          location: 'test-room',
        };
        service.addObject(obj);

        const examineCommand: ParserResult = {
          verb: 'examine',
          directObject: 'painting',
          indirectObject: null,
          preposition: null,
          rawInput: 'examine painting',
          isValid: true,
        };

        const result = service.executeCommand(examineCommand);
        expect(result.success).toBe(true);
        expect(result.messages).toContain('A beautiful landscape painting.');
      });

      it('should fail to examine non-existent object', () => {
        const examineCommand: ParserResult = {
          verb: 'examine',
          directObject: 'unicorn',
          indirectObject: null,
          preposition: null,
          rawInput: 'examine unicorn',
          isValid: true,
        };

        const result = service.executeCommand(examineCommand);
        expect(result.success).toBe(false);
        expect(result.messages[0]).toContain("don't see");
      });
    });

    describe('handleOpen and handleClose', () => {
      it('should open a closed, unlocked container', () => {
        const chest: GameObject = {
          id: 'chest',
          name: 'wooden chest',
          aliases: ['chest', 'box'],
          description: 'A sturdy wooden chest.',
          portable: false,
          visible: true,
          location: 'test-room',
          properties: {
            isOpen: false,
            isLocked: false,
            contains: [],
          },
        };
        service.addObject(chest);

        const openCommand: ParserResult = {
          verb: 'open',
          directObject: 'chest',
          indirectObject: null,
          preposition: null,
          rawInput: 'open chest',
          isValid: true,
        };

        const result = service.executeCommand(openCommand);
        expect(result.success).toBe(true);
        // Empty container should just say "Opened."
        expect(result.messages[0]).toBe('Opened.');
      });

      it('should not open a locked container', () => {
        const chest: GameObject = {
          id: 'chest',
          name: 'wooden chest',
          aliases: ['chest'],
          description: 'A sturdy wooden chest.',
          portable: false,
          visible: true,
          location: 'test-room',
          properties: {
            isOpen: false,
            isLocked: true,
            contains: [],
          },
        };
        service.addObject(chest);

        const openCommand: ParserResult = {
          verb: 'open',
          directObject: 'chest',
          indirectObject: null,
          preposition: null,
          rawInput: 'open chest',
          isValid: true,
        };

        const result = service.executeCommand(openCommand);
        expect(result.success).toBe(false);
        expect(result.messages[0]).toContain('locked');
      });

      it('should close an open container', () => {
        const chest: GameObject = {
          id: 'chest',
          name: 'wooden chest',
          aliases: ['chest'],
          description: 'A sturdy wooden chest.',
          portable: false,
          visible: true,
          location: 'test-room',
          properties: {
            isOpen: true,
            isLocked: false,
            contains: [],
          },
        };
        service.addObject(chest);

        const closeCommand: ParserResult = {
          verb: 'close',
          directObject: 'chest',
          indirectObject: null,
          preposition: null,
          rawInput: 'close chest',
          isValid: true,
        };

        const result = service.executeCommand(closeCommand);
        expect(result.success).toBe(true);
        expect(result.messages[0]).toContain('You close the');
      });

      it('should reveal contents when opening a container with items', () => {
        const chest: GameObject = {
          id: 'chest',
          name: 'wooden chest',
          aliases: ['chest'],
          description: 'A sturdy wooden chest.',
          portable: false,
          visible: true,
          location: 'test-room',
          properties: {
            isOpen: false,
            isLocked: false,
            contains: [],
          },
        };
        const coin: GameObject = {
          id: 'coin',
          name: 'gold coin',
          aliases: ['coin'],
          description: 'A shiny gold coin.',
          portable: true,
          visible: true,
          location: 'chest',
        };
        service.addObject(chest);
        service.addObject(coin);

        const openCommand: ParserResult = {
          verb: 'open',
          directObject: 'chest',
          indirectObject: null,
          preposition: null,
          rawInput: 'open chest',
          isValid: true,
        };

        const result = service.executeCommand(openCommand);
        expect(result.success).toBe(true);
        expect(result.messages[0]).toContain('Opening the wooden chest reveals');
        expect(result.messages[0]).toContain('gold coin');
      });

      it('should show firstDescription for single untouched item', () => {
        const box: GameObject = {
          id: 'box',
          name: 'small box',
          aliases: ['box'],
          description: 'A small wooden box.',
          portable: false,
          visible: true,
          location: 'test-room',
          properties: {
            isOpen: false,
            isLocked: false,
            contains: [],
          },
        };
        const gem: GameObject = {
          id: 'gem',
          name: 'ruby',
          aliases: ['gem', 'ruby'],
          description: 'A precious ruby.',
          portable: true,
          visible: true,
          location: 'box',
          firstDescription: 'A brilliant ruby sparkles in the box!',
        };
        service.addObject(box);
        service.addObject(gem);

        const openCommand: ParserResult = {
          verb: 'open',
          directObject: 'box',
          indirectObject: null,
          preposition: null,
          rawInput: 'open box',
          isValid: true,
        };

        const result = service.executeCommand(openCommand);
        expect(result.success).toBe(true);
        expect(result.messages[0]).toBe('The small box opens.');
        expect(result.messages[1]).toBe('A brilliant ruby sparkles in the box!');
      });

      it('should reveal multiple items in a readable format', () => {
        const chest: GameObject = {
          id: 'chest',
          name: 'wooden chest',
          aliases: ['chest'],
          description: 'A sturdy wooden chest.',
          portable: false,
          visible: true,
          location: 'test-room',
          properties: {
            isOpen: false,
            isLocked: false,
            contains: [],
          },
        };
        const coin: GameObject = {
          id: 'coin',
          name: 'gold coin',
          aliases: ['coin'],
          description: 'A shiny gold coin.',
          portable: true,
          visible: true,
          location: 'chest',
        };
        const sword: GameObject = {
          id: 'sword',
          name: 'rusty sword',
          aliases: ['sword'],
          description: 'An old rusty sword.',
          portable: true,
          visible: true,
          location: 'chest',
        };
        service.addObject(chest);
        service.addObject(coin);
        service.addObject(sword);

        const openCommand: ParserResult = {
          verb: 'open',
          directObject: 'chest',
          indirectObject: null,
          preposition: null,
          rawInput: 'open chest',
          isValid: true,
        };

        const result = service.executeCommand(openCommand);
        expect(result.success).toBe(true);
        expect(result.messages[0]).toContain('Opening the wooden chest reveals');
        expect(result.messages[0]).toContain('and');
      });

      it('should say "Opened." for transparent containers', () => {
        const jar: GameObject = {
          id: 'jar',
          name: 'glass jar',
          aliases: ['jar'],
          description: 'A transparent glass jar.',
          portable: false,
          visible: true,
          location: 'test-room',
          properties: {
            isOpen: false,
            isLocked: false,
            transparent: true,
            contains: [],
          },
        };
        const candy: GameObject = {
          id: 'candy',
          name: 'candy',
          aliases: ['candy'],
          description: 'A piece of candy.',
          portable: true,
          visible: true,
          location: 'jar',
        };
        service.addObject(jar);
        service.addObject(candy);

        const openCommand: ParserResult = {
          verb: 'open',
          directObject: 'jar',
          indirectObject: null,
          preposition: null,
          rawInput: 'open jar',
          isValid: true,
        };

        const result = service.executeCommand(openCommand);
        expect(result.success).toBe(true);
        expect(result.messages[0]).toBe('Opened.');
      });
    });

    describe('handleRead', () => {
      it('should read an object with readable text', () => {
        const note: GameObject = {
          id: 'note',
          name: 'crumpled note',
          aliases: ['note', 'paper'],
          description: 'A crumpled piece of paper.',
          portable: true,
          visible: true,
          location: 'test-room',
          properties: {
            readableText: 'Help! I am trapped in the dungeon!',
          },
        };
        service.addObject(note);

        const readCommand: ParserResult = {
          verb: 'read',
          directObject: 'note',
          indirectObject: null,
          preposition: null,
          rawInput: 'read note',
          isValid: true,
        };

        const result = service.executeCommand(readCommand);
        expect(result.success).toBe(true);
        expect(result.messages).toContain('Help! I am trapped in the dungeon!');
      });

      it('should fail to read object without text', () => {
        const rock: GameObject = {
          id: 'rock',
          name: 'smooth rock',
          aliases: ['rock'],
          description: 'A smooth, featureless rock.',
          portable: true,
          visible: true,
          location: 'test-room',
        };
        service.addObject(rock);

        const readCommand: ParserResult = {
          verb: 'read',
          directObject: 'rock',
          indirectObject: null,
          preposition: null,
          rawInput: 'read rock',
          isValid: true,
        };

        const result = service.executeCommand(readCommand);
        expect(result.success).toBe(false);
        expect(result.messages[0]).toContain('nothing to read');
      });
    });

    describe('handleLight and handleExtinguish', () => {
      it('should light an unlit light source', () => {
        const lamp: GameObject = {
          id: 'lamp',
          name: 'brass lamp',
          aliases: ['lamp'],
          description: 'A shiny brass lamp.',
          portable: true,
          visible: true,
          location: 'test-room',
          properties: {
            isLight: true,
            isLit: false,
          },
        };
        service.addObject(lamp);

        const lightCommand: ParserResult = {
          verb: 'light',
          directObject: 'lamp',
          indirectObject: null,
          preposition: null,
          rawInput: 'light lamp',
          isValid: true,
        };

        const result = service.executeCommand(lightCommand);
        expect(result.success).toBe(true);
        expect(result.messages[0]).toContain('now on');
      });

      it('should extinguish a lit light source', () => {
        const lamp: GameObject = {
          id: 'lamp',
          name: 'brass lamp',
          aliases: ['lamp'],
          description: 'A shiny brass lamp.',
          portable: true,
          visible: true,
          location: 'test-room',
          properties: {
            isLight: true,
            isLit: true,
          },
        };
        service.addObject(lamp);

        const extinguishCommand: ParserResult = {
          verb: 'extinguish',
          directObject: 'lamp',
          indirectObject: null,
          preposition: null,
          rawInput: 'extinguish lamp',
          isValid: true,
        };

        const result = service.executeCommand(extinguishCommand);
        expect(result.success).toBe(true);
        expect(result.messages[0]).toContain('now off');
      });
    });

    describe('handlePut', () => {
      it('should put an object in a container', () => {
        const key: GameObject = {
          id: 'key',
          name: 'silver key',
          aliases: ['key'],
          description: 'A small silver key.',
          portable: true,
          visible: true,
          location: 'inventory',
        };

        const box: GameObject = {
          id: 'box',
          name: 'wooden box',
          aliases: ['box'],
          description: 'A small wooden box.',
          portable: true,
          visible: true,
          location: 'test-room',
          properties: {
            isOpen: true,
            contains: [],
          },
        };

        service.addObject(key);
        service.addObject(box);

        // Add key to inventory
        service['playerState'].update((state) => ({
          ...state,
          inventory: [...state.inventory, 'key'],
        }));

        const putCommand: ParserResult = {
          verb: 'put',
          directObject: 'key',
          indirectObject: 'box',
          preposition: 'in',
          rawInput: 'put key in box',
          isValid: true,
        };

        const result = service.executeCommand(putCommand);
        expect(result.success).toBe(true);
        expect(result.messages[0]).toContain('You put the');
        expect(service.player().inventory).not.toContain('key');
      });
    });
  });

  describe('UI Integration Methods', () => {
    describe('disambiguation', () => {
      it('should set disambiguation callback', () => {
        const callback = jasmine
          .createSpy('disambiguationCallback')
          .and.returnValue(Promise.resolve(null));
        service.setDisambiguationCallback(callback);

        // Callback should be set (tested indirectly through requestDisambiguation)
        expect(callback).toBeDefined();
      });

      it('should request disambiguation and call callback', async () => {
        const candidates: ObjectCandidate[] = [
          { id: 'lamp1', displayName: 'brass lamp', score: 0.9, context: 'here' },
          { id: 'lamp2', displayName: 'oil lamp', score: 0.8, context: 'in inventory' },
        ];

        const selectedCandidate = candidates[0];
        const callback = jasmine
          .createSpy('disambiguationCallback')
          .and.returnValue(Promise.resolve(selectedCandidate));

        service.setDisambiguationCallback(callback);

        const result = await service.requestDisambiguation(candidates, 'Which lamp?');

        expect(callback).toHaveBeenCalledWith(candidates, 'Which lamp?');
        expect(result).toEqual(selectedCandidate);
      });

      it('should use default prompt if not provided', async () => {
        const candidates: ObjectCandidate[] = [
          { id: 'lamp1', displayName: 'brass lamp', score: 0.9, context: 'here' },
        ];

        const callback = jasmine
          .createSpy('disambiguationCallback')
          .and.returnValue(Promise.resolve(candidates[0]));

        service.setDisambiguationCallback(callback);

        await service.requestDisambiguation(candidates);

        expect(callback).toHaveBeenCalledWith(candidates, 'Which one do you mean?');
      });

      it('should return first candidate if no callback is set', async () => {
        const candidates: ObjectCandidate[] = [
          { id: 'lamp1', displayName: 'brass lamp', score: 0.9, context: 'here' },
          { id: 'lamp2', displayName: 'oil lamp', score: 0.8, context: 'in inventory' },
        ];

        const result = await service.requestDisambiguation(candidates);

        expect(result).toEqual(candidates[0]);
      });

      it('should return null if candidates list is empty and no callback', async () => {
        const result = await service.requestDisambiguation([]);
        expect(result).toBeNull();
      });

      it('should handle user cancellation', async () => {
        const candidates: ObjectCandidate[] = [
          { id: 'lamp1', displayName: 'brass lamp', score: 0.9, context: 'here' },
        ];

        const callback = jasmine
          .createSpy('disambiguationCallback')
          .and.returnValue(Promise.resolve(null));

        service.setDisambiguationCallback(callback);

        const result = await service.requestDisambiguation(candidates);

        expect(result).toBeNull();
      });

      it('should log disambiguation shown event', async () => {
        const candidates: ObjectCandidate[] = [
          { id: 'lamp1', displayName: 'brass lamp', score: 0.9, context: 'here' },
        ];

        spyOn(telemetryService, 'logDisambiguationShown');

        await service.requestDisambiguation(candidates, 'Select one');

        expect(telemetryService.logDisambiguationShown).toHaveBeenCalledWith({
          input: 'Select one',
          candidates: ['brass lamp'],
        });
      });

      it('should log disambiguation selected event', async () => {
        const candidates: ObjectCandidate[] = [
          { id: 'lamp1', displayName: 'brass lamp', score: 0.9, context: 'here' },
          { id: 'lamp2', displayName: 'oil lamp', score: 0.8, context: 'in inventory' },
        ];

        const callback = jasmine
          .createSpy('disambiguationCallback')
          .and.returnValue(Promise.resolve(candidates[1]));

        service.setDisambiguationCallback(callback);

        spyOn(telemetryService, 'logDisambiguationSelected');

        await service.requestDisambiguation(candidates, 'Pick one');

        expect(telemetryService.logDisambiguationSelected).toHaveBeenCalledWith({
          input: 'Pick one',
          candidates: ['brass lamp', 'oil lamp'],
          selectedIndex: 1,
        });
      });
    });

    describe('mailbox scenario', () => {
      it('should properly open mailbox and reveal leaflet', () => {
        service.initializeGame();

        // Get the mailbox object
        const mailbox = service['gameObjects']().get('mailbox');
        expect(mailbox).toBeDefined();

        // Get the leaflet object
        const leaflet = service['gameObjects']().get('advertisement');
        expect(leaflet).toBeDefined();
        expect(leaflet?.location).toBe('mailbox');

        // Open the mailbox
        const openCommand: ParserResult = {
          verb: 'open',
          directObject: 'mailbox',
          indirectObject: null,
          preposition: null,
          rawInput: 'open mailbox',
          isValid: true,
        };

        const result = service.executeCommand(openCommand);
        expect(result.success).toBe(true);
        expect(result.messages.length).toBeGreaterThan(0);
        // Should reveal the leaflet
        expect(result.messages[0]).toContain('Opening');
        expect(result.messages[0]).toContain('mailbox');
        expect(result.messages[0]).toContain('leaflet');
      });
    });

    describe('autocorrect confirmation', () => {
      it('should set autocorrect callback', () => {
        const callback = jasmine
          .createSpy('autocorrectCallback')
          .and.returnValue(Promise.resolve(true));
        service.setAutocorrectCallback(callback);

        // Callback should be set (tested indirectly through requestAutocorrectConfirmation)
        expect(callback).toBeDefined();
      });

      it('should request autocorrect confirmation and call callback', async () => {
        const callback = jasmine
          .createSpy('autocorrectCallback')
          .and.returnValue(Promise.resolve(true));

        service.setAutocorrectCallback(callback);

        const result = await service.requestAutocorrectConfirmation('mailbax', 'mailbox', 0.92);

        expect(callback).toHaveBeenCalledWith('mailbax', 'mailbox', 0.92);
        expect(result).toBe(true);
      });

      it('should auto-accept high confidence suggestions if no callback', async () => {
        const result = await service.requestAutocorrectConfirmation('mailbax', 'mailbox', 0.9);
        expect(result).toBe(true);
      });

      it('should auto-reject low confidence suggestions if no callback', async () => {
        const result = await service.requestAutocorrectConfirmation('abc', 'xyz', 0.7);
        expect(result).toBe(false);
      });

      it('should handle user accepting suggestion', async () => {
        const callback = jasmine
          .createSpy('autocorrectCallback')
          .and.returnValue(Promise.resolve(true));

        service.setAutocorrectCallback(callback);

        const result = await service.requestAutocorrectConfirmation('tak', 'take', 0.88);

        expect(result).toBe(true);
      });

      it('should handle user rejecting suggestion', async () => {
        const callback = jasmine
          .createSpy('autocorrectCallback')
          .and.returnValue(Promise.resolve(false));

        service.setAutocorrectCallback(callback);

        const result = await service.requestAutocorrectConfirmation('tak', 'take', 0.88);

        expect(result).toBe(false);
      });

      it('should log autocorrect suggestion event', async () => {
        spyOn(telemetryService, 'logAutocorrectSuggestion');

        await service.requestAutocorrectConfirmation('mailbax', 'mailbox', 0.92);

        expect(telemetryService.logAutocorrectSuggestion).toHaveBeenCalledWith(
          'mailbax',
          'mailbox',
          0.92
        );
      });

      it('should log autocorrect accepted event when accepted', async () => {
        const callback = jasmine
          .createSpy('autocorrectCallback')
          .and.returnValue(Promise.resolve(true));

        service.setAutocorrectCallback(callback);

        spyOn(telemetryService, 'logAutocorrectAccepted');

        await service.requestAutocorrectConfirmation('tak', 'take', 0.88);

        expect(telemetryService.logAutocorrectAccepted).toHaveBeenCalledWith('tak', 'take');
      });

      it('should not log autocorrect accepted event when rejected', async () => {
        const callback = jasmine
          .createSpy('autocorrectCallback')
          .and.returnValue(Promise.resolve(false));

        service.setAutocorrectCallback(callback);

        spyOn(telemetryService, 'logAutocorrectAccepted');

        await service.requestAutocorrectConfirmation('tak', 'take', 0.88);

        expect(telemetryService.logAutocorrectAccepted).not.toHaveBeenCalled();
      });
    });
  });
});
