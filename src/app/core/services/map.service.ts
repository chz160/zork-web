import { Injectable, inject, computed } from '@angular/core';
import { GameEngineService } from './game-engine.service';
import { Room } from '../models';

/**
 * Node in the room graph for visualization
 */
export interface RoomNode {
  id: string;
  name: string;
  x: number;
  y: number;
  isCurrent: boolean;
  visited: boolean;
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
 * Computes room graph with positions for visual display.
 */
@Injectable({
  providedIn: 'root',
})
export class MapService {
  private readonly gameEngine = inject(GameEngineService);

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
   * Compute room nodes with positions for graph visualization
   * Uses a simple force-directed layout algorithm
   */
  readonly roomNodes = computed<RoomNode[]>(() => {
    const visited = this.visitedRooms();
    const currentId = this.currentRoomId();

    if (visited.length === 0) {
      return [];
    }

    // Simple grid layout based on discovery order
    const positions = this.computeGridLayout(visited);

    return visited.map((room) => ({
      id: room.id,
      name: room.name,
      x: positions.get(room.id)?.x ?? 0,
      y: positions.get(room.id)?.y ?? 0,
      isCurrent: room.id === currentId,
      visited: true,
    }));
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
   * Compute grid layout positions for rooms
   * Uses a simple algorithm that places rooms relative to connections
   */
  private computeGridLayout(rooms: Room[]): Map<string, { x: number; y: number }> {
    const positions = new Map<string, { x: number; y: number }>();
    const gridSize = 120; // pixels between rooms

    if (rooms.length === 0) {
      return positions;
    }

    // Start with the first room at origin
    const startRoom = rooms[0];
    const queue: { room: Room; x: number; y: number }[] = [{ room: startRoom, x: 0, y: 0 }];
    const processed = new Set<string>();

    // Direction offsets for grid layout
    const directionOffsets: Record<string, { dx: number; dy: number }> = {
      north: { dx: 0, dy: -1 },
      south: { dx: 0, dy: 1 },
      east: { dx: 1, dy: 0 },
      west: { dx: -1, dy: 0 },
      up: { dx: 1, dy: -1 }, // diagonal up-right
      down: { dx: -1, dy: 1 }, // diagonal down-left
    };

    // BFS to position rooms relative to each other
    while (queue.length > 0) {
      const { room, x, y } = queue.shift()!;

      if (processed.has(room.id)) {
        continue;
      }

      positions.set(room.id, { x: x * gridSize, y: y * gridSize });
      processed.add(room.id);

      // Process connected rooms
      room.exits.forEach((targetId, direction) => {
        const targetRoom = rooms.find((r) => r.id === targetId);
        if (targetRoom && !processed.has(targetId)) {
          const offset = directionOffsets[direction] || { dx: 0, dy: 0 };
          queue.push({
            room: targetRoom,
            x: x + offset.dx,
            y: y + offset.dy,
          });
        }
      });
    }

    return positions;
  }

  /**
   * Get the bounding box of all room positions
   */
  getBoundingBox(): { minX: number; maxX: number; minY: number; maxY: number } {
    const nodes = this.roomNodes();

    if (nodes.length === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    nodes.forEach((node) => {
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x);
      minY = Math.min(minY, node.y);
      maxY = Math.max(maxY, node.y);
    });

    return { minX, maxX, minY, maxY };
  }
}
