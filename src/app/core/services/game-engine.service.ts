import { Injectable, signal } from '@angular/core';
import { Player, Room, GameObject, ParserResult } from '../models';

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
  /** Current player state */
  private readonly playerState = signal<Player>({
    currentRoomId: 'start',
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
   */
  initializeGame(): void {
    // TODO: Load initial game data (rooms, objects)
    // TODO: Set up starting room
    // TODO: Display welcome message
    this.addOutput('Welcome to Zork!');
    this.addOutput('Zork is a game of adventure, danger, and low cunning.');
    this.addOutput('');
  }

  /**
   * Process a parsed command and execute the corresponding action.
   * @param parserResult The parsed command from the player
   */
  executeCommand(parserResult: ParserResult): void {
    if (!parserResult.isValid || !parserResult.verb) {
      this.addOutput(parserResult.errorMessage || "I don't understand that command.");
      return;
    }

    // TODO: Implement verb dispatch and execution
    // TODO: Update game state based on action
    // TODO: Generate appropriate response
    this.addOutput(`Command received: ${parserResult.verb}`);
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

    // Mark room as visited
    room.visited = true;
    this.currentRoom.set(room);

    // Display room description
    this.describeRoom(room);
  }

  /**
   * Display the description of a room.
   * @param room The room to describe
   */
  private describeRoom(room: Room): void {
    const description = room.visited ? room.shortDescription || room.description : room.description;
    this.addOutput(room.name);
    this.addOutput(description);

    // TODO: List visible objects in the room
    // TODO: List available exits
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
      currentRoomId: 'start',
      inventory: [],
      score: 0,
      moveCount: 0,
      isAlive: true,
      flags: new Map(),
    });
    this.outputHistory.set([]);
    this.initializeGame();
  }
}
