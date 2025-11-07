import { BaseActor } from '../../../app/core/models/actor.model';
import { TrollConfig, DEFAULT_TROLL_CONFIG } from './troll-config';
import { TrollBehaviorStrategy, TrollState } from './troll-behavior.strategy';
import { TrollPerceptionStrategy } from './troll-perception.strategy';
import { TrollConversationStrategy } from './troll-conversation.strategy';

/**
 * TrollActor - An actor that guards passages and demands payment.
 *
 * Implements the Actor interface using composable strategies:
 * - TrollBehaviorStrategy: Handles blocking, bribes, food, combat logic
 * - TrollPerceptionStrategy: Determines when troll sees/hears player
 * - TrollConversationStrategy: Provides templated messages
 *
 * Based on characterization tests:
 * - Starts in troll-room with axe, strength 2, armed state
 * - Blocks east and west passages when conscious
 * - Takes damage from combat, becomes unconscious at strength 0
 * - Drops axe when unconscious
 * - Opens passages when unconscious
 * - Can be bribed or fed to allow passage
 *
 * Usage:
 * ```typescript
 * const troll = new TrollActor(config);
 * actorManager.register(troll);
 * ```
 */
export class TrollActor extends BaseActor {
  private readonly behaviorStrategy: TrollBehaviorStrategy;
  private readonly perceptionStrategy: TrollPerceptionStrategy;
  private readonly conversationStrategy: TrollConversationStrategy;
  private trollState: TrollState;

  /** ID of the axe weapon */
  private readonly axeId = 'axe';

  /** ID of the troll room */
  private readonly trollRoomId = 'troll-room';

  /** Exits that the troll blocks when conscious */
  private readonly blockedExits = ['ew-passage', 'maze-1']; // east and west

  constructor(config?: TrollConfig) {
    super('troll', 'troll', {
      locationId: 'troll-room',
      inventory: ['axe'], // Troll starts with axe
      tickEnabled: false, // Troll is stationary, doesn't need ticking
    });

    const trollConfig = config || DEFAULT_TROLL_CONFIG;

    // Initialize strategies
    this.behaviorStrategy = new TrollBehaviorStrategy(trollConfig);
    this.perceptionStrategy = new TrollPerceptionStrategy();
    this.conversationStrategy = new TrollConversationStrategy();

    // Create initial state
    this.trollState = this.behaviorStrategy.createInitialState();

    // Initialize flags to match characterization tests
    this.flags.set('strength', this.trollState.strength);
    this.flags.set('actorState', 'armed'); // 'armed' or 'unconscious'
    this.flags.set('isFighting', true);
    this.flags.set('blocksPassage', true);
  }

  /**
   * Get current troll state.
   *
   * @returns Current state of the troll
   */
  getState(): TrollState {
    return { ...this.trollState };
  }

  /**
   * Check if troll blocks a specific exit.
   *
   * @param exitId The exit/destination room ID
   * @returns True if troll blocks this exit
   */
  blocksExit(exitId: string): boolean {
    if (!this.trollState.isConscious || !this.trollState.blocksPassage) {
      return false;
    }
    return this.blockedExits.includes(exitId);
  }

  /**
   * Attempt to pass by the troll.
   *
   * @param playerLocationId Current player location
   * @param destinationId Where player is trying to go
   * @returns Message about the attempt
   */
  attemptPassage(playerLocationId: string, destinationId: string): string | undefined {
    const blocks = this.perceptionStrategy.isPlayerAttemptingBlockedPassage(
      this.locationId,
      playerLocationId,
      destinationId,
      this.blockedExits
    );

    if (!blocks) {
      return undefined;
    }

    if (!this.behaviorStrategy.shouldBlockPassage(this.trollState)) {
      return undefined; // Passage is open
    }

    return this.conversationStrategy.getMessage('TROLL_BLOCKS_PASSAGE');
  }

  /**
   * Offer a bribe to the troll.
   *
   * @param itemId ID of item being offered
   * @param itemValue Treasure value of the item
   * @returns Result message
   */
  offerBribe(itemId: string, itemValue: number): string {
    const result = this.behaviorStrategy.handleBribe(this.trollState, itemValue);
    this.updateState(result.newState);

    const message = this.conversationStrategy.getMessage(
      result.messageKey || 'TROLL_REFUSES_ITEM',
      result.messageReplacements
    );

    return message || 'The troll ignores your offer.';
  }

