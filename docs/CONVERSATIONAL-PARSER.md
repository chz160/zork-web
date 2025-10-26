# Conversational Command Parser

The Zork Web command parser has been enhanced to support natural, conversational language patterns, making player interaction more intuitive and immersive.

## Features

### 1. Fuzzy Matching for Verbs and Objects

The parser now uses fuzzy string matching to handle typos and provide helpful suggestions:

**Verb Fuzzy Matching:**
- Auto-corrects typos with high confidence (≥85% similarity)
- Suggests corrections for medium confidence matches (≥70% similarity)
- Provides alternatives when no good match is found

**Examples:**
- `tak lamp` → auto-corrects to `take lamp` (high confidence)
- `examin mailbox` → auto-corrects to `examine mailbox`
- `graab` → suggests `grab`, `get`, `take`

**Object Fuzzy Matching:**
- Uses ObjectResolverService to find objects with typos
- Ranks matches by context (room objects > inventory > other objects)
- Handles aliases and partial matches

**Configuration:** (in `command-config.json`)
```json
{
  "parserSettings": {
    "fuzzyMatchThreshold": 0.7,        // Minimum similarity to consider
    "autoCorrectThreshold": 0.85,      // Auto-accept above this score
    "maxDisambiguationCandidates": 5   // Max suggestions to show
  }
}
```

### 2. Multi-Command Support

Players can chain multiple commands together using natural conjunctions:

**Supported Separators:**
- `and` - Execute commands sequentially
- `then` - Execute commands in order
- `,` - Execute commands one after another

**Examples:**
- `open mailbox and take leaflet` → opens mailbox, then takes leaflet
- `go north, look around` → moves north, then looks
- `take lamp and light it` → takes lamp, then lights it
- `open door then go north then look` → multiple chained commands

**Execution Policies:**
- **best-effort** (default): Execute all commands, even if one fails
- **fail-early**: Stop at first error

**Game State Propagation:**
Multi-commands execute sequentially, with each command seeing the effects of previous commands. This allows for realistic sequences like:
- `open mailbox and take leaflet` - can't take leaflet until mailbox is opened
- `take lamp and light it` - must take lamp before lighting

**Configuration:** (in `command-config.json`)
```json
{
  "parserSettings": {
    "multiCommandSeparators": ["and", "then", ","],
    "multiCommandPolicy": "best-effort"
  }
}
```

### 3. Object Disambiguation

When multiple objects match a query, the parser presents candidates for selection:

**Examples:**
- `take lamp` (when 2+ lamps present) → lists candidates with context
- `take 2nd lamp` → selects the second lamp from the list (ordinal selection)
- `take brass lamp` → uses descriptive words to narrow down

**Ordinal Selection:**
- `1st coin`, `2nd coin`, `3rd coin` - numeric ordinals
- `first lamp`, `second lamp`, `third lamp` - word ordinals

### 4. Telemetry, Privacy, and Analytics

All parser interactions are logged for analysis and improvement, with comprehensive privacy controls and analytics.

#### Event Logging

**Events Logged:**
- `parse.attempt` - when parsing begins (before success/failure)
- `parse_success` / `parse_failure` - command parsing outcomes
- `fuzzy_match` - fuzzy matching attempts with scores
- `autocorrect_suggestion` - suggestions offered to player
- `autocorrect_accepted` - when fuzzy match is accepted
- `autocorrect.rejected` - when user declines autocorrect suggestion
- `disambiguation_shown` - when multiple candidates are presented
- `disambiguation_selected` - player's choice from candidates
- `disambiguation.cancelled` - when user cancels disambiguation
- `multi_command` - multi-command execution metadata
- `ordinal_selection` - ordinal-based object selection
- `commandDispatcher.*` - dispatcher lifecycle events (started, commandExecuted, completed, error)

Each event includes:
- **Event type**: Categorized event identifier
- **Timestamp**: Precise time of occurrence
- **Event data**: Context-specific information (input length, scores, candidates, etc.)

#### Privacy Controls

The telemetry system implements privacy-first design with comprehensive controls:

**Privacy Configuration:**
```typescript
interface TelemetryPrivacyConfig {
  enabled: boolean;                    // Master on/off switch
  collectInput: boolean;               // Collect user input text (may contain PII)
  allowPersistentStorage: boolean;     // Allow storage beyond session
  allowRemoteTransmission: boolean;    // Allow export/transmission of data
}
```

