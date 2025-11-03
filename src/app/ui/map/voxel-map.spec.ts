import { TestBed, ComponentFixture } from '@angular/core/testing';
import { VoxelMapComponent } from './voxel-map';

describe('VoxelMapComponent', () => {
  let component: VoxelMapComponent;
  let fixture: ComponentFixture<VoxelMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoxelMapComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VoxelMapComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with correct room and connection counts', () => {
    fixture.detectChanges();
    expect(component.exploredCount()).toBeDefined();
    expect(component.connectionCount()).toBeDefined();
  });

  it('should generate correct ARIA label for map', () => {
    fixture.detectChanges();
    const label = component.getMapAriaLabel();
    expect(label).toContain('3D voxel map');
    expect(label).toContain('room');
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
    expect(legendItems.length).toBeGreaterThanOrEqual(3);
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

  it('should have canvas container element', () => {
    fixture.detectChanges();
    const canvasContainer = fixture.nativeElement.querySelector('.canvas-container');
    expect(canvasContainer).toBeTruthy();
  });

  it('should cleanup on destroy', () => {
    fixture.detectChanges();
    // Trigger ngAfterViewInit by calling detectChanges
    fixture.detectChanges();

    // Spy on cleanup methods
    spyOn<any>(component, 'cleanup').and.callThrough();

    // Destroy component
    fixture.destroy();

    expect(component['cleanup']).toHaveBeenCalled();
  });
});
