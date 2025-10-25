#!/usr/bin/env node
/**
 * Apply Canonical Room Fixes
 *
 * This script applies canonical Zork room descriptions and fixes invalid exits
 * based on the canonical-rooms.json reference file.
 */

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
  isDark?: boolean;
}

interface RoomsData {
  rooms: Room[];
}

interface CanonicalRoomFix {
  description?: string;
  exits?: Record<string, string>;
}

interface CanonicalData {
  rooms: Record<string, CanonicalRoomFix>;
  notes: {
    source: string;
    methodology: string;
    invalid_exits_removed: string[];
    note_on_exits: string;
  };
}

// Path resolution
const ROOMS_PATH = fs.existsSync(path.join(__dirname, '..', 'src', 'app', 'data', 'rooms.json'))
  ? path.join(__dirname, '..', 'src', 'app', 'data', 'rooms.json')
  : path.join(__dirname, '..', '..', 'src', 'app', 'data', 'rooms.json');

const CANONICAL_PATH = fs.existsSync(path.join(__dirname, 'canonical-rooms.json'))
  ? path.join(__dirname, 'canonical-rooms.json')
  : path.join(__dirname, '..', 'tools', 'canonical-rooms.json');

/**
 * Load canonical room fixes
 */
function loadCanonicalFixes(): CanonicalData {
  const content = fs.readFileSync(CANONICAL_PATH, 'utf-8');
  return JSON.parse(content);
}

/**
 * Apply canonical fixes to rooms
 */
function applyCanonicalFixes(): void {
  console.log('Loading rooms data...');
  const roomsData: RoomsData = JSON.parse(fs.readFileSync(ROOMS_PATH, 'utf-8'));
  const canonicalData = loadCanonicalFixes();

  let fixedCount = 0;
  let descriptionsFix = 0;
  let exitsFixed = 0;

  console.log('Applying canonical fixes...\n');

  // Apply fixes to each room
  for (const room of roomsData.rooms) {
    const fix = canonicalData.rooms[room.id];
    if (!fix) {
      continue;
    }

    let roomFixed = false;

    // Fix description if provided
    if (fix.description && fix.description !== room.description) {
      console.log(`✅ Fixed description for: ${room.name} (${room.id})`);
      console.log(`   Old: "${room.description.substring(0, 60)}..."`);
      console.log(`   New: "${fix.description.substring(0, 60)}..."`);
      room.description = fix.description;
      descriptionsFix++;
      roomFixed = true;
    }

    // Fix exits if provided
    if (fix.exits) {
      const oldExits = { ...room.exits };
      room.exits = { ...fix.exits };

      // Check if exits actually changed
      const exitsChanged = JSON.stringify(oldExits) !== JSON.stringify(room.exits);
      if (exitsChanged) {
        console.log(`✅ Fixed exits for: ${room.name} (${room.id})`);
        console.log(`   Old exits: ${JSON.stringify(oldExits)}`);
        console.log(`   New exits: ${JSON.stringify(room.exits)}`);
        exitsFixed++;
        roomFixed = true;
      }
    }

    if (roomFixed) {
      fixedCount++;
      console.log('');
    }
  }

  // Write back to file with proper formatting
  const updatedContent = JSON.stringify(roomsData, null, 2);
  fs.writeFileSync(ROOMS_PATH, updatedContent + '\n', 'utf-8');

  console.log('\n=== Summary ===');
  console.log(`Total rooms fixed: ${fixedCount}`);
  console.log(`Descriptions updated: ${descriptionsFix}`);
  console.log(`Exit configurations fixed: ${exitsFixed}`);
  console.log(`\n✨ Canonical fixes applied successfully to: ${ROOMS_PATH}`);
}

// Run the fix application
try {
  applyCanonicalFixes();
} catch (error) {
  console.error('❌ Error applying canonical fixes:', error);
  process.exit(1);
}
