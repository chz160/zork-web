#!/usr/bin/env node
/**
 * Extract Canonical Room Data from ZIL Source
 *
 * This script parses the original ZIL source files to extract canonical room
 * descriptions and valid exits, generating a comprehensive canonical-rooms.json
 * for all rooms in the game.
 */

/* eslint-disable no-console */

import * as fs from 'fs';
import * as path from 'path';

interface RoomData {
  description?: string;
  exits?: Record<string, string>;
}

interface CanonicalRooms {
  rooms: Record<string, RoomData>;
}

// Path to ZIL source (adjust for dist/tools output directory)
const ZIL_PATH = fs.existsSync(
  path.join(__dirname, '..', 'docs', 'original-src-1980', '1dungeon.zil')
)
  ? path.join(__dirname, '..', 'docs', 'original-src-1980', '1dungeon.zil')
  : path.join(__dirname, '..', '..', 'docs', 'original-src-1980', '1dungeon.zil');
const OUTPUT_PATH = path.join(__dirname, 'canonical-rooms-generated.json');

/**
 * Convert ZIL room name to kebab-case ID
 */
function zilToId(zilName: string): string {
  return zilName.toLowerCase().replace(/_/g, '-');
}

/**
 * Parse ZIL source to extract room definitions
 */
function parseZilRooms(): CanonicalRooms {
  const content = fs.readFileSync(ZIL_PATH, 'utf-8');
  const lines = content.split('\n');

  const rooms: Record<string, RoomData> = {};
  let currentRoom: string | null = null;
  let currentLdesc: string[] = [];
  let inLdesc = false;
  let currentExits: Record<string, string> = {};

  for (const line of lines) {
    // Start of room definition
    const roomMatch = line.match(/<ROOM\s+([A-Z0-9-]+)/);
    if (roomMatch) {
      // Save previous room if exists
      if (currentRoom && (currentLdesc.length > 0 || Object.keys(currentExits).length > 0)) {
        const roomId = zilToId(currentRoom);
        rooms[roomId] = {};

        if (currentLdesc.length > 0) {
          rooms[roomId].description = currentLdesc.join(' ').trim();
        }

        if (Object.keys(currentExits).length > 0) {
          rooms[roomId].exits = { ...currentExits };
        }
      }

      // Start new room
      currentRoom = roomMatch[1];
      currentLdesc = [];
      currentExits = {};
      inLdesc = false;
      continue;
    }

    // End of room definition
    if (line.trim() === '>' && currentRoom) {
      // Save current room
      const roomId = zilToId(currentRoom);
      rooms[roomId] = {};

      if (currentLdesc.length > 0) {
        rooms[roomId].description = currentLdesc.join(' ').trim();
      }

      if (Object.keys(currentExits).length > 0) {
        rooms[roomId].exits = { ...currentExits };
      }

      currentRoom = null;
      currentLdesc = [];
      currentExits = {};
      inLdesc = false;
      continue;
    }

    if (!currentRoom) continue;

    // Start of LDESC
    if (line.match(/\(LDESC/)) {
      inLdesc = true;
      // Check if description is on same line
      const sameLineMatch = line.match(/\(LDESC\s+"(.+)"\)/);
      if (sameLineMatch) {
        currentLdesc.push(sameLineMatch[1]);
        inLdesc = false;
      } else {
        // Multi-line description starts
        const startMatch = line.match(/\(LDESC\s*"?(.*)$/);
        if (startMatch && startMatch[1]) {
          const text = startMatch[1].replace(/^"/, '');
          if (text) currentLdesc.push(text);
        }
      }
      continue;
    }

    // Continue LDESC
    if (inLdesc) {
      const trimmed = line.trim();
      if (trimmed.endsWith('")')) {
        // End of LDESC
        const text = trimmed.slice(0, -2).replace(/^"/, '');
        if (text) currentLdesc.push(text);
        inLdesc = false;
      } else if (trimmed.endsWith('"')) {
        const text = trimmed.slice(0, -1).replace(/^"/, '');
        if (text) currentLdesc.push(text);
        inLdesc = false;
      } else if (trimmed) {
        const text = trimmed.replace(/^"/, '');
        if (text) currentLdesc.push(text);
      }
      continue;
    }

    // Parse exits - valid exit with TO
    const exitMatch = line.match(
      /\((NORTH|SOUTH|EAST|WEST|UP|DOWN|NE|NW|SE|SW|IN|OUT)\s+TO\s+([A-Z0-9-]+)/i
    );
    if (exitMatch) {
      const direction = exitMatch[1].toLowerCase();
      const destination = zilToId(exitMatch[2]);
      currentExits[direction] = destination;
      continue;
    }

    // Skip error message exits (strings in parentheses) - these should not be in JSON
    // Example: (UP "There is no tree here suitable for climbing.")
  }

  return { rooms };
}

/**
 * Load existing canonical rooms
 */
function loadExistingCanonical(): CanonicalRooms {
  const canonicalPath1 = path.join(__dirname, 'canonical-rooms.json');
  const canonicalPath2 = path.join(__dirname, '..', 'tools', 'canonical-rooms.json');

  const canonicalPath = fs.existsSync(canonicalPath1) ? canonicalPath1 : canonicalPath2;

  if (fs.existsSync(canonicalPath)) {
    return JSON.parse(fs.readFileSync(canonicalPath, 'utf-8'));
  }
  return { rooms: {} };
}

/**
 * Merge extracted data with existing fixes
 */
function mergeCanonicalData(extracted: CanonicalRooms, existing: CanonicalRooms): CanonicalRooms {
  const merged: CanonicalRooms = { rooms: {} };

  // Start with extracted data
  for (const [roomId, data] of Object.entries(extracted.rooms)) {
    merged.rooms[roomId] = { ...data };
  }

  // Override with existing manual fixes (they take precedence)
  for (const [roomId, data] of Object.entries(existing.rooms || {})) {
    if (!merged.rooms[roomId]) {
      merged.rooms[roomId] = {};
    }

    // Keep manual fixes over extracted ones
    if (data.description) {
      merged.rooms[roomId].description = data.description;
    }
    if (data.exits) {
      merged.rooms[roomId].exits = { ...data.exits };
    }
  }

  return merged;
}

/**
 * Main execution
 */
function main() {
  console.log('Extracting canonical room data from ZIL source...\n');

  const extracted = parseZilRooms();
  const existing = loadExistingCanonical();
  const merged = mergeCanonicalData(extracted, existing);

  // Count extracted rooms
  const extractedCount = Object.keys(extracted.rooms).length;
  const existingCount = Object.keys(existing.rooms || {}).length;
  const mergedCount = Object.keys(merged.rooms).length;

  console.log(`Extracted ${extractedCount} rooms from ZIL source`);
  console.log(`Existing manual fixes: ${existingCount} rooms`);
  console.log(`Merged total: ${mergedCount} rooms\n`);

  // Save to file
  const output = {
    _comment: 'Generated from original ZIL source (1dungeon.zil) with manual fixes applied',
    rooms: merged.rooms,
    notes: {
      source: 'Original Zork I ZIL source (1980) from docs/original-src-1980/1dungeon.zil',
      methodology:
        'Extracted LDESC and valid exits (TO statements) from ZIL, merged with manual fixes',
      invalid_exits_removed: [
        'rooms',
        "Error message strings (e.g., 'thereisnotreeheresuitableforclimbing')",
        "Conditional logic (e.g., 'tostudioiffalse-flagelse')",
        "Parser artifacts (e.g., 'permaze-diodestomaze-X')",
      ],
      note_on_exits:
        'Invalid exits (error messages) are handled by the game engine, not stored in room data',
    },
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n');
  console.log(`✅ Canonical room data written to: ${OUTPUT_PATH}`);

  // Show sample of extracted data
  console.log('\nSample extracted rooms:');
  const samples = ['forest-2', 'east-of-chasm', 'gallery', 'kitchen'];
  for (const roomId of samples) {
    if (merged.rooms[roomId]) {
      console.log(`\n${roomId}:`);
      if (merged.rooms[roomId].description) {
        console.log(`  Description: "${merged.rooms[roomId].description?.substring(0, 60)}..."`);
      }
      if (merged.rooms[roomId].exits) {
        console.log(`  Exits: ${JSON.stringify(merged.rooms[roomId].exits)}`);
      }
    }
  }
}

main();
