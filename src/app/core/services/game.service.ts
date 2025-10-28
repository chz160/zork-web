import { Injectable, inject, effect } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { GameEngineService } from './game-engine.service';
import { CommandParserService } from './command-parser.service';
import { TelemetryService } from './telemetry.service';
import { Player, Room, CommandOutput } from '../models';
import { splitCommands } from '../utils/multi-command-splitter';
import { CommandConfigService } from './command-config.service';

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
  private readonly telemetry = inject(TelemetryService);
  private readonly configService = inject(CommandConfigService);

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
   * Supports multi-command inputs (e.g., "open mailbox and take leaflet").
   *
   * @param input Raw command string from the player
   */
  async submitCommand(input: string): Promise<void> {
    // Check if this is a multi-command input
    const settings = this.configService.getSettings();
    const multiCommandResult = splitCommands(input, settings.multiCommandSeparators);

    if (multiCommandResult.isMultiCommand) {
      // Log multi-command execution
      this.telemetry.logMultiCommand({
        rawInput: input,
        commandCount: multiCommandResult.commands.length,
        policy: settings.multiCommandPolicy as 'fail-fast' | 'best-effort',
      });

      // Parse all sub-commands
      const parsedCommands = multiCommandResult.commands.map((cmd) =>
        this.commandParser.parse(cmd)
      );

      // Execute through the dispatcher (which handles state propagation, policies, etc.)
      const report = await this.gameEngine.executeParsedCommands(parsedCommands, {
        policy: settings.multiCommandPolicy === 'fail-fast' ? 'fail-early' : 'best-effort',
      });

      // Emit each command's output
      report.results.forEach((result) => {
        this.commandOutputSubject.next(result.output);
      });

      // State updates are automatically emitted via signal-to-observable bridge effects
    } else {
      // Single command - execute as before
      const parserResult = this.commandParser.parse(input);
      const output = this.gameEngine.executeCommand(parserResult);
      this.commandOutputSubject.next(output);
      // State updates are automatically emitted via signal-to-observable bridge effects
    }
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
   * Used only during initialization to ensure initial state is properly emitted.
   */
  private emitCurrentState(): void {
    this.outputSubject.next(this.gameEngine.output());
    this.playerSubject.next(this.gameEngine.player());
    this.currentRoomSubject.next(this.gameEngine.currentRoom());
  }
}
