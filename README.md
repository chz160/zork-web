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

#### GameService (UI Bridge)

The `GameService` provides a reactive bridge between UI components and the GameEngine, exposing RxJS observables for real-time state updates. This service implements a facade pattern, making it easy for components to subscribe to game state changes.

**Key Features:**
- RxJS observables for reactive state management
- Automatic bridging from Angular signals to RxJS streams
- Command submission with integrated parsing
- Real-time output streaming to UI components
- Player and room state updates via observables

**Public API:**

```typescript
class GameService {
  // Observable streams for reactive UI updates
  readonly output$: Observable<string[]>;
  readonly player$: Observable<Player | null>;
  readonly currentRoom$: Observable<Room | null>;
  readonly commandOutput$: Observable<CommandOutput>;

  // Initialization
  initializeGame(): void;
  resetGame(): void;

  // Command submission (includes parsing)
  submitCommand(input: string): void;

  // Getter methods for one-time access
  getPlayer(): Observable<Player | null>;
  getCurrentRoom(): Observable<Room | null>;
  getOutput(): Observable<string[]>;
}
```

**Integration Example:**

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { GameService } from './core/services/game.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-game',
  template: `
    <div class="game-container">
      <app-console />
      <app-input />
    </div>
  `,
})
export class GameComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();

  constructor(private gameService: GameService) {}

  ngOnInit() {
    // Initialize the game
    this.gameService.initializeGame();

    // Subscribe to game output
    this.subscriptions.add(
      this.gameService.output$.subscribe(messages => {
        console.log('Game output:', messages);
      })
    );

    // Subscribe to player state changes
    this.subscriptions.add(
      this.gameService.player$.subscribe(player => {
        console.log('Player location:', player?.currentRoomId);
        console.log('Score:', player?.score);
      })
    );

    // Subscribe to command results
    this.subscriptions.add(
      this.gameService.commandOutput$.subscribe(output => {
        if (output.success) {
          console.log('Command succeeded:', output.messages);
        } else {
          console.error('Command failed:', output.messages);
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  // Submit a command
  onCommand(input: string) {
    this.gameService.submitCommand(input);
  }
}
```

**UI Component Integration:**

The ConsoleComponent and InputComponent are connected to the GameService via RxJS observables:

- **ConsoleComponent**: Subscribes to `output$` to display game messages in real-time
- **InputComponent**: Uses `submitCommand()` to send player commands to the engine
- **State Updates**: Both components automatically update when observables emit new values

This reactive architecture ensures that:
1. Commands flow from input → parser → engine → output
2. State changes are immediately reflected in the UI
3. Components remain decoupled from game logic
4. Testing is straightforward with observable mocking

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

The `CommandParserService` handles natural language parsing of player commands into structured actions with support for conversational, flexible input.

**Features:**
- **Conversational Input**: Supports phrasal verbs like "look in", "pick up", "turn on"
- **Pronoun Resolution**: Use "it", "them", "that" to refer to recently mentioned objects
- **Data-Driven Configuration**: Synonyms and phrasal verbs defined in JSON for easy extension
- **Tokenization**: Breaks down raw input into meaningful tokens
- **Verb-Noun-Prep-Noun Grammar**: Supports complex command structures like "put lamp in mailbox"
- **Noise Word Filtering**: Automatically removes articles (a, an, the) and other filler words
- **Verb Aliases**: Recognizes synonyms (e.g., "get" → "take", "x" → "examine")
- **Direction Shortcuts**: Handles abbreviated directions (n, s, e, w, etc.)
- **Error Handling**: Provides clear error messages for invalid commands
- **Preposition Support**: Handles complex interactions with indirect objects
- **Backward Compatible**: All original commands continue to work

> 📖 **See [Conversational Parser Documentation](docs/CONVERSATIONAL-PARSER.md) for complete details on phrasal verbs, pronouns, and natural language support.**

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

5. **Phrasal Verbs** (NEW!)
   ```
   look in mailbox
   pick up lamp
   turn on lamp
   put down sword
   ```

6. **Pronouns** (NEW!)
   ```
   examine mailbox
   open it
   look in it
   take it
   ```

**API Methods:**

- `parse(rawInput: string): ParserResult` - Parse raw user input into a structured command
- `setLastReferencedObject(objectName: string | null): void` - Update context for pronoun resolution
- `getLastReferencedObject(): string | null` - Get current context
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
    console.log('Tokens:', result.tokens);
  } else {
    // Show error to user
    console.error(result.errorMessage);
    // Optionally show suggestions
    if (result.suggestions) {
      console.log('Did you mean:', result.suggestions);
    }
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

## Console UI Component

The ConsoleComponent provides a classic DOS-style terminal interface for displaying game output. It features a retro green-on-black aesthetic reminiscent of classic text adventure games.

### Features

- **Real-time Output Display**: Renders game output chronologically as it's produced by the GameEngine
- **Auto-scroll**: Automatically scrolls to the latest output, with smart scroll detection (disables when user scrolls up)
- **Semantic Styling**: Different output types (errors, success, descriptions) are color-coded for clarity
- **Responsive Design**: Adapts to different screen sizes with appropriate font sizes and padding
- **Accessibility**: Full ARIA support with live regions, keyboard navigation, and screen reader announcements
- **Classic Terminal Aesthetics**: 
  - Green phosphor glow effect
  - Monospace font (Courier New)
  - Custom scrollbar styling
  - Smooth animations and transitions

### Usage

Import and use the console in your Angular component:

```typescript
import { Console } from './console/console';
import { GameEngineService } from './core/services/game-engine.service';

@Component({
  selector: 'app-game',
  imports: [Console],
  template: `
    <div class="game-container">
      <app-console />
    </div>
  `,
})
export class GameComponent implements OnInit {
  private gameEngine = inject(GameEngineService);

  ngOnInit() {
    this.gameEngine.initializeGame();
  }
}
```

The ConsoleComponent automatically subscribes to the GameEngine's output signal and displays all game messages.

### Styling

The console features color-coded output types:

- **Info** (default): Standard green (#00ff00)
- **Error**: Red (#ff4444) with glow effect
- **Success**: Bright green (#44ff44) with glow effect
- **Description**: Light green (#88ff88) with italic text
- **Help**: Yellow (#ffff00) with glow effect
- **System**: Cyan (#00ffff) for system messages

### Keyboard Navigation

When the console output area is focused:

- **Scroll Wheel**: Scroll through output
- **Page Up/Down**: Jump through pages of output
- **Home/End**: Jump to top/bottom of output
- **Tab**: Focus the console for keyboard scrolling

### Accessibility Features

- **ARIA Live Region**: Screen readers announce new output as it appears
- **Keyboard Focusable**: Output area can be focused for keyboard scrolling
- **High Contrast Support**: Increased border width and font weight in high contrast mode
- **Reduced Motion Support**: Animations disabled when user prefers reduced motion
- **Semantic Markup**: Proper roles and labels for assistive technology

### Responsive Behavior

The console adapts to different screen sizes:

- **Desktop** (>768px): 14px font, full padding, 2px border
- **Tablet** (≤768px): 12px font, reduced padding, 1px border  
- **Mobile** (≤480px): 11px font, minimal padding

### Testing

The ConsoleComponent includes comprehensive unit tests covering:

- Rendering of game output
- Empty state handling
- Scroll behavior and auto-scroll logic
- Line type inference and styling
- Accessibility features (ARIA attributes, keyboard support)
- Responsive design behavior

Run the console tests with:

```bash
npm test -- --include='**/console.spec.ts' --no-watch --browsers=ChromeHeadless
```

## Input UI Component

The InputComponent allows players to enter commands to the game engine in Angular. It supports keyboard navigation, command history, focus management, and input validation. The component is designed to be accessible and mobile-friendly.

### Features

- **Command Submission**: Enter key submits commands to the game engine
- **Command History Navigation**: Use Up/Down arrow keys to cycle through previously entered commands
- **Focus Management**: Automatically focuses the input field on load and after command submission
- **Input Validation**: Prevents submission of empty or whitespace-only commands
- **Keyboard Shortcuts**: 
  - **Enter**: Submit command
  - **Up Arrow**: Navigate to previous command in history
  - **Down Arrow**: Navigate to next command in history
  - **Escape**: Clear current input
- **Accessibility**: Full ARIA labels, roles, and screen reader support
- **Mobile-Friendly**: Responsive design with touch-friendly input
- **Classic Terminal Aesthetics**: Matches the console theme with green-on-black styling

### Usage

Import and use the input component in your Angular component:

```typescript
import { Input } from './input/input';
import { GameEngineService } from './core/services/game-engine.service';

@Component({
  selector: 'app-game',
  imports: [Input],
  template: `
    <div class="game-container">
      <app-input />
    </div>
  `,
})
export class GameComponent implements OnInit {
  private gameEngine = inject(GameEngineService);

  ngOnInit() {
    this.gameEngine.initializeGame();
  }
}
```

The InputComponent automatically parses commands using the CommandParserService and executes them through the GameEngineService.

### Command History

The input component maintains a history of up to 100 previously entered commands:

- **Navigate Up**: Press Up Arrow to move backwards through command history
- **Navigate Down**: Press Down Arrow to move forwards through command history
- **Preserve Current Input**: When you start navigating history with text in the input, that text is preserved and restored when you navigate past the end of history
- **No Duplicates**: Consecutive duplicate commands are not added to history
- **Persistent**: History is maintained for the duration of the session

### Keyboard Shortcuts

- **Enter**: Submit the current command
- **Up Arrow**: Navigate to previous command in history
- **Down Arrow**: Navigate to next command in history
- **Escape**: Clear the current input field

### Accessibility Features

- **ARIA Labels**: Proper labeling for screen readers
- **ARIA Roles**: Form role for semantic structure
- **Screen Reader Instructions**: Hidden instructions for keyboard navigation
- **Auto-focus**: Input field is automatically focused on component load
- **Focus Retention**: Focus is maintained after command submission
- **High Contrast Support**: Enhanced styling in high contrast mode

### Responsive Design

The input adapts to different screen sizes:

- **Desktop** (>768px): 16px font, full padding, 2px border
- **Tablet** (≤768px): 14px font, reduced padding, 1px border
- **Mobile** (≤480px): 13px font, minimal padding

### Styling

The input component matches the console theme:

- Green text on black background (#00ff00 on #000)
- Green border with glow effect
- Monospace font (Courier New)
- Green prompt indicator (">")
- Transparent input background
- Green caret/cursor

### Testing

The InputComponent includes comprehensive unit tests covering:

- Command submission and validation
- Command history navigation (Up/Down arrows)
- Keyboard shortcuts (Enter, Escape)
- Focus management
- Input change handling
- Accessibility features
- Empty input handling
- History limit (100 commands)

Run the input tests with:

```bash
npm test -- --include='**/input.spec.ts' --no-watch --browsers=ChromeHeadless
```

### Integration Example

A complete example showing Console and Input working together:

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { Console } from './console/console';
import { Input } from './input/input';
import { GameEngineService } from './core/services/game-engine.service';

@Component({
  selector: 'app-game',
  imports: [Console, Input],
  template: `
    <div class="game-container">
      <div class="console-wrapper">
        <app-console />
        <app-input />
      </div>
    </div>
  `,
  styles: [`
    .game-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      padding: 1rem;
      background-color: #1a1a1a;
    }
    
    .console-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
  `]
})
export class GameComponent implements OnInit {
  private gameEngine = inject(GameEngineService);

  ngOnInit() {
    this.gameEngine.initializeGame();
  }
}
```

This setup provides a complete interactive terminal interface where:
1. The Console displays game output
2. The Input captures player commands
3. Commands are automatically parsed and executed through the GameEngine
4. Output is displayed in real-time in the Console

## UI Styling and Theming

Zork Web features a classic retro terminal aesthetic with comprehensive styling that evokes the look and feel of vintage text adventure games from the 1980s.

### Visual Design

The UI implements a **classic green phosphor CRT terminal** aesthetic:

- **Monospace Typography**: Courier New font throughout for authentic terminal feel
- **Color Palette**: Green-on-black color scheme (#00ff00 on #000000) reminiscent of early computer terminals
- **Glow Effects**: Subtle text and border glow effects simulate phosphor screen illumination
- **CRT Screen Effects**: Optional subtle vignette and scanline effects for vintage monitor simulation
- **Minimal Chrome**: Clean, distraction-free interface focused on the game content

### CSS Custom Properties (Theme Variables)

The styling system uses CSS custom properties for easy customization. All theme variables are defined in `src/styles.css`:

```css
:root {
  /* Primary colors - classic green phosphor terminal */
  --zork-primary: #00ff00;           /* Main green */
  --zork-primary-bright: #44ff44;    /* Bright green (success) */
  --zork-primary-dim: #88ff88;       /* Dim green (descriptions) */
  --zork-primary-faint: #00ff0066;   /* Transparent green */
  --zork-background: #000000;        /* Pure black background */
  --zork-background-alt: #001a00;    /* Dark green background */
  --zork-background-dark: #1a1a1a;   /* Darker gray */

  /* Semantic colors */
  --zork-error: #ff4444;             /* Red for errors */
  --zork-success: #44ff44;           /* Bright green for success */
  --zork-warning: #ffff00;           /* Yellow for warnings */
  --zork-info: #00ffff;              /* Cyan for info */

  /* Typography */
  --zork-font-family: 'Courier New', Courier, monospace;
  --zork-font-size-base: 14px;       /* Base console font size */
  --zork-font-size-input: 16px;      /* Input field font size */
  --zork-line-height: 1.5;

  /* Spacing */
  --zork-spacing-xs: 0.25rem;
  --zork-spacing-sm: 0.5rem;
  --zork-spacing-md: 0.75rem;
  --zork-spacing-lg: 1rem;
  --zork-spacing-xl: 1.5rem;

  /* Effects */
  --zork-glow-subtle: 0 0 5px rgba(0, 255, 0, 0.3);
  --zork-glow-medium: 0 0 10px rgba(0, 255, 0, 0.5);
  --zork-glow-strong: 0 0 15px rgba(0, 255, 0, 0.8);
  --zork-border-width: 2px;
  --zork-border-radius: 4px;

  /* CRT effects (optional) */
  --zork-scanline-opacity: 0.03;     /* Scanline visibility */
  --zork-flicker-intensity: 0;       /* Screen flicker (future) */
}
```

### Customizing the Theme

You can customize the appearance by modifying CSS custom properties. Here are common customization scenarios:

#### Change Color Scheme

To use a different color (e.g., amber terminal):

```css
:root {
  --zork-primary: #ffb000;
  --zork-primary-bright: #ffd700;
  --zork-primary-dim: #cc8800;
}
```

#### Adjust Glow Intensity

To increase or decrease the phosphor glow effect:

```css
:root {
  --zork-glow-subtle: 0 0 8px rgba(0, 255, 0, 0.5);
  --zork-glow-medium: 0 0 15px rgba(0, 255, 0, 0.7);
  --zork-glow-strong: 0 0 20px rgba(0, 255, 0, 1);
}
```

#### Disable CRT Scanlines

To remove the scanline effect:

```css
:root {
  --zork-scanline-opacity: 0;
}
```

### Font Size Controls

The application includes built-in accessibility controls for adjusting font size:

#### Keyboard Shortcuts

- **Ctrl/Cmd + Plus (+)**: Increase font size
- **Ctrl/Cmd + Minus (-)**: Decrease font size
- **Ctrl/Cmd + 0**: Reset to default (medium) size

#### UI Controls

Click the **"⚙ Controls"** button in the header to access the Display Settings panel:

- **A- Button**: Decrease font size
- **A+ Button**: Increase font size
- **Reset Button**: Return to default medium size

Font size changes are:
- **Immediately applied** across all UI components
- **Persistent** - saved to browser localStorage
- **Responsive** - maintain proper proportions on mobile devices

#### Available Font Sizes

Four preset sizes are available:

- **Small**: 12px base / 14px input
- **Medium** (default): 14px base / 16px input
- **Large**: 16px base / 18px input
- **Extra Large**: 18px base / 20px input

### Accessibility Features

The UI is designed with WCAG AA compliance in mind:

#### High Contrast Support

When the user's system is in high contrast mode (`prefers-contrast: high`), the UI automatically:

- Increases border widths for better visibility
- Enhances glow effects for improved contrast
- Applies bold font weights to text

#### Reduced Motion Support

When the user prefers reduced motion (`prefers-reduced-motion: reduce`), the UI:

- Disables all animations and transitions
- Removes CRT scanline effects
- Provides instant visual feedback instead of animated changes

#### Screen Reader Support

All interactive elements include:

- Proper ARIA labels and roles
- Live region announcements for game output
- Hidden instructions for keyboard navigation
- Semantic HTML markup

#### Keyboard Navigation

Full keyboard support is provided:

- **Tab/Shift+Tab**: Navigate between controls
- **Arrow Keys**: Navigate command history
- **Escape**: Clear input field
- **Enter**: Submit commands

### Responsive Design

The UI adapts seamlessly to different screen sizes:

#### Desktop (>768px)
- Full-size fonts (14px console, 16px input)
- Standard padding and spacing
- 2px borders with prominent glow effects

#### Tablet (≤768px)
- Slightly reduced fonts
- Optimized padding for touch targets
- 1px borders to maximize screen space

#### Mobile (≤480px)
- Compact fonts for readability
- Minimal padding
- Simplified controls layout

### Styling Files

The styling is organized across multiple files:

- **`src/styles.css`**: Global styles and CSS custom properties
- **`src/app/app.html`**: App container and header styles (inline)
- **`src/app/console/console.css`**: Console component styles
- **`src/app/input/input.css`**: Input component styles

### Color-Coded Output Types

The console displays different message types with distinct colors:

| Type | Color | Usage |
|------|-------|-------|
| Info (default) | Green (#00ff00) | Standard game messages |
| Error | Red (#ff4444) | Error messages and warnings |
| Success | Bright Green (#44ff44) | Successful actions |
| Description | Light Green (#88ff88) | Room descriptions (italic) |
| Help | Yellow (#ffff00) | Help text |
| System | Cyan (#00ffff) | System messages |
| Command | White (#ffffff) | User commands (with green highlight) |

### Print Styles

When printing game transcripts:

- Colors are converted to grayscale
- Green borders become black
- Glow effects are removed
- Input field is hidden
- Optimal layout for paper

### Browser Compatibility

The styling is tested and works on:

- **Chrome/Edge**: Full support including custom scrollbars
- **Firefox**: Full support with standard scrollbar styling
- **Safari**: Full support with system scrollbar
- **Mobile browsers**: Optimized touch-friendly interface

### Examples

See the screenshots below for examples of the Zork-style UI:

**Default View:**
![Zork Web Default View](https://github.com/user-attachments/assets/abcf04b7-6a6c-4b75-940a-5446844020b2)

**With Controls Panel:**
![Zork Web Controls Panel](https://github.com/user-attachments/assets/e79c1d4c-b9e3-43a1-ab6a-72e4d0e26bda)

**Large Font Size:**
![Zork Web Large Font](https://github.com/user-attachments/assets/88e4ab9e-fd4a-4461-b494-7bc14894b942)

## Game Commands

The Zork Web application provides an interactive command-line interface through the InputComponent. Players can enter commands using the input field at the bottom of the screen.

### Available Commands

- **Direction commands:** north, south, east, west (or n, s, e, w)
- **look:** Look around the current location
- **inventory (or i):** Check what you're carrying
- **take [item]:** Pick up an item
- **drop [item]:** Drop an item you're carrying
- **examine [item]:** Look at an item in detail
- **open/close [item]:** Open or close certain objects
- **help:** Display a list of available commands

### Using the Command Input

1. Click in the input field at the bottom of the screen (it auto-focuses on page load)
2. Type your command
3. Press **Enter** to submit
4. Use **Up/Down arrow keys** to navigate through command history
5. Press **Escape** to clear the current input

The input component remembers up to 100 previous commands, allowing you to easily repeat or modify earlier commands.

## Additional Resources

- [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli)
- [Angular Documentation](https://angular.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/)

## License

This project is released under the MIT License.
