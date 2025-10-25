#!/usr/bin/env node
/**
 * Fix Malformed Object Descriptions
 *
 * Several objects have malformed descriptions where words are separated by commas
 * instead of spaces. This script fixes those descriptions with proper canonical text.
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
  properties?: Record<string, unknown>;
  firstDescription?: string;
}

interface ObjectsData {
  objects: GameObject[];
}

// Path resolution
const PROJECT_ROOT = path.join(__dirname, '../..');
const OBJECTS_PATH = path.join(PROJECT_ROOT, 'src', 'app', 'data', 'objects.json');

// Canonical descriptions from messages.json
const DESCRIPTION_FIXES: Record<string, string> = {
  troll: 'A nasty-looking troll, brandishing a bloody axe, blocks all passages out of the room.',
  thief:
    'There is a suspicious-looking individual, holding a bag, leaning against one wall. He is armed with a vicious-looking stilletto.',
  skull: 'It appears to be grinning at you rather nastily.',
  sceptre: 'The sceptre is ornamented with colored enamel, and tapers to a sharp point.',
  egg: 'The egg is covered with fine gold inlay, and ornamented in lapis lazuli and mother-of-pearl. Unlike most eggs, this one is hinged and closed with a delicate looking clasp. The egg appears extremely fragile.',
  canary:
    'The golden clockwork canary has jewel-like eyes and a silver beak. Through a crystal window below its left wing you can see intricate machinery inside. It appears to have wound down.',
  'broken-canary':
    'The broken clockwork canary appears to have recently had a bad experience. The mountings for its jewel-like eyes are empty, and its silver beak is crumpled. Through a cracked crystal window below its left wing you can see the remains of intricate machinery. It is not clear what result winding it would have, as the mainspring seems sprung.',
};

/**
 * Fix malformed object descriptions
 */
function fixDescriptions(): void {
  console.log('========================================');
  console.log('Fix Malformed Object Descriptions');
  console.log('========================================\n');

  console.log('Loading objects data...');
  const objectsData: ObjectsData = JSON.parse(fs.readFileSync(OBJECTS_PATH, 'utf-8'));

  let fixedCount = 0;

  console.log('\nApplying description fixes...\n');

  for (const obj of objectsData.objects) {
    if (obj.id in DESCRIPTION_FIXES) {
      const oldDesc = obj.description;
      const newDesc = DESCRIPTION_FIXES[obj.id];

      if (oldDesc !== newDesc) {
        console.log(`✅ Fixed: ${obj.name} (${obj.id})`);
        console.log(`   Old: "${oldDesc.substring(0, 60)}..."`);
        console.log(`   New: "${newDesc.substring(0, 60)}..."`);
        console.log('');

        obj.description = newDesc;
        fixedCount++;
      }
    }
  }

  if (fixedCount === 0) {
    console.log('✨ No fixes needed - all descriptions are correct!');
    return;
  }

  // Write back to file
  const updatedContent = JSON.stringify(objectsData, null, 2);
  fs.writeFileSync(OBJECTS_PATH, updatedContent + '\n', 'utf-8');

  console.log('========================================');
  console.log(`Fixed ${fixedCount} object descriptions`);
  console.log(`Wrote updated data to: ${OBJECTS_PATH}`);
  console.log('========================================');
}

// Run the fix
try {
  fixDescriptions();
} catch (error) {
  console.error('❌ Error fixing descriptions:', error);
  process.exit(1);
}
