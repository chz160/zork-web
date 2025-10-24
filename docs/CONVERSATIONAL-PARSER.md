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
- **fail-fast**: Stop at first error

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

### 4. Telemetry and Analytics

All parser interactions are logged for analysis and improvement:

**Events Logged:**
- `parse_success` / `parse_failure` - command parsing outcomes
- `fuzzy_match` - fuzzy matching attempts with scores
- `autocorrect_suggestion` - suggestions offered to player
- `autocorrect_accepted` - when fuzzy match is accepted
- `disambiguation_shown` - when multiple candidates are presented
- `disambiguation_selected` - player's choice from candidates
- `multi_command` - multi-command execution metadata
- `ordinal_selection` - ordinal-based object selection

**Use Cases:**
- Identify common typos and add aliases
- Measure parser accuracy and improvement
- Understand player behavior and command patterns
- Debug parsing issues in production

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
   - Configurable execution policies (fail-fast / best-effort)

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
