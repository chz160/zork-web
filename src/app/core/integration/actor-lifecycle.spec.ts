import { TestBed } from '@angular/core/testing';
import { ActorManagerService } from '../services/actor-manager.service';
import { GameTickService } from '../services/game-tick.service';
import { RandomService } from '../services/random.service';
import { TestActor } from '../models/test-actor';

/**
 * Integration tests for the actor lifecycle system.
 * Demonstrates how ActorManager, GameTickService, and RandomService work together.
 */
describe('Actor Lifecycle Integration', () => {
  let actorManager: ActorManagerService;
  let tickService: GameTickService;
  let randomService: RandomService;

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
  });

  afterEach(() => {
    actorManager.clear();
    tickService.reset();
  });

  describe('Basic Actor Lifecycle', () => {
    it('should register and tick an actor', () => {
      const actor = new TestActor('wanderer', 'Wandering Minstrel', {
        locationId: 'room-1',
        tickEnabled: true,
      });

      actorManager.register(actor);
      expect(actorManager.getActor('wanderer')).toBe(actor);

      // Tick the game
      tickService.tick();
      expect(actor.getMoveCounter()).toBe(1);

      tickService.tick();
      expect(actor.getMoveCounter()).toBe(2);
    });

    it('should handle actor movement on ticks', () => {
      const locations = ['room-1', 'room-2', 'room-3'];
      const actor = new TestActor('patrol', 'Patrolling Guard', {
        locationId: locations[0],
        tickEnabled: true,
        moveInterval: 2,
        moveLocations: locations,
      });

      actorManager.register(actor);

      // Initial location
      expect(actor.locationId).toBe('room-1');

      // First tick - no move yet (moveInterval = 2)
      tickService.tick();
      expect(actor.locationId).toBe('room-1');

      // Second tick - should move
      tickService.tick();
      expect(actor.locationId).toBe('room-2');

      // Fourth tick - should move again
      tickService.tick();
      tickService.tick();
      expect(actor.locationId).toBe('room-3');

      // Sixth tick - wraps back to first location
      tickService.tick();
      tickService.tick();
      expect(actor.locationId).toBe('room-1');
    });

    it('should handle encounters when player enters actor room', () => {
      const actor = new TestActor('merchant', 'Friendly Merchant', {
        locationId: 'market',
        tickEnabled: false,
      });

      actorManager.register(actor);

      // Trigger encounter
      actorManager.triggerEncounter('market');

      expect(actor.flags.get('lastEncounterRoom')).toBe('market');
      expect(actor.flags.get('encounterCount')).toBe(1);

      // Another encounter
      actorManager.triggerEncounter('market');
      expect(actor.flags.get('encounterCount')).toBe(2);
    });

    it('should handle damage and death', () => {
      const actor = new TestActor('warrior', 'Battle Warrior', {
        locationId: 'arena',
        tickEnabled: true,
      });
      actor.flags.set('health', 100);

      actorManager.register(actor);

      // Take damage
      actorManager.triggerDamage('warrior', 30);
      expect(actor.flags.get('health')).toBe(70);
      expect(actor.flags.get('lastDamageAmount')).toBe(30);
      expect(actor.tickEnabled).toBe(true);

      // More damage
      actorManager.triggerDamage('warrior', 40);
      expect(actor.flags.get('health')).toBe(30);

      // Fatal damage
      actorManager.triggerDamage('warrior', 30);
      expect(actor.flags.get('health')).toBe(0);
      expect(actor.flags.get('isDead')).toBe(true);
      expect(actor.tickEnabled).toBe(false);
      expect(actor.locationId).toBeNull();
    });
  });

  describe('Multiple Actors', () => {
    it('should manage multiple actors independently', () => {
      const actor1 = new TestActor('actor-1', 'Actor One', {
        locationId: 'room-1',
        tickEnabled: true,
        moveInterval: 1,
        moveLocations: ['room-1', 'room-2'],
      });

      const actor2 = new TestActor('actor-2', 'Actor Two', {
        locationId: 'room-3',
        tickEnabled: true,
        moveInterval: 2,
        moveLocations: ['room-3', 'room-4'],
      });

      actorManager.register(actor1);
      actorManager.register(actor2);

      // First tick
      tickService.tick();
      expect(actor1.locationId).toBe('room-2'); // Moved (interval=1)
      expect(actor2.locationId).toBe('room-3'); // Not moved yet (interval=2)

      // Second tick
      tickService.tick();
      expect(actor1.locationId).toBe('room-1'); // Moved again
      expect(actor2.locationId).toBe('room-4'); // Now moved
    });

    it('should find actors by location', () => {
      const actor1 = new TestActor('actor-1', 'Actor One', { locationId: 'room-1' });
      const actor2 = new TestActor('actor-2', 'Actor Two', { locationId: 'room-1' });
      const actor3 = new TestActor('actor-3', 'Actor Three', { locationId: 'room-2' });

      actorManager.register(actor1);
      actorManager.register(actor2);
      actorManager.register(actor3);

      const room1Actors = actorManager.getActorsInLocation('room-1');
      expect(room1Actors).toHaveSize(2);
      expect(room1Actors).toContain(actor1);
      expect(room1Actors).toContain(actor2);

      const room2Actors = actorManager.getActorsInLocation('room-2');
      expect(room2Actors).toHaveSize(1);
      expect(room2Actors).toContain(actor3);
    });

    it('should trigger encounters for all actors in a location', () => {
      const actor1 = new TestActor('actor-1', 'Actor One', { locationId: 'tavern' });
      const actor2 = new TestActor('actor-2', 'Actor Two', { locationId: 'tavern' });
      const actor3 = new TestActor('actor-3', 'Actor Three', { locationId: 'cellar' });

      actorManager.register(actor1);
      actorManager.register(actor2);
      actorManager.register(actor3);

      // Player enters tavern
      actorManager.triggerEncounter('tavern');

      expect(actor1.flags.get('encounterCount')).toBe(1);
      expect(actor2.flags.get('encounterCount')).toBe(1);
      expect(actor3.flags.get('encounterCount')).toBeUndefined(); // Not in tavern
    });
  });

  describe('Enable/Disable Ticking', () => {
    it('should allow dynamic tick control', () => {
      const actor = new TestActor('controllable', 'Controllable Actor', {
        locationId: 'room-1',
        tickEnabled: false,
      });

      actorManager.register(actor);

      // Not ticking initially
      tickService.tick();
      expect(actor.getMoveCounter()).toBe(0);

      // Enable ticking
      actorManager.enableTicks('controllable');
      tickService.tick();
      expect(actor.getMoveCounter()).toBe(1);

      // Disable ticking
      actorManager.disableTicks('controllable');
      tickService.tick();
      expect(actor.getMoveCounter()).toBe(1); // Didn't increment
    });

    it('should allow actors to disable their own ticking', () => {
      const actor = new TestActor('self-disable', 'Self-Disabling Actor', {
        locationId: 'room-1',
        tickEnabled: true,
      });
      actor.flags.set('health', 50);

      actorManager.register(actor);

      // Actor is ticking
      tickService.tick();
      expect(actor.getMoveCounter()).toBe(1);

      // Fatal damage causes actor to disable itself
      actorManager.triggerDamage('self-disable', 50);
      expect(actor.tickEnabled).toBe(false);

      // No more ticks
      tickService.tick();
      expect(actor.getMoveCounter()).toBe(1); // Still 1
    });
  });

  describe('RandomService Integration', () => {
    it('should provide deterministic random behavior for actors', () => {
      // Simulate an actor using random service for behavior
      randomService.setSeed(42);
      const choice1 = randomService.choice(['north', 'south', 'east', 'west']);

      randomService.setSeed(42);
      const choice2 = randomService.choice(['north', 'south', 'east', 'west']);

      expect(choice1).toBe(choice2);
    });

    it('should support probability-based actor decisions', () => {
      randomService.setSeed(999);

      // Simulate a 75% probability check
      let trueCount = 0;
      for (let i = 0; i < 100; i++) {
        if (randomService.nextBoolean(0.75)) {
          trueCount++;
        }
      }

      // Should be roughly 75% (allow some variance)
      expect(trueCount).toBeGreaterThan(60);
      expect(trueCount).toBeLessThan(90);
    });
  });

  describe('Realistic Actor Scenario', () => {
    it('should simulate a wandering thief-like actor', () => {
      // Create a wandering actor that moves between rooms
      const thief = new TestActor('thief', 'Sneaky Thief', {
        locationId: 'treasure-room',
        tickEnabled: true,
        moveInterval: 2,
        moveLocations: ['treasure-room', 'hallway', 'gallery', 'entrance'],
        inventory: [],
      });
      thief.flags.set('health', 100);
      thief.flags.set('aggression', 'passive');

      actorManager.register(thief);

      // Initial state
      expect(thief.locationId).toBe('treasure-room');

      // Tick 1 - no move yet (moveInterval=2)
      tickService.tick();
      expect(thief.locationId).toBe('treasure-room');
      expect(thief.getMoveCounter()).toBe(1);

      // Tick 2 - move to hallway
      tickService.tick();
      expect(thief.locationId).toBe('hallway');
      expect(thief.getMoveCounter()).toBe(2);

      // Player encounters thief in hallway
      actorManager.triggerEncounter('hallway');
      expect(thief.flags.get('encounterCount')).toBe(1);

      // Tick 3 - no move
      tickService.tick();
      expect(thief.locationId).toBe('hallway');

      // Tick 4 - move to gallery
      tickService.tick();
      expect(thief.locationId).toBe('gallery');

      // Combat: thief takes damage
      actorManager.triggerDamage('thief', 30);
      expect(thief.flags.get('health')).toBe(70);
      expect(thief.flags.get('lastDamageAmount')).toBe(30);

      // Continue ticking - thief should keep moving and ticking
      for (let i = 5; i <= 10; i++) {
        tickService.tick();
      }
      expect(thief.getMoveCounter()).toBe(10);
      expect(thief.tickEnabled).toBe(true); // Still alive and ticking

      // Thief cycles through locations: entrance (tick 6), treasure-room (tick 8), hallway (tick 10)
      expect(thief.locationId).toBe('hallway');
    });
  });
});
