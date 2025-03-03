# Zork Web

A web-based clone of the classic text adventure game Zork, built with React and Node.js.

## Features

- DOS-style terminal interface using xterm.js
- Command-based text adventure gameplay
- Game state saved in browser's localStorage
- Server and local processing modes
- Classic Zork-inspired world to explore

## Quick Start

1. **Install dependencies:**
   ```
   npm run install-all
   ```

2. **Start the development environment:**
   ```
   npm run dev
   ```
   This will start both the client and server.

3. **Play the game:**
   Open your browser to http://localhost:3000

## Game Commands

- **Direction commands:** north, south, east, west (or n, s, e, w)
- **look:** Look around the current location
- **inventory (or i):** Check what you're carrying
- **take [item]:** Pick up an item
- **drop [item]:** Drop an item you're carrying
- **examine [item]:** Look at an item in detail
- **open/close [item]:** Open or close certain objects
- **help:** Display a list of available commands

## Development Scripts

- `npm run install-all` - Install all dependencies
- `npm run dev` - Start both client and server in development mode
- `npm run dev:script` - Alternative development starter script
- `npm run client` - Start just the client
- `npm run server` - Start just the server
- `npm run test-client` - Run client tests
- `npm run test-server` - Run server tests

## Processing Modes

The game can run in two modes:
- **Local Processing:** Commands processed in the browser (default)
- **Server Processing:** Commands sent to Node.js backend

Switch between modes by typing `toggle-mode` in the game.

## License

This project is released under the MIT License.