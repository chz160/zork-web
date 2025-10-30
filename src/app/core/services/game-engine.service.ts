import { Injectable, signal, inject } from '@angular/core';
import {
  Player,
  Room,
  GameObject,
  ParserResult,
  CommandOutput,
  Direction,
  ObjectCandidate,
  ExitCondition,
  ExecutionReport,
  ExecutionOptions,
} from '../models';
import { DataLoaderService } from './data-loader.service';
import { CommandParserService } from './command-parser.service';
import { ObjectResolverService, ResolutionContext } from './object-resolver.service';
import { TelemetryService } from './telemetry.service';
import { CommandDispatcherService } from './command-dispatcher.service';

/**
 * Core game engine service that manages game state and processes commands.
 * This is the central coordinator for the Zork game logic.
 *
 * Responsibilities:
 * - Maintain game state (rooms, objects, player)
 * - Process parsed commands and execute actions
 * - Enforce game rules and handle interactions
 * - Manage game persistence (save/load)
 */
@Injectable({
  providedIn: 'root',
})
export class GameEngineService {
  private readonly dataLoader = inject(DataLoaderService);
  private readonly commandParser = inject(CommandParserService);
  private readonly objectResolver = inject(ObjectResolverService);
  private readonly telemetry = inject(TelemetryService);
  private readonly dispatcher = inject(CommandDispatcherService);

  /** Current player state */
  private readonly playerState = signal<Player>({
    currentRoomId: 'west-of-house',
    inventory: [],
    score: 0,
    moveCount: 0,
    isAlive: true,
    flags: new Map(),
  });

  /** Map of all rooms in the game world */
  private readonly rooms = signal<Map<string, Room>>(new Map());

  /** Map of all game objects */
  private readonly gameObjects = signal<Map<string, GameObject>>(new Map());

  /** History of game output messages */
  private readonly outputHistory = signal<string[]>([]);

  // Public read-only signals for UI binding
  readonly player = this.playerState.asReadonly();
  readonly currentRoom = signal<Room | null>(null);
  readonly output = this.outputHistory.asReadonly();

  /**
   * Initialize the game with starting state.
   * Loads game data from JSON files and sets up the starting room.
   */
  initializeGame(): void {
    // Load all rooms and objects from converted data
    const rooms = this.dataLoader.loadRooms();
    const objects = this.dataLoader.loadObjects();

    // Populate the game world
    rooms.forEach((room) => this.addRoom(room));
    objects.forEach((obj) => this.addObject(obj));

    // Set the starting room
    const startingRoomId = this.playerState().currentRoomId;
    const startingRoom = this.rooms().get(startingRoomId);

    if (startingRoom) {
      this.currentRoom.set(startingRoom);
    }

    // Display welcome message
    this.addOutput('Welcome to Zork!');
    this.addOutput('Zork is a game of adventure, danger, and low cunning.');
    this.addOutput('');

    // Show the starting room description
    if (startingRoom) {
      const messages = this.getRoomDescription(startingRoom, true);
      messages.forEach((msg) => this.addOutput(msg));
    }
  }

  /**
   * Process a parsed command and execute the corresponding action.
   * @param parserResult The parsed command from the player
   * @returns Structured output for UI rendering
   */
  executeCommand(parserResult: ParserResult): CommandOutput {
    if (!parserResult.isValid || !parserResult.verb) {
      const message = parserResult.errorMessage || "I don't understand that command.";
      this.addOutput(message);
      return { messages: [message], success: false, type: 'error' };
    }

    // Track last referenced object for pronoun resolution
    if (parserResult.directObject) {
      this.commandParser.setLastReferencedObject(parserResult.directObject);
    }

    // Increment move count for most commands (except look, inventory, help)
    const nonCountingVerbs = new Set(['look', 'inventory', 'help', 'save', 'load']);
    if (!nonCountingVerbs.has(parserResult.verb)) {
      this.playerState.update((state) => ({
        ...state,
        moveCount: state.moveCount + 1,
      }));
    }

    // Dispatch to appropriate handler based on verb
    let output: CommandOutput;
    switch (parserResult.verb) {
      case 'go':
        output = this.handleGo(parserResult.directObject);
        break;
      case 'enter':
        output = this.handleEnter(parserResult.directObject);
        break;
      case 'look':
        output = this.handleLook(parserResult.directObject);
        break;
      case 'examine':
        output = this.handleExamine(parserResult.directObject);
        break;
      case 'take':
        output = this.handleTake(parserResult.directObject);
        break;
      case 'drop':
        output = this.handleDrop(parserResult.directObject);
        break;
      case 'inventory':
        output = this.handleInventory();
        break;
      case 'status':
        output = this.handleStatus();
        break;
      case 'open':
        output = this.handleOpen(parserResult.directObject);
        break;
      case 'close':
        output = this.handleClose(parserResult.directObject);
        break;
      case 'unlock':
        output = this.handleUnlock(parserResult.directObject, parserResult.indirectObject);
        break;
      case 'lock':
        output = this.handleLock(parserResult.directObject, parserResult.indirectObject);
        break;
      case 'read':
        output = this.handleRead(parserResult.directObject);
        break;
      case 'light':
        output = this.handleLight(parserResult.directObject);
        break;
      case 'extinguish':
        output = this.handleExtinguish(parserResult.directObject);
        break;
      case 'put':
        output = this.handlePut(parserResult.directObject, parserResult.indirectObject);
        break;
      case 'use':
        output = this.handleUse(parserResult.directObject);
        break;
      case 'attack':
        output = this.handleAttack(parserResult.directObject, parserResult.indirectObject);
        break;
      case 'push':
        output = this.handlePush(parserResult.directObject);
        break;
      case 'help':
        output = this.handleHelp();
        break;
      case 'map':
      case 'location':
        output = this.handleMap();
        break;
      case 'save':
        output = this.handleSave();
        break;
      case 'load':
        output = this.handleLoad();
        break;
      case 'quit':
        output = this.handleQuit();
        break;
      default:
        output = {
          messages: ["That command isn't implemented yet."],
          success: false,
          type: 'error',
        };
    }

    // Add messages to output history
    output.messages.forEach((msg) => this.addOutput(msg));

    // Check sword glow state after each command (like the I-SWORD daemon in original)
    this.updateSwordGlowState(this.playerState().currentRoomId);

    return output;
  }

