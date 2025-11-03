import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapService, RoomNode, RoomEdge } from '../../core/services/map.service';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * VoxelMapComponent visualizes the explored Zork world as a 3D voxel map.
 *
 * Features:
 * - Block-based 3D representation (Minecraft-like)
 * - Each room rendered as a cube (voxel)
 * - Corridors as connecting rectangular blocks
 * - Fog-of-war: only visited rooms visible
 * - Current room highlighted
 * - Orbit/pan/zoom camera controls
 * - Minimalist retro aesthetic (flat colors, no textures)
 *
 * Usage:
 * ```html
 * <app-map />
 * ```
 *
 * Accessibility:
 * - ARIA labels for map statistics
 * - Keyboard-accessible via OrbitControls
 * - Screen reader announcements for room count
 */
@Component({
  selector: 'app-map',
  imports: [CommonModule],
  templateUrl: './voxel-map.html',
  styleUrl: './voxel-map.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoxelMapComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly mapService = inject(MapService);

  /** Reference to canvas container for Three.js */
  @ViewChild('canvasContainer', { static: true })
  canvasContainer!: ElementRef<HTMLDivElement>;

  /** Room nodes for visualization */
  readonly nodes = this.mapService.roomNodes;

  /** Edges between rooms */
  readonly edges = this.mapService.roomEdges;

  /** Computed count of explored rooms */
  readonly exploredCount = computed(() => this.nodes().length);

  /** Computed count of connections */
  readonly connectionCount = computed(() => this.edges().length);

  // Three.js objects
  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private renderer?: THREE.WebGLRenderer;
  private controls?: OrbitControls;
  private animationFrameId?: number;

  // Mesh tracking for cleanup
  private roomMeshes = new Map<string, THREE.Mesh>();
  private corridorMeshes: THREE.Mesh[] = [];

  // Voxel configuration
  private readonly ROOM_SIZE = 4;
  private readonly CORRIDOR_WIDTH = 1.5;
  private readonly GRID_SCALE = 10; // scale factor from map coordinates

  // Color palette
  private readonly ROOM_COLOR = 0x78c0ff; // light blue
  private readonly CORRIDOR_COLOR = 0x7cffd4; // cyan
  private readonly CURRENT_ROOM_COLOR = 0xffff00; // yellow
  private readonly EDGE_COLOR = 0x00ff00; // green for wireframe

  ngOnInit(): void {
    // Component initialized
  }

  ngAfterViewInit(): void {
    this.initThreeJS();
    this.buildScene();
    this.animate();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  /**
   * Initialize Three.js scene, camera, renderer, and controls
   */
  private initThreeJS(): void {
    if (!this.canvasContainer) {
      return;
    }

    const container = this.canvasContainer.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000); // black background

    // Camera - positioned diagonally above
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.set(30, 40, 30);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    // OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = true;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 200;
    this.controls.maxPolarAngle = Math.PI / 2; // prevent camera going below ground

    // Ambient light for minimal contrast (optional)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Handle window resize
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
  }

  /**
   * Build the voxel scene from room nodes and edges
   */
  private buildScene(): void {
    if (!this.scene) {
      return;
    }

    // Clear existing meshes
    this.clearScene();

    const nodes = this.nodes();
    const edges = this.edges();

    // Create room voxels
    nodes.forEach((node) => {
      this.createRoomVoxel(node);
    });

    // Create corridor voxels
    edges.forEach((edge) => {
      this.createCorridorVoxel(edge, nodes);
    });

    // Center camera on the map
    this.centerCamera(nodes);
  }

  /**
   * Create a voxel cube for a room
   */
  private createRoomVoxel(node: RoomNode): void {
    if (!this.scene) {
      return;
    }

    const geometry = new THREE.BoxGeometry(this.ROOM_SIZE, this.ROOM_SIZE, this.ROOM_SIZE);

    // Material - different color for current room
    const color = node.isCurrent ? this.CURRENT_ROOM_COLOR : this.ROOM_COLOR;
    const material = new THREE.MeshBasicMaterial({ color });

    const mesh = new THREE.Mesh(geometry, material);

    // Position based on node coordinates
    const x = node.x / this.GRID_SCALE;
    const z = node.y / this.GRID_SCALE; // map y to z in 3D
    const y = this.ROOM_SIZE / 2; // lift cube so bottom is at ground

    mesh.position.set(x, y, z);

    // Add wireframe edges for clarity
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: this.EDGE_COLOR });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    mesh.add(wireframe);

    this.scene.add(mesh);
    this.roomMeshes.set(node.id, mesh);
  }

  /**
   * Create a corridor voxel connecting two rooms
   */
  private createCorridorVoxel(edge: RoomEdge, nodes: RoomNode[]): void {
    if (!this.scene) {
      return;
    }

    const fromNode = nodes.find((n) => n.id === edge.from);
    const toNode = nodes.find((n) => n.id === edge.to);

    if (!fromNode || !toNode) {
      return;
    }

    // Calculate position and dimensions
    const fromX = fromNode.x / this.GRID_SCALE;
    const fromZ = fromNode.y / this.GRID_SCALE;
    const toX = toNode.x / this.GRID_SCALE;
    const toZ = toNode.y / this.GRID_SCALE;

    const dx = toX - fromX;
    const dz = toZ - fromZ;
    const distance = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dz, dx);

    // Create corridor geometry
    const geometry = new THREE.BoxGeometry(
      distance - this.ROOM_SIZE, // length (minus room sizes at ends)
      this.CORRIDOR_WIDTH,
      this.CORRIDOR_WIDTH
    );

    const material = new THREE.MeshBasicMaterial({ color: this.CORRIDOR_COLOR });
    const mesh = new THREE.Mesh(geometry, material);

    // Position at midpoint
    const midX = (fromX + toX) / 2;
    const midZ = (fromZ + toZ) / 2;
    mesh.position.set(midX, this.CORRIDOR_WIDTH / 2, midZ);

    // Rotate to align with connection
    mesh.rotation.y = angle;

    // Add wireframe edges
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: this.EDGE_COLOR });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    mesh.add(wireframe);

    this.scene.add(mesh);
    this.corridorMeshes.push(mesh);
  }

  /**
   * Clear all meshes from the scene
   */
  private clearScene(): void {
    if (!this.scene) {
      return;
    }

    // Dispose room meshes
    this.roomMeshes.forEach((mesh) => {
      this.scene!.remove(mesh);
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else {
        mesh.material.dispose();
      }
      // Dispose children (wireframes)
      mesh.children.forEach((child) => {
        if (child instanceof THREE.LineSegments) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    });
    this.roomMeshes.clear();

    // Dispose corridor meshes
    this.corridorMeshes.forEach((mesh) => {
      this.scene!.remove(mesh);
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else {
        mesh.material.dispose();
      }
      // Dispose children (wireframes)
      mesh.children.forEach((child) => {
        if (child instanceof THREE.LineSegments) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    });
    this.corridorMeshes = [];
  }

  /**
   * Center camera on the map bounding box
   */
  private centerCamera(nodes: RoomNode[]): void {
    if (!this.camera || !this.controls || nodes.length === 0) {
      return;
    }

    // Calculate bounding box
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    nodes.forEach((node) => {
      const x = node.x / this.GRID_SCALE;
      const z = node.y / this.GRID_SCALE;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);
    });

    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;

    // Set controls target to center
    this.controls.target.set(centerX, 0, centerZ);

    // Position camera at a good viewing angle
    const width = maxX - minX;
    const depth = maxZ - minZ;
    const maxDim = Math.max(width, depth, 20); // minimum distance
    const distance = maxDim * 1.5;

    this.camera.position.set(centerX + distance * 0.7, distance * 0.8, centerZ + distance * 0.7);

    this.controls.update();
  }

  /**
   * Animation loop
   */
  private animate(): void {
    if (!this.renderer || !this.scene || !this.camera || !this.controls) {
      return;
    }

    this.animationFrameId = requestAnimationFrame(() => this.animate());

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Handle window resize
   */
  private handleResize(): void {
    if (!this.camera || !this.renderer || !this.canvasContainer) {
      return;
    }

    const container = this.canvasContainer.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Clean up Three.js resources
   */
  private cleanup(): void {
    // Cancel animation frame
    if (this.animationFrameId !== undefined) {
      cancelAnimationFrame(this.animationFrameId);
    }

    // Remove resize listener
    window.removeEventListener('resize', this.handleResize);

    // Clear scene
    this.clearScene();

    // Dispose controls
    if (this.controls) {
      this.controls.dispose();
    }

    // Dispose renderer
    if (this.renderer) {
      this.renderer.dispose();
      if (this.canvasContainer?.nativeElement.contains(this.renderer.domElement)) {
        this.canvasContainer.nativeElement.removeChild(this.renderer.domElement);
      }
    }

    // Clear scene
    if (this.scene) {
      this.scene.clear();
    }
  }

  /**
   * Get ARIA label for the map
   */
  getMapAriaLabel(): string {
    const count = this.exploredCount();
    return `3D voxel map of explored Zork world, showing ${count} room${count === 1 ? '' : 's'}`;
  }
}
