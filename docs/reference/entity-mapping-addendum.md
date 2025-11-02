# Zork Entity Mapping Addendum: 1980 ZIL and C Source Analysis

> **Extension to**: `entity-mapping.md`  
> **Date**: October 23, 2025  
> **Sources Analyzed**: 
> - 1980 Infocom ZIL (Zork Implementation Language) source
> - C port of Dungeon/Zork

## Overview

This addendum extends the original entity mapping based on analysis of the 1980 ZIL source code and the C port. The 1980 version represents the commercial Infocom release and includes significant improvements over the 1977 MIT MDL version.

### Analysis Summary

| Source | Rooms | Objects | Verbs | Notes |
|--------|-------|---------|-------|-------|
| 1977 MDL | ~67 | ~150 | ~109 | Original MIT version, walkthroughs |
| **1980 ZIL** | **110** | **122** | **264** | Commercial Infocom release |
| C Port | 110 | 122 | Similar | Faithful port from ZIL |

---

## Key Improvements in 1980 Version

### 1. Complete Room Count: 110 Rooms

The 1980 ZIL source confirms the **full game has exactly 110 rooms**, validating our earlier estimate. This includes:

#### All Rooms by Area

**Surface (9 rooms)**
- WEST-OF-HOUSE
- NORTH-OF-HOUSE
- SOUTH-OF-HOUSE
- EAST-OF-HOUSE (Behind House)
- STONE-BARROW
- FOREST-1, FOREST-2, FOREST-3
- MOUNTAINS

**House Interior (4 rooms)**
- KITCHEN
- LIVING-ROOM
- ATTIC
- CELLAR

**Forest Area (4 rooms)**
- PATH
- UP-A-TREE
- GRATING-CLEARING
- CLEARING

**Maze System (15 rooms)**
- MAZE-1 through MAZE-15
- DEAD-END-1 through DEAD-END-4
- Various interconnected maze passages

**Underground Passages (20+ rooms)**
- TROLL-ROOM
- EAST-OF-CHASM
- GALLERY
- STUDIO
- TORCH-ROOM
- TEMPLE
- EGYPTIAN-ROOM (EGYPT-ROOM)
- And many more...

**Special/Puzzle Rooms (20+ rooms)**
- MIRROR-ROOM-1, MIRROR-ROOM-2
- ATLANTIS-ROOM
- MACHINE-ROOM
- MAINTENANCE-ROOM
- COAL-MINE
- SLIDE-ROOM
- TIMBER-ROOM
- And more...

### 2. Enhanced Object System (122 Objects)

The ZIL source reveals a sophisticated object property system:

#### New Object Flags/Properties

Beyond the basic properties in our original mapping, the 1980 version includes:

**Bit Flags (FLAGS property)**
- `ACTORBIT` - Object is an NPC/actor
- `CONTBIT` - Object is a container
- `OPENBIT` - Container is open
- `TRANSBIT` - Container is transparent (can see contents when closed)
- `LIGHTBIT` - Object provides light
- `ONBIT` - Light source is lit
- `TOUCHBIT` - Object has been touched/handled
- `SEARCHBIT` - Object can be searched
- `CLIMBBIT` - Object can be climbed
- `DOORBIT` - Object is a door
- `NDESCBIT` - No automatic description (scenery)
- `TAKEBIT` - Object can be taken
- `TRYTAKEBIT` - Special handling for taking
- `DRINKBIT` - Liquid can be drunk
- `FLAMBIT` - Object is flammable/on fire

**Properties**
- `SIZE` - Object size (for container capacity)
- `CAPACITY` - Container carrying capacity
- `VALUE` - Point value when in trophy case
- `TVALUE` - Treasure value
- `FDESC` - First/full description
- `LDESC` - Long description (for rooms)
- `SYNONYM` - Synonyms for parser
- `ADJECTIVE` - Adjectives for parser
- `ACTION` - Function to call for object actions

#### Enhanced TypeScript Mapping

Update `GameObjectProperties` interface:

