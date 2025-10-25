# Artifact Data Analysis Report

## Summary

- **Canonical Rooms:** 0
- **Current Rooms:** 110
- **Missing Rooms:** 0

- **Canonical Objects:** 2
- **Current Objects:** 120
- **Missing Objects:** 2

- **Total Messages:** 1022

## Rooms Analysis

## Objects Analysis

### Missing Objects (2)

The following objects exist in the canonical data but are missing from current data:

- `a-nasty-looking-troll-brandishing-a-bloody-axe-blocks-all-passages-out-of-the-room`
- `there-is-a-suspicious-looking-individual-holding-a-bag-leaning-against-one-wall-he-is-armed-with-a-vicious-looking-stilletto`

## Recommendations

2. **Add Missing Objects:** 2 objects from the canonical data need to be added to the current data.

## Next Steps

1. Review the canonical data in `artifacts/` directory
2. Create automated scripts to update the current data based on canonical sources
3. Manually review critical gameplay areas (starting rooms, key items, major locations)
4. Update unit tests to validate the corrected data
5. Run integration tests to ensure gameplay still works correctly
