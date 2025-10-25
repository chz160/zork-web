/**
 * Phase 4 Tool: Extract New Content
 *
 * Identifies missing entities by comparing canonical data with current game data.
 * Outputs lists of new rooms and objects to be added.
 */

import * as fs from 'fs';
import * as path from 'path';

interface Room {
  id: string;
  name: string;
  description: string;
  [key: string]: unknown;
}

interface GameObject {
  id: string;
  name: string;
  description: string;
  [key: string]: unknown;
}

interface CurrentData {
  rooms: Room[];
}

interface CurrentObjectData {
  objects: GameObject[];
}

interface ExtractionResult {
  newRooms: Room[];
  newObjects: GameObject[];
  stats: {
    currentRooms: number;
    canonicalRooms: number;
    newRoomsCount: number;
    currentObjects: number;
    canonicalObjects: number;
    newObjectsCount: number;
  };
}

// Get project root - when run with tsx from tools/, go up one level
// When run compiled from dist/tools, go up two levels
const projectRoot = __dirname.includes('dist/tools')
  ? path.join(__dirname, '..', '..')
  : path.join(__dirname, '..');

function loadCurrentRooms(): Room[] {
  const filePath = path.join(projectRoot, 'src', 'app', 'data', 'rooms.json');
  const data: CurrentData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return data.rooms;
}

function loadCurrentObjects(): GameObject[] {
  const filePath = path.join(projectRoot, 'src', 'app', 'data', 'objects.json');
  const data: CurrentObjectData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return data.objects;
}

function loadCanonicalRooms(): Room[] {
  const filePath = path.join(projectRoot, 'artifacts', 'rooms.canonical.populated.json');
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadCanonicalObjects(): GameObject[] {
  const filePath = path.join(projectRoot, 'artifacts', 'objects.canonical.populated.json');
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Find rooms in canonical data that don't exist in current data
 * Match by name since IDs are different between canonical and current
 */
function findNewRooms(current: Room[], canonical: Room[]): Room[] {
  const currentNames = new Set(current.map((r) => r.name.toLowerCase()));
  return canonical.filter((r) => {
    // Skip placeholder rooms (incomplete data from Phase 3)
    if (r.name.startsWith('Room ') && r.name === r.description) {
      return false;
    }
    return !currentNames.has(r.name.toLowerCase());
  });
}

/**
 * Find objects in canonical data that don't exist in current data
 * Match by name since IDs are different between canonical and current
 */
function findNewObjects(current: GameObject[], canonical: GameObject[]): GameObject[] {
  const currentNames = new Set(current.map((o) => o.name.toLowerCase()));
  return canonical.filter((o) => {
    // Skip objects with empty names (incomplete data)
    if (!o.name || o.name.trim() === '') {
      return false;
    }
    return !currentNames.has(o.name.toLowerCase());
  });
}

/**
 * Main extraction function
 */
function extractNewContent(): ExtractionResult {
  console.log('Loading current game data...');
  const currentRooms = loadCurrentRooms();
  const currentObjects = loadCurrentObjects();

  console.log('Loading canonical data...');
  const canonicalRooms = loadCanonicalRooms();
  const canonicalObjects = loadCanonicalObjects();

  console.log('Finding new content...');
  const newRooms = findNewRooms(currentRooms, canonicalRooms);
  const newObjects = findNewObjects(currentObjects, canonicalObjects);

  return {
    newRooms,
    newObjects,
    stats: {
      currentRooms: currentRooms.length,
      canonicalRooms: canonicalRooms.length,
      newRoomsCount: newRooms.length,
      currentObjects: currentObjects.length,
      canonicalObjects: canonicalObjects.length,
      newObjectsCount: newObjects.length,
    },
  };
}

/**
 * Save extraction results to files
 */
function saveResults(result: ExtractionResult): void {
  const outputDir = path.join(projectRoot, 'artifacts', 'phase4');

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Save new rooms
  const roomsFile = path.join(outputDir, 'new-rooms.json');
  fs.writeFileSync(roomsFile, JSON.stringify(result.newRooms, null, 2));
  console.log(`✓ Saved ${result.newRooms.length} new rooms to ${roomsFile}`);

  // Save new objects
  const objectsFile = path.join(outputDir, 'new-objects.json');
  fs.writeFileSync(objectsFile, JSON.stringify(result.newObjects, null, 2));
  console.log(`✓ Saved ${result.newObjects.length} new objects to ${objectsFile}`);

  // Save stats
  const statsFile = path.join(outputDir, 'extraction-stats.json');
  fs.writeFileSync(statsFile, JSON.stringify(result.stats, null, 2));
  console.log(`✓ Saved extraction stats to ${statsFile}`);
}

/**
 * Print summary report
 */
function printSummary(result: ExtractionResult): void {
  console.log('\n=== PHASE 4 CONTENT EXTRACTION SUMMARY ===\n');

  console.log('ROOMS:');
  console.log(`  Current:   ${result.stats.currentRooms}`);
  console.log(`  Canonical: ${result.stats.canonicalRooms}`);
  console.log(`  New:       ${result.stats.newRoomsCount}`);
  console.log(`  Target:    ${result.stats.currentRooms + result.stats.newRoomsCount}`);

  console.log('\nOBJECTS:');
  console.log(`  Current:   ${result.stats.currentObjects}`);
  console.log(`  Canonical: ${result.stats.canonicalObjects}`);
  console.log(`  New:       ${result.stats.newObjectsCount}`);
  console.log(`  Target:    ${result.stats.currentObjects + result.stats.newObjectsCount}`);

  console.log('\nSTATUS:');
  const roomsMatch =
    result.stats.currentRooms + result.stats.newRoomsCount === result.stats.canonicalRooms;
  const objectsMatch =
    result.stats.currentObjects + result.stats.newObjectsCount === result.stats.canonicalObjects;

  if (roomsMatch && objectsMatch) {
    console.log('  ✓ All canonical content will be present after merge');
  } else {
    console.log('  ⚠ Warning: Counts do not match canonical data');
    if (!roomsMatch) {
      console.log(
        `    Rooms: ${result.stats.currentRooms} + ${result.stats.newRoomsCount} ≠ ${result.stats.canonicalRooms}`
      );
    }
    if (!objectsMatch) {
      console.log(
        `    Objects: ${result.stats.currentObjects} + ${result.stats.newObjectsCount} ≠ ${result.stats.canonicalObjects}`
      );
    }
  }

  console.log('\n=========================================\n');
}

// Main execution
if (require.main === module) {
  try {
    const result = extractNewContent();
    saveResults(result);
    printSummary(result);

    if (result.stats.newRoomsCount === 0 && result.stats.newObjectsCount === 0) {
      console.log('No new content found - all canonical data already present!');
      process.exit(0);
    }

    console.log('Next steps:');
    console.log('  1. Review new content in artifacts/phase4/');
    console.log('  2. Run categorization: npm run phase4:categorize');
    console.log('  3. Begin merge: npm run phase4:merge');
  } catch (error) {
    console.error('Error extracting new content:', error);
    process.exit(1);
  }
}

export { extractNewContent };
export type { ExtractionResult };
