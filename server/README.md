# Zork Web - Backend API

This is the backend API for the Zork Web Clone project. It provides endpoints for game initialization, command processing, and save functionality.

## Overview

The backend server is built with Node.js and Express, providing a RESTful API for the Zork Web game. The server handles:

- Game initialization
- Command processing
- Save/restore functionality
- Serving the React frontend in production

## API Endpoints

### Initialize Game
- **URL**: `/api/game/init`
- **Method**: `GET`
- **Description**: Initializes a new game session
- **Response**: Returns initial game state

```json
{
  "success": true,
  "message": "Game initialized successfully",
  "data": {
    "location": "west_of_house",
    "inventory": [],
    "moves": 0,
    "score": 0,
    "gameTime": "2023-03-01T17:30:16.000Z"
  }
}
```

### Process Command
- **URL**: `/api/game/command`
- **Method**: `POST`
- **Description**: Processes a player command and updates game state
- **Data Params**: 
  ```json
  {
    "command": "look",
    "gameState": { /* Current game state object */ }
  }
  ```
- **Response**: Returns updated game state and response message

```json
{
  "success": true,
  "message": "You entered: look",
  "data": {
    "location": "west_of_house",
    "inventory": [],
    "moves": 1,
    "score": 0,
    "gameTime": "2023-03-01T17:30:16.000Z",
    "lastCommand": "look",
    "lastCommandTime": "2023-03-01T17:31:20.000Z"
  }
}
```

### Get Saved Games
- **URL**: `/api/game/save`
- **Method**: `GET`
- **Description**: Returns information about saved games
- **Response**: Information about saved games

```json
{
  "success": true,
  "message": "Game saves are stored in browser localStorage",
  "data": null
}
```

### Save Game
- **URL**: `/api/game/save`
- **Method**: `POST`
- **Description**: Saves the current game state
- **Data Params**: 
  ```json
  {
    "gameState": { /* Current game state object */ },
    "saveName": "My Save" // Optional
  }
  ```
- **Response**: Returns save confirmation

```json
{
  "success": true,
  "message": "Game saved successfully as \"My Save\"",
  "data": {
    "saveTime": "2023-03-01T17:32:45.000Z",
    "saveName": "My Save"
  }
}
```

## Server Configuration

The server runs on port 5000 by default and can be configured using environment variables:

- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment setting ('development' or 'production')

## Project Structure

```
server/
├── controllers/       # Request handlers (future implementation)
├── routes/            # API routes (future implementation)
├── utils/             # Utility functions
├── server.js          # Main server application
└── test.js            # API tests
```

## Running the Server

### Development Mode

```bash
# Install dependencies
npm install

# Run in development mode with nodemon
npm run dev
```

### Production Mode

```bash
# Install dependencies
npm install

# Run in production mode
npm start
```

## Testing the API

The server includes basic API tests that verify the functionality of each endpoint.

```bash
# Run API tests
npm test
```

## Error Handling

The API returns appropriate error responses with status codes and messages:

- `400 Bad Request`: Missing or invalid parameters
- `500 Internal Server Error`: Server-side errors

## Integration with Frontend

In production mode, the server serves the React frontend from the `../client/build` directory. This allows the entire application to be deployed as a single unit.

## Future Enhancements

- Database integration for persistent game storage
- User authentication for saving games to user accounts
- Enhanced command processing with a more sophisticated game engine