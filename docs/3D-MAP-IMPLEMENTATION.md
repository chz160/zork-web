# 3D Map Implementation

## Overview

This document describes the implementation of the 3D graph-based map visualization that replaced the original 2D SVG map in zork-web.

## Architecture

### Components

#### MapGraph3DComponent (`src/app/ui/map-graph3d/`)

The main component that renders the 3D visualization using the `3d-force-graph` library built on Three.js.

**Key Features:**

* **3D Graph Visualization**: Rooms are rendered as nodes and connections as links in 3D space
* **Progressive Reveal**: Only visited rooms and their connections are visible (fog of war)
* **Current Location Highlighting**: The player's current room is highlighted with a distinct color
* **Interactive Controls**: Pan, zoom, and rotate using mouse/touch gestures
* **Minimalist Aesthetic**: Wireframe-style rendering with simple colors matching the Zork terminal theme
* **Accessibility**: Full ARIA labels and keyboard navigation support

**Technical Details:**

* Uses Angular signals for reactive state management
* Implements `OnInit`, `AfterViewInit`, and `OnDestroy` lifecycle hooks
* Properly disposes of Three.js resources to prevent memory leaks
* Uses `effect()` in constructor for reactive data updates
* Pauses force simulation after initial layout for stable presentation

#### MapGraphBuilderService (`src/app/core/services/`)

A service that transforms game room data into a graph structure suitable for visualization.

**Responsibilities:**

* Queries the GameEngineService for visited rooms and current location
* Builds graph nodes from visited rooms
* Creates links between connected rooms
* Prevents duplicate links
* Provides computed counts for rooms and connections

**Data Structure:**

```typescript
interface GraphNode {
  id: string;
  name: string;
  visited: boolean;
  isCurrent: boolean;
}

interface GraphLink {
  source: string;
  target: string;
  direction: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}
```

### Dependencies

**Production Dependencies:**

* `3d-force-graph@1.74.10`: High-level API for 3D force-directed graphs
* `three@0.171.0`: 3D rendering engine
* `@types/three`: TypeScript definitions for Three.js

**Security:** All dependencies have been checked against the GitHub advisory database and are free of known vulnerabilities.

## Visual Design

### Color Scheme

* **Background**: `#0b0b0b` (very dark, almost black)
* **Current Room Node**: `#78C0FF` (bright cyan-blue)
* **Visited Room Node**: `#7CFFD4` (cyan)
* **Unvisited Room Node**: `#222222` (dark gray, hidden by fog of war)
* **Visible Links**: `#7CFFD4` (cyan)
* **Hidden Links**: `#333333` (dark gray)

### Styling

* Nodes rendered as spheres with glow effects
* Links rendered as simple lines connecting nodes
* Legend showing current location, explored rooms, and connections
* Instructions for camera controls
* Responsive design for mobile and desktop

## Performance

### Bundle Size

The addition of 3D visualization libraries increased the bundle size:

* **Before**: ~545 KB initial bundle
* **After**: ~1.83 MB initial bundle
* **Increase**: ~1.29 MB (mostly Three.js and related libraries)

**Mitigation:**

* Updated Angular budgets to accommodate the new libraries
* Considered lazy loading (future optimization)
* Force simulation is paused after initial layout to reduce CPU usage
* No animated particles for improved performance

### Rendering Performance

* Target: 60 FPS for smooth interaction
* Force simulation runs for 3.5 seconds then pauses
* Optimized node resolution (16 segments)
* No shadows or complex lighting

## Testing

### Unit Tests

**MapGraphBuilderService Tests:**

* Verifies empty graph for no visited rooms
* Validates that only visited rooms are included
* Checks current room marking
* Tests link creation between visited rooms
* Ensures no duplicate links
* Validates room and link counts

**MapGraph3DComponent Tests:**

* Verifies component creation
* Tests empty state display
* Validates room and connection count display
* Checks graph container presence
* Verifies legend and instructions display
* Tests ARIA labels for accessibility

### E2E Tests

Located in `e2e/map-3d-visualization.spec.ts`, covering:

* Opening map via command
* Opening map via keyboard shortcut (Ctrl+M)
* Displaying initial room
* Updating map after exploring new rooms
* Closing map via button, overlay click, and ESC key
* Verifying legend and instructions
* Checking accessibility features

## Migration Notes

### What Was Removed

* `src/app/ui/map/` - Old 2D SVG map component
  * `map.ts` - Component implementation
  * `map.html` - Template
  * `map.css` - Styles
  * `map.spec.ts` - Tests
* `src/app/core/services/map.service.ts` - Old map service with 2D layout logic
* `src/app/core/services/map.service.spec.ts` - Old map service tests

### What Was Added

* `src/app/ui/map-graph3d/` - New 3D map component
  * `map-graph3d.ts` - Component with Three.js integration
  * `map-graph3d.html` - Template
  * `map-graph3d.css` - Styles
  * `map-graph3d.spec.ts` - Unit tests
* `src/app/core/services/map-graph-builder.service.ts` - Graph data builder
* `src/app/core/services/map-graph-builder.service.spec.ts` - Service tests
* `e2e/map-3d-visualization.spec.ts` - E2E tests

### What Was Modified

* `src/app/app.ts` - Updated imports to use `MapGraph3DComponent`
* `src/app/app.html` - Changed `<app-map />` to `<app-map-graph3d />`
* `src/app/core/services/index.ts` - Updated exports
* `angular.json` - Increased bundle size budgets
* `package.json` - Added 3D visualization dependencies

## Future Enhancements

### Potential Improvements

1. **Lazy Loading**: Load 3D libraries only when map is opened
2. **Custom Node Shapes**: Different shapes for different room types (e.g., sacred locations, water rooms)
3. **Directional Arrows**: Show direction labels on links
4. **Minimap**: Small always-visible map in corner
5. **Camera Presets**: Quick views (top-down, isometric, etc.)
6. **Room Clustering**: Group related rooms visually
7. **Search/Filter**: Find specific rooms on the map
8. **Distance Visualization**: Show path distance from current room
9. **Historical Path**: Show the player's exploration trail
10. **Performance Mode**: Option to disable 3D for low-end devices

### Known Limitations

* Large bundle size impact (see Performance section)
* CommonJS dependency warning from `ngraph.forcelayout`
* No mobile gesture optimizations yet
* Initial force simulation may cause brief visual movement

## Developer Notes

### Working with 3d-force-graph

The library is initialized using `new ForceGraph3D(element)` and configured via a fluent API:

```typescript
this.graph = new ForceGraph3D(container)
  .graphData(data)
  .backgroundColor('#0b0b0b')
  .nodeColor((node) => {
    // Color logic
  })
  .linkColor((link) => {
    // Link color logic
  });
```

### Memory Management

Always call `this.graph._destructor()` in `ngOnDestroy()` to prevent WebGL context leaks.

### Signal Usage

The component uses Angular signals for reactive state:

* `graphData` - Computed from MapGraphBuilderService
* `exploredCount` - Computed room count
* `connectionCount` - Computed link count
* `graphInitialized` - Track initialization state

### Force Simulation

The force simulation is automatically paused after 3.5 seconds to conserve CPU. When new data is added, it briefly resumes for 1 second to position new nodes.

## References

* [3D-Force-Graph Documentation](https://github.com/vasturiano/3d-force-graph)
* [Three.js Documentation](https://threejs.org/docs/)
* [Angular Signals Guide](https://angular.dev/guide/signals)
* [Issue #X: Map Enhancement Option 3](link-to-issue)
