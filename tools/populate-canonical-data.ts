#!/usr/bin/env node
/**
 * Populate Canonical Data - Phase 3
 *
 * Uses the message mapping results to populate canonical rooms and objects
 * with proper IDs, names, and descriptions from messages.json.
 */

/* eslint-disable no-console */

import * as fs from 'fs';
import * as path from 'path';
import { mapMessage } from './map-canonical-messages';

interface Message {
  index: number;
  offset: number;
  text: string;
  chunks: number[];
  hasSubstitutions: boolean;
}

interface CanonicalRoom {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  exits: Record<string, string>;
  objectIds: string[];
  visited: boolean;
  isDark: boolean;
  properties: {
    rval?: number;
    ractio?: number;
    rflag: number;
  };
  cIndexTrace: {
    roomIndex: number;
    messageIndex: number;
    flags: string[];
  };
}

interface CanonicalObject {
  id: string;
  name: string;
  aliases: string[];
  description: string;
  portable: boolean;
  visible: boolean;
  location: string;
  properties: Record<string, unknown>;
  cIndexTrace: {
    objectIndex: number;
    messageIndex: number;
    flags: string[];
  };
}

/**
 * Generates a kebab-case ID from text
 */
function generateId(name: string, index: number): string {
  if (!name || name.trim() === '') {
    return `room-${index}`;
  }

  const processedName = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

  // Fallback to room-index if processing resulted in empty string
  return processedName || `room-${index}`;
}

/**
 * Extracts a short name from a room description
 * Typically the first sentence or phrase
 */
function extractRoomName(description: string): string {
  if (!description) return '';

  // Try to find first sentence
  const sentences = description.split(/[.!?\n]/);
  let name = sentences[0].trim();

  // If first sentence starts with "You are", try to extract location
  if (name.toLowerCase().startsWith('you are ')) {
    // "You are in the kitchen" -> "Kitchen"
    // "You are standing in an open field" -> "Open Field"
    name = name.replace(/^you are (in |at |on |standing in |inside )?/i, '').trim();
  }

  // Limit length
  if (name.length > 50) {
    const words = name.split(' ');
    name = words.slice(0, 5).join(' ');
  }

  // Capitalize first letter of each word
  name = name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return name;
}

/**
 * Extracts a short name from an object description
 * For objects, typically the first noun phrase or word
 */
function extractObjectName(description: string): string {
  if (!description) return '';

  // Clean up the description
  let text = description.trim();

  // Remove common prefixes
  text = text.replace(/^(a |an |the |this |that |some )/i, '');

  // Try to get first sentence or phrase
  const sentences = text.split(/[.!?\n]/);
  let name = sentences[0].trim();

  // Take first few words (typically the noun phrase)
  const words = name.split(' ');
  if (words.length > 4) {
    name = words.slice(0, 4).join(' ');
  }

  // Limit length
  if (name.length > 40) {
    name = name.substring(0, 40).trim();
    // Remove trailing partial word
    const lastSpace = name.lastIndexOf(' ');
    if (lastSpace > 20) {
      name = name.substring(0, lastSpace);
    }
  }

  // Capitalize first letter of each word
  name = name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return name;
}

/**
 * Populates rooms with names and descriptions
 */
function populateRooms(
  rooms: CanonicalRoom[],
  messages: Message[]
): { populated: number; skipped: number; alreadyHaveId: number } {
  console.log('Populating rooms...');

  let populated = 0;
  let skipped = 0;
  let alreadyHaveId = 0;

  for (const room of rooms) {
    // Skip if already has ID and description
    if (room.id && room.description) {
      alreadyHaveId++;
      continue;
    }

    // Map message index to get text
    if (room.cIndexTrace.messageIndex !== 0) {
      const mapping = mapMessage(room.cIndexTrace.messageIndex, messages);

      if (mapping.messageIndex && mapping.text) {
        // Extract description
        room.description = mapping.text;

        // Extract or generate name
        if (!room.name) {
          room.name = extractRoomName(mapping.text);
        }

        // Generate ID if not present
        if (!room.id) {
          const baseId = generateId(room.name, room.cIndexTrace.roomIndex);
          room.id = `${baseId}-${room.cIndexTrace.roomIndex}`;
        }

        // Set short description (use name if not present)
        if (!room.shortDescription) {
          room.shortDescription = room.name;
        }

        populated++;
      } else {
        console.warn(
          `Warning: Could not map message index ${room.cIndexTrace.messageIndex} for room ${room.cIndexTrace.roomIndex}`
        );
        skipped++;
      }
    } else {
      // No message index - generate minimal data
      if (!room.id) {
        room.id = `room-${room.cIndexTrace.roomIndex}`;
      }
      if (!room.name) {
        room.name = `Room ${room.cIndexTrace.roomIndex}`;
      }
      if (!room.description) {
        room.description = `Room ${room.cIndexTrace.roomIndex}`;
      }
      skipped++;
    }
  }

  return { populated, skipped, alreadyHaveId };
}

/**
 * Populates objects with names and descriptions
 */