**Default Settings (Privacy-Safe):**
- ✅ Telemetry enabled
- ✅ Input collection enabled (for analytics)
- ❌ Persistent storage disabled (memory-only)
- ❌ Remote transmission disabled (no export without consent)

**Configuration Example:**
```typescript
// Opt out of telemetry entirely
telemetry.setPrivacyConfig({ enabled: false });

// Collect events but not user input (PII protection)
telemetry.setPrivacyConfig({ collectInput: false });

// Enable data export for ML training (requires explicit consent)
telemetry.setPrivacyConfig({ allowRemoteTransmission: true });

// Check current settings
const config = telemetry.getPrivacyConfig();
console.log('Telemetry enabled:', config.enabled);
```

**PII Protection:**
- When `collectInput` is false, user input text is not stored
- Input length is still recorded for aggregate statistics
- All other event data (scores, candidates, timestamps) are collected
- Export anonymizes data by removing input fields when configured

**Data Retention:**
- Events stored in memory only by default
- Cleared on page refresh unless persistent storage is enabled
- Can be manually cleared with `clearEvents()`
- Automatically cleared when privacy settings change

#### Analytics API

The telemetry service provides comprehensive analytics for UX insights:

**Summary Statistics:**
```typescript
const analytics = telemetry.getAnalytics();

// Parse metrics
console.log(`Parse success rate: ${analytics.parseSuccessRate * 100}%`);
console.log(`Total parse attempts: ${analytics.parseAttempts}`);
console.log(`Parse failures: ${analytics.parseFailures}`);

// Autocorrect metrics
console.log(`Autocorrect acceptance rate: ${analytics.autocorrectAcceptanceRate * 100}%`);
console.log(`Autocorrect suggestions: ${analytics.autocorrectSuggestions}`);
console.log(`Autocorrect acceptances: ${analytics.autocorrectAcceptances}`);
console.log(`Autocorrect rejections: ${analytics.autocorrectRejections}`);

// Disambiguation metrics
console.log(`Disambiguation prompts: ${analytics.disambiguationShown}`);
console.log(`Disambiguation selections: ${analytics.disambiguationSelections}`);
console.log(`Disambiguation cancellations: ${analytics.disambiguationCancellations}`);

// Other metrics
console.log(`Multi-command inputs: ${analytics.multiCommands}`);
console.log(`Ordinal selections: ${analytics.ordinalSelections}`);
```

**Top Failures and Patterns:**
```typescript
const analytics = telemetry.getAnalytics();

// Most common parse failures (requires collectInput: true)
analytics.topFailedInputs.forEach(({ input, count }) => {
  console.log(`"${input}" failed ${count} times`);
});

// Most ambiguous phrases (requires collectInput: true)
analytics.topAmbiguousPhrases.forEach(({ phrase, count }) => {
  console.log(`"${phrase}" triggered disambiguation ${count} times`);
});

// Most common autocorrects (requires collectInput: true)
analytics.topAutocorrects.forEach(({ from, to, count }) => {
  console.log(`"${from}" → "${to}": ${count} times`);
});
```

**Time-Range Filtering:**
```typescript
// Analyze last hour
const oneHourAgo = new Date(Date.now() - 3600000);
const now = new Date();
const recentAnalytics = telemetry.getAnalytics(oneHourAgo, now);

// Analyze specific session
const sessionStart = new Date('2025-10-26T10:00:00Z');
const sessionEnd = new Date('2025-10-26T11:00:00Z');
const sessionAnalytics = telemetry.getAnalytics(sessionStart, sessionEnd);
```

**Querying Events:**
```typescript
// Get all events
const allEvents = telemetry.getEvents();

// Filter by event type
const failures = telemetry.getEventsByType(TelemetryEventType.PARSE_FAILURE);
const disambiguations = telemetry.getEventsByType(TelemetryEventType.DISAMBIGUATION_SHOWN);

// Filter by time range
const startTime = new Date('2025-10-26T10:00:00Z');
const endTime = new Date('2025-10-26T11:00:00Z');
const eventsInRange = telemetry.getEventsByTimeRange(startTime, endTime);
```

#### ML Readiness and Data Export

