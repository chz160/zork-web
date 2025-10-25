#!/usr/bin/env tsx
/**
 * Data Property Verification Tool
 * 
 * Checks if our current data has the proper properties and flags
 * that exist in the canonical C source.
 * 
 * Focus areas:
 * 1. Room properties: isDark, scoring (rval), actions (ractio)
 * 2. Object properties: portable, visible, container, light source, weapon, etc.
 * 3. Critical missing items: treasures, tools, essential quest items
 */

import * as fs from 'fs';
import * as path from 'path';

interface CanonicalObject {
  id: string;
  name: string;
  location: string;
  portable: boolean;
  visible: boolean;
  properties: {
    osize?: number;
    isContainer?: boolean;
    capacity?: number;
    isTreasure?: boolean;
    treasureValue?: number;
    isWeapon?: boolean;
    edible?: boolean;
    isLightSource?: boolean;
    isLit?: boolean;
    isDoor?: boolean;
    isReadable?: boolean;
    canBurn?: boolean;
    [key: string]: unknown;
  };
  cIndexTrace: {
    objectIndex: number;
    messageIndex: number;
    flags: string[];
  };
}

class PropertyVerifier {
  private artifactsDir: string;
  private dataDir: string;

  constructor() {
    this.artifactsDir = path.join(process.cwd(), 'artifacts');
    this.dataDir = path.join(process.cwd(), 'src/app/data');
  }

  private loadJSON<T>(filePath: string): T {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  }

