# Phase 4 Objects Status - Cherry-pick from PR #96

## Summary

Successfully cherry-picked PR #96 commits which completed Phase 3 object population. The `artifacts/objects.canonical.populated.json` file is now available with all 216 objects populated.

## Current Status

### ✅ What Works
- Cherry-picked PR #96 successfully (commit d7218ec)
- Updated `extract-new-content.ts` to use populated objects file
- Tool now runs without errors
- Extraction tool identifies 96 missing objects (indices 120-215)

### ❌ Blocker: Data Quality Issues

The canonical objects data has a **critical data quality issue** documented in PR #96:

> **Source `objects.canonical.json` contains incorrect message indices pointing to room descriptions rather than object descriptions.**

This causes objects to have incorrect names like:
- "You Are Outside A" (actually a room description)
- "Water Level Is Now" (game message, not object name)
- "Way Through The Gate" (room description fragment)

### Impact

The 96 "missing" objects (indices 120-215) cannot be automatically added because:
1. Names are wrong/misleading (would confuse players)
2. Name-based matching fails (names don't match reality)
3. Manual correction required for each object

## Extraction Results

```json
{
  "currentObjects": 120,
  "canonicalObjects": 216,
  "newObjectsCount": 216  // All 216 marked as "new" (matching failed)
}
```

The tool sees all 216 canonical objects as "new" because the wrong names don't match any current object names.

## Recommendations

### Option 1: Manual Object Creation (Pragmatic)
- Review the 96 missing objects manually
- Extract correct names from game walkthroughs/documentation
- Create objects with proper names and properties
- Time estimate: 2-4 hours for 96 objects

### Option 2: Fix Canonical Source (Correct but Time-Consuming)
- Debug C source extraction to get correct message indices
- Re-run Phase 3 population with correct indices
- Re-run Phase 4 extraction and merge
- Time estimate: 4-8 hours debugging + testing

### Option 3: Hybrid Approach (Recommended)
- Focus Phase 4 on rooms (✅ already completed - 244 rooms)
- Document object blocker clearly
- Create Phase 4.5 or Phase 5 subtask for object manual review
- Allows Phase 4 to be "complete" for rooms while acknowledging objects need separate effort

## Files Changed

- `tools/extract-new-content.ts`: Updated to use `objects.canonical.populated.json`
- Cherry-picked from PR #96:
  - `artifacts/objects.canonical.populated.json` (new)
  - `PHASE-3-OBJECT-POPULATION-STATUS.md` (new)
  - `artifacts/rooms.canonical.populated.json` (updated)
  - `tools/populate-canonical-data.ts` (enhanced)

## Conclusion

While PR #96 unblocked the technical ability to process objects, the underlying data quality issues prevent automatic addition of the 96 missing objects. **Phase 4 successfully completed its primary objective of expanding room content (110→244, +122%)**, but object expansion requires additional work beyond what automated tools can provide given the current canonical data quality.

The most pragmatic path forward is to accept Phase 4 as complete for rooms and defer object manual review to a future phase.
