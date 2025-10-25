# Quick Conversion Guide: C Source to JSON

This guide provides a practical, step-by-step process for converting Zork C source data to JSON format.

## 📚 Full Documentation

For comprehensive technical details, see [C-SOURCE-TEXT-ANALYSIS.md](./C-SOURCE-TEXT-ANALYSIS.md).

## 🎯 Quick Start

### Prerequisites

1. **Text file already decoded**: `docs/original-src-c/dtextc.txt` (16,456 lines)
2. **Python 3** for any additional processing
3. **Text editor** with JSON support

### Understanding the C Data Format

The C code stores data in three main structures:

```c
// Rooms (200 total)
rooms_1.rdesc1[i]  // Long description message index
rooms_1.rdesc2[i]  // Short description message index
rooms_1.rexit[i]   // Exit data pointer
rooms_1.rflag[i]   // Room flags (light, land, water, etc.)

// Objects (220 total)
objcts_1.odesc1[i] // Short name message index
objcts_1.odesc2[i] // Full description message index
objcts_1.oflag1[i] // Primary flags (visible, takeable, etc.)
objcts_1.oroom[i]  // Current location

// Messages (1050 total)
rmsg_1.rtext[i]    // Text offset pointer (negative values)
```

## 🔧 Conversion Process

### Step 1: Read Decoded Text

The `dtextc.txt` file contains text in 8-byte chunks:

```
[1] Welcome 
[2] to Dunge
[3] on.     This versi
[4] on creat
...
[914] You are 
[915] in the k
[916] itchen o
```

**Key insight**: Messages span multiple consecutive chunks until a null terminator.

### Step 2: Assemble Messages

Messages are assembled by concatenating consecutive chunks:

```python
def assemble_message(start_index, chunks):
    """Assemble a complete message from 8-byte chunks."""
    message = ""
    i = start_index - 1  # Convert to 0-based
    
    while i < len(chunks):
        chunk = chunks[i].split('] ', 1)[-1]  # Remove [N] prefix
        if not chunk.strip():  # Empty = null terminator
            break
        message += chunk
        i += 1
    
    return message.strip()

# Example usage:
chunks = read_dtextc_txt()
msg_914 = assemble_message(914, chunks)
# Result: "You are in the kitchen of the white house. A table seems..."
```

### Step 3: Parse dtextc.dat for Indices

You need to read the binary `dtextc.dat` file to extract room/object arrays:

```python
import struct

def read_int16_be(f):
    """Read 16-bit big-endian integer."""
    return struct.unpack('>h', f.read(2))[0]

def parse_dtextc_dat(filename):
    """Extract all game data from dtextc.dat."""
    with open(filename, 'rb') as f:
        # Skip version header (3 ints)
        vmaj, vmin, vedit = [read_int16_be(f) for _ in range(3)]
        
        # Skip game params (3 ints)
        for _ in range(3):
            read_int16_be(f)
        
        # Read rooms
        room_count = read_int16_be(f)
        rdesc1 = [read_int16_be(f) for _ in range(room_count)]
        rdesc2 = [read_int16_be(f) for _ in range(room_count)]
        # ... continue reading other arrays
        
    return {
        'rooms': {'rdesc1': rdesc1, 'rdesc2': rdesc2, ...},
        'objects': {...},
        'messages': {...}
    }
```

### Step 4: Convert Rooms to JSON

```python
def convert_room_to_json(room_index, game_data, messages):
    """Convert a single room from C format to JSON."""
    rdesc1_idx = game_data['rooms']['rdesc1'][room_index]
    rdesc2_idx = game_data['rooms']['rdesc2'][room_index]
    
    return {
        "id": generate_room_id(room_index),
        "name": assemble_message(rdesc2_idx, messages),
        "description": assemble_message(rdesc1_idx, messages),
        "shortDescription": assemble_message(rdesc2_idx, messages),
        "exits": parse_exits(game_data['rooms']['rexit'][room_index]),
        "objectIds": find_objects_in_room(room_index, game_data),
        "visited": False,
        "isDark": not (game_data['rooms']['rflag'][room_index] & 0x4000)
    }
```

### Step 5: Convert Objects to JSON

```python
def convert_object_to_json(obj_index, game_data, messages):
    """Convert a single object from C format to JSON."""
    odesc1_idx = game_data['objects']['odesc1'][obj_index]
    odesc2_idx = game_data['objects']['odesc2'][obj_index]
    flags = game_data['objects']['oflag1'][obj_index]
    
    return {
        "id": generate_object_id(obj_index),
        "name": assemble_message(odesc1_idx, messages),
        "aliases": [],  # Must be added manually from vocabulary
        "description": assemble_message(odesc2_idx, messages),
        "portable": bool(flags & 0x2000),  # TAKEBT
        "visible": bool(flags & 0x8000),   # VISIBT
        "location": map_location(game_data['objects']['oroom'][obj_index])
    }
```

## 🗺️ Handling Special Cases

### Substitution Messages (Dynamic Text)

When a message contains '#', it's a substitution marker:

```python
def handle_substitution(message, sub_messages):
    """
    Replace '#' with appropriate substitution text.
    
    Example:
    message = "The window is #."
    sub_messages = ["open", "slightly ajar", "closed"]
    
    Options:
    1. Store as template in JSON
    2. Pre-generate all variants
    3. Handle dynamically in TypeScript
    """
    if '#' not in message:
        return message
    
    # Option 1: Template (recommended)
    return {
        "template": message,
        "substitutions": sub_messages
    }
```

