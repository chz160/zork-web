/**
 * commands.js - Command handler implementations for Zork Web
 * Executes game commands and returns results
 */

import { items } from './world';
import {
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
  putItemInContainer,
  GRUE_DANGER_THRESHOLD
} from './state';

/**
 * Execute a command on the current game state
 * @param {object} gameState - Current game state
 * @param {object} command - Parsed command object from parser
 * @returns {object} Result object with new state and message
 */
const executeCommand = (gameState, command) => {
  const { verb, noun, direction } = command;
  
  // Check for game over by Grue
  if (gameState.gameStatus === 'lost') {
    return {
      newState: gameState,
      message: "Oh no! You have been eaten by a grue!\n\nYour adventure has come to an unfortunate end.",
      restart: true
    };
  }
  
  // Handle empty command
  if (verb === 'empty') {
    return {
      newState: gameState,
      message: 'I don\'t understand that command.'
    };
  }
  
  // Handle directional movement
  if (verb === 'move' && direction) {
    return handleMove(gameState, direction);
  }
  
  // Handle other commands based on the verb
  switch (verb) {
    case 'look':
      return handleLook(gameState);
      
    case 'inventory':
      return handleInventory(gameState);
      
    case 'take':
      return handleTake(gameState, noun);
      
    case 'drop':
      return handleDrop(gameState, noun);
      
    case 'examine':
      return handleExamine(gameState, noun);
      
    case 'open':
      return handleOpen(gameState, noun);
      
    case 'close':
      return handleClose(gameState, noun);
      
    case 'light':
      return handleLight(gameState, noun);
      
    case 'extinguish':
      return handleExtinguish(gameState, noun);
      
    case 'put':
      return handlePut(gameState, command.itemName, command.containerName);
      
    case 'score':
      return handleScore(gameState);
      
    case 'help':
      return handleHelp(gameState);
      
    case 'wait':
      return handleWait(gameState);
      
    case 'restart':
      return handleRestart();
      
    default:
      return {
        newState: gameState,
        message: 'I don\'t know how to do that.'
      };
  }
};

/**
 * Handle movement in a direction
 */
const handleMove = (gameState, direction) => {
  const currentRoom = getCurrentRoom(gameState);
  const nextRoomId = currentRoom.connections[direction];
  
  if (nextRoomId) {
    const newState = moveToRoom(gameState, direction);
    const newRoom = getCurrentRoom(newState);
    
    // Check if the player died from moving in darkness
    if (newState.gameStatus === 'lost') {
      return {
        newState,
        message: "Oh no! You have been eaten by a grue in the darkness!\n\nYour adventure has come to an unfortunate end."
      };
    }
    
    // Check if the room is dark and player has no light
    if (newRoom.dark && !hasLightSource(newState)) {
      let message = "You have moved into a dark area.\n\nIt is pitch black. You are likely to be eaten by a grue.";
      // Add warning about darkness turns
      if (newState.turnsInDarkness > 0) {
        message += `\n\nYou hear ominous slithering noises nearby. The grue is getting closer! (${GRUE_DANGER_THRESHOLD - newState.turnsInDarkness} turns remaining)`;
      }
      return {
        newState,
        message
      };
    }
    
    return {
      newState,
      message: newRoom.description
    };
  } else {
    return {
      newState: gameState,
      message: 'You can\'t go that way.'
    };
  }
};

/**
 * Handle look command
 */
