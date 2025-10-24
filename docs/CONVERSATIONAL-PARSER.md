# Conversational Command Parser

The Zork Web command parser has been enhanced to support natural, conversational language patterns, making player interaction more intuitive and immersive.

## Features

### 1. Phrasal Verb Support

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

## Future Enhancements

The following features are planned but not yet implemented:

1. **Fuzzy Object Matching**
   - Levenshtein distance for typo tolerance
   - "Did you mean...?" suggestions

2. **Multi-Part Commands**
   - Support for "and", "then" conjunctions
   - "open mailbox and take leaflet"

3. **Enhanced Error Messages**
   - Context-aware suggestions
   - Example completions based on current scene

4. **Object Disambiguation**
   - Handle multiple similar objects
   - "Which lamp do you mean: brass lamp or rusty lamp?"

5. **Advanced Context**
   - Track multiple recent objects
   - Support spatial context ("the one on the table")

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
