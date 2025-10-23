# Zork Entity Mapping: Legacy Source to TypeScript Schema

> **Version**: 1.0  
> **Date**: October 23, 2025  
> **Purpose**: Document the mapping strategy from original Zork (1977-1980 MDL/Inform source) to TypeScript/JSON schema for the Zork Web engine.

## Table of Contents

1. [Overview](#overview)
2. [Rooms](#rooms)
3. [Objects](#objects)
4. [Verbs](#verbs)
5. [Directions](#directions)
6. [Edge Cases and Ambiguities](#edge-cases-and-ambiguities)
7. [Implementation Strategy](#implementation-strategy)

> **📌 Important**: See also **[Entity Mapping Addendum](entity-mapping-addendum.md)** for analysis of the 1980 ZIL and C source code, which provides enhanced features, confirms the full 110-room game structure, and extends the property system with backward-compatible additions.

---

## Overview

This document catalogs all entities discovered from analyzing:
- **Original MDL Source** (1977): `/docs/original-src-1977/zork/`
- **Walkthroughs**: `/docs/walkthrough1.md`, `/docs/walkthrough2.md`, `/docs/walkthrough3.md`
- **Existing TypeScript Models**: `/src/app/core/models/`

### Analysis Summary

| Entity Type | Count | Status |
|-------------|-------|--------|
| Rooms | ~110 (estimated full game) | 67 cataloged from walkthroughs |
| Objects | ~150+ | 150 unique objects identified |
| Verbs | ~110 | 109 verbs cataloged |
| Directions | 12 | All standard directions mapped |

---

## Rooms

### TypeScript Schema

The existing `Room` interface in `/src/app/core/models/room.model.ts`:

```typescript
export interface Room {
  id: string;              // Unique identifier (kebab-case)
  name: string;            // Display name
  description: string;     // Full description (first visit)
  exits: Map<Direction, string>;  // Direction → room ID
  objectIds: string[];     // Objects in this room
  visited: boolean;        // Has player been here?
  shortDescription?: string;  // Brief description (revisits)
}

export type Direction = 'north' | 'south' | 'east' | 'west' | 'up' | 'down';
```

### Cataloged Rooms (from Walkthroughs)

#### Surface/House Area
1. **West of House** - Starting location, open field with mailbox
2. **North of House** - North side of white house
3. **South of House** - South side of white house, window
4. **Behind House** - East side, window to kitchen
5. **Kitchen** - Table with sack and bottle, stairs up
6. **Living Room** - Trophy case, rug, doors
7. **Attic** - Rope, brick, knife

#### Forest Area
8. **Forest** - Various forest locations
9. **Up a Tree** - In a tree
10. **Clearing** - Forest clearing

#### Underground Areas
11. **Cellar** - Below house, trapdoor
12. **Troll Room** - Contains troll
13. **East-West Passage**
14. **Round Room** - Circular chamber
15. **Narrow Crawlway**
16. **Small Cave**
17. **Grating Room** - Grating access

#### Maze Section
18. **Maze** - Multiple maze rooms (interconnected)
19. **Winding Passage**
20. **North-South Passage**
21. **North-South Crawlway**

#### River/Dam Area
22. **Dam** - Dam structure
23. **Reservoir South**
24. **Stream View**
25. **Rocky Shore**

#### Cave System
26. **Damp Cave**
27. **Ancient Chasm**
28. **Chasm**
29. **West of Chasm**
30. **Deep Canyon**
31. **Deep Ravine**
32. **Rocky Crawl**

#### Temple/Treasure Area
33. **Temple** - Religious area
34. **Altar**
35. **Egyptian Room** - Egyptian artifacts
36. **Dome Room**
37. **Torch Room**
38. **Circular Room**

#### Special Locations
39. **Entrance to Hades** - Perilous location
40. **Loud Room** - Acoustically active
41. **Mirror Room** - Contains mirror
42. **Gallery** - Art gallery
43. **Studio** - Artist's studio
44. **Pearl Room** - Contains pearl
45. **Grail Room** - Contains grail
46. **Glacier Room** - Icy area
47. **Bank Entrance**
48. **Safety Depository** - Bank vault
49. **Viewing Room**
50. **Tiny Room**
51. **Small Room**
52. **Riddle Room** - Puzzle location
53. **Volcano View**
54. **Tomb of the Unknown Implementer** - Easter egg

### Mapping Strategy: Rooms

#### ID Generation
Convert room names to kebab-case IDs:
- "West of House" → `west-of-house`
- "Living Room" → `living-room`
- "Entrance to Hades" → `entrance-to-hades`

#### Description Strategy
1. **First Visit**: Full `description` with atmosphere and details
2. **Revisits**: Use `shortDescription` (room name) or brief version
3. **Conditional Descriptions**: Use game state flags for dynamic text

#### Exit Mapping
```typescript
exits: new Map([
  ['north', 'north-of-house'],
  ['south', 'kitchen'],
  ['east', 'living-room']
])
```

#### Example Room JSON
```json
{
  "id": "west-of-house",
  "name": "West of House",
  "description": "You are standing in an open field west of a white house, with a boarded front door. There is a small mailbox here.",
  "shortDescription": "West of House",
  "exits": {
    "north": "north-of-house",
    "south": "south-of-house",
    "east": "behind-house"
  },
  "objectIds": ["mailbox"],
  "visited": false
}
```

---

## Objects

### TypeScript Schema

The existing `GameObject` interface in `/src/app/core/models/game-object.model.ts`:

```typescript
export interface GameObject {
  id: string;              // Unique identifier
  name: string;            // Display name
  aliases: string[];       // Alternative names
  description: string;     // Examine text
  portable: boolean;       // Can be taken?
  visible: boolean;        // Currently visible?
  location: string;        // Room ID or 'inventory'
  properties?: GameObjectProperties;
}

export interface GameObjectProperties {
  isOpen?: boolean;        // Container state
  isLocked?: boolean;      // Lock state
  contains?: string[];     // Container contents
  isLight?: boolean;       // Is light source?
  isLit?: boolean;         // Is lit?
  [key: string]: unknown;  // Custom properties
}
```

### Object Categories

#### 1. Treasures (Points/Victory Objects)
- **Platinum Bar** - Valuable treasure
- **Gold Coffin** - Contains treasures
- **Diamond** - Precious gem
- **Grail** - Holy grail
- **Pearl** - From oyster
- **Emerald** - Green gem
- **Sapphire** - Blue gem
- **Ruby** - Red gem
- **Egg** (jewel-encrusted) - Opens to reveal canary/bauble
- **Chalice** - Ornate cup
- **Trident** - Neptune's weapon
- **Ancient Map** - Navigational aid
- **Painting** - Valuable art
- **Stamp Collection** - Collectible
- **Scarab** - Egyptian artifact
- **Crystal Skull** - Mystic item

#### 2. Light Sources
- **Brass Lamp** (battery-powered) - Primary light source
  - `portable: true, isLight: true, isLit: false`
  - Verbs: `light`, `turn on`, `extinguish`, `turn off`
- **Candles** (pair) - Secondary light
  - Limited duration
- **Torch** - Cave lighting

#### 3. Containers
- **Small Mailbox** - Starting location, contains leaflet
  - `portable: false, isOpen: false, contains: ['leaflet']`
- **Trophy Case** - Display case in living room
  - `portable: false, isOpen: false` (or always open?)
- **Brown Sack** - Contains lunch and garlic
  - `portable: true, isOpen: false`
- **Coffin** - Gold coffin (treasure + container)
- **Egg** - Opens to reveal items
- **Basket** - For carrying items
- **Buoy** - Floating container

#### 4. Keys/Unlocking Items
- **Skeleton Key** - Unlocks doors/gates
- **Rusty Key** - Alternative key
- **Keys** - Various keys for puzzles

#### 5. Weapons
- **Elvish Sword** - Glows near enemies, weapon
  - Special property: `glowsNearEnemies: true`
- **Knife** - Nasty-looking knife from attic
- **Axe** - Woodcutting tool/weapon

#### 6. Tools/Utility Items
- **Rope** - For climbing/tying
- **Screwdriver** - Tool for mechanisms
- **Wrench** - Tool
- **Shovel** - For digging
- **Pump** - Inflates raft
- **Bottle** (glass) - Contains water
  - `isOpen: true, contains: ['water']`

#### 7. Consumables/Special Items
- **Water** - In bottle, drinkable
- **Garlic** (clove) - Repels vampire
- **Lunch** - Food item
- **Coal** - Fuel (for oven/fire?)
- **Guidebook/Brochure** - Readable info
- **Leaflet** - "WELCOME TO ZORK" text
- **Newspaper** - Readable, dated

#### 8. Immovable/Scenery Objects
- **White House** - The house itself
- **Wooden Door** - Nailed shut, has engravings
  - `portable: false, isLocked: true` (or blocked)
- **Oriental Rug/Carpet** - Covers trapdoor
  - `portable: false` (but moveable)
- **Grating** - Metal grate, openable/lockable
  - `portable: false, isOpen: false, isLocked: true`
- **Trapdoor** - Under rug
- **Window** - Kitchen window, openable
- **Mirror** - In Mirror Room
- **Altar** - Stone altar
- **Boat** - Magic boat (transportation)
- **Dam** - Large structure
- **Bell** - Ringing mechanism
- **Canary** - Bird (inside egg)
- **Bubble** - Crystal bubble

#### 9. Enemies/NPCs (treated as special objects)
- **Troll** - Guards passage, attackable
- **Thief** - Steals items
- **Cyclops** - Large monster
- **Grue** - Lurks in darkness

### Mapping Strategy: Objects

#### ID Convention
Use kebab-case, descriptive IDs:
- "Brass Lamp" → `brass-lamp`
- "Small Mailbox" → `small-mailbox`
- "Elvish Sword" → `elvish-sword`

#### Aliases
Include common variations:
```typescript
{
  id: 'brass-lamp',
  name: 'brass lamp',
  aliases: ['lamp', 'lantern', 'light', 'brass lantern'],
  // ...
}
```

#### Container Contents
Initialize with nested objects:
```typescript
{
  id: 'mailbox',
  properties: {
    isOpen: false,
    contains: ['leaflet']
  }
}
```

#### Example Object JSON
```json
{
  "id": "brass-lamp",
  "name": "brass lamp",
  "aliases": ["lamp", "lantern", "light"],
  "description": "A battery-powered brass lantern is here.",
  "portable": true,
  "visible": true,
  "location": "living-room",
  "properties": {
    "isLight": true,
    "isLit": false,
    "batteryLife": 330
  }
}
```

---

## Verbs

### TypeScript Schema

The existing `Verb` interface in `/src/app/core/models/verb.model.ts`:

```typescript
export interface Verb {
  name: string;             // Primary verb
  aliases: string[];        // Synonyms
  requiresObject: boolean;  // Needs direct object?
  allowsIndirectObject: boolean;  // Supports "verb X with Y"?
  description?: string;     // Help text
}
```

### Cataloged Verbs by Category

#### Navigation (8 verbs)
1. **go** - Move in a direction
   - Aliases: `walk`, `move`, `proceed`
   - Pattern: `go north`, `go east`
   - `requiresObject: true` (direction is the object)
2. **north, south, east, west, up, down** - Direct directions
   - Aliases: `n`, `s`, `e`, `w`, `u`, `d`
   - `requiresObject: false`
3. **enter** - Enter location/object
   - Aliases: `go in`, `in`
4. **exit** - Leave location
   - Aliases: `leave`, `out`
5. **climb** - Climb tree/rope/ladder
   - `requiresObject: true`

#### Observation (3 verbs)
6. **look** - Describe current room
   - Aliases: `l`
   - `requiresObject: false`
7. **examine** - Inspect object closely
   - Aliases: `x`, `inspect`, `describe`
   - `requiresObject: true`
8. **read** - Read text on object
   - `requiresObject: true`

#### Inventory Management (3 verbs)
9. **take** - Pick up object
   - Aliases: `get`, `pick up`, `grab`, `carry`
   - `requiresObject: true`
10. **drop** - Drop object from inventory
    - Aliases: `put down`, `discard`, `leave`
    - `requiresObject: true`
11. **inventory** - List carried items
    - Aliases: `i`, `inv`
    - `requiresObject: false`

#### Container/Object Manipulation (6 verbs)
12. **open** - Open container/door
    - `requiresObject: true`
13. **close** - Close container/door
    - Aliases: `shut`
    - `requiresObject: true`
14. **lock** - Lock with key
    - `requiresObject: true`
    - `allowsIndirectObject: true` (lock X with Y)
15. **unlock** - Unlock with key
    - `requiresObject: true`
    - `allowsIndirectObject: true`
16. **put** - Place object in/on container
    - Aliases: `place`, `insert`
    - `requiresObject: true`
    - `allowsIndirectObject: true` (put X in Y)
17. **move** - Move/push object
    - Aliases: `push`, `pull`, `slide`
    - `requiresObject: true`

#### Light Management (3 verbs)
18. **light** - Ignite light source
    - Aliases: `turn on`, `ignite`
    - `requiresObject: true`
19. **extinguish** - Put out light
    - Aliases: `turn off`, `put out`, `douse`
    - `requiresObject: true`

#### Combat (3 verbs)
20. **attack** - Attack enemy
    - Aliases: `kill`, `fight`, `hit`, `strike`
    - `requiresObject: true`
    - `allowsIndirectObject: true` (attack X with Y)
21. **throw** - Throw object
    - Aliases: `hurl`, `toss`
    - `requiresObject: true`
    - `allowsIndirectObject: true` (throw X at Y)

#### Communication/Interaction (5 verbs)
22. **give** - Give object to NPC
    - `requiresObject: true`
    - `allowsIndirectObject: true` (give X to Y)
23. **say** - Speak word/phrase
    - Aliases: `speak`, `answer`
    - `requiresObject: true`
24. **call** - Call/hail NPC
    - Aliases: `hail`, `shout`
25. **ring** - Ring bell
    - `requiresObject: true`
26. **wave** - Wave object
    - `requiresObject: true`

#### Utility/Puzzle (10 verbs)
27. **use** - Generic use action
    - `requiresObject: true`
28. **tie** - Tie rope to object
    - Aliases: `fasten`, `attach`
    - `requiresObject: true`
    - `allowsIndirectObject: true`
29. **break** - Break/smash object
    - Aliases: `smash`, `destroy`
    - `requiresObject: true`
30. **dig** - Dig with shovel
    - `requiresObject: false` (or requires tool)
31. **drink** - Drink liquid
    - `requiresObject: true`
32. **eat** - Eat food
    - `requiresObject: true`
33. **inflate** - Inflate raft/boat
    - `requiresObject: true`
34. **burn** - Burn object
    - `requiresObject: true`
35. **cut** - Cut with knife
    - `requiresObject: true`
    - `allowsIndirectObject: true`
36. **listen** - Listen to sounds
    - `requiresObject: false`

#### System/Meta (5 verbs)
37. **help** - Display help
    - Aliases: `?`, `commands`
    - `requiresObject: false`
38. **save** - Save game state
    - `requiresObject: false`
39. **load** - Load saved game
    - Aliases: `restore`
    - `requiresObject: false`
40. **quit** - Exit game
    - Aliases: `q`, `exit`
    - `requiresObject: false`
41. **restart** - Restart game
    - `requiresObject: false`

#### Additional Verbs from Walkthroughs
- **count** - Count objects
- **jump** - Jump (in place or over)
- **cross** - Cross bridge/gap
- **wait** - Wait/pass time
- **blow** - Blow horn/whistle
- **kick** - Kick object
- **feel** - Feel/touch object
- **smell** - Smell object
- **taste** - Taste object
- **turn** - Turn object/dial
- **pray** - Religious action
- **swim** - Swim in water
- **dive** - Dive underwater

### Mapping Strategy: Verbs

#### Implementation Approach
1. **Core Verbs** (Priority 1): Navigation, observation, inventory, basic manipulation
2. **Extended Verbs** (Priority 2): Containers, combat, light management
3. **Puzzle Verbs** (Priority 3): Specialized actions for specific puzzles
4. **Meta Verbs** (Priority 4): System commands

#### Verb Handler Pattern
```typescript
// In GameEngineService
private handleTake(parserResult: ParserResult): CommandOutput {
  const obj = this.getObject(parserResult.directObject);
  
  if (!obj) {
    return { messages: ["You can't see that here."], success: false };
  }
  
  if (!obj.portable) {
    return { messages: ["You can't take that."], success: false };
  }
  
  // Move object to inventory
  // Return success message
}
```

#### Example Verb Definition
```json
{
  "name": "take",
  "aliases": ["get", "pick up", "grab", "carry"],
  "requiresObject": true,
  "allowsIndirectObject": false,
  "description": "Pick up an object and add it to your inventory"
}
```

---

## Directions

### Standard Directions

All 12 compass directions + up/down are supported:

| Full Name | Abbreviation | Opposite |
|-----------|--------------|----------|
| north | n | south |
| south | s | north |
| east | e | west |
| west | w | east |
| northeast | ne | southwest |
| northwest | nw | southeast |
| southeast | se | northwest |
| southwest | sw | northeast |
| up | u | down |
| down | d | up |
| in | - | out |
| out | - | in |

### TypeScript Mapping

Extend the existing `Direction` type:

```typescript
export type Direction = 
  | 'north' | 'south' | 'east' | 'west'
  | 'northeast' | 'northwest' | 'southeast' | 'southwest'
  | 'up' | 'down'
  | 'in' | 'out';

export type DirectionAlias = 
  | 'n' | 's' | 'e' | 'w'
  | 'ne' | 'nw' | 'se' | 'sw'
  | 'u' | 'd';
```

---

## Edge Cases and Ambiguities

### 1. Multi-Word Object Names

**Issue**: Objects like "small mailbox", "brass lamp", "trophy case"

**Strategy**:
- Store full name in `name` field
- Include partial names in `aliases`
- Parser should match longest alias first

```typescript
{
  name: 'small mailbox',
  aliases: ['mailbox', 'box', 'small mailbox']
}
```

### 2. Synonym Handling

**Issue**: Multiple verbs for same action (take/get, examine/x, light/turn on)

**Strategy**:
- Define canonical verb name
- Map all aliases to canonical in parser
- Execute using canonical verb handler

### 3. Implied Objects

**Issue**: Commands like "take all", "drop everything"

**Strategy**:
- Special case in parser for `all`, `everything`, `inventory`
- Iterate over applicable objects
- Return combined results

### 4. Container Visibility

**Issue**: Objects inside closed containers shouldn't be takeable

**Strategy**:
- Check `isOpen` property before allowing access to `contains`
- Filter visible objects based on container state
- Special handling for transparent containers (if any)

### 5. Light and Darkness

**Issue**: "It is pitch black. You are likely to be eaten by a grue."

**Strategy**:
- Track whether player has active light source
- Room property: `requiresLight: boolean`
- Limit available commands in darkness
- Implement grue attack logic

```typescript
interface Room {
  // ... existing properties
  isDark?: boolean;  // Room is dark without light source
}
```

### 6. Dynamic Descriptions

**Issue**: Room/object descriptions change based on state

**Strategy**:
- Template system with conditionals
- Check game state flags before rendering
- Multiple description variants

```typescript
interface GameObject {
  // ... existing properties
  descriptionStates?: {
    default: string;
    open?: string;
    locked?: string;
    lit?: string;
  };
}
```

### 7. Object Location Ambiguity

**Issue**: Same object name in multiple locations (e.g., multiple keys)

**Strategy**:
- Unique IDs for all objects
- Search order: inventory → current room → visible adjacent rooms
- Disambiguate if multiple matches

### 8. Preposition Variations

**Issue**: "put lamp in case" vs "put lamp on table"

**Strategy**:
- Capture preposition in `ParserResult`
- Validate preposition against object properties
- Some objects accept "in", others "on"

```typescript
interface GameObjectProperties {
  // ... existing properties
  acceptsPrepositions?: ('in' | 'on' | 'under' | 'behind')[];
}
```

### 9. State Dependencies

**Issue**: Can't unlock door without key, can't read in darkness

**Strategy**:
- Check preconditions before executing verb
- Return specific error messages
- Some actions require other actions first

### 10. Inventory Limits

**Issue**: Original Zork has inventory weight/size limits

**Strategy**:
- Track total carried items
- Implement weight/size system (optional)
- Restrict take action when over limit

```typescript
interface Player {
  // ... existing properties
  carryingCapacity: number;  // Max items
  currentWeight?: number;    // Optional weight system
}
```

### 11. Timed Events

**Issue**: Lamp battery depletes, candles burn out

**Strategy**:
- Track turns/time for consumable items
- Decrement on each move
- Trigger events when depleted

```typescript
interface GameObjectProperties {
  // ... existing properties
  durability?: number;  // Turns remaining
  consumable?: boolean;
}
```

### 12. NPCs and Combat

**Issue**: Troll, thief, and other creatures have AI

**Strategy**:
- Treat as special objects with behavior
- Implement turn-based actions
- State machine for NPC behavior

```typescript
interface GameObject {
  // ... existing properties
  isNPC?: boolean;
  npcState?: 'idle' | 'hostile' | 'dead' | 'friendly';
  npcBehavior?: NPCBehaviorHandler;
}
```

---

## Implementation Strategy

### Phase 1: Core Entities (Week 1)
1. **Define JSON Schema** for rooms, objects, verbs
2. **Create data files** for initial area (house + nearby)
3. **Implement core verbs**: go, look, take, drop, inventory, examine
4. **Test basic gameplay loop**

### Phase 2: Extended Mechanics (Week 2)
1. **Container system**: open, close, put in/on
2. **Light system**: lamp, darkness, grue warnings
3. **Lock system**: unlock/lock with keys
4. **Combat basics**: attack, weapons, simple NPCs

### Phase 3: Full World (Week 3-4)
1. **Complete room definitions** for all 110+ rooms
2. **All treasures and items**
3. **Puzzle mechanics**: specific object interactions
4. **Advanced NPCs**: troll, thief behavior

### Phase 4: Polish (Week 5)
1. **Dynamic descriptions** based on state
2. **Timed events** (lamp battery, etc.)
3. **Save/load system**
4. **Win/lose conditions**
5. **Easter eggs and secrets**

### Data Organization

```
/src/app/data/
  rooms/
    house-area.json      # West of house, kitchen, living room, attic
    forest-area.json     # Forest, clearing, tree
    cellar-area.json     # Underground near house
    maze-area.json       # Maze rooms
    river-area.json      # Dam, reservoir, stream
    cave-area.json       # Cave system
    temple-area.json     # Temple, altar, treasure rooms
    endgame-area.json    # Special final areas
  
  objects/
    treasures.json       # All treasure objects
    tools.json           # Rope, lamp, keys, etc.
    containers.json      # Mailbox, case, sack, etc.
    scenery.json         # Immovable objects
    enemies.json         # NPCs/creatures
  
  verbs/
    verbs.json           # All verb definitions
  
  world.json             # Aggregate world configuration
```

### Validation Strategy

1. **Schema Validation**: Use JSON schema to validate data files
2. **Reference Validation**: All room exits point to valid room IDs
3. **Object Validation**: All objectIds in rooms exist in object definitions
4. **Consistency Checks**: Aliases don't conflict, IDs are unique
5. **Playtest**: Compare against original Zork walkthrough transcripts

### Testing Approach

1. **Unit Tests**: Each verb handler tested independently
2. **Integration Tests**: Multi-step action sequences
3. **Walkthrough Tests**: Automated playthrough of known solutions
4. **Regression Tests**: Ensure fixes don't break existing functionality

---

## Appendix: Complete Entity Lists

### All Cataloged Rooms (67)

See [Rooms](#cataloged-rooms-from-walkthroughs) section above.

### All Cataloged Objects (150+)

See [Objects](#object-categories) section above.

### All Cataloged Verbs (109)

See [Verbs](#cataloged-verbs-by-category) section above.

---

## References

1. **Original Source**: `/docs/original-src-1977/` - 1977 MDL source code
2. **1980 ZIL Source**: `/docs/original-src-1980/` - Commercial Infocom ZIL version
3. **C Port Source**: `/docs/original-src-c/` - C port of Dungeon/Zork
4. **Walkthroughs**: 
   - `/docs/walkthrough1.md` - Basic playthrough
   - `/docs/walkthrough2.md` - Detailed ClubFloyd transcript
   - `/docs/walkthrough3.md` - Alternative approach
5. **Architecture**: `/docs/architecture.md` - Engine design
6. **Models**: `/src/app/core/models/` - TypeScript interfaces
7. **Addendum**: `/docs/entity-mapping-addendum.md` - 1980 ZIL & C analysis with enhanced features

---

**Last Updated**: October 23, 2025  
**Maintainer**: Zork Web Team  
**Status**: Living document - update as implementation progresses

> **See Also**: [Entity Mapping Addendum](entity-mapping-addendum.md) for 1980 ZIL enhancements