  /**
   * Offer food to the troll.
   *
   * @param itemId ID of food item being offered
   * @returns Result message
   */
  offerFood(itemId: string): string {
    const result = this.behaviorStrategy.handleFoodOffer(this.trollState, itemId);
    this.updateState(result.newState);

    const message = this.conversationStrategy.getMessage(
      result.messageKey || 'TROLL_REFUSES_ITEM',
      result.messageReplacements
    );

    return message || 'The troll refuses the item.';
  }

  /**
   * Attack the troll with a weapon.
   *
   * @param weaponDamage Amount of damage the weapon deals
   * @param randomValue Random value for counterattack probability (0-1)
   * @returns Object with damage result and optional counterattack
   */
  attack(
    weaponDamage: number,
    randomValue: number
  ): {
    message: string;
    counterattack: boolean;
    counterattackMessage?: string;
  } {
    if (!this.trollState.isConscious) {
      return {
        message:
          this.conversationStrategy.getMessage('TROLL_ALREADY_UNCONSCIOUS') ||
          'The troll is already unconscious.',
        counterattack: false,
      };
    }

    const damageResult = this.behaviorStrategy.applyDamage(this.trollState, weaponDamage);
    this.updateState(damageResult.newState);

    const message =
      this.conversationStrategy.getMessage(damageResult.messageKey || 'TROLL_HIT') ||
      'You hit the troll.';

    // Check for counterattack.
    // Note: We intentionally update trollState before this check.
    // If the troll was knocked unconscious by this attack, isConscious will be false,
    // and the troll will not counterattack. This ordering is intentional.
    const counterattack = this.behaviorStrategy.shouldCounterattack(this.trollState, randomValue);

    let counterattackMessage: string | undefined;
    if (counterattack) {
      const counterattackHits = this.behaviorStrategy.attackHits(randomValue);
      counterattackMessage = this.conversationStrategy.getMessage(
        counterattackHits ? 'TROLL_COUNTERATTACK' : 'TROLL_ATTACK_MISS'
      );
    }

    return {
      message,
      counterattack,
      counterattackMessage,
    };
  }

  /**
   * Get the troll's description based on current state.
   *
   * @returns Description string
   */
  getDescription(): string {
    if (!this.trollState.isConscious) {
      return (
        this.conversationStrategy.getMessage('TROLL_DESCRIPTION_UNCONSCIOUS') ||
        'An unconscious troll is sprawled on the floor.'
      );
    }

    return (
      this.conversationStrategy.getMessage('TROLL_DESCRIPTION_ARMED') ||
      'A nasty-looking troll, brandishing a bloody axe, blocks all passages out of the room.'
    );
  }

  /**
   * Check if troll has the axe.
   *
   * @returns True if axe is in troll's inventory
   */
  hasAxe(): boolean {
    return this.inventory.includes(this.axeId);
  }

  /**
   * Called when this actor takes damage.
   * Updates internal state and Actor interface state.
   *
   * @param amount Amount of damage taken
   */
  override onDamage(amount: number): void {
    const result = this.behaviorStrategy.applyDamage(this.trollState, amount);
    this.updateState(result.newState);
  }

  /**
   * Called when the player enters the same room as this actor.
   * Troll doesn't have special encounter behavior beyond blocking passages.
   *
   * @param _playerRoomId The room ID where the encounter occurred
   */
  override onEncounter(_playerRoomId: string): void {
    // Troll doesn't need special encounter logic
    // Passage blocking is handled via attemptPassage()
  }

  /**
   * Called when this actor dies.
   * For troll, becoming unconscious is handled by damage system.
   */
  override onDeath(): void {
    // Make fully unconscious
    this.trollState = this.behaviorStrategy.makeUnconscious(this.trollState);
    this.updateState(this.trollState);
  }

  /**
   * Restore troll state from serialized data.
   * Used for deserialization during game load.
   *
   * @param state The troll state to restore
   * @internal
   */
  restoreState(state: TrollState): void {
    this.updateState(state);
  }

  /**
   * Update internal state and sync with Actor interface flags.
   *
   * @param newState New troll state
   */
  private updateState(newState: TrollState): void {
    this.trollState = newState;

    // Sync with Actor interface flags
    this.flags.set('strength', newState.strength);
    this.flags.set('actorState', newState.isConscious ? 'armed' : 'unconscious');
    this.flags.set('isFighting', newState.isFighting);
    this.flags.set('blocksPassage', newState.blocksPassage);

    // Drop axe when unconscious
    if (!newState.isConscious && this.hasAxe()) {
      const axeIndex = this.inventory.indexOf(this.axeId);
      if (axeIndex > -1) {
        this.inventory.splice(axeIndex, 1);
      }
    }
  }
}
