# Zork Web - Developer Guide

This guide provides detailed technical information for developers working on the Zork Web project. It covers architecture decisions, implementation details, and development workflows.

## Architecture Overview

Zork Web is a client-server application with the following components:

```
┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │
│  React Frontend │◄────►│  Node.js API    │
│  (xterm.js)     │      │  (Express)      │
│                 │      │                 │
└────────┬────────┘      └─────────────────┘
         │
         │ localStorage
         ▼
┌─────────────────┐
│  Browser        │
│  Storage        │
└─────────────────┘
```

- **React Frontend**: Handles the terminal UI and user interaction
- **Node.js API**: Processes game commands and manages game logic
- **Browser Storage**: Stores game state persistently using localStorage

## Frontend Implementation

### Terminal Interface

The terminal interface is built using xterm.js through the `xterm-react` wrapper. This enables a DOS-like terminal experience with:

- Command history navigation (up/down arrow keys)
- Text styling and colors
- Custom key handlers

Key implementation details:

```jsx
// Terminal.js component key features
<Xterm 
  ref={xtermRef} 
  options={{
    cursorBlink: true,
    theme: {
      background: '#000',
      foreground: '#fff',
      cursor: '#ffffff'
    },
    fontFamily: 'Consolas, monospace',
    fontSize: 16
  }} 
  onInit={(term) => {
    // Initialize terminal
    displayWelcomeMessage(term);
    
    // Set up data event handler
    term.onData(handleTerminalData);
  }}
  onData={handleTerminalData}
/>
```

### Game State Management

Game state is managed through a combination of React state and localStorage:

1. Initial game state is loaded from localStorage or initialized new
2. Commands are sent to the backend API for processing
3. Updated game state is stored back to localStorage after each command

```javascript
// Example of game state object
const gameState = {
  location: 'west_of_house',
  inventory: ['leaflet', 'lamp'],
  moves: 42,
  score: 30,
  gameTime: '2023-03-01T17:30:16.000Z',
  lastCommand: 'look',
  lastCommandTime: '2023-03-01T17:31:20.000Z'
};

// Save game state to localStorage
localStorage.setItem('zorkWebGameState', JSON.stringify(gameState));
```

### Command Processing

User commands are processed through the following workflow:

1. Command is captured from the terminal input
2. Command is sent to the backend API with current game state
3. Backend processes the command and returns updated state and response
4. Terminal displays the response and updates the local game state

## Backend Implementation

### API Server

The backend is built with Express and provides RESTful endpoints for game functionality. The core server features:

- JSON request/response handling
- Error handling and validation
- Static file serving for production builds

### Command Processing

Commands are processed using a pattern-matching approach similar to the original Zork:

1. Parse the user's input into command and object parts
2. Match command against known verbs (move, take, drop, etc.)
3. Validate command in the current game context
4. Apply game rules to update the game state
5. Generate appropriate response text

### Production Deployment

In production, the Express server serves both the API and the static React frontend:

```javascript
// Production middleware
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}
```

## Game World Implementation

### Data Structure

The game world is defined using a graph-based structure:

- **Rooms**: Nodes in the graph with descriptions and contents
- **Connections**: Edges between rooms with directional constraints
- **Items**: Objects that can be examined, taken, or used
- **State Flags**: Track game progress and puzzle completion

Example room definition:

```javascript
{
  "west_of_house": {
    "title": "West of House",
    "description": "You are standing in an open field west of a white house, with a boarded front door.",
    "exits": {
      "north": "north_of_house",
      "south": "south_of_house",
      "west": "forest_1",
      "east": { 
        "condition": "house_door_open",
        "destination": "inside_house",
        "failMessage": "The door is boarded and cannot be opened."
      }
    },
    "items": ["mailbox"]
  }
}
```

## Development Workflow

### Setup Environment

1. Clone the repository
2. Install dependencies with `npm run install-all`
3. Start development servers with `npm run dev`

### Making Changes

1. Frontend changes:
   - Edit React components in `client/src`
   - Test changes in the browser at http://localhost:3000
   - Run tests with `cd client && npm test`

2. Backend changes:
   - Edit Express routes and controllers in `server/`
   - Test API changes using Postman or curl
   - Run tests with `cd server && npm test`

### Building for Production

1. Build the React frontend:
   ```bash
   cd client && npm run build
   ```

2. Start the production server:
   ```bash
   NODE_ENV=production npm start
   ```

## Best Practices

### Code Style

- Use consistent indentation (2 spaces)
- Follow ESLint configuration
- Use descriptive variable and function names
- Add JSDoc comments for functions and components

### State Management

- Keep game state serializable for localStorage
- Update state immutably using spread operators or Object.assign
- Validate state after updates to prevent corruption

### Error Handling

- Use try/catch blocks around API calls
- Provide meaningful error messages
- Implement graceful fallbacks for API failures

## Performance Considerations

- Minimize DOM updates through the terminal
- Batch state updates when possible
- Optimize large text outputs and reflow operations
- Cache game resources for better startup performance

## Security Considerations

- Validate all user input on the server
- Sanitize any user-generated content
- Be cautious with localStorage size limits (typically 5-10MB)
- Use HTTPS in production environments

## Additional Resources

- [xterm.js Documentation](https://xtermjs.org/docs/)
- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://reactjs.org/)
- [Original Zork Documentation](https://zork.fandom.com/wiki/Command_List)