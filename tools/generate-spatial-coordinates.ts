#!/usr/bin/env node
/**
 * Spatial Coordinates Generation Utility
 *
 * Generates spatial coordinates for rooms in rooms.json based on their connections.
 * Uses the SpatialLayoutService algorithm to compute (x, y, z) positions.
 *
 * Usage:
 *   npm run build:tools && node dist/tools/generate-spatial-coordinates.js [--start-room=room-id] [--dry-run]
 *
 * Options:
 *   --start-room=<id>  Room to use as origin (default: west-of-house)
 *   --dry-run          Show what would be changed without modifying files
 *   --verbose          Show detailed output for each room
 *
 * Output:
 *   Updates rooms.json with spatialCoordinates for each room
 *   Prints summary of changes and any unplaced rooms
 */

import * as fs from 'fs';
import * as path from 'path';

interface SpatialCoordinates {
  x: number;
  y: number;
  z: number;
  isManual: boolean;
}

interface Room {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  exits: Record<string, string>;
  objectIds: string[];
  visited: boolean;
  isDark?: boolean;
  spatialCoordinates?: SpatialCoordinates;
}

interface RoomsData {
  rooms: Room[];
}

/**
 * Valid navigation directions matching core models (room.model.ts).
 * Note: This duplicates the Direction type from core models since tools
 * cannot import from the Angular app source.
 */
type Direction = 'north' | 'south' | 'east' | 'west' | 'up' | 'down';

interface DirectionVector {
  dx: number;
  dy: number;
  dz: number;
}

// Path segments for rooms.json location
const ROOMS_PATH_SEGMENTS = ['src', 'app', 'data', 'rooms.json'];

// Path resolution: try one level up, then two levels up
const ROOMS_PATH = fs.existsSync(path.join(__dirname, '..', ...ROOMS_PATH_SEGMENTS))
  ? path.join(__dirname, '..', ...ROOMS_PATH_SEGMENTS)
  : path.join(__dirname, '..', '..', ...ROOMS_PATH_SEGMENTS);

/**
 * Direction-to-vector mapping
 */
const directionVectors: Record<Direction, DirectionVector> = {
  north: { dx: 0, dy: -1, dz: 0 },
  south: { dx: 0, dy: 1, dz: 0 },
  east: { dx: 1, dy: 0, dz: 0 },
  west: { dx: -1, dy: 0, dz: 0 },
  up: { dx: 0, dy: 0, dz: 1 },
  down: { dx: 0, dy: 0, dz: -1 },
};

/**
 * Compute spatial layout for rooms
 */
