import { BaseActor } from './actor.model';
import { MessageService } from '../services/message.service';

/**
 * Modes for the thief actor's state machine.
 * Based on legacy ROBBER-FUNCTION modes (F-DEAD, F-UNCONSCIOUS, F-CONSCIOUS, F-BUSY)
 */
export enum ThiefMode {
  /** Thief is conscious and active */
  CONSCIOUS = 'CONSCIOUS',
  /** Thief is unconscious (strength < 0) */
  UNCONSCIOUS = 'UNCONSCIOUS',
  /** Thief is dead (strength === 0) */
  DEAD = 'DEAD',
  /** Thief is busy (used for special behaviors) */
  BUSY = 'BUSY',
}

/**
 * Combat message category types for thief melee attacks.
 * Maps to THIEF-MELEE table categories from legacy code.
 */
export enum ThiefCombatMessageType {
  MISS = 'THIEF_MELEE_MISS',
  UNCONSCIOUS = 'THIEF_MELEE_UNCONSCIOUS',
  KILL = 'THIEF_MELEE_KILL',
  LIGHT_WOUND = 'THIEF_MELEE_LIGHT_WOUND',
  SERIOUS_WOUND = 'THIEF_MELEE_SERIOUS_WOUND',
  STAGGER = 'THIEF_MELEE_STAGGER',
  DISARM = 'THIEF_MELEE_DISARM',
  PAUSE = 'THIEF_MELEE_PAUSE',
  FINAL_BLOW = 'THIEF_MELEE_FINAL_BLOW',
}

/**
 * The THIEF actor - a wandering robber who steals treasures.
 * Based on legacy OBJECT THIEF and ROBBER-FUNCTION from 1dungeon.zil and 1actions.zil.
 *
 * Behavior:
 * - Wanders between rooms on ticks (I-THIEF interrupt)
 * - Steals valuable items from player and rooms
 * - Drops worthless items
 * - Accepts gifts from player (becomes engrossed if valuable)
 * - Recovers stiletto when dropped
 * - Deposits stolen treasures in treasure room
 * - Has conscious/unconscious/dead states
 */
export class ThiefActor extends BaseActor {
  /** Current mode/state of the thief */
  private mode: ThiefMode = ThiefMode.CONSCIOUS;

  /** Whether thief is engrossed in admiring a valuable gift */
  private engrossed = false;

  /** ID of the stiletto weapon */
  private readonly stilettoId = 'stiletto';

  /** ID of the large bag container */
  private readonly largeBagId = 'large-bag';

  /** ID of the treasure room where loot is deposited */
  private readonly treasureRoomId = 'treasure-room';

  /** Optional message service for generating flavor text */
  private messageService?: MessageService;

  constructor(messageService?: MessageService) {
    super('thief', 'thief', {
      locationId: 'round-room',
      inventory: [],
      tickEnabled: true,
    });

    // Initialize strength flag (legacy P?STRENGTH)
    this.flags.set('strength', 5);
    this.flags.set('maxStrength', 5);
    this.flags.set('fighting', false);
    this.messageService = messageService;
  }

  /**
   * Get the current mode of the thief.
   */
  getMode(): ThiefMode {
    return this.mode;
  }

  /**
   * Set the thief's mode.
   */
  setMode(mode: ThiefMode): void {
    this.mode = mode;
  }

  /**
   * Check if thief is engrossed in admiring a gift.
   */
  isEngrossed(): boolean {
    return this.engrossed;
  }

  /**
   * Set the engrossed state.
   */
  setEngrossed(engrossed: boolean): void {
    this.engrossed = engrossed;
  }

  /**
   * Called each game tick when tickEnabled is true.
   * Implements the I-THIEF interrupt logic from legacy code.
   *
   * Behavior:
   * 1. If in treasure room and not visible, deposit treasures
   * 2. If in same room as player, handle encounter (THIEF-VS-ADVENTURER)
   * 3. Otherwise, steal from room and move to next room
   * 4. Drop worthless items
   * 5. Recover stiletto if on ground
   */
  override onTick(): void {
    // TODO: Implement tick logic
    // This will require access to game state, room data, and player position
    // Implementation will be added after basic structure is in place
  }

  /**
   * Called when the player enters the same room as this actor.
   * Implements THIEF-VS-ADVENTURER encounter logic from legacy code.
   *
   * @param _playerRoomId The room ID where the encounter occurred
   */
  override onEncounter(_playerRoomId: string): void {
    // TODO: Implement encounter logic
    // This will handle appearing/disappearing, stealing, and combat
  }

  /**
   * Called when this actor is killed/dies.
   * Implements F-DEAD mode from ROBBER-FUNCTION.
   *
   * Behavior:
   * - Disable ticking
   * - Set mode to DEAD
   *
   * Note: The actual depositBooty operation should be called separately by the
   * system that has access to the items map (e.g., GameEngine or CombatService).
   */
  override onDeath(): void {
    this.mode = ThiefMode.DEAD;
    this.tickEnabled = false;
  }

