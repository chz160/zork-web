# Zork Web - Game Guide

## Introduction
Welcome to Zork Web, a clone of the classic text adventure game. In this game, you navigate through a world using text commands, solve puzzles, and explore your surroundings.

## Getting Started

### Basic Navigation
To move around in the game world, you can use direction commands:
- `north` or `n` - Move north
- `south` or `s` - Move south
- `east` or `e` - Move east
- `west` or `w` - Move west
- `up` or `u` - Move up
- `down` or `d` - Move down

### Looking Around
- `look` or `l` - Look at your surroundings
- `examine [object]` or `x [object]` - Look closely at an object
- `inventory` or `i` - List the items you're carrying

### Manipulating Objects
- `take [object]` or `get [object]` - Pick up an object
- `drop [object]` - Drop an object you're carrying
- `open [object]` - Open something (like a mailbox)
- `close [object]` - Close something

### Game Control
- `help` - Show a list of available commands
- `wait` or `z` - Do nothing for one turn
- `restart` - Start a new game

## Processing Modes
The game supports two processing modes:
- **Local Processing**: Commands are processed in your browser
- **Server Processing**: Commands are sent to the server for processing

You can switch between modes by typing `toggle-mode`.

## Tips for Playing
1. Always start by looking around to understand your environment
2. Examine objects for clues or hidden details
3. Try different commands if you're stuck
4. Pay attention to the descriptions of locations and objects
5. The game automatically saves your progress in your browser

## Command Examples
```
> look
You are standing in an open field west of a white house, with a boarded front door.
There is a small mailbox here.

> open mailbox
You open the mailbox, revealing a leaflet.

> take leaflet
You take the leaflet.

> read leaflet
Welcome to Zork Web!
Zork Web is a reimagining of the classic text adventure game.
```

Enjoy your adventure!