const handleLook = (gameState) => {
  const room = getCurrentRoom(gameState);
  const newState = lookRoom(gameState);
  
  // Check if player died from looking in darkness
  if (newState.gameStatus === 'lost') {
    return {
      newState,
      message: "As you try to look around in the pitch darkness, you hear a slithering sound...\n\nOh no! You have been eaten by a grue!"
    };
  }
  
  // Check if the room is dark and player has no light
  if (room.dark && !hasLightSource(newState)) {
    let message = "It is pitch black. You are likely to be eaten by a grue.";
    // Add warning about darkness turns
    if (newState.turnsInDarkness > 0) {
      message += `\n\nYou hear ominous slithering noises nearby. The grue is getting closer! (${GRUE_DANGER_THRESHOLD - newState.turnsInDarkness} turns remaining)`;
    }
    return {
      newState,
      message
    };
  }
  
  const roomItems = getRoomItems(newState);
  let message = room.description;
  
  // Add items to the description
  if (roomItems.length > 0) {
    roomItems.forEach(item => {
      message += '\n' + item.description;
    });
  }
  
  return {
    newState,
    message
  };
};

/**
 * Handle inventory command
 */
const handleInventory = (gameState) => {
  const inventoryItems = getInventoryItems(gameState);
  
  // Process turn in darkness even for inventory check
  const newState = updateItemState(gameState, null, null);
  
  // Check if player died from checking inventory in darkness
  if (newState.gameStatus === 'lost') {
    return {
      newState,
      message: "As you fumble with your possessions in the darkness, you hear a slithering sound...\n\nOh no! You have been eaten by a grue!"
    };
  }
  
  if (inventoryItems.length === 0) {
    return {
      newState,
      message: 'You are empty-handed.'
    };
  }
  
  let message = 'You are carrying:';
  inventoryItems.forEach(item => {
    // Note whether the lantern is lit
    if (item.name === 'brass lantern') {
      message += '\n- ' + item.name + (item.state === 'lit' ? ' (providing light)' : ' (not lit)');
    } else {
      message += '\n- ' + item.name;
    }
  });
  
  return {
    newState,
    message
  };
};

/**
 * Handle take command
 */
const handleTake = (gameState, itemName) => {
  if (!itemName) {
    return {
      newState: gameState,
      message: 'What do you want to take?'
    };
  }
  
  // Check if room is dark and player can't see
  if (!canSeeInRoom(gameState)) {
    const newState = updateItemState(gameState, null, null);
    if (newState.gameStatus === 'lost') {
      return {
        newState,
        message: "As you grope around in the darkness, you hear a slithering sound...\n\nOh no! You have been eaten by a grue!"
      };
    }
    
    return {
      newState,
      message: "It is pitch black. You can't see what to take."
    };
  }
  
  const roomItems = getRoomItems(gameState);
  const itemToTake = roomItems.find(item => item.name.toLowerCase() === itemName.toLowerCase());
  
  if (!itemToTake) {
    return {
      newState: gameState,
      message: 'I don\'t see that here.'
    };
  }
  
  if (!itemToTake.takeable) {
    return {
      newState: gameState,
      message: 'You can\'t take that.'
    };
  }
  
  const newState = addToInventory(gameState, itemToTake.name);
  
  return {
    newState,
    message: `You take the ${itemToTake.name}.`
  };
};

/**
 * Handle drop command
 */
const handleDrop = (gameState, itemName) => {
  if (!itemName) {
    return {
      newState: gameState,
      message: 'What do you want to drop?'
    };
  }
  
  const inventoryItems = getInventoryItems(gameState);
  const itemToDrop = inventoryItems.find(item => item.name.toLowerCase() === itemName.toLowerCase());
  
  if (!itemToDrop) {
    return {
      newState: gameState,
      message: 'You don\'t have that.'
    };
  }
  
  // Warning if dropping the lit lantern in a dark area
  if (itemToDrop.name === 'brass lantern' && 
      itemToDrop.state === 'lit' && 
      getCurrentRoom(gameState).dark) {
    return {
      newState: gameState,
      message: "You probably shouldn't drop your only light source in a dark area. That would be rather dangerous."
    };
  }
  
  const newState = dropItem(gameState, itemToDrop.name);
  
  return {
    newState,
    message: `You drop the ${itemToDrop.name}.`
  };
};

/**
 * Handle examine command
 */
