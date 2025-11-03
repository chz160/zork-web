# ADR-002: Spatial Room Placement System for 3D Map Visualization

## Status

Accepted

## Context

After replacing the 2D SVG map with a 3D wireframe map using Three.js (PR #161), we identified a need for a robust system to spatially position rooms in a way that aligns with how players mentally model the game world. The previous implementation used a simple 2D grid layout that didn't account for vertical movement (up/down) or maintain consistent spatial relationships based on room connections.

### Problems with Previous Approach

1. **No vertical positioning**: Rooms accessed via "up" or "down" were positioned diagonally rather than vertically
2. **Inconsistent spatial relationships**: Room placement didn't reflect intuitive adjacency (e.g., kitchen and attic)
3. **No explicit coordinates**: Positions were computed on-the-fly without ability to override
4. **Limited extensibility**: Difficult to support multi-story layouts or manual positioning

### Requirements

- Rooms should have explicit (x, y, z) coordinates reflecting spatial adjacency
- Connection metadata should encode directionality (north, south, up, down, etc.)
- System should automatically resolve coordinates from movement directions
- Support for manual coordinate overrides when narrative requires special placement
- Maintain player mental model alignment (e.g., "up" moves to room directly above)

## Decision

We have implemented a comprehensive spatial positioning system consisting of:

### 1. Extended Room Model

Added optional `SpatialCoordinates` interface to the Room model:

```typescript
export interface SpatialCoordinates {
  x: number;  // East-west axis: east is positive
  y: number;  // North-south axis: north is negative, south is positive
  z: number;  // Vertical axis: up is positive
  isManual?: boolean;  // Manual coordinates take precedence
}
```

**Coordinate System:**
- **X-axis**: West (negative) ← → East (positive)
- **Y-axis**: North (negative) ← → South (positive)  
- **Z-axis**: Down (negative) ← → Up (positive)

This coordinate system aligns with standard 3D conventions and player intuition.

### 2. SpatialLayoutService

Created a dedicated service (`SpatialLayoutService`) that:

- **Computes room positions** using BFS traversal from a starting room
- **Maps directions to vectors**:
  - `north` → (0, -1, 0)
  - `south` → (0, 1, 0)
  - `east` → (1, 0, 0)
  - `west` → (-1, 0, 0)
  - `up` → (0, 0, 1)
  - `down` → (0, 0, -1)
- **Handles collision detection** with fallback to nearby alternative positions
- **Respects manual coordinates** when `isManual: true`
- **Returns unplaced rooms** for debugging and validation

**Algorithm:**
1. Start with root room at origin (0, 0, 0) or its manual position
2. Use BFS to traverse room connections
3. For each room, compute position = parent position + direction vector
4. Check for collisions and find alternatives if needed
5. Skip rooms already processed to avoid cycles

### 3. Updated MapService

Modified `MapService` to:
- Inject `SpatialLayoutService`
- Use computed 3D coordinates in `roomNodes` signal
- Extend `RoomNode` interface to include `z` coordinate
- Update `getBoundingBox()` to return 3D bounds (minZ, maxZ)

### 4. Enhanced Map3DComponent

Updated the 3D visualization to:
- Position room meshes in true 3D space using (x*scale, z*scale, y*scale)
- Color-code connections:
  - **Green**: Horizontal movement (north, south, east, west)
  - **Yellow**: Upward movement (up)
  - **Magenta**: Downward movement (down)
- Center camera on current room in 3D space
- Scale factor of 15 for optimal visualization spacing

### 5. Comprehensive Testing

Added 26 tests covering:
- All six direction vectors
- Single and multi-room layouts
- Horizontal and vertical movement
- Manual coordinate handling
- Collision detection
- Bounding box computation
- Direction detection between coordinates
- Real-world scenario (kitchen/attic from issue)

## Consequences

### Positive

1. **Accurate spatial representation**: The 3D map now correctly depicts multi-story layouts and spatial relationships
2. **Player mental model alignment**: Movement directions match player expectations (e.g., "go up" shows room above)
3. **Extensible design**: Easy to add new features like isometric views, multiple buildings, or dynamic room creation
4. **Manual override support**: Map authors can specify exact coordinates for special cases
5. **Well-tested**: Comprehensive test coverage ensures reliability
6. **Backward compatible**: Existing rooms without coordinates work automatically

### Negative

1. **Increased complexity**: More sophisticated layout algorithm vs. simple grid
2. **Potential coordinate conflicts**: Collision detection handles this but may not always be perfect
3. **Migration effort**: Existing game data may need coordinate assignment for optimal layout (future work)

### Neutral

1. **Storage overhead**: Optional `SpatialCoordinates` field adds ~24 bytes per room when specified
2. **Computation cost**: BFS layout computation runs on each map render, but is O(N) where N is visited rooms

## Implementation Details

### Key Files

- `src/app/core/models/room.model.ts`: Extended Room interface with SpatialCoordinates
- `src/app/core/services/spatial-layout.service.ts`: Core layout computation logic
- `src/app/core/services/spatial-layout.service.spec.ts`: Comprehensive test suite
- `src/app/core/services/map.service.ts`: Updated to use SpatialLayoutService
- `src/app/ui/map3d/map3d.ts`: Enhanced 3D rendering with vertical positioning

### Usage Example

```typescript
// Rooms compute coordinates automatically from connections
const rooms: Room[] = [
  {
    id: 'kitchen',
    name: 'Kitchen',
    exits: new Map([['up', 'attic'], ['south', 'living-room']]),
    // ... other properties
  },
  {
    id: 'attic',
    name: 'Attic',
    exits: new Map([['down', 'kitchen']]),
  },
  {
    id: 'living-room',
    name: 'Living Room',
    exits: new Map([['north', 'kitchen']]),
  }
];

// Or specify manual coordinates for special placement
const specialRoom: Room = {
  id: 'secret-tower',
  name: 'Secret Tower',
  spatialCoordinates: { x: 10, y: 10, z: 5, isManual: true },
  // ... other properties
};

// Service computes layout
const layout = spatialLayoutService.computeLayout(rooms, 'kitchen');
// Result:
// kitchen: (0, 0, 0)
// attic: (0, 0, 1) - directly above kitchen
// living-room: (0, 1, 0) - south of kitchen
```

## Future Enhancements

1. **Migration utility**: Tool to assign spatial metadata to existing rooms based on connections
2. **Visual verification tool**: Interactive map editor for authors to validate and adjust layouts
3. **Advanced placement strategies**: Support for building groups, outdoor vs. indoor spaces
4. **Path finding**: Use spatial coordinates for navigation hints or pathfinding
5. **Minimap**: Generate 2D floor plan views from 3D coordinates

## References

- Issue: Design System for Spatial Room Placement in 3D Map Visualization
- PR #161: 3D Wireframe Map with Three.js
- Related: Zork I original game spatial layout and room descriptions

## Date

2025-11-03

## Authors

- GitHub Copilot (implementation)
- @chz160 (issue and requirements)
