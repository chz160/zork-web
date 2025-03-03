/**
 * game/index.js - Main entry point for the Zork Web game engine
 * Exports all game modules
 */

import { rooms, items } from './world';
import { parseCommand } from './parser';
import { executeCommand } from './commands';
import { 
  initialState, 
  createNewGameState,
  getCurrentRoom, 
  getRoomItems, 
  getInventoryItems 
} from './state';
import {
  saveGame,
  loadGame,
  hasSavedGame,
  deleteSavedGame,
  initializeGame
} from './storage';
import {
  processCommandOnServer,
  initializeGameFromServer,
  saveGameToServer,
  getSavedGamesFromServer
} from './api';

/**
 * Process a user command in the game
 * @param {string} input - Raw user input
 * @param {object} gameState - Current game state
 * @param {boolean} useServer - Whether to use server processing
 * @returns {object} Result with new state and message
 */
const processCommand = async (input, gameState, useServer = false) => {
  if (useServer) {
    try {
      return await processCommandOnServer(input, gameState);
    } catch (error) {
      // Fallback to local processing on error
      console.error('Server processing failed, falling back to local:', error);
      const command = parseCommand(input);
      return executeCommand(gameState, command);
    }
  } else {
    // Local processing
    const command = parseCommand(input);
    return executeCommand(gameState, command);
  }
};

/**
 * Initialize game from server or local storage
 * @param {boolean} loadFromSave - Whether to load from save
 * @param {boolean} useServer - Whether to use server initialization
 * @returns {Promise<object>} Game state
 */
const initGame = async (loadFromSave = true, useServer = false) => {
  if (useServer) {
    try {
      return await initializeGameFromServer();
    } catch (error) {
      console.error('Server initialization failed, falling back to local:', error);
      return initializeGame(loadFromSave);
    }
  } else {
    return initializeGame(loadFromSave);
  }
};

/**
 * Save game to local storage and optionally to server
 * @param {object} gameState - Game state to save
 * @param {boolean} useServer - Whether to save to server
 * @param {string} saveName - Optional save name for server
 * @returns {Promise<boolean>} Success status
 */
const saveGameState = async (gameState, useServer = false, saveName = 'default') => {
  // Always save locally first
  const localSaveResult = saveGame(gameState);
  
  if (useServer) {
    try {
      await saveGameToServer(gameState, saveName);
      return true;
    } catch (error) {
      console.error('Server save failed:', error);
      return localSaveResult;
    }
  }
  
  return localSaveResult;
};

export {
  // World data
  rooms,
  items,
  
  // Command processing
  parseCommand,
  executeCommand,
  processCommand,
  
  // State management
  initialState,
  createNewGameState,
  getCurrentRoom,
  getRoomItems,
  getInventoryItems,
  
  // Storage
  saveGame,
  loadGame,
  hasSavedGame,
  deleteSavedGame,
  initializeGame,
  
  // Enhanced functions with API support
  initGame,
  saveGameState,
  
  // API functions
  processCommandOnServer,
  initializeGameFromServer,
  saveGameToServer,
  getSavedGamesFromServer
};