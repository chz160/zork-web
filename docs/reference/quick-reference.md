# Zork Entity Quick Reference

> Quick lookup guide for common entities when implementing Zork Web features

## Starting Area Entities

### Key Rooms
- `west-of-house` - Starting point, has mailbox
- `living-room` - Trophy case, lamp, sword, rug
- `kitchen` - Sack, bottle, stairs up
- `attic` - Rope, brick, knife

### Essential Objects
- `brass-lamp` - Primary light source (battery: 330 turns)
- `elvish-sword` - Glows near enemies, weapon
- `small-mailbox` - Container with leaflet
- `leaflet` - "WELCOME TO ZORK" introduction

### Initial Items to Collect
1. Open mailbox, take leaflet
2. Enter house (window or door)
3. Take lamp from living room
4. Take sword from living room
5. Take sack from kitchen
6. Go up to attic
7. Take rope, brick, knife

## Core Verbs (Priority 1)

### Navigation
```
go [direction] | north | south | east | west | up | down
n | s | e | w | u | d
look | l
```

### Inventory
```
take [object] | get [object]
drop [object]
inventory | i
examine [object] | x [object]
```

### Basic Interaction
```
open [object]
close [object]
read [object]
```

## Common Aliases

### Directions
- `n` → north
- `s` → south
- `e` → east
- `w` → west
- `u` → up
- `d` → down

### Verbs
- `get` → take
- `x` → examine
- `i` → inventory
- `l` → look

### Objects
- `lamp` → brass-lamp
- `sword` → elvish-sword
- `box` → mailbox

## Special Properties

### Light Sources
```typescript
properties: {
  isLight: true,
  isLit: false,
  batteryLife: 330  // turns
}
```

### Containers
```typescript
properties: {
  isOpen: false,
  contains: ['object-id'],
  acceptsPrepositions: ['in']
}
```

### Locked Objects
```typescript
properties: {
  isLocked: true,
  unlockedBy: 'key-id'
}
```

## Treasure Values

| Treasure | Points | Location |
|----------|--------|----------|
| Platinum Bar | 10 | Loud Room |
| Gold Coffin | 10 | Egyptian Room |
| Diamond | 10 | Various |
| Grail | 4 | Grail Room |
| Emerald | 5 | Multiple |
| Sapphire | 5 | Multiple |
| Painting | 6 | Gallery |
| Egg | 5 | Bird's Nest |

## Common Patterns

### Room Definition
```typescript
{
  id: 'room-name',
  name: 'Room Name',
  description: 'Full description...',
  shortDescription: 'Brief',
  exits: new Map([['north', 'other-room']]),
  objectIds: ['obj1', 'obj2'],
  visited: false
}
```

### Portable Object
```typescript
{
  id: 'object-id',
  name: 'object name',
  aliases: ['alias1', 'alias2'],
  description: 'Description...',
  portable: true,
  visible: true,
  location: 'room-id'
}
```

### Verb with Indirect Object
```typescript
{
  name: 'put',
  aliases: ['place', 'insert'],
  requiresObject: true,
  allowsIndirectObject: true  // "put X in Y"
}
```

## Edge Cases to Handle

1. **Darkness** - Some rooms require light source
   - Check for `isDark` room property
   - Verify player has lit lamp in inventory

2. **Container Visibility** - Objects in closed containers not visible
   - Check `isOpen` before showing `contains`

3. **Weight Limits** - Player can't carry everything
   - Track inventory count/weight

4. **Timed Events** - Lamp battery depletes
   - Decrement on each turn/move

5. **Multi-word Names** - "brass lamp" not just "lamp"
   - Match longest alias first

## Testing Checklist

- [ ] Can navigate between connected rooms
- [ ] Can take/drop portable objects
- [ ] Can't take immovable objects
- [ ] Inventory command shows carried items
- [ ] Examine shows object descriptions
- [ ] Open/close works on containers
- [ ] Lamp can be lit/extinguished
- [ ] Room descriptions shown on first visit
- [ ] Can't go through non-existent exits
- [ ] Aliases work correctly

## References

- Full Mapping: `/docs/entity-mapping.md`
- Schemas: `/docs/schemas/`
- Architecture: `/docs/architecture.md`
