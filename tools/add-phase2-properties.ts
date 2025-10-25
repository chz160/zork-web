#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Add Missing Properties - Phase 2
 * 
 * Manually adds missing properties to identified objects based on
 * their names and characteristics. This is necessary because the
 * canonical data uses different room ID formats.
 */

import * as fs from 'fs';
import * as path from 'path';

interface GameObject {
  id: string;
  name: string;
  properties?: {
    [key: string]: unknown;
  };
}

interface GameData {
  objects: GameObject[];
}

class PropertyAdder {
  private dataFile: string;
  private data: GameData;
  private changesMade: number = 0;

  constructor() {
    this.dataFile = path.join(process.cwd(), 'src/app/data/objects.json');
    this.data = JSON.parse(fs.readFileSync(this.dataFile, 'utf-8'));
  }

  private addProperty(objectId: string, propertyName: string, value: unknown): void {
    const obj = this.data.objects.find(o => o.id === objectId);
    if (!obj) {
      console.log(`⚠ Object not found: ${objectId}`);
      return;
    }

    if (!obj.properties) {
      obj.properties = {};
    }

    if (obj.properties[propertyName] === undefined) {
      obj.properties[propertyName] = value;
      console.log(`✓ ${objectId}: ${propertyName} = ${JSON.stringify(value)}`);
      this.changesMade++;
    } else {
      console.log(`  ${objectId}: ${propertyName} already set`);
    }
  }

  public addDoorProperties(): void {
    console.log('\n=== Adding isDoor Properties ===\n');
    
    const doors = [
      'water',            // kitchen window
      'front-door',       // door at west-of-house
      'barrow-door',      // stone door
      'grate',            // grating
      'wooden-door',      // wooden door
      'boarded-window'    // boarded window
    ];

    doors.forEach(id => {
      this.addProperty(id, 'isDoor', true);
    });
  }

  public addToolProperties(): void {
    console.log('\n=== Adding isTool Properties ===\n');
    
    const tools = [
      { id: 'pump', type: 'pump' },
      { id: 'rope', type: 'rope' },
      { id: 'screwdriver', type: 'other' },
      { id: 'keys', type: 'key' },
      { id: 'shovel', type: 'shovel' },
      { id: 'wrench', type: 'wrench' }
    ];

    tools.forEach(({ id, type }) => {
      this.addProperty(id, 'isTool', true);
      if (type !== 'other') {
        this.addProperty(id, 'toolType', type);
      }
    });
  }

  public addWeaponProperties(): void {
    console.log('\n=== Adding isWeapon Properties ===\n');
    
    const weapons = [
      { id: 'axe', type: 'axe' },
      { id: 'sword', type: 'sword' },
      { id: 'knife', type: 'knife' },
      { id: 'rusty-knife', type: 'knife' }
    ];

    weapons.forEach(({ id, type }) => {
      this.addProperty(id, 'isWeapon', true);
      this.addProperty(id, 'weaponType', type);
    });
    
    // Axe is also a tool
    this.addProperty('axe', 'isTool', true);
    this.addProperty('axe', 'toolType', 'other');
  }

  public addReadableProperties(): void {
    console.log('\n=== Adding isReadable Properties ===\n');
    
    const readableItems = [
      'tube',  // tube with label
      'advertisement'  // already has it but verify
    ];

    readableItems.forEach(id => {
      this.addProperty(id, 'isReadable', true);
    });
  }

  public addFoodProperties(): void {
    console.log('\n=== Adding isFood Properties ===\n');
    
    const foodItems = [
      'bottle',  // water in bottle (when filled)
    ];

    // Note: Most food items may not be in current objects.json
    // The canonical shows food in room-144 which isn't mapped yet
    
    console.log('Note: Only adding food property to existing objects');
    console.log('Missing food items are likely in unimplemented rooms');
  }

  public save(): void {
    if (this.changesMade > 0) {
      fs.writeFileSync(this.dataFile, JSON.stringify(this.data, null, 2), 'utf-8');
      console.log(`\n✓ Saved ${this.changesMade} changes to ${this.dataFile}`);
    } else {
      console.log('\nNo changes to save.');
    }
  }

  public run(): void {
    console.log('='.repeat(80));
    console.log('Add Missing Properties - Phase 2');
    console.log('='.repeat(80));

    this.addDoorProperties();
    this.addToolProperties();
    this.addWeaponProperties();
    this.addReadableProperties();
    this.addFoodProperties();

    console.log('\n' + '='.repeat(80));
    console.log(`Total properties added: ${this.changesMade}`);
    console.log('='.repeat(80));

    this.save();
  }
}

const adder = new PropertyAdder();
adder.run();
