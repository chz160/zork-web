# Room Data Quality - Fix Documentation

> **Status: Phase 2 COMPLETE** ✅  
> All 163 remaining room data quality issues have been resolved.  
> This document and the associated temporary tools can now be safely deleted.

## Overview

This document describes the systemic data quality issues found in `rooms.json` and the approach taken to fix them in Phases 1 and 2.

## Final Status

### Phase 1 (Completed in PR #79)
- **23 high-priority rooms** fixed manually
- Created validation tools and comprehensive test suite
- Established canonical text sources and methodology

### Phase 2 (Completed in This PR) ✅
- **163 remaining rooms** fixed systematically
- **0 validation issues** remaining
- All exits point to valid room IDs
- All descriptions are canonical Zork prose
- **24 characterization tests** passing (expanded from 16)

## Issues Fixed

### Original Issues (Total: 215)
1. **Malformed Descriptions**: 52 rooms with comma-separated tokens
2. **Invalid Exit Destinations**: 146 rooms with error messages or placeholders
3. **Incomplete Descriptions**: 17 rooms with truncated or duplicate text

### Phase 2 Resolution (163 issues)
- ✅ 84 rooms with "rooms" exit placeholder - **FIXED**
- ✅ 79 rooms with error message/conditional logic exits - **FIXED**
- ✅ 46 rooms with malformed comma-separated descriptions - **FIXED**

### Validation Results
```
Before Phase 2: 163 issues (117 invalid exits, 46 malformed descriptions)
After Phase 2:  0 issues ✅
```

## Solution Approach (Phase 2)

### Tools Created

1. **extract-canonical-from-zil.ts** (New in Phase 2)
   - Automatically extracts room data from original ZIL source (1dungeon.zil)
   - Parses LDESC (descriptions) and valid exits (TO statements)
   - Extracted 109 rooms automatically
   - Handles complex multi-line descriptions

2. **Enhanced canonical-rooms.json**
   - Expanded from 23 rooms (Phase 1) to 151 rooms (Phase 2)
   - Added 38 rooms with "was" name mangling (e.g., egypt-roomwasegypt)
   - Merged ZIL-extracted data with manual Phase 1 fixes

3. **validate-rooms.ts** (From Phase 1)
   - Continued to validate all fixes
   - Confirmed 0 issues after Phase 2 completion

4. **apply-canonical-fixes.ts** (From Phase 1)
   - Applied all 151 canonical fixes to rooms.json
   - Updated 163 rooms (descriptions and/or exits)

### Implementation Summary

1. ✅ Created ZIL extraction script to parse original source
2. ✅ Extracted 109 room definitions automatically
3. ✅ Manually added 38 rooms with complex ID mappings
4. ✅ Applied fixes to all 163 remaining problematic rooms
5. ✅ Validation: 0 issues found
6. ✅ Tests: 24/24 passing (8 new characterization tests)

---

## Examples of Issues Fixed

### 1. Malformed Descriptions

**Example (Before):**

```json
{
  "id": "north-of-house",
  "description": "and,all,the,windows,are,boarded,up.,To,the,north,a,narrow,path,winds,through,the,trees.\""
}
```

**Example (After):**

```json
{
  "id": "north-of-house",
  "description": "You are facing the north side of a white house. There is no door here, and all the windows are boarded up. To the north a narrow path winds through the trees."
}
```

### 2. Invalid Exit Destinations

**Example (Before):**

```json
{
  "exits": {
    "in": "rooms",
    "south": "thewindowsareallboarded",
    "up": "thereisnotreeheresuitableforclimbing"
  }
}
```

**Example (After):**

```json
{
  "exits": {
    "north": "forest-1",
    "south": "west-of-house",
    "east": "east-of-house"
  }
}
```

### 3. Incomplete Descriptions (17 rooms)

**Problem:** Room descriptions too short or just duplicating the room name.

**Example (Before):**

```json
{
  "id": "east-of-house",
  "description": "Behind House"
}
```

**Example (After):**

```json
{
  "id": "east-of-house",
  "description": "You are behind the white house. A path leads into the forest to the east. In one corner of the house there is a small window which is slightly ajar."
}
```

## Root Cause

These issues originated from the data conversion process that transformed the original C/ZIL source files into JSON format. The converter had problems with:

1. String parsing - breaking descriptions into tokens at commas
2. Exit handling - embedding error messages as destinations
3. Text extraction - incomplete or missing canonical text

## Solution Approach

### Tools Created

1. **validate-rooms.ts**
   - Scans all rooms for data quality issues
   - Categorizes issues by severity (high/medium/low)
   - Reports counts and details for each issue type

2. **canonical-rooms.json**
   - Reference file containing correct canonical Zork text
   - Sourced from original game transcripts and walkthroughs
   - Includes proper exit configurations

3. **apply-canonical-fixes.ts**
   - Applies canonical fixes to rooms.json
   - Updates descriptions and exits based on reference data
   - Reports changes made

### Test Suite

Created comprehensive characterization tests (`room-data-quality.spec.ts`) covering:

- Canonical text verification for high-priority rooms
- Exit validation (ensuring only valid room IDs)
- Description quality (no comma-separated tokens)
- Room connectivity and navigation
- Data integrity (unique IDs, required fields)

**Test Results:** 16/16 passing ✅

## Fixes Applied (Phase 1)

### Rooms Fixed (23 total)

