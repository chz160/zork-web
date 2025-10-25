# Property Verification Report

## Critical Object Types in Canonical Data

- **Containers**: 20 (CONTBT flag)
- **Light Sources**: 0 (LITEBT flag)
- **Weapons**: 0 (WEAPONBT flag)
- **Doors**: 11 (DOORBT flag)
- **Readable Items**: 31 (READBT flag)
- **Food Items**: 6 (FOODBT flag)
- **Tools**: 9 (TOOLBT flag)

## Container Analysis

### Containers in Canonical Data (by room location):

- Index 0: location=room-6, capacity=15, flags=[VISIBT, TAKEBT, CONTBT, BURNBT]
- Index 6: location=room-77, capacity=50, flags=[VISIBT, CONTBT]
- Index 8: location=room-8, capacity=10000, flags=[VISIBT, TRANBT, CONTBT]
- Index 9: location=room-6, capacity=4, flags=[VISIBT, TAKEBT, TRANBT, CONTBT]
- Index 32: location=room-44, capacity=35, flags=[VISIBT, TAKEBT, CONTBT]
- Index 38: location=room-83, capacity=20, flags=[TAKEBT, CONTBT]
- Index 42: location=room-95, capacity=5, flags=[VISIBT, TAKEBT, CONTBT]
- Index 46: location=room-97, capacity=0, flags=[VISIBT, READBT, TAKEBT, CONTBT, BURNBT]
- Index 52: location=room-2, capacity=10, flags=[VISIBT, CONTBT]
- Index 53: location=room-100, capacity=7, flags=[VISIBT, READBT, TAKEBT, CONTBT]
- Index 58: location=room-103, capacity=5, flags=[VISIBT, TAKEBT, CONTBT]
- Index 93: location=room-112, capacity=20, flags=[VISIBT, TAKEBT, CONTBT]
- Index 98: location=void, capacity=6, flags=[VISIBT, CONTBT]
- Index 104: location=room-135, capacity=15, flags=[VISIBT, CONTBT]
- Index 113: location=room-134, capacity=2, flags=[VISIBT, READBT, TAKEBT, CONTBT, BURNBT]
- Index 114: location=room-134, capacity=2, flags=[VISIBT, READBT, TAKEBT, CONTBT, BURNBT]
- Index 115: location=room-134, capacity=2, flags=[VISIBT, READBT, TAKEBT, CONTBT, BURNBT]
- Index 116: location=room-134, capacity=2, flags=[VISIBT, READBT, TAKEBT, CONTBT, BURNBT]
- Index 153: location=void, capacity=6, flags=[VISIBT, TAKEBT, CONTBT]
- Index 154: location=void, capacity=6, flags=[VISIBT, TAKEBT, CONTBT]

## Light Source Analysis

**Note:** No LITEBT flags found. Light sources may use LIGHTBT flag instead.

### Objects with LIGHTBT flag:

- Index 14: location=room-8, flags=[VISIBT, TAKEBT, LIGHTBT]
- Index 33: location=room-80, flags=[VISIBT, TAKEBT, LIGHTBT, FLAMBT, TOOLBT, ONBT]
- Index 47: location=room-97, flags=[VISIBT, TAKEBT, LIGHTBT, FLAMBT, ONBT]

## Weapon Analysis

**Note:** No WEAPONBT flags found. Check for FITEBT flag instead.

## Readable Items Analysis

### Readable Items in Canonical Data:

