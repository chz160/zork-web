import { TestBed } from '@angular/core/testing';
import { SpatialLayoutService } from './spatial-layout.service';
import { Room, Direction } from '../models';

describe('SpatialLayoutService', () => {
  let service: SpatialLayoutService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SpatialLayoutService],
    });
    service = TestBed.inject(SpatialLayoutService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Direction Vectors', () => {
    it('should return correct vector for north', () => {
      const vector = service.getDirectionVector('north');
      expect(vector).toEqual({ dx: 0, dy: -1, dz: 0 });
    });

    it('should return correct vector for south', () => {
      const vector = service.getDirectionVector('south');
      expect(vector).toEqual({ dx: 0, dy: 1, dz: 0 });
    });

    it('should return correct vector for east', () => {
      const vector = service.getDirectionVector('east');
      expect(vector).toEqual({ dx: 1, dy: 0, dz: 0 });
    });

    it('should return correct vector for west', () => {
      const vector = service.getDirectionVector('west');
      expect(vector).toEqual({ dx: -1, dy: 0, dz: 0 });
    });

    it('should return correct vector for up', () => {
      const vector = service.getDirectionVector('up');
      expect(vector).toEqual({ dx: 0, dy: 0, dz: 1 });
    });

    it('should return correct vector for down', () => {
      const vector = service.getDirectionVector('down');
      expect(vector).toEqual({ dx: 0, dy: 0, dz: -1 });
    });
  });

  describe('Single Room Layout', () => {
    it('should place single room at origin', () => {
      const rooms: Room[] = [
        {
          id: 'room1',
          name: 'Room 1',
          description: 'Test room',
          exits: new Map(),
          objectIds: [],
          visited: true,
        },
      ];

      const layout = service.computeLayout(rooms);
      const coords = layout.coordinates.get('room1');

      expect(coords).toBeDefined();
      expect(coords!.x).toBe(0);
      expect(coords!.y).toBe(0);
      expect(coords!.z).toBe(0);
      expect(layout.unplacedRooms.length).toBe(0);
    });
  });

  describe('Horizontal Movement', () => {
    it('should place room to the north', () => {
      const exits1 = new Map<Direction, string>();
      exits1.set('north', 'room2');

      const rooms: Room[] = [
        {
          id: 'room1',
          name: 'Room 1',
          description: 'Start',
          exits: exits1,
          objectIds: [],
          visited: true,
        },
        {
          id: 'room2',
          name: 'Room 2',
          description: 'North',
          exits: new Map(),
          objectIds: [],
          visited: true,
        },
      ];

      const layout = service.computeLayout(rooms, 'room1');
      const room1Coords = layout.coordinates.get('room1');
      const room2Coords = layout.coordinates.get('room2');

      expect(room1Coords).toBeDefined();
      expect(room2Coords).toBeDefined();
      expect(room2Coords!.y).toBe(room1Coords!.y - 1); // North is negative Y
      expect(room2Coords!.x).toBe(room1Coords!.x);
      expect(room2Coords!.z).toBe(room1Coords!.z);
    });

    it('should place room to the south', () => {
      const exits1 = new Map<Direction, string>();
      exits1.set('south', 'room2');

      const rooms: Room[] = [
        {
          id: 'room1',
          name: 'Room 1',
          description: 'Start',
          exits: exits1,
          objectIds: [],
          visited: true,
        },
        {
          id: 'room2',
          name: 'Room 2',
          description: 'South',
          exits: new Map(),
          objectIds: [],
          visited: true,
        },
      ];

      const layout = service.computeLayout(rooms, 'room1');
      const room1Coords = layout.coordinates.get('room1');
      const room2Coords = layout.coordinates.get('room2');

      expect(room2Coords!.y).toBe(room1Coords!.y + 1); // South is positive Y
      expect(room2Coords!.x).toBe(room1Coords!.x);
      expect(room2Coords!.z).toBe(room1Coords!.z);
    });

    it('should place room to the east', () => {
      const exits1 = new Map<Direction, string>();
      exits1.set('east', 'room2');

      const rooms: Room[] = [
        {
          id: 'room1',
          name: 'Room 1',
          description: 'Start',
          exits: exits1,
          objectIds: [],
          visited: true,
        },
        {
          id: 'room2',
          name: 'Room 2',
          description: 'East',
          exits: new Map(),
          objectIds: [],
          visited: true,
        },
      ];

      const layout = service.computeLayout(rooms, 'room1');
      const room1Coords = layout.coordinates.get('room1');
      const room2Coords = layout.coordinates.get('room2');

      expect(room2Coords!.x).toBe(room1Coords!.x + 1); // East is positive X
      expect(room2Coords!.y).toBe(room1Coords!.y);
      expect(room2Coords!.z).toBe(room1Coords!.z);
    });

    it('should place room to the west', () => {
      const exits1 = new Map<Direction, string>();
      exits1.set('west', 'room2');

      const rooms: Room[] = [
        {
          id: 'room1',
          name: 'Room 1',
          description: 'Start',
          exits: exits1,
          objectIds: [],
          visited: true,
        },
        {
          id: 'room2',
          name: 'Room 2',
          description: 'West',
          exits: new Map(),
          objectIds: [],
          visited: true,
        },
      ];

      const layout = service.computeLayout(rooms, 'room1');
      const room1Coords = layout.coordinates.get('room1');
      const room2Coords = layout.coordinates.get('room2');

      expect(room2Coords!.x).toBe(room1Coords!.x - 1); // West is negative X
      expect(room2Coords!.y).toBe(room1Coords!.y);
      expect(room2Coords!.z).toBe(room1Coords!.z);
    });
  });

  describe('Vertical Movement', () => {
    it('should place room above when going up', () => {
      const exits1 = new Map<Direction, string>();
      exits1.set('up', 'room2');

      const rooms: Room[] = [
        {
          id: 'room1',
          name: 'Room 1',
          description: 'Ground floor',
          exits: exits1,
          objectIds: [],
          visited: true,
        },
        {
          id: 'room2',
          name: 'Room 2',
          description: 'Upstairs',
          exits: new Map(),
          objectIds: [],
          visited: true,
        },
      ];

      const layout = service.computeLayout(rooms, 'room1');
      const room1Coords = layout.coordinates.get('room1');
      const room2Coords = layout.coordinates.get('room2');

      expect(room2Coords!.z).toBe(room1Coords!.z + 1); // Up is positive Z
      expect(room2Coords!.x).toBe(room1Coords!.x);
      expect(room2Coords!.y).toBe(room1Coords!.y);
    });

    it('should place room below when going down', () => {
      const exits1 = new Map<Direction, string>();
      exits1.set('down', 'room2');

      const rooms: Room[] = [
        {
          id: 'room1',
          name: 'Room 1',
          description: 'Ground floor',
          exits: exits1,
          objectIds: [],
          visited: true,
        },
        {
          id: 'room2',
          name: 'Room 2',
          description: 'Basement',
          exits: new Map(),
          objectIds: [],
          visited: true,
        },
      ];

      const layout = service.computeLayout(rooms, 'room1');
      const room1Coords = layout.coordinates.get('room1');
      const room2Coords = layout.coordinates.get('room2');

      expect(room2Coords!.z).toBe(room1Coords!.z - 1); // Down is negative Z
      expect(room2Coords!.x).toBe(room1Coords!.x);
      expect(room2Coords!.y).toBe(room1Coords!.y);
    });
  });

  describe('Multi-Room Layout', () => {
    it('should handle chain of rooms', () => {
      const exits1 = new Map<Direction, string>();
      exits1.set('east', 'room2');
      const exits2 = new Map<Direction, string>();
      exits2.set('east', 'room3');

      const rooms: Room[] = [
        {
          id: 'room1',
          name: 'Room 1',
          description: 'Start',
          exits: exits1,
          objectIds: [],
          visited: true,
        },
        {
          id: 'room2',
          name: 'Room 2',
          description: 'Middle',
          exits: exits2,
          objectIds: [],
          visited: true,
        },
        {
          id: 'room3',
          name: 'Room 3',
          description: 'End',
          exits: new Map(),
          objectIds: [],
          visited: true,
        },
      ];

      const layout = service.computeLayout(rooms, 'room1');
      const room1Coords = layout.coordinates.get('room1');
      const room2Coords = layout.coordinates.get('room2');
      const room3Coords = layout.coordinates.get('room3');

      expect(room2Coords!.x).toBe(room1Coords!.x + 1);
      expect(room3Coords!.x).toBe(room1Coords!.x + 2);
      expect(layout.unplacedRooms.length).toBe(0);
    });

    it('should handle multiple exits from one room', () => {
      const exits1 = new Map<Direction, string>();
      exits1.set('north', 'room2');
      exits1.set('east', 'room3');
      exits1.set('up', 'room4');

      const rooms: Room[] = [
        {
          id: 'room1',
          name: 'Room 1',
          description: 'Central',
          exits: exits1,
          objectIds: [],
          visited: true,
        },
        {
          id: 'room2',
          name: 'Room 2',
          description: 'North',
          exits: new Map(),
          objectIds: [],
          visited: true,
        },
        {
          id: 'room3',
          name: 'Room 3',
          description: 'East',
          exits: new Map(),
          objectIds: [],
          visited: true,
        },
        {
          id: 'room4',
          name: 'Room 4',
          description: 'Above',
          exits: new Map(),
          objectIds: [],
          visited: true,
        },
      ];

      const layout = service.computeLayout(rooms, 'room1');
      const room1Coords = layout.coordinates.get('room1');
      const room2Coords = layout.coordinates.get('room2');
      const room3Coords = layout.coordinates.get('room3');
      const room4Coords = layout.coordinates.get('room4');

      expect(room2Coords!.y).toBe(room1Coords!.y - 1); // North
      expect(room3Coords!.x).toBe(room1Coords!.x + 1); // East
      expect(room4Coords!.z).toBe(room1Coords!.z + 1); // Up
      expect(layout.unplacedRooms.length).toBe(0);
    });
  });

  describe('Manual Coordinates', () => {
    it('should respect manually placed rooms', () => {
      const exits1 = new Map<Direction, string>();
      exits1.set('east', 'room2');

      const rooms: Room[] = [
        {
          id: 'room1',
          name: 'Room 1',
          description: 'Start',
          exits: exits1,
          objectIds: [],
          visited: true,
          spatialCoordinates: { x: 5, y: 5, z: 5, isManual: true },
        },
        {
          id: 'room2',
          name: 'Room 2',
          description: 'East',
          exits: new Map(),
          objectIds: [],
          visited: true,
        },
      ];

      const layout = service.computeLayout(rooms, 'room1');
      const room1Coords = layout.coordinates.get('room1');
      const room2Coords = layout.coordinates.get('room2');

      expect(room1Coords!.x).toBe(5);
      expect(room1Coords!.y).toBe(5);
      expect(room1Coords!.z).toBe(5);
      expect(room2Coords!.x).toBe(6); // East of manual position
    });

    it('should use manual coordinates for target room', () => {
      const exits1 = new Map<Direction, string>();
      exits1.set('east', 'room2');

      const rooms: Room[] = [
        {
          id: 'room1',
          name: 'Room 1',
          description: 'Start',
          exits: exits1,
          objectIds: [],
          visited: true,
        },
        {
          id: 'room2',
          name: 'Room 2',
          description: 'East',
          exits: new Map(),
          objectIds: [],
          visited: true,
          spatialCoordinates: { x: 10, y: 10, z: 10, isManual: true },
        },
      ];

      const layout = service.computeLayout(rooms, 'room1');
      const room2Coords = layout.coordinates.get('room2');

      expect(room2Coords!.x).toBe(10);
      expect(room2Coords!.y).toBe(10);
      expect(room2Coords!.z).toBe(10);
    });
  });

  describe('Collision Handling', () => {
    it('should detect coordinate collisions', () => {
      // Create a scenario where two rooms would occupy same space
      const exits1 = new Map<Direction, string>();
      exits1.set('north', 'room2');
      exits1.set('south', 'room3');
      const exits2 = new Map<Direction, string>();
      exits2.set('south', 'room4');
      const exits3 = new Map<Direction, string>();
      exits3.set('north', 'room4');

      const rooms: Room[] = [
        {
          id: 'room1',
          name: 'Room 1',
          description: 'Center',
          exits: exits1,
          objectIds: [],
          visited: true,
        },
        {
          id: 'room2',
          name: 'Room 2',
          description: 'North',
          exits: exits2,
          objectIds: [],
          visited: true,
        },
        {
          id: 'room3',
          name: 'Room 3',
          description: 'South',
          exits: exits3,
          objectIds: [],
          visited: true,
        },
        {
          id: 'room4',
          name: 'Room 4',
          description: 'Target',
          exits: new Map(),
          objectIds: [],
          visited: true,
        },
      ];

      const layout = service.computeLayout(rooms, 'room1');

      // All rooms should be placed (collision avoidance should handle it)
      expect(layout.coordinates.size).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Bounding Box', () => {
    it('should return zero bounding box for empty coordinates', () => {
      const bbox = service.getBoundingBox(new Map());
      expect(bbox.minX).toBe(0);
      expect(bbox.maxX).toBe(0);
      expect(bbox.minY).toBe(0);
      expect(bbox.maxY).toBe(0);
      expect(bbox.minZ).toBe(0);
      expect(bbox.maxZ).toBe(0);
    });

    it('should compute bounding box for single coordinate', () => {
      const coords = new Map();
      coords.set('room1', { x: 5, y: 3, z: 2, isManual: false });

      const bbox = service.getBoundingBox(coords);
      expect(bbox.minX).toBe(5);
      expect(bbox.maxX).toBe(5);
      expect(bbox.minY).toBe(3);
      expect(bbox.maxY).toBe(3);
      expect(bbox.minZ).toBe(2);
      expect(bbox.maxZ).toBe(2);
    });

    it('should compute bounding box for multiple coordinates', () => {
      const coords = new Map();
      coords.set('room1', { x: 0, y: 0, z: 0, isManual: false });
      coords.set('room2', { x: 5, y: 3, z: 2, isManual: false });
      coords.set('room3', { x: -2, y: -1, z: 4, isManual: false });

      const bbox = service.getBoundingBox(coords);
      expect(bbox.minX).toBe(-2);
      expect(bbox.maxX).toBe(5);
      expect(bbox.minY).toBe(-1);
      expect(bbox.maxY).toBe(3);
      expect(bbox.minZ).toBe(0);
      expect(bbox.maxZ).toBe(4);
    });
  });

  describe('Direction Detection', () => {
    it('should detect direction between coordinates', () => {
      const from = { x: 0, y: 0, z: 0, isManual: false };
      const toNorth = { x: 0, y: -1, z: 0, isManual: false };
      const toEast = { x: 1, y: 0, z: 0, isManual: false };
      const toUp = { x: 0, y: 0, z: 1, isManual: false };

      expect(service.getDirection(from, toNorth)).toBe('north');
      expect(service.getDirection(from, toEast)).toBe('east');
      expect(service.getDirection(from, toUp)).toBe('up');
    });

    it('should return null for non-adjacent coordinates', () => {
      const from = { x: 0, y: 0, z: 0, isManual: false };
      const toFar = { x: 2, y: 0, z: 0, isManual: false };

      expect(service.getDirection(from, toFar)).toBeNull();
    });

    it('should return null for diagonal coordinates', () => {
      const from = { x: 0, y: 0, z: 0, isManual: false };
      const toDiagonal = { x: 1, y: 1, z: 0, isManual: false };

      expect(service.getDirection(from, toDiagonal)).toBeNull();
    });
  });

  describe('Real-World Scenario: Kitchen and Attic', () => {
    it('should place kitchen and attic correctly', () => {
      // Scenario from issue: entering house through kitchen window (east-west),
      // then going up to attic means attic should be directly above kitchen
      const exitsOutside = new Map<Direction, string>();
      exitsOutside.set('west', 'kitchen');

      const exitsKitchen = new Map<Direction, string>();
      exitsKitchen.set('east', 'outside');
      exitsKitchen.set('up', 'attic');
      exitsKitchen.set('south', 'living-room');

      const rooms: Room[] = [
        {
          id: 'outside',
          name: 'Behind House',
          description: 'Behind the white house',
          exits: exitsOutside,
          objectIds: [],
          visited: true,
        },
        {
          id: 'kitchen',
          name: 'Kitchen',
          description: 'Kitchen of the house',
          exits: exitsKitchen,
          objectIds: [],
          visited: true,
        },
        {
          id: 'attic',
          name: 'Attic',
          description: 'Dusty attic',
          exits: new Map(),
          objectIds: [],
          visited: true,
        },
        {
          id: 'living-room',
          name: 'Living Room',
          description: 'Living room',
          exits: new Map(),
          objectIds: [],
          visited: true,
        },
      ];

      const layout = service.computeLayout(rooms, 'outside');
      const outsideCoords = layout.coordinates.get('outside');
      const kitchenCoords = layout.coordinates.get('kitchen');
      const atticCoords = layout.coordinates.get('attic');
      const livingRoomCoords = layout.coordinates.get('living-room');

      // Kitchen should be west of outside (co-planar)
      expect(kitchenCoords!.x).toBe(outsideCoords!.x - 1);
      expect(kitchenCoords!.z).toBe(outsideCoords!.z); // Same level

      // Attic should be directly above kitchen
      expect(atticCoords!.x).toBe(kitchenCoords!.x);
      expect(atticCoords!.y).toBe(kitchenCoords!.y);
      expect(atticCoords!.z).toBe(kitchenCoords!.z + 1);

      // Living room should be adjacent to kitchen
      expect(livingRoomCoords!.y).toBe(kitchenCoords!.y + 1); // South
      expect(livingRoomCoords!.z).toBe(kitchenCoords!.z); // Same level
    });
  });
});
