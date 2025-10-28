import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapService, RoomNode, RoomEdge } from '../../core/services/map.service';

/**
 * MapComponent visualizes the explored Zork world as a graph.
 *
 * Features:
 * - Displays explored rooms as nodes
 * - Shows connections between rooms as edges
 * - Highlights current player location
 * - Auto-centers and scales the view
 * - Accessible with keyboard navigation
 * - Responsive design for mobile and desktop
 * - Classic Zork terminal aesthetic
 *
 * Usage:
 * ```html
 * <app-map />
 * ```
 *
 * Accessibility:
 * - ARIA labels for all interactive elements
 * - Keyboard navigation support
 * - Screen reader announcements
 * - High contrast mode support
 */
@Component({
  selector: 'app-map',
  imports: [CommonModule],
  templateUrl: './map.html',
  styleUrl: './map.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent implements OnInit {
  private readonly mapService = inject(MapService);

  /** Reference to SVG canvas for dimensions */
  @ViewChild('mapSvg') mapSvg?: ElementRef<SVGSVGElement>;

  /** Room nodes for visualization */
  readonly nodes = this.mapService.roomNodes;

  /** Edges between rooms */
  readonly edges = this.mapService.roomEdges;

  /** SVG viewBox for auto-scaling and centering */
  readonly viewBox = signal<string>('0 0 800 600');

  /** Computed count of explored rooms */
  readonly exploredCount = computed(() => this.nodes().length);

  /** Computed count of connections */
  readonly connectionCount = computed(() => this.edges().length);

  ngOnInit(): void {
    // Update viewBox when nodes change to center the map
    this.updateViewBox();
  }

  /**
   * Update the SVG viewBox to center and fit all rooms
   */
  private updateViewBox(): void {
    const bbox = this.mapService.getBoundingBox();
    const padding = 100; // padding around the map

    const width = bbox.maxX - bbox.minX + 2 * padding;
    const height = bbox.maxY - bbox.minY + 2 * padding;
    const x = bbox.minX - padding;
    const y = bbox.minY - padding;

    // Set a minimum size for empty or small maps
    const minSize = 400;
    const finalWidth = Math.max(width, minSize);
    const finalHeight = Math.max(height, minSize);

    this.viewBox.set(`${x} ${y} ${finalWidth} ${finalHeight}`);
  }

  /**
   * Get the CSS class for a room node
   */
  getNodeClass(node: RoomNode): string {
    return node.isCurrent ? 'room-node room-node--current' : 'room-node';
  }

  /**
   * Get edge path for SVG line
   */
  getEdgePath(edge: RoomEdge): string {
    const fromNode = this.nodes().find((n) => n.id === edge.from);
    const toNode = this.nodes().find((n) => n.id === edge.to);

    if (!fromNode || !toNode) {
      return '';
    }

    return `M ${fromNode.x} ${fromNode.y} L ${toNode.x} ${toNode.y}`;
  }

  /**
   * Get CSS class for edge based on direction
   */
  getEdgeClass(edge: RoomEdge): string {
    const baseClass = 'edge';
    if (edge.direction === 'up') {
      return `${baseClass} edge--up`;
    } else if (edge.direction === 'down') {
      return `${baseClass} edge--down`;
    }
    return baseClass;
  }

  /**
   * Check if an edge is vertical (up/down)
   */
  isVerticalEdge(edge: RoomEdge): boolean {
    return edge.direction === 'up' || edge.direction === 'down';
  }

  /**
   * Get exit directions for a node
   */
  getNodeExits(node: RoomNode): string[] {
    const exits: string[] = [];
    node.exits.forEach((_, direction) => {
      exits.push(direction);
    });
    return exits;
  }

  /**
   * Check if node has vertical exits (up/down)
   */
  hasVerticalExits(node: RoomNode): boolean {
    const exits = this.getNodeExits(node);
    return exits.includes('up') || exits.includes('down');
  }

  /**
   * Get vertical exit indicator text
   */
  getVerticalIndicator(node: RoomNode): string {
    const exits = this.getNodeExits(node);
    const hasUp = exits.includes('up');
    const hasDown = exits.includes('down');

    if (hasUp && hasDown) {
      return '↕';
    } else if (hasUp) {
      return '↑';
    } else if (hasDown) {
      return '↓';
    }
    return '';
  }

  /**
   * Get midpoint position for edge label
   */
  getEdgeMidpoint(edge: RoomEdge): { x: number; y: number } {
    const fromNode = this.nodes().find((n) => n.id === edge.from);
    const toNode = this.nodes().find((n) => n.id === edge.to);

    if (!fromNode || !toNode) {
      return { x: 0, y: 0 };
    }

    return {
      x: (fromNode.x + toNode.x) / 2,
      y: (fromNode.y + toNode.y) / 2,
    };
  }

  /**
   * Get ARIA label for a room node
   */
  getNodeAriaLabel(node: RoomNode): string {
    if (node.isCurrent) {
      return `${node.name} (current location)`;
    }
    return `${node.name} (explored)`;
  }

  /**
   * Get ARIA label for the map
   */
  getMapAriaLabel(): string {
    const count = this.exploredCount();
    return `Map of explored Zork world, showing ${count} room${count === 1 ? '' : 's'}`;
  }

  /**
   * Track by function for ngFor optimization
   */
  trackByNodeId(index: number, node: RoomNode): string {
    return node.id;
  }

  /**
   * Track by function for edges
   */
  trackByEdge(index: number, edge: RoomEdge): string {
    return `${edge.from}-${edge.to}`;
  }
}
