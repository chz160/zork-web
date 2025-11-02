# Zork Web Documentation Index

Welcome to the Zork Web documentation! This index will help you navigate the various documentation resources.

## 🎯 Getting Started

New to the project? Start here:

1. **[Project README](../README.md)** - Overview, installation, and basic usage
2. **[Architecture](architecture.md)** - System design and component structure
3. **[Quick Reference](reference/quick-reference.md)** - Handy lookup guide for common entities and patterns

## 📚 Core Documentation

### Architecture & Design

- **[Architecture](architecture.md)** - System design, layers, and component structure
- **[Conversational Parser](CONVERSATIONAL-PARSER.md)** - Advanced natural language parsing features
- **[Transcript Verification](TRANSCRIPT-VERIFICATION.md)** - Test results comparing engine output with legacy Zork

### Entity Mapping & Game Content

- **[Entity Mapping Guide](reference/entity-mapping.md)** ⭐ *Primary reference for game implementation*
  - Complete catalog of 110+ rooms, 150+ objects, 109 verbs
  - TypeScript/JSON schema mapping for each entity type
  - Edge case handling strategies (containers, light/darkness, NPCs)
  - Implementation phases and data organization plan

- **[Entity Mapping Addendum](reference/entity-mapping-addendum.md)** 🆕 *1980 ZIL & C Source Analysis*
  - Confirms 110 rooms (complete game), 122 objects, 264 verbs
  - Enhanced property system (transparency, capacity, actors)
  - Advanced features: conditional exits, NPC system, multiple light types
  - Backward-compatible extensions to original mapping

- **[Sample Data](reference/sample-data.md)** - Working examples of JSON data files
  - House area rooms (starting location)
  - Starting items and containers
  - Core verb definitions
  - TypeScript loader service examples

- **[Quick Reference](reference/quick-reference.md)** - Developer cheat sheet
  - Starting area quick lookup
  - Common aliases and patterns
  - Testing checklist

### Data Schemas

- **[Schemas](schemas/README.md)** - JSON Schema definitions
  - [Room Schema](schemas/room.schema.json)
  - [GameObject Schema](schemas/game-object.schema.json)
  - [Verb Schema](schemas/verb.schema.json)

## 🏛️ Original Source Materials

Historical reference materials from the original Zork:

- **[Original Source 1980](original-src-1980/README.md)** - MIT MDL/ZIL source code (PDP-10)
- **[Original Source C](original-src-c/README.md)** - C language port
- **[Walkthrough](walkthrough.txt)** - Complete game transcript for testing

## 📖 Implementation Guides

### Conversion & Data Tools

- **[Data Conversion Tool](guides/CONVERTER.md)** - Convert legacy Zork source to JSON format
- **[Conversion Guide](guides/CONVERSION-GUIDE.md)** - Step-by-step conversion process
- **[Conversion Examples](guides/CONVERSION-EXAMPLE.md)** - Sample input/output
- **[C Source Text Analysis](guides/C-SOURCE-TEXT-ANALYSIS.md)** - Understanding C data structures
- **[Data Conversion Status](guides/DATA-CONVERSION-STATUS.md)** - Completed conversion overview
- **[Data Integration](guides/DATA-INTEGRATION.md)** - How converted data loads into the engine

### Feature Guides

- **[Actor System Usage](guides/ACTOR-SYSTEM-USAGE.md)** - Implementing NPC behavior
- **[Message Service](guides/MESSAGE-SERVICE.md)** - Managing game messages
- **[Message Mapping Guide](guides/MESSAGE-MAPPING-GUIDE.md)** - Connecting canonical data with messages
- **[Telemetry Export](guides/TELEMETRY-EXPORT.md)** - Exporting telemetry data
- **[Telemetry Quick Start](guides/TELEMETRY-QUICK-START.md)** - Quick reference for telemetry

### By Implementation Phase

