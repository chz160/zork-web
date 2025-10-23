# Conversion Tool Example Output

This document shows a complete example of converting ZIL source code to the JSON format used by Zork Web.

## Input: ZIL Source

```zil
<ROOM WEST-OF-HOUSE
	(DESC "West of House")
	(LDESC "You are standing in an open field west of a white house, with a boarded front door. There is a small mailbox here.")
	(NORTH NORTH-OF-HOUSE)
	(SOUTH SOUTH-OF-HOUSE)
	(EAST BEHIND-HOUSE)>

<OBJECT MAILBOX
	(IN WEST-OF-HOUSE)
	(SYNONYM MAILBOX BOX)
	(ADJECTIVE SMALL)
	(DESC "small mailbox")
	(LDESC "A small mailbox is here.")
	(FLAGS CONTBIT OPENBIT)
	(CAPACITY 10)>

<OBJECT LAMP
	(IN LIVING-ROOM)
	(SYNONYM LAMP LANTERN LIGHT)
	(ADJECTIVE BRASS)
	(DESC "brass lantern")
	(LDESC "There is a brass lantern (battery-powered) here.")
	(FLAGS TAKEBIT LIGHTBIT)>
```

## Command

```bash
npm run convert -- --source tools/converter/test-sample.zil --output /tmp/test-output
```

## Output: rooms.json

```json
{
  "rooms": [
    {
      "id": "west-of-house",
      "name": "West Of House",
      "description": "You are standing in an open field west of a white house, with a boarded front door. There is a small mailbox here.",
      "shortDescription": "West of House",
      "exits": {
        "north": "north-of-house",
        "south": "south-of-house",
        "east": "behind-house"
      },
      "objectIds": [],
      "visited": false,
      "isDark": false
    }
  ]
}
```

## Output: objects.json

```json
{
  "objects": [
    {
      "id": "mailbox",
      "name": "small mailbox",
      "aliases": [
        "mailbox",
        "box",
        "small mailbox",
        "small box"
      ],
      "description": "A small mailbox is here.",
      "portable": false,
      "visible": true,
      "location": "west-of-house",
      "properties": {
        "isOpen": true,
        "contains": [],
        "capacity": 10
      }
    },
    {
      "id": "lamp",
      "name": "brass lantern",
      "aliases": [
        "lamp",
        "lantern",
        "light",
        "brass lamp",
        "brass lantern",
        "brass light"
      ],
      "description": "There is a brass lantern (battery-powered) here.",
      "portable": true,
      "visible": true,
      "location": "living-room",
      "properties": {
        "isLight": true,
        "isLit": false
      }
    }
  ]
}
```

## Conversion Summary

```
Zork Data Conversion Tool
=========================

Conversion Summary:
  Processed: 4 entities
  Converted: 4 entities
  Output files: 2

✓ Conversion completed successfully!

Output files:
  - /tmp/test-output/rooms.json
  - /tmp/test-output/objects.json
```

## What Changed

### Room Conversion
- `DESC` → `shortDescription` and `name`
- `LDESC` → `description` (full text)
- Direction properties → `exits` object
- ID normalized to kebab-case

### Object Conversion
- `SYNONYM` + `ADJECTIVE` → `aliases` (combined)
- `DESC` → `name`
- `LDESC` → `description`
- `IN` → `location` (normalized)
- `FLAGS` → mapped to properties:
  - `TAKEBIT` → `portable: true`
  - `CONTBIT` → container properties
  - `OPENBIT` → `isOpen: true`
  - `LIGHTBIT` → `isLight: true`
- `CAPACITY` → `properties.capacity`

## Schema Validation

All converted entities are validated against the JSON schemas in `/docs/schemas/`:
- `room.schema.json` - Room structure
- `game-object.schema.json` - Object structure

Validation ensures:
- Required fields are present
- IDs are in kebab-case format
- Types match (string, boolean, number, array)
- Direction names are valid

## Next Steps

After conversion:
1. Review the output JSON files
2. Manually adjust any descriptions with formatting issues
3. Verify room exits are correct
4. Check object locations match initial room placements
5. Integrate into the game engine with a data loader service

See [CONVERTER.md](CONVERTER.md) for complete documentation.
