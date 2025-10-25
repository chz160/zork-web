#!/usr/bin/env node
/**
 * Canonical Data Synchronization Tool
 *
 * This tool synchronizes the current game data with canonical data exported from
 * the C version of Zork (v2.7.65). It:
 * 1. Loads canonical rooms and objects (with C indices and flags)
 * 2. Loads messages.json to get actual text content
 * 3. Generates proper IDs and fills in descriptions
 * 4. Merges with existing data (preferring existing where available)
 * 5. Adds all missing rooms and objects
 * 6. Exports updated data files
 */

/* eslint-disable no-console */

import * as fs from 'fs';
import * as path from 'path';

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
  properties: Record<string, any>;
  cIndexTrace: {
    objectIndex: number;
    messageIndex: number;
    flags: string[];
  };
}

interface CurrentRoom {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  exits: Record<string, string>;
  objectIds: string[];
  visited: boolean;
  isDark?: boolean;
}

interface CurrentObject {
  id: string;
  name: string;
  aliases: string[];
  description: string;
  portable: boolean;
  visible: boolean;
  location: string;
  properties?: Record<string, any>;
}

// Paths - resolve from project root
const PROJECT_ROOT = path.join(__dirname, '../..');
const ARTIFACTS_DIR = path.join(PROJECT_ROOT, 'artifacts');
const DATA_DIR = path.join(PROJECT_ROOT, 'src', 'app', 'data');

const CANONICAL_ROOMS_PATH = path.join(ARTIFACTS_DIR, 'rooms.canonical.json');
const CANONICAL_OBJECTS_PATH = path.join(ARTIFACTS_DIR, 'objects.canonical.json');
const MESSAGES_PATH = path.join(ARTIFACTS_DIR, 'messages.json');

const CURRENT_ROOMS_PATH = path.join(DATA_DIR, 'rooms.json');
const CURRENT_OBJECTS_PATH = path.join(DATA_DIR, 'objects.json');

/**
 * Load messages and create a lookup map
 */
function loadMessages(): Map<number, Message> {
  console.log('Loading messages...');
  const content = fs.readFileSync(MESSAGES_PATH, 'utf-8');
  const messages: Message[] = JSON.parse(content);

  const messageMap = new Map<number, Message>();
  for (const msg of messages) {
    // Store by index (canonical data uses negative indices)
    messageMap.set(msg.index, msg);
  }

  console.log(`Loaded ${messages.length} messages`);
  return messageMap;
}

/**
 * Generate a kebab-case ID from text
 */
function generateId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .substring(0, 50); // Limit length
}

/**
 * Get message text by message index (handles negative indices)
 */
function getMessageText(messageIndex: number, messageMap: Map<number, Message>): string {
  if (messageIndex === 0) {
    return '';
  }

  // Canonical data uses negative indices, convert to positive
  const positiveIndex = Math.abs(messageIndex);
  const message = messageMap.get(positiveIndex);
  return message ? message.text : '';
}

/**
 * Populate canonical room with actual content from messages
 */
function populateRoom(canonical: CanonicalRoom, messageMap: Map<number, Message>): CanonicalRoom {
  const description = getMessageText(canonical.cIndexTrace.messageIndex, messageMap);

  if (!description) {
    // Room has no description in messages, generate placeholder
    const roomIdx = canonical.cIndexTrace.roomIndex;
    return {
      ...canonical,
      id: `room-${roomIdx}`,
      name: `Room ${roomIdx}`,
      description: `Room ${roomIdx}`,
      shortDescription: `Room ${roomIdx}`,
    };
  }

  // Generate name from first sentence of description
  const firstSentence = description.split(/[.!?]/)[0].trim();
  const name = firstSentence.length > 50 ? firstSentence.substring(0, 47) + '...' : firstSentence;

  const id = generateId(name) || `room-${canonical.cIndexTrace.roomIndex}`;

  return {
    ...canonical,
    id,
    name,
    description,
    shortDescription: name,
  };
}

/**
 * Populate canonical object with actual content from messages
 */
function populateObject(
  canonical: CanonicalObject,
  messageMap: Map<number, Message>
): CanonicalObject {
  const description = getMessageText(canonical.cIndexTrace.messageIndex, messageMap);

  if (!description) {
    // Object has no description in messages, generate placeholder
    const objIdx = canonical.cIndexTrace.objectIndex;
    return {
      ...canonical,
      id: `object-${objIdx}`,
      name: `Object ${objIdx}`,
      aliases: [`object-${objIdx}`],
      description: `Object ${objIdx}`,
    };
  }

  // Extract name from description (often first few words)
  const words = description.split(/\s+/);
  const name = words.slice(0, 4).join(' ');

  const id = generateId(name) || `object-${canonical.cIndexTrace.objectIndex}`;

  // Generate aliases from name words
  const aliases = [
    id,
    ...name
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2),
  ];

  return {
    ...canonical,
    id,
    name,
    aliases,
    description,
  };
}

