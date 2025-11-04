# Legacy Thief System → New TypeScript Implementation: Migration Guide

## Overview

This document provides a comprehensive mapping between the original Zork ZIL (Zork Implementation Language) thief routines and the new TypeScript/Angular implementation. It serves as a reference for maintainers, QA testers, and developers working on the thief system.

## Table of Contents

- [Legacy Thief System Components](#legacy-thief-system-components)
- [Legacy Routine Reference](#legacy-routine-reference)
  - [I-THIEF](#i-thief)
  - [THIEF-VS-ADVENTURER](#thief-vs-adventurer)
  - [ROBBER-FUNCTION](#robber-function)
  - [ROB](#rob)
  - [STEAL-JUNK](#steal-junk)
  - [DROP-JUNK](#drop-junk)
  - [RECOVER-STILETTO](#recover-stiletto)
  - [DEPOSIT-BOOTY](#deposit-booty)
  - [HACK-TREASURES](#hack-treasures)
  - [ROB-MAZE](#rob-maze)
  - [STOLE-LIGHT?](#stole-light)
  - [TREASURE-ROOM-FCN](#treasure-room-fcn)
  - [THIEF-IN-TREASURE](#thief-in-treasure)
  - [LARGE-BAG-F](#large-bag-f)
  - [CHALICE-FCN](#chalice-fcn)
- [Legacy to New Code Mapping](#legacy-to-new-code-mapping)
- [State Management Mapping](#state-management-mapping)
- [Probability System Mapping](#probability-system-mapping)
- [QA Parity Testing Checklist](#qa-parity-testing-checklist)
- [Known Gaps and TODOs](#known-gaps-and-todos)

---

## Legacy Thief System Components

The legacy thief system consists of:

### Objects (1dungeon.zil)

- **THIEF** (lines 968-983): The thief actor object
- **STILETTO** (lines 882-888): The thief's weapon
- **LARGE-BAG** (lines 890-893): The thief's container for stolen goods

### Routines (1actions.zil)

- **I-THIEF** (lines 3890-3931): Main tick/interrupt function for thief AI
- **THIEF-VS-ADVENTURER** (lines 1764-1873): Encounter logic when player meets thief
- **ROBBER-FUNCTION** (lines 1947-2084): Action handler for thief interactions
- **ROB** (lines 3976-3989): Core stealing logic
- **STEAL-JUNK** (lines 3954-3974): Steal worthless items from rooms
- **DROP-JUNK** (lines 3933-3947): Drop worthless items in rooms
- **RECOVER-STILETTO** (lines 3949-3952): Pick up stiletto if dropped
- **DEPOSIT-BOOTY** (lines 1897-1909): Place treasures in treasure room
- **HACK-TREASURES** (lines 1888-1895): Make invisible treasures visible
- **ROB-MAZE** (lines 1917-1927): Special stealing for maze rooms
- **STOLE-LIGHT?** (lines 1875-1880): Check if thief stole light source
- **TREASURE-ROOM-FCN** (lines 2138-2149): Handle treasure room entry
- **THIEF-IN-TREASURE** (lines 2151-2160): Handle thief in treasure room
- **LARGE-BAG-F** (lines 2094-2112): Handler for large bag interactions
- **CHALICE-FCN** (lines 2123-2136): Handler for chalice in treasure room

### Global Variables

- **THIEF-HERE** (line 1754): Boolean tracking if thief is present
- **THIEF-ENGROSSED** (line 1945): Boolean tracking if thief is distracted
- **ROBBER-C-DESC** (lines 2086-2088): Conscious thief description
- **ROBBER-U-DESC** (lines 2090-2092): Unconscious thief description

---

## Legacy Routine Reference

### I-THIEF

**Location**: `docs/original-src-1980/1actions.zil` lines 3890-3931

**Purpose**: Main interrupt routine that controls thief's autonomous behavior on each game tick.

**Legacy Code Behavior**:

1. Determines if thief is visible (HERE?)
2. If in treasure room and not visible: deposits treasures silently via DEPOSIT-BOOTY
3. If in same room as player and room is not lit and troll is not present: calls THIEF-VS-ADVENTURER
4. If player left the room: makes thief invisible
5. If room has been touched by player: steals items via ROB or STEAL-JUNK/ROB-MAZE
6. Moves thief to next valid room (non-sacred, on land)
7. Drops worthless items via DROP-JUNK

**Parameters**: None (operates on global THIEF object)

**Returns**: Boolean indicating if theft occurred

**Key Logic**:

```zil
<COND
  (<AND <EQUAL? .RM ,TREASURE-ROOM> <NOT <EQUAL? .RM ,HERE>>>
   <DEPOSIT-BOOTY ,TREASURE-ROOM>)  ; Silent deposit

  (<AND <EQUAL? .RM ,HERE> <NOT <FSET? .RM ,ONBIT>> <NOT <IN? ,TROLL ,HERE>>>
   <THIEF-VS-ADVENTURER .HERE?>)    ; Encounter logic

  (T
   <ROB .RM ,THIEF 75>               ; Steal from room
   <STEAL-JUNK .RM>                  ; Steal worthless items
   <MOVE ,THIEF .NEXT-RM>            ; Move to next room
   <DROP-JUNK .RM>))                 ; Drop junk
```

**New Implementation**:

- **File**: `src/app/core/models/thief-actor.ts`
- **Method**: `onTick()` (lines 140-153)
- **Status**: ⚠️ STUB - TODO implementation
- **Dependencies Needed**: GameEngineService, room navigation, player position

---

### THIEF-VS-ADVENTURER

**Location**: `docs/original-src-1980/1actions.zil` lines 1764-1873

**Purpose**: Handles thief encounters when player enters or is in the same room. Controls thief appearing, stealing, fleeing, and combat decisions.

**Legacy Code Behavior**:

1. If player is in treasure room: returns immediately (thief protected by TREASURE-ROOM-FCN)
2. **If thief not present** (THIEF-HERE is false):
   - 30% chance to appear with stiletto, becomes visible
   - If losing combat: flees into shadows, recovers stiletto
   - 30% chance to leave disgusted without stealing
   - 70% chance to do nothing (remain hidden)
   - Otherwise: steals via ROB from room or player, possibly reports theft
3. **If thief present** (THIEF-HERE is true):
   - If in same room: 30% chance to steal and leave
   - Checks if player's light source was stolen via STOLE-LIGHT?

**Parameters**:

- `HERE?`: Boolean indicating if player is in same room as thief

**Returns**: Boolean indicating if encounter completed

**Key Probabilities**:

- 30% to appear when not present
- 90% to continue fighting if already fighting
- 30% to leave without stealing
- 70% to remain hidden/inactive
- 30% to steal when already present

**Messages**:

- Appears with bag: "Someone carrying a large bag is casually leaning..."
- Flees when losing: "Your opponent, determining discretion to be the better part of valor..."
- Leaves disgusted: "The holder of the large bag just left, looking disgusted..."
- Steals from room: "A seedy-looking individual with a large bag just wandered through..."
- Steals from player: "The thief just left, still carrying his large bag..."

**New Implementation**:

- **File**: `src/app/core/models/thief-actor.ts`
- **Method**: `onEncounter()` (lines 161-164)
- **Status**: ⚠️ STUB - TODO implementation
- **Config Mapping**:
  - appearProbability (0.3) → 30% appear chance
  - stealProbability (0.5) → used in ROB calls
  - fleeWhenWeakProbability (0.4) → flee when losing

---

### ROBBER-FUNCTION

**Location**: `docs/original-src-1980/1actions.zil` lines 1947-2084

**Purpose**: Main action handler for thief object. Processes player verbs (TELL, HELLO, THROW, GIVE, TAKE, EXAMINE, LISTEN) and handles state transitions (CONSCIOUS, UNCONSCIOUS, DEAD, BUSY).

**Legacy Code Behavior**:

#### Verb Handling (no MODE)

- **TELL**: "The thief is a strong, silent type."
- **HELLO**: Special message if unconscious
- **THROW KNIFE**: 10% chance to frighten thief away, drops bag contents; else angers thief
- **THROW/GIVE item**:
  - Revives if unconscious (negative strength becomes positive)
  - If valuable (TVALUE > 0): sets THIEF-ENGROSSED, admires gift
  - If worthless: accepts politely, adds to bag
- **TAKE**: "Once you got him, what would you do with him?"
- **EXAMINE/LOOK-INSIDE**: Detailed description of thief
- **LISTEN**: "The thief says nothing, as you have not been formally introduced."

#### Mode Transitions

- **F-BUSY**: Recovers stiletto if in same location
- **F-DEAD**:
  - Drops stiletto in room
  - Deposits booty via DEPOSIT-BOOTY
  - If in treasure room: reveals all invisible items via HACK-TREASURES
  - Disables I-THIEF interrupt
- **F-UNCONSCIOUS**:
  - Disables I-THIEF interrupt
  - Clears FIGHTBIT
  - Drops stiletto
  - Sets description to ROBBER-U-DESC
- **F-CONSCIOUS**:
  - Enables I-THIEF interrupt
  - Sets FIGHTBIT if in same room as player
  - Sets description to ROBBER-C-DESC
  - Recovers stiletto
- **F-FIRST?**: 20% chance to set FIGHTBIT when thief is present

**New Implementation**:

- **File**: `src/app/core/models/thief-actor.ts`
- **Methods**:
  - Mode transitions: `onDeath()` (lines 177-189), `onDamage()` (lines 197-221), `onConscious()` (lines 227-242)
  - Gift handling: `acceptGift()` (lines 252-280)
- **Status**: ✅ Partially implemented (modes and gift acceptance)
- **TODOs**:
  - Stiletto dropping in onDamage
  - Stiletto recovery in onConscious
  - Message generation for gift acceptance
  - Verb handler integration

---

### ROB

**Location**: `docs/original-src-1980/1actions.zil` lines 3976-3989

**Purpose**: Core routine to steal valuable items from a source (room or player) to a destination (thief).

**Legacy Code Behavior**:

1. Iterates through all objects in source (WHAT)
2. For each object, checks:
   - Not invisible
   - Not sacred
   - Has treasure value > 0 (TVALUE)
   - Passes probability check if PROB parameter provided
3. If all checks pass:
   - Moves item to destination (WHERE)
   - Sets TOUCHBIT flag on item
   - If destination is thief: sets item to INVISIBLE
   - Returns true if any item was stolen

**Parameters**:

- `WHAT`: Source location (room or player/adventurer)
- `WHERE`: Destination (typically THIEF)
- `PROB`: Optional probability percentage (e.g., 75, 100)

**Returns**: Boolean indicating if any items were robbed

**Key Logic**:

```zil
<COND (<AND <NOT <FSET? .X ,INVISIBLE>>
            <NOT <FSET? .X ,SACREDBIT>>
            <G? <GETP .X ,P?TVALUE> 0>
            <OR <NOT .PROB> <PROB .PROB>>>
       <MOVE .X .WHERE>
       <FSET .X ,TOUCHBIT>
       <COND (<EQUAL? .WHERE ,THIEF> <FSET .X ,INVISIBLE>)>
       <SET ROBBED? T>)>
```

**New Implementation**:

- **File**: Not yet implemented as standalone method
- **Expected Location**: InventoryService or ThiefActor helper method
- **Status**: ⚠️ TODO - needs implementation
- **Config Mapping**: Uses stealProbability from ThiefConfigService

---

### STEAL-JUNK

**Location**: `docs/original-src-1980/1actions.zil` lines 3954-3974

**Purpose**: Steal worthless items (TVALUE = 0) from a room.

**Legacy Code Behavior**:

1. Iterates through all objects in room (RM)
2. For each object, checks:
   - Has TVALUE = 0 (worthless)
   - Has TAKEBIT (can be picked up)
   - Not sacred
   - Not invisible
   - Either is stiletto OR passes 10% probability check
3. If all checks pass:
   - Moves item to thief's inventory
   - Sets TOUCHBIT and INVISIBLE flags
   - Special case: if ROPE, clears DOME-FLAG
   - If in player's current room: announces "You suddenly notice that the X vanished."

**Parameters**:

- `RM`: Room to steal from

**Returns**: Boolean indicating if any junk was stolen

**Key Logic**:

```zil
<COND (<AND <0? <GETP .X ,P?TVALUE>>
            <FSET? .X ,TAKEBIT>
            <NOT <FSET? .X ,SACREDBIT>>
            <NOT <FSET? .X ,INVISIBLE>>
            <OR <EQUAL? .X ,STILETTO>
                <PROB 10 T>>>
       <MOVE .X ,THIEF>
       <FSET .X ,TOUCHBIT>
       <FSET .X ,INVISIBLE>)>
```

**New Implementation**:

- **Status**: ⚠️ TODO - needs implementation
- **Expected Location**: ThiefActor helper method or InventoryService
- **Config Mapping**: Uses custom 10% probability for worthless items

---

### DROP-JUNK

**Location**: `docs/original-src-1980/1actions.zil` lines 3933-3947

**Purpose**: Drop worthless items from thief's inventory into the current room.

**Legacy Code Behavior**:

1. Iterates through thief's inventory
2. For each item, checks:
   - Not stiletto or large bag
   - Has TVALUE = 0 (worthless)
   - Passes 30% probability check
3. If all checks pass:
   - Clears INVISIBLE flag
   - Moves item to room
   - If in player's room: announces "The robber, rummaging through his bag, dropped a few items..."

**Parameters**:

- `RM`: Room to drop items in

**Returns**: Boolean indicating if any items were dropped

**Key Probabilities**:

- 30% chance per worthless item

**New Implementation**:

- **Status**: ⚠️ TODO - needs implementation
- **Expected Location**: ThiefActor helper method
- **Config Mapping**: dropWorthlessProbability (0.7 in config, but legacy uses 0.3 - note discrepancy!)

**⚠️ MIGRATION NOTE**: Legacy code uses PROB 30 (0.3), but ThiefConfig uses dropWorthlessProbability: 0.7. This is inverted - legacy is "keep probability" (70%), new config is "drop probability" (70%). The semantic meaning changed but numeric value stayed the same. QA should verify intended behavior.

---

### RECOVER-STILETTO

**Location**: `docs/original-src-1980/1actions.zil` lines 3949-3952

**Purpose**: Pick up stiletto if it's lying on the ground in thief's current room.

**Legacy Code Behavior**:

1. Checks if stiletto is in thief's current location
2. If yes:
   - Sets NDESCBIT flag on stiletto (no longer described separately)
   - Moves stiletto to thief's inventory

**Parameters**: None (operates on globals)

**Returns**: Implicit (no return value)

**Key Logic**:

```zil
<COND (<IN? ,STILETTO <LOC ,THIEF>>
       <FSET ,STILETTO ,NDESCBIT>
       <MOVE ,STILETTO ,THIEF>)>
```

**New Implementation**:

- **Status**: ⚠️ TODO in multiple places
- **Referenced in**:
  - onConscious() line 241: "TODO: Recover stiletto from ground if present"
  - onDamage() line 218: "TODO: Drop stiletto in current location"
- **Expected Implementation**: Helper method in ThiefActor
- **Dependencies**: Needs access to room contents and inventory system

---

### DEPOSIT-BOOTY

**Location**: `docs/original-src-1980/1actions.zil` lines 1897-1909

**Purpose**: Transfer all valuable items from thief's inventory to the treasure room.

**Legacy Code Behavior**:

1. Iterates through thief's inventory
2. For each item, checks:
   - Not stiletto or large bag
   - Has TVALUE > 0 (valuable)
3. If checks pass:
   - Moves item to target room (RM, typically TREASURE-ROOM)
   - Special case: if EGG, sets EGG-SOLVE flag and OPENBIT
   - Returns true if any items were deposited

**Parameters**:

- `RM`: Destination room (typically TREASURE-ROOM)

**Returns**: Boolean indicating if any treasures were deposited

**Key Logic**:

```zil
<COND (<EQUAL? .X ,STILETTO ,LARGE-BAG>)  ; Skip these
      (<G? <GETP .X ,P?TVALUE> 0>
       <MOVE .X .RM>
       <SET FLG T>
       <COND (<EQUAL? .X ,EGG>
              <SETG EGG-SOLVE T>
              <FSET ,EGG ,OPENBIT>)>)>
```

**New Implementation**:

- **Status**: ⚠️ Referenced but not implemented
- **Called from**: onDeath() comment (line 172-173): "The actual depositBooty operation should be called separately"
- **Expected Location**: InventoryService or GameEngineService
- **Config Mapping**: depositBootyProbability (0.8) for conditional deposits

---

### HACK-TREASURES

**Location**: `docs/original-src-1980/1actions.zil` lines 1888-1895

**Purpose**: Make all invisible items in treasure room visible when thief dies there.

**Legacy Code Behavior**:

1. Calls RECOVER-STILETTO to pick up stiletto
2. Makes thief invisible
3. Iterates through all objects in treasure room
4. Clears INVISIBLE flag on each object

**Parameters**: None (operates on TREASURE-ROOM global)

**Returns**: Implicit (no return value)

**Key Logic**:

```zil
<RECOVER-STILETTO>
<FSET ,THIEF ,INVISIBLE>
<SET X <FIRST? ,TREASURE-ROOM>>
<REPEAT ()
  <COND (<NOT .X> <RETURN>)
        (T <FCLEAR .X ,INVISIBLE>)>
  <SET X <NEXT? .X>>>
```

**New Implementation**:

- **Status**: ⚠️ TODO
- **Expected Location**: Called from ROBBER-FUNCTION F-DEAD handler
- **New Location**: GameEngineService or death handler in combat system
- **Notes**: Breaks thief's magic when he dies in his treasure room

---

### ROB-MAZE

**Location**: `docs/original-src-1980/1actions.zil` lines 1917-1927

**Purpose**: Special variant of stealing for maze rooms, handles maze-specific item theft.

**Legacy Code Behavior**:

1. Iterates through all objects in maze room
2. For each object, checks:
   - Has TAKEBIT (can be picked up)
   - Not sacred
   - Not invisible
   - Passes 40% probability check
3. If checks pass:
   - Moves item to thief
   - Sets TOUCHBIT and INVISIBLE flags

**Parameters**:

- `RM`: Maze room to steal from

**Returns**: Boolean indicating if any items were stolen

**Key Probabilities**:

- 40% chance per item

**Key Logic**:

```zil
<COND (<AND <FSET? .X ,TAKEBIT>
            <NOT <FSET? .X ,SACREDBIT>>
            <NOT <FSET? .X ,INVISIBLE>>
            <PROB 40>>
       <MOVE .X ,THIEF>
       <FSET .X ,TOUCHBIT>
       <FSET .X ,INVISIBLE>
       <SET FLG T>)>
```

**New Implementation**:

- **Status**: ⚠️ TODO
- **Expected Location**: ThiefActor helper method or InventoryService
- **Notes**: Called from I-THIEF when both room and HERE have MAZEBIT flag

---

### STOLE-LIGHT?

**Location**: `docs/original-src-1980/1actions.zil` lines 1875-1880

**Purpose**: Check if thief stole player's light source and announce if player is now in darkness.

**Legacy Code Behavior**:

1. Saves current LIT state (OLD-LIT)
2. Recalculates LIT state for current room
3. If was lit before but not now: announces "The thief seems to have left you in the dark."

**Parameters**: None (operates on global state)

**Returns**: True (always)

**Key Logic**:

```zil
<SET OLD-LIT ,LIT>
<SETG LIT <LIT? ,HERE>>
<COND (<AND <NOT ,LIT> .OLD-LIT>
       <TELL "The thief seems to have left you in the dark." CR>)>
```

**New Implementation**:

- **Status**: ⚠️ Implemented in separate spec
- **File**: `src/app/core/services/light-stolen.spec.ts`
- **Test Coverage**: ✅ Full test harness for light theft detection
- **Expected Integration**: Called after ROB operations in THIEF-VS-ADVENTURER

---

### TREASURE-ROOM-FCN

**Location**: `docs/original-src-1980/1actions.zil` lines 2138-2149

**Purpose**: Handler for player entering the treasure room. Ensures thief defends his hoard.

**Legacy Code Behavior**:

1. If I-THIEF is enabled and player is not dead:
   - If thief not in room: teleports thief to treasure room with announcement
   - Sets thief to FIGHTBIT (attack mode)
   - Makes thief visible
   - Calls THIEF-IN-TREASURE

**Parameters**:

- `RARG`: Room argument (checks for M-ENTER)

**Returns**: Implicit (no return value)

**Messages**:

- "You hear a scream of anguish as you violate the robber's hideaway. Using passages unknown to you, he rushes to its defense."

**New Implementation**:

- **Status**: ⚠️ TODO
- **Expected Location**: Room action handler or GameEngineService
- **Notes**: Provides special protection for thief's treasure room

---

### THIEF-IN-TREASURE

**Location**: `docs/original-src-1980/1actions.zil` lines 2151-2160

**Purpose**: Handle thief's magic when player enters treasure room with multiple items present.

**Legacy Code Behavior**:

1. Checks if treasure room has 2+ objects
2. If yes: announces "The thief gestures mysteriously, and the treasures in the room suddenly vanish."
3. Items become invisible via thief's magic

**Parameters**: None (operates on HERE)

**Returns**: Implicit (no return value)

**Messages**:

- "The thief gestures mysteriously, and the treasures in the room suddenly vanish."

**New Implementation**:

- **Status**: ⚠️ TODO
- **Expected Location**: Called from TREASURE-ROOM-FCN
- **Notes**: Demonstrates thief's magical protection of his hoard

---

### LARGE-BAG-F

**Location**: `docs/original-src-1980/1actions.zil` lines 2094-2112

**Purpose**: Handler for player interactions with thief's large bag.

**Legacy Code Behavior**:

#### Verb Handling

- **TAKE**:
  - If thief unconscious: "Sadly for you, the robber collapsed on top of the bag. Trying to take it would wake him."
  - If thief conscious: "The bag will be taken over his dead body."
- **PUT**: "It would be a good trick."
- **OPEN/CLOSE**: "Getting close enough would be a good trick."
- **EXAMINE/LOOK-INSIDE**: "The bag is underneath the thief, so one can't say what, if anything, is inside."

**Parameters**: None (verb-based)

**Returns**: Implicit (no return value)

**New Implementation**:

- **Status**: ⚠️ TODO
- **Expected Location**: Object action handler in GameEngineService
- **Notes**: Bag is always protected by thief's presence

---

### CHALICE-FCN

**Location**: `docs/original-src-1980/1actions.zil` lines 2123-2136

**Purpose**: Handler for chalice in treasure room, prevents theft when thief is present.

**Legacy Code Behavior**:

#### Verb Handling

- **TAKE**: If in treasure room with conscious thief: "You'd be stabbed in the back first."
- **PUT**: "You can't. It's not a very good chalice, is it?"
- **Other verbs**: Delegates to DUMB-CONTAINER

**Parameters**: None (verb-based)

**Returns**: Implicit (no return value)

**New Implementation**:

- **Status**: ⚠️ TODO
- **Expected Location**: Object action handler in GameEngineService
- **Notes**: Chalice is specifically protected in treasure room

---

## Legacy to New Code Mapping

### Core Actor Implementation

| Legacy Component    | New TypeScript Location                               | Status                    |
| ------------------- | ----------------------------------------------------- | ------------------------- |
| OBJECT THIEF        | `src/app/core/models/thief-actor.ts` class ThiefActor | ✅ Implemented            |
| THIEF location      | ThiefActor.locationId                                 | ✅ Implemented            |
| THIEF inventory     | ThiefActor.inventory                                  | ✅ Implemented            |
| P?STRENGTH property | ThiefActor.flags.get('strength')                      | ✅ Implemented            |
| FIGHTBIT flag       | ThiefActor.flags.get('fighting')                      | ✅ Implemented            |
| INVISIBLE flag      | ThiefActor.visible property                           | ✅ Implemented (inverted) |

### State Management

| Legacy State           | New TypeScript Equivalent | Status                          |
| ---------------------- | ------------------------- | ------------------------------- |
| F-CONSCIOUS mode       | ThiefMode.CONSCIOUS       | ✅ Implemented                  |
| F-UNCONSCIOUS mode     | ThiefMode.UNCONSCIOUS     | ✅ Implemented                  |
| F-DEAD mode            | ThiefMode.DEAD            | ✅ Implemented                  |
| F-BUSY mode            | ThiefMode.BUSY            | ✅ Implemented (reserved)       |
| THIEF-HERE global      | Actor visibility state    | ✅ Tracked via visible property |
| THIEF-ENGROSSED global | ThiefActor.engrossed      | ✅ Implemented                  |

### Behavior Routines

| Legacy Routine          | New Method/Service       | Implementation Status  |
| ----------------------- | ------------------------ | ---------------------- |
| I-THIEF                 | ThiefActor.onTick()      | ⚠️ Stub only           |
| THIEF-VS-ADVENTURER     | ThiefActor.onEncounter() | ⚠️ Stub only           |
| ROBBER-FUNCTION (verbs) | ThiefActor.acceptGift()  | ✅ Partial (gift only) |
| ROBBER-FUNCTION (modes) | ThiefActor mode methods  | ✅ Implemented         |
| ROB                     | InventoryService (TBD)   | ⚠️ Not implemented     |
| STEAL-JUNK              | ThiefActor helper (TBD)  | ⚠️ Not implemented     |
| DROP-JUNK               | ThiefActor helper (TBD)  | ⚠️ Not implemented     |
| RECOVER-STILETTO        | ThiefActor helper (TBD)  | ⚠️ Not implemented     |
| DEPOSIT-BOOTY           | InventoryService (TBD)   | ⚠️ Not implemented     |
| HACK-TREASURES          | GameEngineService (TBD)  | ⚠️ Not implemented     |
| ROB-MAZE                | ThiefActor helper (TBD)  | ⚠️ Not implemented     |
| STOLE-LIGHT?            | Light service (TBD)      | ✅ Test spec exists    |
| TREASURE-ROOM-FCN       | Room action handler      | ⚠️ Not implemented     |
| THIEF-IN-TREASURE       | Room action handler      | ⚠️ Not implemented     |
| LARGE-BAG-F             | Object action handler    | ⚠️ Not implemented     |
| CHALICE-FCN             | Object action handler    | ⚠️ Not implemented     |

### Configuration System

| Legacy Mechanism       | New TypeScript Equivalent               | Status               |
| ---------------------- | --------------------------------------- | -------------------- |
| PROB calls (hardcoded) | ThiefConfigService.getThiefParameters() | ✅ Implemented       |
| PROB 30 (appear)       | appearProbability: 0.3                  | ✅ Configured        |
| PROB 50 (steal)        | stealProbability: 0.5                   | ✅ Configured        |
| PROB 70 (various)      | tickMovementProbability: 0.7            | ✅ Configured        |
| PROB 40 (flee)         | fleeWhenWeakProbability: 0.4            | ✅ Configured        |
| PROB 10 (frighten)     | combatSpecialProbability (TBD)          | ⚠️ Not yet in config |
| PROB 20 (attack)       | combatInitiateProbability (TBD)         | ⚠️ Not yet in config |

### Message System

| Legacy Messages    | New TypeScript Location                     | Status                   |
| ------------------ | ------------------------------------------- | ------------------------ |
| Combat messages    | `src/app/data/messages/thief-messages.json` | ✅ Implemented           |
| ROBBER-C-DESC      | ThiefCombatMessageType constants            | ✅ Implemented           |
| ROBBER-U-DESC      | ThiefCombatMessageType constants            | ✅ Implemented           |
| Encounter messages | MessageService                              | ✅ Infrastructure exists |
| Gift messages      | MessageService                              | ⚠️ TODO in acceptGift    |

---

## State Management Mapping

### Thief State Transitions

| From State  | Event                      | To State    | Legacy Location                | New Location    |
| ----------- | -------------------------- | ----------- | ------------------------------ | --------------- |
| CONSCIOUS   | Take damage (strength → 0) | DEAD        | ROBBER-FUNCTION F-DEAD         | onDeath()       |
| CONSCIOUS   | Take damage (strength < 0) | UNCONSCIOUS | ROBBER-FUNCTION F-UNCONSCIOUS  | onDamage()      |
| UNCONSCIOUS | Receive gift               | CONSCIOUS   | ROBBER-FUNCTION (gift handler) | onConscious()   |
| UNCONSCIOUS | Time passes                | CONSCIOUS   | ROBBER-FUNCTION F-CONSCIOUS    | onConscious()   |
| DEAD        | -                          | -           | Permanent state                | Permanent state |

### Thief Flags and Properties

| Property         | Legacy Implementation                | New Implementation       | Notes                               |
| ---------------- | ------------------------------------ | ------------------------ | ----------------------------------- |
| Strength         | P?STRENGTH property                  | flags.get('strength')    | Number, 0 = dead, < 0 = unconscious |
| Fighting         | FIGHTBIT flag                        | flags.get('fighting')    | Boolean                             |
| Visible          | INVISIBLE flag (inverted)            | visible property         | Boolean, inverted logic             |
| Engrossed        | THIEF-ENGROSSED global               | engrossed field          | Boolean                             |
| Has stiletto     | <IN? ,STILETTO ,THIEF>               | hasStilettoInInventory() | Boolean method                      |
| In treasure room | <EQUAL? <LOC ,THIEF> ,TREASURE-ROOM> | isInTreasureRoom()       | Boolean method                      |

---

## Probability System Mapping

The legacy system used `PROB` macro with percentages. The new system uses decimal probabilities (0.0-1.0) via `ThiefConfigService`.

### Legacy PROB Calls → New Config Properties

| Legacy Code                  | Probability % | New Config Property          | Default Value |
| ---------------------------- | ------------- | ---------------------------- | ------------- |
| `<PROB 30>` (appear)         | 30%           | appearProbability            | 0.3           |
| `<PROB 50>` (steal)          | 50%           | stealProbability             | 0.5           |
| `<PROB 75>` (steal items)    | 75%           | Used in ROB calls            | 0.75          |
| `<PROB 70>` (move/drop)      | 70%           | tickMovementProbability      | 0.7           |
| `<PROB 40>` (flee/rob maze)  | 40%           | fleeWhenWeakProbability      | 0.4           |
| `<PROB 30 T>` (drop junk)    | 30%           | dropWorthlessProbability     | 0.7 ⚠️        |
| `<PROB 10 T>` (steal junk)   | 10%           | Not yet configurable         | 0.1           |
| `<PROB 10 0>` (frighten)     | 10%           | Not yet configurable         | 0.1           |
| `<PROB 20>` (attack)         | 20%           | Not yet configurable         | 0.2           |
| `<PROB 60>` (hit)            | 60%           | combatHitProbability         | 0.6           |
| `<PROB 15>` (disarm)         | 15%           | combatDisarmProbability      | 0.15          |
| `<PROB 20>` (crit)           | 20%           | combatCriticalHitProbability | 0.2           |
| `<PROB 80>` (deposit)        | 80%           | depositBootyProbability      | 0.8           |
| `<PROB 90>` (continue fight) | 90%           | Not yet configurable         | 0.9           |

⚠️ **Note**: DROP-JUNK has inverted semantics. Legacy PROB 30 means "30% keep, 70% process". New config dropWorthlessProbability 0.7 means "70% drop". Verify implementation matches intention.

### Random Number Generation

| Legacy Mechanism   | New Mechanism               | Notes                     |
| ------------------ | --------------------------- | ------------------------- |
| PROB macro         | RandomService.nextBoolean() | Deterministic with seed   |
| Random seed        | RandomService.setSeed()     | For testing/replay        |
| No seed management | RandomService.getSeed()     | Can retrieve current seed |

---

## QA Parity Testing Checklist

This checklist ensures the new TypeScript implementation maintains behavioral parity with the legacy ZIL code.

### Setup and Configuration

- [ ] **Config Loading**: Verify `thief-config.json` loads correctly
- [ ] **Difficulty Modes**: Test easy/normal/hard mode switching
- [ ] **Default Values**: Confirm all probabilities match legacy PROB values
- [ ] **Dev Mode**: Test runtime config reload in development mode

### Actor Initialization

- [ ] **Initial State**: Thief starts in CONSCIOUS mode
- [ ] **Starting Location**: Thief spawns in correct room (round-room)
- [ ] **Starting Inventory**: Thief has stiletto and large bag
- [ ] **Strength**: Initial strength matches config (default 5)
- [ ] **Tick Enabled**: Thief ticking is enabled at start

### State Transitions

- [ ] **Damage → Unconscious**: Taking damage with strength > 0 → UNCONSCIOUS
- [ ] **Damage → Death**: Taking damage with strength = 0 → DEAD
- [ ] **Revival**: Giving gift to unconscious thief → CONSCIOUS
- [ ] **Permanent Death**: DEAD state cannot be exited
- [ ] **Tick Disable**: UNCONSCIOUS and DEAD states disable ticking
- [ ] **Tick Enable**: Revival re-enables ticking

### Gift Acceptance

- [ ] **Worthless Gift**: Thief accepts, does not become engrossed
- [ ] **Valuable Gift**: Thief accepts, becomes engrossed
- [ ] **Engrossed State**: Thief remains engrossed for configured duration
- [ ] **Revival via Gift**: Unconscious thief revives when given any gift
- [ ] **Stiletto Return**: Thief properly handles receiving his own stiletto back

### Encounter Behavior (THIEF-VS-ADVENTURER)

- [ ] **Appear Probability**: Thief appears ~30% of time when hidden
- [ ] **Appear Message**: Correct message displayed when thief appears
- [ ] **Flee When Losing**: Thief flees when losing combat (~40% when weak)
- [ ] **Flee Message**: Correct message displayed when thief flees
- [ ] **Steal from Room**: Thief steals valuable items from room
- [ ] **Steal from Player**: Thief steals valuable items from player
- [ ] **Steal Probability**: Stealing occurs at configured probability (~50%)
- [ ] **Leave Disgusted**: Thief leaves without stealing (~30% of time)
- [ ] **Treasure Room Protection**: Thief doesn't encounter in treasure room
- [ ] **Light Theft**: Detects when thief stole light source
- [ ] **Combat Continuation**: 90% chance to continue fighting when already fighting

### Tick Behavior (I-THIEF)

- [ ] **Treasure Room Deposit**: Thief deposits treasures when alone in treasure room
- [ ] **Silent Deposit**: No message when depositing while invisible
- [ ] **Room Movement**: Thief moves to next valid room per tick
- [ ] **Movement Probability**: Movement occurs at configured probability (~70%)
- [ ] **Skip Sacred Rooms**: Thief never moves to sacred rooms
- [ ] **Skip Water Rooms**: Thief only moves to land rooms (RLANDBIT)
- [ ] **Steal from Touched Rooms**: Thief steals from rooms player has touched
- [ ] **Drop Worthless Items**: Thief drops worthless items per tick
- [ ] **Recover Stiletto**: Thief picks up stiletto if on ground

### Stealing Mechanics (ROB)

- [ ] **Value Check**: Only steals items with TVALUE > 0
- [ ] **Visibility Check**: Only steals visible items
- [ ] **Sacred Check**: Never steals sacred items
- [ ] **Probability Check**: Respects probability parameter (75%, 100%)
- [ ] **Item Flags**: Sets TOUCHBIT and INVISIBLE on stolen items
- [ ] **Multiple Items**: Can steal multiple items in one pass
- [ ] **Empty Result**: Returns false when nothing to steal

### Worthless Item Handling

- [ ] **Steal Junk**: Steals worthless items from room (10% per item)
- [ ] **Drop Junk**: Drops worthless items (configured probability)
- [ ] **Junk Message**: Displays message when dropping in player's room
- [ ] **Never Drop Stiletto**: Stiletto never dropped by DROP-JUNK
- [ ] **Never Drop Bag**: Large bag never dropped by DROP-JUNK
- [ ] **Rope Special Case**: DOME-FLAG cleared when rope stolen

### Maze Handling (ROB-MAZE)

- [ ] **Maze Detection**: Correctly identifies maze rooms
- [ ] **Maze Probability**: Uses 40% probability for maze theft
- [ ] **Maze vs Normal**: ROB-MAZE called instead of STEAL-JUNK in mazes

### Treasure Room Mechanics

- [ ] **Defense Trigger**: Thief teleports to treasure room when player enters
- [ ] **Defense Message**: "You hear a scream of anguish..." displayed
- [ ] **Attack Mode**: Thief enters combat when defending treasure room
- [ ] **Magic Vanish**: Treasures vanish when thief is present (2+ items)
- [ ] **Magic Reveal**: Treasures reappear when thief dies in treasure room
- [ ] **Chalice Protection**: Chalice cannot be taken when thief is fighting

### Death Handling (F-DEAD)

- [ ] **Stiletto Drop**: Stiletto dropped in room on death
- [ ] **Booty Deposit**: All treasures deposited in death room
- [ ] **Tick Disable**: I-THIEF interrupt disabled on death
- [ ] **Treasure Room Death**: Invisible items revealed on death in treasure room
- [ ] **Egg Special Case**: EGG-SOLVE flag set and EGG opened if in inventory

### Combat Integration

- [ ] **Hit Probability**: Combat hits occur at configured rate (~60%)
- [ ] **Critical Hits**: Critical hits occur at configured rate (~20%)
- [ ] **Disarm Probability**: Disarm occurs at configured rate (~15%)
- [ ] **Combat Messages**: Correct messages from thief-messages.json
- [ ] **Strength Tracking**: Strength decreases correctly on hits
- [ ] **Weapon Function**: Stiletto damage properly applied

### Object Interactions

- [ ] **Large Bag - Take**: Cannot take bag while thief alive
- [ ] **Large Bag - Unconscious**: Cannot take bag when thief collapsed on it
- [ ] **Large Bag - Examine**: Correct description displayed
- [ ] **Chalice - Treasure Room**: Cannot take while thief conscious
- [ ] **Stiletto - Ground**: Thief recovers stiletto from ground
- [ ] **Stiletto - Return**: Thief accepts stiletto back with salute message

### Message Consistency

- [ ] **Appear Messages**: Match legacy text exactly
- [ ] **Steal Messages**: Match legacy text exactly
- [ ] **Flee Messages**: Match legacy text exactly
- [ ] **Gift Messages**: Match legacy text exactly
- [ ] **Combat Messages**: Match legacy text exactly
- [ ] **Death Messages**: Match legacy text exactly

### Probability Distribution Testing

- [ ] **30% Appear**: Over 1000 trials, ~300 appearances (±5%)
- [ ] **50% Steal**: Over 1000 trials, ~500 steals (±5%)
- [ ] **70% Movement**: Over 1000 trials, ~700 movements (±5%)
- [ ] **40% Flee**: Over 1000 trials, ~400 flees (±5%)
- [ ] **Deterministic Replay**: Same seed produces identical sequence

### Edge Cases

- [ ] **Zero Items**: Handles rooms with no items
- [ ] **All Sacred Items**: Handles rooms with only sacred items
- [ ] **Unconscious in Treasure Room**: Correct behavior when unconscious in lair
- [ ] **Player Already Dead**: Thief behavior when player is dead
- [ ] **Maximum Strength**: Cannot exceed maxStrength config value
- [ ] **Negative Strength Clamping**: Strength clamped at -1, not increasingly negative

### Performance and Integration

- [ ] **Tick Performance**: Each tick completes in reasonable time (<100ms)
- [ ] **Memory Leaks**: No memory leaks over extended gameplay
- [ ] **Save/Load**: Thief state persists correctly across save/load
- [ ] **Multiple Encounters**: Correct behavior over multiple player encounters
- [ ] **Concurrent Actions**: Handles player actions during thief tick correctly

### Telemetry Validation

- [ ] **Tick Events**: Logged correctly with room and mode
- [ ] **Encounter Events**: Logged with outcome
- [ ] **Gift Events**: Logged with item and value
- [ ] **Death Events**: Logged with location and strength
- [ ] **Revival Events**: Logged with new strength

---

## Known Gaps and TODOs

### High Priority (Core Functionality)

1. **I-THIEF Implementation** (onTick)
   - **File**: `src/app/core/models/thief-actor.ts` line 140
   - **Depends On**: GameEngineService, room navigation API, player location
   - **Effort**: Large (3-5 days)
   - **Blocks**: All autonomous thief behavior

2. **THIEF-VS-ADVENTURER Implementation** (onEncounter)
   - **File**: `src/app/core/models/thief-actor.ts` line 161
   - **Depends On**: GameEngineService, InventoryService, MessageService
   - **Effort**: Large (3-5 days)
   - **Blocks**: Player-thief interactions

3. **ROB Implementation**
   - **Expected File**: InventoryService or new ThiefStealingService
   - **Depends On**: InventoryService, item properties, probability system
   - **Effort**: Medium (2-3 days)
   - **Blocks**: All stealing behavior

4. **Stiletto Recovery/Drop**
   - **File**: `src/app/core/models/thief-actor.ts` lines 218, 241
   - **Depends On**: InventoryService, room contents API
   - **Effort**: Small (1 day)
   - **Blocks**: Proper combat weapon management

### Medium Priority (Important Features)

5. **STEAL-JUNK / DROP-JUNK Implementation**
   - **Expected File**: ThiefActor helper methods
   - **Depends On**: InventoryService, item value system
   - **Effort**: Medium (2 days)
   - **Blocks**: Worthless item management

6. **DEPOSIT-BOOTY Implementation**
   - **Expected File**: InventoryService or GameEngineService
   - **Depends On**: InventoryService, treasure room reference
   - **Effort**: Small (1 day)
   - **Blocks**: Treasure deposition behavior

7. **HACK-TREASURES Implementation**
   - **Expected File**: GameEngineService
   - **Depends On**: Visibility system, room contents API
   - **Effort**: Small (1 day)
   - **Blocks**: Treasure room death magic reveal

8. **ROB-MAZE Implementation**
   - **Expected File**: ThiefActor or InventoryService
   - **Depends On**: ROB implementation, maze room detection
   - **Effort**: Small (1 day)
   - **Blocks**: Maze-specific thief behavior

9. **STOLE-LIGHT? Integration**
   - **Exists**: Test spec in `light-stolen.spec.ts`
   - **Needs**: Integration with stealing logic, message display
   - **Effort**: Small (0.5 day)
   - **Blocks**: Light theft notification

### Lower Priority (Special Cases)

10. **TREASURE-ROOM-FCN Implementation**
    - **Expected File**: Room action handlers
    - **Depends On**: Room entry hooks, thief teleport API
    - **Effort**: Medium (1-2 days)
    - **Blocks**: Treasure room defense

11. **THIEF-IN-TREASURE Implementation**
    - **Expected File**: Room action handlers
    - **Depends On**: Visibility system, item flags
    - **Effort**: Small (0.5 day)
    - **Blocks**: Treasure vanishing magic

12. **LARGE-BAG-F Implementation**
    - **Expected File**: Object action handlers
    - **Depends On**: Verb system, thief state checking
    - **Effort**: Small (0.5 day)
    - **Blocks**: Bag interaction messages

13. **CHALICE-FCN Implementation**
    - **Expected File**: Object action handlers
    - **Depends On**: Verb system, room checking
    - **Effort**: Small (0.5 day)
    - **Blocks**: Chalice protection

14. **Gift Message Generation**
    - **File**: `src/app/core/models/thief-actor.ts` line 279
    - **Depends On**: MessageService integration
    - **Effort**: Small (0.5 day)
    - **Blocks**: Gift acceptance flavor text

### Configuration Gaps

15. **Missing Config Properties**
    - frightenProbability (PROB 10 for THROW KNIFE)
    - attackInitiateProbability (PROB 20 for F-FIRST?)
    - continueFightProbability (PROB 90 for ongoing combat)
    - stealJunkProbability (PROB 10 for STEAL-JUNK)
    - **Effort**: Trivial (add to thief-config.json)
    - **Blocks**: Full configurability

16. **DROP-JUNK Semantic Clarification**
    - Legacy uses PROB 30 (30% chance per item)
    - Config uses dropWorthlessProbability: 0.7
    - **Action Required**: Verify if 0.7 means "70% drop" or "70% keep"
    - **Risk**: Inverted behavior leading to too many/too few drops

### Testing Gaps

17. **Integration Test Suite**
    - Need end-to-end tests for complete thief lifecycle
    - Test full stealing → deposit → death cycle
    - **Effort**: Medium (2-3 days)
    - **Blocks**: Confidence in full system

18. **Parity Tests**
    - Automated tests comparing legacy vs new behavior
    - Statistical analysis of probability distributions
    - **Effort**: Medium (2-3 days)
    - **Blocks**: Verification of behavioral equivalence

### Documentation Gaps

19. **ADR for Thief System**
    - Document architectural decisions (why separate config service, why flags for state, etc.)
    - **Effort**: Small (0.5 day)
    - **Blocks**: Future maintainer understanding

20. **Message Mapping Documentation**
    - Map each legacy message string to new MessageService key
    - **Effort**: Small (1 day)
    - **Blocks**: Message consistency verification

---

## Appendix: Quick Reference Tables

### Key Constants

| Constant         | Legacy Value   | New Value        | Location    |
| ---------------- | -------------- | ---------------- | ----------- |
| STILETTO ID      | ,STILETTO      | 'stiletto'       | ThiefActor  |
| LARGE-BAG ID     | ,LARGE-BAG     | 'large-bag'      | ThiefActor  |
| TREASURE-ROOM ID | ,TREASURE-ROOM | 'treasure-room'  | ThiefActor  |
| Initial Strength | 5              | 5 (configurable) | ThiefConfig |
| Max Strength     | 5              | 5 (configurable) | ThiefConfig |

### File Locations

| Component               | File Path                                       | Lines          |
| ----------------------- | ----------------------------------------------- | -------------- |
| ThiefActor class        | `src/app/core/models/thief-actor.ts`            | 1-409          |
| ThiefConfigService      | `src/app/core/services/thief-config.service.ts` | 1-200+         |
| Thief config JSON       | `src/app/data/thief-config.json`                | Full file      |
| Thief messages          | `src/app/data/messages/thief-messages.json`     | Full file      |
| Light stolen spec       | `src/app/core/services/light-stolen.spec.ts`    | Full file      |
| Thief unit tests        | `src/app/core/models/thief-actor.spec.ts`       | Full file      |
| Thief integration tests | `src/app/core/integration/thief-*.spec.ts`      | Multiple files |

### Legacy ZIL Locations

| Component           | File         | Line Range |
| ------------------- | ------------ | ---------- |
| OBJECT THIEF        | 1dungeon.zil | 968-983    |
| I-THIEF             | 1actions.zil | 3890-3931  |
| THIEF-VS-ADVENTURER | 1actions.zil | 1764-1873  |
| ROBBER-FUNCTION     | 1actions.zil | 1947-2084  |
| ROB                 | 1actions.zil | 3976-3989  |
| STEAL-JUNK          | 1actions.zil | 3954-3974  |
| DROP-JUNK           | 1actions.zil | 3933-3947  |
| RECOVER-STILETTO    | 1actions.zil | 3949-3952  |
| DEPOSIT-BOOTY       | 1actions.zil | 1897-1909  |
| HACK-TREASURES      | 1actions.zil | 1888-1895  |

---

## Contributing to this Document

This migration guide is a living document. When implementing thief functionality:

1. Update the corresponding routine's "New Implementation" section with file and line references
2. Change status from ⚠️ TODO to ✅ Implemented
3. Add any deviation notes or behavioral differences
4. Update the "Known Gaps and TODOs" section
5. Check off items in the QA checklist as they are verified
6. Document any new config properties or message keys added

For questions or clarifications, refer to:

- Existing documentation in `docs/actors/THIEF-ACTOR.md`
- Thief configuration guide in `docs/THIEF-DIFFICULTY-CONFIG.md`
- Test harness documentation in `docs/THIEF-PROBABILITY-TEST-HARNESS.md`

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-03  
**Maintainer**: Development Team  
**Status**: Initial Release
