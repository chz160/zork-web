import { Injectable, inject, effect } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { GameEngineService } from './game-engine.service';
import { CommandParserService } from './command-parser.service';
import { Player, Room, CommandOutput } from '../models';

/**
 * GameService provides a reactive bridge between UI components and the GameEngine.
 * It wraps GameEngineService with RxJS observables for real-time state updates.
 *
 * This service implements a facade pattern, exposing observables for reactive UI updates
 * while delegating core game logic to GameEngineService.
 *
 * Key Features:
 * - RxJS observables for reactive state management
 * - Command submission with parsed command handling
 * - Real-time output streaming
 * - Player state updates via observables
 * - Room state updates via observables
 *
 * Usage Example:
 * ```typescript
 * constructor(private gameService: GameService) {}
 *
 * ngOnInit() {
 *   // Subscribe to game output
 *   this.gameService.output$.subscribe(messages => {
 *     console.log('New output:', messages);
 *   });
 *
 *   // Subscribe to player state
 *   this.gameService.player$.subscribe(player => {
 *     console.log('Player location:', player.currentRoomId);
 *   });
 *
 *   // Initialize the game
 *   this.gameService.initializeGame();
 * }
 *
 * onCommand(input: string) {
 *   this.gameService.submitCommand(input);
 * }
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class GameService {
  private readonly gameEngine = inject(GameEngineService);
  private readonly commandParser = inject(CommandParserService);

  // Subjects for emitting state changes
  private readonly outputSubject = new BehaviorSubject<string[]>([]);
  private readonly playerSubject = new BehaviorSubject<Player | null>(null);
  private readonly currentRoomSubject = new BehaviorSubject<Room | null>(null);
  private readonly commandOutputSubject = new Subject<CommandOutput>();

  // Public observables for UI components to subscribe to
  /** Stream of all game output messages */
  readonly output$: Observable<string[]> = this.outputSubject.asObservable();

  /** Stream of player state updates */
  readonly player$: Observable<Player | null> = this.playerSubject.asObservable();

  /** Stream of current room updates */
  readonly currentRoom$: Observable<Room | null> = this.currentRoomSubject.asObservable();

  /** Stream of command execution results */
  readonly commandOutput$: Observable<CommandOutput> = this.commandOutputSubject.asObservable();

  constructor() {
    // Set up effects to bridge signals to observables
    this.setupSignalToObservableBridge();
  }

  /**
   * Initialize the game and start streaming state updates.
   */
  initializeGame(): void {
    this.gameEngine.initializeGame();

    // Emit initial state
    this.emitCurrentState();
  }

  /**
   * Reset the game to initial state.
   */
  resetGame(): void {
    this.gameEngine.resetGame();
    this.emitCurrentState();
  }

  /**
   * Submit a command for execution.
   * The command is parsed and executed, with results streamed via observables.
   *
   * @param input Raw command string from the player
   */
  submitCommand(input: string): void {
    // Parse the command
    const parserResult = this.commandParser.parse(input);

    // Execute through the engine
    const output = this.gameEngine.executeCommand(parserResult);

    // Emit the command output
    this.commandOutputSubject.next(output);

    // Emit updated state
    this.emitCurrentState();
  }

  /**
   * Get the current player state as an observable.
   * Note: Also available via player$ observable for reactive updates.
   */
  getPlayer(): Observable<Player | null> {
    return this.player$;
  }

  /**
   * Get the current room as an observable.
   * Note: Also available via currentRoom$ observable for reactive updates.
   */
  getCurrentRoom(): Observable<Room | null> {
    return this.currentRoom$;
  }

  /**
   * Get all game output as an observable.
   * Note: Also available via output$ observable for reactive updates.
   */
  getOutput(): Observable<string[]> {
    return this.output$;
  }

  /**
   * Bridge Angular signals to RxJS observables.
   * This allows UI components to use RxJS operators for reactive updates.
   */
  private setupSignalToObservableBridge(): void {
    // Bridge output signal to observable
    effect(() => {
      const output = this.gameEngine.output();
      this.outputSubject.next(output);
    });

    // Bridge player signal to observable
    effect(() => {
      const player = this.gameEngine.player();
      this.playerSubject.next(player);
    });

    // Bridge current room signal to observable
    effect(() => {
      const room = this.gameEngine.currentRoom();
      this.currentRoomSubject.next(room);
    });
  }

  /**
   * Emit the current state to all observables.
   */
  private emitCurrentState(): void {
    this.outputSubject.next(this.gameEngine.output());
    this.playerSubject.next(this.gameEngine.player());
    this.currentRoomSubject.next(this.gameEngine.currentRoom());
  }
}
