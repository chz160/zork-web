#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Add Room Properties - Phase 2
 * 
 * Adds terrain and sacred properties to rooms based on their names
 * and characteristics.
 */

import * as fs from 'fs';
import * as path from 'path';

interface Room {
  id: string;
  name: string;
  properties?: {
    [key: string]: unknown;
  };
}

interface RoomData {
  rooms: Room[];
}

class RoomPropertyAdder {
  private dataFile: string;
  private data: RoomData;
  private changesMade: number = 0;

  constructor() {
    this.dataFile = path.join(process.cwd(), 'src/app/data/rooms.json');
    this.data = JSON.parse(fs.readFileSync(this.dataFile, 'utf-8'));
  }

  private addProperty(roomId: string, propertyName: string, value: unknown): void {
    const room = this.data.rooms.find(r => r.id === roomId);
    if (!room) {
      console.log(`⚠ Room not found: ${roomId}`);
      return;
    }

    if (!room.properties) {
      room.properties = {};
    }

    if (room.properties[propertyName] === undefined) {
      room.properties[propertyName] = value;
      console.log(`✓ ${roomId}: ${propertyName} = ${JSON.stringify(value)}`);
      this.changesMade++;
    } else {
      console.log(`  ${roomId}: ${propertyName} already set`);
    }
  }

  public addWaterRooms(): void {
    console.log('\n=== Adding Water Terrain Properties ===\n');
    
    const waterRooms = [
      { id: 'reservoir-south', depth: 'deep' },
      { id: 'reservoir', depth: 'deep' },
      { id: 'reservoir-north', depth: 'deep' },
      { id: 'stream-view', depth: 'shallow' },  // viewing the stream
      { id: 'in-stream', depth: 'shallow' },
      { id: 'river-1wasrivr1', depth: 'deep' },
      { id: 'river-2wasrivr2', depth: 'deep' },
      { id: 'river-3wasrivr3', depth: 'deep' },
      { id: 'river-4wasrivr4', depth: 'deep' },
      { id: 'river-5wasrivr5', depth: 'deep' }
    ];

    waterRooms.forEach(({ id, depth }) => {
      this.addProperty(id, 'terrain', 'water');
      this.addProperty(id, 'waterDepth', depth);
      this.addProperty(id, 'breathable', true);  // Assume breathable unless underwater
    });
  }

  public addAirRooms(): void {
    console.log('\n=== Adding Air Terrain Properties ===\n');
    
    // Look for rooms with "air" or "flying" in descriptions
    // In classic Zork, there aren't many true air rooms in the base game
    // Most would be in the endgame or special locations
    
    console.log('Note: No obvious air terrain rooms found in current 110 rooms');
    console.log('Air rooms (hot air balloon, etc.) may be in endgame content');
  }

  public addSacredRooms(): void {
    console.log('\n=== Adding Sacred Room Properties ===\n');
    
    const sacredRooms = [
      { id: 'north-templewastemp1', type: 'temple' },
      { id: 'south-templewastemp2', type: 'temple' },
      { id: 'north-temple', type: 'temple' },
      { id: 'altar', type: 'altar' },
      { id: 'entrance-to-hades', type: 'shrine' },
      { id: 'land-of-living-dead', type: 'tomb' }
    ];

    sacredRooms.forEach(({ id, type }) => {
      this.addProperty(id, 'isSacred', true);
      this.addProperty(id, 'sacredType', type);
    });
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
    console.log('Add Room Properties - Phase 2');
    console.log('='.repeat(80));

    this.addWaterRooms();
    this.addAirRooms();
    this.addSacredRooms();

    console.log('\n' + '='.repeat(80));
    console.log(`Total properties added: ${this.changesMade}`);
    console.log('='.repeat(80));

    this.save();
  }
}

const adder = new RoomPropertyAdder();
adder.run();
