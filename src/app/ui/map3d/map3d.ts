import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  inject,
  computed,
  signal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MapService, RoomNode, RoomEdge } from '../../core/services/map.service';

/**
 * Map3DComponent visualizes the explored Zork world in 3D wireframe.
 *
 * Features:
 * - Displays explored rooms as 3D wireframe boxes
 * - Shows connections between rooms as line segments
 * - Highlights current player location
 * - Provides orbit and zoom controls
 * - Maintains retro, blueprint-like aesthetic
 * - Fog-of-war: only visited rooms are visible
 * - Accessible with keyboard navigation
 * - Responsive design for mobile and desktop
 *
 * Usage:
 * ```html
 * <app-map3d />
 * ```
 *
 * Accessibility:
 * - ARIA labels for all elements
 * - Keyboard navigation support
 * - Screen reader announcements
 */
@Component({
  selector: 'app-map3d',
  imports: [CommonModule],
  templateUrl: './map3d.html',
  styleUrl: './map3d.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Map3DComponent implements OnInit, OnDestroy {
  private readonly mapService = inject(MapService);

  /** Reference to canvas container for Three.js */
  @ViewChild('mapCanvas', { static: true }) mapCanvas!: ElementRef<HTMLDivElement>;

  /** Three.js scene, camera, renderer */
  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private renderer?: THREE.WebGLRenderer;
  private controls?: OrbitControls;

  /** Animation frame ID for cleanup */
  private animationFrameId?: number;

  /** Map of room ID to room mesh */
  private roomMeshes = new Map<string, THREE.Group>();

  /** Map of edge key to edge mesh */
  private edgeMeshes = new Map<string, THREE.Line>();

  /** Room nodes for visualization */
  readonly nodes = this.mapService.roomNodes;

  /** Edges between rooms */
  readonly edges = this.mapService.roomEdges;

  /** Computed count of explored rooms */
  readonly exploredCount = computed(() => this.nodes().length);

  /** Computed count of connections */
  readonly connectionCount = computed(() => this.edges().length);

  /** Track if component is initialized */
  private initialized = signal(false);

  constructor() {
    // Auto-update scene when nodes or edges change
    effect(() => {
      if (this.initialized()) {
        const nodes = this.nodes();
        const edges = this.edges();
        this.updateScene(nodes, edges);
      }
    });
  }

  ngOnInit(): void {
    this.initThreeJS();
    this.initialized.set(true);
    this.animate();
  }

  ngOnDestroy(): void {
    // Clean up Three.js resources
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.controls) {
      this.controls.dispose();
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
    // Clean up geometries and materials
    this.roomMeshes.forEach((group) => {
      group.traverse((obj: THREE.Object3D) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((mat: THREE.Material) => mat.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    });
    this.edgeMeshes.forEach((line) => {
      line.geometry.dispose();
      if (Array.isArray(line.material)) {
        line.material.forEach((mat: THREE.Material) => mat.dispose());
      } else {
        line.material.dispose();
      }
    });
  }

  /**
   * Initialize Three.js scene, camera, renderer, and controls
   */
  private initThreeJS(): void {
    const container = this.mapCanvas.nativeElement;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b0b0b); // Dark background

    // Camera setup - isometric-like view
    this.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 2000);
    this.camera.position.set(40, 40, 40);
    this.camera.lookAt(0, 0, 0);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    // OrbitControls setup
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 200;

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  /**
   * Handle window resize
   */
  private onWindowResize(): void {
    if (!this.camera || !this.renderer || !this.mapCanvas) {
      return;
    }

    const container = this.mapCanvas.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Animation loop
   */
  private animate(): void {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    if (this.controls) {
      this.controls.update();
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Update the 3D scene with current nodes and edges
   */
  private updateScene(nodes: RoomNode[], edges: RoomEdge[]): void {
    if (!this.scene) {
      return;
    }

    // Track which room IDs are currently present
    const currentRoomIds = new Set(nodes.map((n) => n.id));

    // Remove rooms that are no longer in the list
    this.roomMeshes.forEach((group, roomId) => {
      if (!currentRoomIds.has(roomId)) {
        this.scene!.remove(group);
        this.roomMeshes.delete(roomId);
      }
    });

    // Add or update rooms
    nodes.forEach((node) => {
      if (!this.roomMeshes.has(node.id)) {
        const roomGroup = this.createRoomMesh(node);
        this.roomMeshes.set(node.id, roomGroup);
        this.scene!.add(roomGroup);
      } else {
        // Update existing room (e.g., current location highlight)
        this.updateRoomMesh(node);
      }
    });

    // Track which edge keys are currently present
    const currentEdgeKeys = new Set(edges.map((e) => `${e.from}-${e.to}`));

    // Remove edges that are no longer in the list
    this.edgeMeshes.forEach((line, edgeKey) => {
      if (!currentEdgeKeys.has(edgeKey)) {
        this.scene!.remove(line);
        this.edgeMeshes.delete(edgeKey);
      }
    });

    // Add or update edges
    edges.forEach((edge) => {
      const edgeKey = `${edge.from}-${edge.to}`;
      if (!this.edgeMeshes.has(edgeKey)) {
        const line = this.createEdgeMesh(edge, nodes);
        if (line) {
          this.edgeMeshes.set(edgeKey, line);
          this.scene!.add(line);
        }
      }
    });

    // Center camera on current room if exists
    this.centerCameraOnCurrentRoom(nodes);
  }

  /**
   * Create a 3D wireframe mesh for a room
   */
  private createRoomMesh(node: RoomNode): THREE.Group {
    const group = new THREE.Group();

    // Room size constants
    const roomSize = 10;
    const roomHeight = 8;

    // Create wireframe box for the room
    const boxGeometry = new THREE.BoxGeometry(roomSize, roomHeight, roomSize);
    const edges = new THREE.EdgesGeometry(boxGeometry);

    // Color based on whether it's the current room
    const color = node.isCurrent ? 0x00ff00 : 0x00aaff; // Green for current, cyan for visited
    const material = new THREE.LineBasicMaterial({ color });

    const wireframe = new THREE.LineSegments(edges, material);
    group.add(wireframe);

    // Add a small marker for current location
    if (node.isCurrent) {
      const markerGeometry = new THREE.SphereGeometry(1.5, 8, 8);
      const markerEdges = new THREE.EdgesGeometry(markerGeometry);
      const markerMaterial = new THREE.LineBasicMaterial({ color: 0x44ff44 });
      const marker = new THREE.LineSegments(markerEdges, markerMaterial);
      marker.position.set(0, roomHeight / 2 + 2, 0);
      group.add(marker);
    }

    // Position the room group
    group.position.set(node.x / 10, 0, node.y / 10); // Scale down positions
    group.userData = { id: node.id, isCurrent: node.isCurrent };

    return group;
  }

  /**
   * Update an existing room mesh
   */
  private updateRoomMesh(node: RoomNode): void {
    const group = this.roomMeshes.get(node.id);
    if (!group) {
      return;
    }

    // Update color based on current status
    const wireframe = group.children[0] as THREE.LineSegments;
    if (wireframe) {
      const material = wireframe.material as THREE.LineBasicMaterial;
      material.color.setHex(node.isCurrent ? 0x00ff00 : 0x00aaff);
    }

    // Update or add current location marker
    const existingMarker = group.children[1];
    if (node.isCurrent && !existingMarker) {
      const markerGeometry = new THREE.SphereGeometry(1.5, 8, 8);
      const markerEdges = new THREE.EdgesGeometry(markerGeometry);
      const markerMaterial = new THREE.LineBasicMaterial({ color: 0x44ff44 });
      const marker = new THREE.LineSegments(markerEdges, markerMaterial);
      marker.position.set(0, 4, 0);
      group.add(marker);
    } else if (!node.isCurrent && existingMarker) {
      group.remove(existingMarker);
    }

    group.userData = { id: node.id, isCurrent: node.isCurrent };
  }

  /**
   * Create a line mesh for a corridor between rooms
   */
  private createEdgeMesh(edge: RoomEdge, nodes: RoomNode[]): THREE.Line | null {
    const fromNode = nodes.find((n) => n.id === edge.from);
    const toNode = nodes.find((n) => n.id === edge.to);

    if (!fromNode || !toNode) {
      return null;
    }

    const points = [];
    points.push(new THREE.Vector3(fromNode.x / 10, 0, fromNode.y / 10));
    points.push(new THREE.Vector3(toNode.x / 10, 0, toNode.y / 10));

    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    // Color based on direction
    let color = 0x00ff00; // Default green
    if (edge.direction === 'up') {
      color = 0xffff00; // Yellow for up
    } else if (edge.direction === 'down') {
      color = 0x00ffff; // Cyan for down
    }

    const material = new THREE.LineBasicMaterial({
      color,
      opacity: 0.6,
      transparent: true,
    });

    const line = new THREE.Line(geometry, material);
    return line;
  }

  /**
   * Center camera on the current room
   */
  private centerCameraOnCurrentRoom(nodes: RoomNode[]): void {
    const currentNode = nodes.find((n) => n.isCurrent);
    if (!currentNode || !this.controls) {
      return;
    }

    // Update controls target to current room position
    const targetX = currentNode.x / 10;
    const targetZ = currentNode.y / 10;

    // Smoothly transition to new target
    this.controls.target.set(targetX, 0, targetZ);
  }

  /**
   * Get ARIA label for the map
   */
  getMapAriaLabel(): string {
    const count = this.exploredCount();
    return `3D map of explored Zork world, showing ${count} room${count === 1 ? '' : 's'}`;
  }
}
