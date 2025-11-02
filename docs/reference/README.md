# Reference Documentation

This folder contains reference materials for implementing game content, including entity mappings, quick references, and example data.

## Contents

### Entity Mapping

- **[entity-mapping.md](entity-mapping.md)** ⭐ **Primary reference** for implementing game content
  - Complete catalog of 110+ rooms, 150+ objects, 109 verbs
  - TypeScript/JSON schema mapping for each entity type
  - Edge case handling strategies (containers, light/darkness, NPCs)
  - Implementation phases and data organization plan

- **[entity-mapping-addendum.md](entity-mapping-addendum.md)** - Extended analysis from 1980 ZIL and C sources
  - Confirms 110 rooms (complete game), 122 objects, 264 verbs
  - Enhanced property system (transparency, capacity, actors)
  - Advanced features: conditional exits, NPC system, multiple light types
  - Backward-compatible extensions to original mapping

### Quick References

- **[quick-reference.md](quick-reference.md)** - Developer cheat sheet
  - Starting area quick lookup
  - Common aliases and patterns
  - Testing checklist
  - Quick entity lookups for common game elements

### Example Data

- **[sample-data.md](sample-data.md)** - Working examples of JSON data files
  - House area rooms (starting location)
  - Starting items and containers
  - Core verb definitions
  - TypeScript loader service examples

## Usage

### For Implementing New Content

1. Start with **[entity-mapping.md](entity-mapping.md)** to understand the entity type you're implementing
2. Reference **[sample-data.md](sample-data.md)** for JSON structure examples
3. Use **[quick-reference.md](quick-reference.md)** for quick lookups

### For Understanding the Game World

- **[entity-mapping.md](entity-mapping.md)** contains complete catalogs of rooms, objects, and verbs
- **[entity-mapping-addendum.md](entity-mapping-addendum.md)** provides deeper analysis from original sources

### For Validation

All examples in this folder follow the JSON schemas defined in **[../schemas/](../schemas/)**.

## Related Documentation

- **[Schemas](../schemas/)** - JSON schema definitions for validation
- **[Guides](../guides/)** - How-to guides for data conversion and integration
- **[Architecture](../architecture.md)** - System design and patterns
