import { TrollConfig } from './troll-config';

/**
 * State information for the troll actor.
 */
export interface TrollState {
  /** Current strength (health) of the troll */
  strength: number;

  /** Whether troll is conscious (strength > 0) */
  isConscious: boolean;

  /** Whether troll is armed with axe */
  isArmed: boolean;

  /** Whether troll is currently in combat */
  isFighting: boolean;

  /** Whether troll blocks passages */
  blocksPassage: boolean;
}

/**
 * Result of a behavior action.
 */
export interface BehaviorResult {
  /** Whether the action succeeded */
  success: boolean;

  /** New state after the action */
  newState: TrollState;

  /** Message key for response (used by conversation strategy) */
  messageKey?: string;

  /** Optional message replacements */
  messageReplacements?: Record<string, string>;
}

/**
 * Strategy for troll behavior logic.
 * Contains pure functions for deterministic behavior rules.
 *
 * Responsibilities:
 * - Block bridge/passages when armed and conscious
 * - Handle bribe acceptance (valuable items)
 * - Handle food consumption
 * - Determine attack-on-provocation behavior
 * - Handle damage and state transitions
 */
export class TrollBehaviorStrategy {
  constructor(private config: TrollConfig) {}

  /**
   * Check if troll should block a passage.
   *
   * @param state Current troll state
   * @returns True if troll blocks passage
   */
  shouldBlockPassage(state: TrollState): boolean {
    return state.isConscious && state.blocksPassage;
  }

  /**
   * Handle offering a bribe to the troll.
   *
   * @param state Current troll state
   * @param itemValue Treasure value of the offered item
   * @returns Behavior result with new state and message
   */
  handleBribe(state: TrollState, itemValue: number): BehaviorResult {
    if (!state.isConscious) {
      return {
        success: false,
        newState: state,
        messageKey: 'TROLL_UNCONSCIOUS',
      };
    }

    // Accept bribe if value meets minimum threshold
    if (itemValue >= this.config.minBribeValue) {
      return {
        success: true,
        newState: {
          ...state,
          blocksPassage: false,
        },
        messageKey: 'TROLL_ACCEPTS_BRIBE',
      };
    }

    // Reject insufficient bribe
    return {
      success: false,
      newState: state,
      messageKey: 'TROLL_REJECTS_BRIBE',
    };
  }

  /**
   * Handle offering food to the troll.
   *
   * @param state Current troll state
   * @param itemId ID of the offered item
   * @returns Behavior result with new state and message
   */
  handleFoodOffer(state: TrollState, itemId: string): BehaviorResult {
    if (!state.isConscious) {
      return {
        success: false,
        newState: state,
        messageKey: 'TROLL_UNCONSCIOUS',
      };
    }

    // Check if item is eatable
    if (this.config.eatableItems.includes(itemId)) {
      return {
        success: true,
        newState: {
          ...state,
          blocksPassage: false,
        },
        messageKey: 'TROLL_EATS_FOOD',
        messageReplacements: { item: itemId },
      };
    }

    return {
      success: false,
      newState: state,
      messageKey: 'TROLL_REFUSES_ITEM',
    };
  }

  /**
   * Apply damage to the troll.
   *
   * @param state Current troll state
   * @param damage Amount of damage to apply
   * @returns Behavior result with updated state
   */
  applyDamage(state: TrollState, damage: number): BehaviorResult {
    if (!state.isConscious) {
      return {
        success: false,
        newState: state,
        messageKey: 'TROLL_ALREADY_UNCONSCIOUS',
      };
    }

    const newStrength = Math.max(0, state.strength - damage);
    const becomesUnconscious = newStrength <= 0;

    const newState: TrollState = {
      ...state,
      strength: newStrength,
      isConscious: newStrength > 0,
      isFighting: newStrength > 0,
      blocksPassage: newStrength > 0,
    };

    return {
      success: true,
      newState,
      messageKey: becomesUnconscious ? 'TROLL_KNOCKED_UNCONSCIOUS' : 'TROLL_HIT',
    };
  }

  /**
   * Determine if troll should counterattack.
   *
   * @param state Current troll state
   * @param randomValue Random value 0.0 to 1.0 for probability check
   * @returns True if troll counterattacks
   */
  shouldCounterattack(state: TrollState, randomValue: number): boolean {
    if (!state.isConscious || !state.isArmed) {
      return false;
    }
    return randomValue < this.config.counterattackProbability;
  }

  /**
   * Determine if troll's attack hits.
   *
   * @param randomValue Random value 0.0 to 1.0 for probability check
   * @returns True if attack hits
   */
  attackHits(randomValue: number): boolean {
    return randomValue < this.config.combatHitProbability;
  }

  /**
   * Get damage dealt by troll's weapon.
   *
   * @returns Damage amount
   */
  getAttackDamage(): number {
    return this.config.axeDamage;
  }

  /**
   * Handle troll becoming unconscious (transition state).
   *
   * @param state Current troll state
   * @returns New state with unconscious flags set
   */
  makeUnconscious(state: TrollState): TrollState {
    return {
      ...state,
      strength: 0,
      isConscious: false,
      isArmed: false, // Drops axe
      isFighting: false,
      blocksPassage: false,
    };
  }

  /**
   * Create initial troll state.
   *
   * @returns Initial state based on config
   */
  createInitialState(): TrollState {
    return {
      strength: this.config.initialStrength,
      isConscious: true,
      isArmed: true,
      isFighting: true,
      blocksPassage: true,
    };
  }
}