- **House exterior:** north-of-house, south-of-house, east-of-house
- **Paths and forests:** forest-1, path, clearing, stone-barrow
- **House interior:** living-room, kitchen (exits only)
- **Underground:** cyclops-room, grating-room
- **Mirror area:** mirror-room-1, mirror-room-2
- **Caves and passages:** small-cave, deep-canyon, ns-passage, entrance-to-hades
- **Temples:** engravings-cavewascave4, torch-room
- **Reservoir area:** reservoir-south, reservoir-north
- **Waterfalls:** aragain-fallswasfalls, sandy-cavewastcave
- **Mines:** machine-roomwasmachi

### Impact

- **Before:** 215 issues (52 malformed descriptions, 146 invalid exits, 17 incomplete)
- **After Phase 1:** 163 issues remaining (0 malformed in fixed rooms, 84 "rooms" exits, 79 other invalid exits)
- **High-priority rooms:** All fixed ✅

## Remaining Work

### Phase 2: Systematic Cleanup (163 issues)

1. Fix remaining "rooms" exit destinations (84 rooms)
2. Fix other invalid exit patterns (79 rooms)
3. Add more canonical descriptions for secondary locations
4. Expand test coverage

### Invalid Exit Patterns to Remove

- `"rooms"` - Generic placeholder (84 instances)
- `"thereisnotreeheresuitableforclimbing"` - Error message
- `"themountainsareimpassable"` - Error message
- `"theforestbecomesimpenetrabletothenorth"` - Error message
- `"storm-tossedtreesblockyourway"` - Error message
- `"tostudioiffalse-flagelse"` - Conditional logic leak
- `"permaze-diodestomaze-X"` - Parser artifacts

## How Exit Errors Should Be Handled

Exit restrictions should be handled by the **game engine**, not the room data:

**Wrong (Current):**

```json
{
  "exits": {
    "up": "thereisnotreeheresuitableforclimbing"
  }
}
```

**Right (Target):**

```json
{
  "exits": {}
}
```

When a player tries to go in an invalid direction, the game engine should display an appropriate error message, not navigate to a fake room.

## Cleanup After Completion

**Status: Phase 2 is complete. The following items can now be removed:**

### Files to Delete
- ✅ `tools/validate-rooms.ts` - No longer needed (0 issues remain)
- ✅ `tools/apply-canonical-fixes.ts` - All fixes have been applied
- ✅ `tools/canonical-rooms.json` - Data has been applied to rooms.json
- ✅ `tools/extract-canonical-from-zil.ts` - Extraction complete
- ✅ `docs/ROOM-DATA-QUALITY-FIX.md` - This documentation file

### Scripts to Remove from package.json
- ✅ `validate:rooms` - No longer needed
- ✅ `fix:rooms` - No longer needed
- Keep `build:tools` - Still useful for other converter scripts

### Files to Keep
- ✅ `src/app/data/rooms.json` - **Core data file (keep)**
- ✅ `src/app/core/services/room-data-quality.spec.ts` - **Keep for ongoing validation**
- ✅ `tools/converter/` - Keep for future data conversion needs

## Test Results

### Before Phase 2
- 16 tests passing
- 163 validation issues

### After Phase 2  
- **24 tests passing** (8 new characterization tests added)
- **0 validation issues** ✅

## Running the Tools (Historical Reference)

### Validate Rooms

```bash
npm run build:tools
node dist/tools/validate-rooms.js
```

### Apply Canonical Fixes

```bash
npm run build:tools
node dist/tools/apply-canonical-fixes.js
```

### Run Tests

```bash
npm test -- --include='**/room-data-quality.spec.ts'
```

## Canonical Text Sources

Room descriptions sourced from:

1. Original Zork I transcripts (docs/walkthrough\*.md)
2. Historical Infocom game sessions
3. Classic Zork I text adventure (1980-1983)

When in doubt, canonical text follows the principle:

- Use second-person perspective ("You are...")
- Provide spatial orientation (directions, landmarks)
- Mention notable features or objects
- Keep tone consistent with original Infocom style

## Best Practices for Future Data

### Room Descriptions

- ✅ Use complete sentences and proper prose
- ✅ Include orientation information
- ✅ Mention visible exits naturally
- ❌ Don't use comma-separated tokens
- ❌ Don't duplicate the room name as the description
- ❌ Don't use parser artifacts or conditional logic

### Exits

- ✅ Point to valid room IDs (kebab-case)
- ✅ Use cardinal directions (north, south, east, west, up, down, in, out)
- ✅ Verify bidirectional connectivity where appropriate
- ❌ Don't use error messages as destinations
- ❌ Don't use conditional logic in exit values
- ❌ Don't use generic placeholders like "rooms"

### Data Validation

- Run validation before committing changes
- Add tests for new rooms or major changes
- Document any intentional deviations from canonical text
- Update canonical-rooms.json with verified text

## Cleanup After Completion

Once all 163 remaining room data quality issues are fixed and validated (Phase 2 completion), the following temporary files and scripts can be safely deleted:

**Files to delete:**

- `tools/validate-rooms.ts`
- `tools/apply-canonical-fixes.ts`
- `tools/canonical-rooms.json`
- `docs/ROOM-DATA-QUALITY-FIX.md` (this file)

**Scripts to remove from package.json:**

- `validate:rooms`
- `fix:rooms`

The room data quality tests (`room-data-quality.spec.ts`) should be kept as they provide ongoing validation of data integrity.

## References

- [Issue #78](https://github.com/chz160/zork-web/issues/78) - Original issue
- [SYSTEMIC-ISSUES-FOUND.md](../SYSTEMIC-ISSUES-FOUND.md) - Initial findings
- [TRANSCRIPT-VERIFICATION.md](../docs/TRANSCRIPT-VERIFICATION.md) - Testing methodology
- Original Zork I sources: `docs/original-src-c/`
