# Zork Web

A web-based clone of the classic text adventure game Zork, built with Angular 20.

## Features

- DOS-style terminal interface
- Command-based text adventure gameplay
- Game state saved in browser's storage
- Classic Zork-inspired world to explore

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
