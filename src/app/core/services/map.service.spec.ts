import { TestBed } from '@angular/core/testing';
import { MapService } from './map.service';
import { GameEngineService } from './game-engine.service';
import { signal } from '@angular/core';
import { Room, Direction } from '../models';

describe('MapService', () => {
  let service: MapService;
  let gameEngine: jasmine.SpyObj<GameEngineService>;

  beforeEach(() => {
    // Create mock GameEngineService
    const mockGameEngine = jasmine.createSpyObj('GameEngineService', [], {
      player: signal({
        currentRoomId: 'room1',
        inventory: [],
        score: 0,
        moveCount: 0,
        isAlive: true,
        flags: new Map(),
      }),
      rooms: signal(new Map<string, Room>()),
    });

    TestBed.configureTestingModule({
      providers: [MapService, { provide: GameEngineService, useValue: mockGameEngine }],
    });

    service = TestBed.inject(MapService);
    gameEngine = TestBed.inject(GameEngineService) as jasmine.SpyObj<GameEngineService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return empty nodes when no rooms visited', () => {
    const nodes = service.roomNodes();
    expect(nodes.length).toBe(0);
  });

  it('should return visited rooms as nodes', () => {
    const rooms = new Map<string, Room>();
    rooms.set('room1', {
      id: 'room1',
      name: 'Room 1',
      description: 'A test room',
      exits: new Map(),
      objectIds: [],
      visited: true,
    });
    rooms.set('room2', {
      id: 'room2',
      name: 'Room 2',
      description: 'Another room',
      exits: new Map(),
      objectIds: [],
      visited: false,
    });

    // Update the mock
    Object.defineProperty(gameEngine, 'rooms', {
      get: () => signal(rooms),
    });

    const nodes = service.roomNodes();
    expect(nodes.length).toBe(1);
    expect(nodes[0].id).toBe('room1');
    expect(nodes[0].name).toBe('Room 1');
    expect(nodes[0].visited).toBe(true);
  });

  it('should mark current room in nodes', () => {
    const rooms = new Map<string, Room>();
    rooms.set('room1', {
      id: 'room1',
      name: 'Room 1',
      description: 'A test room',
      exits: new Map(),
      objectIds: [],
      visited: true,
    });

    Object.defineProperty(gameEngine, 'rooms', {
      get: () => signal(rooms),
    });
    Object.defineProperty(gameEngine, 'player', {
      get: () =>
        signal({
          currentRoomId: 'room1',
          inventory: [],
          score: 0,
          moveCount: 0,
          isAlive: true,
          flags: new Map(),
        }),
    });

    const nodes = service.roomNodes();
    expect(nodes[0].isCurrent).toBe(true);
  });

  it('should compute edges between visited rooms', () => {
    const rooms = new Map<string, Room>();
    const exits1 = new Map<Direction, string>();
    exits1.set('north', 'room2');

    rooms.set('room1', {
      id: 'room1',
      name: 'Room 1',
      description: 'A test room',
      exits: exits1,
      objectIds: [],
      visited: true,
    });
    rooms.set('room2', {
      id: 'room2',
      name: 'Room 2',
      description: 'Another room',
      exits: new Map(),
      objectIds: [],
      visited: true,
    });

    Object.defineProperty(gameEngine, 'rooms', {
      get: () => signal(rooms),
    });

    const edges = service.roomEdges();
    expect(edges.length).toBe(1);
    expect(edges[0].from).toBe('room1');
    expect(edges[0].to).toBe('room2');
    expect(edges[0].direction).toBe('north');
  });

  it('should not create edges to unvisited rooms', () => {
    const rooms = new Map<string, Room>();
    const exits1 = new Map<Direction, string>();
    exits1.set('north', 'room2');

    rooms.set('room1', {
      id: 'room1',
      name: 'Room 1',
      description: 'A test room',
      exits: exits1,
      objectIds: [],
      visited: true,
    });
    rooms.set('room2', {
      id: 'room2',
      name: 'Room 2',
      description: 'Another room',
      exits: new Map(),
      objectIds: [],
      visited: false,
    });

    Object.defineProperty(gameEngine, 'rooms', {
      get: () => signal(rooms),
    });

    const edges = service.roomEdges();
    expect(edges.length).toBe(0);
  });

  it('should compute bounding box for empty map', () => {
    const bbox = service.getBoundingBox();
    expect(bbox.minX).toBe(0);
    expect(bbox.maxX).toBe(0);
    expect(bbox.minY).toBe(0);
    expect(bbox.maxY).toBe(0);
  });

  it('should compute bounding box for rooms', () => {
    const rooms = new Map<string, Room>();
    rooms.set('room1', {
      id: 'room1',
      name: 'Room 1',
      description: 'A test room',
      exits: new Map(),
      objectIds: [],
      visited: true,
    });

    Object.defineProperty(gameEngine, 'rooms', {
      get: () => signal(rooms),
    });

    const bbox = service.getBoundingBox();
    expect(bbox.minX).toBeDefined();
    expect(bbox.maxX).toBeDefined();
    expect(bbox.minY).toBeDefined();
    expect(bbox.maxY).toBeDefined();
  });

  it('should position rooms in grid layout', () => {
    const rooms = new Map<string, Room>();
    const exits1 = new Map<Direction, string>();
    exits1.set('east', 'room2');

    rooms.set('room1', {
      id: 'room1',
      name: 'Room 1',
      description: 'A test room',
      exits: exits1,
      objectIds: [],
      visited: true,
    });
    rooms.set('room2', {
      id: 'room2',
      name: 'Room 2',
      description: 'Another room',
      exits: new Map(),
      objectIds: [],
      visited: true,
    });

    Object.defineProperty(gameEngine, 'rooms', {
      get: () => signal(rooms),
    });

    const nodes = service.roomNodes();
    expect(nodes.length).toBe(2);

    // Room 2 should be positioned to the east (positive x) of room 1
    const room1Node = nodes.find((n) => n.id === 'room1');
    const room2Node = nodes.find((n) => n.id === 'room2');

    expect(room1Node).toBeDefined();
    expect(room2Node).toBeDefined();
    expect(room2Node!.x).toBeGreaterThan(room1Node!.x);
  });

  it('should handle rooms with multiple exits', () => {
    const rooms = new Map<string, Room>();
    const exits1 = new Map<Direction, string>();
    exits1.set('north', 'room2');
    exits1.set('east', 'room3');

    rooms.set('room1', {
      id: 'room1',
      name: 'Room 1',
      description: 'A test room',
      exits: exits1,
      objectIds: [],
      visited: true,
    });
    rooms.set('room2', {
      id: 'room2',
      name: 'Room 2',
      description: 'North room',
      exits: new Map(),
      objectIds: [],
      visited: true,
    });
    rooms.set('room3', {
      id: 'room3',
      name: 'Room 3',
      description: 'East room',
      exits: new Map(),
      objectIds: [],
      visited: true,
    });

    Object.defineProperty(gameEngine, 'rooms', {
      get: () => signal(rooms),
    });

    const edges = service.roomEdges();
    expect(edges.length).toBe(2);

    const northEdge = edges.find((e) => e.direction === 'north');
    const eastEdge = edges.find((e) => e.direction === 'east');

    expect(northEdge).toBeDefined();
    expect(eastEdge).toBeDefined();
  });
});