const handleExamine = (gameState, itemName) => {
  if (!itemName) {
    return {
      newState: gameState,
      message: 'What do you want to examine?'
    };
  }
  
  // Check if in a dark room without light
  if (!canSeeInRoom(gameState)) {
    const newState = updateItemState(gameState, null, null);
    if (newState.gameStatus === 'lost') {
      return {
        newState,
        message: "As you grope around in the darkness, you hear a slithering sound...\n\nOh no! You have been eaten by a grue!"
      };
    }
    
    return {
      newState,
      message: "It is pitch black. You can't see anything to examine."
    };
  }
  
  // Check inventory first
  const inventoryItems = getInventoryItems(gameState);
  let itemToExamine = inventoryItems.find(item => item.name.toLowerCase() === itemName.toLowerCase());
  
  // If not in inventory, check room
  if (!itemToExamine) {
    const roomItems = getRoomItems(gameState);
    itemToExamine = roomItems.find(item => item.name.toLowerCase() === itemName.toLowerCase());
  }
  
  if (!itemToExamine) {
    return {
      newState: gameState,
      message: 'I don\'t see that here.'
    };
  }
  
  // Special case for examining the lantern
  if (itemToExamine.name === 'brass lantern') {
    const lanternState = itemToExamine.state === 'lit' ? 'lit and providing light' : 'not lit';
    return {
      newState: examineItem(gameState, itemToExamine.name),
      message: `${itemToExamine.examine}\n\nThe lantern is currently ${lanternState}.`
    };
  }
  
  return {
    newState: examineItem(gameState, itemToExamine.name),
    message: itemToExamine.examine || `You see nothing special about the ${itemToExamine.name}.`
  };
};

/**
 * Handle open command
 */
const handleOpen = (gameState, itemName) => {
  if (!itemName) {
    return {
      newState: gameState,
      message: 'What do you want to open?'
    };
  }
  
  // Check if in a dark room without light
  if (!canSeeInRoom(gameState)) {
    const newState = updateItemState(gameState, null, null);
    if (newState.gameStatus === 'lost') {
      return {
        newState,
        message: "As you fumble around in the darkness, you hear a slithering sound...\n\nOh no! You have been eaten by a grue!"
      };
    }
    
    return {
      newState,
      message: "It is pitch black. You can't see what you're trying to open."
    };
  }
  
  // Check room items
  const roomItems = getRoomItems(gameState);
  const itemToOpen = roomItems.find(item => item.name.toLowerCase() === itemName.toLowerCase());
  
  if (!itemToOpen) {
    return {
      newState: gameState,
      message: 'I don\'t see that here.'
    };
  }
  
  if (!itemToOpen.actions || !itemToOpen.actions.open) {
    return {
      newState: gameState,
      message: `You can't open the ${itemToOpen.name}.`
    };
  }
  
  const message = itemToOpen.actions.open(gameState);
  const newState = updateItemState(gameState, null, null);
  
  return {
    newState,
    message
  };
};

/**
 * Handle close command
 */
const handleClose = (gameState, itemName) => {
  if (!itemName) {
    return {
      newState: gameState,
      message: 'What do you want to close?'
    };
  }
  
  // Check if in a dark room without light
  if (!canSeeInRoom(gameState)) {
    const newState = updateItemState(gameState, null, null);
    if (newState.gameStatus === 'lost') {
      return {
        newState,
        message: "As you fumble around in the darkness, you hear a slithering sound...\n\nOh no! You have been eaten by a grue!"
      };
    }
    
    return {
      newState,
      message: "It is pitch black. You can't see what you're trying to close."
    };
  }
  
  // Check room items
  const roomItems = getRoomItems(gameState);
  const itemToClose = roomItems.find(item => item.name.toLowerCase() === itemName.toLowerCase());
  
  if (!itemToClose) {
    return {
      newState: gameState,
      message: 'I don\'t see that here.'
    };
  }
  
  if (!itemToClose.actions || !itemToClose.actions.close) {
    return {
      newState: gameState,
      message: `You can't close the ${itemToClose.name}.`
    };
  }
  
  const message = itemToClose.actions.close(gameState);
  const newState = updateItemState(gameState, null, null);
  
  return {
    newState,
    message
  };
};

