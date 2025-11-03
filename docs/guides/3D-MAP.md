# 3D Wireframe Map Feature

## Overview

The 3D wireframe map provides a spatial visualization of the explored Zork world using Three.js. It renders rooms as wireframe boxes and connections as line segments, maintaining the game's retro terminal aesthetic while offering an intuitive 3D perspective of the game world.

## Features

### Visual Elements

- **Wireframe Rooms**: Each explored room is rendered as a 3D wireframe box
- **Current Location**: Highlighted in green with a spherical marker above it
- **Explored Rooms**: Shown in cyan to distinguish from current location
- **Connections**: Line segments connecting room centers, colored by direction:
  - Green: Horizontal connections (north, south, east, west)
  - Yellow: Upward connections (up)
  - Magenta: Downward connections (down)

### Interactive Controls

- **Orbit**: Left-click and drag to rotate the camera around the map
- **Pan**: Right-click and drag to move the view
- **Zoom**: Scroll wheel to zoom in/out
- **Auto-center**: Camera targets the player's current location

### Keyboard Shortcuts

- `Ctrl+M` or `Cmd+M`: Toggle map visibility
- Type `map` command: Open the map
- `Escape`: Close the map

### Fog of War

Only rooms that the player has visited are visible on the map. As the player explores, new rooms and their connections appear dynamically.

## Technical Implementation

### Component Structure

**Location**: `src/app/ui/map3d/`

**Files**:
- `map3d.ts` - Main component with Three.js scene management
- `map3d.html` - Template with canvas container and legend
- `map3d.css` - Styling following terminal aesthetic
- `map3d.spec.ts` - Unit tests

### Key Technologies

- **Three.js**: Core 3D rendering library
- **OrbitControls**: Camera control system
- **Angular Signals**: Reactive data updates
- **WebGL**: Hardware-accelerated rendering

### Data Flow

1. `MapService` provides room nodes and edges from game state
2. `Map3DComponent` subscribes to changes via computed signals
3. Scene updates automatically when exploration state changes
4. Camera centers on current room location
5. Resources cleaned up on component destroy

### Performance

- Optimized for 100+ rooms
- Maintains 60 FPS on modern hardware
- Efficient mesh reuse and cleanup
- Responsive canvas sizing

## Usage

### Opening the Map

From the game:
```
> map
```

Or use keyboard shortcut: `Ctrl+M` / `Cmd+M`

### Reading the Map

- **Green box with marker**: Your current location
- **Cyan boxes**: Previously visited rooms
- **Lines connecting boxes**: Paths between rooms
- **Yellow lines**: Upward paths
- **Cyan lines**: Downward paths

### Navigation Tips

1. Drag with left mouse to rotate and get different viewing angles
2. Use scroll wheel to zoom in for detail or out for overview
3. The camera automatically focuses on your current location
4. Close with the X button or press Escape

## Accessibility

- ARIA labels for screen readers
- Keyboard navigation support
- High contrast mode compatible
- Descriptive room and connection statistics

## Related Components

- `MapService` (`src/app/core/services/map.service.ts`) - Provides room graph data
- `App` (`src/app/app.ts`) - Handles map modal display
- Legacy `MapComponent` (`src/app/ui/map/`) - Previous 2D implementation (kept for reference)

## Future Enhancements

Potential improvements for future iterations:

- Room labels rendered in 3D space
- Minimap in corner during gameplay
- Save/load camera positions
- Animated transitions when moving between rooms
- Distance-based fog rendering
- Room interior previews on hover

## Testing

### Unit Tests

Run component tests:
```bash
npm test -- --include="**/map3d.spec.ts"
```

### E2E Tests

Run end-to-end tests:
```bash
npm run test:e2e -- e2e/map3d.spec.ts
```

### Manual Testing Checklist

- [ ] Map opens with `map` command
- [ ] Map shows current location in green
- [ ] Map shows visited rooms in cyan
- [ ] Connections render correctly
- [ ] Camera controls work (orbit, pan, zoom)
- [ ] Map closes with Escape or close button
- [ ] New rooms appear after exploration
- [ ] No console errors or warnings
- [ ] Responsive on different screen sizes
- [ ] Accessible via keyboard only

## Troubleshooting

### Map appears black or empty
- Ensure rooms have been visited (try moving around first)
- Check browser console for WebGL errors
- Verify Three.js loaded correctly

### Poor performance
- Check browser hardware acceleration is enabled
- Close other GPU-intensive applications
- Try reducing browser window size

### Controls not working
- Ensure cursor is over the map canvas
- Try clicking on canvas first to focus it
- Check browser console for JavaScript errors

## References

- Three.js Documentation: https://threejs.org/docs/
- OrbitControls: https://threejs.org/docs/#examples/en/controls/OrbitControls
- WebGL Fundamentals: https://webglfundamentals.org/
