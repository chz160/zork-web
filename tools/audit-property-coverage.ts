#!/usr/bin/env node
/**
 * Property Coverage Audit Tool
 *
 * Analyzes canonical data flags and compares them with current game data
 * to identify missing properties. Generates a comprehensive report of gaps
 * that need to be filled to achieve 100% property coverage.
 *
 * Focus areas from Phase 2:
 * - Readable items (READBT flag)
 * - Doors (DOORBT flag)
 * - Food items (FOODBT flag)
 * - Tools (TOOLBT flag)
 * - Weapons (FITEBT flag, since WEAPONBT doesn't exist)
 * - Room flags (RWATER, RAIR, RSACRD, REND)
 */

import * as fs from 'fs';
import * as path from 'path';

interface CanonicalObject {
  id: string;
  name: string;
  location: string;
  portable: boolean;
  visible: boolean;
  properties?: Record<string, unknown>;
  cIndexTrace: {
    objectIndex: number;
    messageIndex: number;
    flags: string[];
  };
}

interface CurrentObject {
  id: string;
  name: string;
  location: string;
  properties?: {
    isReadable?: boolean;
    isDoor?: boolean;
    isFood?: boolean;
    isTool?: boolean;
    isWeapon?: boolean;
    [key: string]: unknown;
  };
}

interface CanonicalRoom {
  id: string;
  name: string;
  cIndexTrace: {
    roomIndex: number;
    flags: string[];
  };
}

interface CurrentRoom {
  id: string;
  name: string;
  properties?: {
    terrain?: string;
    isSacred?: boolean;
    isEndgame?: boolean;
    [key: string]: unknown;
  };
}

interface ObjectGap {
  canonicalIndex: number;
  location: string;
  flags: string[];
  currentId: string | null;
}

interface AuditReport {
  objectGaps: {
    readable: ObjectGap[];
    doors: ObjectGap[];
    food: ObjectGap[];
    tools: ObjectGap[];
    weapons: ObjectGap[];
  };
  roomGaps: {
    water: number[];
    air: number[];
    sacred: number[];
    endgame: number[];
  };
  summary: {
    totalObjectGaps: number;
    totalRoomGaps: number;
    overallCoverage: number;
  };
}

class PropertyAuditor {
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

  private findCurrentObjectByCanonicalIndex(
    canonicalObjects: CanonicalObject[],
    currentObjects: CurrentObject[],
    canonicalIndex: number
  ): string | null {
    const canonical = canonicalObjects.find(
      (obj) => obj.cIndexTrace.objectIndex === canonicalIndex
    );

    if (!canonical) return null;

    // Try to find by matching location and portable status
    // This is heuristic-based since we don't have direct ID mapping
    const candidates = currentObjects.filter((curr) => {
      // Skip if in unimplemented rooms (room-177, room-183, void, etc.)
      if (canonical.location.match(/^room-1[7-9]\d+$/) || canonical.location === 'void') {
        return false;
      }

      return curr.location === canonical.location;
    });

    if (candidates.length === 1) {
      return candidates[0].id;
    }

    return null;
  }

