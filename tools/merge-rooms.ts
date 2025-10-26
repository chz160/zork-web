/**
 * Phase 4 Tool: Merge Rooms
 *
 * Merges new rooms from canonical data with current game data.
 * Generates proper IDs and handles duplicate names.
 */

/* eslint-disable no-console */

import * as fs from 'fs';
import * as path from 'path';

interface Room {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  exits: Record<string, string>;
  objectIds: string[];
  visited: boolean;
  isDark: boolean;
  properties?: Record<string, unknown>;
  cIndexTrace?: {
    roomIndex: number;
    messageIndex: number;
    flags: string[];
  };
}

interface RoomsData {
  rooms: Room[];
}

// Get project root - when run with tsx from tools/, go up one level
// When run compiled from dist/tools, go up two levels
const projectRoot = __dirname.includes('dist/tools')
  ? path.join(__dirname, '..', '..')
  : path.join(__dirname, '..');

/**
 * Generate a unique ID from room name, description, and index
 * Include index to ensure uniqueness even for duplicate rooms
 */
function generateRoomId(room: Room, existingIds: Set<string>): string {
  // Start with a base ID from the name
  let baseId = room.name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  // Limit length
  if (baseId.length > 40) {
    baseId = baseId.substring(0, 40).replace(/-$/, '');
  }

  // If empty, use room index
  if (!baseId) {
    baseId = `room-${room.cIndexTrace?.roomIndex || 'unknown'}`;
  }

  // Always append index to ensure uniqueness and traceability
  const idx = room.cIndexTrace?.roomIndex;
  if (idx !== undefined) {
    const idWithIndex = `${baseId}-${idx}`;
    return idWithIndex;
  }

  // Fallback: ensure uniqueness with counter
  let id = baseId;
  let counter = 1;

  while (existingIds.has(id)) {
    id = `${baseId}-${counter}`;
    counter++;
  }

  return id;
}

/**
 * Extract a better name from description if current name is truncated
 */
function extractBetterName(room: Room): string {
  const desc = room.description;

  // If name is too generic or truncated, try to extract from description
  if (room.name.includes(',') || room.name.length < 10) {
    // If description starts with "You are in", extract location
    const match = desc.match(/^You are (?:in|at|on|inside|within) (?:a |an |the )?([^.!?\n]+)/i);
    if (match) {
      let name = match[1].trim();

      // Remove trailing commas and extra phrases
      name = name.replace(/,.*$/, '');

      // Capitalize properly
      name = name
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      // Limit length but preserve meaning
      if (name.length > 50) {
        const words = name.split(' ');
        name = words.slice(0, 8).join(' ');
      }

      return name;
    }
  }

  // Use existing name but clean it up
  let cleanName = room.name.replace(/,.*$/, '').trim();

  // Capitalize properly
  cleanName = cleanName
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return cleanName;
}

/**
 * Filter rooms to only include well-formed ones
 * skipQualityFilter: if true, only check for minimal requirements (name and description exist)
 */
function filterQualityRooms(rooms: Room[], skipQualityFilter = false): Room[] {
  return rooms.filter((room) => {
    // Must have description
    if (!room.description || room.description.length < 10) {
      return false;
    }

    // Must have name
    if (!room.name || room.name.length === 0) {
      return false;
    }

    // If skipping quality filter, accept all rooms that have name and description
    if (skipQualityFilter) {
      return true;
    }

    // Skip if name and description are identical (placeholder)
    if (room.name === room.description) {
      return false;
    }

    return true;
  });
}

/**
 * Categorize rooms by priority
 */
function categorizeRooms(rooms: Room[]): {
  endgame: Room[];
  sacred: Room[];
  water: Room[];
  air: Room[];
  regular: Room[];
} {
  const result = {
    endgame: [] as Room[],
    sacred: [] as Room[],
    water: [] as Room[],
    air: [] as Room[],
    regular: [] as Room[],
  };

  for (const room of rooms) {
    const flags = room.cIndexTrace?.flags || [];

    if (flags.includes('REND')) {
      result.endgame.push(room);
    } else if (flags.includes('RSACRD')) {
      result.sacred.push(room);
    } else if (flags.includes('RWATER')) {
      result.water.push(room);
    } else if (flags.includes('RAIR')) {
      result.air.push(room);
    } else {
      result.regular.push(room);
    }
  }

  return result;
}

/**
 * Load current rooms data
 */
function loadCurrentRooms(): Room[] {
  const filePath = path.join(projectRoot, 'src', 'app', 'data', 'rooms.json');
  const data: RoomsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return data.rooms;
}

/**
 * Load new rooms data
 */
function loadNewRooms(): Room[] {
  const filePath = path.join(projectRoot, 'artifacts', 'phase4', 'new-rooms.json');
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Save merged rooms data
 */
function saveMergedRooms(rooms: Room[]): void {
  const outputPath = path.join(projectRoot, 'src', 'app', 'data', 'rooms.json');
  const backupPath = path.join(projectRoot, 'artifacts', 'phase4', 'rooms.backup.json');

  // Create backup
  const current = fs.readFileSync(outputPath, 'utf8');
  fs.writeFileSync(backupPath, current);
  console.log(`✓ Created backup at ${backupPath}`);

  // Save merged data
  const data: RoomsData = { rooms };
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`✓ Saved ${rooms.length} rooms to ${outputPath}`);
}

