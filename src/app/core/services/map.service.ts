import { Injectable, inject, computed } from '@angular/core';
import { GameEngineService } from './game-engine.service';
import { SpatialLayoutService } from './spatial-layout.service';
import { Room } from '../models';

/**
 * Node in the room graph for visualization
 */
export interface RoomNode {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  isCurrent: boolean;
  visited: boolean;
  exits: Map<string, string>; // direction -> targetRoomId
}

/**
 * Edge between rooms in the graph
 */
export interface RoomEdge {
  from: string;
  to: string;
  direction: string;
}

/**
 * MapService provides exploration data for map visualization.
 * Computes room graph with 3D positions for visual display.
 *
 * Uses SpatialLayoutService to compute accurate spatial coordinates
 * based on room connections and directional metadata.
 */
@Injectable({
  providedIn: 'root',
})
export class MapService {
  private readonly gameEngine = inject(GameEngineService);
  private readonly spatialLayout = inject(SpatialLayoutService);

  /**
   * Get all visited rooms from the game engine
   */
  private readonly visitedRooms = computed(() => {
    const allRooms = this.gameEngine['rooms']();
    const visited: Room[] = [];
    allRooms.forEach((room) => {
      if (room.visited) {
        visited.push(room);
      }
    });
    return visited;
  });

  /**
   * Get the current room ID
   */
  private readonly currentRoomId = computed(() => {
    return this.gameEngine.player().currentRoomId;
  });

  /**
   * Compute room nodes with 3D positions for graph visualization.
   * Uses SpatialLayoutService to compute coordinates based on connections.
   */
  readonly roomNodes = computed<RoomNode[]>(() => {
    const visited = this.visitedRooms();
    const currentId = this.currentRoomId();

    if (visited.length === 0) {
      return [];
    }

    // Compute spatial layout using the spatial layout service
    // Use currentId as starting room for coordinate computation to ensure
    // the layout is centered around the player's current location
    const layout = this.spatialLayout.computeLayout(visited, currentId);

    return visited.map((room) => {
      const coords = layout.coordinates.get(room.id);
      return {
        id: room.id,
        name: room.name,
        x: coords?.x ?? 0,
        y: coords?.y ?? 0,
        z: coords?.z ?? 0,
        isCurrent: room.id === currentId,
        visited: true,
        exits: room.exits,
      };
    });
  });

  /**
   * Compute edges between visited rooms
   */
  readonly roomEdges = computed<RoomEdge[]>(() => {
    const visited = this.visitedRooms();
    const visitedIds = new Set(visited.map((r) => r.id));
    const edges: RoomEdge[] = [];

    visited.forEach((room) => {
      room.exits.forEach((targetId, direction) => {
        // Only show edges to visited rooms
        if (visitedIds.has(targetId)) {
          edges.push({
            from: room.id,
            to: targetId,
            direction,
          });
        }
      });
    });

    return edges;
  });

  /**
   * Get the bounding box of all room positions in 3D space
   */
  getBoundingBox(): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
  } {
    const nodes = this.roomNodes();

    if (nodes.length === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0, minZ: 0, maxZ: 0 };
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    nodes.forEach((node) => {
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x);
      minY = Math.min(minY, node.y);
      maxY = Math.max(maxY, node.y);
      minZ = Math.min(minZ, node.z);
      maxZ = Math.max(maxZ, node.z);
    });

    return { minX, maxX, minY, maxY, minZ, maxZ };
  }
}
