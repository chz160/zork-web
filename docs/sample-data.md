# Sample Game Data Implementation

> Example JSON data files demonstrating how to implement Zork entities using the documented schemas

## Sample Rooms: House Area

This example shows the starting area of Zork - the white house and immediate surroundings.

### File: `src/app/data/rooms/house-area.json`

```json
{
  "rooms": [
    {
      "id": "west-of-house",
      "name": "West of House",
      "description": "You are standing in an open field west of a white house, with a boarded front door.",
      "shortDescription": "West of House",
      "exits": {
        "north": "north-of-house",
        "south": "south-of-house",
        "east": "behind-house"
      },
      "objectIds": ["small-mailbox"],
      "visited": false
    },
    {
      "id": "north-of-house",
      "name": "North of House",
      "description": "You are facing the north side of a white house. There is no door here, and all the windows are boarded up. To the north a narrow path winds through the trees.",
      "shortDescription": "North of House",
      "exits": {
        "south": "west-of-house",
        "east": "behind-house",
        "west": "west-of-house",
        "north": "forest-path"
      },
      "objectIds": [],
      "visited": false
    },
    {
      "id": "behind-house",
      "name": "Behind House",
      "description": "You are behind the white house. A path runs around the house to the north and south. To the east is a small window which is slightly ajar.",
      "shortDescription": "Behind House",
      "exits": {
        "north": "north-of-house",
        "south": "south-of-house",
        "west": "west-of-house",
        "east": "kitchen"
      },
      "objectIds": ["kitchen-window"],
      "visited": false
    },
    {
      "id": "south-of-house",
      "name": "South of House",
      "description": "You are facing the south side of a white house. There is no door here, and all the windows are boarded.",
      "shortDescription": "South of House",
      "exits": {
        "north": "west-of-house",
        "east": "behind-house",
        "west": "west-of-house"
      },
      "objectIds": [],
      "visited": false
    },
    {
      "id": "kitchen",
      "name": "Kitchen",
      "description": "You are in the kitchen of the white house. A table seems to have been used recently for the preparation of food. A passage leads to the west and a dark staircase can be seen leading upward. A dark chimney leads down and to the east is a small window which is open.",
      "shortDescription": "Kitchen",
      "exits": {
        "west": "living-room",
        "up": "attic",
        "down": "cellar",
        "east": "behind-house"
      },
      "objectIds": ["kitchen-table", "brown-sack", "glass-bottle"],
      "visited": false
    },
    {
      "id": "living-room",
      "name": "Living Room",
      "description": "You are in the living room. There is a doorway to the east, a wooden door with strange gothic lettering to the west, which appears to be nailed shut, a trophy case, and a large oriental rug in the center of the room.",
      "shortDescription": "Living Room",
      "exits": {
        "east": "kitchen",
        "down": "cellar"
      },
      "objectIds": ["trophy-case", "brass-lamp", "elvish-sword", "oriental-rug"],
      "visited": false,
      "properties": {
        "rugMoved": false
      }
    },
    {
      "id": "attic",
      "name": "Attic",
      "description": "This is the attic. The only exit is stairs that lead down. There is a square brick here which feels like clay. A large coil of rope is lying in the corner. On a table is a nasty-looking knife.",
      "shortDescription": "Attic",
      "exits": {
        "down": "kitchen"
      },
      "objectIds": ["brick", "rope", "knife", "attic-table"],
      "visited": false
    },
    {
      "id": "cellar",
      "name": "Cellar",
      "description": "You are in a dark and damp cellar with a narrow passageway leading north, and a crawlway to the south. To the west is the bottom of a steep metal ramp which is unclimbable.",
      "shortDescription": "Cellar",
      "exits": {
        "up": "living-room",
        "north": "north-of-cellar",
        "south": "south-of-cellar"
      },
      "objectIds": [],
      "visited": false,
      "isDark": true
    }
  ]
}
```

## Sample Objects: Starting Items

### File: `src/app/data/objects/starting-items.json`

