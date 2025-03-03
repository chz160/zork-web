/**
 * world.js - Game world definition for Zork Web
 * Contains the map of locations, items, and their connections
 */

// Define rooms with descriptions and connections
const rooms = {
  'west-of-house': {
    name: 'West of House',
    description: 'You are standing in an open field west of a white house, with a boarded front door.',
    connections: {
      north: 'north-of-house',
      south: 'south-of-house',
      west: 'forest-1',
    },
    items: ['mailbox']
  },
  
  'north-of-house': {
    name: 'North of House',
    description: 'You are facing the north side of a white house. There is no door here, and all the windows are boarded up.',
    connections: {
      north: 'forest-2',
      east: 'east-of-house',
      west: 'west-of-house'
    },
    items: []
  },

  'south-of-house': {
    name: 'South of House',
    description: 'You are facing the south side of a white house. There is no door here, and all the windows are boarded.',
    connections: {
      east: 'east-of-house',
      west: 'west-of-house'
    },
    items: []
  },

  'east-of-house': {
    name: 'East of House',
    description: 'You are standing in an open field east of a white house. There is a small window here, and a door to the kitchen.',
    connections: {
      north: 'north-of-house',
      south: 'south-of-house',
      east: 'forest-3',
      in: 'kitchen'
    },
    items: []
  },

  'kitchen': {
    name: 'Kitchen',
    description: 'You are in the kitchen of the white house. A table seems to have been used recently for the preparation of food. A passage leads to the west, and a dark staircase can be seen leading downward.',
    connections: {
      west: 'living-room',
      down: 'cellar',
      out: 'east-of-house'
    },
    items: []
  },

  'living-room': {
    name: 'Living Room',
    description: 'You are in the living room of the white house. There is a fireplace here, and a passage leads to the east. A trophy case stands against one wall.',
    connections: {
      east: 'kitchen'
    },
    items: ['trophy-case', 'brass-lantern']
  },

  'cellar': {
    name: 'Cellar',
    description: 'You are in a dark and damp cellar with a narrow passageway leading north, and a crawlway to the south. On the west is the bottom of a steep metal ramp which is unclimbable.',
    connections: {
      north: 'troll-room',
      south: 'maze-entrance',
      up: 'kitchen'
    },
    dark: true,
    items: []
  },

  'troll-room': {
    name: 'Troll Room',
    description: 'This is a small room with passages to the east and south, and a forbidding hole leading west. Bloodstains and deep scratches (perhaps made by an axe) mar the walls.',
    connections: {
      south: 'cellar'
    },
    dark: true,
    items: ['jewel-encrusted-egg']
  },

  'maze-entrance': {
    name: 'Maze Entrance',
    description: 'You are at the entrance to a maze of twisty little passages, all alike.',
    connections: {
      north: 'cellar'
    },
    dark: true,
    items: ['platinum-bar']
  },

  'forest-1': {
    name: 'Forest',
    description: 'This is a dense forest, trees of all varieties grow here.',
    connections: {
      east: 'west-of-house',
      south: 'forest-3'
    },
    items: []
  },

  'forest-2': {
    name: 'Forest',
    description: 'This is a dense forest, trees of all varieties grow here.',
    connections: {
      south: 'north-of-house',
      east: 'clearing'
    },
    items: []
  },

  'forest-3': {
    name: 'Forest',
    description: 'This is a dense forest, trees of all varieties grow here.',
    connections: {
      north: 'forest-1',
      west: 'east-of-house'
    },
    items: []
  },

  'clearing': {
    name: 'Clearing',
    description: 'You are in a small clearing in the forest. A path leads south.',
    connections: {
      south: 'canyon-view',
      west: 'forest-2'
    },
    items: ['leaves', 'golden-chalice']
  },

  'canyon-view': {
    name: 'Canyon View',
    description: 'You are at the edge of a deep canyon. A path leads north through the forest.',
    connections: {
      north: 'clearing'
    },
    items: ['crystal-trident']
  }
};

