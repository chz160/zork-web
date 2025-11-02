# Architecture Decision Records (ADRs)

This folder contains Architecture Decision Records documenting significant architectural decisions made in the Zork Web project.

## What are ADRs?

Architecture Decision Records capture important architectural decisions along with their context and consequences. They help the team understand:
- **Why** a decision was made
- **What** alternatives were considered
- **When** the decision was made
- **Who** was involved
- **What** the expected consequences are

## Current ADRs

### ADR-001: Conversational Parser Integration

**[ADR-001-conversational-parser-integration.md](ADR-001-conversational-parser-integration.md)**

Documents the decision to enhance the command parser with conversational features including:
- Fuzzy matching for typo tolerance
- Phrasal verb support ("look in", "pick up")
- Pronoun resolution ("it", "them")
- Multi-command parsing
- Disambiguation UI

**Status:** Accepted  
**Date:** 2025  
**Impact:** Improved user experience with natural language input

## ADR Format

Each ADR follows this structure:
1. **Title** - Short descriptive name
2. **Status** - Proposed, Accepted, Deprecated, or Superseded
3. **Context** - The situation and problem being addressed
4. **Decision** - The architectural decision made
5. **Consequences** - Expected positive and negative outcomes
6. **Alternatives Considered** - Other options that were evaluated

## Creating New ADRs

When making significant architectural decisions:
1. Create a new file: `ADR-XXX-short-title.md`
2. Use the next sequential number
3. Follow the format of existing ADRs
4. Update this README to list the new ADR
5. Link to the ADR from relevant documentation

## Related Documentation

- **[Architecture](../architecture.md)** - Overall system architecture
- **[Guides](../guides/)** - Implementation guides that follow these decisions
- **[Archive](../archive/)** - Historical context for past decisions