The telemetry system supports future machine learning integration with anonymized data export.

**Export Format:**
```typescript
// Enable export (requires explicit consent)
telemetry.setPrivacyConfig({ allowRemoteTransmission: true });

// Export anonymized data
const exportedData = telemetry.exportAnonymizedData();

// Returns array of events:
[
  {
    type: 'parse_success',
    timestamp: '2025-10-26T15:30:00.123Z',
    data: {
      rawInput: 'take lamp',      // Only if collectInput: true
      inputLength: 9
    }
  },
  {
    type: 'autocorrect_accepted',
    timestamp: '2025-10-26T15:31:00.456Z',
    data: {
      input: 'lampp',             // Only if collectInput: true
      correction: 'lamp'
    }
  }
  // ... more events
]
```

**Anonymization:**
- When `collectInput: false`, input text is removed from export
- Input length and other metadata are preserved
- Timestamps are converted to ISO 8601 strings
- Event types and data structures remain intact

**ML Training Use Cases:**
- Intent classification from user input patterns
- Autocorrect suggestion improvement
- Disambiguation candidate ranking
- Command success prediction
- Parser error prediction and prevention
- User behavior modeling for adaptive UX

**Export Safety:**
- Export blocked unless `allowRemoteTransmission: true`
- Console warning displayed when export is blocked
- Returns `null` when remote transmission is not allowed
- Requires explicit user consent before enabling

**Future ML Integration:**
The exported data format is designed to support:
1. **Supervised learning**: Labeled parse attempts with success/failure outcomes
2. **Reinforcement learning**: User selections from disambiguation candidates
3. **Transfer learning**: Pre-trained models fine-tuned on game-specific patterns
4. **Online learning**: Incremental model updates from session data
5. **A/B testing**: Compare parser versions with telemetry metrics

#### Use Cases

**For Designers:**
- Identify common player mistakes and typos
- Discover ambiguous object names needing better aliases
- Measure impact of parser improvements over time
- Understand most/least successful command patterns
- Optimize autocorrect confidence thresholds

**For Developers:**
- Debug parser behavior in production
- Validate new features with real usage data
- Track performance metrics (parse success rate)
- Identify edge cases for additional test coverage
- Monitor error rates and failure patterns

**For ML Engineers:**
- Collect labeled training data for intent classification
- Build autocorrect models from acceptance/rejection patterns
- Train ranking models for disambiguation candidates
- Develop adaptive parsers that learn from user behavior
- Create personalized command prediction models

#### Privacy Guarantees

**What We Collect:**
- Event types (parse success, autocorrect, disambiguation, etc.)
- Timestamps of all events
- Input length (character count)
- Autocorrect scores and suggestions
- Disambiguation candidates and selections
- Command execution statistics

**What We DO NOT Collect (by default):**
- User input text (unless `collectInput: true`)
- Personally identifiable information (PII)
- IP addresses or device identifiers
- Persistent user identifiers across sessions

**What We DO NOT Do:**
- Transmit data to remote servers (unless `allowRemoteTransmission: true`)
- Store data persistently in browser storage (unless `allowPersistentStorage: true`)
- Share data with third parties
- Use data for advertising or tracking

**User Control:**
- Opt out entirely with `setPrivacyConfig({ enabled: false })`
- Disable input text collection while keeping statistics
- Clear all data manually with `clearEvents()`
- Review privacy settings with `getPrivacyConfig()`

**Compliance:**
- GDPR-friendly: No PII collection by default, clear consent mechanism
- CCPA-friendly: User control over data collection and retention
- Privacy-first design: Memory-only storage by default
- Transparent: All collected data accessible via API

### 5. Phrasal Verb Support

The parser now recognizes common phrasal verbs, allowing players to use natural English constructions:

**Examples:**
- `look in mailbox` → Examines the mailbox (with preposition "in")
- `look inside the mailbox` → Same as above
- `look at door` → Examines the door (with preposition "at")
- `pick up lamp` → Takes the lamp
- `put down sword` → Drops the sword
- `open up door` → Opens the door
- `turn on lamp` → Lights the lamp
- `turn off lamp` → Extinguishes the lamp