// Define items with descriptions and properties
const items = {
  'house': {
    name: 'house',
    description: 'There is a white house here.',
    takeable: false,
    examine: 'The house is a beautiful colonial house which is painted white. It is clear that the owners must have been quite wealthy.',
    isGlobal: true  // Special flag to indicate this item is visible from multiple locations
  },
  'mailbox': {
    name: 'mailbox',
    description: 'There is a small mailbox here.',
    takeable: false,
    state: 'closed',
    contains: ['leaflet'],
    examine: 'It\'s a small mailbox, typical of the type used for rural mail delivery.',
    actions: {
      open: (gameState) => {
        if (items.mailbox.state === 'closed') {
          items.mailbox.state = 'open';
          return 'You open the mailbox, revealing a leaflet.';
        } else {
          return 'The mailbox is already open.';
        }
      },
      close: (gameState) => {
        if (items.mailbox.state === 'open') {
          items.mailbox.state = 'closed';
          return 'You close the mailbox.';
        } else {
          return 'The mailbox is already closed.';
        }
      }
    }
  },
  
  'leaflet': {
    name: 'leaflet',
    description: 'There is a leaflet here.',
    takeable: true,
    examine: 'Welcome to Zork Web!\nZork Web is a reimagining of the classic text adventure game.\n\nYou are standing in an open field west of a white house, with a boarded front door.\nThere is a small mailbox here.'
  },
  
  'leaves': {
    name: 'leaves',
    description: 'There is a pile of leaves here.',
    takeable: true,
    examine: 'The leaves are piled several feet deep in this spot. They are likely covering something.'
  },
  
  'trophy-case': {
    name: 'trophy case',
    description: 'There is a trophy case here.',
    takeable: false,
    state: 'closed',
    contains: [],
    examine: 'The trophy case is designed to hold treasures and valuables. It has a glass front and a wooden frame.',
    actions: {
      open: (gameState) => {
        if (items['trophy-case'].state === 'closed') {
          items['trophy-case'].state = 'open';
          if (items['trophy-case'].contains.length === 0) {
            return 'You open the trophy case. It\\\'s currently empty.';
          } else {
            return 'You open the trophy case, revealing its contents.';
          }
        } else {
          return 'The trophy case is already open.';
        }
      },
      close: (gameState) => {
        if (items['trophy-case'].state === 'open') {
          items['trophy-case'].state = 'closed';
          return 'You close the trophy case.';
        } else {
          return 'The trophy case is already closed.';
        }
      }
    }
  },
  
  'brass-lantern': {
    name: 'brass lantern',
    description: 'There is a brass lantern here.',
    takeable: true,
    state: 'unlit',
    examine: 'The brass lantern is designed for use in the darkest of caves. It appears to be functional.',
    actions: {
      light: (gameState) => {
        if (items['brass-lantern'].state === 'unlit') {
          items['brass-lantern'].state = 'lit';
          return 'You light the brass lantern, illuminating the area around you.';
        } else {
          return 'The lantern is already lit.';
        }
      },
      extinguish: (gameState) => {
        if (items['brass-lantern'].state === 'lit') {
          items['brass-lantern'].state = 'unlit';
          const currentRoom = gameState.currentRoom;
          if (rooms[currentRoom].dark) {
            return 'You extinguish the brass lantern. It is now pitch black.';
          } else {
            return 'You extinguish the brass lantern.';
          }
        } else {
          return 'The lantern is not lit.';
        }
      }
    }
  },
  
  'jewel-encrusted-egg': {
    name: 'jewel-encrusted egg',
    description: 'There is a jewel-encrusted egg here, sparkling in the light.',
    takeable: true,
    treasure: true,
    value: 5,
    examine: 'This is a beautiful egg encrusted with precious gems. The intricate design suggests it was made for royalty. It must be quite valuable.'
  },
  
  'platinum-bar': {
    name: 'platinum bar',
    description: 'There is a platinum bar here, gleaming dully.',
    takeable: true,
    treasure: true,
    value: 10,
    examine: 'The platinum bar is heavy and extremely valuable. It has strange markings on it that appear to be from an ancient civilization.'
  },
  
  'golden-chalice': {
    name: 'golden chalice',
    description: 'There is a golden chalice here, ornately decorated.',
    takeable: true,
    treasure: true,
    value: 7,
    examine: 'This ornate golden chalice appears to be centuries old. The craftsmanship is exquisite, with intricate designs depicting ancient ceremonies.'
  },
  
  'crystal-trident': {
    name: 'crystal trident',
    description: 'There is a crystal trident here, shimmering with an otherworldly glow.',
    takeable: true,
    treasure: true,
    value: 8,
    examine: 'The crystal trident is surprisingly light for its size. It seems to glow with an inner light, and the points are remarkably sharp.'
  }
};

// Export the world data
export { rooms, items };