- Index 40: location=room-90, portable=false, flags=[VISIBT, READBT]
- Index 43: location=room-96, portable=false, flags=[VISIBT, READBT, NDSCBT]
- Index 46: location=room-97, portable=true, flags=[VISIBT, READBT, TAKEBT, CONTBT, BURNBT]
- Index 48: location=room-99, portable=true, flags=[VISIBT, READBT, TAKEBT, BURNBT]
- Index 49: location=room-8, portable=true, flags=[VISIBT, READBT, TAKEBT, BURNBT]
- Index 50: location=room-99, portable=true, flags=[VISIBT, READBT, TAKEBT]
- Index 51: location=void, portable=true, flags=[VISIBT, READBT, TAKEBT, BURNBT]
- Index 53: location=room-100, portable=true, flags=[VISIBT, READBT, TAKEBT, CONTBT]
- Index 66: location=room-8, portable=false, flags=[VISIBT, READBT, DOORBT, NDSCBT]
- Index 90: location=void, portable=true, flags=[VISIBT, READBT, TAKEBT, BURNBT]
- Index 103: location=room-131, portable=true, flags=[VISIBT, READBT, TAKEBT]
- Index 105: location=void, portable=true, flags=[VISIBT, READBT, TAKEBT, BURNBT]
- Index 111: location=void, portable=true, flags=[VISIBT, READBT, TAKEBT, BURNBT]
- Index 113: location=room-134, portable=true, flags=[VISIBT, READBT, TAKEBT, CONTBT, BURNBT]
- Index 114: location=room-134, portable=true, flags=[VISIBT, READBT, TAKEBT, CONTBT, BURNBT]
- Index 115: location=room-134, portable=true, flags=[VISIBT, READBT, TAKEBT, CONTBT, BURNBT]
- Index 116: location=room-134, portable=true, flags=[VISIBT, READBT, TAKEBT, CONTBT, BURNBT]
- Index 117: location=void, portable=true, flags=[VISIBT, READBT, TAKEBT, BURNBT]
- Index 118: location=room-137, portable=false, flags=[VISIBT, READBT, DOORBT, NDSCBT]
- Index 121: location=room-137, portable=true, flags=[VISIBT, READBT, TAKEBT, BURNBT]
- Index 129: location=room-143, portable=false, flags=[VISIBT, READBT, NDSCBT]
- Index 130: location=room-142, portable=false, flags=[VISIBT, READBT, NDSCBT]
- Index 138: location=room-144, portable=true, flags=[VISIBT, READBT, TAKEBT, FOODBT]
- Index 139: location=room-144, portable=true, flags=[VISIBT, READBT, TAKEBT, FOODBT]
- Index 140: location=room-144, portable=true, flags=[VISIBT, READBT, TAKEBT, FOODBT]
- Index 142: location=room-138, portable=true, flags=[VISIBT, READBT, TAKEBT, BURNBT]
- Index 147: location=room-154, portable=true, flags=[VISIBT, READBT, TAKEBT, BURNBT]
- Index 148: location=room-156, portable=true, flags=[VISIBT, READBT, TAKEBT, BURNBT]
- Index 149: location=room-155, portable=false, flags=[VISIBT, READBT, NDSCBT]
- Index 185: location=room-188, portable=true, flags=[VISIBT, READBT, TAKEBT, BURNBT]
- Index 187: location=room-18500, portable=true, flags=[VISIBT, READBT, TAKEBT]

## Object Location Analysis

### Top 20 locations with most objects:

- void: 59 objects
- room-177: 11 objects
- room-183: 10 objects
- room-100: 8 objects
- room-8: 7 objects
- room-16: 5 objects
- room-144: 5 objects
- room-134: 4 objects
- room-137: 4 objects
- room-7: 3 objects
- room-93: 3 objects
- room-98: 3 objects
- room-139: 3 objects
- room-146: 3 objects
- room-6: 2 objects
- room-78: 2 objects
- room-77: 2 objects
- room-96: 2 objects
- room-97: 2 objects
- room-99: 2 objects

## Objects in Key Playable Rooms

### room-6 (2 objects):

- Index 0: portable, flags=[VISIBT, TAKEBT, CONTBT, BURNBT]
- Index 9: portable, flags=[VISIBT, TAKEBT, TRANBT, CONTBT]

### room-7 (3 objects):

- Index 11: portable, flags=[VISIBT, TAKEBT]
- Index 12: portable, flags=[VISIBT, TAKEBT]
- Index 108: portable, flags=[VISIBT, TAKEBT]

### room-8 (7 objects):

