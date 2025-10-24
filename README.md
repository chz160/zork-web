# Zork Web

A web-based clone of the classic text adventure game Zork, built with Angular 20.

## Features

- DOS-style terminal interface
- Command-based text adventure gameplay
- Game state saved in browser's storage
- Classic Zork-inspired world to explore

## Documentation Resources

This project includes valuable reference materials in the `/docs` folder:

- **Entity Mapping Guide** (`/docs/entity-mapping.md`) - Comprehensive mapping from original Zork entities (rooms, objects, verbs) to TypeScript/JSON schema. This is the primary reference for implementing game content and includes:
  - Complete catalog of 110+ rooms, 150+ objects, and 109 verbs
  - TypeScript/JSON schema mapping for each entity type
  - Edge case handling strategies (containers, light/darkness, NPCs)
  - Implementation phases and data organization plan
  - JSON schemas for validation (`/docs/schemas/`)

- **Transcript Verification** (`/docs/TRANSCRIPT-VERIFICATION.md`) - Documentation of test results comparing engine output against legacy Zork transcripts. Includes known discrepancies, edge cases discovered, and compatibility summary.

- **Original Zork Source Code** (`/docs/original-src-1977/`, `/docs/original-src-1980/`, `/docs/original-src-c/`) - The 1977-1980 MIT source code for Zork, written in MDL for the PDP-10. This historical code serves as a reference for understanding the original game mechanics, world design, and command parsing. See the [README](docs/original-src-1977/README.md) for details about the file organization and rights.

- **Game Walkthroughs** (`/docs/walkthrough1.md`, `/docs/walkthrough2.md`, `/docs/walkthrough3.md`) - Complete game transcripts showing different approaches to solving Zork. These are useful for:
  - Testing game implementation completeness
  - Verifying correct behavior of puzzles and interactions
  - Understanding the full scope of the game world
  - Reference for implementing game logic and responses
  - Transcript-driven regression testing

- **Architecture Documentation** (`/docs/architecture.md`) - Detailed system architecture, design patterns, and component interactions for the game engine.

