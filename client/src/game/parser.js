/**
 * parser.js - Command parsing for Zork Web
 * Processes user input and converts it to game commands
 */

// Direction aliases for easy reference
const directionAliases = {
  'n': 'north',
  's': 'south',
  'e': 'east',
  'w': 'west',
  'u': 'up',
  'd': 'down',
  'in': 'in',
  'out': 'out',
  'northeast': 'ne',
  'northwest': 'nw',
  'southeast': 'se',
  'southwest': 'sw',
  'ne': 'northeast',
  'nw': 'northwest',
  'se': 'southeast',
  'sw': 'southwest'
};

// Verb aliases for command normalization
const verbAliases = {
  'get': 'take',
  'grab': 'take',
  'pick': 'take',
  'g': 'again',
  'l': 'look',
  'i': 'inventory',
  'z': 'wait',
  'x': 'examine',
  'read': 'examine',
  'check': 'examine',
  'inspect': 'examine',
  'turn on': 'light',
  'illuminate': 'light',
  'turn off': 'extinguish',
  'douse': 'extinguish',
  'put out': 'extinguish',
  'place': 'put',
  'insert': 'put',
  'deposit': 'put'
};

// Filler words to ignore in commands
const fillerWords = ['the', 'a', 'an', 'at', 'to', 'with', 'using'];

/**
 * Parse user input into a command object
 * @param {string} input - Raw user input
 * @returns {object} Command object with verb and noun properties
 */
const parseCommand = (input) => {
  // Convert to lowercase and trim
  const lowerInput = input.toLowerCase().trim();
  
  // Special case for single-word directions
  if (lowerInput in directionAliases || Object.values(directionAliases).includes(lowerInput)) {
    const direction = directionAliases[lowerInput] || lowerInput;
    return {
      verb: 'move',
      direction: direction
    };
  }
  
  // Split into words
  const words = lowerInput.split(/\s+/);
  
  // Handle empty input
  if (words.length === 0 || words[0] === '') {
    return { verb: 'empty' };
  }
  
  // Get the main verb (first word)
  let verb = words[0];
  
  // Check for verb aliases
  if (verb in verbAliases) {
    verb = verbAliases[verb];
  }
  
  // Handle special case for 'look at' which is the same as 'examine'
  if (verb === 'look' && words.length > 1 && words[1] === 'at') {
    verb = 'examine';
    words.splice(1, 1); // Remove 'at'
  }
  
  // Handle special case for 'put X in Y'
  if (verb === 'put' && words.length > 3) {
    const inIndex = words.findIndex(word => word === 'in' || word === 'into');
    if (inIndex > 1 && inIndex < words.length - 1) {
      const itemWords = words.slice(1, inIndex).filter(word => !fillerWords.includes(word));
      const containerWords = words.slice(inIndex + 1).filter(word => !fillerWords.includes(word));
      
      const itemName = itemWords.join(' ');
      const containerName = containerWords.join(' ');
      
      return {
        verb: 'put',
        itemName,
        containerName
      };
    }
  }
  
  // Special case for single-word commands
  if (words.length === 1) {
    return { verb };
  }
  
  // Get the direct object (noun), filtering out filler words
  const filteredWords = words.slice(1).filter(word => !fillerWords.includes(word));
  let noun = filteredWords.join(' ');
  
  // Handle multi-word directional commands like "go north"
  if (verb === 'go' && filteredWords.length === 1) {
    const direction = filteredWords[0];
    if (direction in directionAliases || Object.values(directionAliases).includes(direction)) {
      return {
        verb: 'move',
        direction: directionAliases[direction] || direction
      };
    }
  }
  
  return { verb, noun };
};

export { parseCommand, directionAliases, verbAliases };