import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { MapGraph3DComponent } from './map-graph3d';
import { MapGraphBuilderService } from '../../core/services/map-graph-builder.service';

describe('MapGraph3DComponent', () => {
  let component: MapGraph3DComponent;
  let fixture: ComponentFixture<MapGraph3DComponent>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockMapGraphBuilder: any;

  beforeEach(async () => {
    // Create mock service with signals
    mockMapGraphBuilder = {
      graphData: signal({ nodes: [], links: [] }),
      roomCount: signal(0),
      linkCount: signal(0),
    };

    await TestBed.configureTestingModule({
      imports: [MapGraph3DComponent],
      providers: [{ provide: MapGraphBuilderService, useValue: mockMapGraphBuilder }],
    }).compileComponents();

    fixture = TestBed.createComponent(MapGraph3DComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display empty state when no rooms explored', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const emptyState = compiled.querySelector('.map-empty-state');

    expect(emptyState).toBeTruthy();
    expect(emptyState?.textContent).toContain('No rooms explored yet');
  });

  it('should display room and connection counts', () => {
    // Update mock signals
    mockMapGraphBuilder.graphData.set({
      nodes: [
        { id: 'room1', name: 'Room 1', visited: true, isCurrent: true },
        { id: 'room2', name: 'Room 2', visited: true, isCurrent: false },
      ],
      links: [{ source: 'room1', target: 'room2', direction: 'north' }],
    });
    mockMapGraphBuilder.roomCount.set(2);
    mockMapGraphBuilder.linkCount.set(1);

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const stats = compiled.querySelectorAll('.map-stat-value');

    expect(stats.length).toBe(2);
    expect(stats[0].textContent).toContain('2'); // Room count
    expect(stats[1].textContent).toContain('1'); // Connection count
  });

  it('should not display empty state when rooms are explored', () => {
    // Update mock signals
    mockMapGraphBuilder.graphData.set({
      nodes: [{ id: 'room1', name: 'Room 1', visited: true, isCurrent: true }],
      links: [],
    });
    mockMapGraphBuilder.roomCount.set(1);
    mockMapGraphBuilder.linkCount.set(0);

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const emptyState = compiled.querySelector('.map-empty-state');

    expect(emptyState).toBeFalsy();
  });

  it('should have graph container element', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const graphContainer = compiled.querySelector('.graph-container');

    expect(graphContainer).toBeTruthy();
  });

  it('should display legend', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const legend = compiled.querySelector('.map-legend');
    const legendItems = compiled.querySelectorAll('.legend-item');

    expect(legend).toBeTruthy();
    expect(legendItems.length).toBeGreaterThanOrEqual(3);
  });

  it('should display instructions', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const instructions = compiled.querySelector('.map-instructions');

    expect(instructions).toBeTruthy();
    expect(instructions?.textContent).toContain('Controls');
  });

  it('should have correct ARIA labels', () => {
    mockMapGraphBuilder.graphData.set({
      nodes: [{ id: 'room1', name: 'Room 1', visited: true, isCurrent: true }],
      links: [],
    });
    mockMapGraphBuilder.roomCount.set(1);
    mockMapGraphBuilder.linkCount.set(0);

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const container = compiled.querySelector('.map-container');
    const graphContainer = compiled.querySelector('.graph-container');

    expect(container?.getAttribute('aria-label')).toContain('3D map');
    expect(graphContainer?.getAttribute('aria-label')).toContain('3D map');
  });
});
