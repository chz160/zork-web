# Suggested GitHub Issue: Convert ZIL Data to JSON

## Issue Title
Convert legacy Zork ZIL data to TypeScript/JSON using conversion tool

## Issue Type
- Type: Enhancement / Task
- Labels: `data`, `conversion`, `enhancement`
- Milestone: (as appropriate for your project)

## Description

Use the data conversion tool created in issue #13 (PR #54) to convert the legacy Zork source code from ZIL format to TypeScript/JSON format for use in the game engine.

### Context

The conversion tool was successfully implemented in PR #54 and is fully functional. It includes:
- ZIL parser for reading original Zork source files
- Entity converter for transforming rooms and objects
- JSON schema validator
- CLI interface with comprehensive options
- Full documentation in `/docs/CONVERTER.md`

However, **the tool has not yet been run** to perform the actual data conversion. The original ZIL source files are available in `docs/original-src-1980/` but no converted JSON files exist in the repository.

### Goals

1. Convert the legacy ZIL source files to JSON format
2. Generate `rooms.json` and `objects.json` in `src/app/data/`
3. Validate the converted data
4. Document any issues or manual adjustments needed
5. Ensure the converted data is ready for game engine integration

## Acceptance Criteria

- [ ] Run the conversion tool on ZIL source files from `docs/original-src-1980/`
- [ ] Generate `rooms.json` containing all room definitions with:
  - Valid room IDs in kebab-case format
  - Complete descriptions and exits
  - Proper room properties
- [ ] Generate `objects.json` containing all object definitions with:
  - Valid object IDs in kebab-case format
  - Complete aliases, descriptions, and properties
  - Correct initial locations
- [ ] All converted entities pass JSON schema validation
- [ ] Manual review completed for:
  - Room connectivity (all exits lead to valid rooms)
  - Object placements and properties
  - Description formatting and completeness
- [ ] Document any conversion issues or limitations found
- [ ] Update documentation if any manual adjustments were needed

## Tasks

### Initial Conversion
- [ ] Run conversion tool: `npm run convert -- --source docs/original-src-1980 --output src/app/data --verbose`
- [ ] Review conversion summary output (processed/converted counts, warnings, errors)
- [ ] Commit generated JSON files to repository

### Validation and Review
- [ ] Verify all required fields are present in generated JSON files
- [ ] Check room exits map correctly (no broken connections)
- [ ] Validate object locations reference existing rooms
- [ ] Review object properties (containers, lights, etc.)
- [ ] Check for any validation warnings or errors
- [ ] Test a sample of entities against the game engine

### Documentation
- [ ] Document any issues found during conversion
- [ ] Note any manual adjustments made to the output
- [ ] Update CONVERTER.md if new limitations are discovered
- [ ] Create integration guide for loading data into game engine

### Optional Enhancements
- [ ] Create data integrity tests to validate relationships between rooms/objects
- [ ] Add data loading service to game engine
- [ ] Consider incremental conversion if full conversion has issues

## Technical Details

### Command to Run

```bash
# Full conversion with validation
npm run convert -- --source docs/original-src-1980 --output src/app/data --verbose

# Or convert main dungeon file first
npm run convert -- -s docs/original-src-1980/1dungeon.zil -o src/app/data -v
```

### Expected Output

Based on previous test runs, expect:
- **~107 rooms** from dungeon definitions
- **~119 objects** with various properties
- Validated output in JSON format
- Any warnings about validation issues

### Source Files

Available in `docs/original-src-1980/`:
- `1dungeon.zil` - Primary source (rooms and objects)
- `1actions.zil` - Action handlers (may contain additional logic)
- Other ZIL files as needed

### Output Location

Generated files should be placed in:
- `src/app/data/rooms.json`
- `src/app/data/objects.json`

## Dependencies

- Requires: PR #54 (conversion tool) - ✅ Merged
- Blocks: Game engine data integration
- Blocks: Full game implementation

## Estimated Effort

- Tool execution: 5 minutes
- Initial review: 1-2 hours
- Validation and testing: 2-3 hours
- Documentation: 1 hour
- **Total**: 4-6 hours

## Notes

- The conversion tool has been tested and works correctly
- Some manual review will be needed to ensure data quality
- Edge cases or complex ZIL constructs may require manual adjustment
- See `/docs/CONVERTER.md` for full tool documentation
- See `/docs/DATA-CONVERSION-STATUS.md` for background on why this issue is needed

## References

- Original tool issue: #13
- Tool implementation PR: #54
- Documentation: `/docs/CONVERTER.md`
- Status document: `/docs/DATA-CONVERSION-STATUS.md`
