/**
 * state.js - Game state management for Zork Web
 * Handles player state, inventory, and game progression
 */

import { rooms, items } from './world';

// Number of turns in darkness before Grue danger
const GRUE_DANGER_THRESHOLD = 3;

// Initial game state
const initialState = {
  currentRoom: 'west-of-house',
  inventory: [],
  moves: 0,
  score: 0,
  scoredTreasures: [], // track which treasures have been scored
  turnsInDarkness: 0,
  gameStatus: 'playing', // can be 'playing', 'won', 'lost'
  itemStates: {} // tracks custom states of items
};

// Create a new game state
const createNewGameState = () => {
  return { ...initialState };
};

// Get the current room object
const getCurrentRoom = (gameState) => {
  return rooms[gameState.currentRoom];
};

// Check if the player has a light source
const hasLightSource = (gameState) => {
  return gameState.inventory.includes('brass-lantern') && 
         items['brass-lantern'].state === 'lit';
};

// Check if the player can see in the current room
const canSeeInRoom = (gameState) => {
  const room = getCurrentRoom(gameState);
  // Can see if room is not dark or player has a lit lantern
  return !room.dark || hasLightSource(gameState);
};

// Process turn in darkness
const processDarknessTurn = (gameState) => {
  const room = getCurrentRoom(gameState);
  
  // Only count turns in darkness if the room is dark and player has no light
  if (room.dark && !hasLightSource(gameState)) {
    // Increment darkness counter
    const newTurnsInDarkness = gameState.turnsInDarkness + 1;
    
    // Check for Grue attack
    if (newTurnsInDarkness >= GRUE_DANGER_THRESHOLD) {
      return {
        ...gameState,
        turnsInDarkness: newTurnsInDarkness,
        gameStatus: 'lost'
      };
    }
    
    return {
      ...gameState,
      turnsInDarkness: newTurnsInDarkness
    };
  }
  
  // Reset darkness counter if room is lit or player has light
  return {
    ...gameState,
    turnsInDarkness: 0
  };
};

// Get visible items in the current room
const getRoomItems = (gameState) => {
  const room = getCurrentRoom(gameState);
  
  // If it's dark and player has no light, return no items
  if (room.dark && !hasLightSource(gameState)) {
    return [];
  }
  
  return room.items.map(itemId => items[itemId]);
};

// Get player's inventory items
const getInventoryItems = (gameState) => {
  return gameState.inventory.map(itemId => items[itemId]);
};

// Move player to a new room
const moveToRoom = (gameState, direction) => {
  const currentRoom = rooms[gameState.currentRoom];
  const nextRoomId = currentRoom.connections[direction];
  
  if (nextRoomId) {
    const baseState = {
      ...gameState,
      currentRoom: nextRoomId,
      moves: gameState.moves + 1
    };
    
    // Process darkness turn after moving
    return processDarknessTurn(baseState);
  }
  
  return gameState;
};

// Add item to inventory
const addToInventory = (gameState, itemId) => {
  const room = rooms[gameState.currentRoom];
  const itemIndex = room.items.indexOf(itemId);
  
  if (itemIndex !== -1 && items[itemId].takeable) {
    // Remove item from room
    const updatedRoomItems = [...room.items];
    updatedRoomItems.splice(itemIndex, 1);
    
    // Add item to inventory
    const updatedInventory = [...gameState.inventory, itemId];
    
    // Update room items
    rooms[gameState.currentRoom].items = updatedRoomItems;
    
    const baseState = {
      ...gameState,
      inventory: updatedInventory,
      moves: gameState.moves + 1
    };
    
    // Process darkness turn after action
    return processDarknessTurn(baseState);
  }
  
  return gameState;
};

// Drop item from inventory
const dropItem = (gameState, itemId) => {
  const itemIndex = gameState.inventory.indexOf(itemId);
  
  if (itemIndex !== -1) {
    // Remove item from inventory
    const updatedInventory = [...gameState.inventory];
    updatedInventory.splice(itemIndex, 1);
    
    // Add item to room
    const roomItems = [...rooms[gameState.currentRoom].items, itemId];
    rooms[gameState.currentRoom].items = roomItems;
    
    const baseState = {
      ...gameState,
      inventory: updatedInventory,
      moves: gameState.moves + 1
    };
    
    // Process darkness turn after action
    return processDarknessTurn(baseState);
  }
  
  return gameState;
};

// Look at current room
const lookRoom = (gameState) => {
  // Increment the moves counter and process darkness
  const baseState = {
    ...gameState,
    moves: gameState.moves + 1
  };
  
  return processDarknessTurn(baseState);
};

// Examine an item
const examineItem = (gameState, itemId) => {
  const baseState = {
    ...gameState,
    moves: gameState.moves + 1
  };
  
  return processDarknessTurn(baseState);
};

// Handle light/extinguish commands
const updateItemState = (gameState, itemId, newState) => {
  // Create a copy of the game state
  const baseState = {
    ...gameState,
    moves: gameState.moves + 1
  };
  
  // Process darkness after changing item state
  return processDarknessTurn(baseState);
};

// Calculate the maximum possible score
const calculateMaxScore = () => {
  let maxScore = 0;
  
  // Loop through all items
  Object.values(items).forEach(item => {
    if (item.treasure && item.value) {
      maxScore += item.value;
    }
  });
  
  return maxScore;
};

// Add a treasure to the trophy case and score it
const scoreTreasure = (gameState, treasureId) => {
  // Check if treasure is already scored
  if (gameState.scoredTreasures.includes(treasureId)) {
    return gameState;
  }
  
  const treasure = items[treasureId];
  
  // Only score if it's a treasure
  if (treasure && treasure.treasure) {
    return {
      ...gameState,
      score: gameState.score + treasure.value,
      scoredTreasures: [...gameState.scoredTreasures, treasureId]
    };
  }
  
  return gameState;
};

// Put an item into a container
const putItemInContainer = (gameState, itemId, containerId) => {
  const itemIndex = gameState.inventory.indexOf(itemId);
  
  if (itemIndex !== -1) {
    // Is the container in the current room?
    const room = rooms[gameState.currentRoom];
    if (!room.items.includes(containerId)) {
      return gameState;
    }
    
    const container = items[containerId];
    
    // Is it a container that can be opened?
    if (!container || !container.contains || !container.state) {
      return gameState;
    }
    
    // Is the container open?
    if (container.state !== 'open') {
      return gameState;
    }
    
    // Remove item from inventory
    const updatedInventory = [...gameState.inventory];
    updatedInventory.splice(itemIndex, 1);
    
    // Add item to container
    container.contains.push(itemId);
    
    let baseState = {
      ...gameState,
      inventory: updatedInventory,
      moves: gameState.moves + 1
    };
    
    // If putting a treasure in the trophy case, score it
    if (containerId === 'trophy-case' && items[itemId].treasure) {
      baseState = scoreTreasure(baseState, itemId);
    }
    
    // Process darkness turn after action
    return processDarknessTurn(baseState);
  }
  
  return gameState;
};

export {
  initialState,
  createNewGameState,
  getCurrentRoom,
  getRoomItems,
  getInventoryItems,
  moveToRoom,
  addToInventory,
  dropItem,
  lookRoom,
  examineItem,
  hasLightSource,
  canSeeInRoom,
  updateItemState,
  calculateMaxScore,
  scoreTreasure,
  putItemInContainer,
  GRUE_DANGER_THRESHOLD
};