import { Injectable, inject } from '@angular/core';
import { RandomService } from './random.service';
import { TelemetryService } from './telemetry.service';
import { GameObject } from '../models/game-object.model';
import { Actor } from '../models/actor.model';

/**
 * Options for moveItems operation.
 */
export interface MoveItemsOptions {
  /** Probability that each item will be moved (0-1). If not provided, all items are moved. */
  probability?: number;

  /** Whether to hide moved items (set visible to false). */
  hideOnMove?: boolean;

  /** Whether to set touchbit on moved items (marks them as having been interacted with). */
  touchBit?: boolean;

  /**
   * Optional actor to update inventory for when moving items to an actor-based location.
   * When provided, the actor's inventory array will be updated with moved item IDs.
   *
   * **Important**: Caller is responsible for ensuring the `toOwnerId` parameter logically
   * corresponds to this actor (e.g., if actor is thief, toOwnerId should be 'thief').
   * This service does not validate the relationship between toOwnerId and actor.id.
   */
  actor?: Actor;
}

/**
 * Result of moveItems operation.
 */
export interface MoveItemsResult {
  /** IDs of items that were successfully moved. */
  movedItemIds: string[];

  /** Whether any items were moved. */
  anyMoved: boolean;

  /** Whether any lit light sources were moved (for STOLE-LIGHT? integration). */
  stoleLitLight: boolean;
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
  private readonly telemetry = inject(TelemetryService);

