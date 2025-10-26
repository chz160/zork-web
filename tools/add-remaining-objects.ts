/**
 * Add ALL remaining canonical objects with placeholder names based on properties
 */

import * as fs from 'fs';
import * as path from 'path';

const projectRoot = __dirname.includes('dist/tools')
  ? path.join(__dirname, '..', '..')
  : path.join(__dirname, '..');

interface GameObject {
  id: string;
  name: string;
  description: string;
  location: string;
  properties?: Record<string, unknown>;
  cIndexTrace?: {
    objectIndex: number;
    messageIndex: number;
    flags: string[];
  };
}

interface ObjectsData {
  objects: GameObject[];
}

// Load current objects
const currentObjectsPath = path.join(projectRoot, 'src', 'app', 'data', 'objects.json');
const currentData: ObjectsData = JSON.parse(fs.readFileSync(currentObjectsPath, 'utf8'));
const currentObjects = currentData.objects;

// Get names we already have (current objects don't have canonical indices)
const existingNames = new Set<string>();
for (const obj of currentObjects) {
  existingNames.add(obj.name.toLowerCase().trim());
}

console.log(`Current objects: ${currentObjects.length}`);
console.log(`Existing object names: ${existingNames.size}`);

// Load ALL canonical objects
const canonicalPath = path.join(projectRoot, 'artifacts', 'objects.canonical.populated.json');
const canonicalObjects: GameObject[] = JSON.parse(fs.readFileSync(canonicalPath, 'utf8'));

console.log(`Canonical objects: ${canonicalObjects.length}`);

// Find missing objects - only add indices 120-215 (the 96 missing objects)
// Objects 0-119 should already exist in the current game data
const objectsToAdd: GameObject[] = [];
for (const canonObj of canonicalObjects) {
  const idx = canonObj.cIndexTrace?.objectIndex;
  
  // Only add objects in the 120-215 range (the actual missing objects)
  if (idx !== undefined && idx >= 120 && idx <= 215) {
    objectsToAdd.push(canonObj);
  }
}

console.log(`\nObjects to add: ${objectsToAdd.length}`);

if (objectsToAdd.length === 0) {
  console.log('No objects to add - all canonical objects already present!');
  process.exit(0);
}

// Categorize by properties
const categorized = {
  treasures: [] as GameObject[],
  doors: [] as GameObject[],
  readable: [] as GameObject[],
  containers: [] as GameObject[],
  weapons: [] as GameObject[],
  tools: [] as GameObject[],
  generic: [] as GameObject[],
};

for (const obj of objectsToAdd) {
  const props = obj.properties || {};
  const flags = obj.cIndexTrace?.flags || [];
  
  if (props.ofval || props.otval) {
    categorized.treasures.push(obj);
  } else if (flags.includes('DOORBT') || props.doorDir) {
    categorized.doors.push(obj);
  } else if (flags.includes('READBT') || props.readText) {
    categorized.readable.push(obj);
  } else if (flags.includes('CONTBT') || flags.includes('OPENBT')) {
    categorized.containers.push(obj);
  } else if (flags.includes('WEAPONBT') || props.damage) {
    categorized.weapons.push(obj);
  } else if (flags.includes('TOOLBT') || flags.includes('LIGHTBT')) {
    categorized.tools.push(obj);
  } else {
    categorized.generic.push(obj);
  }
}

console.log(`\nCategorized objects:`);
console.log(`  Treasures:  ${categorized.treasures.length}`);
console.log(`  Doors:      ${categorized.doors.length}`);
console.log(`  Readable:   ${categorized.readable.length}`);
console.log(`  Containers: ${categorized.containers.length}`);
console.log(`  Weapons:    ${categorized.weapons.length}`);
console.log(`  Tools:      ${categorized.tools.length}`);
console.log(`  Generic:    ${categorized.generic.length}`);

// Generate placeholder names based on category and properties
function generateObjectName(obj: GameObject, category: string): { id: string; name: string; description: string } {
  const idx = obj.cIndexTrace!.objectIndex;
  const props = obj.properties || {};
  
  let id: string;
  let name: string;
  let description: string;
  
  switch (category) {
    case 'treasure':
      const value = props.ofval || props.otval || 0;
      id = `treasure-${idx}`;
      name = `Treasure (${value} points)`;
      description = `A valuable treasure worth ${value} points.`;
      break;
      
    case 'door':
      id = `door-${idx}`;
      name = `Door`;
      description = `A door that can be opened or closed.`;
      break;
      
    case 'readable':
      id = `readable-${idx}`;
      name = `Readable Object`;
      description = `Something that can be read.`;
      break;
      
    case 'container':
      id = `container-${idx}`;
      name = `Container`;
      description = `A container that can hold objects.`;
      break;
      
    case 'weapon':
      id = `weapon-${idx}`;
      name = `Weapon`;
      description = `A weapon that can be used in combat.`;
      break;
      
    case 'tool':
      id = `tool-${idx}`;
      name = `Tool`;
      description = `A useful tool or implement.`;
      break;
      
    default:
      id = `object-${idx}`;
      name = `Object ${idx}`;
      description = `An object in the game world.`;
  }
  
  return { id, name, description };
}

// Process objects for merging
const processedObjects: GameObject[] = [];

for (const [category, objects] of Object.entries(categorized)) {
  for (const obj of objects) {
    const { id, name, description } = generateObjectName(obj, category);
    
    // Map location from canonical room index to current room ID
    let locationId = obj.location;
    
    // If location is a room index, map it to room ID
    if (locationId && locationId.match(/^\d+$/)) {
      const roomIdx = parseInt(locationId, 10);
      
      // Room indices above 189 are invalid (canonical only goes to 189)
      if (roomIdx > 189) {
        locationId = 'void'; // Invalid room, place in void
      } else {
        // Try to find room by index - rooms we added have format like "room-137"
        // But some might have descriptive names with index appended
        locationId = `room-${roomIdx}`;
      }
    }
    
    // If location is "void" or empty, keep it as void
    if (!locationId || locationId === 'void' || locationId === '') {
      locationId = 'void';
    }
    
    const finalObject: GameObject = {
      id,
      name,
      description,
      location: locationId,
    };
    
    // Add properties if they exist
    if (obj.properties && Object.keys(obj.properties).length > 0) {
      finalObject.properties = obj.properties;
    }
    
    processedObjects.push(finalObject);
  }
}

// Merge with current objects
const mergedObjects = [...currentObjects, ...processedObjects];

console.log(`\nMerge summary:`);
console.log(`  Current:  ${currentObjects.length}`);
console.log(`  Adding:   ${processedObjects.length}`);
console.log(`  Total:    ${mergedObjects.length}`);

// Show sample of new objects
console.log(`\nSample of new objects (first 10):`);
processedObjects.slice(0, 10).forEach((obj, i) => {
  console.log(`  ${i + 1}. ${obj.id} - ${obj.name} (location: ${obj.location})`);
});

// Check if dry run
if (process.argv.includes('--dry-run')) {
  console.log('\n[DRY RUN] No changes written.');
  process.exit(0);
}

// Backup current
const backupPath = path.join(projectRoot, 'artifacts', 'phase4', 'objects.pre-final-merge.backup.json');
fs.writeFileSync(backupPath, JSON.stringify(currentData, null, 2));
console.log(`\n✓ Backup created: ${backupPath}`);

// Save merged objects
fs.writeFileSync(currentObjectsPath, JSON.stringify({ objects: mergedObjects }, null, 2));
console.log(`✓ Saved ${mergedObjects.length} objects to ${currentObjectsPath}`);

console.log('\n✓ Merge complete!');
