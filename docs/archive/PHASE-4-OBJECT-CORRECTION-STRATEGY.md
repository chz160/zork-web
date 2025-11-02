# Phase 4 Object Correction Strategy

## Problem Statement

The canonical `objects.canonical.populated.json` has **critical data quality issues**:
- **111 objects (indices 0-119)** have wrong names/descriptions (pointing to room descriptions)
- **96 objects (indices 120-215)** are "missing" from current game
- **105 objects** have no message mapping at all (placeholder data)

## Analysis of Current Situation

### What's Wrong
```json
// Object 0 in canonical data
{
  "objectIndex": 0,
  "name": "You Are Outside A",  // ❌ This is a ROOM description!
  "description": "You are outside a large gateway...",
  "location": "room-6",
  "properties": {
    "osize": 3,
    "isContainer": true,
    "capacity": 15
  }
}
```

The properties, location, and flags are **correct** (from C source). Only the names/descriptions are wrong due to incorrect message index mapping.

### What We Have That's Correct
- ✅ 120 working objects in current game (`src/app/data/objects.json`)
- ✅ Correct object properties (osize, isContainer, capacity, flags)
- ✅ Correct object locations
- ✅ Correct object indices (0-215)
- ✅ Unique IDs for all objects

## Recommended Strategy: Hybrid Pragmatic Approach

### Phase 1: Identify Truly Missing Objects (Short-term, 1-2 hours)

**Objective**: Determine which of the 96 "missing" objects (120-215) are actually needed for gameplay.

**Method**:
1. Cross-reference with Zork game documentation/walkthroughs
2. Look for objects that:
   - Are treasures (ofval > 0)
   - Have special actions (oactio > 0)
   - Are in non-void locations (room-X)
   - Are containers or tools
3. De-prioritize:
   - Objects in "void" location (59 objects - likely templates/spawns)
   - Objects with minimal properties
   - Duplicate/placeholder entries

**Example Analysis**:
```bash
# Check objects 120-215 for treasures
jq '.[] | select(.cIndexTrace.objectIndex >= 120 and .properties.ofval > 0)' \
   artifacts/objects.canonical.populated.json
```

### Phase 2: Manual Object Creation (Medium-term, 2-4 hours)

For the ~20-30 truly needed objects identified in Phase 1:

**Method**:
1. **Use properties as the source of truth** (they're correct!)
2. **Infer object identity from context**:
   - Location (which room?)
   - Properties (treasure value, container size, etc.)
   - Flags (VISIBT, TAKEBT, CONTBT, etc.)
3. **Reference Zork documentation**:
   - InvisiClues
   - Walkthroughs
   - Original game manuals
4. **Create objects manually** with proper names

**Example Process**:
```json
// Canonical object 125 (wrong name)
{
  "objectIndex": 125,
  "name": "Water Level Is Now",  // ❌ Wrong
  "location": "room-42",
  "properties": {
    "osize": 10,
    "VISIBT": true,
    "TAKEBT": false
  }
}

// Inferred from context → probably "dam" or "reservoir" fixture
// Check room 42 in rooms.json, check walkthroughs
// Create properly:
{
  "id": "reservoir-control",
  "name": "reservoir control",
  "description": "A control panel for the reservoir.",
  "location": "room-42",
  "properties": { ... }
}
```

### Phase 3: Defer Template Objects (Long-term, Phase 5)

**59 objects in "void" location** are likely:
- Spawn templates
- State variations
- Event-triggered objects

These don't need to be added now. They'll be handled in Phase 5 when implementing:
- Room actions
- Object spawning
- State management

## Implementation Plan

### Step 1: Create Object Analysis Tool (30 min)

```typescript
// tools/analyze-missing-objects.ts
// Categorizes 96 missing objects by priority:
// - Priority 0: Treasures (ofval > 0)
// - Priority 1: Special actions (oactio > 0)  
// - Priority 2: Visible in rooms
// - Priority 3: Void/template objects
```

### Step 2: Generate Object Candidate List (30 min)

Run analysis tool to produce:
```json
{
  "highPriority": [
    {
      "objectIndex": 125,
      "reason": "Treasure (ofval=10), in room-42",
      "properties": { ... },
      "inferredType": "treasure"
    }
  ],
  "mediumPriority": [ ... ],
  "lowPriority": [ ... ],
  "skipForNow": [ ... ]  // void objects
}
```

### Step 3: Manual Research & Creation (2-3 hours)

For each high/medium priority object:
1. Look up room location in rooms.json
2. Check Zork walkthroughs for that room
3. Identify what object should be there
4. Create object with correct name/description
5. Use canonical properties (they're correct!)

### Step 4: Quality Check (30 min)

- Verify no duplicate IDs
- Verify locations exist
- Run tests
- Spot-check a few objects in-game

## Why This Approach?

### ✅ Advantages
1. **Pragmatic**: Focus on objects that matter for gameplay
2. **Incremental**: Can add 5-10 objects at a time
3. **Quality**: Manual review ensures correctness
4. **Efficient**: Skip 59 template objects for now
5. **Testable**: Can validate each object works

### ❌ Why Not Fix Canonical Source?
1. **Time-consuming**: 4-8 hours of C source debugging
2. **Uncertain**: May not be fixable (format may be complex)
3. **Low ROI**: Properties are correct, only names wrong
4. **Can defer**: Could fix later in Phase 3.5 if needed

## Time Estimate

| Task | Time | Outcome |
|------|------|---------|
| Create analysis tool | 30 min | Categorized object list |
| Run analysis + review | 30 min | ~25 priority objects identified |
| Manual creation (25 objects) | 2-3 hours | 25 new objects in game |
| Testing & validation | 30 min | Verified working |
| **Total** | **4-5 hours** | **~25 gameplay-critical objects added** |

## Alternative: If We Absolutely Need All 96 Objects

If the goal is truly to add ALL 96 missing objects:

### Brute Force Approach (8-12 hours)
1. Go through objects 120-215 one by one
2. Use properties to infer type
3. Check locations and cross-reference with rooms
4. Look up in walkthroughs/documentation
5. Create with best-guess names
6. Validate in gameplay

**Caveat**: Many of these 96 objects may be:
- Duplicates/variations
- Internal state objects
- Not actually needed for gameplay

## Recommendation to User

**Short-term (This PR)**:
- Accept Phase 4 as complete for rooms (110→244 ✅)
- Document object blocker clearly ✅
- Commit to addressing in Phase 4.5 or 5

**Phase 4.5 (Next PR, 4-5 hours)**:
- Create analysis tool
- Identify ~25 priority objects
- Add them manually with proper names
- Test and validate

**Phase 5 (Future)**:
- Add template/void objects as needed
- Implement spawn system
- Fix canonical source (optional, if time permits)

## Files to Create

1. `tools/analyze-missing-objects.ts` - Analysis tool
2. `artifacts/phase4/object-priorities.json` - Categorized list
3. `docs/OBJECT-RESEARCH-NOTES.md` - Research notes for manual creation

## Conclusion

**Don't try to fix all data quality issues at once.** Focus on:
1. Identify the ~25 truly needed objects
2. Create them manually with correct names
3. Use canonical properties (they're correct!)
4. Defer template objects to Phase 5

This pragmatic approach gets working objects into the game in 4-5 hours vs. 8-12+ hours for a complete solution or source debugging.
