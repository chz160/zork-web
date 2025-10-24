import { Injectable, signal, inject } from '@angular/core';
import { Player, Room, GameObject, ParserResult, CommandOutput, Direction } from '../models';
import { DataLoaderService } from './data-loader.service';

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
      case 'help':
        output = this.handleHelp();
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
    return output;
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

    // Display room description
    const messages = this.getRoomDescription(updatedRoom, !room.visited);
    messages.forEach((msg) => this.addOutput(msg));
  }

  /**
   * Add a message to the output history.
   * @param message The message to add
   */
  private addOutput(message: string): void {
    this.outputHistory.update((history) => [...history, message]);
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

    this.moveToRoom(nextRoomId);
    return { messages: [], success: true, type: 'description' };
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
    if (obj.location !== currentRoomId) {
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
    const inventory = this.playerState().inventory;

    if (inventory.length === 0) {
      return {
        messages: ['You are empty-handed.'],
        success: true,
        type: 'inventory',
      };
    }

    const items = inventory
      .map((id) => this.gameObjects().get(id))
      .filter((obj): obj is GameObject => obj !== undefined)
      .map((obj) => obj.name);

    const messages = ['You are carrying:', ...items.map((name) => `  ${name}`)];

    return { messages, success: true, type: 'inventory' };
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

    // Open the object
    this.updateObjectProperty(obj.id, 'isOpen', true);

    const messages = [`You open the ${obj.name}.`];

    // If object contains items, reveal them
    if (obj.properties.contains && obj.properties.contains.length > 0) {
      const contents = obj.properties.contains
        .map((id) => this.gameObjects().get(id))
        .filter((item): item is GameObject => item !== undefined)
        .map((item) => item.name);

      if (contents.length > 0) {
        messages.push(`The ${obj.name} contains:`);
        messages.push(...contents.map((name) => `  ${name}`));
      }
    }

    return { messages, success: true, type: 'success' };
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
      '  inventory (or i) - Check what you are carrying',
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
      '  save - Save the game',
      '  load - Load a saved game',
      '  quit - Quit the game',
    ];

    return { messages, success: true, type: 'help' };
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
   * Find an object by name or alias in the current room or inventory.
   */
  private findObject(name: string): GameObject | null {
    const lowerName = name.toLowerCase();
    const currentRoomId = this.playerState().currentRoomId;
    const inventory = this.playerState().inventory;

    // Search in current room and inventory
    for (const obj of this.gameObjects().values()) {
      const nameMatch = obj.name.toLowerCase() === lowerName;
      const aliasMatch = obj.aliases.some((alias) => alias.toLowerCase() === lowerName);

      if (nameMatch || aliasMatch) {
        // Check if object is in current room or inventory
        if (obj.location === currentRoomId || inventory.includes(obj.id)) {
          return obj;
        }
      }
    }

    return null;
  }

  /**
   * Find an object in the player's inventory.
   */
  private findObjectInInventory(name: string): GameObject | null {
    const lowerName = name.toLowerCase();
    const inventory = this.playerState().inventory;

    for (const objId of inventory) {
      const obj = this.gameObjects().get(objId);
      if (!obj) continue;

      const nameMatch = obj.name.toLowerCase() === lowerName;
      const aliasMatch = obj.aliases.some((alias) => alias.toLowerCase() === lowerName);

      if (nameMatch || aliasMatch) {
        return obj;
      }
    }

    return null;
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

    // List visible objects in the room
    const roomObjects = Array.from(this.gameObjects().values()).filter(
      (obj) => obj.location === room.id && obj.visible
    );

    if (roomObjects.length > 0) {
      messages.push('');
      messages.push('You can see:');
      roomObjects.forEach((obj) => {
        messages.push(`  ${obj.name}`);
      });
    }

    // List exits
    if (room.exits.size > 0) {
      messages.push('');
      const exitList = Array.from(room.exits.keys()).join(', ');
      messages.push(`Exits: ${exitList}`);
    }

    return messages;
  }
}
