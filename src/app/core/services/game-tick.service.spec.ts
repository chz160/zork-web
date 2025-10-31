import { TestBed } from '@angular/core/testing';
import { GameTickService } from './game-tick.service';

describe('GameTickService', () => {
  let service: GameTickService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GameTickService],
    });
    service = TestBed.inject(GameTickService);
  });

  afterEach(() => {
    service.stopAutoTick();
    service.reset();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Manual Ticking', () => {
    it('should start with tick count of 0', () => {
      expect(service.getCount()).toBe(0);
      expect(service.count()).toBe(0);
    });

    it('should increment tick count on manual tick', () => {
      service.tick();
      expect(service.getCount()).toBe(1);

      service.tick();
      expect(service.getCount()).toBe(2);

      service.tick();
      expect(service.getCount()).toBe(3);
    });

    it('should emit tick event when ticking', (done) => {
      let emittedCount = 0;
      service.tick$.subscribe((count) => {
        emittedCount++;
        if (emittedCount === 1) {
          expect(count).toBe(1);
        } else if (emittedCount === 2) {
          expect(count).toBe(2);
          done();
        }
      });

      service.tick();
      service.tick();
    });

    it('should reset tick count to 0', () => {
      service.tick();
      service.tick();
      service.tick();
      expect(service.getCount()).toBe(3);

      service.reset();
      expect(service.getCount()).toBe(0);
    });
  });

  describe('Auto Ticking', () => {
    it('should not be running initially', () => {
      expect(service.running()).toBe(false);
    });

    it('should set running flag when auto-tick starts', () => {
      service.startAutoTick(100);
      expect(service.running()).toBe(true);
    });

    it('should clear running flag when auto-tick stops', () => {
      service.startAutoTick(100);
      expect(service.running()).toBe(true);

      service.stopAutoTick();
      expect(service.running()).toBe(false);
    });

    it('should auto-increment tick count', (done) => {
      service.startAutoTick(50); // 50ms interval

      setTimeout(() => {
        const count = service.getCount();
        // Should have ticked at least once in 150ms
        expect(count).toBeGreaterThanOrEqual(1);
        service.stopAutoTick();
        done();
      }, 150);
    });

    it('should emit tick events during auto-tick', (done) => {
      let tickCount = 0;
      service.tick$.subscribe(() => {
        tickCount++;
      });

      service.startAutoTick(50);

      setTimeout(() => {
        expect(tickCount).toBeGreaterThanOrEqual(1);
        service.stopAutoTick();
        done();
      }, 150);
    });

    it('should stop emitting when auto-tick is stopped', (done) => {
      let tickCount = 0;
      service.tick$.subscribe(() => {
        tickCount++;
      });

      service.startAutoTick(50);

      setTimeout(() => {
        service.stopAutoTick();
        const countAtStop = tickCount;

        setTimeout(() => {
          // Count should not have increased much after stop
          expect(tickCount).toBeLessThanOrEqual(countAtStop + 1);
          done();
        }, 100);
      }, 100);
    });

    it('should not start multiple auto-tick timers', (done) => {
      service.startAutoTick(50);
      service.startAutoTick(50); // Try to start again
      service.startAutoTick(50); // And again

      setTimeout(() => {
        const count = service.getCount();
        // Should only have one timer running, so count should be reasonable
        expect(count).toBeLessThan(10); // Would be much higher with multiple timers
        service.stopAutoTick();
        done();
      }, 150);
    });
  });

  describe('Tick Observable', () => {
    it('should allow multiple subscribers', (done) => {
      let subscriber1Count = 0;
      let subscriber2Count = 0;

      service.tick$.subscribe(() => {
        subscriber1Count++;
      });

      service.tick$.subscribe(() => {
        subscriber2Count++;
      });

      service.tick();
      service.tick();

      setTimeout(() => {
        expect(subscriber1Count).toBe(2);
        expect(subscriber2Count).toBe(2);
        done();
      }, 10);
    });

    it('should provide current count in tick event', (done) => {
      const receivedCounts: number[] = [];

      service.tick$.subscribe((count) => {
        receivedCounts.push(count);
      });

      service.tick();
      service.tick();
      service.tick();

      setTimeout(() => {
        expect(receivedCounts).toEqual([1, 2, 3]);
        done();
      }, 10);
    });
  });

  describe('Integration', () => {
    it('should work with both manual and auto ticking', (done) => {
      service.tick(); // Manual: count = 1
      service.tick(); // Manual: count = 2

      service.startAutoTick(50);

      setTimeout(() => {
        const count = service.getCount();
        // Should be at least 3 (2 manual + at least 1 auto)
        expect(count).toBeGreaterThanOrEqual(3);
        service.stopAutoTick();
        done();
      }, 150);
    });

    it('should maintain count through start/stop cycles', () => {
      service.tick();
      service.tick();
      expect(service.getCount()).toBe(2);

      service.startAutoTick(1000);
      service.stopAutoTick();
      expect(service.getCount()).toBe(2);

      service.tick();
      expect(service.getCount()).toBe(3);
    });
  });
});
