import { Injectable } from '@angular/core';
import { Room, Direction, SpatialCoordinates } from '../models';

/**
 * Vector representing a direction in 3D space.
 */
interface DirectionVector {
  dx: number;
  dy: number;
  dz: number;
}

/**
 * Result of spatial layout computation.
 */
export interface SpatialLayout {
  /** Map of room ID to spatial coordinates */
  coordinates: Map<string, SpatialCoordinates>;

  /** Rooms that couldn't be placed due to conflicts or missing connections */
  unplacedRooms: string[];
}

/**
 * SpatialLayoutService computes 3D coordinates for rooms based on their connections.
 *
 * Purpose:
 * - Resolves room placement from connection directionality (north, up, etc.)
 * - Ensures spatial relationships match player mental model
 * - Supports multi-story layouts with vertical positioning
 *
 * Usage:
 * ```typescript
 * const layout = spatialLayoutService.computeLayout(rooms, startRoomId);
 * rooms.forEach(room => {
 *   room.spatialCoordinates = layout.coordinates.get(room.id);
 * });
 * ```
 *
 * Depends on: Room model with exits and optional spatialCoordinates.
 *
 * Design Notes:
 * - Uses BFS to traverse room graph from starting room
 * - Direction vectors: north = (0, -1, 0), up = (0, 0, 1), etc.
 * - Respects manually-specified coordinates (isManual: true)
 * - Handles coordinate conflicts with simple collision detection
 */
@Injectable({
  providedIn: 'root',
})
export class SpatialLayoutService {
  /**
   * Grid unit size for spacing between rooms.
   * Each room occupies a 1x1x1 space in the grid.
   */
  private readonly GRID_UNIT = 1;

  /**
   * Direction-to-vector mapping for 3D spatial movement.
   *
   * Coordinate system:
   * - X axis: west (-) to east (+)
   * - Y axis: north (-) to south (+)
   * - Z axis: down (-) to up (+)
   *
   * This aligns with player intuition:
   * - "go north" moves in negative Y
   * - "go up" increases Z
   * - "go east" moves in positive X
   */
  private readonly directionVectors: Record<Direction, DirectionVector> = {
    north: { dx: 0, dy: -1, dz: 0 },
    south: { dx: 0, dy: 1, dz: 0 },
    east: { dx: 1, dy: 0, dz: 0 },
    west: { dx: -1, dy: 0, dz: 0 },
    up: { dx: 0, dy: 0, dz: 1 },
    down: { dx: 0, dy: 0, dz: -1 },
  };

  /**
   * Compute spatial coordinates for all rooms based on their connections.
   *
   * @param rooms - Array of all rooms in the game world
   * @param startRoomId - ID of the starting room (origin point)
   * @returns Spatial layout with coordinates for each room
   *
   * Algorithm:
   * 1. Start with the root room at origin (0, 0, 0) unless manually placed
   * 2. Use BFS to traverse connections
   * 3. For each room, compute position based on parent room + direction vector
   * 4. Skip rooms with coordinate conflicts (handled by collision detection)
   * 5. Respect manually-specified coordinates
   */
  computeLayout(rooms: Room[], startRoomId?: string): SpatialLayout {
    const coordinates = new Map<string, SpatialCoordinates>();
    const unplacedRooms: string[] = [];
    const roomMap = new Map<string, Room>();

    // Build room lookup map
    rooms.forEach((room) => roomMap.set(room.id, room));

    // Find starting room
    const startRoom = startRoomId
      ? roomMap.get(startRoomId)
      : rooms.find((r) => r.visited) || rooms[0];

    if (!startRoom) {
      return { coordinates, unplacedRooms: rooms.map((r) => r.id) };
    }

    // Place start room at origin or use its manual coordinates
    const startCoords = startRoom.spatialCoordinates?.isManual
      ? startRoom.spatialCoordinates
      : { x: 0, y: 0, z: 0, isManual: false };

    coordinates.set(startRoom.id, startCoords);

    // BFS queue: { roomId, parentCoords }
    interface QueueItem {
      roomId: string;
      parentId: string;
      direction: Direction;
    }

    const queue: QueueItem[] = [];
    const processed = new Set<string>([startRoom.id]);

    // Initialize queue with start room's exits
    startRoom.exits.forEach((targetId, direction) => {
      if (roomMap.has(targetId)) {
        queue.push({
          roomId: targetId,
          parentId: startRoom.id,
          direction: direction as Direction,
        });
      }
    });

    // Process queue
    while (queue.length > 0) {
      const { roomId, parentId, direction } = queue.shift()!;

      // Skip if already processed
      if (processed.has(roomId)) {
        continue;
      }

      const room = roomMap.get(roomId);
      if (!room) {
        continue;
      }

      const parentCoords = coordinates.get(parentId);
      if (!parentCoords) {
        unplacedRooms.push(roomId);
        continue;
      }

      // Check if room has manual coordinates
      if (room.spatialCoordinates?.isManual) {
        coordinates.set(roomId, room.spatialCoordinates);
        processed.add(roomId);

        // Add this room's exits to queue
        room.exits.forEach((targetId, exitDirection) => {
          if (roomMap.has(targetId) && !processed.has(targetId)) {
            queue.push({
              roomId: targetId,
              parentId: roomId,
              direction: exitDirection as Direction,
            });
          }
        });
        continue;
      }

      // Compute new coordinates based on direction
      const vector = this.directionVectors[direction];
      const newCoords: SpatialCoordinates = {
        x: parentCoords.x + vector.dx * this.GRID_UNIT,
        y: parentCoords.y + vector.dy * this.GRID_UNIT,
        z: parentCoords.z + vector.dz * this.GRID_UNIT,
        isManual: false,
      };

      // Check for collision
      if (this.hasCollision(newCoords, coordinates)) {
        // Try to find alternative position
        const alternativeCoords = this.findAlternativePosition(newCoords, coordinates);
        if (alternativeCoords) {
          coordinates.set(roomId, alternativeCoords);
          processed.add(roomId);
        } else {
          unplacedRooms.push(roomId);
          continue;
        }
      } else {
        coordinates.set(roomId, newCoords);
        processed.add(roomId);
      }

      // Add this room's exits to queue
      room.exits.forEach((targetId, exitDirection) => {
        if (roomMap.has(targetId) && !processed.has(targetId)) {
          queue.push({
            roomId: targetId,
            parentId: roomId,
            direction: exitDirection as Direction,
          });
        }
      });
    }

    return { coordinates, unplacedRooms };
  }

