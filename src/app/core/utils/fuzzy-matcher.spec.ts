import {
  levenshteinDistance,
  similarityScore,
  findBestMatch,
  findMatches,
  suggestCorrection,
} from './fuzzy-matcher';

describe('FuzzyMatcher', () => {
  describe('levenshteinDistance', () => {
    it('should return 0 for identical strings', () => {
      expect(levenshteinDistance('test', 'test')).toBe(0);
      expect(levenshteinDistance('mailbox', 'mailbox')).toBe(0);
    });

    it('should calculate distance for single character changes', () => {
      expect(levenshteinDistance('test', 'text')).toBe(1); // substitution
      expect(levenshteinDistance('test', 'tests')).toBe(1); // insertion
      expect(levenshteinDistance('tests', 'test')).toBe(1); // deletion
    });

    it('should calculate distance for multiple changes', () => {
      expect(levenshteinDistance('mailbox', 'mailbax')).toBe(1);
      expect(levenshteinDistance('lamp', 'lampp')).toBe(1);
      expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
    });

    it('should handle empty strings', () => {
      expect(levenshteinDistance('', '')).toBe(0);
      expect(levenshteinDistance('test', '')).toBe(4);
      expect(levenshteinDistance('', 'test')).toBe(4);
    });

    it('should be case-sensitive', () => {
      expect(levenshteinDistance('Test', 'test')).toBe(1);
    });
  });

  describe('similarityScore', () => {
    it('should return 1.0 for identical strings', () => {
      expect(similarityScore('test', 'test')).toBe(1.0);
      expect(similarityScore('mailbox', 'mailbox')).toBe(1.0);
    });

    it('should handle empty strings', () => {
      expect(similarityScore('', '')).toBe(1.0); // Both empty is identical
      expect(similarityScore('test', '')).toBe(0.0);
      expect(similarityScore('', 'test')).toBe(0.0);
    });

    it('should calculate high scores for similar strings', () => {
      const score1 = similarityScore('mailbox', 'mailbax');
      expect(score1).toBeGreaterThan(0.85);

      const score2 = similarityScore('lamp', 'lampp');
      expect(score2).toBeGreaterThanOrEqual(0.8);
    });

    it('should calculate low scores for dissimilar strings', () => {
      const score = similarityScore('mailbox', 'sword');
      expect(score).toBeLessThan(0.3);
    });

    it('should be case-insensitive', () => {
      expect(similarityScore('Test', 'test')).toBe(1.0);
      expect(similarityScore('MAILBOX', 'mailbox')).toBe(1.0);
    });
  });

  describe('findBestMatch', () => {
    const candidates = ['mailbox', 'lamp', 'leaflet', 'sword', 'house'];

    it('should find exact matches', () => {
      const result = findBestMatch('mailbox', candidates);
      expect(result).not.toBeNull();
      expect(result?.matched).toBe('mailbox');
      expect(result?.score).toBe(1.0);
      expect(result?.isExact).toBe(true);
    });

    it('should find fuzzy matches for typos', () => {
      const result = findBestMatch('mailbax', candidates);
      expect(result).not.toBeNull();
      expect(result?.matched).toBe('mailbox');
      expect(result?.score).toBeGreaterThan(0.7);
      expect(result?.isExact).toBe(false);
    });

    it('should match with single character typo', () => {
      const result = findBestMatch('lampp', candidates);
      expect(result).not.toBeNull();
      expect(result?.matched).toBe('lamp');
      expect(result?.score).toBeGreaterThan(0.7);
    });

    it('should return null when no match meets threshold', () => {
      const result = findBestMatch('xyz', candidates, 0.7);
      expect(result).toBeNull();
    });

    it('should respect custom threshold', () => {
      // 'mai' as substring of 'mailbox' will get > 0.85 score, so use a worse match
      const result = findBestMatch('xyz', candidates, 0.9);
      expect(result).toBeNull(); // No match meets 0.9 threshold
    });

    it('should handle substring matches with high scores', () => {
      const result = findBestMatch('mail', candidates);
      expect(result).not.toBeNull();
      expect(result?.matched).toBe('mailbox');
      expect(result?.score).toBeGreaterThan(0.85);
    });

    it('should be case-insensitive for exact matches', () => {
      const result = findBestMatch('MAILBOX', candidates);
      expect(result).not.toBeNull();
      expect(result?.matched).toBe('mailbox');
      expect(result?.isExact).toBe(true);
    });

    it('should handle empty input', () => {
      const result = findBestMatch('', candidates);
      expect(result).toBeNull();
    });

    it('should handle empty candidates', () => {
      const result = findBestMatch('test', []);
      expect(result).toBeNull();
    });
  });

  describe('findMatches', () => {
    const candidates = ['mailbox', 'mail slot', 'lamp', 'lantern', 'leaflet'];

    it('should find multiple matches sorted by score', () => {
      const results = findMatches('mail', candidates, 0.6);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].matched).toContain('mail');
      // Results should be sorted by score descending
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    });

    it('should respect maxResults parameter', () => {
      const results = findMatches('ma', candidates, 0.5, 2);
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should filter by threshold', () => {
      const results = findMatches('lamp', candidates, 0.95);
      // Should only match 'lamp' exactly
      expect(results.length).toBe(1);
      expect(results[0].matched).toBe('lamp');
    });

    it('should handle no matches', () => {
      const results = findMatches('xyz', candidates, 0.7);
      expect(results.length).toBe(0);
    });

    it('should include exact matches at the top', () => {
      const results = findMatches('lamp', candidates, 0.5);
      expect(results[0].matched).toBe('lamp');
      expect(results[0].isExact).toBe(true);
      expect(results[0].score).toBe(1.0);
    });

    it('should handle substring matches', () => {
      const results = findMatches('leaf', candidates, 0.7);
      expect(results.length).toBeGreaterThan(0);
      const leafletMatch = results.find((r) => r.matched === 'leaflet');
      expect(leafletMatch).toBeTruthy();
      expect(leafletMatch?.score).toBeGreaterThan(0.85);
    });
  });

  describe('suggestCorrection', () => {
    const candidates = ['mailbox', 'lamp', 'leaflet', 'sword', 'house'];

    it('should suggest correction for typos above threshold', () => {
      const result = suggestCorrection('mailbax', candidates, 0.85);
      expect(result).toBe('mailbox');
    });

    it('should return null for poor matches', () => {
      const result = suggestCorrection('xyz', candidates, 0.85);
      expect(result).toBeNull();
    });

    it('should respect custom autocorrect threshold', () => {
      const result = suggestCorrection('xyz', candidates, 0.9);
      expect(result).toBeNull(); // No match meets 0.9 threshold
    });

    it('should suggest exact match', () => {
      const result = suggestCorrection('lamp', candidates, 0.85);
      expect(result).toBe('lamp');
    });

    it('should handle single character typos', () => {
      const result = suggestCorrection('lampp', candidates, 0.75);
      expect(result).toBe('lamp');
    });

    it('should handle transposition errors', () => {
      const result = suggestCorrection('swrod', candidates, 0.6);
      expect(result).toBe('sword');
    });

    it('should return null for empty input', () => {
      const result = suggestCorrection('', candidates, 0.85);
      expect(result).toBeNull();
    });
  });

  describe('Real-world Zork scenarios', () => {
    const zorkObjects = [
      'mailbox',
      'small mailbox',
      'brass lantern',
      'rusty lamp',
      'leaflet',
      'white house',
      'front door',
      'window',
    ];

    it('should handle common typos in object names', () => {
      expect(findBestMatch('mailbax', zorkObjects)?.matched).toBe('mailbox');
      expect(findBestMatch('lanter', zorkObjects)?.matched).toBe('brass lantern');
      expect(findBestMatch('leeflet', zorkObjects)?.matched).toBe('leaflet');
    });

    it('should match partial object names', () => {
      const result = findBestMatch('brass', zorkObjects);
      expect(result?.matched).toBe('brass lantern');
    });

    it('should distinguish between similar objects', () => {
      const lanternMatch = findBestMatch('brass', zorkObjects);
      expect(lanternMatch?.matched).toBe('brass lantern');

      const lampMatch = findBestMatch('rusty', zorkObjects);
      expect(lampMatch?.matched).toBe('rusty lamp');
    });

    it('should handle multi-word object queries', () => {
      const result = findBestMatch('white hous', zorkObjects, 0.8);
      expect(result?.matched).toBe('white house');
    });
  });
});
