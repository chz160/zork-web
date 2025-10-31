import { Injectable, inject } from '@angular/core';
import { RandomService } from './random.service';
import { GameObject } from '../models/game-object.model';

/**
 * Options for moveItems operation.
 */
export interface MoveItemsOptions {
  /** Probability that each item will be moved (0-1). If not provided, all items are moved. */
  probability?: number;

  /** Whether to hide moved items (set hidden property to true). */
  hideOnMove?: boolean;

  /** Whether to set touchbit on moved items (marks them as having been interacted with). */
  touchBit?: boolean;
}

/**
 * Result of moveItems operation.
 */
export interface MoveItemsResult {
  /** IDs of items that were successfully moved. */
  movedItemIds: string[];

  /** Whether any items were moved. */
  anyMoved: boolean;
}

/**
 * Service for managing inventory operations including the legacy ROB routine
 * for moving items between locations with probability and invisibility semantics.
 *
 * Based on the legacy ROB, STEAL-JUNK, and ROB-MAZE routines from 1actions.zil.
 */
@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private readonly random = inject(RandomService);

  /**
   * Move items from one location/owner to another with optional probability and hiding.
   * This is the core implementation of the legacy ROB routine.
   *
   * @param itemIds Array of item IDs to potentially move
   * @param toOwnerId Destination owner/location ID (e.g., 'thief', 'round-room', 'inventory')
   * @param items Map of all game objects (to read/update item properties)
   * @param options Options for probability, hiding, and touchbit
   * @returns Result containing moved item IDs and whether any were moved
   */
  moveItems(
    itemIds: string[],
    toOwnerId: string,
    items: Map<string, GameObject>,
    options: MoveItemsOptions = {}
  ): MoveItemsResult {
    const movedItemIds: string[] = [];
    const { probability, hideOnMove = false, touchBit = false } = options;

    for (const itemId of itemIds) {
      const item = items.get(itemId);
      if (!item) {
        continue;
      }

      // Check probability if specified
      if (probability !== undefined && !this.random.nextBoolean(probability)) {
        continue;
      }

      // Move the item by updating its location
      item.location = toOwnerId;

      // Set touchbit if requested
      if (touchBit) {
        item.properties = {
          ...item.properties,
          touched: true,
        };
      }

      // Hide the item if requested (legacy INVISIBLE flag)
      if (hideOnMove) {
        item.visible = false;
      }

      movedItemIds.push(itemId);
    }

    return {
      movedItemIds,
      anyMoved: movedItemIds.length > 0,
    };
  }

  /**
   * Steal worthless items from a room (legacy STEAL-JUNK routine).
   *
   * Steals items that:
   * - Have value == 0 (worthless)
   * - Are takeable (portable)
   * - Are not sacred
   * - Are not already invisible
   * - Pass a 30% probability check (or 100% for stiletto)
   *
   * @param roomId Room ID to steal from
   * @param items Map of all game objects
   * @param playerRoomId Current player room ID (for messages)
   * @returns Result containing stolen item IDs and whether any were stolen
   */
  stealJunk(
    roomId: string,
    items: Map<string, GameObject>,
    _playerRoomId?: string
  ): MoveItemsResult {
    const eligibleItems: string[] = [];

    // Find all eligible items in the room
    for (const [itemId, item] of items) {
      if (item.location !== roomId) {
        continue;
      }

      // Check if item is already invisible
      if (!item.visible) {
        continue;
      }

      // Check if item is sacred
      if (item.properties?.['isSacred']) {
        continue;
      }

      // Check if item is takeable
      if (!item.portable) {
        continue;
      }

      // Check if item is worthless (value == 0 or undefined)
      const value = item.properties?.['value'] ?? 0;
      if (value !== 0) {
        continue;
      }

      // Special case: stiletto is always stolen if present
      if (itemId === 'stiletto') {
        eligibleItems.push(itemId);
        continue;
      }

      // Otherwise, 30% probability (PROB 30 in legacy = 30/100 = 0.3)
      if (this.random.nextBoolean(0.3)) {
        eligibleItems.push(itemId);
      }
    }

    // Move eligible items to thief with hiding
    return this.moveItems(eligibleItems, 'thief', items, {
      hideOnMove: true,
      touchBit: true,
    });
  }

  /**
   * Rob items from a maze room (legacy ROB-MAZE variant).
   * Similar to stealJunk but may have different selection criteria.
   *
   * @param roomId Room ID to rob from
   * @param items Map of all game objects
   * @param playerRoomId Current player room ID (for messages)
   * @returns Result containing stolen item IDs and whether any were stolen
   */
  robMaze(roomId: string, items: Map<string, GameObject>, _playerRoomId?: string): MoveItemsResult {
    // For now, robMaze uses the same logic as stealJunk
    // The legacy ROB-MAZE had similar logic but in maze context
    return this.stealJunk(roomId, items, _playerRoomId);
  }
}