  /**
   * Execute multiple parsed commands sequentially using the CommandDispatcher.
   * This method coordinates the execution of command sequences, managing state propagation,
   * UI interactions (disambiguation/autocorrect), and execution policies.
   *
   * @param commands Array of parsed commands to execute
   * @param options Execution options (policy, UI blocking)
   * @returns Promise resolving to comprehensive execution report
   *
   * @example
   * ```typescript
   * const commands = [
   *   parser.parse('open mailbox'),
   *   parser.parse('take leaflet')
   * ];
   * const report = await gameEngine.executeParsedCommands(commands, { policy: 'fail-early' });
   * console.log(`Executed ${report.executedCommands} of ${report.totalCommands} commands`);
   * ```
   */
  async executeParsedCommands(
    commands: ParserResult[],
    options?: ExecutionOptions
  ): Promise<ExecutionReport> {
    // Use the dispatcher to execute commands sequentially
    // The executor function is bound to this class to execute each command
    const executor = (command: ParserResult): CommandOutput => {
      return this.executeCommand(command);
    };

    // Execute through the dispatcher which handles:
    // - Sequential execution
    // - State propagation
    // - Policy enforcement (fail-early vs best-effort)
    // - Telemetry logging
    const report = await this.dispatcher.executeParsedCommands(commands, executor, options);

    return report;
  }

  /**
   * Get the current room the player is in.
   */
  getCurrentRoom(): Room | null {
    const roomId = this.playerState().currentRoomId;
    return this.rooms().get(roomId) || null;
  }

  /**
   * Move the player to a different room.
   * @param roomId The ID of the destination room
   */
  moveToRoom(roomId: string): void {
    const room = this.rooms().get(roomId);
    if (!room) {
      this.addOutput("You can't go that way.");
      return;
    }

    // Update player state
    this.playerState.update((state) => ({
      ...state,
      currentRoomId: roomId,
      moveCount: state.moveCount + 1,
    }));

    // Mark room as visited and set current room
    const updatedRoom = { ...room, visited: true };
    this.rooms.update((rooms) => new Map(rooms).set(roomId, updatedRoom));
    this.currentRoom.set(updatedRoom);

    // Note: Room description is added by the caller (handleGo, initializeGame, etc.)
  }

  /**
   * Add a message to the output history.
   * @param message The message to add
   */
  private addOutput(message: string): void {
    this.outputHistory.update((history) => [...history, message]);
  }

  /**
   * Update the elvish sword's glow state based on proximity to the troll.
   * The sword glows when near enemies (the troll in this case).
   * @param currentRoomId The room the player just entered
   */
  private updateSwordGlowState(currentRoomId: string): void {
    // Check if player has the sword in inventory
    const sword = this.gameObjects().get('sword');
    const hasSword = this.playerState().inventory.includes('sword');

    if (!sword || !hasSword) {
      return;
    }

    // Find the troll's location
    const troll = this.gameObjects().get('troll');
    if (!troll || !troll.visible) {
      // If troll doesn't exist or isn't visible, sword shouldn't glow
      this.setSwordGlowIntensity('none');
      return;
    }

    const trollRoomId = troll.location;

    // Determine glow intensity based on proximity
    let newIntensity: 'none' | 'faint' | 'bright' = 'none';

    if (currentRoomId === trollRoomId) {
      // Troll is in the same room - bright glow
      newIntensity = 'bright';
    } else {
      // Check if troll is in an adjacent room
      const currentRoom = this.rooms().get(currentRoomId);
      if (currentRoom?.exits) {
        const adjacentRoomIds = Array.from(currentRoom.exits.values());
        if (adjacentRoomIds.includes(trollRoomId)) {
          // Troll is in adjacent room - faint glow
          newIntensity = 'faint';
        }
      }
    }

    // Update sword glow state and notify player if changed
    this.setSwordGlowIntensity(newIntensity);
  }

  /**
   * Set the sword's glow intensity and display appropriate message if changed.
   */
  private setSwordGlowIntensity(newIntensity: 'none' | 'faint' | 'bright'): void {
    // Get the current sword state
    const sword = this.gameObjects().get('sword');
    if (!sword) {
      return;
    }

    const currentIntensity =
      (sword.properties?.glowIntensity as 'none' | 'faint' | 'bright') || 'none';

    // No change, no message needed
    if (currentIntensity === newIntensity) {
      return;
    }

    // Update the sword's properties
    this.gameObjects.update((objects) => {
      const updated = new Map(objects);
      const currentSword = updated.get('sword');
      if (currentSword) {
        const updatedSword = {
          ...currentSword,
          properties: {
            ...(currentSword.properties || {}),
            isGlowing: newIntensity !== 'none',
            glowIntensity: newIntensity,
          },
        };
        updated.set('sword', updatedSword);
      }
      return updated;
    });

    // Display appropriate message based on new state
    switch (newIntensity) {
      case 'none':
        this.addOutput('Your sword is no longer glowing.');
        break;
      case 'faint':
        this.addOutput('Your sword is glowing with a faint blue glow.');
        break;
      case 'bright':
        this.addOutput('Your sword has begun to glow very brightly.');
        break;
    }
  }

  /**
   * Get an object by its ID.
   * @param objectId The ID of the object
   */
  getObject(objectId: string): GameObject | null {
    return this.gameObjects().get(objectId) || null;
  }

  /**
   * Add a room to the game world.
   * @param room The room to add
   */
  addRoom(room: Room): void {
    this.rooms.update((rooms) => new Map(rooms).set(room.id, room));
  }

  /**
   * Add a game object to the world.
   * @param obj The object to add
   */
  addObject(obj: GameObject): void {
    this.gameObjects.update((objects) => new Map(objects).set(obj.id, obj));
  }