1. **Phase 1: Core Entities**
   - Read: [Entity Mapping - Rooms](reference/entity-mapping.md#rooms)
   - Read: [Entity Mapping - Objects](reference/entity-mapping.md#objects)
   - Read: [Sample Data - House Area](reference/sample-data.md#sample-rooms-house-area)
   - Use schemas for validation

2. **Phase 2: Extended Mechanics**
   - Read: [Entity Mapping - Verbs](reference/entity-mapping.md#verbs)
   - Read: [Edge Cases](reference/entity-mapping.md#edge-cases-and-ambiguities)
   - Reference: [Quick Reference - Special Properties](reference/quick-reference.md#special-properties)

3. **Phase 3: Full World**
   - Read: [Entity Mapping - Complete Entity Lists](reference/entity-mapping.md#appendix-complete-entity-lists)
   - Use: [Walkthrough](walkthrough.txt) for testing
   - Reference: Original source for specific puzzle mechanics

4. **Phase 4: Polish**
   - Read: [Entity Mapping - Timed Events](reference/entity-mapping.md#11-timed-events)
   - Read: [Architecture - Performance](architecture.md#performance-considerations)
   - Test against walkthrough

## 🔍 Finding Information

### "I need to..."

- **Understand the project structure** → [Architecture](architecture.md)
- **Implement a new room** → [Entity Mapping - Rooms](reference/entity-mapping.md#rooms), [Sample Data](reference/sample-data.md#sample-rooms-house-area)
- **Add a new object** → [Entity Mapping - Objects](reference/entity-mapping.md#objects), [Sample Data](reference/sample-data.md#sample-objects-starting-items)
- **Create a new verb handler** → [Entity Mapping - Verbs](reference/entity-mapping.md#verbs)
- **Handle containers** → [Edge Cases - Container Visibility](reference/entity-mapping.md#4-container-visibility)
- **Implement light/darkness** → [Edge Cases - Light and Darkness](reference/entity-mapping.md#5-light-and-darkness)
- **Look up a specific room/object** → [Quick Reference](reference/quick-reference.md)
- **Validate my JSON data** → [Schemas](schemas/README.md)
- **See how Zork works** → [Walkthrough](walkthrough.txt)
- **Check original implementation** → [Original Source 1980](original-src-1980/) or [C Source](original-src-c/)
- **Convert legacy data** → [Conversion Guide](guides/CONVERSION-GUIDE.md)
- **Understand conversational parser** → [Conversational Parser](CONVERSATIONAL-PARSER.md)

### By Entity Type

| Entity | Schema | Examples | Catalog |
|--------|--------|----------|---------|
| Rooms | [room.schema.json](schemas/room.schema.json) | [Sample Data](reference/sample-data.md#sample-rooms-house-area) | [Entity Mapping](reference/entity-mapping.md#cataloged-rooms-from-walkthroughs) |
| Objects | [game-object.schema.json](schemas/game-object.schema.json) | [Sample Data](reference/sample-data.md#sample-objects-starting-items) | [Entity Mapping](reference/entity-mapping.md#object-categories) |
| Verbs | [verb.schema.json](schemas/verb.schema.json) | [Sample Data](reference/sample-data.md#sample-verbs) | [Entity Mapping](reference/entity-mapping.md#cataloged-verbs-by-category) |

## 📖 Reading Order

### For New Contributors

1. [Project README](../README.md) - Understand the project
2. [Architecture](architecture.md) - Learn the system design
3. [Quick Reference](reference/quick-reference.md) - Get familiar with common entities
4. [Sample Data](reference/sample-data.md) - See concrete examples
5. [Entity Mapping](reference/entity-mapping.md) - Deep dive into implementation

### For Implementers

1. [Entity Mapping](reference/entity-mapping.md) - Complete reference
2. [Sample Data](reference/sample-data.md) - Working examples
3. [Schemas](schemas/) - Validation tools
4. [Walkthrough](walkthrough.txt) - Testing reference

### For Researchers/Students

1. [Original Source 1980](original-src-1980/README.md) - Historical context
2. [Walkthrough](walkthrough.txt) - See the game in action
3. [Architecture](architecture.md) - Modern implementation approach
4. [Entity Mapping](reference/entity-mapping.md) - Translation strategy

## 🛠️ Tools & Utilities

### Data Conversion Tool

Convert legacy Zork source code (ZIL format) to TypeScript/JSON:

- **[Data Conversion Tool Documentation](guides/CONVERTER.md)** - Complete usage guide
- **[Conversion Examples](guides/CONVERSION-EXAMPLE.md)** - Sample input/output
- **[Data Conversion Status](guides/DATA-CONVERSION-STATUS.md)** ✅ *Conversion completed - 213 entities converted!*

```bash
# Convert ZIL source files to JSON
npm run convert -- --source docs/original-src-1980 --output src/app/data

# Or convert specific files
npm run convert -- -s docs/original-src-1980/1dungeon.zil -o data -v
```

**Status**: ✅ **Data conversion completed!** The tool has successfully converted 101 rooms and 112 objects from the original Zork source. Converted data files are available in `src/app/data/` and ready for game engine integration. See [guides/DATA-CONVERSION-STATUS.md](guides/DATA-CONVERSION-STATUS.md) for full details.

### Validation

```bash
# Validate JSON data against schemas
ajv validate -s docs/schemas/room.schema.json -d src/app/data/rooms/*.json
```

### Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --code-coverage
```

### Building

```bash
# Development build
npm start

# Production build
npm run build
```

## 🗂️ Documentation Organization

### Folders

- **[adr/](adr/)** - Architecture Decision Records documenting key design decisions
- **[archive/](archive/)** - Historical implementation summaries and completed work documentation
- **[guides/](guides/)** - How-to guides for specific features and tools
- **[reference/](reference/)** - Reference documentation (entity mappings, quick references, samples)
- **[schemas/](schemas/)** - JSON schemas for data validation
- **[actors/](actors/)** - NPC actor implementation documentation
- **[original-src-1980/](original-src-1980/)** - Original Zork ZIL source code
- **[original-src-c/](original-src-c/)** - Original Zork C port source code

## 📝 Contributing to Documentation

When adding or updating documentation:

1. Follow the existing structure and style
2. Add your document to this index
3. Cross-reference related documents
4. Include examples where helpful
5. Update schemas if changing data formats

## 🔗 External Resources

- [Angular Documentation](https://angular.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [JSON Schema](https://json-schema.org/)
- [Original Zork on IFDB](http://ifdb.tads.org/viewgame?id=0dbnusxunq7fw5ro)

---

**Last Updated**: October 23, 2025  
**Maintainer**: Zork Web Team

For questions or suggestions about documentation, please open an issue on GitHub.