  private auditObjectProperties(): AuditReport['objectGaps'] {
    const canonicalObjects = this.loadJSON<CanonicalObject[]>(
      path.join(this.artifactsDir, 'objects.canonical.json')
    );

    const currentData = this.loadJSON<{ objects: CurrentObject[] }>(
      path.join(this.dataDir, 'objects.json')
    );
    const currentObjects = currentData.objects;

    const gaps: AuditReport['objectGaps'] = {
      readable: [],
      doors: [],
      food: [],
      tools: [],
      weapons: [],
    };

    // Find objects with READBT flag
    const readableCanonical = canonicalObjects.filter((obj) =>
      obj.cIndexTrace.flags.includes('READBT')
    );

    for (const obj of readableCanonical) {
      const currentId = this.findCurrentObjectByCanonicalIndex(
        canonicalObjects,
        currentObjects,
        obj.cIndexTrace.objectIndex
      );

      // Check if current object has isReadable property
      if (currentId) {
        const current = currentObjects.find((c) => c.id === currentId);
        if (!current?.properties?.isReadable) {
          gaps.readable.push({
            canonicalIndex: obj.cIndexTrace.objectIndex,
            location: obj.location,
            flags: obj.cIndexTrace.flags,
            currentId,
          });
        }
      } else {
        // Object not found in current data (might be in unimplemented rooms)
        if (!obj.location.match(/^room-1[7-9]\d+$/) && obj.location !== 'void') {
          gaps.readable.push({
            canonicalIndex: obj.cIndexTrace.objectIndex,
            location: obj.location,
            flags: obj.cIndexTrace.flags,
            currentId: null,
          });
        }
      }
    }

    // Find objects with DOORBT flag
    const doorsCanonical = canonicalObjects.filter((obj) =>
      obj.cIndexTrace.flags.includes('DOORBT')
    );

    for (const obj of doorsCanonical) {
      const currentId = this.findCurrentObjectByCanonicalIndex(
        canonicalObjects,
        currentObjects,
        obj.cIndexTrace.objectIndex
      );

      if (currentId) {
        const current = currentObjects.find((c) => c.id === currentId);
        if (!current?.properties?.isDoor) {
          gaps.doors.push({
            canonicalIndex: obj.cIndexTrace.objectIndex,
            location: obj.location,
            flags: obj.cIndexTrace.flags,
            currentId,
          });
        }
      } else {
        if (!obj.location.match(/^room-1[7-9]\d+$/) && obj.location !== 'void') {
          gaps.doors.push({
            canonicalIndex: obj.cIndexTrace.objectIndex,
            location: obj.location,
            flags: obj.cIndexTrace.flags,
            currentId: null,
          });
        }
      }
    }

    // Find objects with FOODBT flag
    const foodCanonical = canonicalObjects.filter((obj) =>
      obj.cIndexTrace.flags.includes('FOODBT')
    );

    for (const obj of foodCanonical) {
      const currentId = this.findCurrentObjectByCanonicalIndex(
        canonicalObjects,
        currentObjects,
        obj.cIndexTrace.objectIndex
      );

      if (currentId) {
        const current = currentObjects.find((c) => c.id === currentId);
        if (!current?.properties?.isFood) {
          gaps.food.push({
            canonicalIndex: obj.cIndexTrace.objectIndex,
            location: obj.location,
            flags: obj.cIndexTrace.flags,
            currentId,
          });
        }
      } else {
        if (!obj.location.match(/^room-1[7-9]\d+$/) && obj.location !== 'void') {
          gaps.food.push({
            canonicalIndex: obj.cIndexTrace.objectIndex,
            location: obj.location,
            flags: obj.cIndexTrace.flags,
            currentId: null,
          });
        }
      }
    }

    // Find objects with TOOLBT flag
    const toolsCanonical = canonicalObjects.filter((obj) =>
      obj.cIndexTrace.flags.includes('TOOLBT')
    );

    for (const obj of toolsCanonical) {
      const currentId = this.findCurrentObjectByCanonicalIndex(
        canonicalObjects,
        currentObjects,
        obj.cIndexTrace.objectIndex
      );

      if (currentId) {
        const current = currentObjects.find((c) => c.id === currentId);
        if (!current?.properties?.isTool) {
          gaps.tools.push({
            canonicalIndex: obj.cIndexTrace.objectIndex,
            location: obj.location,
            flags: obj.cIndexTrace.flags,
            currentId,
          });
        }
      } else {
        if (!obj.location.match(/^room-1[7-9]\d+$/) && obj.location !== 'void') {
          gaps.tools.push({
            canonicalIndex: obj.cIndexTrace.objectIndex,
            location: obj.location,
            flags: obj.cIndexTrace.flags,
            currentId: null,
          });
        }
      }
    }

    // Find objects with FITEBT flag (weapons)
    const weaponsCanonical = canonicalObjects.filter((obj) =>
      obj.cIndexTrace.flags.includes('FITEBT')
    );

    for (const obj of weaponsCanonical) {
      const currentId = this.findCurrentObjectByCanonicalIndex(
        canonicalObjects,
        currentObjects,
        obj.cIndexTrace.objectIndex
      );

      if (currentId) {
        const current = currentObjects.find((c) => c.id === currentId);
        if (!current?.properties?.isWeapon) {
          gaps.weapons.push({
            canonicalIndex: obj.cIndexTrace.objectIndex,
            location: obj.location,
            flags: obj.cIndexTrace.flags,
            currentId,
          });
        }
      } else {
        if (!obj.location.match(/^room-1[7-9]\d+$/) && obj.location !== 'void') {
          gaps.weapons.push({
            canonicalIndex: obj.cIndexTrace.objectIndex,
            location: obj.location,
            flags: obj.cIndexTrace.flags,
            currentId: null,
          });
        }
      }
    }

    return gaps;
  }