- Index 8: fixed, flags=[VISIBT, TRANBT, CONTBT]
- Index 13: portable, flags=[VISIBT, TAKEBT]
- Index 14: portable, flags=[VISIBT, TAKEBT, LIGHTBT]
- Index 16: fixed, flags=[VISIBT, NDSCBT]
- Index 49: portable, flags=[VISIBT, READBT, TAKEBT, BURNBT]
- Index 65: fixed, flags=[DOORBT, NDSCBT]
- Index 66: fixed, flags=[VISIBT, READBT, DOORBT, NDSCBT]

### room-16 (5 objects):

- Index 20: portable, flags=[VISIBT, TAKEBT]
- Index 21: portable, flags=[VISIBT, TAKEBT]
- Index 22: portable, flags=[VISIBT, TAKEBT, TOOLBT]
- Index 23: fixed, flags=[VISIBT]
- Index 24: portable, flags=[VISIBT, TAKEBT]

### room-100 (8 objects):

- Index 53: portable, flags=[VISIBT, READBT, TAKEBT, CONTBT]
- Index 55: portable, flags=[VISIBT, TAKEBT, TOOLBT]
- Index 56: portable, flags=[VISIBT, TAKEBT, TOOLBT]
- Index 77: fixed, flags=[VISIBT, NDSCBT]
- Index 78: fixed, flags=[VISIBT, NDSCBT]
- Index 79: fixed, flags=[VISIBT, NDSCBT]
- Index 80: fixed, flags=[VISIBT, NDSCBT]
- Index 81: fixed, flags=[VISIBT, NDSCBT]

### room-134 (4 objects):

- Index 113: portable, flags=[VISIBT, READBT, TAKEBT, CONTBT, BURNBT]
- Index 114: portable, flags=[VISIBT, READBT, TAKEBT, CONTBT, BURNBT]
- Index 115: portable, flags=[VISIBT, READBT, TAKEBT, CONTBT, BURNBT]
- Index 116: portable, flags=[VISIBT, READBT, TAKEBT, CONTBT, BURNBT]

### room-137 (4 objects):

- Index 118: fixed, flags=[VISIBT, READBT, DOORBT, NDSCBT]
- Index 119: fixed, flags=[VISIBT]
- Index 120: portable, flags=[VISIBT, TAKEBT]
- Index 121: portable, flags=[VISIBT, READBT, TAKEBT, BURNBT]

### room-144 (5 objects):

- Index 134: fixed, flags=[VISIBT]
- Index 137: portable, flags=[VISIBT, TAKEBT, FOODBT]
- Index 138: portable, flags=[VISIBT, READBT, TAKEBT, FOODBT]
- Index 139: portable, flags=[VISIBT, READBT, TAKEBT, FOODBT]
- Index 140: portable, flags=[VISIBT, READBT, TAKEBT, FOODBT]

## Critical Gameplay Items

Based on canonical flags, the game should have:

1. **20 Containers** - Essential for inventory puzzles
2. **0 Light Sources** - Essential for dark rooms (128 dark rooms exist)
3. **0 Weapons** - For combat encounters
4. **11 Doors** - For navigation and access control
5. **31 Readable Items** - For clues and information
6. **6 Food Items** - For survival mechanics
7. **9 Tools** - For puzzle solving

## Recommendations

### Immediate Actions Required:

1. **CRITICAL**: Investigate light source implementation
   - The canonical data shows objects with LIGHTBT flags
   - With 128 dark rooms, light sources are essential
   - Verify: brass lantern, matches, torch, etc.

2. **Container Implementation**
   - Verify all 20 containers are properly implemented
   - Check capacity values and containment logic
   - Ensure transparent vs opaque containers work correctly

3. **Weapon/Combat System**
   - Verify weapon objects are marked correctly
   - Check for FITEBT flags in oflag2
   - Implement weapon properties if missing

4. **Property Completeness**
   - Add missing property mappings from C flags
   - Document property usage in TypeScript interfaces
   - Create migration script for property additions
