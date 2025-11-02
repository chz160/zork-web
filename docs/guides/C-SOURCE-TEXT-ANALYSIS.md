# Zork C Source Code Text Assembly Analysis

## Executive Summary

This document analyzes how the original Zork C implementation (located in `docs/original-src-c/`) stores and assembles text strings from the `dtextc.dat` file. It provides a comprehensive guide for converting the C data structures (`objects.c`, `verbs.c`, `rooms.c`) to the JSON format used in the Angular implementation (`objects.json`, `rooms.json`, etc.).

## Table of Contents

1. [Text Storage Architecture](#text-storage-architecture)
2. [Text Decryption and Access](#text-decryption-and-access)
3. [Data Structure Analysis](#data-structure-analysis)
4. [Message Assembly Mechanism](#message-assembly-mechanism)
5. [Conversion Methodology](#conversion-methodology)
6. [Practical Examples](#practical-examples)
7. [References](#references)

---

## Text Storage Architecture

### Overview

The Zork C implementation uses a compact binary format (`dtextc.dat`) to store all game text. This approach was designed for systems with limited memory (PDP-11, VAX) where efficiency was critical.

### File Format Structure

The `dtextc.dat` file contains:

1. **Header Section** (metadata)
   - Version information (vmaj, vmin, vedit)
   - Game parameters (mxscor, strbit, egmxsc)
   
2. **Data Arrays** (game state)
   - Room data (rdesc1, rdesc2, rexit, ractio, rval, rflag)
   - Exit/travel data
   - Object data (odesc1, odesc2, odesco, oactio, oflag1, oflag2, etc.)
   - Clock events
   - Villains/NPCs
   - Adventurer data
   
3. **Message Index Array** (rtext[])
   - Array of 1050 integers
   - Each integer is an offset pointer to text location
   
4. **Encrypted Text Section**
   - All text strings stored in 8-byte chunks
   - XOR-encrypted with key "IanLanceTaylorJr"
   - Position-based encryption: `byte ^= zkey[pos & 0xf] ^ (pos & 0xff)`

### Text Chunking Pattern

Text is stored in **8-byte records**. When decoded, the text appears as:

```
[1] Welcome 
[2] to Dunge
[3] on.			This versi
[4] on creat
[5] ed 11-MA
[6] R-91.
...
[914] You are 
[915] in the k
[916] itchen o
[917] f the wh
[918] ite hous
[919] e.  A ta
[920] ble seem
```

Each bracket number `[N]` represents an 8-byte chunk at position N in the text array.

---

## Text Decryption and Access

### Decryption Algorithm

From `dsub.c` lines 66-126, the text decryption works as follows:

```c
const char *zkey = "IanLanceTaylorJr";  // 16-byte key
long x = start_offset;

for each encrypted_byte:
    key_char = zkey[x & 0xf]           // Cycle through key
    position_xor = x & 0xff             // Position-based XOR
    decrypted_byte = encrypted_byte ^ key_char ^ position_xor
    x = x + 1
```

The Python script `decode.py` correctly implements this algorithm.

### Text Access Functions

The C code provides three main functions for displaying text (from `dsub.c`):

#### 1. `rspeak_(n)` - Simple Message Display

```c
void rspeak_(integer n)
{
    rspsb2nl_(n, 0, 0, 1);  // Display message n with newline
}
```

**Usage Examples:**
```c
rspeak_(1);    // Displays "Welcome to Dungeon..."
rspeak_(341);  // Displays a specific game message
```

#### 2. `rspsub_(n, s1)` - Message with One Substitution

```c
void rspsub_(integer n, integer s1)
{
    rspsb2nl_(n, s1, 0, 1);  // Display message n with substitution s1
}
```

**Usage Examples:**
```c
// Display message 432 with object description substituted
rspsub_(432, objcts_1.odesc2[advs_1.aobj[play_1.winner - 1] - 1]);

// Display "The window is #" where # gets replaced with s1
rspsub_(11, 12);  // 11 = "The window is #", 12 = "slightly ajar"
```

#### 3. `rspsb2_(n, s1, s2)` - Message with Two Substitutions

```c
void rspsb2_(integer n, integer s1, integer s2)
{
    rspsb2nl_(n, s1, s2, 1);  // Display message n with two substitutions
}
```

### Message Assembly Process

The core assembly logic in `rspsb2nl_()` (lines 60-126):

1. **Lookup message index**: `x = rmsg_1.rtext[n - 1]`
   - The `rtext[]` array contains negative offsets
   - Negative value indicates position in encrypted text section

2. **Calculate byte offset**: `x = ((- x) - 1) * 8`
   - Each message stored in 8-byte records
   - Multiply by 8 to get actual byte position

3. **Seek to position**: `fseek(dbfile, x + rmsg_1.mrloc, SEEK_SET)`
   - `mrloc` is the file offset where text section begins

4. **Read and decrypt bytes**:
   ```c
   while (1) {
       i = getc(dbfile);
       i ^= zkey[x & 0xf] ^ (x & 0xff);  // Decrypt
       x = x + 1;
       
       if (i == '\0')           // Null terminator = end of message
           break;
       else if (i == '\n')      // Newline
           putchar('\n');
       else if (i == '#' && y != 0) {  // SUBSTITUTION MARKER
           // Recursively display substitution message y
           rspsb2nl_(y, 0, 0, 0);
           y = z;  // Shift to second substitution
           z = 0;
       }
       else
           putchar(i);
   }
   ```

5. **Substitution handling**: When '#' is encountered:
   - The function recursively calls itself with the substitution message number
   - After first substitution, it shifts to the second substitution (if provided)
   - This allows dynamic text like "The window is #" → "The window is open"

---

## Data Structure Analysis

### Room Data Structures

From `vars.h` lines 48-50:

```c
EXTERN struct {
    integer rlnt,           // Number of rooms (typically 200)
    rdesc1[200],           // Long description message indices
    rdesc2[200],           // Short description message indices
    rexit[200],            // Exit data pointer
    ractio[200],           // Room action routine number
    rval[200],             // Room value (for scoring)
    rflag[200];            // Room flags (RSEEN, RLIGHT, etc.)
} rooms_;
```

**Key Arrays:**

- **`rdesc1[]`**: Message index for the full/long room description
  - Displayed on first visit or when player uses "LOOK"
  - Example: `rooms_1.rdesc1[0]` = message index for first room's long desc

- **`rdesc2[]`**: Message index for the short room description
  - Displayed on subsequent visits (unless VERBOSE mode)
  - More concise version of the location

- **`rexit[]`**: Pointer into the `travel[]` array
  - Defines which exits are available from this room
  - Format: travel table with direction + destination room

- **`ractio[]`**: Room action routine number
  - Points to special C function for room-specific behaviors
  - Zero means no special actions
  - Example: Room 1 (East of House) has action routine for window interaction

- **`rflag[]`**: Bit flags for room properties
  - `RSEEN` (32768): Room has been visited
  - `RLIGHT` (16384): Room has light
  - `RLAND` (8192): Land location
  - `RWATER` (4096): Water location
  - `RAIR` (2048): Air/flying location
  - `RSACRD` (1024): Sacred location
  - And more...

**Room Display Logic** (from `dsub.c`):

```c
// Determine which description to show
i = rooms_1.rdesc2[play_1.here - 1];  // Default: short description

// Use long description if:
// - Full description requested, OR
// - Not in SUPERBRIEF mode AND (not seen OR not in BRIEF mode)
if (full == 0 && 
    (findex_1.superf || 
     ((rooms_1.rflag[play_1.here - 1] & RSEEN) != 0 && findex_1.brieff))) {
    goto L400;  // Use short
}

i = rooms_1.rdesc1[play_1.here - 1];  // Use long description
```

### Object Data Structures

From `vars.h` lines 109-112:

```c
EXTERN struct {
    integer olnt,              // Number of objects (typically 220)
    odesc1[220],              // Primary description message index
    odesc2[220],              // Secondary/full description message index
    odesco[220],              // Description when object is opened
    oactio[220],              // Object action routine number
    oflag1[220],              // Primary flags (VISIBT, TAKEBT, etc.)
    oflag2[220],              // Secondary flags (OPENBT, etc.)
    ofval[220],               // Object value (for scoring)
    otval[220],               // Treasure value
    osize[220],               // Object size (for containers)
    ocapac[220],              // Container capacity
    oroom[220],               // Current room location
    oadv[220],                // Adventurer carrying it
    ocan[220],                // Container it's in
    oread[220];               // Readable text message index
} objcts_;
```

**Key Arrays:**

- **`odesc1[]`**: Short name/description (used in inventory, "taken", etc.)
  - Example: "brass lantern", "rusty knife", "leaflet"
  
- **`odesc2[]`**: Full description (used when examining or listing in room)
  - Example: "A brass lantern is on the trophy case."
  - More contextual than odesc1

- **`odesco[]`**: Description when container is opened
  - Only used for container objects
  - Shows contents or special message

- **`oread[]`**: Text shown when reading the object
  - Used for readable items (leaflet, books, inscriptions)
  - Example: Reading the leaflet shows game instructions

- **`oflag1[]`**: Primary object flags
  - `VISIBT` (32768): Object is visible
  - `READBT` (16384): Object can be read
  - `TAKEBT` (8192): Object can be taken
  - `DOORBT` (4096): Object is a door
  - `TRANBT` (2048): Container is transparent
  - `FOODBT` (1024): Object can be eaten
  - `CONTBT` (128): Object is a container
  - `LITEBT` (64): Object provides light
  - And more...

- **`oflag2[]`**: Secondary flags
  - `OPENBT` (1): Container is open
  - `FITEBT` (256): Object can be used in combat
  - Additional state flags

**Object Display Logic**:

Objects are displayed differently based on context:
1. **In room**: Uses `odesc2` for full contextual description
2. **In inventory**: Uses `odesc1` for short name
3. **Being manipulated**: Uses `odesc1` or `odesc2` depending on action

### Verb Data Structures

Verbs are handled differently than rooms and objects. Instead of simple data arrays, verbs are:

1. **Parsed by name** in the parser (`parse.c`)
2. **Mapped to action indices** (`vindex` structure in `vars.h`)
3. **Executed by action routines** (`vappli_()` in `verbs.c`)

From the action routing in `verbs.c` line 60+:

```c
switch (ri - mxsmp) {
    case 1:  goto L18000;   // Take action
    case 2:  goto L20000;   // Drop action
    case 3:  goto L22000;   // Open action
    case 4:  goto L23000;   // Close action
    // ... etc
}
```

Each case handles a specific verb action with its own logic.

---

## Message Assembly Mechanism

### Three-Tier Assembly Pattern

The Zork C code assembles messages using a three-tier pattern:

```
Message Index (int) → Text Offset (negative int) → 8-byte Chunks → Complete String
```

#### Example: Displaying a Room

```c
// Player enters room 2 (Kitchen)
int room_num = 2;  // Kitchen

// 1. Get long description index
int msg_index = rooms_1.rdesc1[room_num - 1];  // e.g., 914

// 2. rspeak_() looks up in rtext[] array
int text_offset = rmsg_1.rtext[msg_index - 1];  // e.g., -115

// 3. Calculate byte position in file
long byte_pos = ((-text_offset) - 1) * 8;  // (114) * 8 = 912 bytes

// 4. Read 8-byte chunks and decrypt until null terminator
// Chunks at positions 914, 915, 916, 917, 918, 919, 920...
// "You are " + "in the k" + "itchen o" + "f the wh" + "ite hous" + "e.  A ta" + "ble seem" + ...
```

#### Example: Object with Substitution

```c
// Display "The window is #" with state substitution
rspsub_(11, state_msg);

// Where message 11 = "The window is #"
// And state_msg could be:
//   12 = "slightly ajar"
//   13 = "closed"

// Results in:
// "The window is slightly ajar" or
// "The window is closed"
```

### Why 8-Byte Chunks?

The 8-byte chunking serves multiple purposes:

1. **Memory efficiency**: Each message index is a small integer
2. **File structure**: Regular record size simplifies random access
3. **Cache alignment**: 8 bytes aligns well with processor cache lines
4. **Simple arithmetic**: Offset = index * 8 (cheap bit shift)

---

## Conversion Methodology

### From C Arrays to JSON

The conversion process from C data structures to JSON involves several steps:

#### Step 1: Extract Text Strings

**Tool**: Use the existing `decode.py` script to decrypt `dtextc.dat`:

```bash
cd docs/original-src-c
python3 decode.py dtextc.dat dtextc.txt
```

This produces `dtextc.txt` with all 16,456 text chunks numbered.

#### Step 2: Understand the Index Mapping

**Key insight**: The C code uses **1-based indexing** while the arrays are **0-based**.

```c
// C code (1-based)
int msg = rooms_1.rdesc1[room_id - 1];  // room_id is 1-based

// To convert to JSON:
// rooms[0].description = message at index rdesc1[0]
// rooms[1].description = message at index rdesc1[1]
```

#### Step 3: Assemble Multi-Chunk Messages

Messages span multiple 8-byte chunks. To reassemble:

1. **Find the starting chunk**: Use the message index
2. **Concatenate chunks**: Continue until null terminator (empty chunk)
3. **Handle substitutions**: Replace '#' markers with actual text

**Pseudo-algorithm**:

```python
def assemble_message(start_chunk_num, text_chunks):
    message = ""
    i = start_chunk_num
    
    while i < len(text_chunks):
        chunk = text_chunks[i]
        if chunk.strip() == "":  # Null terminator
            break
        message += chunk
        i += 1
    
    return message.strip()
```

#### Step 4: Resolve Substitution Markers

When a message contains '#':

```python
def resolve_substitutions(message, substitution_messages):
    """
    message: "The window is #"
    substitution_messages: ["open", "slightly ajar", "closed"]
    
    In JSON, we need to:
    1. Identify this is a dynamic message
    2. Store template and possible substitutions
    3. Or: Pre-generate all variants as separate strings
    """
    # Option A: Store as template
    if '#' in message:
        return {
            "template": message,
            "substitutions": substitution_messages
        }
    
    # Option B: Generate all variants
    variants = []
    for sub in substitution_messages:
        variants.append(message.replace('#', sub))
    return variants
```

#### Step 5: Map Room Data

For each room in `rooms_1`:

```python
def convert_room(room_index, rooms_struct, text_chunks, exits_data):
    room = {
        "id": generate_id(room_index),  # e.g., "west-of-house"
        "name": extract_name(room_index),  # Short title
        "description": assemble_message(
            rooms_struct.rdesc1[room_index], 
            text_chunks
        ),
        "shortDescription": assemble_message(
            rooms_struct.rdesc2[room_index],
            text_chunks
        ),
        "exits": parse_exits(
            rooms_struct.rexit[room_index],
            exits_data
        ),
        "objectIds": [],  # Populated from oroom[] array
        "visited": False,
        "isDark": not (rooms_struct.rflag[room_index] & RLIGHT),
        "properties": {
            "flags": rooms_struct.rflag[room_index],
            "value": rooms_struct.rval[room_index],
            "action": rooms_struct.ractio[room_index]
        }
    }
    return room
```

#### Step 6: Map Object Data

For each object in `objcts_1`:

```python
def convert_object(obj_index, objcts_struct, text_chunks):
    obj = {
        "id": generate_id(obj_index),  # e.g., "brass-lantern"
        "name": assemble_message(
            objcts_struct.odesc1[obj_index],
            text_chunks
        ),
        "aliases": extract_aliases(obj_index),  # From parser vocab
        "description": assemble_message(
            objcts_struct.odesc2[obj_index],
            text_chunks
        ),
        "portable": bool(objcts_struct.oflag1[obj_index] & TAKEBT),
        "visible": bool(objcts_struct.oflag1[obj_index] & VISIBT),
        "location": map_location(objcts_struct.oroom[obj_index]),
        "properties": {
            "flags1": objcts_struct.oflag1[obj_index],
            "flags2": objcts_struct.oflag2[obj_index],
            "value": objcts_struct.ofval[obj_index],
            "size": objcts_struct.osize[obj_index],
            "capacity": objcts_struct.ocapac[obj_index],
            "action": objcts_struct.oactio[obj_index]
        }
    }
    
    # Add optional properties
    if objcts_struct.oread[obj_index] != 0:
        obj["readableText"] = assemble_message(
            objcts_struct.oread[obj_index],
            text_chunks
        )
    
    if objcts_struct.oflag1[obj_index] & CONTBT:
        obj["container"] = {
            "capacity": objcts_struct.ocapac[obj_index],
            "isOpen": bool(objcts_struct.oflag2[obj_index] & OPENBT),
            "isTransparent": bool(objcts_struct.oflag1[obj_index] & TRANBT)
        }
    
    return obj
```

#### Step 7: Map Verb Actions

Verbs are more complex because they involve:
1. **Parser vocabulary** (word → verb mapping)
2. **Action routines** (verb → behavior code)
3. **Message responses** (situation → text)

```python
def convert_verb_actions(verb_index, verbs_code, text_chunks):
    """
    Extract verb behavior by analyzing the C switch cases
    and mapping them to JSON action definitions.
    
    This requires manual analysis of each verb action routine.
    """
    verb_action = {
        "id": f"action-{verb_index}",
        "verbs": [],  # e.g., ["take", "get", "grab"]
        "requiresObject": True,  # Most verbs need an object
        "responses": {
            "success": "message_index",
            "failure": "message_index",
            "special": {
                "condition": "message_index"
            }
        },
        "effects": []  # State changes when executed
    }
    return verb_action
```

---

## Practical Examples

### Example 1: Converting "West of House" Room

**Step 1**: Identify the room in C code

The "West of House" is typically room 2 in `rindex_1.whous = 2`.

**Step 2**: Extract room data from arrays

From `dinit.c`, after reading `dtextc.dat`:
```c
rooms_1.rdesc1[1] = 834;  // Long description message index
rooms_1.rdesc2[1] = 833;  // Short description message index
rooms_1.rexit[1] = 15;    // Exit data pointer
rooms_1.rflag[1] = 16448; // Flags (RLIGHT | RLAND | RSEEN)
```

**Step 3**: Look up message text

From `dtextc.txt`:
- Message 834: Assembling chunks starting at index 834
  ```
  [834] You are 
  [835] standing
  [836]  in an o
  [837] pen fiel
  [838] d west o
  [839] f a whit
  [840] e house 
  [841] with a b
  [842] oarded f
  [843] ront doo
  [844] r.
  [845] There is
  [846]  a small
  [847]  mailbox
  [848]  here.
  ```
  
  Assembled: "You are standing in an open field west of a white house with a boarded front door.\nThere is a small mailbox here."

- Message 833: Short description (just the name typically)
  ```
  [833] West of House
  ```

**Step 4**: Parse exits

The exit data at pointer 15 in `travel[]` array contains exit directions and destination rooms. This requires cross-referencing the `exits_1.travel[]` array.

Example exit data might decode to:
```json
{
  "north": "north-of-house",
  "south": "south-of-house",
  "west": "forest-1",
  "in": "stone-barrow"
}
```

**Step 5**: Create JSON entry

```json
{
  "id": "west-of-house",
  "name": "West of House",
  "description": "You are standing in an open field west of a white house with a boarded front door.\nThere is a small mailbox here.",
  "shortDescription": "West of House",
  "exits": {
    "north": "north-of-house",
    "south": "south-of-house",
    "west": "forest-1",
    "in": "stone-barrow"
  },
  "objectIds": ["mailbox"],
  "visited": false,
  "isDark": false,
  "properties": {
    "flags": 16448,
    "isLight": true,
    "isLand": true
  }
}
```

### Example 2: Converting the "Brass Lantern" Object

**Step 1**: Identify the object in C code

The brass lantern is a key object, typically at index 1 in `oindex_1.lamp = 1`.

**Step 2**: Extract object data

From the initialized arrays:
```c
objcts_1.odesc1[0] = 501;  // "brass lantern"
objcts_1.odesc2[0] = 502;  // "A brass lantern is here."
objcts_1.oflag1[0] = 8256; // TAKEBT | VISIBT | LITEBT
objcts_1.oflag2[0] = 1;    // ONBT (lamp is on)
objcts_1.osize[0] = 15;    // Size value
objcts_1.oroom[0] = 8;     // Starting room (Living Room)
```

**Step 3**: Look up message text

From `dtextc.txt`:
- Message 501: "brass lantern" (short name)
- Message 502: "A brass lantern is here." (room description)

**Step 4**: Decode flags

```c
TAKEBT (8192) - can be taken
VISIBT (32768) - visible
LITEBT (64) - provides light
ONBT (1) - currently on
```

**Step 5**: Create JSON entry

```json
{
  "id": "brass-lantern",
  "name": "brass lantern",
  "aliases": ["lantern", "lamp", "light"],
  "description": "A brass lantern is here.",
  "portable": true,
  "visible": true,
  "location": "living-room",
  "properties": {
    "providesLight": true,
    "isLightSource": true,
    "turnsRemaining": 330,
    "canBeTurnedOn": true,
    "isOn": true
  }
}
```

### Example 3: Converting a Substitution Message

**Step 1**: Find message with substitution

From `rooms.c` (rappl1), the window viewing code:
```c
i = 13;  // Assume closed
if ((objcts_1.oflag2[oindex_1.windo - 1] & OPENBT) != 0) {
    i = 12;  // If open, ajar
}
rspsub_(11, i);  // Display with substitution
```

**Step 2**: Look up message texts

From `dtextc.txt`:
- Message 11: "The window is #."
- Message 12: "slightly ajar"
- Message 13: "closed"

**Step 3**: In JSON, handle dynamically

Option A - Store as template:
```json
{
  "message": "window-state",
  "template": "The window is {state}.",
  "substitutions": {
    "open": "slightly ajar",
    "closed": "closed"
  }
}
```

Option B - Pre-generate variants:
```json
{
  "messages": {
    "window-open": "The window is slightly ajar.",
    "window-closed": "The window is closed."
  }
}
```

Option C - Game engine handles it:
```typescript
// In Angular service
displayWindowState(isOpen: boolean): string {
  const state = isOpen ? "slightly ajar" : "closed";
  return `The window is ${state}.`;
}
```

### Example 4: Converting Travel/Exit Data

**Step 1**: Understand the travel array format

From `dinit.c`, the travel array is read:
```c
exits_1.xlnt = rdint(indxfile);  // Number of travel entries
rdints(exits_1.xlnt, &exits_1.travel[0], indxfile);
```

Each room's `rexit[]` points to a position in the `travel[]` array.

**Step 2**: Travel array structure

The travel array stores exit information as compressed integers:
```
travel[n] = (direction << 16) | destination_room
```

Where direction constants are in `xsrch_1`:
```c
xnorth = 1024, xsouth = 5120, xeast = 3072, xwest = 7168
xup = 9216, xdown = 10240, xenter = 13312, xexit = 14336
```

**Step 3**: Decode exits for a room

```python
def decode_exits(rexit_index, travel_array):
    exits = {}
    i = rexit_index
    
    while i < len(travel_array):
        travel_val = travel_array[i]
        if travel_val == 0:  # End marker
            break
            
        direction = (travel_val >> 16) & 0xFFFF
        destination = travel_val & 0xFFFF
        
        # Map direction constant to name
        dir_name = {
            1024: "north", 5120: "south", 
            3072: "east", 7168: "west",
            9216: "up", 10240: "down",
            13312: "in", 14336: "out"
        }.get(direction, "unknown")
        
        exits[dir_name] = f"room-{destination}"
        i += 1
    
    return exits
```

**Step 4**: Create JSON exits

```json
{
  "exits": {
    "north": "north-of-house",
    "south": "south-of-house",
    "west": "forest-1",
    "east": "behind-house"
  }
}
```

---

## Conversion Process Summary

### Complete Workflow

1. **Decrypt the text file**:
   ```bash
   python3 decode.py dtextc.dat dtextc.txt
   ```

2. **Parse dtextc.dat for array data**:
   - Read all room, object, exit arrays
   - Can use a Python script with struct.unpack()

3. **Create message lookup**:
   - Build a dictionary: `{message_id: assembled_text}`
   - Handle multi-chunk messages

4. **Generate rooms.json**:
   ```python
   rooms = []
   for i in range(rooms_1.rlnt):
       room = convert_room(i, rooms_1, messages, exits_1)
       rooms.append(room)
   
   with open('rooms.json', 'w') as f:
       json.dump({"rooms": rooms}, f, indent=2)
   ```

5. **Generate objects.json**:
   ```python
   objects = []
   for i in range(objcts_1.olnt):
       obj = convert_object(i, objcts_1, messages)
       objects.append(obj)
   
   with open('objects.json', 'w') as f:
       json.dump({"objects": objects}, f, indent=2)
   ```

6. **Manual verb conversion**:
   - Verbs require analyzing C action routines
   - Extract logic from `verbs.c`, `vappli_()`
   - Map to TypeScript action handlers

7. **Validate against schemas**:
   - Use JSON schema validators
   - Ensure all required fields present
   - Check data types and constraints

### Recommended Tools

1. **Python script**: For automated data extraction
2. **Text editor**: For manual refinement
3. **JSON validator**: To check schema compliance
4. **Diff tool**: To compare with existing JSON files

### Migration Strategy

**Incremental approach**:

1. **Phase 1**: Core rooms (house, cellar, maze)
2. **Phase 2**: Common objects (lantern, sword, treasures)
3. **Phase 3**: NPCs and enemies (thief, troll)
4. **Phase 4**: Complex puzzles and endgame
5. **Phase 5**: Verb actions and responses

**Testing**:
- Compare game behavior with original C version
- Verify message text accuracy
- Test all object interactions
- Validate puzzle solutions

---

## References

### Source Files

- **dsub.c**: Text display and decryption (`rspeak_`, `rspsub_`, `rspsb2_`)
- **dinit.c**: Data initialization and file reading
- **vars.h**: Data structure definitions
- **rooms.c**: Room-specific action routines
- **objcts.c**: Object-specific action routines
- **verbs.c**: Verb action dispatching
- **decode.py**: Text decryption utility

### Key Constants

**Room Flags**:
```c
RSEEN  = 32768  // 0x8000 - Room visited
RLIGHT = 16384  // 0x4000 - Has light
RLAND  = 8192   // 0x2000 - Land location
RWATER = 4096   // 0x1000 - Water location
RAIR   = 2048   // 0x0800 - Air location
```

**Object Flags (oflag1)**:
```c
VISIBT = 32768  // 0x8000 - Visible
READBT = 16384  // 0x4000 - Readable
TAKEBT = 8192   // 0x2000 - Takeable
DOORBT = 4096   // 0x1000 - Is a door
TRANBT = 2048   // 0x0800 - Transparent
FOODBT = 1024   // 0x0400 - Edible
CONTBT = 128    // 0x0080 - Container
LITEBT = 64     // 0x0040 - Light source
```

**Object Flags (oflag2)**:
```c
OPENBT = 1      // 0x0001 - Container is open
FITEBT = 256    // 0x0100 - Weapon for fighting
```

### Data File Format

```
dtextc.dat structure:
┌────────────────────┐
│ Version (3 ints)   │  6 bytes
├────────────────────┤
│ Game params        │  6 bytes
├────────────────────┤
│ Room arrays        │  Variable
├────────────────────┤
│ Exit/travel array  │  Variable
├────────────────────┤
│ Object arrays      │  Variable
├────────────────────┤
│ NPC/event arrays   │  Variable
├────────────────────┤
│ Message indices    │  2100 bytes (1050 * 2)
├────────────────────┤
│ Encrypted text     │  ~50KB
│ (8-byte chunks)    │  (varies)
└────────────────────┘
```

### Additional Resources

- **Entity Mapping Guide** (`/docs/entity-mapping.md`): Comprehensive entity catalog
- **JSON Schemas** (`/docs/schemas/`): Validation schemas for JSON files
- **Existing JSON Files**: `/src/app/data/rooms.json`, `/src/app/data/objects.json`
- **Original Source**: `/docs/original-src-c/` (Full C implementation)

---

## Conclusion

The Zork C implementation uses a highly optimized text storage system designed for 1980s hardware constraints. Converting to JSON requires:

1. **Understanding the three-tier indexing**: Message index → Text offset → 8-byte chunks
2. **Handling encrypted text**: Using the "IanLanceTaylorJr" XOR algorithm
3. **Assembling multi-chunk messages**: Concatenating until null terminator
4. **Resolving substitutions**: Replacing '#' markers with dynamic content
5. **Mapping flags to properties**: Converting bitwise flags to readable JSON
6. **Preserving game logic**: Ensuring JSON structure supports original behavior

The key insight is that the C code doesn't store complete strings directly. Instead:
- **Rooms/objects store message indices** (small integers)
- **Indices point to text offsets** (negative values in rtext array)
- **Text is stored in 8-byte encrypted chunks**
- **Messages are assembled dynamically** at runtime with substitutions

For the JSON conversion, we extract and pre-assemble these strings into complete, human-readable text, while maintaining the semantic structure needed for gameplay.

This document provides the foundation for creating automated conversion tools or manual conversion processes to migrate the C data to the Angular/JSON format.