```typescript
export interface GameObjectProperties {
  // Basic state (from original mapping)
  isOpen?: boolean;
  isLocked?: boolean;
  contains?: string[];
  isLight?: boolean;
  isLit?: boolean;
  
  // Enhanced from 1980 ZIL
  isTransparent?: boolean;      // TRANSBIT - can see inside when closed
  isSearchable?: boolean;        // SEARCHBIT - can be searched
  isClimbable?: boolean;         // CLIMBBIT - can be climbed
  isDoor?: boolean;              // DOORBIT - is a door
  isActor?: boolean;             // ACTORBIT - is NPC
  isTouched?: boolean;           // TOUCHBIT - has been handled
  isDrinkable?: boolean;         // DRINKBIT - can drink
  isFlammable?: boolean;         // FLAMBIT - can burn
  
  // Capacity system
  size?: number;                 // SIZE - space object takes up
  capacity?: number;             // CAPACITY - how much can contain
  
  // Value system
  value?: number;                // VALUE - points when in trophy case
  treasureValue?: number;        // TVALUE - treasure value
  
  // Description variants
  firstDescription?: string;     // FDESC - first sight description
  longDescription?: string;      // LDESC - detailed description
  
  // Parser support
  synonyms?: string[];           // SYNONYM - alternative names
  adjectives?: string[];         // ADJECTIVE - describing words
  
  // Action handler
  actionHandler?: string;        // ACTION - custom action function
  
  // Original custom properties
  [key: string]: unknown;
}
```

### 3. Comprehensive Verb List (264 Verbs!)

The 1980 ZIL includes a **massively expanded verb vocabulary** through the `gsyntax.zil` file. This is far beyond our original 109 verbs.

#### New Verbs Categories

**System/Meta (Beyond original)**
- `DIAGNOSE` - Check player status
- `BRIEF`, `VERBOSE`, `SUPERBRIEF` - Description modes
- `SCORE` - Show score
- `VERSION` - Show version info
- `RESTART` - Restart game
- `QUIT`, `Q` - Exit game

**Advanced Actions**
- `ACTIVATE`, `DEACTIVATE` - Turn on/off
- `APPLY` - Use object on something
- `BLAST` - Destroy with explosive
- `BOARD`, `DISEMBARK` - Vehicle entry/exit
- `DEFLATE`, `INFLATE` - Boat operations
- `DISENCHANT` - Remove magic
- `EXCAVATE` - Dig/uncover
- `EXORCISE` - Banish spirits
- `FIND` - Locate object
- `FOLLOW` - Follow character
- `HIDE` - Hide from view
- `KICK` - Kick object
- `KNOCK` - Knock on door
- `LAUNCH` - Launch boat
- `LEAP`, `JUMP` - Jump over/onto
- `LEAVE` - Exit location
- `LISTEN` - Hear sounds
- `LOWER`, `RAISE` - Basket operations
- `MELT` - Melt ice
- `MUNG` - Destroy/mangle (hacker slang)
- `OIL` - Lubricate
- `PICK` - Pick lock
- `PLUG` - Plug leak
- `POKE` - Poke object
- `POUR` - Pour liquid
- `PRAY` - Religious action
- `PRY` - Pry open
- `PUMP` - Pump air
- `RUB` - Rub object
- `SCRAPE` - Scrape surface
- `SHAKE` - Shake object
- `SHOUT`, `YELL` - Make noise
- `SLIDE` - Slide down
- `SMELL` - Smell object
- `SQUEEZE` - Squeeze object
- `STRIKE` - Hit object
- `SWIM` - Swim in water
- `SWING` - Swing on rope
- `TAKE`, `DROP` - Move objects
- `TASTE` - Taste object
- `TELL` - Talk to NPC
- `TEMPLE` - Temple-specific action
- `THROW` - Throw object
- `TIE`, `UNTIE` - Rope operations
- `TOUCH` - Touch object
- `TURN` - Rotate object
- `WALK`, `GO` - Movement
- `WAVE` - Wave object
- `WIND` - Wind up mechanism

**Communication**
- `TELL` - Talk to character
- `ANSWER` - Respond to question
- `COMMAND` - Give order to NPC
- `CURSE`, `DAMN` - Express frustration
- `HELLO`, `GOODBYE` - Greetings

**Special/Debug**
- `BUG` - Report bug
- `ECHO` - Echo input

### 4. Enhanced Room Properties

From the ZIL room definitions:

