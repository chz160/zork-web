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

/**
 * Generates a kebab-case ID from text
 */
function generateId(name: string, index: number): string {
  if (!name || name.trim() === '') {
    return `room-${index}`;
  }

  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Extracts a short name from a description
 * Typically the first sentence or phrase
 */
function extractName(description: string): string {
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
 * Main execution
 */
function main(): void {
  console.log('=== Populate Canonical Data - Phase 3 ===\n');

  const rootDir = path.join(__dirname, '..', '..');
  const artifactsDir = path.join(rootDir, 'artifacts');
  const messagesPath = path.join(artifactsDir, 'messages.json');
  const roomsPath = path.join(artifactsDir, 'rooms.canonical.json');
  const outputPath = path.join(artifactsDir, 'rooms.canonical.populated.json');

  // Load data
  console.log('Loading data files...');
  const messages: Message[] = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
  const rooms: CanonicalRoom[] = JSON.parse(fs.readFileSync(roomsPath, 'utf8'));

  console.log(`Loaded ${messages.length} messages`);
  console.log(`Loaded ${rooms.length} rooms\n`);

  // Track statistics
  let populated = 0;
  let skipped = 0;
  let alreadyHaveId = 0;

  // Populate each room
  console.log('Populating rooms...');
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
          room.name = extractName(mapping.text);
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

  // Report statistics
  console.log('\n=== Population Complete ===');
  console.log(`Total rooms: ${rooms.length}`);
  console.log(`Populated: ${populated}`);
  console.log(`Already had data: ${alreadyHaveId}`);
  console.log(`Skipped (no message): ${skipped}`);

  // Check for ID collisions
  const idSet = new Set<string>();
  const collisions: string[] = [];
  for (const room of rooms) {
    if (idSet.has(room.id)) {
      collisions.push(room.id);
    }
    idSet.add(room.id);
  }

  if (collisions.length > 0) {
    console.warn(`\nWarning: Found ${collisions.length} ID collisions:`);
    for (const id of collisions) {
      console.warn(`  - ${id}`);
    }
  } else {
    console.log('\n✓ All IDs are unique');
  }

  // Save populated data
  console.log(`\nSaving populated data to ${outputPath}...`);
  fs.writeFileSync(outputPath, JSON.stringify(rooms, null, 2));

  console.log('Done!');
}

if (require.main === module) {
  main();
}
