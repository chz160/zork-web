/**
 * storage.js - localStorage integration for Zork Web
 * Handles saving and loading game state
 */

import { createNewGameState } from './state';

// The localStorage key for game state
const STORAGE_KEY = 'zork-web-game-state';

/**
 * Save game state to localStorage
 * @param {object} gameState - Current game state to save
 * @returns {boolean} Success status
 */
const saveGame = (gameState) => {
  try {
    const stateString = JSON.stringify(gameState);
    localStorage.setItem(STORAGE_KEY, stateString);
    return true;
  } catch (error) {
    console.error('Failed to save game:', error);
    return false;
  }
};

/**
 * Load game state from localStorage
 * @returns {object|null} Loaded game state or null if not found
 */
const loadGame = () => {
  try {
    const stateString = localStorage.getItem(STORAGE_KEY);
    if (!stateString) {
      return null;
    }
    return JSON.parse(stateString);
  } catch (error) {
    console.error('Failed to load game:', error);
    return null;
  }
};

/**
 * Check if a saved game exists
 * @returns {boolean} True if a saved game exists
 */
const hasSavedGame = () => {
  return localStorage.getItem(STORAGE_KEY) !== null;
};

/**
 * Delete the saved game state
 * @returns {boolean} Success status
 */
const deleteSavedGame = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to delete saved game:', error);
    return false;
  }
};

/**
 * Initialize a new game, optionally loading from save
 * @param {boolean} loadFromSave - Whether to load from save if available
 * @returns {object} Game state
 */
const initializeGame = (loadFromSave = true) => {
  if (loadFromSave && hasSavedGame()) {
    const savedState = loadGame();
    if (savedState) {
      return savedState;
    }
  }
  
  return createNewGameState();
};

export {
  saveGame,
  loadGame,
  hasSavedGame,
  deleteSavedGame,
  initializeGame
};