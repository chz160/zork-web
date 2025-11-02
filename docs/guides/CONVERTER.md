# Zork Data Conversion Tool

A command-line tool to convert legacy Zork source code (ZIL format) to TypeScript/JSON schema compatible with the Zork Web engine.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Usage](#usage)
- [Entity Types](#entity-types)
- [Output Format](#output-format)
- [Validation](#validation)
- [Limitations](#limitations)
- [Examples](#examples)

## Overview

The conversion tool parses original Zork source code written in ZIL (Zork Implementation Language) and transforms it into structured JSON files that conform to the TypeScript interfaces used by the Zork Web game engine.

**What it converts:**
- **Rooms**: Location definitions with descriptions, exits, and properties
- **Objects**: Interactive game items with attributes, flags, and behaviors
- **Verbs**: Player commands (coming in future versions)

**Features:**
- Incremental conversion support
- JSON schema validation
- Batch processing of multiple files
- Detailed error and warning reporting
- Configurable output options

## Installation

The tool is built-in and requires no additional installation. Just ensure you have the project dependencies installed:

```bash
npm install
```

## Usage

### Basic Command

```bash
npm run convert -- --source <path-to-zil-files> --output <output-directory>
```

### Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--source` | `-s` | Path to ZIL source file or directory | (required) |
| `--output` | `-o` | Output directory for JSON files | (required) |
| `--entities` | `-e` | Comma-separated entity types (rooms,objects,verbs) | all |
| `--no-validate` | | Skip validation against JSON schemas | validates |
| `--overwrite` | | Overwrite existing output files | false |
| `--verbose` | `-v` | Enable verbose output | false |
| `--help` | `-h` | Show help message | |

### Alternative Usage

You can also build and run the tool directly:

```bash
npm run build:tools
node dist/tools/converter/cli.js --source <path> --output <path>
```

## Entity Types

### Rooms

**Source:** `<ROOM ...>` definitions in ZIL files

**Converts to:** `Room` interface matching `/docs/schemas/room.schema.json`

**Mapped properties:**
- `DESC` → room name and short description
- `LDESC` or `FDESC` → full description
- Direction properties (`NORTH`, `SOUTH`, etc.) → exits map
- `FLAGS` containing `DARK` → `isDark` property

### Objects

**Source:** `<OBJECT ...>` definitions in ZIL files

**Converts to:** `GameObject` interface matching `/docs/schemas/game-object.schema.json`

**Mapped properties:**
- `SYNONYM` → aliases
- `ADJECTIVE` → combined with synonyms for full alias list
- `DESC` → object name
- `LDESC` or `FDESC` → detailed description
- `IN` → initial location
- `FLAGS`:
  - `TAKEBIT` → portable = true
  - `CONTBIT` → container properties
  - `OPENBIT` → isOpen
  - `DOORBIT` → door properties
  - `LIGHTBIT` → light source properties
  - `ONBIT` → isLit
  - `WEAPONBIT` → isWeapon
  - `INVISIBLE` → visible = false
- `VALUE` → treasure value
- `CAPACITY` → container capacity

### Verbs

**Status:** Planned for future implementation

ZIL verb and syntax definitions will be converted to the `Verb` interface in future versions.

## Output Format

The tool generates JSON files in the output directory:

### rooms.json
```json
{
  "rooms": [
    {
      "id": "west-of-house",
      "name": "West of House",
      "description": "You are standing in an open field west of a white house...",
      "shortDescription": "West of House",
      "exits": {
        "north": "north-of-house",
        "south": "south-of-house",
        "east": "behind-house"
      },
      "objectIds": [],
      "visited": false
    }
  ]
}
```

### objects.json
```json
{
  "objects": [
    {
      "id": "brass-lamp",
      "name": "brass lamp",
      "aliases": ["lamp", "lantern", "light", "brass lantern"],
      "description": "A battery-powered brass lantern is here.",
      "portable": true,
      "visible": true,
      "location": "living-room",
      "properties": {
        "isLight": true,
        "isLit": false
      }
    }
  ]
}
```

## Validation

The tool includes built-in validation against the JSON schemas defined in `/docs/schemas/`. 

**Validation checks:**
- Required fields are present
- Field types match schema definitions
- ID format (kebab-case)
- Direction names in exits
- Property types (boolean, number, string, array)

**Handling validation errors:**
- Entities that fail validation are logged as warnings
- Only valid entities are included in output files
- Use `--no-validate` to skip validation (not recommended)

## Limitations

### Current Limitations

1. **Incomplete room exits**: The ZIL format stores exits in various ways. The current parser handles basic direction properties but may miss complex exit logic defined in room action functions.

2. **Object relationships**: Parent-child relationships between objects (containers and contents) are partially converted. The `contains` property is set from ZIL data, but cross-references may need manual adjustment.

3. **Action functions**: ZIL action functions (`ACTION` property) define object behavior but are not converted. These must be implemented in the game engine's verb handlers.

4. **Room descriptions**: ZIL uses both `DESC`, `LDESC`, and `FDESC` properties. The tool prioritizes longer descriptions but may not always select the most appropriate one.

5. **Adjective combinations**: The tool generates alias combinations from adjectives and synonyms, but this may create too many or incorrect aliases in some cases.

6. **Global objects**: ZIL's `LOCAL-GLOBALS` and `GLOBAL-OBJECTS` containers represent objects available in multiple locations. These need special handling in the game engine.

7. **Flags**: Not all ZIL flags have direct equivalents in the TypeScript schema. Some flags are ignored, while others are mapped to custom properties.

8. **Verbs**: Verb conversion is not yet implemented. The tool currently only converts rooms and objects.

### Known Issues

- **Multiline strings**: Complex multiline ZIL strings (especially with embedded formatting) may not parse correctly
- **Special characters**: Some ZIL special characters and escape sequences may not be handled
- **Comments**: ZIL comments starting with `;` are stripped, which may remove useful documentation

## Examples

### Convert all entities from the 1980 source

```bash
npm run convert -- \
  --source docs/original-src-1980 \
  --output src/app/data \
  --verbose
```

### Convert only rooms from a specific file

```bash
npm run convert -- \
  -s docs/original-src-1980/1dungeon.zil \
  -o src/app/data/converted \
  -e rooms \
  -v
```

### Convert without validation (faster, but risky)

```bash
npm run convert -- \
  --source docs/original-src-1980 \
  --output output/test \
  --no-validate
```

### Overwrite existing files

```bash
npm run convert -- \
  --source docs/original-src-1980/1dungeon.zil \
  --output src/app/data \
  --overwrite
```

### Convert multiple files incrementally

```bash
# First batch
npm run convert -- -s docs/original-src-1980/1dungeon.zil -o data/batch1

# Second batch  
npm run convert -- -s docs/original-src-1980/gverbs.zil -o data/batch2

# Merge manually or use separate data directories
```

## Manual Review Required

After conversion, you should manually review the output files for:

1. **Room exits**: Verify all room connections are correct
2. **Object locations**: Ensure objects are placed in the correct initial rooms
3. **Object properties**: Check that container contents, light sources, and other properties are accurate
4. **Descriptions**: Review for formatting issues or missing content
5. **Aliases**: Remove any incorrect or redundant aliases
6. **Cross-references**: Verify object IDs match room objectIds arrays

## Integration with Game Engine

To use the converted data in your game:

1. Run the conversion tool to generate JSON files
2. Place output files in `src/app/data/`
3. Create a data loader service to read the JSON files
4. Initialize the game engine with the loaded data:

```typescript
// In your data loader service
async loadGameData() {
  const rooms = await import('./data/rooms.json');
  const objects = await import('./data/objects.json');
  
  rooms.rooms.forEach(room => this.gameEngine.addRoom(room));
  objects.objects.forEach(obj => this.gameEngine.addObject(obj));
}
```

## Troubleshooting

### "No ZIL files found"
- Ensure source path points to a directory or file with `.zil` extension
- Check file permissions

### "File already exists"
- Use `--overwrite` flag or delete existing files manually

### Validation errors
- Review the warning messages for specific issues
- Check the entity definition in the source ZIL file
- Use `--verbose` for more details
- Consult `/docs/schemas/` for schema requirements

### Parse errors
- ZIL syntax may be complex or malformed
- Try converting individual files to isolate the problem
- Report persistent issues with the problematic ZIL code

## Future Enhancements

Planned improvements:
- [ ] Verb and syntax conversion
- [ ] Support for additional ZIL constructs (globals, routines)
- [ ] Better handling of action functions (possibly convert to documentation)
- [ ] Improved multiline string parsing
- [ ] Support for C source format conversion
- [ ] Interactive mode for resolving ambiguities
- [ ] Diff tool to compare converted output with source

## Contributing

If you find issues or want to improve the converter:

1. Test with specific ZIL files and document failures
2. Add test cases for edge cases
3. Improve entity mapping in `entity-converter.ts`
4. Enhance the ZIL parser in `zil-parser.ts`
5. Update this documentation with new features or limitations

## References

- [Entity Mapping Guide](/docs/reference/entity-mapping.md) - Complete mapping reference
- [JSON Schemas](/docs/schemas/) - Output format specifications
- [ZIL Language Reference](https://www.inform-fiction.org/zmachine/standards/) - ZIL documentation
- [Original Zork Source](/docs/original-src-1980/) - Sample source code