  /**
   * Save the current game state.
   * @returns A JSON string representing the game state
   */
  saveGame(): string {
    // TODO: Implement game state serialization
    return JSON.stringify({
      player: this.playerState(),
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Load a saved game state.
   * @param _saveData The saved game data
   */
  loadGame(_saveData: string): void {
    // TODO: Implement game state deserialization
    // TODO: Validate save data
    // TODO: Restore game state
    this.addOutput('Game loaded.');
  }

  /**
   * Reset the game to its initial state.
   */
  resetGame(): void {
    this.playerState.set({
      currentRoomId: 'west-of-house',
      inventory: [],
      score: 0,
      moveCount: 0,
      isAlive: true,
      flags: new Map(),
    });
    this.outputHistory.set([]);
    this.initializeGame();
  }

  // ===== Command Handlers =====

  /**
   * Handle movement to another room.
   */
  private handleGo(direction: string | null): CommandOutput {
    if (!direction) {
      return { messages: ['Go where?'], success: false, type: 'error' };
    }

    const currentRoom = this.getCurrentRoom();
    if (!currentRoom) {
      return {
        messages: ['You are nowhere. This is a bug.'],
        success: false,
        type: 'error',
      };
    }

    // Normalize direction
    const directionMap: Record<string, Direction> = {
      n: 'north',
      s: 'south',
      e: 'east',
      w: 'west',
      u: 'up',
      d: 'down',
      north: 'north',
      south: 'south',
      east: 'east',
      west: 'west',
      up: 'up',
      down: 'down',
    };

    const normalizedDir = directionMap[direction.toLowerCase()];
    if (!normalizedDir) {
      return {
        messages: [`I don't recognize that direction.`],
        success: false,
        type: 'error',
      };
    }

    const nextRoomId = currentRoom.exits.get(normalizedDir);
    if (!nextRoomId) {
      return {
        messages: ["You can't go that way."],
        success: false,
        type: 'error',
      };
    }

    // Check if there's a conditional exit (e.g., door that must be open, or troll blocking passage)
    if (currentRoom.conditionalExits) {
      const condition = currentRoom.conditionalExits.get(normalizedDir);
      if (condition) {
        const conditionResult = this.checkExitCondition(condition);
        if (!conditionResult.success) {
          return {
            messages: [conditionResult.message],
            success: false,
            type: 'error',
          };
        }
      }
    }

    // Get the destination room before moving
    const nextRoom = this.rooms().get(nextRoomId);
    if (!nextRoom) {
      return {
        messages: ["You can't go that way."],
        success: false,
        type: 'error',
      };
    }

    // Move to the new room
    this.moveToRoom(nextRoomId);

    // Get and return the room description (moveToRoom no longer adds it)
    const updatedRoom = this.rooms().get(nextRoomId);
    if (!updatedRoom) {
      return { messages: [], success: true, type: 'description' };
    }

    const messages = this.getRoomDescription(updatedRoom, !nextRoom.visited);
    return { messages, success: true, type: 'description' };
  }

  /**
   * Handle entering a location or passing through a door object.
   * Based on original Zork V-ENTER and V-THROUGH:
   * - Without object: attempts to go "in" (like a direction)
   * - With object: moves through door objects if they are open
   */
  private handleEnter(objectName: string | null): CommandOutput {
    // Case 1: ENTER without object -> DO-WALK ,P?IN (try to go "in")
    if (!objectName) {
      return this.handleGo('in');
    }

    // Case 2: ENTER OBJECT -> V-THROUGH (go through door if it's a door)
    const obj = this.findObject(objectName);
    if (!obj) {
      return {
        messages: [`You don't see any ${objectName} here.`],
        success: false,
        type: 'error',
      };
    }

    // Check if this is a door object (isDoor property)
    if (!obj.properties?.isDoor) {
      return {
        messages: [`You can't enter the ${obj.name}.`],
        success: false,
        type: 'error',
      };
    }

    // Check if the door is open
    if (obj.properties.isOpen === false) {
      return {
        messages: [`The ${obj.name} is closed.`],
        success: false,
        type: 'error',
      };
    }

    // Find which direction leads through this door by searching conditional exits
    const currentRoom = this.getCurrentRoom();
    if (!currentRoom) {
      return {
        messages: ['You are nowhere. This is a bug.'],
        success: false,
        type: 'error',
      };
    }

    // Generic door traversal: search room's conditional exits for this door object
    if (currentRoom.conditionalExits) {
      for (const [direction, condition] of currentRoom.conditionalExits.entries()) {
        if (condition.type === 'objectOpen' && condition.objectId === obj.id) {
          // Found the direction associated with this door
          return this.handleGo(direction);
        }
      }
    }

    // If no conditional exit found, the door doesn't lead anywhere from this room
    return {
      messages: [`The ${obj.name} doesn't lead anywhere from here.`],
      success: false,
      type: 'error',
    };
  }

  /**
   * Check if an exit condition is satisfied.
   */
  private checkExitCondition(condition: ExitCondition): {
    success: boolean;
    message: string;
  } {
    switch (condition.type) {
      case 'objectOpen': {
        if (!condition.objectId) {
          return { success: false, message: 'Invalid condition configuration.' };
        }
        const obj = this.gameObjects().get(condition.objectId);
        if (!obj) {
          return { success: false, message: 'Invalid condition configuration.' };
        }
        const isOpen = obj.properties?.isOpen ?? false;
        if (!isOpen) {
          return {
            success: false,
            message: condition.failureMessage || `The ${obj.name} is closed.`,
          };
        }
        return { success: true, message: '' };
      }
      case 'objectClosed': {
        if (!condition.objectId) {
          return { success: false, message: 'Invalid condition configuration.' };
        }
        const obj = this.gameObjects().get(condition.objectId);
        if (!obj) {
          return { success: false, message: 'Invalid condition configuration.' };
        }
        const isOpen = obj.properties?.isOpen ?? false;
        if (isOpen) {
          return {
            success: false,
            message: condition.failureMessage || `The ${obj.name} is open.`,
          };
        }
        return { success: true, message: '' };
      }
      case 'hasObject': {
        if (!condition.objectId) {
          return { success: false, message: 'Invalid condition configuration.' };
        }
        const hasObject = this.playerState().inventory.includes(condition.objectId);
        if (!hasObject) {
          return {
            success: false,
            message: condition.failureMessage || 'You need something to proceed.',
          };
        }
        return { success: true, message: '' };
      }
      case 'flag': {
        if (!condition.flag) {
          return { success: false, message: 'Invalid condition configuration.' };
        }
        const flagValue = this.playerState().flags.get(condition.flag) ?? false;
        if (!flagValue) {
          return {
            success: false,
            message: condition.failureMessage || "You can't go that way.",
          };
        }
        return { success: true, message: '' };
      }
      case 'actorState': {
        if (!condition.objectId) {
          return { success: false, message: 'Invalid condition configuration.' };
        }
        const actor = this.gameObjects().get(condition.objectId);
        if (!actor) {
          // If actor doesn't exist, allow passage
          return { success: true, message: '' };
        }
        const actorState = actor.properties?.actorState;
        const requiredState = condition.requiredActorState;

        // Check if condition is met
        const conditionMet = actorState === requiredState;

        // Invert if specified (allow passage when state does NOT match)
        const shouldAllow = condition.invertCondition ? !conditionMet : conditionMet;

        if (!shouldAllow) {
          return {
            success: false,
            message: condition.failureMessage || 'The troll fends you off with a menacing gesture.',
          };
        }
        return { success: true, message: '' };
      }
      default:
        return { success: false, message: "You can't go that way." };
    }
  }

  /**
   * Handle looking around or at something specific.
   */
  private handleLook(target: string | null): CommandOutput {
    if (!target) {
      // Look at the current room
      const room = this.getCurrentRoom();
      if (!room) {
        return {
          messages: ['You are nowhere.'],
          success: false,
          type: 'error',
        };
      }
      const messages = this.getRoomDescription(room, true);
      return { messages, success: true, type: 'description' };
    }

    // Look at a specific object
    return this.handleExamine(target);
  }

  /**
   * Handle examining an object.
   */
  private handleExamine(objectName: string | null): CommandOutput {
    if (!objectName) {
      return { messages: ['Examine what?'], success: false, type: 'error' };
    }

    const obj = this.findObject(objectName);
    if (!obj) {
      return {
        messages: [`You don't see any ${objectName} here.`],
        success: false,
        type: 'error',
      };
    }

    if (!obj.visible) {
      return {
        messages: [`You don't see any ${objectName} here.`],
        success: false,
        type: 'error',
      };
    }

    return { messages: [obj.description], success: true, type: 'description' };
  }

  /**
   * Handle taking an object.
   */
  private handleTake(objectName: string | null): CommandOutput {
    if (!objectName) {
      return { messages: ['Take what?'], success: false, type: 'error' };
    }

    const obj = this.findObject(objectName);
    if (!obj) {
      return {
        messages: [`You don't see any ${objectName} here.`],
        success: false,
        type: 'error',
      };
    }

    if (!obj.visible) {
      return {
        messages: [`You don't see any ${objectName} here.`],
        success: false,
        type: 'error',
      };
    }

    if (!obj.portable) {
      return {
        messages: [`You can't take the ${obj.name}.`],
        success: false,
        type: 'error',
      };
    }

    const currentRoomId = this.playerState().currentRoomId;
    // Check if object is in current room or in an open container in the current room
    const isInCurrentRoom = obj.location === currentRoomId;
    const isInOpenContainer = this.isInOpenContainerInRoom(obj.location, currentRoomId);

    if (!isInCurrentRoom && !isInOpenContainer) {
      return {
        messages: [`The ${obj.name} isn't here.`],
        success: false,
        type: 'error',
      };
    }

    // Update object location to inventory
    this.updateObjectLocation(obj.id, 'inventory');

    // Add to player inventory
    this.playerState.update((state) => ({
      ...state,
      inventory: [...state.inventory, obj.id],
    }));

    return { messages: ['Taken.'], success: true, type: 'success' };
  }

  /**
   * Handle dropping an object.
   */
  private handleDrop(objectName: string | null): CommandOutput {
    if (!objectName) {
      return { messages: ['Drop what?'], success: false, type: 'error' };
    }

    const obj = this.findObjectInInventory(objectName);
    if (!obj) {
      return {
        messages: [`You aren't carrying any ${objectName}.`],
        success: false,
        type: 'error',
      };
    }

    const currentRoomId = this.playerState().currentRoomId;

    // Update object location to current room
    this.updateObjectLocation(obj.id, currentRoomId);

    // Remove from player inventory
    this.playerState.update((state) => ({
      ...state,
      inventory: state.inventory.filter((id) => id !== obj.id),
    }));

    return { messages: ['Dropped.'], success: true, type: 'success' };
  }

  /**
   * Handle showing inventory.
   */
  private handleInventory(): CommandOutput {
    // Return a special output that signals to open the inventory dialog
    return {
      messages: ['Opening inventory...'],
      success: true,
      type: 'system',
      metadata: { isInventoryCommand: true },
    };
  }

  /**
   * Handle status command to show player status.
   */
  private handleStatus(): CommandOutput {
    // Return a special output that signals to open the status dialog
    return {
      messages: ['Opening status...'],
      success: true,
      type: 'system',
      metadata: { isStatusCommand: true },
    };
  }

  /**
   * Handle opening an object.
   */
  private handleOpen(objectName: string | null): CommandOutput {
    if (!objectName) {
      return { messages: ['Open what?'], success: false, type: 'error' };
    }

    const obj = this.findObject(objectName);
    if (!obj) {
      return {
        messages: [`You don't see any ${objectName} here.`],
        success: false,
        type: 'error',
      };
    }

    if (obj.properties?.isOpen === undefined) {
      return {
        messages: [`You can't open the ${obj.name}.`],
        success: false,
        type: 'error',
      };
    }

    if (obj.properties.isLocked) {
      return {
        messages: [`The ${obj.name} is locked.`],
        success: false,
        type: 'error',
      };
    }

    if (obj.properties.isOpen) {
      return {
        messages: [`The ${obj.name} is already open.`],
        success: false,
        type: 'error',
      };
    }

    // Open the object and mark as touched
    this.updateObjectProperty(obj.id, 'isOpen', true);
    this.updateObjectProperty(obj.id, 'touched', true);

    // Special handling for trap door
    if (obj.id === 'trap-door') {
      return {
        messages: [
          'The door reluctantly opens to reveal a rickety staircase descending into darkness.',
        ],
        success: true,
        type: 'success',
      };
    }

    // Get objects inside this container (check both location-based and contains array)
    const contentsById = obj.properties.contains || [];
    const contentsByLocation = Array.from(this.gameObjects().values())
      .filter((item) => item.location === obj.id)
      .map((item) => item.id);

    // Combine both methods of containment
    const allContentIds = [...new Set([...contentsById, ...contentsByLocation])];
    const contents = allContentIds
      .map((id) => this.gameObjects().get(id))
      .filter((item): item is GameObject => item !== undefined);

    // Implement the three cases from original Zork V-OPEN:
    // Case 1: Empty container or transparent container -> "Opened."
    if (contents.length === 0 || obj.properties.transparent) {
      return { messages: ['Opened.'], success: true, type: 'success' };
    }

    // Case 2: Single untouched item with firstDescription
    if (contents.length === 1 && !contents[0].properties?.touched && contents[0].firstDescription) {
      // Mark the item as touched
      this.updateObjectProperty(contents[0].id, 'touched', true);
      return {
        messages: [`The ${obj.name} opens.`, contents[0].firstDescription],
        success: true,
        type: 'success',
      };
    }

    // Case 3: Multiple items or no firstDescription -> "Opening the X reveals Y."
    const itemNames = contents.map((item) => item.name);
    let revealMessage: string;
    if (itemNames.length === 1) {
      revealMessage = `Opening the ${obj.name} reveals ${itemNames[0]}.`;
    } else if (itemNames.length === 2) {
      revealMessage = `Opening the ${obj.name} reveals ${itemNames[0]} and ${itemNames[1]}.`;
    } else {
      const lastItem = itemNames.pop();
      revealMessage = `Opening the ${obj.name} reveals ${itemNames.join(', ')}, and ${lastItem}.`;
    }

    return { messages: [revealMessage], success: true, type: 'success' };
  }

  /**
   * Handle closing an object.
   */
  private handleClose(objectName: string | null): CommandOutput {
    if (!objectName) {
      return { messages: ['Close what?'], success: false, type: 'error' };
    }

    const obj = this.findObject(objectName);
    if (!obj) {
      return {
        messages: [`You don't see any ${objectName} here.`],
        success: false,
        type: 'error',
      };
    }

    if (obj.properties?.isOpen === undefined) {
      return {
        messages: [`You can't close the ${obj.name}.`],
        success: false,
        type: 'error',
      };
    }

    if (!obj.properties.isOpen) {
      return {
        messages: [`The ${obj.name} is already closed.`],
        success: false,
        type: 'error',
      };
    }

    // Close the object
    this.updateObjectProperty(obj.id, 'isOpen', false);

    return {
      messages: [`You close the ${obj.name}.`],
      success: true,
      type: 'success',
    };
  }

  /**
   * Handle unlocking an object.
   */
  private handleUnlock(objectName: string | null, keyName: string | null): CommandOutput {
    if (!objectName) {
      return { messages: ['Unlock what?'], success: false, type: 'error' };
    }

    const obj = this.findObject(objectName);
    if (!obj) {
      return {
        messages: [`You don't see any ${objectName} here.`],
        success: false,
        type: 'error',
      };
    }

    if (obj.properties?.isLocked === undefined) {
      return {
        messages: [`You can't unlock the ${obj.name}.`],
        success: false,
        type: 'error',
      };
    }

    if (!obj.properties.isLocked) {
      return {
        messages: [`The ${obj.name} is already unlocked.`],
        success: false,
        type: 'error',
      };
    }

    // Simple unlock (no key required for now, can be enhanced later)
    if (!keyName) {
      return {
        messages: [`What do you want to unlock the ${obj.name} with?`],
        success: false,
        type: 'error',
      };
    }

    const key = this.findObjectInInventory(keyName);
    if (!key) {
      return {
        messages: [`You don't have any ${keyName}.`],
        success: false,
        type: 'error',
      };
    }

    // Unlock the object
    this.updateObjectProperty(obj.id, 'isLocked', false);

    return {
      messages: [`You unlock the ${obj.name}.`],
      success: true,
      type: 'success',
    };
  }

  /**
   * Handle locking an object.
   */
  private handleLock(objectName: string | null, keyName: string | null): CommandOutput {
    if (!objectName) {
      return { messages: ['Lock what?'], success: false, type: 'error' };
    }

    const obj = this.findObject(objectName);
    if (!obj) {
      return {
        messages: [`You don't see any ${objectName} here.`],
        success: false,
        type: 'error',
      };
    }

    if (obj.properties?.isLocked === undefined) {
      return {
        messages: [`You can't lock the ${obj.name}.`],
        success: false,
        type: 'error',
      };
    }

    if (obj.properties.isLocked) {
      return {
        messages: [`The ${obj.name} is already locked.`],
        success: false,
        type: 'error',
      };
    }

    if (!keyName) {
      return {
        messages: [`What do you want to lock the ${obj.name} with?`],
        success: false,
        type: 'error',
      };
    }

    const key = this.findObjectInInventory(keyName);
    if (!key) {
      return {
        messages: [`You don't have any ${keyName}.`],
        success: false,
        type: 'error',
      };
    }

    // Lock the object
    this.updateObjectProperty(obj.id, 'isLocked', true);

    return {
      messages: [`You lock the ${obj.name}.`],
      success: true,
      type: 'success',
    };
  }

  /**
   * Handle reading an object.
   */
  private handleRead(objectName: string | null): CommandOutput {
    if (!objectName) {
      return { messages: ['Read what?'], success: false, type: 'error' };
    }

    const obj = this.findObject(objectName);
    if (!obj) {
      return {
        messages: [`You don't see any ${objectName} here.`],
        success: false,
        type: 'error',
      };
    }

    if (!obj.visible) {
      return {
        messages: [`You don't see any ${objectName} here.`],
        success: false,
        type: 'error',
      };
    }

    // Check if object has readable text
    const readableText = obj.properties?.['readableText'] as string | undefined;
    if (!readableText) {
      return {
        messages: [`There's nothing to read on the ${obj.name}.`],
        success: false,
        type: 'error',
      };
    }

    return { messages: [readableText], success: true, type: 'description' };
  }

  /**
   * Handle lighting an object.
   */
  private handleLight(objectName: string | null): CommandOutput {
    if (!objectName) {
      return { messages: ['Light what?'], success: false, type: 'error' };
    }

    const obj = this.findObject(objectName);
    if (!obj) {
      return {
        messages: [`You don't see any ${objectName} here.`],
        success: false,
        type: 'error',
      };
    }

    if (!obj.properties?.isLight) {
      return {
        messages: [`You can't light the ${obj.name}.`],
        success: false,
        type: 'error',
      };
    }

    if (obj.properties.isLit) {
      return {
        messages: [`The ${obj.name} is already lit.`],
        success: false,
        type: 'error',
      };
    }

    // Light the object
    this.updateObjectProperty(obj.id, 'isLit', true);

    return {
      messages: [`The ${obj.name} is now on.`],
      success: true,
      type: 'success',
    };
  }

  /**
   * Handle extinguishing a light source.
   */
  private handleExtinguish(objectName: string | null): CommandOutput {
    if (!objectName) {
      return { messages: ['Extinguish what?'], success: false, type: 'error' };
    }

    const obj = this.findObject(objectName);
    if (!obj) {
      return {
        messages: [`You don't see any ${objectName} here.`],
        success: false,
        type: 'error',
      };
    }

    if (!obj.properties?.isLight) {
      return {
        messages: [`You can't extinguish the ${obj.name}.`],
        success: false,
        type: 'error',
      };
    }

    if (!obj.properties.isLit) {
      return {
        messages: [`The ${obj.name} is already off.`],
        success: false,
        type: 'error',
      };
    }

    // Extinguish the object
    this.updateObjectProperty(obj.id, 'isLit', false);

    return {
      messages: [`The ${obj.name} is now off.`],
      success: true,
      type: 'success',
    };
  }

  /**
   * Handle putting an object somewhere.
   */
  private handlePut(objectName: string | null, containerName: string | null): CommandOutput {
    if (!objectName) {
      return { messages: ['Put what?'], success: false, type: 'error' };
    }

    if (!containerName) {
      return {
        messages: [`Put the ${objectName} where?`],
        success: false,
        type: 'error',
      };
    }

    const obj = this.findObjectInInventory(objectName);
    if (!obj) {
      return {
        messages: [`You aren't carrying any ${objectName}.`],
        success: false,
        type: 'error',
      };
    }

    const container = this.findObject(containerName);
    if (!container) {
      return {
        messages: [`You don't see any ${containerName} here.`],
        success: false,
        type: 'error',
      };
    }

    if (container.properties?.contains === undefined) {
      return {
        messages: [`You can't put things in the ${container.name}.`],
        success: false,
        type: 'error',
      };
    }

    if (container.properties.isOpen === false) {
      return {
        messages: [`The ${container.name} is closed.`],
        success: false,
        type: 'error',
      };
    }

    // Remove from inventory
    this.playerState.update((state) => ({
      ...state,
      inventory: state.inventory.filter((id) => id !== obj.id),
    }));

    // Update object location
    this.updateObjectLocation(obj.id, container.id);

    // Add to container
    const newContains = [...(container.properties.contains || []), obj.id];
    this.updateObjectProperty(container.id, 'contains', newContains);

    return {
      messages: [`You put the ${obj.name} in the ${container.name}.`],
      success: true,
      type: 'success',
    };
  }

  /**
   * Handle using an object (generic action).
   */
  private handleUse(objectName: string | null): CommandOutput {
    if (!objectName) {
      return { messages: ['Use what?'], success: false, type: 'error' };
    }

    const obj = this.findObject(objectName);
    if (!obj) {
      return {
        messages: [`You don't see any ${objectName} here.`],
        success: false,
        type: 'error',
      };
    }

    return {
      messages: [`You can't use the ${obj.name} that way.`],
      success: false,
      type: 'error',
    };
  }

  /**
   * Handle attacking something.
   */
  private handleAttack(targetName: string | null, weaponName: string | null): CommandOutput {
    if (!targetName) {
      return { messages: ['Attack what?'], success: false, type: 'error' };
    }

    const target = this.findObject(targetName);
    if (!target) {
      return {
        messages: [`You don't see any ${targetName} here.`],
        success: false,
        type: 'error',
      };
    }

    // Special handling for troll combat
    if (target.id === 'troll' && target.properties?.isActor) {
      return this.handleTrollCombat(weaponName);
    }

    if (weaponName) {
      const weapon = this.findObjectInInventory(weaponName);
      if (!weapon) {
        return {
          messages: [`You don't have any ${weaponName}.`],
          success: false,
          type: 'error',
        };
      }
      return {
        messages: [`Attacking the ${target.name} with the ${weapon.name} has no effect.`],
        success: false,
        type: 'info',
      };
    }

    return {
      messages: [`Attacking the ${target.name} with your bare hands has no effect.`],
      success: false,
      type: 'info',
    };
  }

  /**
   * Handle combat with the troll based on original Zork behavior.
   */
  private handleTrollCombat(weaponName: string | null): CommandOutput {
    const troll = this.gameObjects().get('troll');
    if (!troll) {
      return { messages: ['The troll is not here.'], success: false, type: 'error' };
    }

    // Check troll state
    const trollState = troll.properties?.actorState;
    const trollStrength = troll.properties?.strength || 0;

    // Can't attack unconscious or dead troll
    if (trollState === 'unconscious') {
      return {
        messages: ['The troll is unconscious.'],
        success: false,
        type: 'info',
      };
    }

    if (trollState === 'dead' || trollStrength <= 0) {
      return {
        messages: ['The troll is already dead.'],
        success: false,
        type: 'info',
      };
    }

    // Get weapon if specified
    let weapon: GameObject | null = null;
    if (weaponName) {
      weapon = this.findObjectInInventory(weaponName);
      if (!weapon) {
        return {
          messages: [`You don't have any ${weaponName}.`],
          success: false,
          type: 'error',
        };
      }
    }

    // Simulate combat - random outcome
    const attackRoll = Math.random();
    const messages: string[] = [];

    // Player attacks troll
    if (weapon?.properties?.isWeapon) {
      messages.push(`Attacking the troll with the ${weapon.name}...`);

      if (attackRoll > 0.7) {
        // Good hit - damage troll
        const newStrength = (troll.properties?.strength || 2) - 1;
        this.updateTrollState(newStrength);

        if (newStrength <= 0) {
          messages.push('Your blow knocks the troll unconscious!');
        } else {
          messages.push(`You strike the troll! The troll looks injured.`);
        }
      } else if (attackRoll > 0.3) {
        messages.push('You hit the troll with a glancing blow.');
      } else {
        messages.push('Your blow misses the troll.');
      }
    } else {
      messages.push('Attacking the troll with your bare hands...');
      messages.push('The troll laughs at your puny gesture.');
    }

    // Troll counterattacks if still conscious
    if (trollStrength > 0 && (trollState as string) !== 'unconscious') {
      const trollAttackRoll = Math.random();
      if (trollAttackRoll > 0.6) {
        messages.push('The troll swings his axe, but it misses.');
      } else if (trollAttackRoll > 0.3) {
        messages.push("The troll's axe barely misses your ear.");
      } else {
        messages.push(
          'The troll swings.  The blade turns on your armor but crashes broadside into your head.'
        );
      }
    }

    return {
      messages,
      success: true,
      type: 'info',
    };
  }

  /**
   * Update troll's state based on strength.
   */
  private updateTrollState(newStrength: number): void {
    this.gameObjects.update((objects) => {
      const troll = objects.get('troll');
      if (!troll) return objects;

      const updated = new Map(objects);
      let newState: 'armed' | 'disarmed' | 'unconscious' | 'dead' = 'armed';
      let newDescription = troll.description;

      if (newStrength <= 0) {
        // Troll is unconscious
        newState = 'unconscious';
        newDescription =
          'An unconscious troll is sprawled on the floor. All passages out of the room are open.';

        // Drop axe if troll had it
        const axe = objects.get('axe');
        if (axe && axe.location === 'troll') {
          const droppedAxe = { ...axe, location: 'troll-room' };
          updated.set('axe', droppedAxe);
        }
      }

      const updatedTroll = {
        ...troll,
        description: newDescription,
        properties: {
          ...troll.properties,
          strength: newStrength,
          actorState: newState,
          isFighting: newStrength > 0,
          blocksPassage: newStrength > 0,
        },
      };

      updated.set('troll', updatedTroll);
      return updated;
    });
  }

  /**
   * Handle pushing/moving an object.
   */
  private handlePush(objectName: string | null): CommandOutput {
    if (!objectName) {
      return { messages: ['Push what?'], success: false, type: 'error' };
    }

    const obj = this.findObject(objectName);
    if (!obj) {
      return {
        messages: [`You don't see any ${objectName} here.`],
        success: false,
        type: 'error',
      };
    }

    // Special handling for the rug/carpet in living room
    if (obj.id === 'rug' && this.playerState().currentRoomId === 'living-room') {
      // Find the trap door
      const trapDoor = this.gameObjects().get('trap-door');
      if (trapDoor && !trapDoor.visible) {
        // Make trap door visible
        trapDoor.visible = true;
        this.gameObjects().set('trap-door', trapDoor);

        return {
          messages: [
            'With a great effort, the rug is moved to one side of the room, revealing the dusty cover of a closed trap door.',
          ],
          success: true,
          type: 'info',
        };
      } else if (trapDoor && trapDoor.visible) {
        return {
          messages: ['The rug has already been moved.'],
          success: false,
          type: 'info',
        };
      }
    }

    // Default behavior for other objects
    if (obj.portable) {
      return {
        messages: [`You can take the ${obj.name} if you want to move it.`],
        success: false,
        type: 'info',
      };
    }

    return {
      messages: [`The ${obj.name} is too heavy to move.`],
      success: false,
      type: 'info',
    };
  }

  /**
   * Handle help command.
   */
  private handleHelp(): CommandOutput {
    const messages = [
      'Available commands:',
      '',
      'Navigation:',
      '  north, south, east, west, up, down (or n, s, e, w, u, d)',
      '  look - Look around the current room',
      '  examine [object] - Examine something closely',
      '',
      'Inventory:',
      '  take [object] - Pick up an object',
      '  drop [object] - Drop an object',
      '  inventory (or i) - Open inventory dialog',
      '',
      'Objects:',
      '  open [object] - Open something',
      '  close [object] - Close something',
      '  unlock [object] with [key] - Unlock something',
      '  lock [object] with [key] - Lock something',
      '  read [object] - Read something',
      '  light [object] - Light a light source',
      '  extinguish [object] - Put out a light',
      '  put [object] in [container] - Put something in a container',
      '',
      'System:',
      '  help - Show this help message',
      '  status - Open status dialog',
      '  map - Open visual map of explored world',
      '  save - Save the game',
      '  load - Load a saved game',
      '  quit - Quit the game',
      '',
      'Keyboard Shortcuts:',
      '  Ctrl+M (Cmd+M on Mac) - Toggle visual world map',
      '  Ctrl+I (Cmd+I on Mac) - Toggle inventory dialog',
      '  Ctrl+Shift+S (Cmd+Shift+S on Mac) - Toggle status dialog',
    ];

    return { messages, success: true, type: 'help' };
  }

  /**
   * Handle map/location command to show location details with ASCII art.
   */
  private handleMap(): CommandOutput {
    // Return a special output that signals to open the visual map
    return {
      messages: ['Opening world map...'],
      success: true,
      type: 'system',
      metadata: { isMapCommand: true },
    };
  }

  /**
   * Handle save command.
   */
  private handleSave(): CommandOutput {
    try {
      const saveData = this.saveGame();
      // In a real implementation, this would interact with localStorage
      // For now, just confirm the save
      return {
        messages: ['Game saved successfully.'],
        success: true,
        type: 'system',
        metadata: { saveData },
      };
    } catch {
      return {
        messages: ['Failed to save game.'],
        success: false,
        type: 'error',
      };
    }
  }

  /**
   * Handle load command.
   */
  private handleLoad(): CommandOutput {
    // In a real implementation, this would interact with localStorage
    return {
      messages: ['Load functionality not yet implemented.'],
      success: false,
      type: 'system',
    };
  }

  /**
   * Handle quit command.
   */
  private handleQuit(): CommandOutput {
    return {
      messages: ['Thanks for playing!'],
      success: true,
      type: 'system',
      metadata: { action: 'quit' },
    };
  }

  // ===== Helper Methods =====

  /**
   * Resolve an object name using the ObjectResolverService with fuzzy matching and disambiguation.
   * @param name The object name to resolve
   * @param allowInventoryOnly If true, only search inventory (for commands like drop)
   * @returns The resolved object or null if not found/ambiguous
   */
  private resolveObject(name: string, allowInventoryOnly = false): GameObject | null {
    const currentRoomId = this.playerState().currentRoomId;
    const inventory = this.playerState().inventory;

    // Build context for resolution
    const roomObjects = Array.from(this.gameObjects().values()).filter(
      (obj) => obj.location === currentRoomId && obj.visible
    );

    // Also include objects in open containers in the current room
    const objectsInOpenContainers = Array.from(this.gameObjects().values()).filter((obj) => {
      return obj.visible && this.isInOpenContainerInRoom(obj.location, currentRoomId);
    });

    const allAccessibleRoomObjects = [...roomObjects, ...objectsInOpenContainers];

    const inventoryObjects = inventory
      .map((id) => this.gameObjects().get(id))
      .filter((obj): obj is GameObject => obj !== undefined);

    const context: ResolutionContext = {
      roomObjects: allowInventoryOnly ? [] : allAccessibleRoomObjects,
      inventoryObjects,
      allObjects: Array.from(this.gameObjects().values()),
    };

    // Use object resolver
    const result = this.objectResolver.resolve(name, context);

    // Handle disambiguation
    if (result.needsDisambiguation && result.candidates.length > 0) {
      this.telemetry.logDisambiguationShown({
        input: name,
        candidates: result.candidates.map((c) => c.displayName),
      });
      // For now, return null and let the caller handle it
      // In the future, we could prompt the player to choose
      return null;
    }

    if (result.isResolved && result.resolvedObject) {
      if (result.fuzzyMatch) {
        this.telemetry.logFuzzyMatch({
          input: name,
          matched: result.resolvedObject.name,
          score: result.fuzzyMatch.score,
        });
      }
      return result.resolvedObject;
    }

    return null;
  }

  /**
   * Find an object by name or alias in the current room or inventory.
   * First tries exact matching, then falls back to fuzzy matching via ObjectResolver.
   */
  private findObject(name: string): GameObject | null {
    const lowerName = name.toLowerCase();
    const currentRoomId = this.playerState().currentRoomId;
    const inventory = this.playerState().inventory;

    // Search in current room and inventory with exact matching
    for (const obj of this.gameObjects().values()) {
      const nameMatch = obj.name.toLowerCase() === lowerName;
      const aliasMatch = obj.aliases?.some((alias) => alias.toLowerCase() === lowerName) ?? false;

      if (nameMatch || aliasMatch) {
        // Check if object is in current room or inventory
        if (obj.location === currentRoomId || inventory.includes(obj.id)) {
          return obj;
        }

        // Also check if object is inside an open container in the current room
        if (this.isInOpenContainerInRoom(obj.location, currentRoomId)) {
          return obj;
        }
      }
    }

    // Fall back to fuzzy matching via ObjectResolver
    return this.resolveObject(name, false);
  }

  /**
   * Find an object in the player's inventory.
   * First tries exact matching, then falls back to fuzzy matching via ObjectResolver.
   */
  private findObjectInInventory(name: string): GameObject | null {
    const lowerName = name.toLowerCase();
    const inventory = this.playerState().inventory;

    // Try exact match first
    for (const objId of inventory) {
      const obj = this.gameObjects().get(objId);
      if (!obj) continue;

      const nameMatch = obj.name.toLowerCase() === lowerName;
      const aliasMatch = obj.aliases?.some((alias) => alias.toLowerCase() === lowerName) ?? false;

      if (nameMatch || aliasMatch) {
        return obj;
      }
    }

    // Fall back to fuzzy matching via ObjectResolver (inventory only)
    return this.resolveObject(name, true);
  }

  /**
   * Update an object's location.
   */
  private updateObjectLocation(objectId: string, newLocation: string): void {
    this.gameObjects.update((objects) => {
      const obj = objects.get(objectId);
      if (obj) {
        const updatedObj = { ...obj, location: newLocation };
        return new Map(objects).set(objectId, updatedObj);
      }
      return objects;
    });
  }

  /**
   * Update a specific property of an object.
   */
  private updateObjectProperty(objectId: string, property: string, value: unknown): void {
    this.gameObjects.update((objects) => {
      const obj = objects.get(objectId);
      if (obj) {
        const updatedObj = {
          ...obj,
          properties: {
            ...obj.properties,
            [property]: value,
          },
        };
        return new Map(objects).set(objectId, updatedObj);
      }
      return objects;
    });
  }

  /**
   * Check if an object is in an open container in the specified room.
   */
  private isInOpenContainerInRoom(objectLocation: string, roomId: string): boolean {
    const container = this.gameObjects().get(objectLocation);
    return !!container && container.location === roomId && container.properties?.isOpen === true;
  }

  /**
   * Get room description with objects and exits.
   */
  private getRoomDescription(room: Room, fullDescription: boolean): string[] {
    const messages: string[] = [];

    messages.push(room.name);

    // Use full description on first visit or when explicitly looking
    if (fullDescription || !room.visited) {
      messages.push(room.description);
    } else if (room.shortDescription) {
      messages.push(room.shortDescription);
    } else {
      messages.push(room.description);
    }

    // List visible objects in the room using their long descriptions
    // Include portable objects and actors (like troll)
    // Fixed/scenery objects are typically mentioned in the room description itself
    const roomObjects = Array.from(this.gameObjects().values()).filter(
      (obj) => obj.location === room.id && obj.visible && (obj.portable || obj.properties?.isActor)
    );

    if (roomObjects.length > 0) {
      roomObjects.forEach((obj) => {
        messages.push(obj.description);
      });
    }

    return messages;
  }

  /**
   * Disambiguation and autocorrect UI integration
   */

  /** Callback for disambiguation requests */
  private disambiguationCallback:
    | ((candidates: ObjectCandidate[], prompt: string) => Promise<ObjectCandidate | null>)
    | null = null;

  /** Callback for autocorrect confirmation requests */
  private autocorrectCallback:
    | ((originalInput: string, suggestion: string, confidence: number) => Promise<boolean>)
    | null = null;

  /**
   * Set the callback function for handling disambiguation requests.
   * This should be called by the UI layer to provide a way to prompt the user.
   *
   * @param callback Function that shows disambiguation UI and returns user selection
   */
  setDisambiguationCallback(
    callback: (candidates: ObjectCandidate[], prompt: string) => Promise<ObjectCandidate | null>
  ): void {
    this.disambiguationCallback = callback;
  }

  /**
   * Set the callback function for handling autocorrect confirmation requests.
   * This should be called by the UI layer to provide a way to prompt the user.
   *
   * @param callback Function that shows autocorrect UI and returns user decision
   */
  setAutocorrectCallback(
    callback: (originalInput: string, suggestion: string, confidence: number) => Promise<boolean>
  ): void {
    this.autocorrectCallback = callback;
  }

  /**
   * Request disambiguation from the user when multiple object candidates match.
   * This method should be called by the parser when it encounters ambiguous input.
   *
   * @param candidates List of candidate objects to choose from
   * @param prompt Custom prompt text (optional)
   * @returns Promise that resolves to the selected candidate or null if cancelled
   */
  async requestDisambiguation(
    candidates: ObjectCandidate[],
    prompt?: string
  ): Promise<ObjectCandidate | null> {
    const promptText = prompt || 'Which one do you mean?';

    // Log disambiguation event
    this.telemetry.logDisambiguationShown({
      input: promptText,
      candidates: candidates.map((c) => c.displayName),
    });

    // If no callback is set, return the first candidate (fallback)
    if (!this.disambiguationCallback) {
      return candidates.length > 0 ? candidates[0] : null;
    }

    // Call the UI callback and wait for user selection
    const selected = await this.disambiguationCallback(candidates, promptText);

    // Log user's selection
    if (selected) {
      const selectedIndex = candidates.findIndex((c) => c.id === selected.id);
      this.telemetry.logDisambiguationSelected({
        input: promptText,
        candidates: candidates.map((c) => c.displayName),
        selectedIndex,
      });
    }

    return selected;
  }

  /**
   * Request autocorrect confirmation from the user when a fuzzy match is found.
   * This method should be called by the parser when it detects a likely typo.
   *
   * @param originalInput The original input text with potential typo
   * @param suggestion The suggested correction
   * @param confidence Confidence score (0-1) of the suggestion
   * @returns Promise that resolves to true if accepted, false if rejected
   */
  async requestAutocorrectConfirmation(
    originalInput: string,
    suggestion: string,
    confidence: number
  ): Promise<boolean> {
    // Log autocorrect suggestion
    this.telemetry.logAutocorrectSuggestion(originalInput, suggestion, confidence);

    // If no callback is set, auto-accept high-confidence suggestions
    if (!this.autocorrectCallback) {
      const accepted = confidence >= 0.85;
      if (accepted) {
        this.telemetry.logAutocorrectAccepted(originalInput, suggestion);
      }
      return accepted;
    }

    // Call the UI callback and wait for user decision
    const accepted = await this.autocorrectCallback(originalInput, suggestion, confidence);

    // Log user's decision
    if (accepted) {
      this.telemetry.logAutocorrectAccepted(originalInput, suggestion);
    }

    return accepted;
  }
}
