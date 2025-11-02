# ADR 001: Integration of Conversational Parser Infrastructure

## Status
Accepted

## Context
The Zork Web game needed enhanced natural language processing capabilities to improve player experience. While individual utilities for fuzzy matching, object resolution, multi-command parsing, and telemetry existed (delivered in PR #66), they were not integrated into the main parser and game engine, leaving players without these improvements.

Players faced several limitations:
1. **No typo tolerance** - Misspelled commands like "tak lamp" failed completely
2. **No multi-command support** - Players couldn't chain actions like "open mailbox and take leaflet"
3. **Poor object resolution** - Ambiguous or slightly misspelled object names weren't handled gracefully
4. **No analytics** - No visibility into parser accuracy, common errors, or player behavior patterns

## Decision
We integrated four key utilities into the command parser and game engine:

### 1. FuzzyMatcher in CommandParserService
- **What**: Integrated Levenshtein distance-based fuzzy matching for verb recognition
- **Where**: CommandParserService.findVerb()
- **How**: 
  - Try exact match first (performance optimization)
  - Fall back to fuzzy matching if no exact match
  - Auto-correct at ≥0.85 similarity threshold
  - Suggest corrections at ≥0.70 similarity threshold
  - Log all attempts via TelemetryService

### 2. ObjectResolverService in GameEngineService
- **What**: Integrated advanced object resolution with fuzzy matching and disambiguation
- **Where**: GameEngineService.findObject() and findObjectInInventory()
- **How**:
  - Try exact match first (performance optimization)
  - Fall back to ObjectResolverService.resolve() if no exact match
  - Support ordinal selection ("2nd coin")
  - Handle disambiguation (multiple candidates)
  - Rank candidates by context (room > inventory > all)
  - Log resolution attempts and disambiguation via TelemetryService

### 3. MultiCommandSplitter in GameService
- **What**: Integrated multi-command parsing and sequential execution
- **Where**: GameService.submitCommand()
- **How**:
  - Split input on configurable separators (and/then/,)
  - Parse each sub-command independently
  - Execute sequentially via game engine
  - Propagate game state between commands
  - Support configurable execution policies (best-effort / fail-fast)
  - Log multi-command executions via TelemetryService

### 4. TelemetryService Throughout
- **What**: Comprehensive event logging for parser and execution flow
- **Where**: CommandParserService, ObjectResolverService, GameService
- **How**:
  - Non-blocking fire-and-forget logging
  - Rich event metadata for analysis
  - Configurable enable/disable
  - Events: parse success/failure, fuzzy matches, autocorrect, disambiguation, multi-command

## Consequences

### Positive
1. **Improved Player Experience**
   - Typo-tolerant commands reduce frustration
   - Multi-command support enables natural action sequences
   - Better error messages guide players

2. **Enhanced Analytics**
   - Comprehensive telemetry enables data-driven improvements
   - Identify common typos and add aliases
   - Track parser accuracy over time

3. **Maintainable Architecture**
   - Separation of concerns maintained (utilities → services → UI)
   - Services remain testable and focused
   - Configuration-driven behavior (no code changes for threshold tuning)

4. **Performance**
   - Exact match first strategy keeps common case fast
   - Fuzzy matching only on miss
   - Non-blocking telemetry
   - No impact on single-command performance

5. **Future-Ready**
   - ObjectResolver supports disambiguation UI (not yet implemented)
   - Telemetry enables machine learning features (future)
   - Multi-command supports complex workflows (future)

### Negative
1. **Increased Complexity**
   - More code paths to test
   - More configuration options to document
   - Parser behavior less deterministic (fuzzy matching introduces variance)

2. **Potential for Confusion**
   - Auto-correction might surprise players expecting errors
   - Multi-command splitting on "and" might split object names ("bread and butter")
   - Current workaround: document behavior and rely on context

3. **Performance Trade-offs**
   - Fuzzy matching adds latency on misses (mitigated by caching, but not implemented)
   - Multi-command parsing adds overhead (minimal, but measurable)

### Mitigation Strategies
1. **Testing**: 122 comprehensive tests covering all new behaviors
2. **Configuration**: All thresholds tunable via JSON config
3. **Documentation**: Detailed docs in CONVERSATIONAL-PARSER.md
4. **Telemetry**: Track issues via logging and iterate

## Alternatives Considered

### Alternative 1: No Integration (Status Quo)
- **Pros**: Zero risk, no changes
- **Cons**: Poor player experience, no improvements, missed opportunity
- **Rejected**: Benefits outweigh risks

### Alternative 2: UI-Level Integration
- **Pros**: Easier to implement, less engine complexity
- **Cons**: Duplicate logic across components, inconsistent behavior, harder to test
- **Rejected**: Violates separation of concerns

### Alternative 3: LLM-Based Parser
- **Pros**: Maximum flexibility, natural language understanding
- **Cons**: Requires external API, cost, latency, non-deterministic, complex integration
- **Rejected**: Overkill for deterministic parser needs

### Alternative 4: Rule-Based Only (No Fuzzy Matching)
- **Pros**: Deterministic, simple
- **Cons**: Poor UX for typos, requires manual synonym addition
- **Rejected**: Fuzzy matching provides better UX with acceptable complexity

## Implementation Details

### Architecture Diagram
```
┌─────────────────┐
│   GameService   │  ← Multi-command splitting
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ CommandParser   │  ← Fuzzy verb matching
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  GameEngine     │  ← Object resolution
└────────┬────────┘
         │
         ↓ (all services)
┌─────────────────┐
│  Telemetry      │  ← Event logging
└─────────────────┘
```

### Configuration (command-config.json)
```json
{
  "parserSettings": {
    "fuzzyMatchThreshold": 0.7,
    "autoCorrectThreshold": 0.85,
    "maxDisambiguationCandidates": 5,
    "multiCommandSeparators": ["and", "then", ","],
    "multiCommandPolicy": "best-effort"
  }
}
```

### Test Coverage
- CommandParserService: 113 tests (5 new fuzzy matching tests)
- Multi-command integration: 9 tests
- All utilities already have comprehensive test coverage from PR #66
- Total: 122 tests passing

## References
- PR #66: Original utilities implementation
- docs/CONVERSATIONAL-PARSER.md: User-facing documentation
- Issue: Phase 5 integration tracking issue

## Date
2025-10-24

## Author
GitHub Copilot (with human oversight)
