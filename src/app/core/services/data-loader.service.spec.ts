import { TestBed } from '@angular/core/testing';
import { DataLoaderService } from './data-loader.service';

describe('DataLoaderService', () => {
  let service: DataLoaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DataLoaderService],
    });
    service = TestBed.inject(DataLoaderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadRooms', () => {
    it('should load rooms from JSON data', () => {
      const rooms = service.loadRooms();
      expect(rooms).toBeDefined();
      expect(Array.isArray(rooms)).toBe(true);
      expect(rooms.length).toBeGreaterThan(0);
    });

    it('should convert exits from object to Map', () => {
      const rooms = service.loadRooms();
      const roomWithExits = rooms.find((room) => room.exits.size > 0);

      expect(roomWithExits).toBeDefined();
      if (roomWithExits) {
        expect(roomWithExits.exits).toBeInstanceOf(Map);
        expect(roomWithExits.exits.size).toBeGreaterThan(0);
      }
    });

    it('should have required room properties', () => {
      const rooms = service.loadRooms();
      const firstRoom = rooms[0];

      expect(firstRoom.id).toBeDefined();
      expect(firstRoom.name).toBeDefined();
      expect(firstRoom.description).toBeDefined();
      expect(firstRoom.exits).toBeInstanceOf(Map);
      expect(firstRoom.objectIds).toBeDefined();
      expect(Array.isArray(firstRoom.objectIds)).toBe(true);
      expect(typeof firstRoom.visited).toBe('boolean');
    });

    it('should load at least 100 rooms', () => {
      const rooms = service.loadRooms();
      expect(rooms.length).toBeGreaterThanOrEqual(100);
    });
  });

  describe('loadObjects', () => {
    it('should load objects from JSON data', () => {
      const objects = service.loadObjects();
      expect(objects).toBeDefined();
      expect(Array.isArray(objects)).toBe(true);
      expect(objects.length).toBeGreaterThan(0);
    });

    it('should have required object properties', () => {
      const objects = service.loadObjects();
      const firstObject = objects[0];

      expect(firstObject.id).toBeDefined();
      expect(firstObject.name).toBeDefined();
      expect(firstObject.aliases).toBeDefined();
      expect(Array.isArray(firstObject.aliases)).toBe(true);
      expect(firstObject.description).toBeDefined();
      expect(typeof firstObject.portable).toBe('boolean');
      expect(typeof firstObject.visible).toBe('boolean');
      expect(firstObject.location).toBeDefined();
    });

    it('should load at least 100 objects', () => {
      const objects = service.loadObjects();
      expect(objects.length).toBeGreaterThanOrEqual(100);
    });
  });
});
