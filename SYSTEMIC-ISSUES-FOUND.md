# Systemic Issues Found During Startup Prompt Fix

## Issue Context
While fixing the startup prompt for West Of House (Issue: "Startup prompt displays location twice and omits expected details"), several systemic data quality issues were discovered in `src/app/data/rooms.json`.

## Issues Found

### 1. Malformed Room Descriptions
**Affected Rooms:**
- `north-of-house`
- `south-of-house`

**Problem:**
Room descriptions contain comma-separated values instead of proper text:
```json
{
  "id": "north-of-house",
  "description": "and,all,the,windows,are,boarded,up.,To,the,north,a,narrow,path,winds,through,the,trees.\""
}
```

**Expected Format:**
```json
{
  "id": "north-of-house",
  "description": "You are facing the north side of a white house. There is no door here, and all the windows are boarded up. To the north a narrow path winds through the trees."
}
```

### 2. Invalid Exit Destinations
**Affected Rooms:**
- `west-of-house` (FIXED in this PR)
- `north-of-house`
- `south-of-house`
- Multiple forest rooms

**Problem:**
Exits point to invalid room IDs that appear to be error messages or string concatenations:
```json
{
  "exits": {
    "east": "thedoorisboardedandyoucantremovetheboards",
    "south": "thewindowsareallboarded"
  }
}
```

**Expected Format:**
```json
{
  "exits": {
    "north": "north-of-house",
    "south": "south-of-house",
    "east": "behind-house"
  }
}
```

### 3. Incomplete Room Descriptions
**Affected Rooms:**
- `west-of-house` (FIXED in this PR)
- `east-of-house`

**Problem:**
Room descriptions are too short or duplicate the room name:
```json
{
  "id": "east-of-house",
  "description": "Behind House"
}
```

### 4. Missing Canonical Text
**Scope:** Multiple rooms throughout the game

**Problem:**
The conversion from C/ZIL source to JSON appears to have corrupted or incompletely translated room descriptions. The canonical Zork text is not preserved.

## Root Cause Analysis

The issues appear to stem from the data conversion process (tools/converter). Possible causes:
1. String parsing errors during conversion
2. Incorrect handling of quoted strings or escape sequences
3. Malformed source data or parser bugs
4. Incomplete mapping of C/ZIL structures to JSON

## Recommendations

### Immediate Actions (High Priority)
1. ✅ **West Of House** - FIXED in this PR
2. Review and fix North/South/East of House rooms
3. Audit all room exits for invalid destinations
4. Validate room descriptions against canonical Zork transcripts

### Long-term Solutions (Medium Priority)
1. Run the data converter with verbose logging to identify conversion errors
2. Create validation scripts to detect:
   - Malformed descriptions (commas as separators)
   - Invalid room IDs in exits
   - Missing or truncated descriptions
3. Implement schema validation in the data loader service
4. Add integration tests that verify key room descriptions match canonical text

### Data Integrity (Low Priority)
1. Source canonical Zork transcripts or ZIL files
2. Re-convert or manually verify all room data
3. Document the expected format in CONVERSION-EXAMPLE.md
4. Add pre-commit hooks to validate room/object JSON files

## Fix Applied in This PR

### West Of House - Fixed ✅
- **Description:** Updated to canonical text with mailbox mention
- **Exits:** Fixed to point to valid room IDs (north, south, east)
- **Objects:** Mailbox marked as non-portable fixture
- **Rendering:** Modified to match canonical Zork format

### Test Coverage Added
- 5 new characterization tests for startup prompt
- Tests verify room name appears once
- Tests verify full canonical description is shown
- Tests verify no duplicate output

## Next Steps

1. Create follow-up issues for:
   - North/South/East of House room fixes
   - Forest room exit corrections
   - Complete room data audit
2. Consider creating a data validation tool
3. Document canonical Zork format expectations

## Related Files
- `src/app/data/rooms.json` - Room data (partially fixed)
- `src/app/data/objects.json` - Object data (mailbox fixed)
- `src/app/core/services/game-engine.service.ts` - Rendering logic (improved)
- `tools/converter/` - Data conversion tools (needs investigation)

---

**Created:** 2025-10-24
**Issue:** Startup prompt displays location twice and omits expected details
**PR:** Fix startup prompt displaying location twice and omitting expected details