  /**
   * Check if coordinates collide with any existing room position.
   *
   * @param coords - Coordinates to check
   * @param existing - Map of existing room coordinates
   * @returns True if collision detected
   */
  private hasCollision(
    coords: SpatialCoordinates,
    existing: Map<string, SpatialCoordinates>
  ): boolean {
    for (const existingCoords of existing.values()) {
      if (
        existingCoords.x === coords.x &&
        existingCoords.y === coords.y &&
        existingCoords.z === coords.z
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Find an alternative position near the desired coordinates.
   * Tries adjacent positions in a spiral pattern.
   *
   * @param desired - Desired coordinates that have a collision
   * @param existing - Map of existing room coordinates
   * @returns Alternative coordinates or null if none found
   */
  private findAlternativePosition(
    desired: SpatialCoordinates,
    existing: Map<string, SpatialCoordinates>
  ): SpatialCoordinates | null {
    // Try nearby positions (simple spiral search)
    const offsets = [
      { dx: 1, dy: 0, dz: 0 },
      { dx: -1, dy: 0, dz: 0 },
      { dx: 0, dy: 1, dz: 0 },
      { dx: 0, dy: -1, dz: 0 },
      { dx: 0, dy: 0, dz: 1 },
      { dx: 0, dy: 0, dz: -1 },
      { dx: 1, dy: 1, dz: 0 },
      { dx: 1, dy: -1, dz: 0 },
      { dx: -1, dy: 1, dz: 0 },
      { dx: -1, dy: -1, dz: 0 },
    ];

    for (const offset of offsets) {
      const candidate: SpatialCoordinates = {
        x: desired.x + offset.dx,
        y: desired.y + offset.dy,
        z: desired.z + offset.dz,
        isManual: false,
      };

      if (!this.hasCollision(candidate, existing)) {
        return candidate;
      }
    }

    return null;
  }

  /**
   * Get the direction vector for a given direction.
   *
   * @param direction - Direction to get vector for
   * @returns Direction vector or null if invalid direction
   */
  getDirectionVector(direction: Direction): DirectionVector | null {
    return this.directionVectors[direction] || null;
  }

  /**
   * Compute the direction from one coordinate to another.
   *
   * @param from - Starting coordinates
   * @param to - Target coordinates
   * @returns Direction or null if not a direct neighbor
   */
  getDirection(from: SpatialCoordinates, to: SpatialCoordinates): Direction | null {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dz = to.z - from.z;

    // Find matching direction vector
    for (const [direction, vector] of Object.entries(this.directionVectors)) {
      if (
        vector.dx === dx &&
        vector.dy === dy &&
        vector.dz === dz &&
        Math.abs(dx) + Math.abs(dy) + Math.abs(dz) === this.GRID_UNIT
      ) {
        return direction as Direction;
      }
    }

    return null;
  }

  /**
   * Compute bounding box of all coordinates.
   *
   * @param coordinates - Map of room coordinates
   * @returns Bounding box with min/max for each axis
   */
  getBoundingBox(coordinates: Map<string, SpatialCoordinates>): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
  } {
    if (coordinates.size === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0, minZ: 0, maxZ: 0 };
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    for (const coords of coordinates.values()) {
      minX = Math.min(minX, coords.x);
      maxX = Math.max(maxX, coords.x);
      minY = Math.min(minY, coords.y);
      maxY = Math.max(maxY, coords.y);
      minZ = Math.min(minZ, coords.z);
      maxZ = Math.max(maxZ, coords.z);
    }

    return { minX, maxX, minY, maxY, minZ, maxZ };
  }
}