/**
 * Main synchronization logic
 */
function syncCanonicalData(): void {
  console.log('========================================');
  console.log('Canonical Data Synchronization Tool');
  console.log('========================================\n');

  // Load all data
  const messageMap = loadMessages();

  console.log('\nLoading canonical data...');
  const canonicalRooms: CanonicalRoom[] = JSON.parse(
    fs.readFileSync(CANONICAL_ROOMS_PATH, 'utf-8')
  );
  const canonicalObjects: CanonicalObject[] = JSON.parse(
    fs.readFileSync(CANONICAL_OBJECTS_PATH, 'utf-8')
  );
  console.log(`Loaded ${canonicalRooms.length} canonical rooms`);
  console.log(`Loaded ${canonicalObjects.length} canonical objects`);

  console.log('\nLoading current data...');
  const currentRoomsData = JSON.parse(fs.readFileSync(CURRENT_ROOMS_PATH, 'utf-8'));
  const currentObjectsData = JSON.parse(fs.readFileSync(CURRENT_OBJECTS_PATH, 'utf-8'));
  const currentRooms: CurrentRoom[] = currentRoomsData.rooms || [];
  const currentObjects: CurrentObject[] = currentObjectsData.objects || [];
  console.log(`Loaded ${currentRooms.length} current rooms`);
  console.log(`Loaded ${currentObjects.length} current objects`);

  // Populate canonical data with messages
  console.log('\nPopulating canonical rooms with message content...');
  const populatedRooms = canonicalRooms.map((r) => populateRoom(r, messageMap));

  console.log('Populating canonical objects with message content...');
  const populatedObjects = canonicalObjects.map((o) => populateObject(o, messageMap));

  // Create lookup maps for current data
  const currentRoomMap = new Map(currentRooms.map((r) => [r.id, r]));
  const currentObjectMap = new Map(currentObjects.map((o) => [o.id, o]));

  // Merge rooms: prefer current data, add missing from canonical
  console.log('\nMerging room data...');
  const mergedRooms: CurrentRoom[] = [...currentRooms];
  let roomsAdded = 0;

  for (const canonical of populatedRooms) {
    if (!currentRoomMap.has(canonical.id)) {
      // Add missing room
      mergedRooms.push({
        id: canonical.id,
        name: canonical.name,
        description: canonical.description,
        shortDescription: canonical.shortDescription,
        exits: canonical.exits,
        objectIds: canonical.objectIds,
        visited: false,
        isDark: canonical.isDark,
      });
      roomsAdded++;
    }
  }

  console.log(`Added ${roomsAdded} missing rooms`);
  console.log(`Total rooms: ${mergedRooms.length}`);

  // Merge objects: prefer current data, add missing from canonical
  console.log('\nMerging object data...');
  const mergedObjects: CurrentObject[] = [...currentObjects];
  let objectsAdded = 0;

  for (const canonical of populatedObjects) {
    if (!currentObjectMap.has(canonical.id)) {
      // Add missing object
      mergedObjects.push({
        id: canonical.id,
        name: canonical.name,
        aliases: canonical.aliases,
        description: canonical.description,
        portable: canonical.portable,
        visible: canonical.visible,
        location: canonical.location,
        properties: canonical.properties,
      });
      objectsAdded++;
    }
  }

  console.log(`Added ${objectsAdded} missing objects`);
  console.log(`Total objects: ${mergedObjects.length}`);

  // Write merged data
  console.log('\nWriting merged data files...');

  const mergedRoomsData = {
    rooms: mergedRooms,
  };
  fs.writeFileSync(CURRENT_ROOMS_PATH, JSON.stringify(mergedRoomsData, null, 2) + '\n', 'utf-8');
  console.log(`✅ Wrote ${mergedRooms.length} rooms to ${CURRENT_ROOMS_PATH}`);

  const mergedObjectsData = {
    objects: mergedObjects,
  };
  fs.writeFileSync(
    CURRENT_OBJECTS_PATH,
    JSON.stringify(mergedObjectsData, null, 2) + '\n',
    'utf-8'
  );
  console.log(`✅ Wrote ${mergedObjects.length} objects to ${CURRENT_OBJECTS_PATH}`);

  console.log('\n========================================');
  console.log('Synchronization complete!');
  console.log('========================================');
}

// Run the sync
try {
  syncCanonicalData();
} catch (error) {
  console.error('❌ Error during synchronization:', error);
  process.exit(1);
}