Contributors should reference these resources when implementing game features to ensure authenticity to the original Zork experience. Start with the Entity Mapping Guide for implementing new game content.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (version 24.0 or later)
- [npm](https://www.npmjs.com/) (comes with Node.js)

## Getting Started

### Installation

1. Clone the repository:
```bash
git clone https://github.com/chz160/zork-web.git
cd zork-web
```

2. Install dependencies:
```bash
npm install
```

### Running the Application

To start a local development server, run:

```bash
npm start
```

Or use the Angular CLI directly:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

### Building for Production

To build the project for production:

```bash
npm run build
```

This will compile your project and store the build artifacts in the `dist/` directory. The production build is optimized for performance and speed.

## Development

### Code Quality and Linting

This project uses ESLint and Prettier to enforce code quality and consistent formatting.

#### Running Linting and Formatting

- **Lint code:** Check for code quality issues
  ```bash
  npm run lint
  ```

- **Auto-fix linting issues:** Automatically fix fixable linting issues
  ```bash
  npm run lint:fix
  ```

- **Format code:** Format all source files with Prettier
  ```bash
  npm run format
  ```

- **Check formatting:** Verify if files are formatted correctly
  ```bash
  npm run format:check
  ```

#### Pre-commit Hooks

This project uses Husky to run pre-commit hooks that automatically lint and format your code before each commit. The hooks will:

1. Run ESLint on staged `.ts` and `.html` files
2. Run Prettier on staged `.ts`, `.html`, `.css`, and `.json` files
3. Automatically fix issues when possible

If the hooks detect unfixable issues, the commit will be blocked until you resolve them.

#### Code Style Guidelines

- **TypeScript:** Follow the Angular style guide and TypeScript best practices
  - Use `const` for constants and immutable values
  - Avoid `var` - use `let` or `const`
  - Prefix unused function parameters with `_`
  - Use single quotes for strings
  - Maximum line length: 100 characters

- **Angular Components:**
  - Component selectors: Use kebab-case with `app-` prefix
  - Directive selectors: Use camelCase with `app` prefix
  - Use standalone components
  - Default to OnPush change detection

- **HTML Templates:**
  - Follow accessibility best practices
  - Use semantic HTML elements

### Project Structure

This project uses:
- **Angular 20** - Latest version of the Angular framework
- **TypeScript** - With strict mode enabled for type safety
- **Standalone Components** - Modern Angular architecture without NgModules
- **Angular Router** - For navigation between game screens

### Code Scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

### Running Tests

Zork Web has comprehensive unit tests for the core game engine, command parser, and all game logic. Tests are written using Jasmine and run with Karma. The test suite also includes transcript verification tests that compare engine output against legacy Zork transcripts.

#### Running All Tests

To execute the full test suite:

```bash
npm test
```

Or use the Angular CLI directly:

```bash
ng test
```

#### Running Tests with Coverage

To generate a code coverage report:

```bash
npm test -- --no-watch --code-coverage
```

The coverage report will be generated in the `coverage/` directory. Open `coverage/index.html` in your browser to view detailed coverage information.

#### Running Tests in CI Mode

To run tests once (without watch mode) for CI/CD pipelines:

```bash
npm test -- --no-watch --browsers=ChromeHeadless
```

#### Running Transcript Verification Tests

To run only the transcript verification tests that compare engine output with legacy Zork transcripts:

```bash
npm test -- --include='**/transcript-verification.spec.ts' --no-watch --browsers=ChromeHeadless
```

See [docs/TRANSCRIPT-VERIFICATION.md](docs/TRANSCRIPT-VERIFICATION.md) for detailed results and known discrepancies.

#### Test Coverage

The project maintains high test coverage across core components:

- **GameEngineService**: 30+ tests covering command execution, state management, and game logic
- **CommandParserService**: 50+ tests covering natural language parsing, verb aliases, and error handling
- **Transcript Verification**: 17+ tests comparing engine output with legacy Zork transcripts
- **Overall Coverage**: ~68% statements, ~49% branches, ~77% functions

**What's Tested:**

- ✅ Game initialization and state management
- ✅ Command parsing and tokenization
- ✅ All verb handlers (navigation, inventory, object interaction, system commands)
- ✅ Room transitions and move counting
- ✅ Object state changes (open/close, lock/unlock, light/extinguish)
- ✅ Inventory management (take/drop)
- ✅ Container interactions (put objects in containers)
- ✅ Edge cases and error handling
- ✅ Verb aliases and direction shortcuts
- ✅ Save/load functionality
- ✅ **Output parity with legacy Zork transcripts**

**Testing Best Practices:**

This project follows Angular testing best practices:

1. **Isolated Unit Tests**: Each service is tested in isolation with TestBed
2. **Comprehensive Coverage**: Both happy paths and error cases are tested
3. **Readable Tests**: Tests use clear, descriptive names following "should..." convention
4. **Setup/Teardown**: Tests use `beforeEach` for consistent state initialization
5. **Test Organization**: Tests are grouped into logical `describe` blocks
6. **Assertions**: Multiple assertions per test to verify complete behavior

#### Continuous Integration

Tests run automatically on every push and pull request via GitHub Actions. The CI pipeline:

1. Runs linting checks
2. Executes the full test suite
3. Generates coverage reports
4. Builds the application for production

See [`.github/workflows/test.yml`](.github/workflows/test.yml) for the complete CI configuration.

## Game Engine

Zork Web features a modern, well-architected game engine built with TypeScript and Angular 20. The engine is designed following SOLID principles with a focus on maintainability, testability, and extensibility.

### Architecture

The game engine uses a layered architecture:

- **Domain Layer**: Core game models (Room, GameObject, Player, Verb, ParserResult)
- **Application Layer**: Game logic services (GameEngine, CommandParser)
- **Presentation Layer**: Angular components for terminal UI
- **Infrastructure Layer**: Storage and data loading services

For detailed architecture documentation, see [docs/architecture.md](docs/architecture.md).

### Core Components

#### Domain Models

The engine defines clear TypeScript interfaces for all game entities:

- **Room**: Locations in the game world with descriptions, exits, and objects
- **GameObject**: Interactive items with properties like portable, visible, and state
- **Player**: Player state including location, inventory, score, and flags
- **Verb**: Available commands/actions with aliases and requirements
- **ParserResult**: Parsed command structure with verb and objects

#### GameEngine Service

The `GameEngineService` is the heart of the game, managing:

- **State management** using Angular signals for reactive updates
- **Command execution** to process player actions
- **Game flow** controlling room transitions and interactions
- **Persistence** for save/load functionality

**Key Features:**
- Signals-based reactive state for optimal performance
- Immutable state updates for predictability
- Command pattern for extensible verb handling
- Save/restore game state to browser storage
- Structured command output for UI rendering

**Public API:**

```typescript
class GameEngineService {
  // State signals (read-only)
  readonly player: Signal<Player>;
  readonly currentRoom: Signal<Room | null>;
  readonly output: Signal<string[]>;

  // Initialization
  initializeGame(): void;
  resetGame(): void;

  // Command execution
  executeCommand(parserResult: ParserResult): CommandOutput;

  // Room management
  addRoom(room: Room): void;
  moveToRoom(roomId: string): void;
  getCurrentRoom(): Room | null;

  // Object management
  addObject(obj: GameObject): void;
  getObject(objectId: string): GameObject | null;

  // Persistence
  saveGame(): string;
  loadGame(saveData: string): void;
}
```

**CommandOutput Interface:**

The `executeCommand` method returns a `CommandOutput` object with structured information:

```typescript
interface CommandOutput {
  messages: string[];      // Text messages to display
  success: boolean;        // Whether command succeeded
  type?: OutputType;       // Semantic type for UI styling
  metadata?: Record<string, unknown>; // Optional additional data
}

type OutputType = 'info' | 'error' | 'success' | 'description' 
                | 'inventory' | 'help' | 'system';
```

**Supported Commands:**

The GameEngine processes the following command types through `executeCommand`:

1. **Navigation Commands:**
   - `go [direction]` - Move to another room
   - `look` - Describe current room with full details
   - `examine [object]` - Examine an object closely

2. **Inventory Commands:**
   - `take [object]` - Pick up a portable object
   - `drop [object]` - Drop an object from inventory
   - `inventory` - List items being carried

3. **Object Interaction:**
   - `open [object]` - Open a container
   - `close [object]` - Close a container
   - `unlock [object] with [key]` - Unlock with a key
   - `lock [object] with [key]` - Lock with a key
   - `read [object]` - Read text on an object
   - `put [object] in [container]` - Place object in container

4. **Light Source Commands:**
   - `light [object]` - Light a light source
   - `extinguish [object]` - Put out a light

5. **Combat Commands:**
   - `attack [target]` - Attack something
   - `attack [target] with [weapon]` - Attack with a weapon

6. **Utility Commands:**
   - `use [object]` - Generic use action
   - `help` - Display available commands

7. **System Commands:**
   - `save` - Save game state
   - `load` - Load saved game
   - `quit` - Exit the game

**Usage Example:**

```typescript
import { GameEngineService, CommandParserService } from './core/services';

@Component({...})
export class GameComponent {
  constructor(
    private engine: GameEngineService,
    private parser: CommandParserService
  ) {}

  ngOnInit() {
    this.engine.initializeGame();
  }

  processInput(input: string) {
    // Parse the command
    const parserResult = this.parser.parse(input);
    
    // Execute through engine
    const output = this.engine.executeCommand(parserResult);
    
    // Handle the output
    if (output.success) {
      console.log('Success:', output.messages);
    } else {
      console.error('Failed:', output.messages);
    }
    
    // Access reactive state
    const player = this.engine.player();
    console.log('Score:', player.score);
    console.log('Moves:', player.moveCount);
  }
}
```

**State Management:**

The GameEngine uses Angular signals for reactive state management:

- **player** - Player state (location, inventory, score, moves, flags)
- **currentRoom** - Current room details
- **output** - History of game output messages

All state updates are immutable, ensuring predictable behavior and enabling time-travel debugging.

**Game World Setup:**

```typescript
// Add rooms
engine.addRoom({
  id: 'west-of-house',
  name: 'West of House',
  description: 'You are standing in an open field west of a white house...',
  shortDescription: 'West of House',
  exits: new Map([
    ['north', 'north-of-house'],
    ['south', 'south-of-house'],
    ['east', 'behind-house']
  ]),
  objectIds: ['mailbox'],
  visited: false
});

// Add objects
engine.addObject({
  id: 'mailbox',
  name: 'small mailbox',
  aliases: ['mailbox', 'box'],
  description: 'The small mailbox is closed.',
  portable: false,
  visible: true,
  location: 'west-of-house',
  properties: {
    isOpen: false,
    contains: ['leaflet']
  }
});
```

#### CommandParser Service

The `CommandParserService` handles natural language parsing of player commands into structured actions.

**Features:**
- **Tokenization**: Breaks down raw input into meaningful tokens
- **Verb-Noun-Prep-Noun Grammar**: Supports complex command structures like "put lamp in mailbox"
- **Noise Word Filtering**: Automatically removes articles (a, an, the) and other filler words
- **Verb Aliases**: Recognizes synonyms (e.g., "get" → "take", "x" → "examine")
- **Direction Shortcuts**: Handles abbreviated directions (n, s, e, w, etc.)
- **Error Handling**: Provides clear error messages for invalid commands
- **Preposition Support**: Handles complex interactions with indirect objects

**Supported Command Patterns:**

1. **Simple Verbs** (no object required)
   ```
   look, inventory (or i), help, save, quit
   ```

2. **Verb + Direct Object**
   ```
   take lamp
   examine mailbox
   open door
   read leaflet
   ```

3. **Verb + Object + Preposition + Indirect Object**
   ```
   put lamp in mailbox
   unlock door with key
   attack troll with sword
   ```

4. **Direction Commands**
   ```
   north (or n)
   go east
   southeast (or se)
   ```

**API Methods:**

- `parse(rawInput: string): ParserResult` - Parse raw user input into a structured command
- `getAvailableVerbs(): Verb[]` - Get list of all recognized verbs with descriptions
- `isVerb(word: string): boolean` - Check if a word is a recognized verb or alias
- `isDirection(word: string): boolean` - Check if a word is a recognized direction

**Example Usage:**

```typescript
import { CommandParserService } from './core/services';

// In your component
constructor(private parser: CommandParserService) {}

parseCommand(input: string) {
  const result = this.parser.parse(input);
  
  if (result.isValid) {
    // Process valid command
    console.log('Verb:', result.verb);
    console.log('Direct Object:', result.directObject);
    console.log('Preposition:', result.preposition);
    console.log('Indirect Object:', result.indirectObject);
  } else {
    // Show error to user
    console.error(result.errorMessage);
  }
}
```


### Design Principles

The engine follows best practices:

- **SOLID principles** for maintainable, extensible code
- **DRY (Don't Repeat Yourself)** with shared models and utilities
- **KISS (Keep It Simple)** with clear separation of concerns
- **Immutability** for reliable state management
- **Testability** with comprehensive unit tests

## Data Conversion Tool

A conversion tool is provided to transform legacy Zork source code (ZIL format) into TypeScript/JSON schema compatible with the game engine. See **[Converter Documentation](docs/CONVERTER.md)** for details.

### Quick Start

```bash
# Convert ZIL source files to JSON
npm run convert -- --source docs/original-src-1980 --output src/app/data

# Or convert specific entity types
npm run convert -- -s docs/original-src-1980/1dungeon.zil -o data/converted -e objects -v
```

The converter supports:
- **Rooms**: Location definitions with descriptions and exits
- **Objects**: Interactive game items with properties and flags
- **Validation**: Automatic validation against JSON schemas
- **Incremental conversion**: Convert specific files or entity types

### Data Integration

The converted game data is automatically loaded when the game engine initializes. The integration process:

1. **Data Files**: Converted JSON files are stored in `src/app/data/`
   - `rooms.json` - 110+ game locations with exits and descriptions
   - `objects.json` - 120+ interactive objects with properties

2. **DataLoaderService**: Handles loading and format conversion
   - Imports JSON files at compile time
   - Converts plain object exits to Map structures
   - Validates data integrity

3. **GameEngineService**: Automatically loads data on initialization
   ```typescript
   import { GameEngineService } from './core/services';
   
   // Initialize the game with converted world data
   gameEngine.initializeGame();
   
   // Data is now loaded - start playing!
   const command = parser.parse('look');
   gameEngine.executeCommand(command);
   ```

4. **Testing**: Comprehensive integration tests validate:
   - Data loading from JSON files
   - Room navigation with converted exits
   - Object interactions
   - Complete gameplay flows

See `src/app/core/services/game-engine-integration.spec.ts` for sample integration tests demonstrating data-driven gameplay.

## Game Commands

Once the game is implemented, the following commands will be available:

- **Direction commands:** north, south, east, west (or n, s, e, w)
- **look:** Look around the current location
- **inventory (or i):** Check what you're carrying
- **take [item]:** Pick up an item
- **drop [item]:** Drop an item you're carrying
- **examine [item]:** Look at an item in detail
- **open/close [item]:** Open or close certain objects
- **help:** Display a list of available commands

## Additional Resources

- [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli)
- [Angular Documentation](https://angular.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/)

## License

This project is released under the MIT License.
