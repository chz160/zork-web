import { Injectable } from '@angular/core';
import { GameObject } from '../models/game-object.model';

/**
 * Result of a light state update operation.
 */
export interface LightUpdateResult {
  /** Whether the player/room is currently lit */
  isLit: boolean;

  /** Whether the lighting state changed from the previous check */
  stateChanged: boolean;

  /** Whether the player went from lit to unlit (left in the dark) */
  leftInDark: boolean;

  /** Optional message to display (e.g., "The thief seems to have left you in the dark.") */
  message?: string;
}

/**
 * Service for managing lighting state in the game.
 * Implements the legacy STOLE-LIGHT? and LIT? semantics.
 *
 * Based on:
 * - STOLE-LIGHT? routine from 1actions.zil line ~1875
 * - LIT? routine from gparser.zil
 *
 * The legacy STOLE-LIGHT? routine:
 * 1. Saves the old LIT state
 * 2. Recalculates LIT based on current room and inventory
 * 3. If player went from lit to unlit, prints "The thief seems to have left you in the dark."
 */
@Injectable({
  providedIn: 'root',
})
export class LightService {
  /**
   * Check if the player currently has light.
   * A player has light if they possess at least one lit light source.
   *
   * @param playerInventory Array of item IDs in player's inventory
   * @param items Map of all game objects
   * @returns true if player has at least one lit light source
   */
  isPlayerLit(playerInventory: string[], items: Map<string, GameObject>): boolean {
    for (const itemId of playerInventory) {
      const item = items.get(itemId);
      if (item && item.properties?.isLight && item.properties?.isLit) {
        return true;
      }
    }
    return false;
  }

  /**
   * Update the player's lighting state after items have been moved.
   * This implements the STOLE-LIGHT? routine semantics.
   *
   * @param previousLit Whether the player was lit before the change
   * @param playerInventory Current player inventory (after the change)
   * @param items Map of all game objects
   * @returns Result containing new lit state, whether it changed, and optional message
   */
  updatePlayerLight(
    previousLit: boolean,
    playerInventory: string[],
    items: Map<string, GameObject>
  ): LightUpdateResult {
    const currentLit = this.isPlayerLit(playerInventory, items);
    const stateChanged = previousLit !== currentLit;
    const leftInDark = previousLit && !currentLit;

    return {
      isLit: currentLit,
      stateChanged,
      leftInDark,
      message: leftInDark ? 'The thief seems to have left you in the dark.' : undefined,
    };
  }

  /**
   * Check if a specific item is a lit light source.
   *
   * @param itemId ID of the item to check
   * @param items Map of all game objects
   * @returns true if the item is a lit light source
   */
  isLitLightSource(itemId: string, items: Map<string, GameObject>): boolean {
    const item = items.get(itemId);
    return !!(item && item.properties?.isLight && item.properties?.isLit);
  }
}