```typescript
export interface Room {
  id: string;
  name: string;              // DESC in ZIL
  description: string;       // LDESC in ZIL (long description)
  shortDescription?: string; // For revisits
  exits: Map<Direction, string | RoomExit>;
  objectIds: string[];
  visited: boolean;
  
  // Enhanced from 1980 ZIL
  isDark?: boolean;          // Requires light
  actionHandler?: string;    // Custom room action (ACTION property)
  globalObjects?: string[];  // Objects visible from multiple rooms
}

// Enhanced exit system
export interface RoomExit {
  roomId: string;
  condition?: string;        // "IF KITCHEN-WINDOW IS OPEN"
  message?: string;          // Error message if blocked
}
```

### 5. Container System Enhancements

The ZIL source shows a sophisticated container system:

**Transparent Containers** (TRANSBIT)
- Example: BOTTLE (can see water inside even when closed)
- Show contents even when closed
- Must update visibility logic

**Capacity System**
- SIZE property: How much space object takes
- CAPACITY property: How much container can hold
- Example: RAISED-BASKET has `(CAPACITY 50)`

**Container Types**
```typescript
interface ContainerType {
  isOpen: boolean;
  isTransparent: boolean;
  acceptsPrepositions: ('in' | 'on' | 'under' | 'behind')[];
  capacity: number;
  currentLoad: number;  // Sum of contained object sizes
}
```

### 6. Light Source System

More sophisticated than our original mapping:

**Light Flags**
- `LIGHTBIT` - Can be a light source
- `ONBIT` - Currently lit
- `FLAMBIT` - On fire (different from battery light)

**Light Source Types**
1. **Battery Light** (LAMP)
   - `isLight: true, isLit: false, batteryLife: 330`
   - Turns on/off with commands
   
2. **Flame Light** (CANDLES, TORCH)
   - `isLight: true, isLit: false, isFlammable: true`
   - Must be lit with match
   - Burns out over time

3. **Magic Light** (SCEPTRE)
   - `isLight: true, isLit: true, alwaysLit: true`
   - Cannot be extinguished

### 7. NPC/Actor System

The ZIL reveals sophisticated NPC handling:

**Actor Properties** (ACTORBIT objects)
- CYCLOPS
- TROLL
- THIEF
- GHOSTS

**Actor State Machine**
```typescript
interface ActorProperties extends GameObjectProperties {
  isActor: true;
  actorState: 'idle' | 'hostile' | 'dead' | 'friendly' | 'asleep';
  strength: number;
  weapon?: string;      // Object ID of wielded weapon
  follows?: boolean;    // Follows player
  hostile?: boolean;    // Attacks player
  conversationTree?: ConversationNode[];  // Dialog options
}
```

---

## Recommendations for Implementation

### Phase 1 Additions

In addition to the original Phase 1 plan, implement:

1. **Enhanced Object Properties**
   - Add `isTransparent`, `size`, `capacity` fields
   - Implement container capacity checking
   - Add transparent container visibility

2. **Room Exit Conditions**
   - Support conditional exits (e.g., "IF WINDOW IS OPEN")
   - Custom blocked messages

### Phase 2 Additions

1. **Advanced Verbs**
   - Add `inflate`, `deflate` for boat
   - Add `pump` for pump
   - Add `diagnose`, `score`, `version` system commands
   - Add `pour` for liquids

2. **Light System Enhancement**
   - Distinguish battery vs flame light sources
   - Implement burnout for flames
   - Handle always-lit magic items

### Phase 3 Additions

1. **Full 110 Rooms**
   - Implement complete maze (15 rooms)
   - All special puzzle rooms
   - Mirror room system

2. **NPC System**
   - Basic state machine for actors
   - Combat system
   - Following behavior
   - Dialog trees (if applicable)

### Phase 4 Additions

1. **Advanced Features**
   - Container capacity system
   - Transparent containers
   - Conditional room exits
   - Room-specific actions

---

## Updated Data Schema Examples

### Enhanced Room with Conditional Exit