  /**
   * Move items from one location/owner to another with optional probability and hiding.
   * This is the core implementation of the legacy ROB routine.
   *
   * When the `actor` option is provided, this method will automatically update the actor's
   * inventory array to include moved item IDs. This ensures consistency between item locations
   * and actor inventory state, preventing the need for manual inventory management.
   *
   * @param itemIds Array of item IDs to potentially move
   * @param toOwnerId Destination owner/location ID (e.g., 'thief', 'round-room', 'inventory')
   * @param items Map of all game objects (to read/update item properties)
   * @param options Options for probability, hiding, touchbit, and actor inventory updates
   * @returns Result containing moved item IDs, whether any were moved, and whether any lit light sources were moved
   *
   * @example
   * // Move items to thief and update thief's inventory
   * const result = inventoryService.moveItems(['lamp', 'sword'], 'thief', items, {
   *   hideOnMove: true,
   *   actor: thiefActor
   * });
   * // thiefActor.inventory now contains ['lamp', 'sword']
   */
  moveItems(
    itemIds: string[],
    toOwnerId: string,
    items: Map<string, GameObject>,
    options: MoveItemsOptions = {}
  ): MoveItemsResult {
    const movedItemIds: string[] = [];
    let stoleLitLight = false;
    const { probability, hideOnMove = false, touchBit = false, actor } = options;

    for (const itemId of itemIds) {
      const item = items.get(itemId);
      if (!item) {
        continue;
      }

      // Check probability if specified
      if (probability !== undefined && !this.random.nextBoolean(probability)) {
        continue;
      }

      // Check if this is a lit light source that will be moved (for STOLE-LIGHT? integration)
      // Note: This check happens after probability check, so only items that will be moved are checked
      if (item.properties?.isLight && item.properties?.isLit) {
        stoleLitLight = true;
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

      // Update actor's inventory if provided
      if (actor && !actor.inventory.includes(itemId)) {
        actor.inventory.push(itemId);
      }
    }

    return {
      movedItemIds,
      anyMoved: movedItemIds.length > 0,
      stoleLitLight,
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
   * - Pass a 10% probability check (or 100% for items in alwaysStealItemIds)
   *
   * @param roomId Room ID to steal from
   * @param items Map of all game objects
   * @param playerRoomId Current player room ID (for messages)
   * @param alwaysStealItemIds Optional array of item IDs that should always be stolen (defaults to ['stiletto'])
   * @param actor Optional actor whose inventory should be updated when items are stolen
   * @returns Result containing stolen item IDs and whether any were stolen
   */
  stealJunk(
    roomId: string,
    items: Map<string, GameObject>,
    _playerRoomId?: string,
    alwaysStealItemIds: string[] = ['stiletto'],
    actor?: Actor
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

      // Only steal worthless items (value must be 0 or undefined)
      const value = item.properties?.['value'] ?? 0;
      const isWorthless = value === 0;
      if (!isWorthless) {
        continue;
      }

      // Special case: some items are always stolen if present (e.g., stiletto)
      if (alwaysStealItemIds.includes(itemId)) {
        eligibleItems.push(itemId);
        continue;
      }

      // Otherwise, 10% probability (PROB 10 in legacy = 10/100 = 0.1)
      if (this.random.nextBoolean(0.1)) {
        eligibleItems.push(itemId);
      }
    }

    // Move eligible items to thief with hiding
    const result = this.moveItems(eligibleItems, 'thief', items, {
      hideOnMove: true,
      touchBit: true,
      actor,
    });

    // Log telemetry for stolen items
    if (result.anyMoved && this.telemetry.isEnabled()) {
      this.telemetry.logItemStolen({
        actorId: 'thief',
        itemIds: result.movedItemIds,
        fromRoomId: roomId,
        toRoomId: 'thief',
        probability: 0.1,
      });
    }

    return result;
  }

  /**
   * Rob items from a maze room (legacy ROB-MAZE variant).
   * Similar to stealJunk but may have different selection criteria.
   *
   * @param roomId Room ID to rob from
   * @param items Map of all game objects
   * @param playerRoomId Current player room ID (for messages)
   * @param alwaysStealItemIds Optional array of item IDs that should always be stolen (defaults to ['stiletto'])
   * @param actor Optional actor whose inventory should be updated when items are stolen
   * @returns Result containing stolen item IDs and whether any were stolen
   */
  robMaze(
    roomId: string,
    items: Map<string, GameObject>,
    _playerRoomId?: string,
    alwaysStealItemIds: string[] = ['stiletto'],
    actor?: Actor
  ): MoveItemsResult {
    // For now, robMaze uses the same logic as stealJunk
    // The legacy ROB-MAZE had similar logic but in maze context
    return this.stealJunk(roomId, items, _playerRoomId, alwaysStealItemIds, actor);
  }

  /**
   * Deposit valuable items (booty) from the thief to a target room.
   * Based on legacy DEPOSIT-BOOTY routine from 1actions.zil (~line 1897).
   *
   * Behavior:
   * - Moves items with value > 0 from thief's inventory to target room
   * - Skips stiletto and large-bag (thief keeps these)
   * - Makes items visible again (clears INVISIBLE flag)
   * - Clears touchbit on moved items
   * - Special handling for egg (opens it if moved)
   *
   * @param thiefInventory Array of item IDs in thief's inventory
   * @param toRoomId Target room ID where items should be deposited
   * @param items Map of all game objects
   * @returns Result containing deposited item IDs and whether any were deposited
   */
  depositBooty(
    thiefInventory: string[],
    toRoomId: string,
    items: Map<string, GameObject>
  ): MoveItemsResult {
    const depositedItemIds: string[] = [];
    let stoleLitLight = false;

    for (const itemId of thiefInventory) {
      const item = items.get(itemId);
      if (!item) {
        continue;
      }

      // Skip stiletto and large-bag (thief keeps these)
      if (itemId === 'stiletto' || itemId === 'large-bag') {
        continue;
      }

      // Only deposit valuable items (value > 0)
      const value = item.properties?.['value'] ?? 0;
      if (value <= 0) {
        continue;
      }

      // Check if this is a lit light source that will be moved
      if (item.properties?.isLight && item.properties?.isLit) {
        stoleLitLight = true;
      }

      // Move the item to the target room
      item.location = toRoomId;

      // Make item visible again (break thief's magic)
      item.visible = true;

      // Clear touchbit
      if (item.properties?.touched) {
        item.properties = {
          ...item.properties,
          touched: false,
        };
      }

      // Special handling for egg: open it when deposited
      if (itemId === 'egg') {
        item.properties = {
          ...item.properties,
          isOpen: true,
        };
      }

      depositedItemIds.push(itemId);
    }

    const result = {
      movedItemIds: depositedItemIds,
      anyMoved: depositedItemIds.length > 0,
      stoleLitLight,
    };

    // Log telemetry for deposited items
    if (result.anyMoved && this.telemetry.isEnabled()) {
      this.telemetry.logItemDeposited({
        actorId: 'thief',
        itemIds: result.movedItemIds,
        fromRoomId: 'thief',
        toRoomId,
      });
    }

    return result;
  }
}
