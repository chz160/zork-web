import { TrollActor } from './troll-actor';
import { TrollConfig, DEFAULT_TROLL_CONFIG } from './troll-config';
import { TrollBehaviorStrategy } from './troll-behavior.strategy';
import { TrollPerceptionStrategy } from './troll-perception.strategy';
import { TrollConversationStrategy } from './troll-conversation.strategy';

describe('TrollActor', () => {
  let troll: TrollActor;

  beforeEach(() => {
    troll = new TrollActor();
  });

  describe('initialization', () => {
    it('should create troll with correct initial state', () => {
      expect(troll.id).toBe('troll');
      expect(troll.name).toBe('troll');
      expect(troll.locationId).toBe('troll-room');
      expect(troll.tickEnabled).toBe(false);
    });

    it('should initialize with correct strength and state flags', () => {
      expect(troll.flags.get('strength')).toBe(2);
      expect(troll.flags.get('actorState')).toBe('armed');
      expect(troll.flags.get('isFighting')).toBe(true);
      expect(troll.flags.get('blocksPassage')).toBe(true);
    });

    it('should start with axe in inventory', () => {
      expect(troll.inventory).toContain('axe');
      expect(troll.hasAxe()).toBe(true);
    });

    it('should have conscious state', () => {
      const state = troll.getState();
      expect(state.isConscious).toBe(true);
      expect(state.isArmed).toBe(true);
      expect(state.strength).toBe(2);
    });
  });

  describe('passage blocking', () => {
    it('should block east exit when conscious', () => {
      expect(troll.blocksExit('ew-passage')).toBe(true);
    });

    it('should block west exit when conscious', () => {
      expect(troll.blocksExit('maze-1')).toBe(true);
    });

    it('should not block south exit', () => {
      expect(troll.blocksExit('cellar')).toBe(false);
    });

    it('should return blocking message when player tries blocked passage', () => {
      const message = troll.attemptPassage('troll-room', 'ew-passage');
      expect(message).toBeDefined();
      expect(message).toContain('troll');
    });

    it('should not block passage when unconscious', () => {
      // Knock troll unconscious
      troll.onDamage(2);

      expect(troll.blocksExit('ew-passage')).toBe(false);
      expect(troll.blocksExit('maze-1')).toBe(false);
    });
  });

  describe('combat and damage', () => {
    it('should take damage and reduce strength', () => {
      troll.attack(1, 0.5);

      const state = troll.getState();
      expect(state.strength).toBe(1);
      expect(state.isConscious).toBe(true);
    });

    it('should become unconscious when strength reaches 0', () => {
      troll.attack(2, 0.5);

      const state = troll.getState();
      expect(state.strength).toBe(0);
      expect(state.isConscious).toBe(false);
      expect(state.blocksPassage).toBe(false);
    });

    it('should update actorState flag when unconscious', () => {
      troll.attack(2, 0.5);

      expect(troll.flags.get('actorState')).toBe('unconscious');
      expect(troll.flags.get('isFighting')).toBe(false);
    });

    it('should drop axe when becoming unconscious', () => {
      expect(troll.hasAxe()).toBe(true);

      troll.attack(2, 0.5);

      expect(troll.hasAxe()).toBe(false);
    });

    it('should return appropriate message when attacking unconscious troll', () => {
      troll.attack(2, 0.5); // Knock unconscious

      const result = troll.attack(1, 0.5);
      expect(result.message).toContain('unconscious');
      expect(result.counterattack).toBe(false);
    });

    it('should handle onDamage lifecycle method', () => {
      troll.onDamage(1);

      expect(troll.flags.get('strength')).toBe(1);
    });
  });

  describe('bribe handling', () => {
    it('should accept valuable bribe', () => {
      const message = troll.offerBribe('gold', 10);

      expect(message).toBeDefined();
      const state = troll.getState();
      expect(state.blocksPassage).toBe(false);
    });

    it('should reject low-value bribe', () => {
      const message = troll.offerBribe('pebble', 1);

      expect(message).toBeDefined();
      const state = troll.getState();
      expect(state.blocksPassage).toBe(true);
    });

    it('should allow passage after accepting bribe', () => {
      troll.offerBribe('gold', 10);

      expect(troll.blocksExit('ew-passage')).toBe(false);
    });
  });

  describe('food handling', () => {
    it('should accept food and allow passage', () => {
      const message = troll.offerFood('sandwich');

      expect(message).toBeDefined();
      const state = troll.getState();
      expect(state.blocksPassage).toBe(false);
    });

    it('should refuse non-food items', () => {
      const message = troll.offerFood('sword');

      expect(message).toBeDefined();
      const state = troll.getState();
      expect(state.blocksPassage).toBe(true);
    });
  });

  describe('description', () => {
    it('should provide armed description when conscious', () => {
      const description = troll.getDescription();

      expect(description).toContain('troll');
      expect(description).toContain('axe');
    });

    it('should provide unconscious description when knocked out', () => {
      troll.attack(2, 0.5);

      const description = troll.getDescription();

      expect(description).toContain('unconscious');
    });
  });

  describe('custom configuration', () => {
    it('should use custom config values', () => {
      const customConfig: TrollConfig = {
        ...DEFAULT_TROLL_CONFIG,
        initialStrength: 5,
      };

      const customTroll = new TrollActor(customConfig);
      const state = customTroll.getState();

      expect(state.strength).toBe(5);
    });
  });
});

