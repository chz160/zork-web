import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { MapGraphBuilderService } from './map-graph-builder.service';
import { GameEngineService } from './game-engine.service';
import { Room } from '../models';

describe('MapGraphBuilderService', () => {
  let service: MapGraphBuilderService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockGameEngine: any;

  beforeEach(() => {
    // Create mock game engine with signal properties
    mockGameEngine = {
      rooms: signal(new Map<string, Room>()),
      player: signal({ currentRoomId: 'room1' }),
    };

    TestBed.configureTestingModule({
      providers: [MapGraphBuilderService, { provide: GameEngineService, useValue: mockGameEngine }],
    });

    service = TestBed.inject(MapGraphBuilderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return empty graph data when no rooms are visited', () => {
    const rooms = new Map<string, Room>();
    rooms.set('room1', {
      id: 'room1',
      name: 'Room 1',
      description: 'Test room',
      exits: new Map(),
      objectIds: [],
      visited: false,
    });

    mockGameEngine.rooms.set(rooms);
    mockGameEngine.player.set({ currentRoomId: 'room1' });

    const graphData = service.graphData();

    expect(graphData.nodes.length).toBe(0);
    expect(graphData.links.length).toBe(0);
  });

  it('should include only visited rooms in graph data', () => {
    const rooms = new Map<string, Room>();
    rooms.set('room1', {
      id: 'room1',
      name: 'Room 1',
      description: 'Test room 1',
      exits: new Map([['north', 'room2']]),
      objectIds: [],
      visited: true,
    });
    rooms.set('room2', {
      id: 'room2',
      name: 'Room 2',
      description: 'Test room 2',
      exits: new Map([['south', 'room1']]),
      objectIds: [],
      visited: false,
    });

    mockGameEngine.rooms.set(rooms);
    mockGameEngine.player.set({ currentRoomId: 'room1' });

    const graphData = service.graphData();

    expect(graphData.nodes.length).toBe(1);
    expect(graphData.nodes[0].id).toBe('room1');
    expect(graphData.links.length).toBe(0); // No link because room2 is not visited
  });

  it('should mark current room correctly', () => {
    const rooms = new Map<string, Room>();
    rooms.set('room1', {
      id: 'room1',
      name: 'Room 1',
      description: 'Test room 1',
      exits: new Map(),
      objectIds: [],
      visited: true,
    });
    rooms.set('room2', {
      id: 'room2',
      name: 'Room 2',
      description: 'Test room 2',
      exits: new Map(),
      objectIds: [],
      visited: true,
    });

    mockGameEngine.rooms.set(rooms);
    mockGameEngine.player.set({ currentRoomId: 'room2' });

    const graphData = service.graphData();

    expect(graphData.nodes.length).toBe(2);

    const room1Node = graphData.nodes.find((n) => n.id === 'room1');
    const room2Node = graphData.nodes.find((n) => n.id === 'room2');

    expect(room1Node?.isCurrent).toBe(false);
    expect(room2Node?.isCurrent).toBe(true);
  });

  it('should create links only between visited rooms', () => {
    const rooms = new Map<string, Room>();
    rooms.set('room1', {
      id: 'room1',
      name: 'Room 1',
      description: 'Test room 1',
      exits: new Map([
        ['north', 'room2'],
        ['east', 'room3'],
      ]),
      objectIds: [],
      visited: true,
    });
    rooms.set('room2', {
      id: 'room2',
      name: 'Room 2',
      description: 'Test room 2',
      exits: new Map([['south', 'room1']]),
      objectIds: [],
      visited: true,
    });
    rooms.set('room3', {
      id: 'room3',
      name: 'Room 3',
      description: 'Test room 3',
      exits: new Map([['west', 'room1']]),
      objectIds: [],
      visited: false, // Not visited
    });

    mockGameEngine.rooms.set(rooms);
    mockGameEngine.player.set({ currentRoomId: 'room1' });

    const graphData = service.graphData();

    expect(graphData.nodes.length).toBe(2); // Only room1 and room2
    expect(graphData.links.length).toBe(1); // Only link between room1 and room2

    const link = graphData.links[0];
    expect([link.source, link.target].sort()).toEqual(['room1', 'room2']);
  });

  it('should avoid duplicate links', () => {
    const rooms = new Map<string, Room>();
    rooms.set('room1', {
      id: 'room1',
      name: 'Room 1',
      description: 'Test room 1',
      exits: new Map([['north', 'room2']]),
      objectIds: [],
      visited: true,
    });
    rooms.set('room2', {
      id: 'room2',
      name: 'Room 2',
      description: 'Test room 2',
      exits: new Map([['south', 'room1']]),
      objectIds: [],
      visited: true,
    });

    mockGameEngine.rooms.set(rooms);
    mockGameEngine.player.set({ currentRoomId: 'room1' });

    const graphData = service.graphData();

    expect(graphData.links.length).toBe(1); // Only one link, not two
  });

  it('should compute room and link counts correctly', () => {
    const rooms = new Map<string, Room>();
    rooms.set('room1', {
      id: 'room1',
      name: 'Room 1',
      description: 'Test room 1',
      exits: new Map([['north', 'room2']]),
      objectIds: [],
      visited: true,
    });
    rooms.set('room2', {
      id: 'room2',
      name: 'Room 2',
      description: 'Test room 2',
      exits: new Map([['south', 'room1']]),
      objectIds: [],
      visited: true,
    });

    mockGameEngine.rooms.set(rooms);
    mockGameEngine.player.set({ currentRoomId: 'room1' });

    expect(service.roomCount()).toBe(2);
    expect(service.linkCount()).toBe(1);
  });
});
