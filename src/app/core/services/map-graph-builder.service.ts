import { Injectable, inject, computed } from '@angular/core';
import { GameEngineService } from './game-engine.service';
import { Room } from '../models';

/**
 * Node in the 3D graph visualization
 */
export interface GraphNode {
  id: string;
  name: string;
  visited: boolean;
  isCurrent: boolean;
}

/**
 * Link between nodes in the 3D graph
 */
export interface GraphLink {
  source: string;
  target: string;
  direction: string;
}

/**
 * Graph data structure for 3d-force-graph
 */
export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

/**
 * MapGraphBuilderService transforms game room data into graph format for 3D visualization.
 *
 * Used by: MapGraph3DComponent for rendering the 3D map
 * Depends on: GameEngineService for game state
 *
 * Provides a clean separation between game logic and visualization layer.
 */
@Injectable({
  providedIn: 'root',
})
export class MapGraphBuilderService {
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
   * Build graph data from visited rooms and their connections
   *
   * @returns GraphData containing nodes and links for visualization
   *
   * Only includes visited rooms and valid connections between them.
   * Nodes are colored based on visited state and current location.
   */
  readonly graphData = computed<GraphData>(() => {
    const visited = this.visitedRooms();
    const currentId = this.currentRoomId();
    const visitedIds = new Set(visited.map((r) => r.id));

    // Build nodes from visited rooms
    const nodes: GraphNode[] = visited.map((room) => ({
      id: room.id,
      name: room.name,
      visited: true,
      isCurrent: room.id === currentId,
    }));

    // Build links from room exits
    const links: GraphLink[] = [];
    const processedPairs = new Set<string>();

    visited.forEach((room) => {
      room.exits.forEach((targetId, direction) => {
        // Only show links to visited rooms
        if (visitedIds.has(targetId)) {
          // Create a unique pair identifier (sorted to avoid duplicates)
          const pairId = room.id < targetId ? `${room.id}-${targetId}` : `${targetId}-${room.id}`;

          // Only add link if we haven't processed this pair yet
          if (!processedPairs.has(pairId)) {
            links.push({
              source: room.id,
              target: targetId,
              direction,
            });
            processedPairs.add(pairId);
          }
        }
      });
    });

    return { nodes, links };
  });

  /**
   * Get the number of visited rooms
   */
  readonly roomCount = computed(() => this.graphData().nodes.length);

  /**
   * Get the number of connections between rooms
   */
  readonly linkCount = computed(() => this.graphData().links.length);
}