describe('TrollBehaviorStrategy', () => {
  let strategy: TrollBehaviorStrategy;
  let config: TrollConfig;

  beforeEach(() => {
    config = { ...DEFAULT_TROLL_CONFIG };
    strategy = new TrollBehaviorStrategy(config);
  });

  describe('shouldBlockPassage', () => {
    it('should block when conscious and blocksPassage is true', () => {
      const state = strategy.createInitialState();
      expect(strategy.shouldBlockPassage(state)).toBe(true);
    });

    it('should not block when unconscious', () => {
      const state = { ...strategy.createInitialState(), isConscious: false };
      expect(strategy.shouldBlockPassage(state)).toBe(false);
    });
  });

  describe('handleBribe', () => {
    it('should accept bribe meeting minimum value', () => {
      const state = strategy.createInitialState();
      const result = strategy.handleBribe(state, 10);

      expect(result.success).toBe(true);
      expect(result.newState.blocksPassage).toBe(false);
      expect(result.messageKey).toBe('TROLL_ACCEPTS_BRIBE');
    });

    it('should reject bribe below minimum value', () => {
      const state = strategy.createInitialState();
      const result = strategy.handleBribe(state, 2);

      expect(result.success).toBe(false);
      expect(result.newState.blocksPassage).toBe(true);
      expect(result.messageKey).toBe('TROLL_REJECTS_BRIBE');
    });

    it('should not accept bribe when unconscious', () => {
      const state = strategy.makeUnconscious(strategy.createInitialState());
      const result = strategy.handleBribe(state, 10);

      expect(result.success).toBe(false);
      expect(result.messageKey).toBe('TROLL_UNCONSCIOUS');
    });
  });

  describe('handleFoodOffer', () => {
    it('should accept eatable item', () => {
      const state = strategy.createInitialState();
      const result = strategy.handleFoodOffer(state, 'sandwich');

      expect(result.success).toBe(true);
      expect(result.newState.blocksPassage).toBe(false);
      expect(result.messageKey).toBe('TROLL_EATS_FOOD');
    });

    it('should refuse non-eatable item', () => {
      const state = strategy.createInitialState();
      const result = strategy.handleFoodOffer(state, 'rock');

      expect(result.success).toBe(false);
      expect(result.messageKey).toBe('TROLL_REFUSES_ITEM');
    });
  });

  describe('applyDamage', () => {
    it('should reduce strength by damage amount', () => {
      const state = strategy.createInitialState();
      const result = strategy.applyDamage(state, 1);

      expect(result.success).toBe(true);
      expect(result.newState.strength).toBe(1);
      expect(result.newState.isConscious).toBe(true);
    });

    it('should make unconscious when strength reaches 0', () => {
      const state = strategy.createInitialState();
      const result = strategy.applyDamage(state, 2);

      expect(result.newState.strength).toBe(0);
      expect(result.newState.isConscious).toBe(false);
      expect(result.messageKey).toBe('TROLL_KNOCKED_UNCONSCIOUS');
    });

    it('should not allow negative strength', () => {
      const state = strategy.createInitialState();
      const result = strategy.applyDamage(state, 10);

      expect(result.newState.strength).toBe(0);
    });
  });

  describe('counterattack logic', () => {
    it('should counterattack based on probability', () => {
      const state = strategy.createInitialState();

      expect(strategy.shouldCounterattack(state, 0.5)).toBe(true);
      expect(strategy.shouldCounterattack(state, 0.9)).toBe(false);
    });

    it('should not counterattack when unconscious', () => {
      const state = strategy.makeUnconscious(strategy.createInitialState());

      expect(strategy.shouldCounterattack(state, 0.5)).toBe(false);
    });
  });

  describe('attack hit logic', () => {
    it('should determine hit based on probability', () => {
      expect(strategy.attackHits(0.5)).toBe(true);
      expect(strategy.attackHits(0.7)).toBe(false);
    });
  });
});

