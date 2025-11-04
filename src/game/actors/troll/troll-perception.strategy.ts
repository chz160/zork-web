/**
 * Strategy for troll perception logic.
 * Determines when the troll "sees" or "hears" the player and items.
 *
 * Responsibilities:
 * - Detect player presence in same room
 * - Detect items being offered or thrown
 * - Determine line-of-sight for combat
 */
export class TrollPerceptionStrategy {
  /**
   * Check if troll can perceive the player.
   * In troll-room, the troll always perceives the player.
   *
   * @param trollLocationId Current location of the troll
   * @param playerLocationId Current location of the player
   * @returns True if troll perceives player
   */
  canPerceivePlayer(trollLocationId: string | null, playerLocationId: string): boolean {
    if (!trollLocationId) {
      return false;
    }
    // Troll perceives player when in same room
    return trollLocationId === playerLocationId;
  }

  /**
   * Check if troll can perceive an item being offered.
   * Requires player and troll to be in same room.
   *
   * @param trollLocationId Current location of the troll
   * @param playerLocationId Current location of the player
   * @param itemLocationId Current location of the item
   * @returns True if troll can perceive the item offer
   */
  canPerceiveItemOffer(
    trollLocationId: string | null,
    playerLocationId: string,
    itemLocationId: string
  ): boolean {
    if (!trollLocationId) {
      return false;
    }

    // Player must be in same room as troll
    if (trollLocationId !== playerLocationId) {
      return false;
    }

    // Item must be with player or in the room
    return itemLocationId === playerLocationId || itemLocationId === 'player';
  }

  /**
   * Check if player is attempting to pass through a blocked passage.
   *
   * @param trollLocationId Current location of the troll
   * @param playerLocationId Current location before move
   * @param destinationId Target location
   * @param blockedExits Array of exit IDs that troll blocks
   * @returns True if player is attempting to use a blocked exit
   */
  isPlayerAttemptingBlockedPassage(
    trollLocationId: string | null,
    playerLocationId: string,
    destinationId: string,
    blockedExits: string[]
  ): boolean {
    if (!trollLocationId) {
      return false;
    }

    // Player must be in same room as troll
    if (trollLocationId !== playerLocationId) {
      return false;
    }

    // Check if destination is one of the blocked exits
    return blockedExits.includes(destinationId);
  }

  /**
   * Determine appropriate response distance.
   * For the troll, this is simple: same room or not.
   *
   * @param trollLocationId Current location of the troll
   * @param targetLocationId Location to check distance to
   * @returns 'same-room' | 'adjacent' | 'far'
   */
  getDistance(trollLocationId: string | null, targetLocationId: string): string {
    if (!trollLocationId) {
      return 'far';
    }

    if (trollLocationId === targetLocationId) {
      return 'same-room';
    }

    // For simplicity, troll only cares about same-room interactions
    return 'far';
  }
}