```json
{
  "objects": [
    {
      "id": "small-mailbox",
      "name": "small mailbox",
      "aliases": ["mailbox", "box", "small box"],
      "description": "A small mailbox is here.",
      "portable": false,
      "visible": true,
      "location": "west-of-house",
      "properties": {
        "isOpen": false,
        "contains": ["leaflet"],
        "acceptsPrepositions": ["in"]
      }
    },
    {
      "id": "leaflet",
      "name": "leaflet",
      "aliases": ["pamphlet", "paper"],
      "description": "\"WELCOME TO ZORK!\n\nZORK is a game of adventure, danger, and low cunning. In it you will explore some of the most amazing territory ever seen by mortals. No computer should be without one!\"",
      "portable": true,
      "visible": false,
      "location": "small-mailbox",
      "properties": {
        "readable": true,
        "readText": "\"WELCOME TO ZORK!\n\nZORK is a game of adventure, danger, and low cunning. In it you will explore some of the most amazing territory ever seen by mortals. No computer should be without one!\""
      }
    },
    {
      "id": "brass-lamp",
      "name": "brass lamp",
      "aliases": ["lamp", "lantern", "brass lantern", "light"],
      "description": "A battery-powered brass lantern is on the trophy case.",
      "portable": true,
      "visible": true,
      "location": "living-room",
      "properties": {
        "isLight": true,
        "isLit": false,
        "batteryLife": 330,
        "consumable": true
      }
    },
    {
      "id": "elvish-sword",
      "name": "elvish sword",
      "aliases": ["sword", "blade", "elvish blade", "elf sword"],
      "description": "Above the fireplace hangs an elvish sword of great antiquity.",
      "portable": true,
      "visible": true,
      "location": "living-room",
      "properties": {
        "weapon": true,
        "damage": 2,
        "glowsNearEnemies": true
      }
    },
    {
      "id": "trophy-case",
      "name": "trophy case",
      "aliases": ["case", "trophy", "display case"],
      "description": "The trophy case is made of solid oak and is quite heavy. It appears to be securely fastened to the wall.",
      "portable": false,
      "visible": true,
      "location": "living-room",
      "properties": {
        "isOpen": false,
        "contains": [],
        "acceptsPrepositions": ["in"],
        "isTreasureRepository": true
      }
    },
    {
      "id": "oriental-rug",
      "name": "oriental rug",
      "aliases": ["rug", "carpet", "oriental carpet"],
      "description": "A large oriental rug is here. Probably from ancient Persia.",
      "portable": false,
      "visible": true,
      "location": "living-room",
      "properties": {
        "moveable": true,
        "coversTrapdoor": true
      }
    },
    {
      "id": "brown-sack",
      "name": "brown sack",
      "aliases": ["sack", "bag", "brown bag"],
      "description": "An elongated brown sack is on the table. It smells of hot peppers.",
      "portable": true,
      "visible": true,
      "location": "kitchen",
      "properties": {
        "isOpen": false,
        "contains": ["lunch", "garlic"],
        "acceptsPrepositions": ["in"]
      }
    },
    {
      "id": "lunch",
      "name": "lunch",
      "aliases": ["food", "meal"],
      "description": "A lunch prepared by the kitchen staff. It looks appetizing.",
      "portable": true,
      "visible": false,
      "location": "brown-sack",
      "properties": {
        "edible": true
      }
    },
    {
      "id": "garlic",
      "name": "clove of garlic",
      "aliases": ["garlic", "clove"],
      "description": "A clove of garlic.",
      "portable": true,
      "visible": false,
      "location": "brown-sack",
      "properties": {
        "repelsVampire": true
      }
    },
    {
      "id": "glass-bottle",
      "name": "glass bottle",
      "aliases": ["bottle", "glass"],
      "description": "A glass bottle is sitting on the table.",
      "portable": true,
      "visible": true,
      "location": "kitchen",
      "properties": {
        "isOpen": true,
        "contains": ["water"],
        "acceptsPrepositions": ["in"]
      }
    },
    {
      "id": "water",
      "name": "quantity of water",
      "aliases": ["water", "liquid"],
      "description": "Some water is in the bottle.",
      "portable": false,
      "visible": false,
      "location": "glass-bottle",
      "properties": {
        "drinkable": true,
        "consumable": true
      }
    },
    {
      "id": "rope",
      "name": "rope",
      "aliases": ["coil", "coil of rope"],
      "description": "A large coil of rope is lying in the corner.",
      "portable": true,
      "visible": true,
      "location": "attic",
      "properties": {
        "tieable": true,
        "climbable": true
      }
    },
    {
      "id": "brick",
      "name": "brick",
      "aliases": ["clay brick", "square brick"],
      "description": "A square brick which feels like clay.",
      "portable": true,
      "visible": true,
      "location": "attic"
    },
    {
      "id": "knife",
      "name": "knife",
      "aliases": ["nasty knife", "nasty-looking knife"],
      "description": "On a table is a nasty-looking knife.",
      "portable": true,
      "visible": true,
      "location": "attic",
      "properties": {
        "weapon": true,
        "damage": 1
      }
    },
    {
      "id": "kitchen-window",
      "name": "window",
      "aliases": ["kitchen window", "small window"],
      "description": "The window is slightly ajar.",
      "portable": false,
      "visible": true,
      "location": "behind-house",
      "properties": {
        "isOpen": true,
        "allowsPassage": true
      }
    },
    {
      "id": "kitchen-table",
      "name": "table",
      "aliases": ["kitchen table"],
      "description": "A table that seems to have been used recently for food preparation.",
      "portable": false,
      "visible": true,
      "location": "kitchen",
      "properties": {
        "surface": true
      }
    },
    {
      "id": "attic-table",
      "name": "table",
      "aliases": ["attic table"],
      "description": "A small table in the attic.",
      "portable": false,
      "visible": true,
      "location": "attic",
      "properties": {
        "surface": true
      }
    }
  ]
}
```