/**
 * Handle light command
 */
const handleLight = (gameState, itemName) => {
  if (!itemName) {
    return {
      newState: gameState,
      message: 'What do you want to light?'
    };
  }
  
  // Only lantern can be lit, make sure it's in inventory
  if (itemName.toLowerCase() !== 'lantern' && 
      itemName.toLowerCase() !== 'brass lantern') {
    return {
      newState: gameState,
      message: "You can't light that."
    };
  }
  
  if (!gameState.inventory.includes('brass-lantern')) {
    return {
      newState: gameState,
      message: "You don't have the brass lantern."
    };
  }
  
  // Call the lantern's light action
  const message = items['brass-lantern'].actions.light(gameState);
  const newState = updateItemState(gameState, 'brass-lantern', 'lit');
  
  // Check if player is in a dark room and now can see
  if (getCurrentRoom(newState).dark) {
    return {
      newState,
      message: `${message}\n\nYou can now see in the darkness.`
    };
  }
  
  return {
    newState,
    message
  };
};

/**
 * Handle extinguish command
 */
const handleExtinguish = (gameState, itemName) => {
  if (!itemName) {
    return {
      newState: gameState,
      message: 'What do you want to extinguish?'
    };
  }
  
  // Only lantern can be extinguished, make sure it's in inventory
  if (itemName.toLowerCase() !== 'lantern' && 
      itemName.toLowerCase() !== 'brass lantern') {
    return {
      newState: gameState,
      message: "You can't extinguish that."
    };
  }
  
  if (!gameState.inventory.includes('brass-lantern')) {
    return {
      newState: gameState,
      message: "You don't have the brass lantern."
    };
  }
  
  // Check if they're in a dark room - warn them
  if (getCurrentRoom(gameState).dark) {
    return {
      newState: gameState,
      message: "Extinguishing your only light source in a dark area would leave you vulnerable to grues. That's probably not a good idea."
    };
  }
  
  // Call the lantern's extinguish action
  const message = items['brass-lantern'].actions.extinguish(gameState);
  const newState = updateItemState(gameState, 'brass-lantern', 'unlit');
  
  return {
    newState,
    message
  };
};

/**
 * Handle help command
 */
const handleHelp = (gameState) => {
  const helpMessage = `
=== AVAILABLE COMMANDS ===

MOVEMENT:
  north, south, east, west (or n, s, e, w) - Move in that direction
  up, down (or u, d) - Move up or down when possible
  in, out - Enter or exit buildings and other structures
  go [direction] - Same as typing the direction

LOOKING:
  look (or l) - Look around the current location
  examine [item] (or x [item]) - Look at an item in detail
  inventory (or i) - Check what you're carrying

MANIPULATION:
  take [item] (or get [item]) - Pick up an item
  drop [item] - Drop an item you're carrying
  open [item] - Open something (like a mailbox)
  close [item] - Close something that's open
  put [item] in [container] - Place an item into a container
  
LIGHT:
  light lantern - Light your brass lantern
  extinguish lantern - Extinguish your brass lantern

GAME CONTROL:
  score - Display your current score and treasures found
  wait (or z) - Do nothing for a turn
  restart - Start a new game
  toggle-mode - Switch between local and server processing
  help - Display this message

TIP: Most commands understand common synonyms and phrases.
     For example, "get leaflet", "take the leaflet" and "pick up leaflet" all work.
     
TREASURES:
     Find treasures throughout the game and place them in the trophy case
     in the living room to increase your score!
  `;
  
  return {
    newState: updateItemState(gameState, null, null),
    message: helpMessage
  };
};

/**
 * Handle wait command
 */
