/**
 * Represents the player's current state.
 */
export interface Player {
  /** Current room ID where the player is located */
  currentRoomId: string;

  /** IDs of objects in the player's inventory */
  inventory: string[];

  /** Player's current score */
  score: number;

  /** Number of moves/turns taken */
  moveCount: number;

  /** Whether the player is alive */
  isAlive: boolean;

  /** Custom flags for tracking game state */
  flags: Map<string, boolean>;
}
