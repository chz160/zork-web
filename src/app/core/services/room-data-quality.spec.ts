import { TestBed } from '@angular/core/testing';
import { DataLoaderService } from './data-loader.service';
import { Room } from '../models';

/**
 * Characterization tests for room data quality.
 *
 * These tests verify that room descriptions and exits meet quality standards:
 * - Descriptions are proper prose, not comma-separated tokens
 * - Exit destinations are valid room IDs, not error messages
 * - Canonical Zork text is preserved for key locations
 */
describe('Room Data Quality - Characterization Tests', () => {
  let service: DataLoaderService;
  let rooms: Room[];

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataLoaderService);
    rooms = service.loadRooms();
  });

  describe('High-Priority Rooms: Canonical Text Verification', () => {
    it('should have canonical West of House description', () => {
      const westOfHouse = rooms.find((r) => r.id === 'west-of-house');
      expect(westOfHouse).toBeDefined();
      expect(westOfHouse?.description).toContain('open field');
      expect(westOfHouse?.description).toContain('white house');
      expect(westOfHouse?.description).toContain('boarded front door');
      expect(westOfHouse?.description).not.toMatch(/,\w+,\w+,/); // No comma-separated tokens
    });

    it('should have canonical North of House description', () => {
      const northOfHouse = rooms.find((r) => r.id === 'north-of-house');
      expect(northOfHouse).toBeDefined();
      expect(northOfHouse?.description).toContain('north side');
      expect(northOfHouse?.description).toContain('white house');
      expect(northOfHouse?.description).toContain('windows are boarded');
      expect(northOfHouse?.description).not.toMatch(/,\w+,\w+,/);
    });

    it('should have canonical South of House description', () => {
      const southOfHouse = rooms.find((r) => r.id === 'south-of-house');
      expect(southOfHouse).toBeDefined();
      expect(southOfHouse?.description).toContain('south side');
      expect(southOfHouse?.description).toContain('white house');
      expect(southOfHouse?.description).toContain('windows are boarded');
      expect(southOfHouse?.description).not.toMatch(/,\w+,\w+,/);
    });

    it('should have canonical East of House description', () => {
      const eastOfHouse = rooms.find((r) => r.id === 'east-of-house');
      expect(eastOfHouse).toBeDefined();
      expect(eastOfHouse?.description).toContain('behind');
      expect(eastOfHouse?.description).toContain('white house');
      expect(eastOfHouse?.description).not.toMatch(/,\w+,\w+,/);
      // Should not be just the short form "Behind House"
      expect(eastOfHouse?.description.length).toBeGreaterThan(30);
    });

    it('should have canonical Living Room description', () => {
      const livingRoom = rooms.find((r) => r.id === 'living-room');
      expect(livingRoom).toBeDefined();
      expect(livingRoom?.description).toContain('living room');
      expect(livingRoom?.description).toContain('doorway');
      expect(livingRoom?.description).not.toBe('Living Room'); // Not just the name
      expect(livingRoom?.description.length).toBeGreaterThan(30);
    });
  });

  describe('Exit Validation: Valid Room IDs Only', () => {
    let validRoomIds: Set<string>;

    beforeEach(() => {
      validRoomIds = new Set(rooms.map((r) => r.id));
    });

    it('should have valid exits for West of House', () => {
      const westOfHouse = rooms.find((r) => r.id === 'west-of-house');
      expect(westOfHouse).toBeDefined();

      const exits = Array.from(westOfHouse?.exits.values() || []);
      for (const exitDestination of exits) {
        expect(validRoomIds.has(exitDestination)).toBe(
          true,
          `Exit destination "${exitDestination}" is not a valid room ID`
        );
      }
    });

    it('should have valid exits for North of House', () => {
      const northOfHouse = rooms.find((r) => r.id === 'north-of-house');
      expect(northOfHouse).toBeDefined();

      const exits = Array.from(northOfHouse?.exits.values() || []);
      for (const exitDestination of exits) {
        expect(validRoomIds.has(exitDestination)).toBe(
          true,
          `Exit destination "${exitDestination}" is not a valid room ID`
        );
      }

      // Specifically check that error messages are not used as exit destinations
      expect(exits).not.toContain('thewindowsareallboarded');
      expect(exits).not.toContain('rooms');
    });

    it('should have valid exits for South of House', () => {
      const southOfHouse = rooms.find((r) => r.id === 'south-of-house');
      expect(southOfHouse).toBeDefined();

      const exits = Array.from(southOfHouse?.exits.values() || []);
      for (const exitDestination of exits) {
        expect(validRoomIds.has(exitDestination)).toBe(
          true,
          `Exit destination "${exitDestination}" is not a valid room ID`
        );
      }

      expect(exits).not.toContain('thewindowsareallboarded');
      expect(exits).not.toContain('rooms');
    });

    it('should have valid exits for East of House', () => {
      const eastOfHouse = rooms.find((r) => r.id === 'east-of-house');
      expect(eastOfHouse).toBeDefined();

      const exits = Array.from(eastOfHouse?.exits.values() || []);
      for (const exitDestination of exits) {
        expect(validRoomIds.has(exitDestination)).toBe(
          true,
          `Exit destination "${exitDestination}" is not a valid room ID`
        );
      }
    });

    it('should not have "rooms" as an exit destination in high-priority rooms', () => {
      const highPriorityRoomIds = [
        'west-of-house',
        'north-of-house',
        'south-of-house',
        'east-of-house',
        'forest-1',
        'path',
        'clearing',
        'living-room',
        'cyclops-room',
        'grating-room',
        'mirror-room-1',
        'mirror-room-2',
      ];

      const highPriorityRooms = rooms.filter((r) => highPriorityRoomIds.includes(r.id));

      const roomsWithBadExit = highPriorityRooms.filter((room) =>
        Array.from(room.exits.values()).includes('rooms')
      );

      expect(roomsWithBadExit.length).toBe(
        0,
        `Found ${roomsWithBadExit.length} high-priority rooms with invalid "rooms" exit: ${roomsWithBadExit.map((r) => r.id).join(', ')}`
      );
    });
  });

  describe('Description Quality: No Malformed Descriptions', () => {
    it('should not have comma-separated token descriptions for key rooms', () => {
      const keyRoomIds = [
        'west-of-house',
        'north-of-house',
        'south-of-house',
        'east-of-house',
        'forest-1',
        'path',
        'clearing',
        'living-room',
      ];

      for (const roomId of keyRoomIds) {
        const room = rooms.find((r) => r.id === roomId);
        expect(room).toBeDefined();

        // Check for comma-separated pattern like "word,word,word"
        const hasTokenPattern = /^\w+,\w+,/.test(room?.description || '');
        expect(hasTokenPattern).toBe(
          false,
          `Room ${roomId} has tokenized description: "${room?.description?.substring(0, 50)}..."`
        );
      }
    });

    it('should have descriptions longer than room names', () => {
      const keyRoomIds = [
        'west-of-house',
        'north-of-house',
        'south-of-house',
        'east-of-house',
        'living-room',
        'cyclops-room',
        'grating-room',
      ];

      for (const roomId of keyRoomIds) {
        const room = rooms.find((r) => r.id === roomId);
        expect(room).toBeDefined();

        // Description should not just be the room name
        expect(room?.description.toLowerCase()).not.toBe(room?.name.toLowerCase());

        // Description should be substantive (more than 20 characters)
        expect(room?.description.length).toBeGreaterThan(20);
      }
    });
  });

  describe('Room Connectivity: Basic Navigation', () => {
    it('should allow navigation from West of House to other house locations', () => {
      const westOfHouse = rooms.find((r) => r.id === 'west-of-house');
      expect(westOfHouse).toBeDefined();

      const exits = westOfHouse?.exits;
      expect(exits).toBeDefined();

      // Should be able to go north, south, or east from west of house
      expect(exits?.has('north') || exits?.has('south') || exits?.has('east')).toBe(true);
    });

    it('should have bidirectional connectivity between house locations', () => {
      const westOfHouse = rooms.find((r) => r.id === 'west-of-house');
      const northOfHouse = rooms.find((r) => r.id === 'north-of-house');

      expect(westOfHouse).toBeDefined();
      expect(northOfHouse).toBeDefined();

      // If north of house can go south to west of house,
      // west of house should have a path to north of house
      const northExits = Array.from(northOfHouse?.exits.values() || []);
      if (northExits.includes('west-of-house')) {
        const westExits = Array.from(westOfHouse?.exits.values() || []);
        expect(westExits).toContain('north-of-house');
      }
    });
  });

  describe('Data Integrity: Room Structure', () => {
    it('should have required fields for all rooms', () => {
      for (const room of rooms) {
        expect(room.id).toBeDefined();
        expect(room.name).toBeDefined();
        expect(room.description).toBeDefined();
        expect(room.exits).toBeDefined();
        expect(room.objectIds).toBeDefined();
        expect(typeof room.visited).toBe('boolean');
      }
    });

    it('should have unique room IDs', () => {
      const idCounts = new Map<string, number>();
      for (const room of rooms) {
        idCounts.set(room.id, (idCounts.get(room.id) || 0) + 1);
      }

      const duplicates = Array.from(idCounts.entries())
        .filter(([, count]) => count > 1)
        .map(([id]) => id);

      expect(duplicates.length).toBe(0, `Found duplicate room IDs: ${duplicates.join(', ')}`);
    });
  });

  describe('Phase 2 Fixes: Previously Malformed Rooms', () => {
    it('should have proper prose descriptions for temple rooms', () => {
      const northTemple = rooms.find((r) => r.id === 'north-templewastemp1');
      const southTemple = rooms.find((r) => r.id === 'south-templewastemp2');

      expect(northTemple).toBeDefined();
      expect(southTemple).toBeDefined();

      // Should not have comma-separated tokens
      expect(northTemple?.description).not.toMatch(/,\w+,\w+,/);
      expect(southTemple?.description).not.toMatch(/,\w+,\w+,/);

      // Should mention key features
      expect(northTemple?.description).toContain('temple');
      expect(southTemple?.description).toContain('altar');
    });

    it('should have valid exits for dam area rooms', () => {
      const validRoomIds = new Set(rooms.map((r) => r.id));

      const damRooms = [
        'dam-roomwasdam',
        'dam-lobbywaslobby',
        'maintenance-roomwasmaint',
        'dam-basewasdock',
      ];

      for (const roomId of damRooms) {
        const room = rooms.find((r) => r.id === roomId);
        expect(room).toBeDefined();

        const exits = Array.from(room?.exits.values() || []);
        for (const exitDestination of exits) {
          expect(validRoomIds.has(exitDestination)).toBe(
            true,
            `${roomId} has invalid exit: "${exitDestination}"`
          );
        }
      }
    });

    it('should have valid exits for river rooms', () => {
      const validRoomIds = new Set(rooms.map((r) => r.id));

      const riverRooms = [
        'river-1wasrivr1',
        'river-2wasrivr2',
        'river-3wasrivr3',
        'river-4wasrivr4',
        'river-5wasrivr5',
      ];

      for (const roomId of riverRooms) {
        const room = rooms.find((r) => r.id === roomId);
        expect(room).toBeDefined();

        const exits = Array.from(room?.exits.values() || []);
        for (const exitDestination of exits) {
          expect(validRoomIds.has(exitDestination)).toBe(
            true,
            `${roomId} has invalid exit: "${exitDestination}"`
          );
          // Should not have "rooms" placeholder
          expect(exitDestination).not.toBe('rooms');
        }
      }
    });

    it('should have proper descriptions for mine rooms', () => {
      const mineRooms = ['mine-1wasmine1', 'mine-2wasmine2', 'mine-3wasmine3', 'mine-4wasmine4'];

      for (const roomId of mineRooms) {
        const room = rooms.find((r) => r.id === roomId);
        expect(room).toBeDefined();

        // Should not have comma-separated tokens
        expect(room?.description).not.toMatch(/,\w+,\w+,/);

        // Should have substantive description
        expect(room?.description.length).toBeGreaterThan(10);
      }
    });

    it('should not have any "rooms" placeholder exits', () => {
      for (const room of rooms) {
        const exits = Array.from(room.exits.values());
        const hasRoomsPlaceholder = exits.some((exit) => exit === 'rooms');
        expect(hasRoomsPlaceholder).toBe(
          false,
          `Room ${room.id} still has "rooms" placeholder exit`
        );
      }
    });

    it('should not have error message strings as exits', () => {
      const errorPatterns = [
        'thereisnotreeheresuitableforclimbing',
        'themountainsareimpassable',
        'theforestbecomesimpenetrabletothenorth',
        'storm-tossedtreesblockyourway',
        'thechasmprobablyleadsstraighttotheinfernalregions',
        'tostudioiffalse-flagelse',
        'permaze-diodestomaze',
      ];

      for (const room of rooms) {
        const exits = Array.from(room.exits.values());
        for (const exit of exits) {
          const hasErrorPattern = errorPatterns.some((pattern) => exit.includes(pattern));
          expect(hasErrorPattern).toBe(
            false,
            `Room ${room.id} has error message as exit: "${exit}"`
          );
        }
      }
    });

    it('should have proper prose for gallery and studio', () => {
      const gallery = rooms.find((r) => r.id === 'gallery');
      const studio = rooms.find((r) => r.id === 'studio');

      expect(gallery).toBeDefined();
      expect(studio).toBeDefined();

      // Should not have comma-separated tokens
      expect(gallery?.description).not.toMatch(/,\w+,\w+,/);
      expect(studio?.description).not.toMatch(/,\w+,\w+,/);

      // Should mention key features
      expect(gallery?.description.toLowerCase()).toContain('gallery');
      expect(studio?.description.toLowerCase()).toContain('studio');
    });

    it('should have proper prose for east of chasm', () => {
      const eastOfChasm = rooms.find((r) => r.id === 'east-of-chasm');

      expect(eastOfChasm).toBeDefined();

      // Should not have comma-separated tokens
      expect(eastOfChasm?.description).not.toMatch(/,\w+,\w+,/);

      // Should mention the chasm
      expect(eastOfChasm?.description.toLowerCase()).toContain('chasm');

      // Should have valid exits only
      const validRoomIds = new Set(rooms.map((r) => r.id));
      const exits = Array.from(eastOfChasm?.exits.values() || []);
      for (const exitDestination of exits) {
        expect(validRoomIds.has(exitDestination)).toBe(true);
      }
    });
  });
});
