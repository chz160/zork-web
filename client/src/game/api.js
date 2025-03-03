/**
 * api.js - API client for communicating with the backend
 */

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:9876/api';

/**
 * Initialize a new game from the server
 * @returns {Promise<object>} Game initialization response
 */
export const initializeGameFromServer = async () => {
  try {
    const response = await fetch(`${API_URL}/game/init`);
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to initialize game');
    }
    
    return data.data;
  } catch (error) {
    console.error('API Error initializing game:', error);
    throw error;
  }
};

/**
 * Process a command through the server
 * @param {string} command - User command
 * @param {object} gameState - Current game state
 * @returns {Promise<object>} Command processing result
 */
export const processCommandOnServer = async (command, gameState) => {
  try {
    const response = await fetch(`${API_URL}/game/command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ command, gameState }),
    });
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to process command');
    }
    
    return {
      message: data.message,
      newState: data.data,
      restart: false, // Server will indicate if restart is needed
    };
  } catch (error) {
    console.error('API Error processing command:', error);
    // Return a user-friendly error message with the original game state
    return {
      message: `ERROR: Could not connect to the server. ${error.message}`,
      newState: gameState,
      restart: false,
    };
  }
};

/**
 * Save game state to the server
 * @param {object} gameState - Current game state
 * @param {string} saveName - Optional save name
 * @returns {Promise<object>} Save result
 */
export const saveGameToServer = async (gameState, saveName = 'default') => {
  try {
    const response = await fetch(`${API_URL}/game/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gameState, saveName }),
    });
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to save game');
    }
    
    return data;
  } catch (error) {
    console.error('API Error saving game:', error);
    throw error;
  }
};

/**
 * Get saved games from server
 * @returns {Promise<object>} Saved games data
 */
export const getSavedGamesFromServer = async () => {
  try {
    const response = await fetch(`${API_URL}/game/save`);
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to get saved games');
    }
    
    return data;
  } catch (error) {
    console.error('API Error getting saved games:', error);
    throw error;
  }
};