## Sample Verbs

### File: `src/app/data/verbs/verbs.json`

```json
{
  "verbs": [
    {
      "name": "go",
      "aliases": ["walk", "move", "run", "proceed"],
      "requiresObject": true,
      "allowsIndirectObject": false,
      "description": "Move in a direction (e.g., 'go north' or just 'north')"
    },
    {
      "name": "look",
      "aliases": ["l"],
      "requiresObject": false,
      "allowsIndirectObject": false,
      "description": "Look around the current location"
    },
    {
      "name": "examine",
      "aliases": ["x", "inspect", "describe", "check"],
      "requiresObject": true,
      "allowsIndirectObject": false,
      "description": "Examine an object or location closely"
    },
    {
      "name": "take",
      "aliases": ["get", "pick up", "grab", "carry"],
      "requiresObject": true,
      "allowsIndirectObject": false,
      "description": "Pick up an object and add it to your inventory"
    },
    {
      "name": "drop",
      "aliases": ["put down", "discard", "leave"],
      "requiresObject": true,
      "allowsIndirectObject": false,
      "description": "Drop an object from your inventory"
    },
    {
      "name": "inventory",
      "aliases": ["i", "inv"],
      "requiresObject": false,
      "allowsIndirectObject": false,
      "description": "List the items you are carrying"
    },
    {
      "name": "open",
      "aliases": ["unlock"],
      "requiresObject": true,
      "allowsIndirectObject": false,
      "description": "Open a door, container, or other openable object"
    },
    {
      "name": "close",
      "aliases": ["shut"],
      "requiresObject": true,
      "allowsIndirectObject": false,
      "description": "Close a door, container, or other closable object"
    },
    {
      "name": "read",
      "aliases": [],
      "requiresObject": true,
      "allowsIndirectObject": false,
      "description": "Read text on an object"
    },
    {
      "name": "light",
      "aliases": ["turn on", "ignite"],
      "requiresObject": true,
      "allowsIndirectObject": false,
      "description": "Light a light source"
    },
    {
      "name": "extinguish",
      "aliases": ["turn off", "put out", "douse"],
      "requiresObject": true,
      "allowsIndirectObject": false,
      "description": "Put out a light source"
    },
    {
      "name": "put",
      "aliases": ["place", "insert"],
      "requiresObject": true,
      "allowsIndirectObject": true,
      "description": "Put an object in or on a container (e.g., 'put lamp in case')"
    },
    {
      "name": "unlock",
      "aliases": [],
      "requiresObject": true,
      "allowsIndirectObject": true,
      "description": "Unlock an object with a key (e.g., 'unlock door with key')"
    },
    {
      "name": "lock",
      "aliases": [],
      "requiresObject": true,
      "allowsIndirectObject": true,
      "description": "Lock an object with a key"
    },
    {
      "name": "attack",
      "aliases": ["kill", "fight", "hit", "strike"],
      "requiresObject": true,
      "allowsIndirectObject": true,
      "description": "Attack an enemy (optionally with a weapon: 'attack troll with sword')"
    },
    {
      "name": "help",
      "aliases": ["?", "commands"],
      "requiresObject": false,
      "allowsIndirectObject": false,
      "description": "Display available commands and help information"
    },
    {
      "name": "save",
      "aliases": [],
      "requiresObject": false,
      "allowsIndirectObject": false,
      "description": "Save the current game state"
    },
    {
      "name": "load",
      "aliases": ["restore"],
      "requiresObject": false,
      "allowsIndirectObject": false,
      "description": "Load a previously saved game"
    },
    {
      "name": "quit",
      "aliases": ["q", "exit"],
      "requiresObject": false,
      "allowsIndirectObject": false,
      "description": "Exit the game"
    }
  ]
}
```

