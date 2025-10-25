import { Injectable, inject } from '@angular/core';
import { GameObject } from '../models';
import { ObjectCandidate } from '../models/parser-result.model';
import { findMatches, FuzzyMatchResult } from '../utils/fuzzy-matcher';
import { CommandConfigService } from './command-config.service';

/**
 * Context for object resolution
 */
export interface ResolutionContext {
  /** Objects in the current room */
  roomObjects: GameObject[];

  /** Objects in the player's inventory */
  inventoryObjects: GameObject[];

  /** All available objects in the game */
  allObjects?: GameObject[];

  /** Last referenced object for pronoun resolution */
  lastReferencedObject?: GameObject;
}

/**
 * Result of object resolution with candidates and metadata
 */
export interface ResolutionResult {
  /** Whether a unique object was found */
  isResolved: boolean;

  /** The resolved object (if unique) */
  resolvedObject?: GameObject;

  /** List of candidate objects when ambiguous */
  candidates: ObjectCandidate[];

  /** Whether disambiguation is needed */
  needsDisambiguation: boolean;

  /** Fuzzy match that was applied (if any) */
  fuzzyMatch?: FuzzyMatchResult;

  /** Original query phrase */
  query: string;
}

/**
 * Service for resolving object references to game objects.
 * Handles fuzzy matching, disambiguation, ordinal selection, and ranking.
 *
 * This is the core object resolution logic used by the parser to turn
 * player input phrases into concrete GameObject references.
 */
@Injectable({
  providedIn: 'root',
})
export class ObjectResolverService {
  private readonly configService = inject(CommandConfigService);

  /**
   * Resolve an object phrase to one or more candidate game objects.
   *
   * @param phrase The object phrase from player input (e.g., "lamp", "brass lantern", "2nd coin")
   * @param context The current game context with available objects
   * @returns Resolution result with candidates and metadata
   */
  resolve(phrase: string, context: ResolutionContext): ResolutionResult {
    if (!phrase || phrase.trim().length === 0) {
      return {
        isResolved: false,
        candidates: [],
        needsDisambiguation: false,
        query: phrase,
      };
    }

    const normalizedPhrase = phrase.trim().toLowerCase();

    // Check for ordinal selection (e.g., "1st lamp", "2nd coin", "third key")
    const ordinalMatch = this.extractOrdinal(normalizedPhrase);
    if (ordinalMatch) {
      return this.resolveWithOrdinal(ordinalMatch.basePhrase, ordinalMatch.ordinal, context);
    }

    // Build list of searchable objects (room + inventory first, then all)
    const searchableObjects = [
      ...context.roomObjects,
      ...context.inventoryObjects,
      ...(context.allObjects?.filter(
        (obj) =>
          !context.roomObjects.some((r) => r.id === obj.id) &&
          !context.inventoryObjects.some((i) => i.id === obj.id)
      ) || []),
    ];

    // Try exact match first
    const exactMatches = searchableObjects.filter((obj) => {
      return (
        obj.id.toLowerCase() === normalizedPhrase ||
        obj.name.toLowerCase() === normalizedPhrase ||
        obj.aliases?.some((alias) => alias.toLowerCase() === normalizedPhrase)
      );
    });

    if (exactMatches.length === 1) {
      return {
        isResolved: true,
        resolvedObject: exactMatches[0],
        candidates: [this.objectToCandidate(exactMatches[0], 1.0)],
        needsDisambiguation: false,
        query: phrase,
      };
    }

    if (exactMatches.length > 1) {
      return {
        isResolved: false,
        candidates: this.rankCandidates(exactMatches, normalizedPhrase, context),
        needsDisambiguation: true,
        query: phrase,
      };
    }

    // Try fuzzy matching
    const fuzzyResult = this.fuzzyMatch(normalizedPhrase, searchableObjects, context);
    return fuzzyResult;
  }

  /**
   * Extract ordinal from phrase (e.g., "1st lamp" -> { basePhrase: "lamp", ordinal: 1 })
   */
  private extractOrdinal(phrase: string): { basePhrase: string; ordinal: number } | null {
    // Match patterns like "1st", "2nd", "3rd", "4th", etc. or "first", "second", "third", etc.
    const ordinalPattern = /^(\d+)(st|nd|rd|th)\s+(.+)$/i;
    const wordOrdinalPattern =
      /^(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)\s+(.+)$/i;

    const numericMatch = phrase.match(ordinalPattern);
    if (numericMatch) {
      return {
        basePhrase: numericMatch[3],
        ordinal: parseInt(numericMatch[1], 10),
      };
    }

    const wordMatch = phrase.match(wordOrdinalPattern);
    if (wordMatch) {
      const ordinalMap: Record<string, number> = {
        first: 1,
        second: 2,
        third: 3,
        fourth: 4,
        fifth: 5,
        sixth: 6,
        seventh: 7,
        eighth: 8,
        ninth: 9,
        tenth: 10,
      };
      return {
        basePhrase: wordMatch[2],
        ordinal: ordinalMap[wordMatch[1].toLowerCase()],
      };
    }

    return null;
  }

