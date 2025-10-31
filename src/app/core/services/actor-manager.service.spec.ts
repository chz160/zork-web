import { TestBed } from '@angular/core/testing';
import { ActorManagerService } from './actor-manager.service';
import { GameTickService } from './game-tick.service';
import { BaseActor } from '../models/actor.model';

/**
 * Test actor that tracks onTick calls
 */
class TestActor extends BaseActor {
  tickCallCount = 0;
  encounterCallCount = 0;
  deathCallCount = 0;
  damageCallCount = 0;
  lastDamageAmount = 0;

  override onTick(): void {
    this.tickCallCount++;
  }

  override onEncounter(_playerRoomId: string): void {
    this.encounterCallCount++;
  }

  override onDeath(): void {
    this.deathCallCount++;
  }

  override onDamage(amount: number): void {
    this.damageCallCount++;
    this.lastDamageAmount = amount;
  }
}

describe('ActorManagerService', () => {
  let service: ActorManagerService;
  let tickService: GameTickService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ActorManagerService, GameTickService],
    });
    service = TestBed.inject(ActorManagerService);
    tickService = TestBed.inject(GameTickService);
    tickService.reset();
  });

  afterEach(() => {
    service.clear();
    tickService.reset();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Actor Registration', () => {
    it('should register an actor', () => {
      const actor = new TestActor('test-1', 'Test Actor');
      service.register(actor);

      const retrieved = service.getActor('test-1');
      expect(retrieved).toBe(actor);
    });

    it('should throw error when registering duplicate actor ID', () => {
      const actor1 = new TestActor('test-1', 'Test Actor 1');
      const actor2 = new TestActor('test-1', 'Test Actor 2');

      service.register(actor1);

      expect(() => service.register(actor2)).toThrowError(
        "Actor with id 'test-1' is already registered"
      );
    });

    it('should unregister an actor', () => {
      const actor = new TestActor('test-1', 'Test Actor');
      service.register(actor);

      const result = service.unregister('test-1');
      expect(result).toBe(true);
      expect(service.getActor('test-1')).toBeUndefined();
    });

    it('should return false when unregistering non-existent actor', () => {
      const result = service.unregister('non-existent');
      expect(result).toBe(false);
    });

    it('should get all registered actors', () => {
      const actor1 = new TestActor('test-1', 'Actor 1');
      const actor2 = new TestActor('test-2', 'Actor 2');
      const actor3 = new TestActor('test-3', 'Actor 3');

      service.register(actor1);
      service.register(actor2);
      service.register(actor3);

      const allActors = service.getAllActors();
      expect(allActors).toHaveSize(3);
      expect(allActors).toContain(actor1);
      expect(allActors).toContain(actor2);
      expect(allActors).toContain(actor3);
    });

    it('should clear all actors', () => {
      const actor1 = new TestActor('test-1', 'Actor 1');
      const actor2 = new TestActor('test-2', 'Actor 2');

      service.register(actor1);
      service.register(actor2);
      expect(service.getAllActors()).toHaveSize(2);

      service.clear();
      expect(service.getAllActors()).toHaveSize(0);
    });
  });

  describe('Location-based Queries', () => {
    it('should get actors in a specific location', () => {
      const actor1 = new TestActor('test-1', 'Actor 1', { locationId: 'room-a' });
      const actor2 = new TestActor('test-2', 'Actor 2', { locationId: 'room-b' });
      const actor3 = new TestActor('test-3', 'Actor 3', { locationId: 'room-a' });

      service.register(actor1);
      service.register(actor2);
      service.register(actor3);

      const actorsInRoomA = service.getActorsInLocation('room-a');
      expect(actorsInRoomA).toHaveSize(2);
      expect(actorsInRoomA).toContain(actor1);
      expect(actorsInRoomA).toContain(actor3);

      const actorsInRoomB = service.getActorsInLocation('room-b');
      expect(actorsInRoomB).toHaveSize(1);
      expect(actorsInRoomB).toContain(actor2);
    });

    it('should return empty array for location with no actors', () => {
      const actor = new TestActor('test-1', 'Actor 1', { locationId: 'room-a' });
      service.register(actor);

      const actorsInRoomB = service.getActorsInLocation('room-b');
      expect(actorsInRoomB).toHaveSize(0);
    });
  });

  describe('Tick Management', () => {
    it('should enable ticks for an actor', () => {
      const actor = new TestActor('test-1', 'Test Actor', { tickEnabled: false });
      service.register(actor);

      expect(service.isTickEnabled('test-1')).toBe(false);

      const result = service.enableTicks('test-1');
      expect(result).toBe(true);
      expect(service.isTickEnabled('test-1')).toBe(true);
    });

    it('should disable ticks for an actor', () => {
      const actor = new TestActor('test-1', 'Test Actor', { tickEnabled: true });
      service.register(actor);

      expect(service.isTickEnabled('test-1')).toBe(true);

      const result = service.disableTicks('test-1');
      expect(result).toBe(true);
      expect(service.isTickEnabled('test-1')).toBe(false);
    });

    it('should return false when enabling ticks for non-existent actor', () => {
      const result = service.enableTicks('non-existent');
      expect(result).toBe(false);
    });

    it('should return false when disabling ticks for non-existent actor', () => {
      const result = service.disableTicks('non-existent');
      expect(result).toBe(false);
    });

    it('should return false for isTickEnabled on non-existent actor', () => {
      expect(service.isTickEnabled('non-existent')).toBe(false);
    });
  });

  describe('Tick Processing', () => {
    it('should call onTick for enabled actors when tick occurs', () => {
      const actor = new TestActor('test-1', 'Test Actor', { tickEnabled: true });
      service.register(actor);

      expect(actor.tickCallCount).toBe(0);

      tickService.tick();
      expect(actor.tickCallCount).toBe(1);

      tickService.tick();
      expect(actor.tickCallCount).toBe(2);
    });

    it('should not call onTick for disabled actors', () => {
      const actor = new TestActor('test-1', 'Test Actor', { tickEnabled: false });
      service.register(actor);

      tickService.tick();
      tickService.tick();

      expect(actor.tickCallCount).toBe(0);
    });

    it('should only call onTick for enabled actors in mixed scenario', () => {
      const enabledActor = new TestActor('enabled', 'Enabled Actor', { tickEnabled: true });
      const disabledActor = new TestActor('disabled', 'Disabled Actor', { tickEnabled: false });

      service.register(enabledActor);
      service.register(disabledActor);

      tickService.tick();

      expect(enabledActor.tickCallCount).toBe(1);
      expect(disabledActor.tickCallCount).toBe(0);
    });

    it('should respect dynamic tick enable/disable', () => {
      const actor = new TestActor('test-1', 'Test Actor', { tickEnabled: false });
      service.register(actor);

      tickService.tick();
      expect(actor.tickCallCount).toBe(0);

      service.enableTicks('test-1');
      tickService.tick();
      expect(actor.tickCallCount).toBe(1);

      service.disableTicks('test-1');
      tickService.tick();
      expect(actor.tickCallCount).toBe(1); // Still 1, didn't increment
    });

    it('should handle multiple actors with different tick states', () => {
      const actor1 = new TestActor('actor-1', 'Actor 1', { tickEnabled: true });
      const actor2 = new TestActor('actor-2', 'Actor 2', { tickEnabled: true });
      const actor3 = new TestActor('actor-3', 'Actor 3', { tickEnabled: false });

      service.register(actor1);
      service.register(actor2);
      service.register(actor3);

      tickService.tick();
      tickService.tick();

      expect(actor1.tickCallCount).toBe(2);
      expect(actor2.tickCallCount).toBe(2);
      expect(actor3.tickCallCount).toBe(0);
    });

    it('should continue processing other actors if one throws error', () => {
      class ErrorActor extends TestActor {
        override onTick(): void {
          super.onTick();
          throw new Error('Test error');
        }
      }

      const errorActor = new ErrorActor('error', 'Error Actor', { tickEnabled: true });
      const normalActor = new TestActor('normal', 'Normal Actor', { tickEnabled: true });

      service.register(errorActor);
      service.register(normalActor);

      // Should not throw, but both should be called
      spyOn(console, 'error'); // Suppress error output
      tickService.tick();

      expect(errorActor.tickCallCount).toBe(1);
      expect(normalActor.tickCallCount).toBe(1);
    });
  });

  describe('Lifecycle Events', () => {
    it('should trigger encounter for actors in location', () => {
      const actor1 = new TestActor('test-1', 'Actor 1', { locationId: 'room-a' });
      const actor2 = new TestActor('test-2', 'Actor 2', { locationId: 'room-a' });
      const actor3 = new TestActor('test-3', 'Actor 3', { locationId: 'room-b' });

      service.register(actor1);
      service.register(actor2);
      service.register(actor3);

      service.triggerEncounter('room-a');

      expect(actor1.encounterCallCount).toBe(1);
      expect(actor2.encounterCallCount).toBe(1);
      expect(actor3.encounterCallCount).toBe(0);
    });

    it('should trigger death for specific actor', () => {
      const actor = new TestActor('test-1', 'Test Actor');
      service.register(actor);

      service.triggerDeath('test-1');

      expect(actor.deathCallCount).toBe(1);
    });

    it('should trigger damage for specific actor', () => {
      const actor = new TestActor('test-1', 'Test Actor');
      service.register(actor);

      service.triggerDamage('test-1', 10);

      expect(actor.damageCallCount).toBe(1);
      expect(actor.lastDamageAmount).toBe(10);
    });

    it('should not throw when triggering events for non-existent actor', () => {
      expect(() => service.triggerDeath('non-existent')).not.toThrow();
      expect(() => service.triggerDamage('non-existent', 10)).not.toThrow();
    });

    it('should handle errors in lifecycle events gracefully', () => {
      class ErrorActor extends TestActor {
        override onDeath(): void {
          super.onDeath();
          throw new Error('Death error');
        }
      }

      const actor = new ErrorActor('test-1', 'Error Actor');
      service.register(actor);

      spyOn(console, 'error'); // Suppress error output
      expect(() => service.triggerDeath('test-1')).not.toThrow();
      expect(actor.deathCallCount).toBe(1);
    });
  });

  describe('Integration with GameTickService', () => {
    it('should process ticks from GameTickService', (done) => {
      const actor = new TestActor('test-1', 'Test Actor', { tickEnabled: true });
      service.register(actor);

      tickService.tick();
      tickService.tick();
      tickService.tick();

      setTimeout(() => {
        expect(actor.tickCallCount).toBe(3);
        done();
      }, 50);
    });

    it('should work with auto-ticking', (done) => {
      const actor = new TestActor('test-1', 'Test Actor', { tickEnabled: true });
      service.register(actor);

      tickService.startAutoTick(50);

      setTimeout(() => {
        expect(actor.tickCallCount).toBeGreaterThanOrEqual(1);
        tickService.stopAutoTick();
        done();
      }, 150);
    });
  });
});