## Loading Data in TypeScript

### GameDataLoader Service Pattern

```typescript
import { Injectable } from '@angular/core';
import { Room } from '../models/room.model';
import { GameObject } from '../models/game-object.model';
import { Verb } from '../models/verb.model';

// Import JSON data
import houseAreaData from '../../data/rooms/house-area.json';
import startingItemsData from '../../data/objects/starting-items.json';
import verbsData from '../../data/verbs/verbs.json';

@Injectable({
  providedIn: 'root'
})
export class GameDataLoaderService {
  
  loadRooms(): Room[] {
    return houseAreaData.rooms.map(room => ({
      ...room,
      // Convert exits object to Map
      exits: new Map(Object.entries(room.exits))
    }));
  }
  
  loadObjects(): GameObject[] {
    return startingItemsData.objects;
  }
  
  loadVerbs(): Verb[] {
    return verbsData.verbs;
  }
  
  loadInitialWorld() {
    return {
      rooms: this.loadRooms(),
      objects: this.loadObjects(),
      verbs: this.loadVerbs()
    };
  }
}
```

## Usage in GameEngine

```typescript
export class GameEngineService {
  private dataLoader = inject(GameDataLoaderService);
  
  initializeGame(): void {
    const world = this.dataLoader.loadInitialWorld();
    
    // Add rooms to game
    world.rooms.forEach(room => this.addRoom(room));
    
    // Add objects to game
    world.objects.forEach(obj => this.addObject(obj));
    
    // Set player starting location
    this.moveToRoom('west-of-house');
    
    // Initial output
    this.addOutput('ZORK: The Great Underground Empire');
    this.addOutput('Copyright (c) 1981, 1982, 1983 Infocom, Inc. All rights reserved.');
    this.addOutput('ZORK is a registered trademark of Infocom, Inc.');
    this.addOutput('');
    this.executeCommand(this.parser.parse('look'));
  }
}
```

## Validation

You can validate these JSON files against the schemas:

```bash
# Install AJV CLI for validation
npm install -g ajv-cli

# Validate rooms
ajv validate \
  -s docs/schemas/room.schema.json \
  -d src/app/data/rooms/house-area.json

# Validate objects
ajv validate \
  -s docs/schemas/game-object.schema.json \
  -d src/app/data/objects/starting-items.json

# Validate verbs
ajv validate \
  -s docs/schemas/verb.schema.json \
  -d src/app/data/verbs/verbs.json
```

## Next Steps

1. Create `src/app/data/` directory structure
2. Implement `GameDataLoaderService`
3. Add JSON import support to `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "resolveJsonModule": true,
       "esModuleInterop": true
     }
   }
   ```
4. Test loading and rendering the starting area
5. Expand to additional areas as needed

## References

- Entity Mapping: `/docs/entity-mapping.md`
- Schemas: `/docs/schemas/`
- Quick Reference: `/docs/quick-reference.md`
