# Spatial Positioning System Guide

## Overview

The Spatial Positioning System provides accurate 3D coordinates for rooms in the game world, ensuring the 3D map visualization reflects how players mentally model room relationships and navigation.

## Purpose

- **Accurate spatial representation**: Rooms are positioned based on actual connection directions
- **Player mental model alignment**: "Go up" shows room above, "go north" moves in negative Y direction
- **Multi-story support**: Vertical movement (up/down) is properly represented as Z-axis changes
- **Flexible authoring**: Supports both automatic coordinate computation and manual overrides

## Coordinate System

The system uses a right-handed 3D coordinate system:

```
    Z (up)
    ↑
    |
    |
    +----→ X (east)
   /
  /
 Y (south)
```

### Axis Conventions

- **X-axis**: West (negative) ← → East (positive)
- **Y-axis**: North (negative) ← → South (positive)
- **Z-axis**: Down (negative) ← → Up (positive)

### Direction Vectors

Each navigation direction maps to a unit vector:

| Direction | Vector (dx, dy, dz) | Description           |
|-----------|---------------------|-----------------------|
| north     | (0, -1, 0)          | Negative Y            |
| south     | (0, 1, 0)           | Positive Y            |
| east      | (1, 0, 0)           | Positive X            |
| west      | (-1, 0, 0)          | Negative X            |
| up        | (0, 0, 1)           | Positive Z            |
| down      | (0, 0, -1)          | Negative Z            |

## Room Model Extension

Rooms can optionally include spatial coordinates:

```typescript
interface Room {
  // ... existing properties
  spatialCoordinates?: SpatialCoordinates;
}

interface SpatialCoordinates {
  x: number;        // East-west position
  y: number;        // North-south position
  z: number;        // Vertical position (floor level)
  isManual?: boolean;  // If true, these coordinates are manually specified
}
```

### Example

```json
{
  "id": "attic",
  "name": "Attic",
  "description": "A dusty attic above the kitchen.",
  "exits": {
    "down": "kitchen"
  },
  "spatialCoordinates": {
    "x": 0,
    "y": 0,
    "z": 1,
    "isManual": false
  }
}
```

## Automatic Coordinate Computation

The `SpatialLayoutService` automatically computes coordinates for rooms without explicit coordinates.

### Algorithm

1. **Start at origin**: Place starting room at (0, 0, 0) unless manually positioned
2. **BFS traversal**: Use breadth-first search to visit connected rooms
3. **Apply direction vectors**: For each connection, add the direction vector to parent coordinates
4. **Handle collisions**: Find alternative nearby positions when conflicts occur
5. **Respect manual coordinates**: Never override coordinates marked as `isManual: true`

### Example Layout

Given these rooms and connections:

```
kitchen (exits: { up: 'attic', south: 'living-room' })
attic (exits: { down: 'kitchen' })
living-room (exits: { north: 'kitchen' })
```

Computed coordinates:
- `kitchen`: (0, 0, 0) — starting point
- `attic`: (0, 0, 1) — directly above kitchen
- `living-room`: (0, 1, 0) — south of kitchen

## Manual Coordinate Override

For special cases where automatic placement doesn't match the desired layout:

```json
{
  "id": "secret-tower",
  "name": "Secret Tower",
  "description": "A hidden tower high above the castle.",
  "exits": {
    "down": "throne-room"
  },
  "spatialCoordinates": {
    "x": 10,
    "y": 10,
    "z": 5,
    "isManual": true
  }
}
```

**Important**: Set `isManual: true` to prevent the automatic algorithm from overwriting these coordinates.

## Generating Coordinates

Use the migration utility to assign spatial coordinates to all rooms:

```bash
# Generate coordinates for all rooms (starting from west-of-house)
npm run generate:spatial

# Use a different starting room
npm run generate:spatial -- --start-room=kitchen

# Preview changes without modifying files
npm run generate:spatial -- --dry-run

# Verbose output showing each room's coordinates
npm run generate:spatial -- --verbose
```

### Tool Output

The tool provides:
- Number of rooms with computed coordinates
- Number of manually-positioned rooms preserved
- List of any unplaced rooms (due to disconnected graph regions)
- Bounding box dimensions (width, depth, height)

## Usage in Code

### Computing Layout

```typescript
import { SpatialLayoutService } from './spatial-layout.service';

// Inject service
constructor(private spatialLayout: SpatialLayoutService) {}

// Compute layout
const layout = this.spatialLayout.computeLayout(rooms, 'west-of-house');

// Access coordinates
layout.coordinates.forEach((coords, roomId) => {
  console.log(`${roomId}: (${coords.x}, ${coords.y}, ${coords.z})`);
});

// Check for unplaced rooms
if (layout.unplacedRooms.length > 0) {
  console.warn('Some rooms could not be placed:', layout.unplacedRooms);
}
```

### Direction Utilities

```typescript
// Get direction vector
const vector = this.spatialLayout.getDirectionVector('north');
// Returns: { dx: 0, dy: -1, dz: 0 }

// Determine direction between two rooms
const from = { x: 0, y: 0, z: 0, isManual: false };
const to = { x: 0, y: -1, z: 0, isManual: false };
const direction = this.spatialLayout.getDirection(from, to);
// Returns: 'north'
```

