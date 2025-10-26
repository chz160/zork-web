import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameEngineService } from '../../core/services/game-engine.service';
import { GameObject } from '../../core/models';

/**
 * InventoryComponent displays the player's carried items and allows interaction.
 *
 * Features:
 * - Displays all items in player inventory with reactive updates
 * - Click/tap on items to view details and available actions
 * - Action handlers: drop, examine, use
 * - Accessible keyboard navigation (Tab, Enter, Arrow keys)
 * - Responsive design with collapsible panel
 * - Classic Zork terminal aesthetic
 *
 * Usage:
 * ```html
 * <app-inventory />
 * ```
 *
 * Accessibility:
 * - role="region" with proper ARIA labels
 * - Keyboard navigation support
 * - Focus management for item selection
 * - Screen reader announcements
 */
@Component({
  selector: 'app-inventory',
  imports: [CommonModule],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryComponent {
  private readonly gameEngine = inject(GameEngineService);

  /** Whether the inventory panel is expanded */
  readonly isExpanded = signal<boolean>(true);

  /** Currently selected item for detail view */
  readonly selectedItem = signal<GameObject | null>(null);

  /** Player state from game engine */
  private readonly player = this.gameEngine.player;

  /** Computed list of inventory items with full object details */
  readonly inventoryItems = computed(() => {
    const inventoryIds = this.player().inventory;
    return inventoryIds
      .map((id) => this.gameEngine.getObject(id))
      .filter((obj): obj is GameObject => obj !== null);
  });

  /** Computed count of items for display */
  readonly itemCount = computed(() => this.inventoryItems().length);

  /** Whether inventory is empty */
  readonly isEmpty = computed(() => this.itemCount() === 0);

  /**
   * Toggle inventory panel expanded/collapsed state
   */
  toggleExpanded(): void {
    this.isExpanded.set(!this.isExpanded());
  }

  /**
   * Select an item to view details
   */
  selectItem(item: GameObject): void {
    this.selectedItem.set(item);
  }

  /**
   * Clear item selection
   */
  clearSelection(): void {
    this.selectedItem.set(null);
  }

  /**
   * Handle drop action for selected item
   */
  dropItem(item: GameObject): void {
    this.gameEngine.executeCommand({
      isValid: true,
      verb: 'drop',
      directObject: item.name,
      indirectObject: null,
      preposition: null,
      rawInput: `drop ${item.name}`,
    });
    this.clearSelection();
  }

  /**
   * Handle examine action for selected item
   */
  examineItem(item: GameObject): void {
    this.gameEngine.executeCommand({
      isValid: true,
      verb: 'examine',
      directObject: item.name,
      indirectObject: null,
      preposition: null,
      rawInput: `examine ${item.name}`,
    });
    // Keep selection open to see description in console
  }

  /**
   * Handle use action for selected item
   */
  useItem(item: GameObject): void {
    this.gameEngine.executeCommand({
      isValid: true,
      verb: 'use',
      directObject: item.name,
      indirectObject: null,
      preposition: null,
      rawInput: `use ${item.name}`,
    });
    // Keep selection open to see result in console
  }

  /**
   * Get available actions for an item based on its properties
   */
  getAvailableActions(item: GameObject): string[] {
    const actions: string[] = ['examine', 'drop'];

    // Add action-specific actions based on item properties
    if (item.properties?.isLight) {
      actions.push(item.properties.isLit ? 'extinguish' : 'light');
    }
    if (item.properties?.isReadable || item.properties?.readText) {
      actions.push('read');
    }
    if (item.properties?.isFood || item.properties?.edible) {
      actions.push('eat');
    }
    if (item.properties?.isWeapon) {
      actions.push('attack with');
    }
    if (item.properties?.isTool) {
      actions.push('use');
    }

    return actions;
  }

  /**
   * Execute an action on the selected item
   */
  executeAction(item: GameObject, action: string): void {
    switch (action) {
      case 'drop':
        this.dropItem(item);
        break;
      case 'examine':
        this.examineItem(item);
        break;
      case 'use':
        this.useItem(item);
        break;
      case 'light':
        this.gameEngine.executeCommand({
          isValid: true,
          verb: 'light',
          directObject: item.name,
          indirectObject: null,
          preposition: null,
          rawInput: `light ${item.name}`,
        });
        break;
      case 'extinguish':
        this.gameEngine.executeCommand({
          isValid: true,
          verb: 'extinguish',
          directObject: item.name,
          indirectObject: null,
          preposition: null,
          rawInput: `extinguish ${item.name}`,
        });
        break;
      case 'read':
        this.gameEngine.executeCommand({
          isValid: true,
          verb: 'read',
          directObject: item.name,
          indirectObject: null,
          preposition: null,
          rawInput: `read ${item.name}`,
        });
        break;
      default:
        // Generic use for other actions
        this.useItem(item);
        break;
    }
  }

  /**
   * Handle keyboard navigation in item list
   */
  onKeyDown(event: KeyboardEvent, item: GameObject, index: number): void {
    const items = this.inventoryItems();

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.selectItem(item);
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (index < items.length - 1) {
          const nextElement = document.querySelector(
            `[data-item-index="${index + 1}"]`
          ) as HTMLElement;
          nextElement?.focus();
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (index > 0) {
          const prevElement = document.querySelector(
            `[data-item-index="${index - 1}"]`
          ) as HTMLElement;
          prevElement?.focus();
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.clearSelection();
        break;
    }
  }

  /**
   * Track by function for ngFor optimization
   */
  trackById(_index: number, item: GameObject): string {
    return item.id;
  }

  /**
   * Get ARIA label for inventory panel
   */
  getAriaLabel(): string {
    const count = this.itemCount();
    return `Inventory panel - ${count} ${count === 1 ? 'item' : 'items'}`;
  }

  /**
   * Get display text for empty inventory
   */
  getEmptyMessage(): string {
    return 'You are empty-handed.';
  }
}