function populateObjects(
  objects: CanonicalObject[],
  messages: Message[]
): { populated: number; skipped: number; alreadyHaveId: number } {
  console.log('Populating objects...');

  let populated = 0;
  let skipped = 0;
  let alreadyHaveId = 0;

  for (const obj of objects) {
    // Skip if already has ID and description
    if (obj.id && obj.description) {
      alreadyHaveId++;
      continue;
    }

    // Map message index to get text
    if (obj.cIndexTrace.messageIndex !== 0) {
      const mapping = mapMessage(obj.cIndexTrace.messageIndex, messages);

      if (mapping.messageIndex && mapping.text) {
        // Extract description
        obj.description = mapping.text;

        // Extract or generate name
        if (!obj.name) {
          obj.name = extractObjectName(mapping.text);
        }

        // Generate ID if not present
        if (!obj.id) {
          const baseId = generateId(obj.name, obj.cIndexTrace.objectIndex);
          obj.id = `${baseId}-${obj.cIndexTrace.objectIndex}`;
        }

        // Update aliases if empty
        if (obj.aliases.length === 0 || obj.aliases[0] === '') {
          // Create aliases from name
          const words = obj.name.toLowerCase().split(' ');
          obj.aliases = [
            obj.name.toLowerCase(),
            ...words.filter((w) => w.length > 2), // Include significant words
          ];
        }

        populated++;
      } else {
        console.warn(
          `Warning: Could not map message index ${obj.cIndexTrace.messageIndex} for object ${obj.cIndexTrace.objectIndex}`
        );
        skipped++;
      }
    } else {
      // No message index - generate minimal data
      if (!obj.id) {
        obj.id = `object-${obj.cIndexTrace.objectIndex}`;
      }
      if (!obj.name) {
        obj.name = `Object ${obj.cIndexTrace.objectIndex}`;
      }
      if (!obj.description) {
        obj.description = `Object ${obj.cIndexTrace.objectIndex}`;
      }
      if (obj.aliases.length === 0 || obj.aliases[0] === '') {
        obj.aliases = [obj.name.toLowerCase()];
      }
      skipped++;
    }
  }

  return { populated, skipped, alreadyHaveId };
}

/**
 * Main execution
 */
function main(): void {
  console.log('=== Populate Canonical Data - Phase 3 ===\n');

  const rootDir = path.join(__dirname, '..', '..');
  const artifactsDir = path.join(rootDir, 'artifacts');
  const messagesPath = path.join(artifactsDir, 'messages.json');
  const roomsPath = path.join(artifactsDir, 'rooms.canonical.json');
  const objectsPath = path.join(artifactsDir, 'objects.canonical.json');
  const roomsOutputPath = path.join(artifactsDir, 'rooms.canonical.populated.json');
  const objectsOutputPath = path.join(artifactsDir, 'objects.canonical.populated.json');

  // Load data
  console.log('Loading data files...');
  const messages: Message[] = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
  const rooms: CanonicalRoom[] = JSON.parse(fs.readFileSync(roomsPath, 'utf8'));
  const objects: CanonicalObject[] = JSON.parse(fs.readFileSync(objectsPath, 'utf8'));

  console.log(`Loaded ${messages.length} messages`);
  console.log(`Loaded ${rooms.length} rooms`);
  console.log(`Loaded ${objects.length} objects\n`);

  // Populate rooms
  const roomStats = populateRooms(rooms, messages);

  // Report room statistics
  console.log('\n=== Room Population Complete ===');
  console.log(`Total rooms: ${rooms.length}`);
  console.log(`Populated: ${roomStats.populated}`);
  console.log(`Already had data: ${roomStats.alreadyHaveId}`);
  console.log(`Skipped (no message): ${roomStats.skipped}`);

  // Check for room ID collisions
  const roomIdSet = new Set<string>();
  const roomCollisions: string[] = [];
  for (const room of rooms) {
    if (roomIdSet.has(room.id)) {
      roomCollisions.push(room.id);
    }
    roomIdSet.add(room.id);
  }

  if (roomCollisions.length > 0) {
    console.warn(`\nWarning: Found ${roomCollisions.length} room ID collisions:`);
    for (const id of roomCollisions) {
      console.warn(`  - ${id}`);
    }
  } else {
    console.log('✓ All room IDs are unique');
  }

  // Populate objects
  console.log('\n');
  const objectStats = populateObjects(objects, messages);

  // Report object statistics
  console.log('\n=== Object Population Complete ===');
  console.log(`Total objects: ${objects.length}`);
  console.log(`Populated: ${objectStats.populated}`);
  console.log(`Already had data: ${objectStats.alreadyHaveId}`);
  console.log(`Skipped (no message): ${objectStats.skipped}`);

  // Check for object ID collisions
  const objectIdSet = new Set<string>();
  const objectCollisions: string[] = [];
  for (const obj of objects) {
    if (objectIdSet.has(obj.id)) {
      objectCollisions.push(obj.id);
    }
    objectIdSet.add(obj.id);
  }

  if (objectCollisions.length > 0) {
    console.warn(`\nWarning: Found ${objectCollisions.length} object ID collisions:`);
    for (const id of objectCollisions) {
      console.warn(`  - ${id}`);
    }
  } else {
    console.log('✓ All object IDs are unique');
  }

  // Save populated data
  console.log(`\n=== Saving Results ===`);
  console.log(`Saving rooms to ${roomsOutputPath}...`);
  fs.writeFileSync(roomsOutputPath, JSON.stringify(rooms, null, 2));
  console.log(`Saving objects to ${objectsOutputPath}...`);
  fs.writeFileSync(objectsOutputPath, JSON.stringify(objects, null, 2));

  console.log('\n✅ Done! Phase 3 object population complete.');
  console.log('Phase 4 can now proceed with adding 96 missing objects.');
}

if (require.main === module) {
  main();
}