### Bounding Box

```typescript
const bbox = this.spatialLayout.getBoundingBox(layout.coordinates);
console.log(`Map dimensions: ${bbox.maxX - bbox.minX + 1} × ${bbox.maxY - bbox.minY + 1} × ${bbox.maxZ - bbox.minZ + 1}`);
```

## Visualization in 3D Map

The `Map3DComponent` uses spatial coordinates to position rooms in Three.js:

### Rendering

- Rooms are positioned at `(x * scale, z * scale, y * scale)` where `scale = 15`
- Vertical spacing makes different floors clearly visible
- Connection lines are color-coded:
  - **Green**: Horizontal movement (north, south, east, west)
  - **Yellow**: Upward movement (up)
  - **Magenta**: Downward movement (down)

### Camera Controls

- **Orbit**: Left-click and drag to rotate view
- **Pan**: Right-click and drag to pan
- **Zoom**: Mouse wheel to zoom in/out
- **Auto-focus**: Camera centers on current player location

## Best Practices

### When to Use Manual Coordinates

Use manual coordinates (`isManual: true`) when:

1. **Narrative requires specific layout**: Story dictates unusual spatial relationships
2. **Fixing collision issues**: Automatic placement causes unwanted overlaps
3. **Creating building groups**: Separating distinct structures (house vs. dungeon)
4. **Artistic arrangement**: Specific visual appearance for the map

### When to Use Automatic Coordinates

Use automatic coordinates (default) when:

1. **Standard navigation**: Rooms follow typical connection patterns
2. **Initial setup**: First pass at room placement
3. **Consistent spacing**: Want uniform grid-like layout
4. **Easy maintenance**: Changes to connections automatically update positions

### Handling Disconnected Regions

If the game has multiple disconnected areas (e.g., separate buildings):

1. Generate coordinates for the main area starting from the most central room
2. For disconnected regions, manually place one "anchor" room with coordinates
3. Re-run the tool to compute coordinates for the rest of that region

Example:

```json
{
  "id": "dungeon-entrance",
  "name": "Dungeon Entrance",
  "description": "The entrance to the underground dungeon.",
  "spatialCoordinates": {
    "x": 20,
    "y": 20,
    "z": -1,
    "isManual": true
  }
}
```

## Testing Spatial Layout

The system includes comprehensive tests in `spatial-layout.service.spec.ts`:

```bash
# Run spatial layout tests only
npm test -- --include='**/spatial-layout.service.spec.ts'
```

Test scenarios include:
- All direction vectors
- Single and multi-room layouts
- Vertical movement (up/down)
- Manual coordinate handling
- Collision detection
- Real-world example (kitchen/attic scenario)

## Troubleshooting

### Room Not Placed

**Problem**: Tool reports room in "unplaced" list

**Causes**:
- Room is not connected to starting room (disconnected graph)
- All attempted positions have collisions
- Invalid exit direction (typo or non-standard direction)

**Solutions**:
1. Check room has valid exit connections
2. Add manual coordinates to "anchor" the disconnected region
3. Verify exit directions use standard names (north, south, east, west, up, down)

### Rooms Overlapping in 3D View

**Problem**: Multiple rooms appear at same position

**Causes**:
- Collision detection didn't find alternative position
- Manual coordinates conflict

**Solutions**:
1. Run `npm run generate:spatial -- --verbose` to see computed positions
2. Add manual coordinates to one of the conflicting rooms
3. Check for circular connections that might confuse placement

### Incorrect Vertical Layout

**Problem**: Rooms that should be on different floors appear on same level

**Causes**:
- Missing "up" or "down" exits in room data
- Connections use alternative direction names (e.g., "u" instead of "up")

**Solutions**:
1. Verify exits use full direction names: "up", "down"
2. Check bidirectional connections (if room A has "up" to B, B should have "down" to A)
3. Manually set Z coordinates if connections are complex

## Performance Considerations

### Computation Cost

- **O(N)** where N is number of rooms
- BFS traversal visits each room once
- Collision checking is O(N) per room in worst case
- Typically completes in < 100ms for 200 rooms

### Storage Overhead

- Optional `spatialCoordinates` field: ~24 bytes per room when present
- Total overhead for 200 rooms: ~4.8 KB
- Minimal impact on load times and memory

### Caching

The `MapService` uses Angular signals to cache computed room nodes:
- Coordinates recompute only when rooms or connections change
- 3D visualization updates automatically via reactive effects
- No manual cache invalidation needed

## Future Enhancements

Planned improvements to the spatial system:

1. **Visual editor**: Interactive tool for adjusting room positions
2. **Floor plan views**: Generate 2D slices at each Z level
3. **Building groups**: Tag rooms as part of specific structures
4. **Path visualization**: Show suggested navigation paths
5. **Minimap**: Overlay map on game screen

## Related Documentation

- [ADR-002: Spatial Room Placement System](../adr/ADR-002-spatial-room-placement-system.md)
- [Architecture Overview](../architecture.md)
- [3D Map Component](../../src/app/ui/map3d/README.md)

## Support

For issues or questions:

1. Check existing issues on GitHub
2. Review test cases in `spatial-layout.service.spec.ts`
3. Run tool with `--dry-run --verbose` to debug
4. Open a new issue with reproduction steps
