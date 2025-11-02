# Zork JSON Schemas

This directory contains JSON Schema definitions for the Zork Web game data format.

## Schemas

### `room.schema.json`
Defines the structure for room objects in the game world.

**Key Properties:**
- `id`: Unique identifier (kebab-case)
- `name`: Display name
- `description`: Full description text
- `exits`: Map of directions to room IDs
- `objectIds`: Array of object IDs in this room
- `isDark`: Optional flag for rooms requiring light

### `game-object.schema.json`
Defines the structure for interactive game objects.

**Key Properties:**
- `id`: Unique identifier (kebab-case)
- `name`: Display name
- `aliases`: Alternative names for parsing
- `portable`: Can be taken by player
- `location`: Current room ID or 'inventory'
- `properties`: Flexible state properties (open, locked, lit, etc.)

### `verb.schema.json`
Defines the structure for player commands/actions.

**Key Properties:**
- `name`: Canonical verb name
- `aliases`: Synonyms
- `requiresObject`: Needs direct object?
- `allowsIndirectObject`: Supports "verb X with Y" pattern?

## Usage

These schemas can be used to:

1. **Validate game data** before loading into the engine
2. **Generate TypeScript types** automatically
3. **Document the data format** for contributors
4. **IDE support** with JSON schema validation in editors

## Validation Example

Using a JSON schema validator:

```bash
npm install -g ajv-cli

# Validate a room data file
ajv validate -s docs/schemas/room.schema.json -d src/app/data/rooms/house-area.json

# Validate an object data file
ajv validate -s docs/schemas/game-object.schema.json -d src/app/data/objects/treasures.json
```

## TypeScript Integration

The TypeScript interfaces in `/src/app/core/models/` should match these schemas:

- `room.schema.json` ↔️ `room.model.ts` (Room interface)
- `game-object.schema.json` ↔️ `game-object.model.ts` (GameObject interface)
- `verb.schema.json` ↔️ `verb.model.ts` (Verb interface)

## References

- **Entity Mapping Documentation**: `/docs/reference/entity-mapping.md`
- **Architecture Documentation**: `/docs/architecture.md`
- **JSON Schema Specification**: https://json-schema.org/
