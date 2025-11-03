import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapGraphBuilderService, GraphData } from '../../core/services/map-graph-builder.service';
import ForceGraph3D, { ForceGraph3DInstance } from '3d-force-graph';

/**
 * MapGraph3DComponent visualizes the explored Zork world as a 3D graph.
 *
 * Features:
 * - 3D graph visualization using 3d-force-graph and Three.js
 * - Displays explored rooms as nodes
 * - Shows connections between rooms as links
 * - Highlights current player location
 * - Progressive reveal (fog of war)
 * - Interactive camera controls (pan, zoom, rotate)
 * - Minimalist wireframe aesthetic
 * - Classic Zork terminal color scheme
 *
 * Usage:
 * ```html
 * <app-map-graph3d />
 * ```
 *
 * Accessibility:
 * - ARIA labels for all interactive elements
 * - Keyboard navigation support
 * - Screen reader announcements
 * - High contrast mode support
 */
@Component({
  selector: 'app-map-graph3d',
  imports: [CommonModule],
  templateUrl: './map-graph3d.html',
  styleUrl: './map-graph3d.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapGraph3DComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly mapGraphBuilder = inject(MapGraphBuilderService);

  /** Reference to canvas container */
  @ViewChild('graphContainer') graphContainer?: ElementRef<HTMLDivElement>;

  /** The 3d-force-graph instance */
  private graph: ForceGraph3DInstance | null = null;

  /** Graph data from the builder service */
  readonly graphData = this.mapGraphBuilder.graphData;

  /** Computed count of explored rooms */
  readonly exploredCount = this.mapGraphBuilder.roomCount;

  /** Computed count of connections */
  readonly connectionCount = this.mapGraphBuilder.linkCount;

  /** Track if graph is initialized */
  private readonly graphInitialized = signal(false);

  constructor() {
    // Set up effect to update graph when data changes
    effect(() => {
      const data = this.graphData();
      if (this.graphInitialized() && this.graph) {
        this.updateGraphData(data);
      }
    });
  }

  ngOnInit(): void {
    // Lifecycle hook for any initialization logic
  }

  ngAfterViewInit(): void {
    // Initialize the 3D graph after view is ready
    this.initializeGraph();
  }

  ngOnDestroy(): void {
    // Clean up the graph instance
    if (this.graph) {
      this.graph._destructor();
      this.graph = null;
    }
  }

  /**
   * Initialize the 3D force graph
   */
  private initializeGraph(): void {
    if (!this.graphContainer) {
      return;
    }

    const container = this.graphContainer.nativeElement;
    const data = this.graphData();

    // Create the force graph instance
    this.graph = new ForceGraph3D(container)
      .graphData(data)
      .backgroundColor('#0b0b0b')
      .showNavInfo(false)
      // Node styling
      .nodeLabel('name')
      .nodeVal(1)
      .nodeColor((node) => {
        const graphNode = node as { isCurrent?: boolean; visited?: boolean };
        if (graphNode.isCurrent) {
          return '#78C0FF'; // Bright blue for current room
        }
        return graphNode.visited ? '#7CFFD4' : '#222222'; // Cyan for visited, dark for unvisited
      })
      .nodeOpacity(1)
      .nodeResolution(16)
      .nodeRelSize(6)
      // Link styling
      .linkColor((link) => {
        const graphLink = link as {
          source: string | { id: string };
          target: string | { id: string };
        };
        const sourceId =
          typeof graphLink.source === 'string' ? graphLink.source : graphLink.source.id;
        const targetId =
          typeof graphLink.target === 'string' ? graphLink.target : graphLink.target.id;
        const sourceNode = data.nodes.find((n) => n.id === sourceId);
        const targetNode = data.nodes.find((n) => n.id === targetId);
        if (sourceNode?.visited && targetNode?.visited) {
          return '#7CFFD4'; // Cyan for visible links
        }
        return '#333333'; // Dark for hidden links
      })
      .linkWidth(2)
      .linkOpacity(0.6)
      .linkDirectionalParticles(0) // No particles for performance
      // Force simulation settings
      .d3AlphaDecay(0.02)
      .d3VelocityDecay(0.3)
      .cooldownTime(3000)
      .warmupTicks(100)
      // Camera settings
      .cameraPosition({ z: 300 });

    // Stop force simulation after initial layout
    setTimeout(() => {
      if (this.graph) {
        this.graph.pauseAnimation();
      }
    }, 3500);

    this.graphInitialized.set(true);
  }

  /**
   * Update the graph with new data
   */
  private updateGraphData(data: GraphData): void {
    if (!this.graph) {
      return;
    }

    // Update graph data - the library accepts any object with nodes and links arrays
    // Our GraphData interface is compatible with the library's expected format
    this.graph.graphData(data as { nodes: object[]; links: object[] });

    // Briefly restart animation for new nodes
    this.graph.resumeAnimation();
    setTimeout(() => {
      if (this.graph) {
        this.graph.pauseAnimation();
      }
    }, 1000);
  }

  /**
   * Get ARIA label for the map
   */
  getMapAriaLabel(): string {
    const count = this.exploredCount();
    return `3D map of explored Zork world, showing ${count} room${count === 1 ? '' : 's'}`;
  }
}
