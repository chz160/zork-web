#!/usr/bin/env node
/**
 * Add Missing Object Properties
 *
 * This tool audits objects and adds missing properties based on canonical flags:
 * - capacity for containers (CONTBT)
 * - isReadable for readable items (READBT)
 * - isFood/edible for food items (FOODBT)
 * - isDoor for doors (DOORBT)
 * - transparent for transparent containers (TRANBT)
 */

/* eslint-disable no-console */

import * as fs from 'fs';
import * as path from 'path';

interface GameObject {
  id: string;
  name: string;
  aliases: string[];
  description: string;
  portable: boolean;
  visible: boolean;
  location: string;
  properties?: GameObjectProperties;
  firstDescription?: string;
}

interface GameObjectProperties {
  isOpen?: boolean;
  isLocked?: boolean;
  contains?: string[];
  capacity?: number | null;
  isLight?: boolean;
  isLit?: boolean;
  touched?: boolean;
  transparent?: boolean;
  isWeapon?: boolean;
  value?: number;
  isReadable?: boolean;
  isFood?: boolean;
  edible?: boolean;
  isDoor?: boolean;
  [key: string]: unknown;
}

interface ObjectsData {
  objects: GameObject[];
}

// Path resolution
const PROJECT_ROOT = path.join(__dirname, '../..');
const OBJECTS_PATH = path.join(PROJECT_ROOT, 'src', 'app', 'data', 'objects.json');

// Known property additions based on canonical analysis
// Sources: artifacts/objects.canonical.json flags and PROPERTY-VERIFICATION-REPORT.md
const PROPERTY_ADDITIONS: Record<string, Partial<GameObjectProperties>> = {
  // Containers without capacity
  book: { capacity: 0, isReadable: true }, // Black book - capacity 0 from canonical objectIndex 46
  'tool-chest': { capacity: 10 }, // Tool chest - estimated capacity (canonical doesn't specify)
  thief: { capacity: 20 }, // Thief's bag - estimated based on game mechanics

  // Readable items (READBT flag in canonical)
  guide: { isReadable: true }, // tour guidebook
  advertisement: { isReadable: true }, // leaflet
  match: { isReadable: true }, // matchbook
  'boat-label': { isReadable: true }, // tan label

  // Food items (FOODBT flag in canonical)
  lunch: { isFood: true, edible: true },
  garlic: { isFood: true, edible: true },

  // Doors (DOORBT flag in canonical)
  'trap-door': { isDoor: true },

  // Transparent containers (TRANBT flag in canonical)
  bottle: { transparent: true },
};

/**
 * Add missing properties to objects
 */
function addMissingProperties(): void {
  console.log('========================================');
  console.log('Add Missing Object Properties');
  console.log('========================================\n');

  console.log('Loading objects data...');
  const objectsData: ObjectsData = JSON.parse(fs.readFileSync(OBJECTS_PATH, 'utf-8'));

  let updatedCount = 0;
  const updates: string[] = [];

  console.log('\nAdding missing properties...\n');

  for (const obj of objectsData.objects) {
    if (obj.id in PROPERTY_ADDITIONS) {
      const additions = PROPERTY_ADDITIONS[obj.id];
      let objUpdated = false;

      // Initialize properties if needed
      if (!obj.properties) {
        obj.properties = {};
      }

      // Add each missing property
      for (const [key, value] of Object.entries(additions)) {
        if (obj.properties[key] === undefined) {
          // Deep clone object values to avoid shared references
          const clonedValue =
            typeof value === 'object' && value !== null ? JSON.parse(JSON.stringify(value)) : value;
          obj.properties[key] = clonedValue;
          updates.push(`  ${obj.name} (${obj.id}): ${key} = ${JSON.stringify(value)}`);
          objUpdated = true;
        }
      }

      if (objUpdated) {
        updatedCount++;
      }
    }
  }

  if (updatedCount === 0) {
    console.log('✨ No updates needed - all properties are set!');
    return;
  }

  console.log(`✅ Updated ${updatedCount} objects:\n`);
  updates.forEach((update) => console.log(update));

  // Write back to file
  const updatedContent = JSON.stringify(objectsData, null, 2);
  fs.writeFileSync(OBJECTS_PATH, updatedContent + '\n', 'utf-8');

  console.log('\n========================================');
  console.log(`Added properties to ${updatedCount} objects`);
  console.log(`Wrote updated data to: ${OBJECTS_PATH}`);
  console.log('========================================');
}

// Run the additions
try {
  addMissingProperties();
} catch (error) {
  console.error('❌ Error adding properties:', error);
  process.exit(1);
}