/**
 * Process rooms for merging - skip rooms that would create duplicate IDs
 */
function processRoomsForMerge(newRooms: Room[], currentRooms: Room[]): Room[] {
  const existingIds = new Set(currentRooms.map((r) => r.id));
  const processed: Room[] = [];
  let skipped = 0;

  for (const room of newRooms) {
    // Improve name if needed
    const betterName = extractBetterName(room);
    const improvedRoom = { ...room, name: betterName };

    // Generate unique ID
    const id = generateRoomId(improvedRoom, existingIds);

    // Skip if this exact ID already exists (duplicate detection)
    if (existingIds.has(id)) {
      skipped++;
      continue;
    }

    existingIds.add(id);

    // Create final room (removing cIndexTrace for cleaner output)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { cIndexTrace, properties, ...baseRoom } = improvedRoom;
    const finalRoom: Room = {
      ...baseRoom,
      id,
    };

    // Add properties if they exist and have meaningful data
    if (properties && Object.keys(properties).length > 0) {
      finalRoom.properties = properties;
    }

    processed.push(finalRoom);
  }

  if (skipped > 0) {
    console.log(`  Skipped ${skipped} rooms (already exist)`);
  }

  return processed;
}

/**
 * Main merge function
 */
function mergeRooms(options: {
  dryRun: boolean;
  category?: string;
  limit?: number;
  skipQualityFilter?: boolean;
}): void {
  console.log('=== PHASE 4 ROOM MERGE TOOL ===\n');

  // Load data
  console.log('Loading current rooms...');
  const currentRooms = loadCurrentRooms();
  console.log(`  Loaded ${currentRooms.length} current rooms`);

  console.log('Loading new rooms...');
  const newRooms = loadNewRooms();
  console.log(`  Loaded ${newRooms.length} new candidate rooms`);

  // Filter for quality
  console.log('\nFiltering for quality rooms...');
  const qualityRooms = filterQualityRooms(newRooms, options.skipQualityFilter || false);
  console.log(`  ${qualityRooms.length} rooms passed quality filter`);
  console.log(`  ${newRooms.length - qualityRooms.length} rooms filtered out`);
  if (options.skipQualityFilter) {
    console.log('  (Quality filter skipped - including placeholder names)');
  }

  // Categorize
  console.log('\nCategorizing rooms...');
  const categories = categorizeRooms(qualityRooms);
  console.log(`  Endgame (REND):  ${categories.endgame.length}`);
  console.log(`  Sacred (RSACRD): ${categories.sacred.length}`);
  console.log(`  Water (RWATER):  ${categories.water.length}`);
  console.log(`  Air (RAIR):      ${categories.air.length}`);
  console.log(`  Regular:         ${categories.regular.length}`);

  // Select rooms to merge based on category
  let roomsToMerge: Room[] = [];

  if (options.category) {
    const catKey = options.category.toLowerCase() as keyof typeof categories;
    if (catKey in categories) {
      roomsToMerge = categories[catKey];
      console.log(`\nSelected category: ${options.category} (${roomsToMerge.length} rooms)`);
    } else {
      console.error(`\nError: Unknown category '${options.category}'`);
      console.log('Available categories: endgame, sacred, water, air, regular');
      process.exit(1);
    }
  } else {
    // Default: merge endgame rooms first
    roomsToMerge = categories.endgame;
    console.log(`\nDefaulting to endgame rooms (${roomsToMerge.length} rooms)`);
  }

  // Apply limit
  if (options.limit && options.limit > 0) {
    roomsToMerge = roomsToMerge.slice(0, options.limit);
    console.log(`Applied limit: ${options.limit} rooms`);
  }

  if (roomsToMerge.length === 0) {
    console.log('\nNo rooms to merge!');
    return;
  }

  // Process rooms
  console.log('\nProcessing rooms for merge...');
  const processedRooms = processRoomsForMerge(roomsToMerge, currentRooms);

  // Merge
  const mergedRooms = [...currentRooms, ...processedRooms];

  console.log(`\nMerge preview:`);
  console.log(`  Current rooms:    ${currentRooms.length}`);
  console.log(`  Rooms to add:     ${processedRooms.length}`);
  console.log(`  Total after merge: ${mergedRooms.length}`);

  // Show sample of new rooms
  console.log(`\nSample of new rooms (first 3):`);
  processedRooms.slice(0, 3).forEach((room, i) => {
    console.log(`  ${i + 1}. ${room.id}`);
    console.log(`     Name: ${room.name}`);
    console.log(`     Desc: ${room.description.substring(0, 60)}...`);
  });

  if (options.dryRun) {
    console.log('\n[DRY RUN] No changes written to disk.');
    console.log('Run without --dry-run to apply changes.');
  } else {
    console.log('\nSaving merged rooms...');
    saveMergedRooms(mergedRooms);
    console.log('\n✓ Merge complete!');
  }

  console.log('\n===============================\n');
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes('--dry-run'),
    category: args.find((arg) => arg.startsWith('--category='))?.split('=')[1],
    limit: parseInt(args.find((arg) => arg.startsWith('--limit='))?.split('=')[1] || '0', 10),
    skipQualityFilter: args.includes('--skip-quality-filter'),
  };

  try {
    mergeRooms(options);
  } catch (error) {
    console.error('Error during merge:', error);
    process.exit(1);
  }
}

export { mergeRooms, generateRoomId, extractBetterName };
