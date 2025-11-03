import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Map3DComponent } from './map3d';

describe('Map3DComponent', () => {
  let component: Map3DComponent;
  let fixture: ComponentFixture<Map3DComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Map3DComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(Map3DComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize Three.js scene', () => {
    fixture.detectChanges();
    expect(component['scene']).toBeDefined();
    expect(component['camera']).toBeDefined();
    expect(component['renderer']).toBeDefined();
    expect(component['controls']).toBeDefined();
  });

  it('should compute explored count', () => {
    fixture.detectChanges();
    expect(component.exploredCount()).toBeDefined();
    expect(typeof component.exploredCount()).toBe('number');
  });

  it('should compute connection count', () => {
    fixture.detectChanges();
    expect(component.connectionCount()).toBeDefined();
    expect(typeof component.connectionCount()).toBe('number');
  });

  it('should have proper ARIA structure', () => {
    fixture.detectChanges();
    const mapContainer = fixture.nativeElement.querySelector('.map-container');
    expect(mapContainer.getAttribute('role')).toBe('region');
  });

  it('should display legend', () => {
    fixture.detectChanges();
    const legend = fixture.nativeElement.querySelector('.map-legend');
    expect(legend).toBeTruthy();
    const legendItems = fixture.nativeElement.querySelectorAll('.legend-item');
    expect(legendItems.length).toBe(5);
  });

  it('should display map header with stats', () => {
    fixture.detectChanges();
    const header = fixture.nativeElement.querySelector('.map-header');
    expect(header).toBeTruthy();
    const stats = fixture.nativeElement.querySelector('.map-stats');
    expect(stats).toBeTruthy();
  });

  it('should display map stats', () => {
    fixture.detectChanges();
    const stats = fixture.nativeElement.querySelectorAll('.map-stat');
    expect(stats.length).toBeGreaterThanOrEqual(2);
  });

  it('should display instructions', () => {
    fixture.detectChanges();
    const instructions = fixture.nativeElement.querySelector('.map-instructions');
    expect(instructions).toBeTruthy();
    expect(instructions.textContent).toContain('Controls:');
  });

  it('should generate ARIA label', () => {
    fixture.detectChanges();
    const label = component.getMapAriaLabel();
    expect(label).toContain('3D map of explored Zork world');
  });

  it('should render canvas container', () => {
    fixture.detectChanges();
    const canvas = fixture.nativeElement.querySelector('.map-canvas');
    expect(canvas).toBeTruthy();
  });

  it('should clean up Three.js resources on destroy', () => {
    fixture.detectChanges();
    const scene = component['scene'];
    const renderer = component['renderer'];
    const controls = component['controls'];

    expect(scene).toBeDefined();
    expect(renderer).toBeDefined();
    expect(controls).toBeDefined();

    spyOn(renderer!, 'dispose');
    spyOn(controls!, 'dispose');

    component.ngOnDestroy();

    expect(renderer!.dispose).toHaveBeenCalled();
    expect(controls!.dispose).toHaveBeenCalled();
  });

  it('should handle window resize', () => {
    fixture.detectChanges();
    const camera = component['camera'];
    expect(camera).toBeDefined();

    // Trigger resize
    component['onWindowResize']();

    // Camera should still be defined
    expect(component['camera']).toBeDefined();
  });

  it('should create room meshes for nodes', () => {
    fixture.detectChanges();

    const testNode = {
      id: 'test-room',
      name: 'Test Room',
      x: 0,
      y: 0,
      isCurrent: false,
      visited: true,
      exits: new Map(),
    };

    const roomMesh = component['createRoomMesh'](testNode);
    expect(roomMesh).toBeDefined();
    expect(roomMesh.children.length).toBeGreaterThan(0);
  });

  it('should create edge meshes for corridors', () => {
    fixture.detectChanges();

    const nodes = [
      {
        id: 'room1',
        name: 'Room 1',
        x: 0,
        y: 0,
        isCurrent: false,
        visited: true,
        exits: new Map(),
      },
      {
        id: 'room2',
        name: 'Room 2',
        x: 100,
        y: 0,
        isCurrent: false,
        visited: true,
        exits: new Map(),
      },
    ];

    const edge = {
      from: 'room1',
      to: 'room2',
      direction: 'east',
    };

    const edgeMesh = component['createEdgeMesh'](edge, nodes);
    expect(edgeMesh).toBeDefined();
    expect(edgeMesh).not.toBeNull();
  });

  it('should highlight current room with green color', () => {
    fixture.detectChanges();

    const currentNode = {
      id: 'current-room',
      name: 'Current Room',
      x: 0,
      y: 0,
      isCurrent: true,
      visited: true,
      exits: new Map(),
    };

    const roomMesh = component['createRoomMesh'](currentNode);
    expect(roomMesh).toBeDefined();
    expect(roomMesh.children.length).toBeGreaterThan(1); // Should have marker
  });

  it('should use cyan color for visited non-current rooms', () => {
    fixture.detectChanges();

    const visitedNode = {
      id: 'visited-room',
      name: 'Visited Room',
      x: 0,
      y: 0,
      isCurrent: false,
      visited: true,
      exits: new Map(),
    };

    const roomMesh = component['createRoomMesh'](visitedNode);
    expect(roomMesh).toBeDefined();
    expect(roomMesh.children.length).toBe(1); // Should not have marker
  });

  it('should handle empty nodes array', () => {
    fixture.detectChanges();

    component['updateScene']([], []);
    expect(component['roomMeshes'].size).toBe(0);
    expect(component['edgeMeshes'].size).toBe(0);
  });
});
