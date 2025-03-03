const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 9876;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple test API endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Game API Endpoints

/**
 * Initialize a new game session
 * GET /api/game/init
 */
app.get('/api/game/init', (req, res) => {
  try {
    // In a real implementation, this would initialize game state on the server if needed
    // For this implementation, we'll return initial game data
    const initialGameState = {
      location: 'west_of_house',
      inventory: [],
      moves: 0,
      score: 0,
      gameTime: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: 'Game initialized successfully',
      data: initialGameState
    });
  } catch (error) {
    console.error('Error initializing game:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to initialize game',
      error: error.message 
    });
  }
});

/**
 * Process a game command
 * POST /api/game/command
 * Expects: { command: string, gameState: object }
 */
app.post('/api/game/command', (req, res) => {
  try {
    const { command, gameState } = req.body;
    
    // Validate request body
    if (!command) {
      return res.status(400).json({ 
        success: false, 
        message: 'Command is required' 
      });
    }
    
    if (!gameState) {
      return res.status(400).json({ 
        success: false, 
        message: 'Game state is required' 
      });
    }

    // In a real implementation, this would process the command on the server
    // For this implementation, we'll just echo the command and increment moves
    const updatedGameState = {
      ...gameState,
      moves: (gameState.moves || 0) + 1,
      lastCommand: command,
      lastCommandTime: new Date().toISOString()
    };
    
    // Return response message based on command (simple placeholder)
    const responseMessage = `You entered: ${command}`;
    
    res.json({
      success: true,
      message: responseMessage,
      data: updatedGameState
    });
  } catch (error) {
    console.error('Error processing command:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process command',
      error: error.message 
    });
  }
});

/**
 * Get saved game data
 * GET /api/game/save
 */
app.get('/api/game/save', (req, res) => {
  try {
    // In a real implementation, this might fetch saved games from a database
    // For this implementation, we'll return a message since game state is stored in localStorage
    res.json({
      success: true,
      message: 'Game saves are stored in browser localStorage',
      data: null
    });
  } catch (error) {
    console.error('Error getting saved games:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get saved games',
      error: error.message 
    });
  }
});

/**
 * Save game state
 * POST /api/game/save
 * Expects: { gameState: object, saveName: string }
 */
app.post('/api/game/save', (req, res) => {
  try {
    const { gameState, saveName } = req.body;
    
    // Validate request body
    if (!gameState) {
      return res.status(400).json({ 
        success: false, 
        message: 'Game state is required' 
      });
    }
    
    // In a real implementation, this might save to a database
    // For this implementation, we'll acknowledge the save
    res.json({
      success: true,
      message: `Game saved successfully${saveName ? ` as "${saveName}"` : ''}`,
      data: {
        saveTime: new Date().toISOString(),
        saveName: saveName || 'default'
      }
    });
  } catch (error) {
    console.error('Error saving game:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save game',
      error: error.message 
    });
  }
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});