  private auditRoomProperties(): AuditReport['roomGaps'] {
    const canonicalRooms = this.loadJSON<CanonicalRoom[]>(
      path.join(this.artifactsDir, 'rooms.canonical.json')
    );

    const currentData = this.loadJSON<{ rooms: CurrentRoom[] }>(
      path.join(this.dataDir, 'rooms.json')
    );
    const currentRooms = currentData.rooms;

    const gaps: AuditReport['roomGaps'] = {
      water: [],
      air: [],
      sacred: [],
      endgame: [],
    };

    // Find rooms with RWATER flag
    const waterRooms = canonicalRooms.filter((room) => room.cIndexTrace.flags.includes('RWATER'));

    for (const room of waterRooms) {
      const current = currentRooms.find((r) => r.id === room.id);
      if (!current || current.properties?.terrain !== 'water') {
        gaps.water.push(room.cIndexTrace.roomIndex);
      }
    }

    // Find rooms with RAIR flag
    const airRooms = canonicalRooms.filter((room) => room.cIndexTrace.flags.includes('RAIR'));

    for (const room of airRooms) {
      const current = currentRooms.find((r) => r.id === room.id);
      if (!current || current.properties?.terrain !== 'air') {
        gaps.air.push(room.cIndexTrace.roomIndex);
      }
    }

    // Find rooms with RSACRD flag
    const sacredRooms = canonicalRooms.filter((room) => room.cIndexTrace.flags.includes('RSACRD'));

    for (const room of sacredRooms) {
      const current = currentRooms.find((r) => r.id === room.id);
      if (!current || !current.properties?.isSacred) {
        gaps.sacred.push(room.cIndexTrace.roomIndex);
      }
    }

    // Find rooms with REND flag (for documentation, not implementation)
    const endgameRooms = canonicalRooms.filter((room) => room.cIndexTrace.flags.includes('REND'));

    for (const room of endgameRooms) {
      const current = currentRooms.find((r) => r.id === room.id);
      if (current) {
        // Only track implemented endgame rooms
        if (!current.properties?.isEndgame) {
          gaps.endgame.push(room.cIndexTrace.roomIndex);
        }
      }
    }

    return gaps;
  }

  public generateReport(): AuditReport {
    const objectGaps = this.auditObjectProperties();
    const roomGaps = this.auditRoomProperties();

    const totalObjectGaps =
      objectGaps.readable.length +
      objectGaps.doors.length +
      objectGaps.food.length +
      objectGaps.tools.length +
      objectGaps.weapons.length;

    const totalRoomGaps = roomGaps.water.length + roomGaps.air.length + roomGaps.sacred.length;

    const totalGaps = totalObjectGaps + totalRoomGaps;
    const expectedTotal = 31 + 11 + 6 + 9 + 0 + 7 + 4 + 38; // Expected flags in canonical

    return {
      objectGaps,
      roomGaps,
      summary: {
        totalObjectGaps,
        totalRoomGaps,
        overallCoverage:
          expectedTotal > 0 ? ((expectedTotal - totalGaps) / expectedTotal) * 100 : 100,
      },
    };
  }

  public run(): void {
    console.log('='.repeat(80));
    console.log('Property Coverage Audit Tool - Phase 2');
    console.log('='.repeat(80));
    console.log('');

    console.log('Analyzing property coverage...');
    const report = this.generateReport();

    console.log('');
    console.log('## Object Property Gaps');
    console.log('');
    console.log(`Readable Items (READBT): ${report.objectGaps.readable.length} missing`);
    console.log(`Doors (DOORBT): ${report.objectGaps.doors.length} missing`);
    console.log(`Food Items (FOODBT): ${report.objectGaps.food.length} missing`);
    console.log(`Tools (TOOLBT): ${report.objectGaps.tools.length} missing`);
    console.log(`Weapons (FITEBT): ${report.objectGaps.weapons.length} missing`);
    console.log('');

    console.log('## Room Property Gaps');
    console.log('');
    console.log(`Water Rooms (RWATER): ${report.roomGaps.water.length} missing`);
    console.log(`Air Rooms (RAIR): ${report.roomGaps.air.length} missing`);
    console.log(`Sacred Rooms (RSACRD): ${report.roomGaps.sacred.length} missing`);
    console.log(`Endgame Rooms (REND): ${report.roomGaps.endgame.length} (documentation only)`);
    console.log('');

    console.log('## Summary');
    console.log('');
    console.log(`Total Object Gaps: ${report.summary.totalObjectGaps}`);
    console.log(`Total Room Gaps: ${report.summary.totalRoomGaps}`);
    console.log(`Overall Coverage: ${report.summary.overallCoverage.toFixed(2)}%`);
    console.log('');

    // Write detailed JSON report
    const reportPath = path.join(process.cwd(), 'property-coverage-audit.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

    console.log(`Detailed report written to: ${reportPath}`);
    console.log('');
  }
}

// Run the auditor
const auditor = new PropertyAuditor();
auditor.run();
