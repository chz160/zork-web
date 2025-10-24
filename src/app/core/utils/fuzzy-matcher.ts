/**
 * Fuzzy string matching utility using Levenshtein distance.
 * Provides typo-tolerant matching and autocorrect suggestions.
 */

/**
 * Result of a fuzzy match with score and matched string
 */
export interface FuzzyMatchResult {
  matched: string;
  score: number;
  isExact: boolean;
}

/**
 * Calculate Levenshtein distance between two strings.
 * Returns the minimum number of single-character edits (insertions, deletions, or substitutions)
 * needed to transform one string into the other.
 *
 * @param a First string
 * @param b Second string
 * @returns The Levenshtein distance
 */
export function levenshteinDistance(a: string, b: string): number {
  const aLen = a.length;
  const bLen = b.length;

  // Create a matrix for dynamic programming
  const matrix: number[][] = Array(aLen + 1)
    .fill(null)
    .map(() => Array(bLen + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= aLen; i++) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= bLen; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= aLen; i++) {
    for (let j = 1; j <= bLen; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[aLen][bLen];
}

/**
 * Calculate a normalized similarity score between two strings.
 * Returns a value between 0 (completely different) and 1 (identical).
 *
 * @param a First string
 * @param b Second string
 * @returns Similarity score from 0 to 1
 */
export function similarityScore(a: string, b: string): number {
  if (a === b) return 1.0;
  if (a.length === 0 && b.length === 0) return 1.0; // Both empty is considered identical
  if (a.length === 0 || b.length === 0) return 0.0;

  const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase());
  const maxLength = Math.max(a.length, b.length);

  return 1 - distance / maxLength;
}

/**
 * Find the best fuzzy match from a list of candidates.
 *
 * @param input The input string to match
 * @param candidates List of candidate strings to match against
 * @param threshold Minimum similarity score to consider (0-1)
 * @returns The best match result, or null if no match meets the threshold
 */
export function findBestMatch(
  input: string,
  candidates: string[],
  threshold = 0.7
): FuzzyMatchResult | null {
  if (!input || candidates.length === 0) {
    return null;
  }

  let bestMatch: FuzzyMatchResult | null = null;
  let bestScore = threshold - 0.001; // Just below threshold to allow >= comparison

  const normalizedInput = input.toLowerCase().trim();

  for (const candidate of candidates) {
    const normalizedCandidate = candidate.toLowerCase().trim();

    // Check for exact match first
    if (normalizedInput === normalizedCandidate) {
      return {
        matched: candidate,
        score: 1.0,
        isExact: true,
      };
    }

    // Check for substring match (higher score)
    if (normalizedCandidate.includes(normalizedInput)) {
      const score = 0.85 + (normalizedInput.length / normalizedCandidate.length) * 0.15;
      if (score >= threshold && score > bestScore) {
        bestMatch = {
          matched: candidate,
          score,
          isExact: false,
        };
        bestScore = score;
      }
      continue;
    }

    // Calculate fuzzy similarity
    const score = similarityScore(normalizedInput, normalizedCandidate);

    if (score >= threshold && score > bestScore) {
      bestMatch = {
        matched: candidate,
        score,
        isExact: false,
      };
      bestScore = score;
    }
  }

  return bestMatch;
}

/**
 * Find all fuzzy matches above a threshold, sorted by score.
 *
 * @param input The input string to match
 * @param candidates List of candidate strings to match against
 * @param threshold Minimum similarity score to consider (0-1)
 * @param maxResults Maximum number of results to return
 * @returns Array of match results, sorted by score (descending)
 */
export function findMatches(
  input: string,
  candidates: string[],
  threshold = 0.7,
  maxResults = 5
): FuzzyMatchResult[] {
  if (!input || candidates.length === 0) {
    return [];
  }

  const normalizedInput = input.toLowerCase().trim();
  const matches: FuzzyMatchResult[] = [];

  for (const candidate of candidates) {
    const normalizedCandidate = candidate.toLowerCase().trim();

    // Check for exact match
    if (normalizedInput === normalizedCandidate) {
      matches.push({
        matched: candidate,
        score: 1.0,
        isExact: true,
      });
      continue;
    }

    // Check for substring match
    if (normalizedCandidate.includes(normalizedInput)) {
      const score = 0.85 + (normalizedInput.length / normalizedCandidate.length) * 0.15;
      if (score >= threshold) {
        matches.push({
          matched: candidate,
          score,
          isExact: false,
        });
      }
      continue;
    }

    // Calculate fuzzy similarity
    const score = similarityScore(normalizedInput, normalizedCandidate);

    if (score >= threshold) {
      matches.push({
        matched: candidate,
        score,
        isExact: false,
      });
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);

  // Return top N results
  return matches.slice(0, maxResults);
}

/**
 * Suggest a correction for a misspelled word.
 * Returns the best match if it meets the autocorrect threshold, otherwise null.
 *
 * @param input The potentially misspelled word
 * @param candidates List of correct words
 * @param autoCorrectThreshold Threshold for automatic correction (0-1)
 * @returns The suggested correction, or null if no good match
 */
export function suggestCorrection(
  input: string,
  candidates: string[],
  autoCorrectThreshold = 0.85
): string | null {
  const match = findBestMatch(input, candidates, autoCorrectThreshold);
  return match ? match.matched : null;
}
