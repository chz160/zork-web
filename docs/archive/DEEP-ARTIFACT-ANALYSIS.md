# Deep Artifact Analysis Report

## Canonical C Source Metadata

**Version:** 2.7.65
**Max Score:** 585
**Endgame Max Score:** 100

## Entity Counts

| Entity | Canonical C | Current Data | Delta |
|--------|-------------|--------------|-------|
| Rooms | 190 | 110 | 80 |
| Objects | 216 | 120 | 96 |
| Messages | 1022 | N/A | N/A |
| Travel Entries | 886 | N/A | N/A |

## Room Flags Analysis (from C source)

### Flag Frequency

- **RLAND**: 179 rooms
- **RLIGHT**: 62 rooms
- **RSACRD**: 38 rooms
- **RNWALL**: 31 rooms
- **REND**: 30 rooms
- **RFILL**: 17 rooms
- **RWATER**: 7 rooms
- **RAIR**: 4 rooms
- **RHOUSE**: 3 rooms
- **RBUCK**: 2 rooms

### Room Categories

- **Rooms with Actions**: 74 (special behavior code)
- **Rooms with Value**: 13 (scoring/treasure)
- **Dark Rooms**: 128 (require light source)
- **Light Rooms**: 62 (naturally lit)

## Object Flags Analysis (from C source)

### Flag Frequency

- **VISIBT**: 207 objects
- **TAKEBT**: 91 objects
- **NDSCBT**: 90 objects
- **READBT**: 31 objects
- **BURNBT**: 26 objects
- **CONTBT**: 20 objects
- **VICTBT**: 13 objects
- **DOORBT**: 11 objects
- **TOOLBT**: 9 objects
- **FOODBT**: 6 objects
- **TRANBT**: 6 objects
- **LIGHTBT**: 3 objects
- **FLAMBT**: 2 objects
- **ONBT**: 2 objects
- **TURNBT**: 2 objects
- **DRNKBT**: 1 objects

### Object Categories

- **Portable Objects**: 91
- **Containers**: 20
- **Light Sources**: 0
- **Weapons**: 0
- **Edible Items**: 6
- **Treasures**: 0

### Object Location Distribution

- **void**: 59 objects
- **room-177**: 11 objects
- **room-183**: 10 objects
- **room-100**: 8 objects
- **room-8**: 7 objects
- **room-16**: 5 objects
- **room-144**: 5 objects
- **room-134**: 4 objects
- **room-137**: 4 objects
- **room-7**: 3 objects
- **room-93**: 3 objects
- **room-98**: 3 objects
- **room-139**: 3 objects
- **room-146**: 3 objects
- **room-6**: 2 objects

## Current Data Properties

### Room Properties in Current Data

```
  description
  exits
  id
  isDark
  name
  objectIds
  shortDescription
  visited
```

### Object Properties in Current Data

```
  aliases
  description
  id
  location
  name
  portable
  properties
  properties.capacity
  properties.contains
  properties.isLight
  properties.isLit
  properties.isLocked
  properties.isOpen
  properties.isWeapon
  properties.value
  visible
```

## Key Findings

### Missing Rooms

The canonical C version has **80 more rooms** than our current data.

**Possible reasons:**
- Some rooms may be template/unused rooms in the C source
- Endgame rooms might not all be implemented yet
- 30 rooms are marked as REND (endgame) in the canonical data

### Missing Objects

The canonical C version has **96 more objects** than our current data.

**Note:** 59 canonical objects are in 'void' location (may be templates or conditionally created items)

## C Flag Reference

### Room Flags

- **RLIGHT**: Room has light (not dark)
- **RLAND**: Land location (vs water/air)
- **RSACRD**: Sacred location
- **REND**: Endgame room
- **RWATER**: Water location
- **RAIR**: Air/flying location
- **RSEEN**: Room has been visited

### Object Flags

- **VISIBT**: Object is visible
- **TAKEBT**: Object can be taken
- **CONTBT**: Object is a container
- **LITEBT**: Object provides light
- **WEAPONBT**: Object is a weapon
- **FOODBT**: Object can be eaten
- **DOORBT**: Object is a door
- **TRANBT**: Container is transparent
- **BURNBT**: Object can be burned
- **READBT**: Object can be read
- **OPENBT**: Container is open (from oflag2)
- **FITEBT**: Object can be used in combat (from oflag2)

## Recommendations

### Data Verification Steps

1. **Review Room Count Discrepancy**
   - Investigate 80 missing rooms
   - Check if endgame rooms are all implemented
   - Verify which rooms are essential for gameplay

2. **Review Object Count Discrepancy**
   - Investigate 96 missing objects
   - Check object categories: treasures, weapons, tools
   - Verify all containers are implemented

3. **Property Completeness**
   - Verify all room flags are properly mapped
   - Ensure object flags are correctly represented
   - Check that special properties (actions, values) are preserved

4. **Message/Text Verification**
   - The canonical data has 1022 messages
   - Compare room/object descriptions with canonical text
   - Verify substitution messages are handled correctly

5. **Exit/Travel Data**
   - The canonical data has 886 travel entries
   - Verify all room exits are correct
   - Check for conditional/special exits
