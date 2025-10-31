import { Injectable } from '@angular/core';

/**
 * Deterministic random number generator service.
 * Used for PROB behaviors in actors (like the thief's actions).
 *
 * Supports injectable seed for deterministic testing.
 * Uses a simple Linear Congruential Generator (LCG) algorithm.
 */
@Injectable({
  providedIn: 'root',
})
export class RandomService {
  private seed: number;
  private readonly a = 1103515245;
  private readonly c = 12345;
  private readonly m = 2 ** 31;

  constructor() {
    // Default to current time as seed
    this.seed = Date.now() % this.m;
  }

  /**
   * Set the seed for deterministic random number generation.
   * Useful for testing and replaying game sequences.
   * @param seed The seed value (will be normalized to valid range)
   */
  setSeed(seed: number): void {
    this.seed = Math.abs(seed) % this.m;
  }

  /**
   * Get the current seed value.
   */
  getSeed(): number {
    return this.seed;
  }

  /**
   * Generate the next random number in range [0, 1).
   * @returns A pseudo-random number between 0 (inclusive) and 1 (exclusive)
   */
  next(): number {
    this.seed = (this.a * this.seed + this.c) % this.m;
    return this.seed / this.m;
  }

  /**
   * Generate a random integer in range [min, max] (inclusive).
   * @param min Minimum value (inclusive)
   * @param max Maximum value (inclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Generate a random boolean with the given probability.
   * @param probability Probability of returning true (0-1)
   */
  nextBoolean(probability = 0.5): boolean {
    return this.next() < probability;
  }

  /**
   * Select a random element from an array.
   * @param array The array to select from
   * @returns A random element or undefined if array is empty
   */
  choice<T>(array: T[]): T | undefined {
    if (array.length === 0) {
      return undefined;
    }
    return array[this.nextInt(0, array.length - 1)];
  }

  /**
   * Shuffle an array in place using Fisher-Yates algorithm.
   * @param array The array to shuffle
   * @returns The shuffled array (same reference)
   */
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
