import { TestBed } from '@angular/core/testing';
import { RandomService } from './random.service';

describe('RandomService', () => {
  let service: RandomService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RandomService],
    });
    service = TestBed.inject(RandomService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Deterministic Generation', () => {
    it('should produce the same sequence with the same seed', () => {
      service.setSeed(12345);
      const sequence1 = [service.next(), service.next(), service.next()];

      service.setSeed(12345);
      const sequence2 = [service.next(), service.next(), service.next()];

      expect(sequence1).toEqual(sequence2);
    });

    it('should produce different sequences with different seeds', () => {
      service.setSeed(12345);
      const value1 = service.next();

      service.setSeed(54321);
      const value2 = service.next();

      expect(value1).not.toEqual(value2);
    });

    it('should return the current seed', () => {
      service.setSeed(999);
      expect(service.getSeed()).toBe(999);
    });
  });

  describe('next()', () => {
    it('should return values between 0 and 1', () => {
      service.setSeed(12345);
      for (let i = 0; i < 100; i++) {
        const value = service.next();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });

    it('should generate different values in sequence', () => {
      service.setSeed(12345);
      const values = new Set([
        service.next(),
        service.next(),
        service.next(),
        service.next(),
        service.next(),
      ]);
      // Should have multiple unique values (extremely unlikely to be all same)
      expect(values.size).toBeGreaterThan(1);
    });
  });

  describe('nextInt()', () => {
    it('should return integers in the specified range', () => {
      service.setSeed(12345);
      for (let i = 0; i < 100; i++) {
        const value = service.nextInt(1, 10);
        expect(value).toBeGreaterThanOrEqual(1);
        expect(value).toBeLessThanOrEqual(10);
        expect(Number.isInteger(value)).toBe(true);
      }
    });

    it('should return min when min equals max', () => {
      service.setSeed(12345);
      const value = service.nextInt(5, 5);
      expect(value).toBe(5);
    });

    it('should produce deterministic integer sequences', () => {
      service.setSeed(777);
      const sequence1 = [service.nextInt(1, 100), service.nextInt(1, 100), service.nextInt(1, 100)];

      service.setSeed(777);
      const sequence2 = [service.nextInt(1, 100), service.nextInt(1, 100), service.nextInt(1, 100)];

      expect(sequence1).toEqual(sequence2);
    });

    it('should cover the full range over many samples', () => {
      service.setSeed(42);
      const values = new Set<number>();
      for (let i = 0; i < 1000; i++) {
        values.add(service.nextInt(1, 10));
      }
      // Should see most values in range over 1000 samples
      expect(values.size).toBeGreaterThan(7);
    });
  });

  describe('nextBoolean()', () => {
    it('should return true or false', () => {
      service.setSeed(12345);
      for (let i = 0; i < 20; i++) {
        const value = service.nextBoolean();
        expect(typeof value).toBe('boolean');
      }
    });

    it('should respect probability parameter', () => {
      service.setSeed(12345);
      // With probability 1, should always return true
      for (let i = 0; i < 10; i++) {
        expect(service.nextBoolean(1.0)).toBe(true);
      }

      service.setSeed(12345);
      // With probability 0, should always return false
      for (let i = 0; i < 10; i++) {
        expect(service.nextBoolean(0.0)).toBe(false);
      }
    });

    it('should produce deterministic boolean sequences', () => {
      service.setSeed(555);
      const sequence1 = [service.nextBoolean(), service.nextBoolean(), service.nextBoolean()];

      service.setSeed(555);
      const sequence2 = [service.nextBoolean(), service.nextBoolean(), service.nextBoolean()];

      expect(sequence1).toEqual(sequence2);
    });
  });

  describe('choice()', () => {
    it('should return an element from the array', () => {
      service.setSeed(12345);
      const array = ['a', 'b', 'c', 'd', 'e'];
      for (let i = 0; i < 20; i++) {
        const value = service.choice(array);
        expect(value).toBeDefined();
        expect(array).toContain(value!);
      }
    });

    it('should return undefined for empty array', () => {
      const value = service.choice([]);
      expect(value).toBeUndefined();
    });

    it('should return the only element for single-element array', () => {
      service.setSeed(12345);
      const value = service.choice(['only']);
      expect(value).toBe('only');
    });

    it('should produce deterministic choices', () => {
      const array = [1, 2, 3, 4, 5];

      service.setSeed(333);
      const sequence1 = [service.choice(array), service.choice(array), service.choice(array)];

      service.setSeed(333);
      const sequence2 = [service.choice(array), service.choice(array), service.choice(array)];

      expect(sequence1).toEqual(sequence2);
    });
  });

  describe('shuffle()', () => {
    it('should shuffle array in place', () => {
      service.setSeed(12345);
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const shuffled = service.shuffle([...original]);

      // Should be different order (very unlikely to be same)
      expect(shuffled).not.toEqual(original);
      // Should contain same elements
      expect(shuffled.sort()).toEqual(original.sort());
    });

    it('should produce deterministic shuffle', () => {
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      service.setSeed(999);
      const shuffled1 = service.shuffle([...original]);

      service.setSeed(999);
      const shuffled2 = service.shuffle([...original]);

      expect(shuffled1).toEqual(shuffled2);
    });

    it('should handle empty array', () => {
      const array: number[] = [];
      const result = service.shuffle(array);
      expect(result).toEqual([]);
    });

    it('should handle single element array', () => {
      const array = [42];
      const result = service.shuffle(array);
      expect(result).toEqual([42]);
    });
  });
});
