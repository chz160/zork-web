import { TestBed } from '@angular/core/testing';
import { ActorManagerService } from '../services/actor-manager.service';
import { GameTickService } from '../services/game-tick.service';
import { RandomService } from '../services/random.service';
import { ThiefActor, ThiefMode } from '../models/thief-actor';

/**
 * Integration tests for ThiefActor with ActorManager.
 * Demonstrates the thief's integration with the actor lifecycle system.
 */
describe('ThiefActor Lifecycle Integration', () => {
  let actorManager: ActorManagerService;
  let tickService: GameTickService;
  let randomService: RandomService;
  let thief: ThiefActor;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ActorManagerService, GameTickService, RandomService],
    });
    actorManager = TestBed.inject(ActorManagerService);
    tickService = TestBed.inject(GameTickService);
    randomService = TestBed.inject(RandomService);

    // Set deterministic seed for testing
    randomService.setSeed(12345);
    tickService.reset();

    // Create and register thief
    thief = new ThiefActor();
    actorManager.register(thief);
  });

  afterEach(() => {
    actorManager.clear();
    tickService.reset();
  });

  describe('Registration and Basic State', () => {
    it('should register thief with actor manager', () => {
      const registered = actorManager.getActor('thief');
      expect(registered).toBe(thief);
    });

    it('should start in round-room', () => {
      expect(thief.locationId).toBe('round-room');
    });

    it('should start with ticking enabled', () => {
      expect(thief.tickEnabled).toBe(true);
      expect(actorManager.isTickEnabled('thief')).toBe(true);
    });

    it('should start in conscious mode', () => {
      expect(thief.getMode()).toBe(ThiefMode.CONSCIOUS);
    });
  });

  describe('Combat and State Transitions', () => {
    it('should transition to unconscious when taking fatal damage', () => {
      expect(thief.getMode()).toBe(ThiefMode.CONSCIOUS);
      expect(thief.tickEnabled).toBe(true);

      actorManager.triggerDamage('thief', 6); // More than strength of 5

      expect(thief.getMode()).toBe(ThiefMode.UNCONSCIOUS);
      expect(thief.tickEnabled).toBe(false);
      expect(thief.flags.get('strength')).toBeLessThan(0);
    });

    it('should transition to dead when strength reaches exactly 0', () => {
      actorManager.triggerDamage('thief', 5);

      expect(thief.getMode()).toBe(ThiefMode.DEAD);
      expect(thief.tickEnabled).toBe(false);
      expect(thief.flags.get('strength')).toBe(0);
    });

    it('should disable ticks when unconscious', () => {
      actorManager.triggerDamage('thief', 6);
      expect(actorManager.isTickEnabled('thief')).toBe(false);
    });

    it('should revive from unconscious state', () => {
      // Knock unconscious
      actorManager.triggerDamage('thief', 6);
      expect(thief.getMode()).toBe(ThiefMode.UNCONSCIOUS);

      // Revive (e.g., player gives item)
      thief.flags.set('strength', 5); // Restore strength
      thief.onConscious();

      expect(thief.getMode()).toBe(ThiefMode.CONSCIOUS);
      expect(thief.tickEnabled).toBe(true);
      expect(thief.flags.get('fighting')).toBe(true);
    });
  });

  describe('Gift Acceptance', () => {
    it('should accept worthless gifts without becoming engrossed', () => {
      expect(thief.inventory).not.toContain('rock');
      expect(thief.isEngrossed()).toBe(false);

      thief.acceptGift('rock', 0);

      expect(thief.inventory).toContain('rock');
      expect(thief.isEngrossed()).toBe(false);
    });

    it('should accept valuable gifts and become engrossed', () => {
      expect(thief.inventory).not.toContain('jewel');
      expect(thief.isEngrossed()).toBe(false);

      thief.acceptGift('jewel', 50);

      expect(thief.inventory).toContain('jewel');
      expect(thief.isEngrossed()).toBe(true);
    });

    it('should maintain engrossed state through multiple valuables', () => {
      thief.acceptGift('gem', 30);
      expect(thief.isEngrossed()).toBe(true);

      thief.acceptGift('coin', 10);
      expect(thief.isEngrossed()).toBe(true);
      expect(thief.inventory).toContain('gem');
      expect(thief.inventory).toContain('coin');
    });
  });

  describe('Tick Behavior', () => {
    it('should receive ticks when enabled', () => {
      // ThiefActor.onTick() is a no-op stub, but we can verify it's called
      spyOn(thief, 'onTick');

      tickService.tick();
      expect(thief.onTick).toHaveBeenCalled();
    });

    it('should not receive ticks when disabled', () => {
      spyOn(thief, 'onTick');

      actorManager.disableTicks('thief');
      tickService.tick();

      expect(thief.onTick).not.toHaveBeenCalled();
    });

    it('should stop receiving ticks after death', () => {
      spyOn(thief, 'onTick');

      actorManager.triggerDeath('thief');
      tickService.tick();

      expect(thief.onTick).not.toHaveBeenCalled();
      expect(thief.getMode()).toBe(ThiefMode.DEAD);
    });
  });

  describe('Encounter Behavior', () => {
    it('should trigger encounter when player enters room', () => {
      spyOn(thief, 'onEncounter');

      actorManager.triggerEncounter('round-room');

      expect(thief.onEncounter).toHaveBeenCalledWith('round-room');
    });

    it('should not trigger encounter when player is in different room', () => {
      spyOn(thief, 'onEncounter');

      // Thief is in 'round-room', player enters 'treasure-room'
      actorManager.triggerEncounter('treasure-room');

      expect(thief.onEncounter).not.toHaveBeenCalled();
    });

    it('should trigger encounter after thief moves to new room', () => {
      spyOn(thief, 'onEncounter');

      // Move thief to treasure room
      thief.locationId = 'treasure-room';

      // Player enters treasure room
      actorManager.triggerEncounter('treasure-room');

      expect(thief.onEncounter).toHaveBeenCalledWith('treasure-room');
    });
  });

  describe('Death Handling', () => {
    it('should handle death through ActorManager', () => {
      expect(thief.tickEnabled).toBe(true);
      expect(thief.getMode()).toBe(ThiefMode.CONSCIOUS);

      actorManager.triggerDeath('thief');

      expect(thief.tickEnabled).toBe(false);
      expect(thief.getMode()).toBe(ThiefMode.DEAD);
    });

    it('should handle death through damage', () => {
      actorManager.triggerDamage('thief', 5); // Exactly to 0

      expect(thief.getMode()).toBe(ThiefMode.DEAD);
      expect(thief.tickEnabled).toBe(false);
    });
  });

  describe('Stiletto Tracking', () => {
    it('should track stiletto in inventory', () => {
      expect(thief.hasStilettoInInventory()).toBe(false);

      thief.inventory.push('stiletto');
      expect(thief.hasStilettoInInventory()).toBe(true);
    });

    it('should allow stiletto to be removed from inventory', () => {
      thief.inventory.push('stiletto');
      expect(thief.hasStilettoInInventory()).toBe(true);

      thief.inventory = thief.inventory.filter((id) => id !== 'stiletto');
      expect(thief.hasStilettoInInventory()).toBe(false);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle combat -> unconscious -> revival -> gift cycle', () => {
      // Initial state
      expect(thief.getMode()).toBe(ThiefMode.CONSCIOUS);
      expect(thief.tickEnabled).toBe(true);

      // Combat: take damage but don't die
      actorManager.triggerDamage('thief', 3);
      expect(thief.flags.get('strength')).toBe(2);
      expect(thief.getMode()).toBe(ThiefMode.CONSCIOUS);

      // More combat: knocked unconscious
      actorManager.triggerDamage('thief', 3); // Goes to -1
      expect(thief.getMode()).toBe(ThiefMode.UNCONSCIOUS);
      expect(thief.tickEnabled).toBe(false);

      // Player gives valuable gift to unconscious thief (revives him)
      thief.flags.set('strength', 5);
      thief.onConscious();
      thief.acceptGift('treasure', 100);

      expect(thief.getMode()).toBe(ThiefMode.CONSCIOUS);
      expect(thief.tickEnabled).toBe(true);
      expect(thief.isEngrossed()).toBe(true);
      expect(thief.inventory).toContain('treasure');
    });

    it('should maintain state through multiple ticks', () => {
      spyOn(thief, 'onTick');

      // Multiple ticks while conscious
      for (let i = 0; i < 5; i++) {
        tickService.tick();
      }
      expect(thief.onTick).toHaveBeenCalledTimes(5);

      // Knock unconscious
      actorManager.triggerDamage('thief', 6);
      (thief.onTick as jasmine.Spy).calls.reset();

      // More ticks - should not be called
      for (let i = 0; i < 3; i++) {
        tickService.tick();
      }
      expect(thief.onTick).not.toHaveBeenCalled();
    });
  });
});
