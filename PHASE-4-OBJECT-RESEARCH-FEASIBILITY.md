# Phase 4 Object Manual Research - Feasibility Assessment

## Task Summary
Manually research and name all 96 missing objects (indices 120-215) based on properties, location, and Zork context.

## Challenges Discovered

### 1. No Usable Canonical Names/Descriptions
The canonical data has **universally bad names** for objects 120-215:
- Most have wrong names from room descriptions ("You Are Outside A", "Water Level Is Now")
- Even objects 0-119 have bad descriptions that don't match reality
- Cannot use text-based matching at all

### 2. Unknown Room Context
Many objects are in rooms that also have placeholder names:
- room-137: "Room 137" (no description)
- room-177: "Room 177" (no description)  
- room-183: "Room 183" (no description)
- 34 objects are in "void" (templates/spawns)

### 3. Properties Are Cryptic Without Context
Example: Object 120
```json
{
  "objectIndex": 120,
  "location": "room-137",
  "osize": 15,
  "oactio": 29,
  "takeable": true
}
```

What is this? Without knowing what room-137 is or what action 29 does, impossible to name.

### 4. Scale of Research Required
To properly name each object requires:
- Identifying what room-137, room-177, etc. actually are in Zork
- Cross-referencing with Zork walkthroughs/maps
- Understanding what oactio values 29, 30, 31... mean
- Researching Zork I's complete item list
- Testing in-game to verify

**Estimated time per object**: 10-15 minutes (research + validation)
**Total time for 96 objects**: 16-24 hours

## Pragmatic Alternatives

### Option 1: Focus on High-Value Objects (Recommended)
Identify and name only the objects that matter most:

**Treasures** (can identify by ofval/otval):
- Object 125: ofval=6, room-140
- Object 133: ofval=5, room-146
- Object 147: ofval=10, otval=15, room-154 (READABLE + treasure!)
- Object 148: ofval=10, otval=5, room-156 (READABLE + treasure!)
- Object 153: ofval=5, container, void
- Object 155: ofval=1, void
- Object 156: ofval=6, void
- Object 187: ofval=15, otval=10, room-18500 (READABLE)

**Time estimate**: 2-3 hours for 8 treasures

### Option 2: Use Placeholder Names with Properties
Create objects with descriptive placeholder names based on what we know:
- "treasure-object-125" (ofval=6, in room-140)
- "readable-object-121" (readable, in room-137)
- "door-163" (door flag, room-177)
- "action-object-120" (oactio=29, room-137)

These can be:
1. Added to game immediately (unblocks Phase 4)
2. Renamed later when rooms/context is better understood
3. Validated through gameplay testing

**Time estimate**: 2-3 hours for all 96 objects

### Option 3: Defer to Phase 5 with Room Implementation
Many of these objects may become clear once we:
- Implement room actions (Phase 5)
- Add navigation connections
- Test the game end-to-end
- See objects in their room context

**Time estimate**: Spread across Phase 5 (5-8 hours total)

## Recommendation

**Proceed with Option 2 (Placeholder Names)**:

1. **NOW**: Create all 96 objects with systematic placeholder names
   - Format: `{type}-{property}-{index}` 
   - Examples: "treasure-6pts-125", "readable-121", "door-163"
   - Include ALL correct properties from canonical data

2. **Phase 4.5**: Research and rename the 8 treasure objects properly
   - These are most important for gameplay
   - Can be identified by ofval/otval

3. **Phase 5**: Refine remaining objects as room context becomes clear
   - Room actions will reveal object purposes
   - Gameplay testing will show what's needed
   - Can rename objects as we understand them

## Benefits of This Approach

✅ **Unblocks Phase 4**: Can complete object addition now
✅ **Preserves correct data**: Properties, locations, flags all accurate
✅ **Incremental improvement**: Can refine names over time
✅ **Testable**: Can validate objects work even with placeholder names
✅ **Realistic timeline**: 2-3 hours vs 16-24 hours

## Risks of Full Manual Research Now

❌ **Time-intensive**: 16-24 hours of research
❌ **Error-prone**: Without room context, likely to misidentify
❌ **Premature**: May rename incorrectly, need to redo later
❌ **Blocking**: Delays Phase 4 completion significantly

## Proposed Action Plan

1. Create systematic placeholder names for all 96 objects (2 hours)
2. Add all objects to game with correct properties (30 min)
3. Test that objects load and properties work (30 min)
4. Research and properly name 8 treasure objects (2 hours)
5. Document remaining 88 objects for Phase 5 refinement
6. **Total time**: 5 hours vs 16-24 hours

## User Decision Needed

Do you want to:
- **A)** Proceed with placeholder names + treasure research (5 hours)
- **B)** Attempt full manual research for all 96 objects (16-24 hours)
- **C)** Focus only on treasures now, defer rest to Phase 5 (3-4 hours)

Please advise which approach you prefer.
