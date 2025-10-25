#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Data Quality Validation Tool - Phase 2
 * 
 * Validates that current objects and rooms have complete and correct properties.
 * Does not compare against canonical data (different ID schemes), but instead
 * validates semantic correctness of the data we have.
 */

import * as fs from 'fs';
import * as path from 'path';

interface GameObject {
  id: string;
  name: string;
  portable: boolean;
  properties?: {
    [key: string]: unknown;
  };
}

interface Room {
  id: string;
  name: string;
  properties?: {
    [key: string]: unknown;
  };
}

interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  objectId?: string;
}

class DataQualityValidator {
  private dataDir: string;
  private issues: ValidationIssue[] = [];

  constructor() {
    this.dataDir = path.join(process.cwd(), 'src/app/data');
  }

  private loadJSON<T>(filePath: string): T {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  }

  private addIssue(issue: ValidationIssue): void {
    this.issues.push(issue);
  }

  /**
   * Validate object properties for semantic correctness
   */
  private validateObjects(): void {
    const data = this.loadJSON<{ objects: GameObject[] }>(
      path.join(this.dataDir, 'objects.json')
    );

    const objects = data.objects;

    console.log('\n=== Validating Object Properties ===\n');

    // Check containers have capacity
    const containersWithoutCapacity = objects.filter(obj =>
      obj.properties?.['contains'] !== undefined &&
      obj.properties?.['capacity'] === undefined
    );
    
    if (containersWithoutCapacity.length > 0) {
      this.addIssue({
        type: 'error',
        category: 'container',
        message: `${containersWithoutCapacity.length} containers missing capacity property`,
        objectId: containersWithoutCapacity.map(o => o.id).join(', ')
      });
      console.log(`❌ ${containersWithoutCapacity.length} containers without capacity:`);
      containersWithoutCapacity.forEach(o => console.log(`   - ${o.id}`));
    } else {
      console.log('✓ All containers have capacity');
    }

    // Check light sources have isLight flag
    const lightSources = objects.filter(obj =>
      obj.name.match(/lamp|candle|torch|lantern|light/i) &&
      !obj.name.match(/broken|burned|burnt|out/i) &&  // Exclude broken lamps
      obj.portable
    );
    
    const lightSourcesWithoutFlag = lightSources.filter(obj =>
      !obj.properties?.['isLight']
    );
    
    if (lightSourcesWithoutFlag.length > 0) {
      this.addIssue({
        type: 'warning',
        category: 'light',
        message: `${lightSourcesWithoutFlag.length} light sources missing isLight flag`,
        objectId: lightSourcesWithoutFlag.map(o => o.id).join(', ')
      });
      console.log(`⚠ ${lightSourcesWithoutFlag.length} potential light sources without isLight flag:`);
      lightSourcesWithoutFlag.forEach(o => console.log(`   - ${o.id}: ${o.name}`));
    } else {
      console.log('✓ All light sources have isLight flag');
    }

    // Check doors have isDoor flag
    const doorLikeObjects = objects.filter(obj =>
      obj.name.match(/door|gate|grating|window/i) &&
      !obj.name.match(/boarded/i) // boarded windows might not be doors
    );
    
    const doorsWithoutFlag = doorLikeObjects.filter(obj =>
      !obj.properties?.['isDoor']
    );
    
    if (doorsWithoutFlag.length > 0) {
      this.addIssue({
        type: 'warning',
        category: 'door',
        message: `${doorsWithoutFlag.length} door-like objects missing isDoor flag`,
        objectId: doorsWithoutFlag.map(o => o.id).join(', ')
      });
      console.log(`⚠ ${doorsWithoutFlag.length} door-like objects without isDoor flag:`);
      doorsWithoutFlag.forEach(o => console.log(`   - ${o.id}: ${o.name}`));
    } else {
      console.log('✓ All door-like objects have isDoor flag');
    }

    // Check tools have isTool flag
    const toolLikeObjects = objects.filter(obj =>
      obj.name.match(/key|rope|wrench|shovel|pump|screw|hammer|knife|pick/i) &&
      !obj.name.match(/chest/i) &&  // Exclude tool chest (it's a container)
      obj.portable
    );
    
    const toolsWithoutFlag = toolLikeObjects.filter(obj =>
      !obj.properties?.['isTool']
    );
    
    if (toolsWithoutFlag.length > 0) {
      this.addIssue({
        type: 'warning',
        category: 'tool',
        message: `${toolsWithoutFlag.length} tool-like objects missing isTool flag`,
        objectId: toolsWithoutFlag.map(o => o.id).join(', ')
      });
      console.log(`⚠ ${toolsWithoutFlag.length} tool-like objects without isTool flag:`);
      toolsWithoutFlag.forEach(o => console.log(`   - ${o.id}: ${o.name}`));
    } else {
      console.log('✓ All tool-like objects have isTool flag');
    }

    // Check weapons have isWeapon flag
    const weaponLikeObjects = objects.filter(obj =>
      obj.name.match(/sword|axe|mace|club|staff|spear|dagger|blade|knife/i) &&
      obj.portable
    );
    
    const weaponsWithoutFlag = weaponLikeObjects.filter(obj =>
      !obj.properties?.['isWeapon']
    );
    
    if (weaponsWithoutFlag.length > 0) {
      this.addIssue({
        type: 'warning',
        category: 'weapon',
        message: `${weaponsWithoutFlag.length} weapon-like objects missing isWeapon flag`,
        objectId: weaponsWithoutFlag.map(o => o.id).join(', ')
      });
      console.log(`⚠ ${weaponsWithoutFlag.length} weapon-like objects without isWeapon flag:`);
      weaponsWithoutFlag.forEach(o => console.log(`   - ${o.id}: ${o.name}`));
    } else {
      console.log('✓ All weapon-like objects have isWeapon flag');
    }

    // Count properties added
    const objectsWithProperties = objects.filter(o => o.properties).length;
    console.log(`\nℹ Total objects: ${objects.length}`);
    console.log(`ℹ Objects with properties: ${objectsWithProperties} (${((objectsWithProperties/objects.length)*100).toFixed(1)}%)`);
    
    const readableCount = objects.filter(o => o.properties?.['isReadable']).length;
    const doorCount = objects.filter(o => o.properties?.['isDoor']).length;
    const toolCount = objects.filter(o => o.properties?.['isTool']).length;
    const weaponCount = objects.filter(o => o.properties?.['isWeapon']).length;
    const foodCount = objects.filter(o => o.properties?.['isFood']).length;
    
    console.log(`\nProperty Coverage:`);
    console.log(`  - Readable items: ${readableCount}`);
    console.log(`  - Doors: ${doorCount}`);
    console.log(`  - Tools: ${toolCount}`);
    console.log(`  - Weapons: ${weaponCount}`);
    console.log(`  - Food: ${foodCount}`);
  }

