import { TestBed, ComponentFixture } from '@angular/core/testing';
import { MapComponent } from './map';

describe('MapComponent', () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MapComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with viewBox', () => {
    fixture.detectChanges();
    expect(component.viewBox()).toBeDefined();
  });

  it('should compute correct node class for current room', () => {
    const currentNode = { id: 'room1', name: 'Room 1', x: 0, y: 0, isCurrent: true, visited: true };
    const nodeClass = component.getNodeClass(currentNode);
    expect(nodeClass).toBe('room-node room-node--current');
  });

  it('should compute correct node class for non-current room', () => {
    const node = { id: 'room1', name: 'Room 1', x: 0, y: 0, isCurrent: false, visited: true };
    const nodeClass = component.getNodeClass(node);
    expect(nodeClass).toBe('room-node');
  });

  it('should generate ARIA label for current location', () => {
    const node = { id: 'room1', name: 'Test Room', x: 0, y: 0, isCurrent: true, visited: true };
    const label = component.getNodeAriaLabel(node);
    expect(label).toBe('Test Room (current location)');
  });

  it('should generate ARIA label for explored room', () => {
    const node = { id: 'room1', name: 'Test Room', x: 0, y: 0, isCurrent: false, visited: true };
    const label = component.getNodeAriaLabel(node);
    expect(label).toBe('Test Room (explored)');
  });

  it('should track nodes by ID', () => {
    const node = { id: 'room1', name: 'Room 1', x: 0, y: 0, isCurrent: false, visited: true };
    const trackId = component.trackByNodeId(0, node);
    expect(trackId).toBe('room1');
  });

  it('should track edges by from-to IDs', () => {
    const edge = { from: 'room1', to: 'room2', direction: 'north' };
    const trackId = component.trackByEdge(0, edge);
    expect(trackId).toBe('room1-room2');
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
    expect(legendItems.length).toBe(3);
  });

  it('should display map header with title', () => {
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('.map-title');
    expect(title).toBeTruthy();
    expect(title.textContent).toContain('Explored World Map');
  });

  it('should display map stats', () => {
    fixture.detectChanges();
    const stats = fixture.nativeElement.querySelectorAll('.map-stat');
    expect(stats.length).toBeGreaterThanOrEqual(2);
  });
});
