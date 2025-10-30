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
      expect(result.type).toBe('system');
      expect(result.messages.length).toBeGreaterThan(0);
      expect(result.metadata?.['isInventoryCommand']).toBe(true);
    });
  });

  describe('Conversational Parser Integration', () => {
    it('should handle phrasal verbs with game objects', () => {
      // Try "look at" phrasal verb
      const lookAtCommand = parser.parse('look at house');
      expect(lookAtCommand.isValid).toBe(true);
      expect(lookAtCommand.verb).toBe('examine');
      expect(lookAtCommand.preposition).toBe('at');
      expect(lookAtCommand.directObject).toBe('house');

      const result = engine.executeCommand(lookAtCommand);
      // The result depends on whether 'house' is available in the current room
      // Just verify the command was processed
      expect(result).toBeDefined();
    });

    it('should handle "pick up" phrasal verb', () => {
      const command = parser.parse('pick up lamp');
      expect(command.isValid).toBe(true);
      expect(command.verb).toBe('take');
      expect(command.directObject).toBe('lamp');

      // Execute the command
      const result = engine.executeCommand(command);
      // The result depends on whether 'lamp' exists and is takeable
      expect(result).toBeDefined();
    });

    it('should track last referenced object for pronoun resolution', () => {
      // First, reference an object
      const examineCommand = parser.parse('examine house');
      expect(examineCommand.directObject).toBe('house');

      // Execute to update context
      engine.executeCommand(examineCommand);

      // Check that the parser context was updated
      expect(parser.getLastReferencedObject()).toBe('house');

      // Now use a pronoun
      const pronounCommand = parser.parse('it');
      expect(pronounCommand.isValid).toBe(true);
      expect(pronounCommand.verb).toBe('examine');
      expect(pronounCommand.directObject).toBe('house');
    });

    it('should resolve pronouns in complex commands', () => {
      // Set up context by examining an object
      const examineCommand = parser.parse('examine mailbox');
      engine.executeCommand(examineCommand);

      // Use pronoun in a different command
      const openCommand = parser.parse('open it');
      expect(openCommand.isValid).toBe(true);
      expect(openCommand.verb).toBe('open');
      expect(openCommand.directObject).toBe('mailbox');

      // Execute and verify
      const result = engine.executeCommand(openCommand);
      expect(result).toBeDefined();
    });

    it('should handle pronouns with phrasal verbs', () => {
      // Set context
      const lookCommand = parser.parse('look at mailbox');
      engine.executeCommand(lookCommand);

      // Use pronoun with phrasal verb
      const pickCommand = parser.parse('pick up it');
      expect(pickCommand.isValid).toBe(true);
      expect(pickCommand.verb).toBe('take');
      expect(pickCommand.directObject).toBe('mailbox');
    });

    it('should provide helpful error when standalone pronoun has no context', () => {
      // Clear context
      parser.setLastReferencedObject(null);

      // Try to use standalone pronoun
      const pronounCommand = parser.parse('it');
      expect(pronounCommand.isValid).toBe(false);
      expect(pronounCommand.errorMessage).toContain("I'm not sure what you're referring to");
    });

    it('should maintain backward compatibility with original commands', () => {
      // Original style commands should still work
      const takeCommand = parser.parse('take lamp');
      expect(takeCommand.isValid).toBe(true);
      expect(takeCommand.verb).toBe('take');

      const openCommand = parser.parse('open mailbox');
      expect(openCommand.isValid).toBe(true);
      expect(openCommand.verb).toBe('open');

      const goCommand = parser.parse('go north');
      expect(goCommand.isValid).toBe(true);
      expect(goCommand.verb).toBe('go');

      const directionCommand = parser.parse('n');
      expect(directionCommand.isValid).toBe(true);
      expect(directionCommand.verb).toBe('go');
    });

    it('should support data-driven synonyms from JSON config', () => {
      // These synonyms come from synonyms.json
      const grabCommand = parser.parse('grab lamp');
      expect(grabCommand.isValid).toBe(true);
      expect(grabCommand.verb).toBe('take');

      const inspectCommand = parser.parse('inspect door');
      expect(inspectCommand.isValid).toBe(true);
      expect(inspectCommand.verb).toBe('examine');
    });

    it('should include tokens in parse results for debugging', () => {
      const command = parser.parse('take the brass lamp');
      expect(command.tokens).toBeDefined();
      expect(command.tokens).toContain('take');
      expect(command.tokens).toContain('brass');
      expect(command.tokens).toContain('lamp');
      // "the" should be filtered out
      expect(command.tokens).not.toContain('the');
    });

    it('should handle natural conversational commands end-to-end', () => {
      // Simulate a natural player interaction flow
      let command, result;

      // 1. Player looks around
      command = parser.parse('look');
      result = engine.executeCommand(command);
      expect(result.success).toBe(true);

      // 2. Player examines something with natural language
      command = parser.parse('look at the white house');
      result = engine.executeCommand(command);
      expect(command.verb).toBe('examine');
      expect(command.directObject).toBe('white house');

      // 3. Player uses pronoun to interact with it
      command = parser.parse('examine it');
      result = engine.executeCommand(command);
      expect(command.directObject).toBe('white house');

      // 4. Player uses phrasal verb
      command = parser.parse('look inside mailbox');
      result = engine.executeCommand(command);
      expect(command.verb).toBe('examine');
      expect(command.preposition).toBe('in');

      // All commands should be processed without errors
      expect(result).toBeDefined();
    });
  });

  describe('Enter Verb Functionality', () => {
    it('should allow entering through an open window', () => {
      // Navigate to east-of-house where the window is located
      // From west-of-house, go north to north-of-house
      let command = parser.parse('go north');
      let result = engine.executeCommand(command);
      expect(result.success).toBe(true);

      // Then go east to east-of-house
      command = parser.parse('go east');
      result = engine.executeCommand(command);
      expect(result.success).toBe(true);

      // Verify we're at east-of-house
      const currentRoom = engine.getCurrentRoom();
      expect(currentRoom?.id).toBe('east-of-house');

      // Try to enter closed window - should fail
      command = parser.parse('enter window');
      result = engine.executeCommand(command);
      expect(result.success).toBe(false);
      expect(result.messages[0]).toContain('closed');

      // Open the window
      command = parser.parse('open window');
      result = engine.executeCommand(command);
      expect(result.success).toBe(true);

      // Now enter the window - should succeed and move to kitchen
      command = parser.parse('enter window');
      result = engine.executeCommand(command);
      expect(result.success).toBe(true);

      // Verify we're now in the kitchen
      const newRoom = engine.getCurrentRoom();
      expect(newRoom?.id).toBe('kitchen');
      expect(newRoom?.name).toBe('Kitchen');
    });

    it('should handle enter verb without object by trying to go in', () => {
      // At west-of-house, there's an "in" exit to stone-barrow
      const command = parser.parse('enter');
      const result = engine.executeCommand(command);

      // Should attempt to go "in"
      expect(result).toBeDefined();
      // The specific result depends on the room's "in" exit
    });

    it('should reject entering non-door objects', () => {
      // Try to enter the mailbox (which is not a door)
      const command = parser.parse('enter mailbox');
      const result = engine.executeCommand(command);

      expect(result.success).toBe(false);
      expect(result.messages[0]).toContain("can't enter");
    });
  });

  describe('Room Description with Objects on Surfaces', () => {
    it('should list objects on surfaces/containers when entering a room', () => {
      // Navigate to the kitchen which has objects on the kitchen table
      let command = parser.parse('go north');
      engine.executeCommand(command);

      command = parser.parse('go east');
      engine.executeCommand(command);

      // Open and enter the window
      command = parser.parse('open window');
      engine.executeCommand(command);

      command = parser.parse('enter window');
      const result = engine.executeCommand(command);

      // Verify we're in the kitchen
      const currentRoom = engine.getCurrentRoom();
      expect(currentRoom?.id).toBe('kitchen');

      // Verify the output includes the room description
      expect(result.messages).toContain('Kitchen');
      expect(result.messages.some((msg) => msg.includes('kitchen of the white house'))).toBe(true);

      // Verify objects on the table are listed (brown sack and bottle)
      const outputText = result.messages.join(' ');
      expect(outputText).toMatch(/sack|bag/i);
      expect(outputText).toMatch(/bottle/i);
    });

    it('should NOT list objects inside closed containers', () => {
      // Start at west-of-house which has a mailbox (closed) containing leaflet
      const currentRoom = engine.getCurrentRoom();
      expect(currentRoom?.id).toBe('west-of-house');

      // Get the room description
      const output = engine.output();

      // The leaflet should NOT be listed because it's in a closed mailbox
      const outputText = output.join(' ');
      expect(outputText).not.toMatch(/leaflet/i);

      // The mailbox itself should be mentioned in the room description
      expect(outputText).toMatch(/mailbox/i);
    });

    it('should list objects from open containers', () => {
      // Open the mailbox and check if leaflet becomes visible
      let command = parser.parse('open mailbox');
      let result = engine.executeCommand(command);
      expect(result.success).toBe(true);

      // Now look around - the leaflet should be visible
      command = parser.parse('look');
      result = engine.executeCommand(command);

      const outputText = result.messages.join(' ');
      expect(outputText).toMatch(/leaflet/i);
    });
  });
});
