#!/usr/bin/env tsx
/**
 * Artifact Data Analysis Tool
 *
 * Compares canonical data exported from C version of Zork with current TypeScript/JSON data
 * to identify discrepancies and suggest corrections.
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

interface AnalysisReport {
  summary: {
    canonicalRoomCount: number;
    currentRoomCount: number;
    canonicalObjectCount: number;
    currentObjectCount: number;
    messageCount: number;
  };
  roomsAnalysis: {
    missingRooms: CanonicalRoom[];
    missingRoomIds: string[];
    descriptionMismatches: {
      roomId: string;
      canonical: string;
      current: string;
    }[];
    exitMismatches: {
      roomId: string;
      canonical: Record<string, string>;
      current: Record<string, string>;
    }[];
    propertyMismatches: {
      roomId: string;
      property: string;
      canonical: any;
      current: any;
    }[];
  };
  objectsAnalysis: {
    missingObjects: CanonicalObject[];
    missingObjectIds: string[];
    descriptionMismatches: {
      objectId: string;
      canonical: string;
      current: string;
    }[];
    locationMismatches: {
      objectId: string;
      canonical: string;
      current: string;
    }[];
    propertyMismatches: {
      objectId: string;
      property: string;
      canonical: any;
      current: any;
    }[];
  };
}

class ArtifactAnalyzer {
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

  private compareRooms(canonical: CanonicalRoom[], current: { rooms: CurrentRoom[] }) {
    const currentMap = new Map(current.rooms.map((r) => [r.id, r]));

    // Filter out empty canonical rooms (id === "")
    const validCanonical = canonical.filter((r) => r.id !== '');

    const missingRooms: CanonicalRoom[] = [];
    const missingRoomIds: string[] = [];
    const descriptionMismatches: any[] = [];
    const exitMismatches: any[] = [];
    const propertyMismatches: any[] = [];

    for (const canonRoom of validCanonical) {
      const currRoom = currentMap.get(canonRoom.id);

      if (!currRoom) {
        missingRooms.push(canonRoom);
        missingRoomIds.push(canonRoom.id);
        continue;
      }

      // Compare descriptions
      if (canonRoom.description !== currRoom.description) {
        descriptionMismatches.push({
          roomId: canonRoom.id,
          canonical: canonRoom.description,
          current: currRoom.description,
        });
      }

      // Compare exits
      const canonExitKeys = Object.keys(canonRoom.exits).sort();
      const currExitKeys = Object.keys(currRoom.exits).sort();

      if (
        JSON.stringify(canonExitKeys) !== JSON.stringify(currExitKeys) ||
        JSON.stringify(canonRoom.exits) !== JSON.stringify(currRoom.exits)
      ) {
        exitMismatches.push({
          roomId: canonRoom.id,
          canonical: canonRoom.exits,
          current: currRoom.exits,
        });
      }

      // Compare isDark property
      if (canonRoom.isDark !== currRoom.isDark) {
        propertyMismatches.push({
          roomId: canonRoom.id,
          property: 'isDark',
          canonical: canonRoom.isDark,
          current: currRoom.isDark,
        });
      }
    }

    return {
      missingRooms,
      missingRoomIds,
      descriptionMismatches,
      exitMismatches,
      propertyMismatches,
    };
  }

  private compareObjects(canonical: CanonicalObject[], current: { objects: CurrentObject[] }) {
    const currentMap = new Map(current.objects.map((o) => [o.id, o]));

    // Filter out empty canonical objects (id === "")
    const validCanonical = canonical.filter((o) => o.id !== '');

    const missingObjects: CanonicalObject[] = [];
    const missingObjectIds: string[] = [];
    const descriptionMismatches: any[] = [];
    const locationMismatches: any[] = [];
    const propertyMismatches: any[] = [];

    for (const canonObj of validCanonical) {
      const currObj = currentMap.get(canonObj.id);

      if (!currObj) {
        missingObjects.push(canonObj);
        missingObjectIds.push(canonObj.id);
        continue;
      }

      // Compare descriptions
      if (canonObj.description !== currObj.description) {
        descriptionMismatches.push({
          objectId: canonObj.id,
          canonical: canonObj.description,
          current: currObj.description,
        });
      }

      // Compare locations
      if (canonObj.location !== currObj.location) {
        locationMismatches.push({
          objectId: canonObj.id,
          canonical: canonObj.location,
          current: currObj.location,
        });
      }

      // Compare portable property
      if (canonObj.portable !== currObj.portable) {
        propertyMismatches.push({
          objectId: canonObj.id,
          property: 'portable',
          canonical: canonObj.portable,
          current: currObj.portable,
        });
      }

      // Compare visible property
      if (canonObj.visible !== currObj.visible) {
        propertyMismatches.push({
          objectId: canonObj.id,
          property: 'visible',
          canonical: canonObj.visible,
          current: currObj.visible,
        });
      }
    }

    return {
      missingObjects,
      missingObjectIds,
      descriptionMismatches,
      locationMismatches,
      propertyMismatches,
    };
  }

  public analyze(): AnalysisReport {
    console.log('Loading artifact files...');
    const canonicalRooms = this.loadJSON<CanonicalRoom[]>(
      path.join(this.artifactsDir, 'rooms.canonical.json')
    );
    const canonicalObjects = this.loadJSON<CanonicalObject[]>(
      path.join(this.artifactsDir, 'objects.canonical.json')
    );
    const messages = this.loadJSON<Message[]>(path.join(this.artifactsDir, 'messages.json'));

    console.log('Loading current data files...');
    const currentRooms = this.loadJSON<{ rooms: CurrentRoom[] }>(
      path.join(this.dataDir, 'rooms.json')
    );
    const currentObjects = this.loadJSON<{ objects: CurrentObject[] }>(
      path.join(this.dataDir, 'objects.json')
    );

    console.log('Analyzing rooms...');
    const roomsAnalysis = this.compareRooms(canonicalRooms, currentRooms);

    console.log('Analyzing objects...');
    const objectsAnalysis = this.compareObjects(canonicalObjects, currentObjects);

    return {
      summary: {
        canonicalRoomCount: canonicalRooms.filter((r) => r.id !== '').length,
        currentRoomCount: currentRooms.rooms.length,
        canonicalObjectCount: canonicalObjects.filter((o) => o.id !== '').length,
        currentObjectCount: currentObjects.objects.length,
        messageCount: messages.length,
      },
      roomsAnalysis,
      objectsAnalysis,
    };
  }

  public generateReport(report: AnalysisReport): string {
    const lines: string[] = [];

    lines.push('# Artifact Data Analysis Report');
    lines.push('');
    lines.push('## Summary');
    lines.push('');
    lines.push(`- **Canonical Rooms:** ${report.summary.canonicalRoomCount}`);
    lines.push(`- **Current Rooms:** ${report.summary.currentRoomCount}`);
    lines.push(`- **Missing Rooms:** ${report.roomsAnalysis.missingRoomIds.length}`);
    lines.push('');
    lines.push(`- **Canonical Objects:** ${report.summary.canonicalObjectCount}`);
    lines.push(`- **Current Objects:** ${report.summary.currentObjectCount}`);
    lines.push(`- **Missing Objects:** ${report.objectsAnalysis.missingObjectIds.length}`);
    lines.push('');
    lines.push(`- **Total Messages:** ${report.summary.messageCount}`);
    lines.push('');

    // Rooms Analysis
    lines.push('## Rooms Analysis');
    lines.push('');

    if (report.roomsAnalysis.missingRoomIds.length > 0) {
      lines.push(`### Missing Rooms (${report.roomsAnalysis.missingRoomIds.length})`);
      lines.push('');
      lines.push(
        'The following rooms exist in the canonical data but are missing from current data:'
      );
      lines.push('');
      report.roomsAnalysis.missingRoomIds.slice(0, 20).forEach((id) => {
        lines.push(`- \`${id}\``);
      });
      if (report.roomsAnalysis.missingRoomIds.length > 20) {
        lines.push(`- ... and ${report.roomsAnalysis.missingRoomIds.length - 20} more`);
      }
      lines.push('');
    }

    if (report.roomsAnalysis.descriptionMismatches.length > 0) {
      lines.push(
        `### Description Mismatches (${report.roomsAnalysis.descriptionMismatches.length})`
      );
      lines.push('');
      report.roomsAnalysis.descriptionMismatches.slice(0, 5).forEach((mismatch) => {
        lines.push(`#### Room: \`${mismatch.roomId}\``);
        lines.push('');
        lines.push('**Canonical:**');
        lines.push(
          `> ${mismatch.canonical.substring(0, 200)}${mismatch.canonical.length > 200 ? '...' : ''}`
        );
        lines.push('');
        lines.push('**Current:**');
        lines.push(
          `> ${mismatch.current.substring(0, 200)}${mismatch.current.length > 200 ? '...' : ''}`
        );
        lines.push('');
      });
      if (report.roomsAnalysis.descriptionMismatches.length > 5) {
        lines.push(
          `... and ${report.roomsAnalysis.descriptionMismatches.length - 5} more description mismatches`
        );
        lines.push('');
      }
    }

    if (report.roomsAnalysis.exitMismatches.length > 0) {
      lines.push(`### Exit Mismatches (${report.roomsAnalysis.exitMismatches.length})`);
      lines.push('');
      report.roomsAnalysis.exitMismatches.slice(0, 5).forEach((mismatch) => {
        lines.push(`#### Room: \`${mismatch.roomId}\``);
        lines.push('');
        lines.push('**Canonical exits:**');
        lines.push('```json');
        lines.push(JSON.stringify(mismatch.canonical, null, 2));
        lines.push('```');
        lines.push('');
        lines.push('**Current exits:**');
        lines.push('```json');
        lines.push(JSON.stringify(mismatch.current, null, 2));
        lines.push('```');
        lines.push('');
      });
      if (report.roomsAnalysis.exitMismatches.length > 5) {
        lines.push(
          `... and ${report.roomsAnalysis.exitMismatches.length - 5} more exit mismatches`
        );
        lines.push('');
      }
    }

    if (report.roomsAnalysis.propertyMismatches.length > 0) {
      lines.push(`### Property Mismatches (${report.roomsAnalysis.propertyMismatches.length})`);
      lines.push('');
      report.roomsAnalysis.propertyMismatches.slice(0, 10).forEach((mismatch) => {
        lines.push(
          `- \`${mismatch.roomId}\`: ${mismatch.property} (canonical: ${mismatch.canonical}, current: ${mismatch.current})`
        );
      });
      if (report.roomsAnalysis.propertyMismatches.length > 10) {
        lines.push(
          `- ... and ${report.roomsAnalysis.propertyMismatches.length - 10} more property mismatches`
        );
      }
      lines.push('');
    }

    // Objects Analysis
    lines.push('## Objects Analysis');
    lines.push('');

    if (report.objectsAnalysis.missingObjectIds.length > 0) {
      lines.push(`### Missing Objects (${report.objectsAnalysis.missingObjectIds.length})`);
      lines.push('');
      lines.push(
        'The following objects exist in the canonical data but are missing from current data:'
      );
      lines.push('');
      report.objectsAnalysis.missingObjectIds.slice(0, 20).forEach((id) => {
        lines.push(`- \`${id}\``);
      });
      if (report.objectsAnalysis.missingObjectIds.length > 20) {
        lines.push(`- ... and ${report.objectsAnalysis.missingObjectIds.length - 20} more`);
      }
      lines.push('');
    }

    if (report.objectsAnalysis.descriptionMismatches.length > 0) {
      lines.push(
        `### Description Mismatches (${report.objectsAnalysis.descriptionMismatches.length})`
      );
      lines.push('');
      report.objectsAnalysis.descriptionMismatches.slice(0, 5).forEach((mismatch) => {
        lines.push(`#### Object: \`${mismatch.objectId}\``);
        lines.push('');
        lines.push('**Canonical:**');
        lines.push(
          `> ${mismatch.canonical.substring(0, 200)}${mismatch.canonical.length > 200 ? '...' : ''}`
        );
        lines.push('');
        lines.push('**Current:**');
        lines.push(
          `> ${mismatch.current.substring(0, 200)}${mismatch.current.length > 200 ? '...' : ''}`
        );
        lines.push('');
      });
      if (report.objectsAnalysis.descriptionMismatches.length > 5) {
        lines.push(
          `... and ${report.objectsAnalysis.descriptionMismatches.length - 5} more description mismatches`
        );
        lines.push('');
      }
    }

    if (report.objectsAnalysis.locationMismatches.length > 0) {
      lines.push(`### Location Mismatches (${report.objectsAnalysis.locationMismatches.length})`);
      lines.push('');
      report.objectsAnalysis.locationMismatches.slice(0, 10).forEach((mismatch) => {
        lines.push(
          `- \`${mismatch.objectId}\`: canonical location: \`${mismatch.canonical}\`, current location: \`${mismatch.current}\``
        );
      });
      if (report.objectsAnalysis.locationMismatches.length > 10) {
        lines.push(
          `- ... and ${report.objectsAnalysis.locationMismatches.length - 10} more location mismatches`
        );
      }
      lines.push('');
    }

    if (report.objectsAnalysis.propertyMismatches.length > 0) {
      lines.push(`### Property Mismatches (${report.objectsAnalysis.propertyMismatches.length})`);
      lines.push('');
      report.objectsAnalysis.propertyMismatches.slice(0, 10).forEach((mismatch) => {
        lines.push(
          `- \`${mismatch.objectId}\`: ${mismatch.property} (canonical: ${mismatch.canonical}, current: ${mismatch.current})`
        );
      });
      if (report.objectsAnalysis.propertyMismatches.length > 10) {
        lines.push(
          `- ... and ${report.objectsAnalysis.propertyMismatches.length - 10} more property mismatches`
        );
      }
      lines.push('');
    }

    // Recommendations
    lines.push('## Recommendations');
    lines.push('');

    if (report.roomsAnalysis.missingRoomIds.length > 0) {
      lines.push(
        `1. **Add Missing Rooms:** ${report.roomsAnalysis.missingRoomIds.length} rooms from the canonical data need to be added to the current data.`
      );
    }

    if (report.objectsAnalysis.missingObjectIds.length > 0) {
      lines.push(
        `2. **Add Missing Objects:** ${report.objectsAnalysis.missingObjectIds.length} objects from the canonical data need to be added to the current data.`
      );
    }

    if (report.roomsAnalysis.descriptionMismatches.length > 0) {
      lines.push(
        `3. **Fix Room Descriptions:** ${report.roomsAnalysis.descriptionMismatches.length} rooms have description mismatches that should be reviewed and corrected.`
      );
    }

    if (report.objectsAnalysis.descriptionMismatches.length > 0) {
      lines.push(
        `4. **Fix Object Descriptions:** ${report.objectsAnalysis.descriptionMismatches.length} objects have description mismatches that should be reviewed and corrected.`
      );
    }

    if (report.roomsAnalysis.exitMismatches.length > 0) {
      lines.push(
        `5. **Fix Room Exits:** ${report.roomsAnalysis.exitMismatches.length} rooms have exit mismatches that need to be corrected for proper navigation.`
      );
    }

    if (report.objectsAnalysis.locationMismatches.length > 0) {
      lines.push(
        `6. **Fix Object Locations:** ${report.objectsAnalysis.locationMismatches.length} objects have incorrect initial locations.`
      );
    }

    lines.push('');
    lines.push('## Next Steps');
    lines.push('');
    lines.push('1. Review the canonical data in `artifacts/` directory');
    lines.push('2. Create automated scripts to update the current data based on canonical sources');
    lines.push(
      '3. Manually review critical gameplay areas (starting rooms, key items, major locations)'
    );
    lines.push('4. Update unit tests to validate the corrected data');
    lines.push('5. Run integration tests to ensure gameplay still works correctly');
    lines.push('');

    return lines.join('\n');
  }

  public run() {
    console.log('='.repeat(80));
    console.log('Artifact Data Analysis Tool');
    console.log('='.repeat(80));
    console.log('');

    const report = this.analyze();
    const reportText = this.generateReport(report);

    // Write to file
    const reportPath = path.join(process.cwd(), 'ARTIFACT-ANALYSIS-REPORT.md');
    fs.writeFileSync(reportPath, reportText, 'utf-8');

    console.log('');
    console.log('Report generated successfully!');
    console.log(`Output: ${reportPath}`);
    console.log('');

    // Print summary to console
    console.log('SUMMARY:');
    console.log(`  Canonical Rooms: ${report.summary.canonicalRoomCount}`);
    console.log(`  Current Rooms: ${report.summary.currentRoomCount}`);
    console.log(`  Missing Rooms: ${report.roomsAnalysis.missingRoomIds.length}`);
    console.log('');
    console.log(`  Canonical Objects: ${report.summary.canonicalObjectCount}`);
    console.log(`  Current Objects: ${report.summary.currentObjectCount}`);
    console.log(`  Missing Objects: ${report.objectsAnalysis.missingObjectIds.length}`);
    console.log('');
    console.log(
      `  Description Mismatches (Rooms): ${report.roomsAnalysis.descriptionMismatches.length}`
    );
    console.log(
      `  Description Mismatches (Objects): ${report.objectsAnalysis.descriptionMismatches.length}`
    );
    console.log(`  Exit Mismatches: ${report.roomsAnalysis.exitMismatches.length}`);
    console.log(`  Location Mismatches: ${report.objectsAnalysis.locationMismatches.length}`);
    console.log('');
  }
}

// Run the analyzer
const analyzer = new ArtifactAnalyzer();
analyzer.run();