  /**
   * Called when this actor takes damage.
   * Handles transitions to unconscious and dead states.
   *
   * @param amount Amount of damage taken
   */
  override onDamage(amount: number): void {
    const currentStrength = this.flags.get('strength') as number;
    const newStrength = currentStrength - amount;

    // Clamp strength to minimum of -1 to prevent it from becoming increasingly negative
    // when taking damage while unconscious. Legacy behavior treats all negative values
    // as unconscious, so there's no need to track how negative it gets.
    const clampedStrength = Math.max(newStrength, -1);
    this.flags.set('strength', clampedStrength);

    if (clampedStrength === 0) {
      // Dead (strength === 0)
      this.onDeath();
    } else if (clampedStrength < 0) {
      // Unconscious (strength < 0)
      // Only transition if not already unconscious to avoid redundant state changes
      if (this.mode !== ThiefMode.UNCONSCIOUS) {
        this.mode = ThiefMode.UNCONSCIOUS;
        this.tickEnabled = false;
        this.flags.set('fighting', false);

        // TODO: Drop stiletto in current location
      }
    }
  }

  /**
   * Called when thief regains consciousness.
   * Implements F-CONSCIOUS mode from ROBBER-FUNCTION.
   */
  onConscious(): void {
    this.mode = ThiefMode.CONSCIOUS;
    this.tickEnabled = true;
    this.flags.set('fighting', true);

    // TODO: Recover stiletto from ground if present
  }

  /**
   * Accept a gift from the player.
   * Based on GIVE/THROW verb handling in ROBBER-FUNCTION.
   *
   * @param itemId The ID of the item being given
   * @param itemValue The treasure value of the item (TVALUE)
   * @throws Error if itemId is empty or itemValue is negative
   */
  acceptGift(itemId: string, itemValue: number): void {
    if (!itemId || itemId.trim() === '') {
      throw new Error('Item ID cannot be empty');
    }
    if (itemValue < 0) {
      throw new Error('Item value cannot be negative');
    }

    // Move item to thief's inventory
    this.inventory.push(itemId);

    // If item is valuable, thief becomes engrossed
    if (itemValue > 0) {
      this.engrossed = true;
    }

    // TODO: Return appropriate message based on item type and value
  }

  /**
   * Check if thief has the stiletto.
   */
  hasStilettoInInventory(): boolean {
    return this.inventory.includes(this.stilettoId);
  }

  /**
   * Check if thief is in the treasure room.
   */
  isInTreasureRoom(): boolean {
    return this.locationId === this.treasureRoomId;
  }

  /**
   * Get the treasure room ID.
   */
  getTreasureRoomId(): string {
    return this.treasureRoomId;
  }

  /**
   * Get a combat message for the thief's attack.
   * Uses MessageService if available, otherwise returns a default message.
   *
   * @param messageType The type of combat message to retrieve
   * @param replacements Optional template replacements (e.g., {weapon: 'sword'})
   * @returns A combat message string
   */
  getCombatMessage(
    messageType: ThiefCombatMessageType,
    replacements?: Record<string, string>
  ): string {
    if (this.messageService) {
      const message = this.messageService.getRandomMessage('thief', messageType, replacements);
      if (message) {
        return message;
      }
    }

    // Fallback messages if MessageService not available or message not found
    switch (messageType) {
      case ThiefCombatMessageType.MISS:
        return 'The thief attacks but misses.';
      case ThiefCombatMessageType.LIGHT_WOUND:
        return 'The thief strikes, drawing blood.';
      case ThiefCombatMessageType.SERIOUS_WOUND:
        return 'The thief lands a serious blow!';
      case ThiefCombatMessageType.UNCONSCIOUS:
        return 'The thief knocks you out.';
      case ThiefCombatMessageType.KILL:
        return 'The thief delivers a fatal blow.';
      case ThiefCombatMessageType.STAGGER:
        return 'The thief attacks, and you stagger back.';
      case ThiefCombatMessageType.DISARM:
        return 'The thief disarms you!';
      case ThiefCombatMessageType.PAUSE:
        return 'The thief pauses momentarily.';
      case ThiefCombatMessageType.FINAL_BLOW:
        return 'The thief finishes you off.';
      default:
        return 'The thief attacks.';
    }
  }

  /**
   * Get an action message for non-combat thief behavior.
   * Uses MessageService if available.
   *
   * @param messageCategory The message category (e.g., 'THIEF_EXAMINE')
   * @param replacements Optional template replacements
   * @returns An action message string or undefined if not found
   */
  getActionMessage(
    messageCategory: string,
    replacements?: Record<string, string>
  ): string | undefined {
    if (this.messageService) {
      return this.messageService.getRandomMessage('thief', messageCategory, replacements);
    }
    return undefined;
  }
}
