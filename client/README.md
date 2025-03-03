# Zork Web - Frontend

This is the React frontend application for the Zork Web project. It provides a terminal interface for playing the Zork text adventure game.

## Features

- Terminal interface using xterm.js
- Command history navigation using arrow keys
- Game state persistence in localStorage
- Responsive design for various screen sizes

## Components

### Terminal.js

The core component that renders the xterm.js terminal and handles user input. Features include:

- Terminal styling for DOS-like appearance
- Command history navigation
- Integration with game engine for command processing
- Auto-saving of game state

### Game Engine

Located in the `src/engine` directory, the game engine processes user commands and manages game state:

- Parses natural language commands
- Updates game state based on player actions
- Generates appropriate response text
- Handles special commands (save, restore, etc.)

## Development

### Prerequisites

- Node.js (v14.0.0+ recommended)
- npm or yarn

### Available Scripts

In the project directory, you can run:

#### `npm start`

Runs the app in development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

#### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

#### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

### Project Structure

```
src/
├── components/       # React components
│   ├── Terminal.js   # Terminal interface component
│   └── ...
├── engine/           # Game engine
│   ├── commands.js   # Command processing
│   ├── gameState.js  # Game state management
│   └── ...
├── data/             # Game world data
│   ├── rooms.js      # Room definitions
│   ├── items.js      # Item definitions
│   └── ...
├── utils/            # Utility functions
├── App.js            # Main React component
├── index.js          # Application entry point
└── ...
```

## Integration with Backend

The frontend communicates with the Node.js backend API to:

1. Initialize game state
2. Process commands
3. Handle save/restore functionality

See the main project README for more details on the complete application.