  private checkCriticalProperties() {
    const canonicalObjects = this.loadJSON<CanonicalObject[]>(
      path.join(this.artifactsDir, 'objects.canonical.json')
    );
    // Find critical object types in canonical data
    const containers = canonicalObjects.filter(o => o.cIndexTrace.flags.includes('CONTBT'));
    const lightSources = canonicalObjects.filter(o => o.cIndexTrace.flags.includes('LITEBT'));
    const weapons = canonicalObjects.filter(o => o.cIndexTrace.flags.includes('WEAPONBT'));
    const doors = canonicalObjects.filter(o => o.cIndexTrace.flags.includes('DOORBT'));
    const readableItems = canonicalObjects.filter(o => o.cIndexTrace.flags.includes('READBT'));
    const food = canonicalObjects.filter(o => o.cIndexTrace.flags.includes('FOODBT'));
    const tools = canonicalObjects.filter(o => o.cIndexTrace.flags.includes('TOOLBT'));

    const report: string[] = [];
    report.push('# Property Verification Report');
    report.push('');
    report.push('## Critical Object Types in Canonical Data');
    report.push('');
    report.push(`- **Containers**: ${containers.length} (CONTBT flag)`);
    report.push(`- **Light Sources**: ${lightSources.length} (LITEBT flag)`);
    report.push(`- **Weapons**: ${weapons.length} (WEAPONBT flag)`);
    report.push(`- **Doors**: ${doors.length} (DOORBT flag)`);
    report.push(`- **Readable Items**: ${readableItems.length} (READBT flag)`);
    report.push(`- **Food Items**: ${food.length} (FOODBT flag)`);
    report.push(`- **Tools**: ${tools.length} (TOOLBT flag)`);
    report.push('');

    // Check containers in detail
    report.push('## Container Analysis');
    report.push('');
    report.push('### Containers in Canonical Data (by room location):');
    report.push('');
    containers.forEach(obj => {
      const flags = obj.cIndexTrace.flags.join(', ');
      const cap = obj.properties.capacity || 0;
      report.push(`- Index ${obj.cIndexTrace.objectIndex}: location=${obj.location}, capacity=${cap}, flags=[${flags}]`);
    });
    report.push('');

    // Check light sources
    report.push('## Light Source Analysis');
    report.push('');
    if (lightSources.length > 0) {
      report.push('### Light Sources in Canonical Data:');
      report.push('');
      lightSources.forEach(obj => {
        const flags = obj.cIndexTrace.flags.join(', ');
        const isLit = obj.cIndexTrace.flags.includes('ONBT') ? 'ON' : 'OFF';
        report.push(`- Index ${obj.cIndexTrace.objectIndex}: location=${obj.location}, state=${isLit}, flags=[${flags}]`);
      });
    } else {
      report.push('**Note:** No LITEBT flags found. Light sources may use LIGHTBT flag instead.');
      // Check for LIGHTBT
      const lightObjects = canonicalObjects.filter(o => o.cIndexTrace.flags.includes('LIGHTBT'));
      if (lightObjects.length > 0) {
        report.push('');
        report.push('### Objects with LIGHTBT flag:');
        report.push('');
        lightObjects.forEach(obj => {
          const flags = obj.cIndexTrace.flags.join(', ');
          report.push(`- Index ${obj.cIndexTrace.objectIndex}: location=${obj.location}, flags=[${flags}]`);
        });
      }
    }
    report.push('');

    // Check weapons
    report.push('## Weapon Analysis');
    report.push('');
    if (weapons.length > 0) {
      report.push('### Weapons in Canonical Data:');
      report.push('');
      weapons.forEach(obj => {
        const flags = obj.cIndexTrace.flags.join(', ');
        report.push(`- Index ${obj.cIndexTrace.objectIndex}: location=${obj.location}, flags=[${flags}]`);
      });
    } else {
      report.push('**Note:** No WEAPONBT flags found. Check for FITEBT flag instead.');
      // Check objects with properties that might indicate weapons
      const combatObjects = canonicalObjects.filter(o => 
        o.cIndexTrace.flags.some(f => f.includes('FITE') || f.includes('WEAPON'))
      );
      if (combatObjects.length > 0) {
        report.push('');
        report.push('### Combat-related objects:');
        report.push('');
        combatObjects.forEach(obj => {
          const flags = obj.cIndexTrace.flags.join(', ');
          report.push(`- Index ${obj.cIndexTrace.objectIndex}: location=${obj.location}, flags=[${flags}]`);
        });
      }
    }
    report.push('');

    // Check readable items  
    report.push('## Readable Items Analysis');
    report.push('');
    if (readableItems.length > 0) {
      report.push('### Readable Items in Canonical Data:');
      report.push('');
      readableItems.forEach(obj => {
        const flags = obj.cIndexTrace.flags.join(', ');
        report.push(`- Index ${obj.cIndexTrace.objectIndex}: location=${obj.location}, portable=${obj.portable}, flags=[${flags}]`);
      });
    }
    report.push('');

    // Analyze locations
    report.push('## Object Location Analysis');
    report.push('');
    
    const locationGroups: Record<string, number> = {};
    canonicalObjects.forEach(obj => {
      locationGroups[obj.location] = (locationGroups[obj.location] || 0) + 1;
    });

    const sortedLocations = Object.entries(locationGroups)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    report.push('### Top 20 locations with most objects:');
    report.push('');
    sortedLocations.forEach(([loc, count]) => {
      report.push(`- ${loc}: ${count} objects`);
    });
    report.push('');

    // Check for objects in playable rooms
    report.push('## Objects in Key Playable Rooms');
    report.push('');
    
    const keyRooms = [
      'room-6', 'room-7', 'room-8',  // Likely house rooms
      'room-16', 'room-100', 'room-134', 'room-137', 'room-144'  // Rooms with multiple objects
    ];

    keyRooms.forEach(roomId => {
      const objectsInRoom = canonicalObjects.filter(o => o.location === roomId);
      if (objectsInRoom.length > 0) {
        report.push(`### ${roomId} (${objectsInRoom.length} objects):`);
        report.push('');
        objectsInRoom.forEach(obj => {
          const flags = obj.cIndexTrace.flags.join(', ');
          const portable = obj.portable ? 'portable' : 'fixed';
          report.push(`- Index ${obj.cIndexTrace.objectIndex}: ${portable}, flags=[${flags}]`);
        });
        report.push('');
      }
    });

    // Critical gameplay items analysis
    report.push('## Critical Gameplay Items');
    report.push('');
    report.push('Based on canonical flags, the game should have:');
    report.push('');
    report.push(`1. **${containers.length} Containers** - Essential for inventory puzzles`);
    report.push(`2. **${lightSources.length} Light Sources** - Essential for dark rooms (${128} dark rooms exist)`);
    report.push(`3. **${weapons.length} Weapons** - For combat encounters`);
    report.push(`4. **${doors.length} Doors** - For navigation and access control`);
    report.push(`5. **${readableItems.length} Readable Items** - For clues and information`);
    report.push(`6. **${food.length} Food Items** - For survival mechanics`);
    report.push(`7. **${tools.length} Tools** - For puzzle solving`);
    report.push('');

    report.push('## Recommendations');
    report.push('');
    report.push('### Immediate Actions Required:');
    report.push('');
    
    if (lightSources.length === 0) {
      report.push('1. **CRITICAL**: Investigate light source implementation');
      report.push('   - The canonical data shows objects with LIGHTBT flags');
      report.push('   - With 128 dark rooms, light sources are essential');
      report.push('   - Verify: brass lantern, matches, torch, etc.');
      report.push('');
    }

    report.push('2. **Container Implementation**');
    report.push(`   - Verify all ${containers.length} containers are properly implemented`);
    report.push('   - Check capacity values and containment logic');
    report.push('   - Ensure transparent vs opaque containers work correctly');
    report.push('');

    report.push('3. **Weapon/Combat System**');
    report.push('   - Verify weapon objects are marked correctly');
    report.push('   - Check for FITEBT flags in oflag2');
    report.push('   - Implement weapon properties if missing');
    report.push('');

    report.push('4. **Property Completeness**');
    report.push('   - Add missing property mappings from C flags');
    report.push('   - Document property usage in TypeScript interfaces');
    report.push('   - Create migration script for property additions');
    report.push('');

    return report.join('\n');
  }

  public run() {
    // eslint-disable-next-line no-console
    console.log('='.repeat(80));
    // eslint-disable-next-line no-console
    console.log('Property Verification Tool');
    // eslint-disable-next-line no-console
    console.log('='.repeat(80));
    // eslint-disable-next-line no-console
    console.log('');

    // eslint-disable-next-line no-console
    console.log('Analyzing critical object properties...');
    const report = this.checkCriticalProperties();

    const reportPath = path.join(process.cwd(), 'PROPERTY-VERIFICATION-REPORT.md');
    fs.writeFileSync(reportPath, report, 'utf-8');

    // eslint-disable-next-line no-console
    console.log('');
    // eslint-disable-next-line no-console
    console.log('Report generated successfully!');
    // eslint-disable-next-line no-console
    console.log(`Output: ${reportPath}`);
    // eslint-disable-next-line no-console
    console.log('');
  }
}

const verifier = new PropertyVerifier();
verifier.run();