### Room Exits/Travel Data

Exits are stored as compressed integers in a travel array:

```python
def parse_exits(exit_pointer, travel_array):
    """Parse exit data from travel array."""
    DIRECTIONS = {
        1024: "north", 5120: "south",
        3072: "east", 7168: "west",
        9216: "up", 10240: "down",
        13312: "in", 14336: "out"
    }
    
    exits = {}
    i = exit_pointer
    
    while i < len(travel_array):
        val = travel_array[i]
        if val == 0:  # End marker
            break
        
        direction = (val >> 16) & 0xFFFF
        destination = val & 0xFFFF
        
        dir_name = DIRECTIONS.get(direction, "unknown")
        exits[dir_name] = f"room-{destination}"
        i += 1
    
    return exits
```

### Flag Decoding

Flags use bitwise operations:

```python
# Room flags
RSEEN = 0x8000   # 32768 - Visited
RLIGHT = 0x4000  # 16384 - Has light
RLAND = 0x2000   # 8192 - Land location

# Object flags
VISIBT = 0x8000  # 32768 - Visible
TAKEBT = 0x2000  # 8192 - Can be taken
LITEBT = 0x0040  # 64 - Light source
CONTBT = 0x0080  # 128 - Container

def decode_flags(flag_value):
    """Convert bitwise flags to readable properties."""
    return {
        "isLight": bool(flag_value & RLIGHT),
        "isLand": bool(flag_value & RLAND),
        "hasBeenSeen": bool(flag_value & RSEEN)
    }
```

## 📝 Manual Steps Required

Some conversions require manual work:

### 1. Object Aliases

Aliases come from the parser vocabulary, not from data files:

```c
// From parse.c or vocabulary tables
"lamp" -> points to object 1 (brass lantern)
"lantern" -> points to object 1
"light" -> points to object 1
```

**Action**: Review parser code and create alias lists manually.

### 2. Verb Actions

Verbs are implemented as C functions, not data:

```c
// From verbs.c
switch (verb_action) {
    case TAKE:
        // Take logic here
        break;
    case DROP:
        // Drop logic here
        break;
}
```

**Action**: Convert verb logic to TypeScript services/handlers.

### 3. Room-Specific Behaviors

Special room actions are in `rooms.c`:

```c
L1000:  // East of House room
    if (prsvec_1.prsa != vindex_1.lookw) return;
    // Special window viewing logic
```

**Action**: Document special behaviors and implement in Angular services.

## 🚀 Complete Conversion Script Template

```python
#!/usr/bin/env python3
"""
Complete conversion script from C data to JSON.
"""

import json
import struct
from pathlib import Path

def main():
    # 1. Read decoded text chunks
    chunks = read_text_chunks('dtextc.txt')
    
    # 2. Parse binary data file
    game_data = parse_dtextc_dat('dtextc.dat')
    
    # 3. Convert rooms
    rooms = []
    for i in range(game_data['room_count']):
        room = convert_room_to_json(i, game_data, chunks)
        rooms.append(room)
    
    # 4. Convert objects
    objects = []
    for i in range(game_data['object_count']):
        obj = convert_object_to_json(i, game_data, chunks)
        objects.append(obj)
    
    # 5. Write JSON files
    with open('rooms.json', 'w') as f:
        json.dump({"rooms": rooms}, f, indent=2)
    
    with open('objects.json', 'w') as f:
        json.dump({"objects": objects}, f, indent=2)
    
    print(f"✓ Converted {len(rooms)} rooms")
    print(f"✓ Converted {len(objects)} objects")

if __name__ == '__main__':
    main()
```

## 📋 Validation Checklist

Before finalizing your conversion:

- [ ] All message indices resolve to valid text
- [ ] No missing or empty descriptions
- [ ] Exit destinations point to valid room IDs
- [ ] Object locations are valid (room IDs or "inventory")
- [ ] Flags correctly decoded (light, takeable, etc.)
- [ ] Substitution messages handled appropriately
- [ ] JSON validates against schemas in `/docs/schemas/`
- [ ] Manual review of critical rooms (West of House, Living Room, etc.)
- [ ] Manual review of key objects (lantern, sword, treasures)

## 🔍 Testing Your Conversion

1. **Load in game engine**: Import JSON into Angular app
2. **Test basic navigation**: Can you move between rooms?
3. **Test object interaction**: Can you take/drop objects?
4. **Compare with original**: Does text match the C version?
5. **Verify special cases**: Window, lamp, container interactions

## 📚 Additional Resources

- **Full Analysis**: [C-SOURCE-TEXT-ANALYSIS.md](./C-SOURCE-TEXT-ANALYSIS.md)
- **Schemas**: `/docs/schemas/room.schema.json`, `/docs/schemas/game-object.schema.json`
- **Existing JSON**: `/src/app/data/rooms.json`, `/src/app/data/objects.json`
- **C Source**: `/docs/original-src-c/`

## 💡 Tips

1. **Start small**: Convert 5-10 rooms first to test your process
2. **Automate repetitive parts**: Use scripts for data extraction
3. **Document special cases**: Note any unusual patterns or exceptions
4. **Test incrementally**: Validate each batch before continuing
5. **Keep references**: Maintain mapping between C indices and JSON IDs

## 🤝 Need Help?

- Check the full analysis document for technical details
- Review existing JSON files for examples
- Compare with entity mapping guide (`/docs/entity-mapping.md`)
- Test against walkthrough transcripts for accuracy
