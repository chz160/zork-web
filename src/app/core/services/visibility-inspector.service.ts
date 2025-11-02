import { Injectable } from '@angular/core';
import { GameObject } from '../models/game-object.model';

/**
 * Information about an item's visibility state.
 */
export interface VisibilityInfo {
  /** Item ID */
  id: string;

  /** Item name */
  name: string;

  /** Current location */
  location: string;

  /** Whether item.visible is true */
  visible: boolean;

  /** Whether item.hidden is true */
  hidden: boolean;

  /** Whether item has been touched (touchbit) */
  touched: boolean;

  /** Visibility conditions if any */
  visibleFor?: string[];

  /** Computed visibility state for developer inspection */
  effectiveVisibility: 'visible' | 'invisible' | 'hidden' | 'conditional';

  /** Human-readable explanation of visibility state */
  explanation: string;
}

/**
 * Developer service for inspecting and debugging item visibility.
 *
 * Purpose:
 * Provides tools for developers to inspect item visibility state, understand
 * why items are hidden or invisible, and debug visibility-related issues.
 *
 * Usage context:
 * - Dev mode inspection commands
 * - Debugging tools
 * - Test utilities
 *
 * Based on legacy INVISIBLE and TOUCHBIT flags from Zork I source.
 */
@Injectable({
  providedIn: 'root',
})
export class VisibilityInspectorService {
  /**
   * Get detailed visibility information for a specific item.
   *
   * @param item - The game object to inspect
   * @returns Detailed visibility information
   */
  inspectItem(item: GameObject): VisibilityInfo {
    const touched = item.properties?.touched ?? false;
    const hidden = item.hidden ?? false;
    const hasConditions = item.visibleFor !== undefined && item.visibleFor.length > 0;

    let effectiveVisibility: VisibilityInfo['effectiveVisibility'];
    let explanation: string;

    if (hidden) {
      effectiveVisibility = 'hidden';
      explanation = 'Item is explicitly hidden (puzzle/secret mechanic)';
    } else if (!item.visible) {
      effectiveVisibility = 'invisible';
      explanation = touched
        ? 'Item is invisible (likely stolen by thief or moved by game mechanics)'
        : 'Item is invisible (game state)';
    } else if (hasConditions) {
      effectiveVisibility = 'conditional';
      explanation = `Item visibility is conditional on: ${item.visibleFor?.join(', ')}`;
    } else {
      effectiveVisibility = 'visible';
      explanation = 'Item is visible normally';
    }

    return {
      id: item.id,
      name: item.name,
      location: item.location,
      visible: item.visible,
      hidden,
      touched,
      visibleFor: item.visibleFor,
      effectiveVisibility,
      explanation,
    };
  }

  /**
   * Get all invisible or hidden items from a collection.
   *
   * @param items - Map of all game objects
   * @param includeHidden - Whether to include explicitly hidden items
   * @returns Array of visibility information for non-visible items
   */
  findInvisibleItems(items: Map<string, GameObject>, includeHidden = true): VisibilityInfo[] {
    const invisibleItems: VisibilityInfo[] = [];

    for (const item of items.values()) {
      const info = this.inspectItem(item);

      // Skip visible items or hidden items when not requested
      if (
        info.effectiveVisibility === 'visible' ||
        (info.effectiveVisibility === 'hidden' && !includeHidden)
      ) {
        continue;
      }

      invisibleItems.push(info);
    }

    return invisibleItems;
  }

  /**
   * Get all items in a specific location with their visibility state.
   *
   * @param items - Map of all game objects
   * @param locationId - Location ID to inspect
   * @returns Array of visibility information for items at location
   */
  inspectLocation(items: Map<string, GameObject>, locationId: string): VisibilityInfo[] {
    const locationItems: VisibilityInfo[] = [];

    for (const item of items.values()) {
      if (item.location === locationId) {
        locationItems.push(this.inspectItem(item));
      }
    }

    return locationItems;
  }

  /**
   * Get items that have been touched (touchbit set).
   * Used for debugging thief stealing mechanics.
   *
   * @param items - Map of all game objects
   * @returns Array of visibility information for touched items
   */
  findTouchedItems(items: Map<string, GameObject>): VisibilityInfo[] {
    const touchedItems: VisibilityInfo[] = [];

    for (const item of items.values()) {
      if (item.properties?.touched) {
        touchedItems.push(this.inspectItem(item));
      }
    }

    return touchedItems;
  }

  /**
   * Format visibility info for display in debug console.
   *
   * @param info - Visibility information to format
   * @returns Formatted string for console display
   */
  formatForConsole(info: VisibilityInfo): string {
    const parts = [
      `${info.name} (${info.id})`,
      `  Location: ${info.location}`,
      `  Status: ${info.effectiveVisibility.toUpperCase()}`,
      `  Flags: visible=${info.visible}, hidden=${info.hidden}, touched=${info.touched}`,
    ];

    if (info.visibleFor && info.visibleFor.length > 0) {
      parts.push(`  Conditions: ${info.visibleFor.join(', ')}`);
    }

    parts.push(`  ${info.explanation}`);

    return parts.join('\n');
  }

  /**
   * Format multiple visibility infos for display in debug console.
   *
   * @param infos - Array of visibility information to format
   * @param title - Optional title for the list
   * @returns Formatted string for console display
   */
  formatListForConsole(infos: VisibilityInfo[], title?: string): string {
    if (infos.length === 0) {
      return title ? `${title}\n(none)` : '(none)';
    }

    const formattedItems = infos.map((info) => this.formatForConsole(info)).join('\n\n');

    return title ? `${title}\n\n${formattedItems}` : formattedItems;
  }
}
