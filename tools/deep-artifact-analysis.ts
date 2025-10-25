#!/usr/bin/env tsx
/**
 * Deep Artifact Analysis Tool
 *
 * Analyzes the canonical C source artifacts to understand:
 * 1. What structural properties and flags should exist
 * 2. What counts and relationships are in the canonical version
 * 3. What we might be missing or have incorrectly implemented
 */

import * as fs from 'fs';
import * as path from 'path';

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

interface Message {
  index: number;
  offset: number;
  text: string;
  chunks: number[];
  hasSubstitutions: boolean;
}

interface TraceData {
  header: {
    version: {
      major: number;
      minor: number;
      edit: number;
    };
    gameParams: {
      maxScore: number;
      strbit: number;
      endgameMaxScore: number;
    };
  };
  roomCount: number;
  objectCount: number;
  messageCount: number;
  travelCount: number;
}

class DeepArtifactAnalyzer {
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

  private analyzeRoomFlags(rooms: CanonicalRoom[]) {
    const flagCounts: Record<string, number> = {};
    const roomsWithActions: CanonicalRoom[] = [];
    const roomsWithValue: CanonicalRoom[] = [];
    const darkRooms: CanonicalRoom[] = [];
    const lightRooms: CanonicalRoom[] = [];

    for (const room of rooms) {
      // Count flag occurrences
      if (room.cIndexTrace && room.cIndexTrace.flags) {
        room.cIndexTrace.flags.forEach((flag) => {
          flagCounts[flag] = (flagCounts[flag] || 0) + 1;
        });
      }

      // Track special properties
      if (room.properties.ractio && room.properties.ractio > 0) {
        roomsWithActions.push(room);
      }

      if (room.properties.rval && room.properties.rval > 0) {
        roomsWithValue.push(room);
      }

      if (room.isDark) {
        darkRooms.push(room);
      } else {
        lightRooms.push(room);
      }
    }

    return {
      flagCounts,
      roomsWithActions,
      roomsWithValue,
      darkRooms,
      lightRooms,
    };
  }

  private analyzeObjectFlags(objects: CanonicalObject[]) {
    const flagCounts: Record<string, number> = {};
    const locationCounts: Record<string, number> = {};
    const portableObjects: CanonicalObject[] = [];
    const containers: CanonicalObject[] = [];
    const lightSources: CanonicalObject[] = [];
    const weapons: CanonicalObject[] = [];
    const edibleObjects: CanonicalObject[] = [];
    const treasures: CanonicalObject[] = [];

    for (const obj of objects) {
      // Count flag occurrences
      if (obj.cIndexTrace && obj.cIndexTrace.flags) {
        obj.cIndexTrace.flags.forEach((flag) => {
          flagCounts[flag] = (flagCounts[flag] || 0) + 1;
        });
      }

      // Count locations
      locationCounts[obj.location] = (locationCounts[obj.location] || 0) + 1;

      // Categorize objects
      if (obj.portable) {
        portableObjects.push(obj);
      }

      if (obj.properties['isContainer']) {
        containers.push(obj);
      }

      if (obj.cIndexTrace.flags.includes('LITEBT')) {
        lightSources.push(obj);
      }

      if (obj.cIndexTrace.flags.includes('WEAPONBT')) {
        weapons.push(obj);
      }

      if (obj.properties['edible']) {
        edibleObjects.push(obj);
      }

      if (obj.properties['isTreasure'] || obj.properties['treasureValue']) {
        treasures.push(obj);
      }
    }

    return {
      flagCounts,
      locationCounts,
      portableObjects,
      containers,
      lightSources,
      weapons,
      edibleObjects,
      treasures,
    };
  }

  private compareWithCurrentData() {
    const currentRooms = this.loadJSON<{ rooms: any[] }>(path.join(this.dataDir, 'rooms.json'));
    const currentObjects = this.loadJSON<{ objects: any[] }>(
      path.join(this.dataDir, 'objects.json')
    );

    // Check for properties we might be missing
    const currentRoomProperties = new Set<string>();
    const currentObjectProperties = new Set<string>();

    currentRooms.rooms.forEach((room) => {
      Object.keys(room).forEach((key) => currentRoomProperties.add(key));
      if (room.properties) {
        Object.keys(room.properties).forEach((key) =>
          currentRoomProperties.add(`properties.${key}`)
        );
      }
    });

    currentObjects.objects.forEach((obj) => {
      Object.keys(obj).forEach((key) => currentObjectProperties.add(key));
      if (obj.properties) {
        Object.keys(obj.properties).forEach((key) =>
          currentObjectProperties.add(`properties.${key}`)
        );
      }
    });

    return {
      currentRoomCount: currentRooms.rooms.length,
      currentObjectCount: currentObjects.objects.length,
      currentRoomProperties: Array.from(currentRoomProperties).sort(),
      currentObjectProperties: Array.from(currentObjectProperties).sort(),
    };
  }

