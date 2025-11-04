# Legacy ZIL Migration Documentation

This directory contains migration guides and reference documentation for converting legacy Zork ZIL (Zork Implementation Language) code to the new TypeScript/Angular implementation.

## Documents

### [Thief Migration Guide](./thief-migration.md)

Comprehensive mapping of the legacy thief system (ROBBER/THIEF actor) from the original 1980 ZIL source code to the new TypeScript implementation.

**Contents:**

- Complete reference of all 15 legacy thief routines with source locations
- Line-by-line mapping from ZIL to TypeScript
- State management and probability system migration
- QA parity testing checklist (50+ test cases)
- Known gaps and implementation TODOs
- Quick reference tables for constants, files, and locations

**Use Cases:**

- Implementing remaining thief behavior (onTick, onEncounter)
- Verifying behavioral parity with original game
- Understanding legacy code structure and intent
- QA testing of thief system
- Onboarding new developers to thief implementation

---

## Background: Why This Directory?

The original Zork game was written in 1980 using ZIL (Zork Implementation Language), a dialect of MDL (a predecessor to Lisp). The source code is preserved in `docs/original-src-1980/` for reference.

This new implementation uses TypeScript and Angular, requiring careful translation to maintain the original game's behavior while modernizing the architecture. These migration guides serve as:

1. **Rosetta Stone**: Direct mappings between legacy and new code
2. **Specification**: Authoritative source for "how it should work"
3. **QA Reference**: Comprehensive test cases for parity validation
4. **Historical Context**: Understanding why original code was structured as it was

---

## Related Documentation

### Thief System

- [ThiefActor Implementation](../actors/THIEF-ACTOR.md) - Technical documentation of the new TypeScript class
- [Thief Configuration Guide](../THIEF-DIFFICULTY-CONFIG.md) - Configurable behavior and difficulty modes
- [Thief Probability Test Harness](../THIEF-PROBABILITY-TEST-HARNESS.md) - Deterministic testing infrastructure

### Legacy Source Code

- `docs/original-src-1980/1actions.zil` - Original action routines including thief behavior
- `docs/original-src-1980/1dungeon.zil` - Original object definitions including THIEF
- `docs/original-src-1980/gmain.zil` - Main game loop and interrupt system

### Architecture

- [Architecture Overview](../architecture.md) - High-level system design
- [Actor System Usage](../guides/ACTOR-SYSTEM-USAGE.md) - Actor pattern documentation

---

## Contributing

When adding new migration guides to this directory:

1. **Follow the Template**: Use the thief migration guide structure as a template
2. **Document Thoroughly**: Include source locations, line numbers, and behavior descriptions
3. **Map Completely**: Show both legacy and new implementations side-by-side
4. **Create Checklists**: Provide actionable QA test cases
5. **Track TODOs**: Document gaps and implementation priorities
6. **Cross-Reference**: Link to related documentation

### Naming Convention

Migration guides should follow this pattern:

- `{system-name}-migration.md` - e.g., `thief-migration.md`, `troll-migration.md`
- Focus on significant game systems or actors
- One guide per major legacy component/subsystem

---

## Future Migration Guides

Potential candidates for future documentation:

- **Troll Migration** - TROLL actor and bridge behavior
- **Treasure System Migration** - TROPHY-CASE and scoring
- **Combat System Migration** - FIGHT-STRENGTH and weapon interactions
- **Magic System Migration** - Spell casting and effects
- **Maze System Migration** - Maze generation and navigation
- **Parser Migration** - Command parsing and verb handling
- **Light System Migration** - Light sources and darkness mechanics

---

**Directory Created**: 2025-11-03  
**Maintainer**: Development Team
