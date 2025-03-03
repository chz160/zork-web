// Simple test script for the game API
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Test game initialization
async function testGameInit() {
  try {
    console.log('Testing game initialization...');
    const response = await axios.get(`${BASE_URL}/api/game/init`);
    console.log('Game init response:', response.data);
    return response.data.data; // Return the game state for further tests
  } catch (error) {
    console.error('Game init test failed:', error.message);
    if (error.response) {
      console.error('Error details:', error.response.data);
    }
  }
}

// Test command processing
async function testGameCommand(gameState) {
  try {
    console.log('\nTesting game command processing...');
    const response = await axios.post(`${BASE_URL}/api/game/command`, {
      command: 'look',
      gameState
    });
    console.log('Command response:', response.data);
    return response.data.data; // Return the updated game state
  } catch (error) {
    console.error('Command test failed:', error.message);
    if (error.response) {
      console.error('Error details:', error.response.data);
    }
  }
}

// Test game save
async function testGameSave(gameState) {
  try {
    console.log('\nTesting game save...');
    const response = await axios.post(`${BASE_URL}/api/game/save`, {
      gameState,
      saveName: 'Test Save'
    });
    console.log('Save response:', response.data);
  } catch (error) {
    console.error('Save test failed:', error.message);
    if (error.response) {
      console.error('Error details:', error.response.data);
    }
  }
}

// Test get saved games
async function testGetSaves() {
  try {
    console.log('\nTesting get saved games...');
    const response = await axios.get(`${BASE_URL}/api/game/save`);
    console.log('Get saves response:', response.data);
  } catch (error) {
    console.error('Get saves test failed:', error.message);
    if (error.response) {
      console.error('Error details:', error.response.data);
    }
  }
}

// Run all tests in sequence
async function runTests() {
  console.log('Starting API tests...');
  
  // Initialize game and get initial state
  const gameState = await testGameInit();
  
  if (gameState) {
    // Use the game state for further tests
    const updatedState = await testGameCommand(gameState);
    
    if (updatedState) {
      await testGameSave(updatedState);
    }
  }
  
  // Test getting saved games
  await testGetSaves();
  
  console.log('\nAPI tests completed.');
}

// Make sure the server is running before executing tests
console.log('Make sure the server is running (npm run dev) before running this test');
runTests();