describe('TrollPerceptionStrategy', () => {
  let strategy: TrollPerceptionStrategy;

  beforeEach(() => {
    strategy = new TrollPerceptionStrategy();
  });

  describe('canPerceivePlayer', () => {
    it('should perceive player in same room', () => {
      expect(strategy.canPerceivePlayer('troll-room', 'troll-room')).toBe(true);
    });

    it('should not perceive player in different room', () => {
      expect(strategy.canPerceivePlayer('troll-room', 'cellar')).toBe(false);
    });

    it('should not perceive when troll has no location', () => {
      expect(strategy.canPerceivePlayer(null, 'troll-room')).toBe(false);
    });
  });

  describe('canPerceiveItemOffer', () => {
    it('should perceive item when all in same room', () => {
      expect(strategy.canPerceiveItemOffer('troll-room', 'troll-room', 'troll-room')).toBe(true);
    });

    it('should perceive item held by player', () => {
      expect(strategy.canPerceiveItemOffer('troll-room', 'troll-room', 'player')).toBe(true);
    });

    it('should not perceive when player not in same room', () => {
      expect(strategy.canPerceiveItemOffer('troll-room', 'cellar', 'cellar')).toBe(false);
    });
  });

  describe('isPlayerAttemptingBlockedPassage', () => {
    it('should detect attempt to use blocked exit', () => {
      const blocked = strategy.isPlayerAttemptingBlockedPassage(
        'troll-room',
        'troll-room',
        'ew-passage',
        ['ew-passage', 'maze-1']
      );

      expect(blocked).toBe(true);
    });

    it('should not detect unblocked exit', () => {
      const blocked = strategy.isPlayerAttemptingBlockedPassage(
        'troll-room',
        'troll-room',
        'cellar',
        ['ew-passage', 'maze-1']
      );

      expect(blocked).toBe(false);
    });
  });

  describe('getDistance', () => {
    it('should return same-room when locations match', () => {
      expect(strategy.getDistance('troll-room', 'troll-room')).toBe('same-room');
    });

    it('should return far when locations differ', () => {
      expect(strategy.getDistance('troll-room', 'cellar')).toBe('far');
    });
  });
});

describe('TrollConversationStrategy', () => {
  let strategy: TrollConversationStrategy;

  beforeEach(() => {
    strategy = new TrollConversationStrategy();
  });

  describe('getMessage', () => {
    it('should return message for valid key', () => {
      const message = strategy.getMessage('TROLL_BLOCKS_PASSAGE');

      expect(message).toBeDefined();
      expect(message).toContain('troll');
    });

    it('should return undefined for invalid key', () => {
      const message = strategy.getMessage('INVALID_KEY');

      expect(message).toBeUndefined();
    });

    it('should apply template replacements', () => {
      const message = strategy.getMessage('TROLL_EATS_FOOD', { item: 'sandwich' });

      expect(message).toContain('sandwich');
    });
  });

  describe('getRandomMessage', () => {
    it('should return message at specified index', () => {
      const message = strategy.getRandomMessage('TROLL_BLOCKS_PASSAGE', 0);

      expect(message).toBeDefined();
    });

    it('should handle index wrapping', () => {
      const templates = strategy.getMessageTemplates('TROLL_BLOCKS_PASSAGE');
      const message = strategy.getRandomMessage('TROLL_BLOCKS_PASSAGE', templates.length + 1);

      expect(message).toBeDefined();
    });
  });

  describe('hasMessage', () => {
    it('should return true for existing key', () => {
      expect(strategy.hasMessage('TROLL_BLOCKS_PASSAGE')).toBe(true);
    });

    it('should return false for non-existing key', () => {
      expect(strategy.hasMessage('INVALID_KEY')).toBe(false);
    });
  });

  describe('message coverage', () => {
    it('should have all required message keys', () => {
      const requiredKeys = [
        'TROLL_BLOCKS_PASSAGE',
        'TROLL_UNCONSCIOUS',
        'TROLL_ACCEPTS_BRIBE',
        'TROLL_REJECTS_BRIBE',
        'TROLL_EATS_FOOD',
        'TROLL_HIT',
        'TROLL_KNOCKED_UNCONSCIOUS',
        'TROLL_DESCRIPTION_ARMED',
        'TROLL_DESCRIPTION_UNCONSCIOUS',
      ];

      requiredKeys.forEach((key) => {
        expect(strategy.hasMessage(key)).toBe(true);
      });
    });
  });
});
