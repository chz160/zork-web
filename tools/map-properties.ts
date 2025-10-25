#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Property Mapper Tool
 *
 * Maps canonical flag data to current objects and adds missing properties.
 * Uses intelligent matching based on location, name patterns, and description similarity.
 */

import * as fs from 'fs';
import * as path from 'path';

interface CanonicalObject {
  id: string;
  name: string;
  aliases: string[];
  description: string;
  location: string;
  portable: boolean;
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
  aliases: string[];
  description: string;
  location: string;
  portable: boolean;
  properties?: Record<string, unknown>;
}

class PropertyMapper {
  private artifactsDir: string;
  private dataDir: string;
  private dryRun: boolean;

  constructor(dryRun = true) {
    this.artifactsDir = path.join(process.cwd(), 'artifacts');
    this.dataDir = path.join(process.cwd(), 'src/app/data');
    this.dryRun = dryRun;
  }

  private loadJSON<T>(filePath: string): T {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  }

  private saveJSON<T>(filePath: string, data: T): void {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * Map READBT flag to isReadable property
   */
  public mapReadableItems(): number {
    const canonicalObjects = this.loadJSON<CanonicalObject[]>(
      path.join(this.artifactsDir, 'objects.canonical.json')
    );

    const dataFile = path.join(this.dataDir, 'objects.json');
    const currentData = this.loadJSON<{ objects: CurrentObject[] }>(dataFile);

    let changesCount = 0;

    // Get all objects with READBT flag
    const readableCanonical = canonicalObjects.filter(
      (obj) =>
        obj.cIndexTrace.flags.includes('READBT') &&
        obj.location !== 'void' &&
        !obj.location.match(/^room-1[7-9]\d+$/)
    );

    console.log(`\nFound ${readableCanonical.length} readable items in canonical data`);
    console.log('Mapping to current objects...\n');

    for (const canonical of readableCanonical) {
      // Try to find matching object by location
      const candidates = currentData.objects.filter((obj) => obj.location === canonical.location);

      if (candidates.length === 1) {
        const current = candidates[0];
        if (!current.properties) {
          current.properties = {};
        }

        if (!current.properties['isReadable']) {
          console.log(`✓ Mapping ${current.id} (${canonical.location}) -> isReadable: true`);
          current.properties['isReadable'] = true;
          changesCount++;
        }
      } else if (candidates.length > 1) {
        // Multiple candidates - try name matching
        const nameMatch = candidates.find(
          (obj) =>
            obj.name.toLowerCase().includes(canonical.name.toLowerCase()) ||
            canonical.name.toLowerCase().includes(obj.name.toLowerCase()) ||
            obj.aliases.some((alias) => canonical.aliases.includes(alias))
        );

        if (nameMatch) {
          if (!nameMatch.properties) {
            nameMatch.properties = {};
          }

          if (!nameMatch.properties['isReadable']) {
            console.log(
              `✓ Mapping ${nameMatch.id} (${canonical.location}, name match) -> isReadable: true`
            );
            nameMatch.properties['isReadable'] = true;
            changesCount++;
          }
        } else {
          console.log(
            `⚠ Multiple candidates in ${canonical.location}, index ${canonical.cIndexTrace.objectIndex}: ${candidates.map((c) => c.id).join(', ')}`
          );
        }
      } else {
        console.log(
          `⚠ No match found for canonical index ${canonical.cIndexTrace.objectIndex} in ${canonical.location}`
        );
      }
    }

    if (!this.dryRun && changesCount > 0) {
      this.saveJSON(dataFile, currentData);
      console.log(`\n✓ Saved ${changesCount} changes to objects.json`);
    } else if (changesCount > 0) {
      console.log(`\n📝 DRY RUN: Would save ${changesCount} changes (use --apply to save)`);
    }

    return changesCount;
  }

  /**
   * Map DOORBT flag to isDoor property
   */
  public mapDoors(): number {
    const canonicalObjects = this.loadJSON<CanonicalObject[]>(
      path.join(this.artifactsDir, 'objects.canonical.json')
    );

    const dataFile = path.join(this.dataDir, 'objects.json');
    const currentData = this.loadJSON<{ objects: CurrentObject[] }>(dataFile);

    let changesCount = 0;

    const doorsCanonical = canonicalObjects.filter(
      (obj) =>
        obj.cIndexTrace.flags.includes('DOORBT') &&
        obj.location !== 'void' &&
        !obj.location.match(/^room-1[7-9]\d+$/)
    );

    console.log(`\nFound ${doorsCanonical.length} doors in canonical data`);
    console.log('Mapping to current objects...\n');

    for (const canonical of doorsCanonical) {
      const candidates = currentData.objects.filter((obj) => obj.location === canonical.location);

      if (candidates.length === 1) {
        const current = candidates[0];
        if (!current.properties) {
          current.properties = {};
        }

        if (!current.properties['isDoor']) {
          console.log(`✓ Mapping ${current.id} (${canonical.location}) -> isDoor: true`);
          current.properties['isDoor'] = true;
          // Set default state
          if (current.properties['isOpen'] === undefined) {
            current.properties['isOpen'] = canonical.cIndexTrace.flags.includes('OPENBT');
          }
          changesCount++;
        }
      } else if (candidates.length > 1) {
        const nameMatch = candidates.find(
          (obj) =>
            obj.name.toLowerCase().includes('door') ||
            obj.name.toLowerCase().includes('gate') ||
            obj.name.toLowerCase().includes('grating') ||
            obj.id.includes('door') ||
            obj.id.includes('gate')
        );

        if (nameMatch) {
          if (!nameMatch.properties) {
            nameMatch.properties = {};
          }

          if (!nameMatch.properties['isDoor']) {
            console.log(
              `✓ Mapping ${nameMatch.id} (${canonical.location}, name match) -> isDoor: true`
            );
            nameMatch.properties['isDoor'] = true;
            if (nameMatch.properties['isOpen'] === undefined) {
              nameMatch.properties['isOpen'] = canonical.cIndexTrace.flags.includes('OPENBT');
            }
            changesCount++;
          }
        } else {
          console.log(
            `⚠ Multiple candidates in ${canonical.location}, index ${canonical.cIndexTrace.objectIndex}: ${candidates.map((c) => c.id).join(', ')}`
          );
        }
      } else {
        console.log(
          `⚠ No match found for canonical index ${canonical.cIndexTrace.objectIndex} in ${canonical.location}`
        );
      }
    }

    if (!this.dryRun && changesCount > 0) {
      this.saveJSON(dataFile, currentData);
      console.log(`\n✓ Saved ${changesCount} changes to objects.json`);
    } else if (changesCount > 0) {
      console.log(`\n📝 DRY RUN: Would save ${changesCount} changes (use --apply to save)`);
    }

    return changesCount;
  }

  /**
   * Map FOODBT flag to isFood property
   */
  public mapFoodItems(): number {
    const canonicalObjects = this.loadJSON<CanonicalObject[]>(
      path.join(this.artifactsDir, 'objects.canonical.json')
    );

    const dataFile = path.join(this.dataDir, 'objects.json');
    const currentData = this.loadJSON<{ objects: CurrentObject[] }>(dataFile);

    let changesCount = 0;

    const foodCanonical = canonicalObjects.filter(
      (obj) =>
        obj.cIndexTrace.flags.includes('FOODBT') &&
        obj.location !== 'void' &&
        !obj.location.match(/^room-1[7-9]\d+$/)
    );

    console.log(`\nFound ${foodCanonical.length} food items in canonical data`);
    console.log('Mapping to current objects...\n');

    for (const canonical of foodCanonical) {
      const candidates = currentData.objects.filter((obj) => obj.location === canonical.location);

      if (candidates.length > 0) {
        // Try name matching for food items
        const nameMatch = candidates.find(
          (obj) =>
            obj.name.toLowerCase().includes(canonical.name.toLowerCase()) ||
            canonical.name.toLowerCase().includes(obj.name.toLowerCase()) ||
            obj.aliases.some((alias) => canonical.aliases.includes(alias))
        );

        if (nameMatch) {
          if (!nameMatch.properties) {
            nameMatch.properties = {};
          }

          if (!nameMatch.properties['isFood']) {
            console.log(
              `✓ Mapping ${nameMatch.id} (${canonical.location}) -> isFood: true, edible: true`
            );
            nameMatch.properties['isFood'] = true;
            nameMatch.properties['edible'] = true;
            nameMatch.properties['consumable'] = true; // Most food is consumable
            changesCount++;
          }
        } else if (candidates.length === 1) {
          const current = candidates[0];
          if (!current.properties) {
            current.properties = {};
          }

          if (!current.properties['isFood']) {
            console.log(
              `✓ Mapping ${current.id} (${canonical.location}, only candidate) -> isFood: true`
            );
            current.properties['isFood'] = true;
            current.properties['edible'] = true;
            current.properties['consumable'] = true;
            changesCount++;
          }
        } else {
          console.log(
            `⚠ Multiple candidates in ${canonical.location}, index ${canonical.cIndexTrace.objectIndex}: ${candidates.map((c) => c.id).join(', ')}`
          );
        }
      } else {
        console.log(
          `⚠ No match found for canonical index ${canonical.cIndexTrace.objectIndex} in ${canonical.location}`
        );
      }
    }

    if (!this.dryRun && changesCount > 0) {
      this.saveJSON(dataFile, currentData);
      console.log(`\n✓ Saved ${changesCount} changes to objects.json`);
    } else if (changesCount > 0) {
      console.log(`\n📝 DRY RUN: Would save ${changesCount} changes (use --apply to save)`);
    }

    return changesCount;
  }

  /**
   * Map TOOLBT flag to isTool property
   */
  public mapTools(): number {
    const canonicalObjects = this.loadJSON<CanonicalObject[]>(
      path.join(this.artifactsDir, 'objects.canonical.json')
    );

    const dataFile = path.join(this.dataDir, 'objects.json');
    const currentData = this.loadJSON<{ objects: CurrentObject[] }>(dataFile);

    let changesCount = 0;

    const toolsCanonical = canonicalObjects.filter(
      (obj) =>
        obj.cIndexTrace.flags.includes('TOOLBT') &&
        obj.location !== 'void' &&
        !obj.location.match(/^room-1[7-9]\d+$/)
    );

    console.log(`\nFound ${toolsCanonical.length} tools in canonical data`);
    console.log('Mapping to current objects...\n');

    for (const canonical of toolsCanonical) {
      const candidates = currentData.objects.filter((obj) => obj.location === canonical.location);

      if (candidates.length > 0) {
        const nameMatch = candidates.find(
          (obj) =>
            obj.name.toLowerCase().includes(canonical.name.toLowerCase()) ||
            canonical.name.toLowerCase().includes(obj.name.toLowerCase()) ||
            obj.aliases.some((alias) => canonical.aliases.includes(alias))
        );

        if (nameMatch) {
          if (!nameMatch.properties) {
            nameMatch.properties = {};
          }

          if (!nameMatch.properties['isTool']) {
            console.log(`✓ Mapping ${nameMatch.id} (${canonical.location}) -> isTool: true`);
            nameMatch.properties['isTool'] = true;
            changesCount++;
          }
        } else if (candidates.length === 1) {
          const current = candidates[0];
          if (!current.properties) {
            current.properties = {};
          }

          if (!current.properties['isTool']) {
            console.log(
              `✓ Mapping ${current.id} (${canonical.location}, only candidate) -> isTool: true`
            );
            current.properties['isTool'] = true;
            changesCount++;
          }
        } else {
          console.log(
            `⚠ Multiple candidates in ${canonical.location}, index ${canonical.cIndexTrace.objectIndex}: ${candidates.map((c) => c.id).join(', ')}`
          );
        }
      } else {
        console.log(
          `⚠ No match found for canonical index ${canonical.cIndexTrace.objectIndex} in ${canonical.location}`
        );
      }
    }

    if (!this.dryRun && changesCount > 0) {
      this.saveJSON(dataFile, currentData);
      console.log(`\n✓ Saved ${changesCount} changes to objects.json`);
    } else if (changesCount > 0) {
      console.log(`\n📝 DRY RUN: Would save ${changesCount} changes (use --apply to save)`);
    }

    return changesCount;
  }

  /**
   * Map FITEBT flag to isWeapon property
   */
  public mapWeapons(): number {
    const canonicalObjects = this.loadJSON<CanonicalObject[]>(
      path.join(this.artifactsDir, 'objects.canonical.json')
    );

    const dataFile = path.join(this.dataDir, 'objects.json');
    const currentData = this.loadJSON<{ objects: CurrentObject[] }>(dataFile);

    let changesCount = 0;

    const weaponsCanonical = canonicalObjects.filter(
      (obj) =>
        obj.cIndexTrace.flags.includes('FITEBT') &&
        obj.location !== 'void' &&
        !obj.location.match(/^room-1[7-9]\d+$/)
    );

    console.log(`\nFound ${weaponsCanonical.length} weapons in canonical data`);

    if (weaponsCanonical.length === 0) {
      console.log('No FITEBT flags found - weapons may be marked differently or already complete');
      return 0;
    }

    console.log('Mapping to current objects...\n');

    for (const canonical of weaponsCanonical) {
      const candidates = currentData.objects.filter((obj) => obj.location === canonical.location);

      if (candidates.length > 0) {
        const nameMatch = candidates.find(
          (obj) =>
            obj.name.toLowerCase().includes(canonical.name.toLowerCase()) ||
            canonical.name.toLowerCase().includes(obj.name.toLowerCase()) ||
            obj.aliases.some((alias) => canonical.aliases.includes(alias))
        );

        if (nameMatch) {
          if (!nameMatch.properties) {
            nameMatch.properties = {};
          }

          if (!nameMatch.properties['isWeapon']) {
            console.log(`✓ Mapping ${nameMatch.id} (${canonical.location}) -> isWeapon: true`);
            nameMatch.properties['isWeapon'] = true;
            changesCount++;
          }
        } else if (candidates.length === 1) {
          const current = candidates[0];
          if (!current.properties) {
            current.properties = {};
          }

          if (!current.properties['isWeapon']) {
            console.log(
              `✓ Mapping ${current.id} (${canonical.location}, only candidate) -> isWeapon: true`
            );
            current.properties['isWeapon'] = true;
            changesCount++;
          }
        }
      }
    }

    if (!this.dryRun && changesCount > 0) {
      this.saveJSON(dataFile, currentData);
      console.log(`\n✓ Saved ${changesCount} changes to objects.json`);
    } else if (changesCount > 0) {
      console.log(`\n📝 DRY RUN: Would save ${changesCount} changes (use --apply to save)`);
    }

    return changesCount;
  }

  public run(type?: string): void {
    console.log('='.repeat(80));
    console.log('Property Mapper Tool - Phase 2');
    console.log(`Mode: ${this.dryRun ? 'DRY RUN' : 'APPLY CHANGES'}`);
    console.log('='.repeat(80));

    let totalChanges = 0;

    if (!type || type === 'readable') {
      totalChanges += this.mapReadableItems();
    }

    if (!type || type === 'doors') {
      totalChanges += this.mapDoors();
    }

    if (!type || type === 'food') {
      totalChanges += this.mapFoodItems();
    }

    if (!type || type === 'tools') {
      totalChanges += this.mapTools();
    }

    if (!type || type === 'weapons') {
      totalChanges += this.mapWeapons();
    }

    console.log('\n' + '='.repeat(80));
    console.log(`Total changes: ${totalChanges}`);
    console.log('='.repeat(80));
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const applyChanges = args.includes('--apply');
const type = args.find((arg) => !arg.startsWith('--'));

const mapper = new PropertyMapper(!applyChanges);
mapper.run(type);