  public run() {
    console.log('='.repeat(80));
    console.log('Deep Artifact Analysis');
    console.log('='.repeat(80));
    console.log('');

    // Load data
    console.log('Loading artifact files...');
    const canonicalRooms = this.loadJSON<CanonicalRoom[]>(
      path.join(this.artifactsDir, 'rooms.canonical.json')
    );
    const canonicalObjects = this.loadJSON<CanonicalObject[]>(
      path.join(this.artifactsDir, 'objects.canonical.json')
    );
    const messages = this.loadJSON<Message[]>(path.join(this.artifactsDir, 'messages.json'));
    const trace = this.loadJSON<TraceData>(path.join(this.artifactsDir, 'trace.json'));

    console.log('Analyzing room structure...');
    const roomAnalysis = this.analyzeRoomFlags(canonicalRooms);

    console.log('Analyzing object structure...');
    const objectAnalysis = this.analyzeObjectFlags(canonicalObjects);

    console.log('Comparing with current data...');
    const currentData = this.compareWithCurrentData();

    // Generate comprehensive report
    const lines: string[] = [];

    lines.push('# Deep Artifact Analysis Report');
    lines.push('');
    lines.push('## Canonical C Source Metadata');
    lines.push('');
    lines.push(
      `**Version:** ${trace.header.version.major}.${trace.header.version.minor}.${trace.header.version.edit}`
    );
    lines.push(`**Max Score:** ${trace.header.gameParams.maxScore}`);
    lines.push(`**Endgame Max Score:** ${trace.header.gameParams.endgameMaxScore}`);
    lines.push('');
    lines.push('## Entity Counts');
    lines.push('');
    lines.push('| Entity | Canonical C | Current Data | Delta |');
    lines.push('|--------|-------------|--------------|-------|');
    lines.push(
      `| Rooms | ${trace.roomCount} | ${currentData.currentRoomCount} | ${trace.roomCount - currentData.currentRoomCount} |`
    );
    lines.push(
      `| Objects | ${trace.objectCount} | ${currentData.currentObjectCount} | ${trace.objectCount - currentData.currentObjectCount} |`
    );
    lines.push(`| Messages | ${trace.messageCount} | N/A | N/A |`);
    lines.push(`| Travel Entries | ${trace.travelCount} | N/A | N/A |`);
    lines.push('');

    // Room flags analysis
    lines.push('## Room Flags Analysis (from C source)');
    lines.push('');
    lines.push('### Flag Frequency');
    lines.push('');
    const sortedRoomFlags = Object.entries(roomAnalysis.flagCounts).sort((a, b) => b[1] - a[1]);
    sortedRoomFlags.forEach(([flag, count]) => {
      lines.push(`- **${flag}**: ${count} rooms`);
    });
    lines.push('');

    lines.push('### Room Categories');
    lines.push('');
    lines.push(
      `- **Rooms with Actions**: ${roomAnalysis.roomsWithActions.length} (special behavior code)`
    );
    lines.push(`- **Rooms with Value**: ${roomAnalysis.roomsWithValue.length} (scoring/treasure)`);
    lines.push(`- **Dark Rooms**: ${roomAnalysis.darkRooms.length} (require light source)`);
    lines.push(`- **Light Rooms**: ${roomAnalysis.lightRooms.length} (naturally lit)`);
    lines.push('');

    // Object flags analysis
    lines.push('## Object Flags Analysis (from C source)');
    lines.push('');
    lines.push('### Flag Frequency');
    lines.push('');
    const sortedObjectFlags = Object.entries(objectAnalysis.flagCounts).sort((a, b) => b[1] - a[1]);
    sortedObjectFlags.forEach(([flag, count]) => {
      lines.push(`- **${flag}**: ${count} objects`);
    });
    lines.push('');

    lines.push('### Object Categories');
    lines.push('');
    lines.push(`- **Portable Objects**: ${objectAnalysis.portableObjects.length}`);
    lines.push(`- **Containers**: ${objectAnalysis.containers.length}`);
    lines.push(`- **Light Sources**: ${objectAnalysis.lightSources.length}`);
    lines.push(`- **Weapons**: ${objectAnalysis.weapons.length}`);
    lines.push(`- **Edible Items**: ${objectAnalysis.edibleObjects.length}`);
    lines.push(`- **Treasures**: ${objectAnalysis.treasures.length}`);
    lines.push('');

    // Location distribution
    lines.push('### Object Location Distribution');
    lines.push('');
    const sortedLocations = Object.entries(objectAnalysis.locationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);
    sortedLocations.forEach(([location, count]) => {
      lines.push(`- **${location}**: ${count} objects`);
    });
    lines.push('');

    // Current data properties
    lines.push('## Current Data Properties');
    lines.push('');
    lines.push('### Room Properties in Current Data');
    lines.push('');
    lines.push('```');
    currentData.currentRoomProperties.forEach((prop) => {
      lines.push(`  ${prop}`);
    });
    lines.push('```');
    lines.push('');

    lines.push('### Object Properties in Current Data');
    lines.push('');
    lines.push('```');
    currentData.currentObjectProperties.forEach((prop) => {
      lines.push(`  ${prop}`);
    });
    lines.push('```');
    lines.push('');

    // Key findings
    lines.push('## Key Findings');
    lines.push('');

    const roomDelta = trace.roomCount - currentData.currentRoomCount;
    const objectDelta = trace.objectCount - currentData.currentObjectCount;

    if (roomDelta > 0) {
      lines.push(`### Missing Rooms`);
      lines.push('');
      lines.push(`The canonical C version has **${roomDelta} more rooms** than our current data.`);
      lines.push('');
      lines.push('**Possible reasons:**');
      lines.push('- Some rooms may be template/unused rooms in the C source');
      lines.push('- Endgame rooms might not all be implemented yet');
      lines.push(
        `- ${roomAnalysis.flagCounts['REND'] || 0} rooms are marked as REND (endgame) in the canonical data`
      );
      lines.push('');
    }

    if (objectDelta > 0) {
      lines.push(`### Missing Objects`);
      lines.push('');
      lines.push(
        `The canonical C version has **${objectDelta} more objects** than our current data.`
      );
      lines.push('');
      const voidObjects = objectAnalysis.locationCounts['void'] || 0;
      lines.push(
        `**Note:** ${voidObjects} canonical objects are in 'void' location (may be templates or conditionally created items)`
      );
      lines.push('');
    }

    // Flag meanings
    lines.push('## C Flag Reference');
    lines.push('');
    lines.push('### Room Flags');
    lines.push('');
    lines.push('- **RLIGHT**: Room has light (not dark)');
    lines.push('- **RLAND**: Land location (vs water/air)');
    lines.push('- **RSACRD**: Sacred location');
    lines.push('- **REND**: Endgame room');
    lines.push('- **RWATER**: Water location');
    lines.push('- **RAIR**: Air/flying location');
    lines.push('- **RSEEN**: Room has been visited');
    lines.push('');

    lines.push('### Object Flags');
    lines.push('');
    lines.push('- **VISIBT**: Object is visible');
    lines.push('- **TAKEBT**: Object can be taken');
    lines.push('- **CONTBT**: Object is a container');
    lines.push('- **LITEBT**: Object provides light');
    lines.push('- **WEAPONBT**: Object is a weapon');
    lines.push('- **FOODBT**: Object can be eaten');
    lines.push('- **DOORBT**: Object is a door');
    lines.push('- **TRANBT**: Container is transparent');
    lines.push('- **BURNBT**: Object can be burned');
    lines.push('- **READBT**: Object can be read');
    lines.push('- **OPENBT**: Container is open (from oflag2)');
    lines.push('- **FITEBT**: Object can be used in combat (from oflag2)');
    lines.push('');

    // Recommendations
    lines.push('## Recommendations');
    lines.push('');
    lines.push('### Data Verification Steps');
    lines.push('');
    lines.push('1. **Review Room Count Discrepancy**');
    lines.push(`   - Investigate ${roomDelta} missing rooms`);
    lines.push('   - Check if endgame rooms are all implemented');
    lines.push('   - Verify which rooms are essential for gameplay');
    lines.push('');

    lines.push('2. **Review Object Count Discrepancy**');
    lines.push(`   - Investigate ${objectDelta} missing objects`);
    lines.push('   - Check object categories: treasures, weapons, tools');
    lines.push('   - Verify all containers are implemented');
    lines.push('');

    lines.push('3. **Property Completeness**');
    lines.push('   - Verify all room flags are properly mapped');
    lines.push('   - Ensure object flags are correctly represented');
    lines.push('   - Check that special properties (actions, values) are preserved');
    lines.push('');

    lines.push('4. **Message/Text Verification**');
    lines.push(`   - The canonical data has ${messages.length} messages`);
    lines.push('   - Compare room/object descriptions with canonical text');
    lines.push('   - Verify substitution messages are handled correctly');
    lines.push('');

    lines.push('5. **Exit/Travel Data**');
    lines.push(`   - The canonical data has ${trace.travelCount} travel entries`);
    lines.push('   - Verify all room exits are correct');
    lines.push('   - Check for conditional/special exits');
    lines.push('');

    const reportText = lines.join('\n');

    // Write to file
    const reportPath = path.join(process.cwd(), 'DEEP-ARTIFACT-ANALYSIS.md');
    fs.writeFileSync(reportPath, reportText, 'utf-8');

    console.log('');
    console.log('='.repeat(80));
    console.log('Analysis complete!');
    console.log(`Report: ${reportPath}`);
    console.log('='.repeat(80));
    console.log('');
    console.log('SUMMARY:');
    console.log(
      `  Canonical Rooms: ${trace.roomCount} (Current: ${currentData.currentRoomCount}, Delta: ${roomDelta})`
    );
    console.log(
      `  Canonical Objects: ${trace.objectCount} (Current: ${currentData.currentObjectCount}, Delta: ${objectDelta})`
    );
    console.log(`  Dark Rooms: ${roomAnalysis.darkRooms.length}`);
    console.log(`  Containers: ${objectAnalysis.containers.length}`);
    console.log(`  Light Sources: ${objectAnalysis.lightSources.length}`);
    console.log(`  Treasures: ${objectAnalysis.treasures.length}`);
    console.log('');
  }
}

// Run the analyzer
const analyzer = new DeepArtifactAnalyzer();
analyzer.run();