const handleWait = (gameState) => {
  const newState = updateItemState(gameState, null, null);
  
  // Check if player was eaten by a grue while waiting
  if (newState.gameStatus === 'lost') {
    return {
      newState,
      message: "As you wait in the darkness, you hear a slithering sound...\n\nOh no! You have been eaten by a grue!"
    };
  }
  
  let message = 'Time passes...';
  
  // Add warning if in dark room
  if (!canSeeInRoom(newState) && newState.turnsInDarkness > 0) {
    message += `\n\nYou hear ominous slithering noises nearby. The grue is getting closer! (${GRUE_DANGER_THRESHOLD - newState.turnsInDarkness} turns remaining)`;
  }
  
  return {
    newState,
    message
  };
};

/**
 * Handle put command - puts an item into a container
 */
const handlePut = (gameState, itemName, containerName) => {
  if (!itemName || !containerName) {
    return {
      newState: gameState,
      message: 'Please specify what to put and where to put it. For example: "put egg in case".'
    };
  }
  
  // Check if in a dark room without light
  if (!canSeeInRoom(gameState)) {
    const newState = updateItemState(gameState, null, null);
    if (newState.gameStatus === 'lost') {
      return {
        newState,
        message: "As you fumble around in the darkness, you hear a slithering sound...\n\nOh no! You have been eaten by a grue!"
      };
    }
    
    return {
      newState,
      message: "It is pitch black. You can't see what you're trying to manipulate."
    };
  }
  
  // Check if player has the item
  const inventoryItems = getInventoryItems(gameState);
  const itemToPut = inventoryItems.find(item => item.name.toLowerCase() === itemName.toLowerCase());
  
  if (!itemToPut) {
    return {
      newState: gameState,
      message: `You don't have ${itemName}.`
    };
  }
  
  // Check if container exists in room
  const roomItems = getRoomItems(gameState);
  const containerItem = roomItems.find(item => item.name.toLowerCase() === containerName.toLowerCase());
  
  if (!containerItem) {
    return {
      newState: gameState,
      message: `You don't see ${containerName} here.`
    };
  }
  
  // Check if it's a container
  if (!containerItem.contains) {
    return {
      newState: gameState,
      message: `You can't put anything in ${containerName}.`
    };
  }
  
  // Check if container is open
  if (containerItem.state !== 'open') {
    return {
      newState: gameState,
      message: `The ${containerName} is closed.`
    };
  }
  
  // Put the item in the container
  const newState = putItemInContainer(gameState, itemToPut.name.replace(' ', '-'), containerItem.name.replace(' ', '-'));
  
  // Special message if this was a treasure going into the trophy case
  if (containerItem.name === 'trophy case' && itemToPut.treasure) {
    return {
      newState,
      message: `You place the ${itemToPut.name} in the trophy case, and it begins to glow with a golden light! Your score has increased by ${itemToPut.value} points.`
    };
  }
  
  return {
    newState,
    message: `You put the ${itemToPut.name} in the ${containerItem.name}.`
  };
};

/**
 * Handle score command
 */
const handleScore = (gameState) => {
  const maxScore = calculateMaxScore();
  let message = `Your score is ${gameState.score} out of a possible ${maxScore} points.`;
  
  // Add information about treasures found
  if (gameState.scoredTreasures.length > 0) {
    message += `\n\nYou have placed ${gameState.scoredTreasures.length} treasure${gameState.scoredTreasures.length > 1 ? 's' : ''} in the trophy case:`;
    
    gameState.scoredTreasures.forEach(treasureId => {
      const treasure = items[treasureId];
      message += `\n- ${treasure.name} (${treasure.value} points)`;
    });
  } else {
    message += '\n\nYou haven\'t found any treasures yet.';
  }
  
  return {
    newState: gameState,
    message
  };
};

/**
 * Handle restart command
 */
const handleRestart = () => {
  return {
    restart: true,
    message: 'Restarting the game...'
  };
};

export { executeCommand };