function computeSpatialLayout(
  rooms: Room[],
  startRoomId: string
): {
  coordinates: Map<string, SpatialCoordinates>;
  unplacedRooms: string[];
} {
  const coordinates = new Map<string, SpatialCoordinates>();
  const unplacedRooms: string[] = [];
  const roomMap = new Map<string, Room>();

  // Build room lookup map
  rooms.forEach((room) => roomMap.set(room.id, room));

  // Find starting room
  const startRoom = roomMap.get(startRoomId);
  if (!startRoom) {
    console.error(`Start room '${startRoomId}' not found`);
    return { coordinates, unplacedRooms: rooms.map((r) => r.id) };
  }

  // Place start room at origin or use its manual coordinates
  const startCoords = startRoom.spatialCoordinates?.isManual
    ? startRoom.spatialCoordinates
    : { x: 0, y: 0, z: 0, isManual: false };

  coordinates.set(startRoom.id, startCoords);

  // BFS queue
  interface QueueItem {
    roomId: string;
    parentId: string;
    direction: Direction;
  }

  const queue: QueueItem[] = [];
  const processed = new Set<string>([startRoom.id]);

  // Initialize queue with start room's exits
  Object.entries(startRoom.exits).forEach(([direction, targetId]) => {
    if (roomMap.has(targetId) && isValidDirection(direction)) {
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
      Object.entries(room.exits).forEach(([exitDirection, targetId]) => {
        if (roomMap.has(targetId) && !processed.has(targetId) && isValidDirection(exitDirection)) {
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
    const vector = directionVectors[direction];
    const newCoords: SpatialCoordinates = {
      x: parentCoords.x + vector.dx,
      y: parentCoords.y + vector.dy,
      z: parentCoords.z + vector.dz,
      isManual: false,
    };

    // Check for collision
    if (hasCollision(newCoords, coordinates)) {
      const alternativeCoords = findAlternativePosition(newCoords, coordinates);
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
    Object.entries(room.exits).forEach(([exitDirection, targetId]) => {
      if (roomMap.has(targetId) && !processed.has(targetId) && isValidDirection(exitDirection)) {
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
 * Check if direction is valid
 */
function isValidDirection(direction: string): direction is Direction {
  return direction in directionVectors;
}

/**
 * Check for coordinate collision
 */
function hasCollision(
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
 * Find alternative position near desired coordinates
 */
function findAlternativePosition(
  desired: SpatialCoordinates,
  existing: Map<string, SpatialCoordinates>
): SpatialCoordinates | null {
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

    if (!hasCollision(candidate, existing)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  const startRoom =
    args.find((arg) => arg.startsWith('--start-room='))?.split('=')[1] || 'west-of-house';
  const dryRun = args.includes('--dry-run');
  const verbose = args.includes('--verbose');

  console.log('🗺️  Spatial Coordinates Generation Utility');
  console.log('==========================================\n');

  // Load rooms data
  console.log(`📂 Loading rooms from: ${ROOMS_PATH}`);
  const data: RoomsData = JSON.parse(fs.readFileSync(ROOMS_PATH, 'utf-8'));
  console.log(`✓ Loaded ${data.rooms.length} rooms\n`);

  // Compute spatial layout
  console.log(`🧮 Computing spatial layout (starting from: ${startRoom})...`);
  const { coordinates, unplacedRooms } = computeSpatialLayout(data.rooms, startRoom);
  console.log(`✓ Computed coordinates for ${coordinates.size} rooms\n`);

  // Apply coordinates to rooms
  let updatedCount = 0;
  let manualCount = 0;

  data.rooms.forEach((room) => {
    const coords = coordinates.get(room.id);
    if (coords) {
      const hadCoords = room.spatialCoordinates !== undefined;
      const isManual = room.spatialCoordinates?.isManual || false;

      if (!hadCoords || !isManual) {
        room.spatialCoordinates = coords;
        updatedCount++;

        if (verbose) {
          console.log(`  ${room.id}: (${coords.x}, ${coords.y}, ${coords.z}) - ${room.name}`);
        }
      } else if (room.spatialCoordinates) {
        manualCount++;
        if (verbose) {
          console.log(
            `  ${room.id}: MANUAL (${room.spatialCoordinates.x}, ${room.spatialCoordinates.y}, ${room.spatialCoordinates.z}) - ${room.name}`
          );
        }
      }
    }
  });

  // Print summary
  console.log('\n📊 Summary');
  console.log('==========');
  console.log(`Total rooms: ${data.rooms.length}`);
  console.log(`Coordinates computed: ${coordinates.size}`);
  console.log(`Coordinates updated: ${updatedCount}`);
  console.log(`Manual coordinates preserved: ${manualCount}`);
  console.log(`Unplaced rooms: ${unplacedRooms.length}`);

  if (unplacedRooms.length > 0) {
    console.log('\n⚠️  Unplaced Rooms:');
    unplacedRooms.forEach((roomId) => {
      const room = data.rooms.find((r) => r.id === roomId);
      console.log(`  - ${roomId}: ${room?.name || 'Unknown'}`);
    });
  }

  // Compute bounding box
  let minX = Infinity,
    maxX = -Infinity;
  let minY = Infinity,
    maxY = -Infinity;
  let minZ = Infinity,
    maxZ = -Infinity;

  for (const coords of coordinates.values()) {
    minX = Math.min(minX, coords.x);
    maxX = Math.max(maxX, coords.x);
    minY = Math.min(minY, coords.y);
    maxY = Math.max(maxY, coords.y);
    minZ = Math.min(minZ, coords.z);
    maxZ = Math.max(maxZ, coords.z);
  }

  console.log('\n📐 Bounding Box:');
  console.log(`  X: ${minX} to ${maxX} (width: ${maxX - minX + 1})`);
  console.log(`  Y: ${minY} to ${maxY} (depth: ${maxY - minY + 1})`);
  console.log(`  Z: ${minZ} to ${maxZ} (height: ${maxZ - minZ + 1})`);

  // Save or dry-run
  if (dryRun) {
    console.log('\n🔍 Dry run mode - no changes written');
  } else {
    console.log('\n💾 Writing updated rooms.json...');
    fs.writeFileSync(ROOMS_PATH, JSON.stringify(data, null, 2), 'utf-8');
    console.log('✓ Done!');
  }

  console.log('\n✨ Spatial coordinates generation complete!\n');
}

main();