  /**
   * Resolve with ordinal selection
   */
  private resolveWithOrdinal(
    basePhrase: string,
    ordinal: number,
    context: ResolutionContext
  ): ResolutionResult {
    // Find all matching objects
    const allMatches = this.findAllMatches(basePhrase, [
      ...context.roomObjects,
      ...context.inventoryObjects,
    ]);

    if (ordinal <= 0 || ordinal > allMatches.length) {
      return {
        isResolved: false,
        candidates: allMatches.map((obj, idx) => this.objectToCandidate(obj, 1.0, idx + 1)),
        needsDisambiguation: allMatches.length > 0,
        query: `${ordinal}${this.getOrdinalSuffix(ordinal)} ${basePhrase}`,
      };
    }

    const selectedObject = allMatches[ordinal - 1];
    return {
      isResolved: true,
      resolvedObject: selectedObject,
      candidates: [this.objectToCandidate(selectedObject, 1.0)],
      needsDisambiguation: false,
      query: `${ordinal}${this.getOrdinalSuffix(ordinal)} ${basePhrase}`,
    };
  }

  /**
   * Find all objects matching a phrase
   */
  private findAllMatches(phrase: string, objects: GameObject[]): GameObject[] {
    const normalized = phrase.toLowerCase();
    return objects.filter((obj) => {
      return (
        obj.name.toLowerCase().includes(normalized) ||
        obj.id.toLowerCase().includes(normalized) ||
        obj.aliases?.some((alias) => alias.toLowerCase().includes(normalized))
      );
    });
  }

  /**
   * Perform fuzzy matching on objects
   */
  private fuzzyMatch(
    phrase: string,
    objects: GameObject[],
    context: ResolutionContext
  ): ResolutionResult {
    const config = this.configService.getSettings();

    // Build candidate names for fuzzy matching
    const candidateNames: string[] = [];
    const objectMap = new Map<string, GameObject>();

    objects.forEach((obj) => {
      // Add object ID
      candidateNames.push(obj.id);
      objectMap.set(obj.id.toLowerCase(), obj);

      // Add object name
      candidateNames.push(obj.name);
      objectMap.set(obj.name.toLowerCase(), obj);

      // Also add aliases
      obj.aliases?.forEach((alias) => {
        candidateNames.push(alias);
        objectMap.set(alias.toLowerCase(), obj);
      });
    });

    // Use fuzzy matcher
    const fuzzyMatches = findMatches(
      phrase,
      candidateNames,
      config.fuzzyMatchThreshold,
      config.maxDisambiguationCandidates
    );

    if (fuzzyMatches.length === 0) {
      return {
        isResolved: false,
        candidates: [],
        needsDisambiguation: false,
        query: phrase,
      };
    }

    // Convert fuzzy matches to object candidates
    const candidates: ObjectCandidate[] = fuzzyMatches
      .map((match) => {
        const obj = objectMap.get(match.matched.toLowerCase());
        if (!obj) return null;
        return this.objectToCandidate(obj, match.score);
      })
      .filter((c): c is ObjectCandidate => c !== null);

    // Remove duplicates (same object matched by different names/aliases)
    const uniqueCandidates = this.deduplicateCandidates(candidates);

    // Rank by context (prefer room objects over inventory over others)
    const rankedCandidates = this.rankCandidates(
      uniqueCandidates.map((c) => objects.find((o) => o.id === c.id)!),
      phrase,
      context
    );

    const bestMatch = fuzzyMatches[0];

    if (rankedCandidates.length === 1) {
      return {
        isResolved: true,
        resolvedObject: objects.find((o) => o.id === rankedCandidates[0].id),
        candidates: rankedCandidates,
        needsDisambiguation: false,
        fuzzyMatch: bestMatch,
        query: phrase,
      };
    }

    return {
      isResolved: false,
      candidates: rankedCandidates,
      needsDisambiguation: true,
      fuzzyMatch: bestMatch,
      query: phrase,
    };
  }

  /**
   * Rank candidates by context priority and similarity
   */
  private rankCandidates(
    objects: GameObject[],
    phrase: string,
    context: ResolutionContext
  ): ObjectCandidate[] {
    return objects
      .map((obj) => {
        let score = 0.5; // Base score

        // Boost for room objects (most accessible)
        if (context.roomObjects.some((r) => r.id === obj.id)) {
          score += 0.3;
        }

        // Boost for inventory objects
        if (context.inventoryObjects.some((i) => i.id === obj.id)) {
          score += 0.2;
        }

        // Boost for exact name match
        if (obj.name.toLowerCase() === phrase.toLowerCase()) {
          score += 0.3;
        }

        return this.objectToCandidate(obj, Math.min(1.0, score));
      })
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Convert GameObject to ObjectCandidate
   */
  private objectToCandidate(obj: GameObject, score: number, _ordinal?: number): ObjectCandidate {
    return {
      id: obj.id,
      displayName: obj.name,
      score,
      context: obj.description,
    };
  }

  /**
   * Remove duplicate candidates (same object ID)
   */
  private deduplicateCandidates(candidates: ObjectCandidate[]): ObjectCandidate[] {
    const seen = new Set<string>();
    return candidates.filter((c) => {
      if (seen.has(c.id)) {
        return false;
      }
      seen.add(c.id);
      return true;
    });
  }

  /**
   * Get ordinal suffix (1st, 2nd, 3rd, etc.)
   */
  private getOrdinalSuffix(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  }
}
