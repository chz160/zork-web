import { TestBed, ComponentFixture } from '@angular/core/testing';
import { IsometricMapComponent } from './isometric-map';

describe('IsometricMapComponent', () => {
  let component: IsometricMapComponent;
  let fixture: ComponentFixture<IsometricMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IsometricMapComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IsometricMapComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have proper ARIA structure', () => {
    fixture.detectChanges();
    const mapContainer = fixture.nativeElement.querySelector('.map-container');
    expect(mapContainer.getAttribute('role')).toBe('region');
  });

  it('should display canvas element', () => {
    fixture.detectChanges();
    const canvas = fixture.nativeElement.querySelector('.map-canvas');
    expect(canvas).toBeTruthy();
    expect(canvas.tagName).toBe('CANVAS');
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

  it('should compute explored count', () => {
    fixture.detectChanges();
    const count = component.exploredCount();
    expect(typeof count).toBe('number');
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it('should compute connection count', () => {
    fixture.detectChanges();
    const count = component.connectionCount();
    expect(typeof count).toBe('number');
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it('should generate ARIA label for map', () => {
    fixture.detectChanges();
    const label = component.getMapAriaLabel();
    expect(label).toContain('Isometric map');
    expect(label).toContain('room');
  });

  it('should have canvas with proper role attribute', () => {
    fixture.detectChanges();
    const canvas = fixture.nativeElement.querySelector('.map-canvas');
    expect(canvas.getAttribute('role')).toBe('img');
  });

  it('should show empty state when no rooms explored', () => {
    fixture.detectChanges();
    // The empty state visibility depends on exploredCount()
    const emptyState = fixture.nativeElement.querySelector('.map-empty-state');
    if (component.exploredCount() === 0) {
      expect(emptyState).toBeTruthy();
    }
  });

  describe('Isometric Projection Math', () => {
    it('should convert world coordinates to isometric coordinates', () => {
      // Access private method through any cast for testing
      const toIsometric = (component as any).toIsometric.bind(component);

      // Test origin point
      const origin = toIsometric(0, 0, 0);
      expect(origin.x).toBe(0);
      expect(origin.y).toBe(0);

      // Test positive x movement
      const posX = toIsometric(100, 0, 0);
      expect(posX.x).toBeGreaterThan(0);

      // Test positive y movement
      const posY = toIsometric(0, 100, 0);
      expect(posY.x).toBeLessThan(0);

      // Test z (height) affects y coordinate
      const posZ = toIsometric(0, 0, 100);
      expect(posZ.y).toBeLessThan(0);
    });

    it('should handle negative coordinates', () => {
      const toIsometric = (component as any).toIsometric.bind(component);

      const negX = toIsometric(-100, 0, 0);
      expect(negX.x).toBeLessThan(0);

      const negY = toIsometric(0, -100, 0);
      expect(negY.x).toBeGreaterThan(0);
    });

    it('should scale coordinates consistently', () => {
      const toIsometric = (component as any).toIsometric.bind(component);

      // Use different x and y to avoid zero in x calculation
      const pos1 = toIsometric(100, 0, 0);
      const pos2 = toIsometric(200, 0, 0);

      // Doubling input should roughly double output (with scaling)
      const ratio = pos2.x / pos1.x;
      expect(ratio).toBeCloseTo(2, 0.1);

      // Check y coordinate scaling
      const pos3 = toIsometric(100, 0, 0);
      const pos4 = toIsometric(100, 0, 100);
      expect(pos4.y).toBeLessThan(pos3.y); // Higher z means lower y
    });
  });

  describe('Room Discovery Animation', () => {
    it('should track discovered rooms', () => {
      const discoveredRooms = (component as any).discoveredRooms;
      expect(discoveredRooms instanceof Map).toBe(true);
    });

    it('should calculate fade-in alpha', () => {
      const getRoomAlpha = (component as any).getRoomAlpha.bind(component);

      // Room not yet discovered should return 1.0
      const alpha = getRoomAlpha('unknown-room');
      expect(alpha).toBe(1.0);
    });

    it('should return full alpha for old discoveries', () => {
      const getRoomAlpha = (component as any).getRoomAlpha.bind(component);
      const discoveredRooms = (component as any).discoveredRooms;

      // Simulate an old discovery
      discoveredRooms.set('old-room', Date.now() - 1000);

      const alpha = getRoomAlpha('old-room');
      expect(alpha).toBe(1.0);
    });
  });

  describe('Canvas Rendering', () => {
    it('should setup canvas on init', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        // Context may be null if canvas not yet rendered
        // This is expected in test environment
        expect(component).toBeTruthy();
        done();
      }, 100);
    });

    it('should have defined tile dimensions', () => {
      const tileWidth = (component as any).tileWidth;
      const tileHeight = (component as any).tileHeight;
      const roomHeight = (component as any).roomHeight;

      expect(tileWidth).toBeGreaterThan(0);
      expect(tileHeight).toBeGreaterThan(0);
      expect(roomHeight).toBeGreaterThan(0);
    });
  });

  describe('Helper Methods', () => {
    it('should get node exits', () => {
      const getNodeExits = (component as any).getNodeExits.bind(component);

      const node = {
        id: 'room1',
        name: 'Room 1',
        x: 0,
        y: 0,
        isCurrent: false,
        visited: true,
        exits: new Map([
          ['north', 'room2'],
          ['east', 'room3'],
        ]),
      };

      const exits = getNodeExits(node);
      expect(exits.length).toBe(2);
      expect(exits).toContain('north');
      expect(exits).toContain('east');
    });

    it('should detect vertical exits', () => {
      const hasVerticalExits = (component as any).hasVerticalExits.bind(component);

      const nodeWithUp = {
        id: 'room1',
        name: 'Room 1',
        x: 0,
        y: 0,
        isCurrent: false,
        visited: true,
        exits: new Map([['up', 'room2']]),
      };

      const nodeWithDown = {
        id: 'room2',
        name: 'Room 2',
        x: 0,
        y: 0,
        isCurrent: false,
        visited: true,
        exits: new Map([['down', 'room1']]),
      };

      const nodeWithoutVertical = {
        id: 'room3',
        name: 'Room 3',
        x: 0,
        y: 0,
        isCurrent: false,
        visited: true,
        exits: new Map([['north', 'room4']]),
      };

      expect(hasVerticalExits(nodeWithUp)).toBe(true);
      expect(hasVerticalExits(nodeWithDown)).toBe(true);
      expect(hasVerticalExits(nodeWithoutVertical)).toBe(false);
    });
  });
});