  /**
   * Validate room properties for semantic correctness
   */
  private validateRooms(): void {
    const data = this.loadJSON<{ rooms: Room[] }>(
      path.join(this.dataDir, 'rooms.json')
    );

    const rooms = data.rooms;

    console.log('\n=== Validating Room Properties ===\n');

    // Check water rooms have terrain property
    const waterRooms = rooms.filter(r =>
      r.name.match(/reservoir|stream|river|lake|pool|water/i)
    );
    
    const waterRoomsWithoutTerrain = waterRooms.filter(r =>
      !r.properties?.['terrain'] || r.properties['terrain'] !== 'water'
    );
    
    if (waterRoomsWithoutTerrain.length > 0) {
      this.addIssue({
        type: 'warning',
        category: 'room-terrain',
        message: `${waterRoomsWithoutTerrain.length} water rooms missing terrain property`,
        objectId: waterRoomsWithoutTerrain.map(r => r.id).join(', ')
      });
      console.log(`⚠ ${waterRoomsWithoutTerrain.length} water rooms without terrain=water:`);
      waterRoomsWithoutTerrain.forEach(r => console.log(`   - ${r.id}: ${r.name}`));
    } else {
      console.log('✓ All water-named rooms have terrain=water');
    }

    // Check sacred rooms
    const sacredRooms = rooms.filter(r =>
      r.name.match(/temple|shrine|altar|tomb|sacred/i)
    );
    
    const sacredRoomsWithoutFlag = sacredRooms.filter(r =>
      !r.properties?.['isSacred']
    );
    
    if (sacredRoomsWithoutFlag.length > 0) {
      this.addIssue({
        type: 'info',
        category: 'room-sacred',
        message: `${sacredRoomsWithoutFlag.length} sacred-named rooms missing isSacred flag`,
        objectId: sacredRoomsWithoutFlag.map(r => r.id).join(', ')
      });
      console.log(`ℹ ${sacredRoomsWithoutFlag.length} sacred-named rooms without isSacred flag:`);
      sacredRoomsWithoutFlag.forEach(r => console.log(`   - ${r.id}: ${r.name}`));
    } else {
      console.log('✓ All sacred-named rooms have isSacred flag');
    }

    // Count room properties
    const roomsWithProperties = rooms.filter(r => r.properties).length;
    console.log(`\nℹ Total rooms: ${rooms.length}`);
    console.log(`ℹ Rooms with properties: ${roomsWithProperties} (${((roomsWithProperties/rooms.length)*100).toFixed(1)}%)`);
    
    const waterTerrainCount = rooms.filter(r => r.properties?.['terrain'] === 'water').length;
    const sacredCount = rooms.filter(r => r.properties?.['isSacred']).length;
    
    console.log(`\nRoom Property Coverage:`);
    console.log(`  - Water terrain: ${waterTerrainCount}`);
    console.log(`  - Sacred: ${sacredCount}`);
  }

  /**
   * Generate summary report
   */
  private generateSummary(): void {
    console.log('\n' + '='.repeat(80));
    console.log('VALIDATION SUMMARY');
    console.log('='.repeat(80) + '\n');

    const errors = this.issues.filter(i => i.type === 'error');
    const warnings = this.issues.filter(i => i.type === 'warning');
    const infos = this.issues.filter(i => i.type === 'info');

    console.log(`Errors: ${errors.length}`);
    console.log(`Warnings: ${warnings.length}`);
    console.log(`Info: ${infos.length}`);
    console.log(`\nTotal issues: ${this.issues.length}`);

    if (errors.length > 0) {
      console.log('\n⚠ CRITICAL: Errors must be fixed before deployment');
    } else if (warnings.length > 0) {
      console.log('\n✓ No critical errors, but some warnings exist');
    } else {
      console.log('\n✓ All validations passed!');
    }
  }

  public run(): void {
    console.log('='.repeat(80));
    console.log('Data Quality Validation Tool - Phase 2');
    console.log('='.repeat(80));

    this.validateObjects();
    this.validateRooms();
    this.generateSummary();
  }
}

const validator = new DataQualityValidator();
validator.run();
