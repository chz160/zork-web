# Zork Web Documentation Index

Welcome to the Zork Web documentation! This index will help you navigate the various documentation resources.

## 🎯 Getting Started

New to the project? Start here:

1. **[Project README](../README.md)** - Overview, installation, and basic usage
2. **[Quick Reference](quick-reference.md)** - Handy lookup guide for common entities and patterns
3. **[Architecture](architecture.md)** - System design and component structure

## 📚 Core Documentation

### Entity Mapping & Game Content

- **[Entity Mapping Guide](entity-mapping.md)** ⭐ *Primary reference for game implementation*
  - Complete catalog of 110+ rooms, 150+ objects, 109 verbs
  - TypeScript/JSON schema mapping for each entity type
  - Edge case handling strategies (containers, light/darkness, NPCs)
  - Implementation phases and data organization plan

- **[Sample Data](sample-data.md)** - Working examples of JSON data files
  - House area rooms (starting location)
  - Starting items and containers
  - Core verb definitions
  - TypeScript loader service examples

- **[Quick Reference](quick-reference.md)** - Developer cheat sheet
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

- **[Original Source 1977](original-src-1977/README.md)** - MIT MDL source code (PDP-10)
- **[Original Source 1980](original-src-1980/README.md)** - Later MDL version
- **[Original Source C](original-src-c/README.md)** - C language port

### Walkthroughs

Complete game transcripts for testing and reference:

- **[Walkthrough 1](walkthrough1.md)** - Basic playthrough
- **[Walkthrough 2](walkthrough2.md)** - Detailed ClubFloyd transcript (68k+ lines!)
- **[Walkthrough 3](walkthrough3.md)** - Alternative approach

## 🏗️ Implementation Guides

### By Topic

| Topic | Document | Purpose |
|-------|----------|---------|
| **Architecture** | [architecture.md](architecture.md) | System design, layers, patterns |
| **Entity Mapping** | [entity-mapping.md](entity-mapping.md) | Room/object/verb definitions |
| **Data Format** | [sample-data.md](sample-data.md) | JSON examples and loaders |
| **Validation** | [schemas/](schemas/) | JSON schemas for data validation |
| **Quick Lookup** | [quick-reference.md](quick-reference.md) | Common patterns and entities |

### By Implementation Phase

1. **Phase 1: Core Entities**
   - Read: [Entity Mapping - Rooms](entity-mapping.md#rooms)
   - Read: [Entity Mapping - Objects](entity-mapping.md#objects)
   - Read: [Sample Data - House Area](sample-data.md#sample-rooms-house-area)
   - Use schemas for validation

2. **Phase 2: Extended Mechanics**
   - Read: [Entity Mapping - Verbs](entity-mapping.md#verbs)
   - Read: [Edge Cases](entity-mapping.md#edge-cases-and-ambiguities)
   - Reference: [Quick Reference - Special Properties](quick-reference.md#special-properties)

3. **Phase 3: Full World**
   - Read: [Entity Mapping - Complete Entity Lists](entity-mapping.md#appendix-complete-entity-lists)
   - Use: [Walkthroughs](walkthrough1.md) for testing
   - Reference: Original source for specific puzzle mechanics

4. **Phase 4: Polish**
   - Read: [Entity Mapping - Timed Events](entity-mapping.md#11-timed-events)
   - Read: [Architecture - Performance](architecture.md#performance-considerations)
   - Test against all walkthroughs

## 🔍 Finding Information

### "I need to..."

- **Understand the project structure** → [Architecture](architecture.md)
- **Implement a new room** → [Entity Mapping - Rooms](entity-mapping.md#rooms), [Sample Data](sample-data.md#sample-rooms-house-area)
- **Add a new object** → [Entity Mapping - Objects](entity-mapping.md#objects), [Sample Data](sample-data.md#sample-objects-starting-items)
- **Create a new verb handler** → [Entity Mapping - Verbs](entity-mapping.md#verbs)
- **Handle containers** → [Edge Cases - Container Visibility](entity-mapping.md#4-container-visibility)
- **Implement light/darkness** → [Edge Cases - Light and Darkness](entity-mapping.md#5-light-and-darkness)
- **Look up a specific room/object** → [Quick Reference](quick-reference.md)
- **Validate my JSON data** → [Schemas](schemas/README.md)
- **See how Zork works** → [Walkthroughs](walkthrough1.md)
- **Check original implementation** → [Original Source 1977](original-src-1977/)

### By Entity Type

| Entity | Schema | Examples | Catalog |
|--------|--------|----------|---------|
| Rooms | [room.schema.json](schemas/room.schema.json) | [Sample Data](sample-data.md#sample-rooms-house-area) | [Entity Mapping](entity-mapping.md#cataloged-rooms-from-walkthroughs) |
| Objects | [game-object.schema.json](schemas/game-object.schema.json) | [Sample Data](sample-data.md#sample-objects-starting-items) | [Entity Mapping](entity-mapping.md#object-categories) |
| Verbs | [verb.schema.json](schemas/verb.schema.json) | [Sample Data](sample-data.md#sample-verbs) | [Entity Mapping](entity-mapping.md#cataloged-verbs-by-category) |

## 📖 Reading Order

### For New Contributors

1. [Project README](../README.md) - Understand the project
2. [Architecture](architecture.md) - Learn the system design
3. [Quick Reference](quick-reference.md) - Get familiar with common entities
4. [Sample Data](sample-data.md) - See concrete examples
5. [Entity Mapping](entity-mapping.md) - Deep dive into implementation

### For Implementers

1. [Entity Mapping](entity-mapping.md) - Complete reference
2. [Sample Data](sample-data.md) - Working examples
3. [Schemas](schemas/) - Validation tools
4. [Walkthroughs](walkthrough1.md) - Testing reference

### For Researchers/Students

1. [Original Source 1977](original-src-1977/README.md) - Historical context
2. [Walkthroughs](walkthrough2.md) - See the game in action
3. [Architecture](architecture.md) - Modern implementation approach
4. [Entity Mapping](entity-mapping.md) - Translation strategy

## 🛠️ Tools & Utilities

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
