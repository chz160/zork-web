# Zork Web

A web-based clone of the classic text adventure game Zork, built with Angular 20.

## Features

- DOS-style terminal interface
- Command-based text adventure gameplay
- Game state saved in browser's storage
- Classic Zork-inspired world to explore

## Documentation Resources

This project includes valuable reference materials in the `/docs` folder:

- **Original Zork Source Code** (`/docs/original-src/`) - The 1977 MIT source code for Zork, written in MDL for the PDP-10. This historical code serves as a reference for understanding the original game mechanics, world design, and command parsing. See the [README](docs/original-src/README.md) for details about the file organization and rights.

- **Game Walkthroughs** (`/docs/walkthrough1.md`, `/docs/walkthrough2.md`, `/docs/walkthrough3.md`) - Complete game transcripts showing different approaches to solving Zork. These are useful for:
  - Testing game implementation completeness
  - Verifying correct behavior of puzzles and interactions
  - Understanding the full scope of the game world
  - Reference for implementing game logic and responses

Contributors should reference these resources when implementing game features to ensure authenticity to the original Zork experience.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (version 18.19 or later)
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

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner:

```bash
npm test
```

Or:

```bash
ng test
```

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
