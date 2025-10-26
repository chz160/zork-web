/**
 * Add ALL remaining canonical rooms, including those with placeholder names
 */

import * as fs from 'fs';
import * as path from 'path';

const projectRoot = __dirname.includes('dist/tools')
  ? path.join(__dirname, '..', '..')
  : path.join(__dirname, '..');

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

// Load current rooms
const currentRoomsPath = path.join(projectRoot, 'src', 'app', 'data', 'rooms.json');
const currentData = JSON.parse(fs.readFileSync(currentRoomsPath, 'utf8'));
const currentRooms: Room[] = currentData.rooms;

// Get indices we already have
const existingIndices = new Set<number>();
for (const room of currentRooms) {
  // Extract index from ID (format: "name-123")
  const match = room.id.match(/-(\d+)$/);
  if (match) {
    existingIndices.add(parseInt(match[1], 10));
  }
}

console.log(`Current rooms: ${currentRooms.length}`);
console.log(`Rooms with canonical indices: ${existingIndices.size}`);

// Load ALL canonical rooms
const canonicalPath = path.join(projectRoot, 'artifacts', 'rooms.canonical.populated.json');
const canonicalRooms: Room[] = JSON.parse(fs.readFileSync(canonicalPath, 'utf8'));

console.log(`Canonical rooms: ${canonicalRooms.length}`);

// Find missing rooms by index
const roomsToAdd: Room[] = [];
for (const canonRoom of canonicalRooms) {
  const idx = canonRoom.cIndexTrace?.roomIndex;
  if (idx !== undefined && !existingIndices.has(idx)) {
    roomsToAdd.push(canonRoom);
  }
}

console.log(`\nRooms to add: ${roomsToAdd.length}`);

if (roomsToAdd.length === 0) {
  console.log('No rooms to add - all canonical rooms already present!');
  process.exit(0);
}

// Show sample
console.log(`\nSample of rooms to add (first 5):`);
roomsToAdd.slice(0, 5).forEach((room) => {
  console.log(`  - Index ${room.cIndexTrace?.roomIndex}: ${room.name}`);
});

// Process and add rooms
const processedRooms: Room[] = [];
for (const room of roomsToAdd) {
  const idx = room.cIndexTrace!.roomIndex;
  
  // Generate ID: use name if decent, otherwise "room-{index}"
  let baseId = room.name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  // If name is just "Room N", use simpler format
  if (room.name.match(/^Room \d+$/)) {
    baseId = 'room';
  }
  
  const id = `${baseId}-${idx}`;
  
  // Create final room
  const finalRoom: Room = {
    id,
    name: room.name,
    description: room.description,
    shortDescription: room.name,
    exits: room.exits || {},
    objectIds: [],
    visited: false,
    isDark: room.cIndexTrace?.flags?.includes('RLIGHT') ? false : true,
  };
  
  // Add properties if present
  if (room.properties && Object.keys(room.properties).length > 0) {
    finalRoom.properties = room.properties;
  }
  
  processedRooms.push(finalRoom);
}

// Merge with current rooms
const mergedRooms = [...currentRooms, ...processedRooms];

console.log(`\nMerge summary:`);
console.log(`  Current: ${currentRooms.length}`);
console.log(`  Adding:  ${processedRooms.length}`);
console.log(`  Total:   ${mergedRooms.length}`);

// Check if dry run
if (process.argv.includes('--dry-run')) {
  console.log('\n[DRY RUN] No changes written.');
  process.exit(0);
}

// Backup current
const backupPath = path.join(projectRoot, 'artifacts', 'phase4', 'rooms.pre-final-merge.backup.json');
fs.writeFileSync(backupPath, JSON.stringify(currentData, null, 2));
console.log(`\n✓ Backup created: ${backupPath}`);

// Save merged rooms
fs.writeFileSync(currentRoomsPath, JSON.stringify({ rooms: mergedRooms }, null, 2));
console.log(`✓ Saved ${mergedRooms.length} rooms to ${currentRoomsPath}`);

console.log('\n✓ Merge complete!');