**Supported Phrasal Verbs:**
- `look in/into/inside` → examine with preposition
- `look at/on/under/behind` → examine with preposition
- `pick up` → take
- `put down` → drop
- `put in/into/on` → put with preposition
- `open up` → open
- `turn on` → light
- `turn off` → extinguish

### 2. Pronoun Resolution

Players can use pronouns to refer to recently mentioned objects:

**Examples:**
- After `examine mailbox`:
  - `it` → refers to mailbox
  - `take it` → takes mailbox
  - `look at it` → examines mailbox
  - `open it` → opens mailbox
  - `unlock door with it` → unlocks door with mailbox (if it's a key)

**Supported Pronouns:**
- `it` - singular object
- `them` - plural objects
- `that` - demonstrative
- `this` - demonstrative
- `him/her` - characters (when implemented)
- `there` - locations (when implemented)

**Context Tracking:**
- The parser tracks the last referenced object automatically
- The game engine updates this context whenever a player interacts with an object
- If no object has been referenced, pronouns will prompt for clarification

### 3. Data-Driven Configuration

All synonyms, phrasal verbs, and prepositions are defined in `src/app/data/synonyms.json`, making it easy for designers to extend the parser without code changes.

**Configuration Structure:**
```json
{
  "verbs": {
    "examine": ["look", "inspect", "check", "read"],
    "take": ["get", "grab", "pick", "pickup", "obtain", "acquire"]
  },
  "phrasalVerbs": {
    "look in": { "intent": "examine", "preposition": "in" },
    "pick up": { "intent": "take" }
  },
  "pronouns": ["it", "them", "him", "her", "that", "this", "there"],
  "determiners": ["the", "a", "an", "my", "some", "any"],
  "prepositions": ["in", "into", "inside", "on", "at", "to", "from", "with", "under", "behind"],
  "objectAliases": {
    "mailbox": ["letterbox", "box", "mail box"],
    "leaflet": ["pamphlet", "flyer", "brochure", "paper", "document"]
  }
}
```

### 4. Enhanced Parser Result

The `ParserResult` interface now includes additional information:

```typescript
interface ParserResult {
  verb: VerbType | null;
  directObject: string | null;
  indirectObject: string | null;
  preposition: string | null;
  rawInput: string;
  isValid: boolean;
  errorMessage?: string;
  suggestions?: string[];  // NEW: Suggested objects when ambiguous
  tokens?: string[];       // NEW: Tokenized input for debugging
}
```

### 5. Backward Compatibility

All existing commands continue to work exactly as before:
- Simple verbs: `look`, `inventory`
- Verb + object: `take lamp`, `examine mailbox`
- Verb + object + preposition + object: `put lamp in mailbox`, `unlock door with key`
- Direction commands: `north`, `n`, `go east`
- Verb aliases: `get` → `take`, `x` → `examine`, `i` → `inventory`

## Implementation Details

### Parser Flow

1. **Input Normalization**
   - Lowercase conversion
   - Whitespace normalization
   - Punctuation handling

2. **Tokenization**
   - Split on whitespace
   - Filter determiners (the, a, an, my)
   - Keep prepositions and meaningful words

3. **Pronoun Detection**
   - Check for standalone pronouns
   - Resolve to last referenced object if available
   - Provide helpful error if no context exists

4. **Direction Handling**
   - Special case for direction words
   - Convert to `go` command automatically

5. **Phrasal Verb Matching**
   - Try 2-3 word phrasal verb patterns
   - Extract intent and preposition
   - Pass remaining tokens to command parser

6. **Verb Matching**
   - Match primary verb or alias
   - Validate verb requirements

7. **Object Parsing**
   - Extract direct and indirect objects
   - Handle prepositions
   - Resolve pronouns in object positions
   - Validate command structure

### Context Management

The parser maintains a `lastReferencedObject` that is updated by the game engine whenever an object is mentioned:

```typescript
// In GameEngineService.executeCommand()
if (parserResult.directObject) {
  this.commandParser.setLastReferencedObject(parserResult.directObject);
}
```

### API Methods

**CommandParserService:**
- `parse(rawInput: string): ParserResult` - Parse user input
- `setLastReferencedObject(objectName: string | null): void` - Update context
- `getLastReferencedObject(): string | null` - Get current context
- `getAvailableVerbs(): Verb[]` - Get all recognized verbs
- `isVerb(word: string): boolean` - Check if word is a verb
- `isDirection(word: string): boolean` - Check if word is a direction

## Testing

The parser includes comprehensive test coverage (108+ tests) covering:

- ✅ Phrasal verb recognition
- ✅ Pronoun resolution
- ✅ Data-driven configuration
- ✅ Token support
- ✅ Context management
- ✅ Backward compatibility
- ✅ Edge cases and error handling

Run tests with:
```bash
npm test -- --include="**/command-parser.service.spec.ts" --no-watch --browsers=ChromeHeadless
```

## Examples

### Basic Commands
```
> look
You are standing in an open field...

> examine mailbox
The mailbox is a small wooden box...

> open it
You open the mailbox.

> look in it
Inside the mailbox is a leaflet.

> take the leaflet
Taken.

> read it
"Welcome to Zork..."
```

### Phrasal Verbs
```
> pick up lamp
Taken.

> turn it on
The lamp is now lit.

> look under table
You find nothing of interest.

> put lamp in mailbox
You put the brass lamp in the small mailbox.
```

### Natural Language
```
> look inside the mailbox
Inside the mailbox is a leaflet.

> pick up the leaflet
Taken.

> look at the white house
The house is a beautiful colonial structure...
```

## Implementation Status

### ✅ Implemented Features

The following features have been fully implemented and integrated:

1. **Fuzzy Object Matching** ✅
   - Levenshtein distance for typo tolerance
   - "Did you mean...?" suggestions
   - Auto-correction with confidence thresholds

2. **Multi-Part Commands** ✅
   - Support for "and", "then", "," conjunctions
   - Sequential execution with state propagation
   - Configurable execution policies (fail-early / best-effort)

3. **Object Disambiguation** ✅
   - Handle multiple similar objects
   - Present candidate lists with context
   - Ordinal selection ("2nd lamp", "third coin")

4. **Telemetry and Analytics** ✅
   - Comprehensive event logging
   - Parser performance tracking
   - Non-blocking, configurable telemetry

5. **Phrasal Verb Support** ✅
   - Natural language constructions
   - Data-driven configuration
   - Preposition handling

6. **Pronoun Resolution** ✅
   - Context tracking for "it", "them", etc.
   - Automatic object reference updates

7. **Disambiguation & Autocorrect UI Components** ✅ (Phase 6)
   - Interactive disambiguation prompts when multiple objects match
   - Autocorrect confirmation for fuzzy matches
   - Accessible keyboard navigation (1-5 for disambiguation, y/n for autocorrect)
   - ARIA roles and screen reader support
   - Telemetry logging for user choices

## UI Components

### Disambiguation Component

The DisambiguationComponent appears when the parser encounters ambiguous input (e.g., "take lamp" when multiple lamps exist).

**Features:**
- Displays top-N candidates with context (location, description)
- Numeric keyboard shortcuts (1-5) for quick selection
- Click/tap selection support
- Escape to cancel
- Full accessibility with ARIA roles and labels

**Example Flow:**
```
> take lamp
[Disambiguation prompt appears]
Which lamp do you mean?
1. brass lamp (here) - 95% match
2. lamp post (in the street) - 85% match
3. oil lamp (in inventory) - 80% match

Press 1-3 to select, or Esc to cancel
```

**API Usage:**
```typescript
// Game engine calls disambiguation when needed
const candidates: ObjectCandidate[] = [
  { id: 'brass-lamp', displayName: 'brass lamp', score: 0.95, context: 'here' },
  { id: 'lamp-post', displayName: 'lamp post', score: 0.85, context: 'in the street' },
];

const selected = await gameEngine.requestDisambiguation(candidates, 'Which lamp?');
if (selected) {
  // User made a selection
  console.log('User selected:', selected.displayName);
} else {
  // User cancelled
  console.log('User cancelled disambiguation');
}
```

### Autocorrect Confirmation Component

The AutocorrectConfirmationComponent appears when the parser detects a likely typo with medium confidence (70-85%).

**Features:**
- Inline display of original input vs suggested correction
- Accept/decline buttons with keyboard shortcuts (y/n, Escape)
- Shows confidence percentage
- Non-blocking UI positioned at bottom of screen
- Full accessibility with ARIA roles and labels

**Example Flow:**
```
> mailbax
[Autocorrect prompt appears]
Did you mean "mailbox"?
(You typed: "mailbax")
[Y]es  [N]o
Confidence: 92%
```

**API Usage:**
```typescript
// Game engine calls autocorrect confirmation when fuzzy match is found
const accepted = await gameEngine.requestAutocorrectConfirmation(
  'mailbax',  // original input
  'mailbox',  // suggestion
  0.92        // confidence (0-1)
);

if (accepted) {
  // User accepted the suggestion, use "mailbox"
  console.log('Autocorrect accepted');
} else {
  // User rejected, use original "mailbax"
  console.log('Autocorrect rejected');
}
```

### Integration with Game Engine

The UI components are integrated with the GameEngineService via callbacks:

```typescript
// Set up callbacks (typically in App component)
gameEngine.setDisambiguationCallback((candidates, prompt) => {
  return new Promise((resolve) => {
    // Show disambiguation UI
    // Wait for user selection
    // Resolve with selected candidate or null
  });
});

gameEngine.setAutocorrectCallback((originalInput, suggestion, confidence) => {
  return new Promise((resolve) => {
    // Show autocorrect UI
    // Wait for user decision
    // Resolve with true (accepted) or false (rejected)
  });
});
```

The game engine will automatically pause command execution and wait for user input when disambiguation or autocorrect is needed.

### Accessibility Features

Both components implement full accessibility:

- **Keyboard Navigation:**
  - Disambiguation: 1-9 for selection, Escape to cancel, Tab/Enter/Space for button navigation
  - Autocorrect: Y for accept, N for reject, Escape for reject

- **ARIA Roles and Labels:**
  - `role="dialog"` and `role="alert"` for proper semantics
  - `aria-label` and `aria-modal` attributes
  - `aria-live` regions for screen reader announcements

- **Focus Management:**
  - Auto-focus on appearance for immediate keyboard access
  - Proper tab order and focus trapping

- **Responsive Design:**
  - Mobile-friendly layouts
  - Touch-friendly hit targets
  - Readable on all screen sizes

- **Reduced Motion:**
  - Respects `prefers-reduced-motion` media query
  - Animations disabled when requested

## Command Dispatcher & Sequential Execution

### Overview

The Command Dispatcher is the orchestration layer that coordinates the execution of multiple parsed commands, managing state propagation, execution policies, and integration with UI flows. Introduced in Phase 7, it provides robust transaction semantics and comprehensive telemetry for multi-command sequences.

### Architecture

```
┌─────────────────┐
│   GameService   │  ← User submits "open mailbox and take leaflet"
└────────┬────────┘
         │ splits into commands
         ↓
┌─────────────────┐
│ CommandParser   │  ← Parses each sub-command
└────────┬────────┘
         │ ParserResult[]
         ↓
┌─────────────────┐
│ GameEngine      │
│ .executeParsed  │
│  Commands()     │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ CommandDispatcher│ ← Sequential execution controller
└────────┬────────┘
         │ for each command...
         ↓
┌─────────────────┐
│ GameEngine      │
│ .executeCommand │  ← Updates game state
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Game State      │  ← State propagates to next command
└─────────────────┘
```

### Execution Policies

The dispatcher supports two execution policies:

#### 1. fail-early (default)

Stops execution on the first command that fails. Subsequent commands are marked as skipped.

**Use Case**: Critical command sequences where later commands depend on earlier ones succeeding.

**Example**:
```typescript
// "open mailbox and take leaflet"
// If "open mailbox" fails, "take leaflet" is skipped
const report = await gameEngine.executeParsedCommands(commands, {
  policy: 'fail-early'
});

console.log(report.skippedCommands); // > 0 if first command failed
```

#### 2. best-effort

Continues executing all commands even if some fail. Reports all errors but doesn't skip commands.

**Use Case**: Independent command sequences where each command should be attempted regardless of others.

**Example**:
```typescript
// "look and inventory and help"
// All three commands execute even if one fails
const report = await gameEngine.executeParsedCommands(commands, {
  policy: 'best-effort'
});

console.log(report.failedCommands); // Count of failed commands
console.log(report.successfulCommands); // Count of successful commands
```

### Transaction Semantics

The dispatcher ensures **sequential consistency**:

1. **Command Ordering**: Commands execute in the order they appear in the input
2. **State Propagation**: Each command sees the effects of all previous commands
3. **Atomic Execution**: Each command is executed fully before the next begins
4. **No Rollback**: State changes are committed immediately (no transaction rollback)

**Example of State Propagation**:
```typescript
// Input: "open mailbox and take leaflet"
// 1. open mailbox → mailbox.isOpen = true (state committed)
// 2. take leaflet → sees mailbox.isOpen = true, can access contents
```

### API Reference

#### GameEngineService.executeParsedCommands()

```typescript
async executeParsedCommands(
  commands: ParserResult[],
  options?: ExecutionOptions
): Promise<ExecutionReport>
```

**Parameters**:
- `commands`: Array of parsed commands from CommandParserService
- `options`: Optional execution configuration
  - `policy`: `'fail-early'` | `'best-effort'` (default: `'fail-early'`)
  - `blockOnUI`: Whether to await UI interactions (default: `true`)

**Returns**: `ExecutionReport` with comprehensive execution statistics

#### ExecutionReport Interface

```typescript
interface ExecutionReport {
  results: CommandExecutionResult[];  // Per-command results
  success: boolean;                   // Overall success
  policy: ExecutionPolicy;            // Policy used
  totalCommands: number;              // Total commands
  executedCommands: number;           // Commands executed (not skipped)
  successfulCommands: number;         // Commands that succeeded
  failedCommands: number;             // Commands that failed
  skippedCommands: number;            // Commands skipped (fail-early)
  startTime: Date;                    // Execution start timestamp
  endTime: Date;                      // Execution end timestamp
  executionTimeMs: number;            // Total execution time
}
```

#### CommandExecutionResult Interface

```typescript
interface CommandExecutionResult {
  command: ParserResult;              // The parsed command
  output: CommandOutput;              // Command execution result
  index: number;                      // Position in sequence (0-based)
  skipped: boolean;                   // Whether command was skipped
  selectedCandidate?: ObjectCandidate;// Disambiguation selection
  autocorrectAccepted?: boolean;      // Autocorrect decision
  originalInput?: string;             // Input before autocorrect
  startTime: Date;                    // Command start time
  endTime: Date;                      // Command end time
}
```

### Usage Examples

#### Basic Sequential Execution

```typescript
const parser = inject(CommandParserService);
const gameEngine = inject(GameEngineService);

// Parse multiple commands
const commands = [
  parser.parse('look'),
  parser.parse('inventory'),
  parser.parse('help')
];

// Execute with default policy (fail-early)
const report = await gameEngine.executeParsedCommands(commands);

// Check results
if (report.success) {
  console.log('All commands succeeded');
} else {
  console.log(`${report.failedCommands} commands failed`);
}
```

#### Best-Effort Execution

```typescript
// Execute all commands regardless of failures
const report = await gameEngine.executeParsedCommands(commands, {
  policy: 'best-effort'
});

// Process each result individually
report.results.forEach((result, index) => {
  if (result.output.success) {
    console.log(`Command ${index + 1}: SUCCESS`);
  } else {
    console.log(`Command ${index + 1}: FAILED - ${result.output.messages[0]}`);
  }
});
```

#### State-Dependent Sequences

```typescript
// Commands that depend on state changes
const commands = [
  parser.parse('open mailbox'),    // Changes: mailbox.isOpen = true
  parser.parse('take leaflet'),    // Sees: mailbox.isOpen = true
  parser.parse('read leaflet')     // Sees: leaflet in inventory
];

const report = await gameEngine.executeParsedCommands(commands, {
  policy: 'fail-early'  // Stop if mailbox can't be opened
});

// Verify state propagation worked
if (report.success) {
  console.log('All commands executed with proper state propagation');
}
```

### Telemetry Events

The dispatcher logs comprehensive telemetry events:

**Event Types**:
- `commandDispatcher.started`: Execution begins
  - Data: `{ commandCount, policy }`
- `commandDispatcher.commandExecuted`: Each command completes
  - Data: `{ index, verb, success, executionTimeMs }`
- `commandDispatcher.error`: Command throws exception
  - Data: `{ index, verb, error }`
- `commandDispatcher.earlyTermination`: fail-early stops sequence
  - Data: `{ index, remainingCommands }`
- `commandDispatcher.completed`: Execution finishes
  - Data: `{ totalCommands, executedCommands, successfulCommands, failedCommands, skippedCommands, success, executionTimeMs, policy }`

**Example: Querying Telemetry**:
```typescript
const telemetry = inject(TelemetryService);
const events = telemetry.getEvents();

// Find dispatcher completion event
const completedEvent = events.find(e => 
  String(e.type).includes('commandDispatcher.completed')
);

if (completedEvent) {
  console.log('Execution time:', completedEvent.data['executionTimeMs'], 'ms');
  console.log('Success rate:', 
    completedEvent.data['successfulCommands'] / 
    completedEvent.data['totalCommands']
  );
}
```

### Integration with UI Components

The dispatcher seamlessly integrates with disambiguation and autocorrect flows:

**Disambiguation During Multi-Command**:
```typescript
// Input: "take lamp and open door"
// If multiple lamps exist, dispatcher:
// 1. Pauses execution
// 2. Shows disambiguation UI
// 3. Waits for user selection
// 4. Continues with selected lamp
// 5. Executes "open door"
```

**Autocorrect During Multi-Command**:
```typescript
// Input: "tak lamp and opn door"
// Dispatcher:
// 1. Shows autocorrect for "tak" → "take"
// 2. Waits for user acceptance
// 3. Executes corrected command
// 4. Shows autocorrect for "opn" → "open"
// 5. Waits for user acceptance
// 6. Executes corrected command
```

### Performance Characteristics

**Time Complexity**: O(n) where n = number of commands
**Space Complexity**: O(n) for storing results
**Execution**: Sequential (not parallel)
**State Propagation**: Immediate (no buffering)

**Typical Execution Times** (per command):
- Simple commands (look, inventory): < 1ms
- Object manipulation (take, drop): 1-3ms
- Complex commands (with disambiguation): 100-500ms (user interaction time)

### Error Handling

The dispatcher handles errors gracefully:

**Command Execution Errors**:
```typescript
try {
  const report = await gameEngine.executeParsedCommands(commands);
  // Report contains error information in results
} catch (error) {
  // Dispatcher itself never throws - errors are captured in report
}
```

**Invalid Commands**:
```typescript
// Invalid commands are executed and marked as failed
const commands = [
  parser.parse('invalidverb'),  // isValid = false
  parser.parse('look')           // Valid command
];

const report = await gameEngine.executeParsedCommands(commands, {
  policy: 'best-effort'  // Both execute
});

expect(report.results[0].output.success).toBe(false);
expect(report.results[1].output.success).toBe(true);
```

### Configuration

Execution policy can be configured globally in `command-config.json`:

```json
{
  "parserSettings": {
    "multiCommandPolicy": "best-effort"  // or "fail-early"
  }
}
```

### Testing

The dispatcher includes comprehensive test coverage:

**Unit Tests** (21 tests):
- Policy enforcement
- Sequential execution
- Error handling
- Timing tracking
- Telemetry logging

**Integration Tests** (15 tests):
- State propagation
- Transaction semantics
- UI flow integration
- Complex scenarios

**Run Tests**:
```bash
npm test -- --include="**/command-dispatcher*.spec.ts" --no-watch
```

### 🔜 Future Enhancements

The following features are planned but not yet implemented:

1. **Enhanced Error Messages**
   - Context-aware suggestions
   - Example completions based on current scene

2. **Advanced Context**
   - Track multiple recent objects
   - Support spatial context ("the one on the table")

3. **Natural Language Understanding**
   - Sentiment analysis for player frustration
   - Adaptive difficulty based on player skill

4. **Voice Command Support**
   - Speech-to-text integration
   - Voice-optimized error handling

## Contributing

To add new synonyms or phrasal verbs:

1. Edit `src/app/data/synonyms.json`
2. Add the new mapping to the appropriate section
3. Run tests to ensure no regressions
4. Update this documentation if needed

**Example: Adding a new verb synonym:**
```json
{
  "verbs": {
    "examine": ["look", "inspect", "check", "read", "scan"]  // Added "scan"
  }
}
```

**Example: Adding a new phrasal verb:**
```json
{
  "phrasalVerbs": {
    "look in": { "intent": "examine", "preposition": "in" },
    "peek at": { "intent": "examine", "preposition": "at" }  // New!
  }
}
```

## License

MIT
