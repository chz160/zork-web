import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameEngineService } from '../../core/services/game-engine.service';
import { GameObject } from '../../core/models';

/**
 * LocationPanelComponent displays the current room/location with description, objects, and exits.
 *
 * Features:
 * - Displays current room name and description
 * - Shows visible objects in the room
 * - Lists available exits with directions
 * - Updates in real-time as player moves
 * - Responsive and accessible design
 * - Classic Zork terminal aesthetic
 *
 * Usage:
 * ```html
 * <app-location-panel />
 * ```
 *
 * Accessibility:
 * - role="region" with proper ARIA labels
 * - Live region announcements for location changes
 * - High contrast support
 * - Screen reader friendly
 * - Keyboard navigation support
 */
@Component({
  selector: 'app-location-panel',
  imports: [CommonModule],
  templateUrl: './location-panel.html',
  styleUrl: './location-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocationPanelComponent {
  private readonly gameEngine = inject(GameEngineService);

  /** Current room from game engine */
  private readonly currentRoom = this.gameEngine.currentRoom;

  /** Computed room name for display */
  readonly roomName = computed(() => {
    const room = this.currentRoom();
    return room?.name || 'Unknown Location';
  });

  /** Computed room description */
  readonly roomDescription = computed(() => {
    const room = this.currentRoom();
    if (!room) {
      return 'You are nowhere. This is strange.';
    }
    // Use short description if room was visited, otherwise full description
    return room.visited && room.shortDescription ? room.shortDescription : room.description;
  });

  /** Computed list of visible objects in current room */
  readonly visibleObjects = computed(() => {
    const room = this.currentRoom();
    if (!room) {
      return [];
    }

    // Get all objects in the room
    const objects: GameObject[] = [];
    for (const objectId of room.objectIds) {
      const obj = this.gameEngine.getObject(objectId);
      if (obj && obj.visible) {
        objects.push(obj);
      }
    }
    return objects;
  });

  /** Computed list of available exits */
  readonly exits = computed(() => {
    const room = this.currentRoom();
    if (!room) {
      return [];
    }

    // Convert Map to array of {direction, destination}
    const exitList: { direction: string; destination: string }[] = [];
    room.exits.forEach((destination, direction) => {
      exitList.push({ direction, destination });
    });

    // Sort exits in a logical order
    const directionOrder = ['north', 'south', 'east', 'west', 'up', 'down'];
    exitList.sort((a, b) => {
      const orderA = directionOrder.indexOf(a.direction);
      const orderB = directionOrder.indexOf(b.direction);
      return orderA - orderB;
    });

    return exitList;
  });

  /** Computed exit count for display */
  readonly exitCount = computed(() => this.exits().length);

  /** Computed object count for display */
  readonly objectCount = computed(() => this.visibleObjects().length);

  /**
   * Get ARIA label for location panel
   */
  getAriaLabel(): string {
    return `Location - ${this.roomName()}`;
  }

  /**
   * Get location text for screen readers
   */
  getLocationText(): string {
    const parts: string[] = [
      `Location: ${this.roomName()}`,
      `Description: ${this.roomDescription()}`,
    ];

    const exits = this.exits();
    if (exits.length > 0) {
      const exitDirections = exits.map((e) => e.direction).join(', ');
      parts.push(`Exits: ${exitDirections}`);
    } else {
      parts.push('No exits visible');
    }

    const objects = this.visibleObjects();
    if (objects.length > 0) {
      const objectNames = objects.map((o) => o.name).join(', ');
      parts.push(`Objects: ${objectNames}`);
    }

    return parts.join('. ');
  }

  /**
   * Get compass direction abbreviation for display
   */
  getDirectionAbbrev(direction: string): string {
    const abbrevMap: Record<string, string> = {
      north: 'N',
      south: 'S',
      east: 'E',
      west: 'W',
      up: 'U',
      down: 'D',
    };
    return abbrevMap[direction] || direction.charAt(0).toUpperCase();
  }

  /**
   * Track by function for ngFor optimization
   */
  trackByObjectId(_index: number, obj: GameObject): string {
    return obj.id;
  }

  /**
   * Track by function for exits ngFor
   */
  trackByDirection(_index: number, exit: { direction: string; destination: string }): string {
    return exit.direction;
  }
}