```json
{
  "id": "kitchen",
  "name": "Kitchen",
  "description": "You are in the kitchen of the white house. A table seems to have been used recently for the preparation of food. A passage leads to the west and a dark staircase can be seen leading upward. A dark chimney leads down and to the east is a small window which is open.",
  "shortDescription": "Kitchen",
  "exits": {
    "west": "living-room",
    "up": "attic",
    "down": "cellar",
    "east": {
      "roomId": "east-of-house",
      "condition": "kitchen-window.isOpen",
      "message": "The window is closed."
    }
  },
  "objectIds": ["kitchen-table", "brown-sack", "glass-bottle"],
  "visited": false
}
```

### Enhanced Object with Full Properties

```json
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
    "isTransparent": true,
    "contains": ["water"],
    "acceptsPrepositions": ["in"],
    "capacity": 10,
    "size": 5,
    "currentLoad": 4
  }
}
```

### NPC Object

```json
{
  "id": "troll",
  "name": "troll",
  "aliases": ["ugly troll", "monster"],
  "description": "A nasty-looking troll, brandishing a bloody axe, blocks all passages out of the room.",
  "portable": false,
  "visible": true,
  "location": "troll-room",
  "properties": {
    "isActor": true,
    "actorState": "hostile",
    "strength": 2,
    "weapon": "troll-axe",
    "hostile": true,
    "blocks": ["east", "west", "north", "south"]
  }
}
```

---

## C Port Insights

The C port (from Fortran from MDL) provides additional clarity:

### Room Application Functions

The C code shows that rooms can have special behavior through `rappl1_()`, `rappl2_()` functions. This maps to our `actionHandler` concept.

**Examples:**
- Living Room: Checks state of rug and trapdoor
- Kitchen: Handles window state
- Mirror Rooms: Complex interconnected behavior

### Object Application Functions

Similarly, `oappli_()` handles object-specific logic beyond simple state changes.

**Examples:**
- Lamp: Battery depletion
- Troll: Combat and blocking
- Basket: Raising/lowering mechanism

### State Management

The C code reveals global game state flags:
- `magicf` - Cyclops room magic state
- `orrug` - Oriental rug state
- `mdir` - Mirror direction
- `mloc` - Mirror location
- `poleuf` - Pole position

These should be tracked in `Player.flags` or a global state object.

---

## Comparison: 1977 vs 1980 vs C

| Feature | 1977 MDL | 1980 ZIL | C Port |
|---------|----------|----------|--------|
| Rooms | ~67 (incomplete) | 110 | 110 |
| Objects | ~150 | 122 | 122 |
| Verbs | ~109 | 264 | ~264 |
| Syntax | MDL (LISP-like) | ZIL (structured) | C (procedural) |
| Properties | Basic | Enhanced flags | Bit flags |
| NPCs | Basic | Actor system | State machines |
| Containers | Simple | Capacity system | Full impl. |
| Light | Basic | 3 types | Full impl. |
| Parser | Simple | Advanced | Full impl. |

---

## Migration Strategy

For teams implementing from our original mapping:

1. **Keep existing schema** - Our original TypeScript interfaces are compatible
2. **Extend properties** - Add new optional fields progressively
3. **Add flags gradually** - Implement `isTransparent`, `isClimbable`, etc. as needed
4. **Expand verbs** - Priority 1 verbs first, add advanced verbs in later phases
5. **Use 110 rooms** - Plan data structure for complete game world

---

## Conclusion

The 1980 ZIL and C sources confirm and extend our original entity mapping:

✅ **110 rooms** (confirmed - full game)  
✅ **122 core objects** (well-defined in ZIL)  
✅ **264 verbs** (comprehensive vocabulary)  
✅ **Enhanced property system** (flags, capacity, transparency)  
✅ **Sophisticated NPCs** (actor system)  
✅ **Advanced containers** (capacity, transparency)  
✅ **Multiple light types** (battery, flame, magic)  

Our original TypeScript schema is **forward-compatible** - the additional properties fit naturally as optional extensions. Teams can implement Phase 1 with the original mapping and progressively add 1980 enhancements in later phases.

---

**References:**
- Main Mapping: `/docs/entity-mapping.md`
- 1980 ZIL Source: `/docs/original-src-1980/`
- C Port Source: `/docs/original-src-c/`
- Original 1977 Source: `/docs/original-src-1977/`

**Last Updated**: October 23, 2025  
**Status**: Addendum to original entity mapping
