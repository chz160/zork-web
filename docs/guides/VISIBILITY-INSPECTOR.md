# Visibility & Accessibility Inspector Guide

## Overview

The Visibility Inspector provides developer tools for inspecting and debugging item visibility state in Zork Web. This system addresses the legacy INVISIBLE and TOUCHBIT flags from the original Zork I source code.

## Concepts

### Visibility States

Items in Zork Web can have different visibility states:

1. **Visible** - Normal state, item appears in room descriptions
2. **Invisible** - Item is not shown (e.g., stolen by thief, moved by game mechanics)
3. **Hidden** - Explicitly hidden for puzzles/secrets (puzzle mechanic)
4. **Conditional** - Visibility depends on game conditions (e.g., requires light source)

### GameObject Visibility Properties

```typescript
interface GameObject {
  // ... other properties
  
  /** Base visibility flag (corresponds to legacy INVISIBLE flag) */
  visible: boolean;
  
  /** Explicitly hidden for puzzles/secrets (distinct from invisible) */
  hidden?: boolean;
  
  /** Conditions required for visibility */
  visibleFor?: string[];
  
  properties?: {
    /** Touched/interacted flag (legacy TOUCHBIT) */
    touched?: boolean;
    // ... other properties
  }
}
```

### Legacy Correspondence

| Zork Web Property | Legacy ZIL Flag | Purpose |
|-------------------|-----------------|---------|
| `visible: false` | `INVISIBLE` | Item not shown in descriptions (thief mechanics) |
| `hidden: true` | N/A (new) | Explicitly hidden (puzzle mechanic) |
| `properties.touched: true` | `TOUCHBIT` | Item has been interacted with |
| `visibleFor: [...]` | N/A (new) | Conditional visibility (light, puzzle state) |

## Developer Tools

### CLI Debug Commands

The `debug` command provides inspection tools for developers:

```
debug                           - Show debug command help
debug invisible                 - List all invisible/hidden items
debug touched                   - List all touched items (TOUCHBIT)
debug location <room-id>        - List all items in a location
debug item <item-id>            - Inspect a specific item
```

### Examples

#### Inspect All Invisible Items

```
> debug invisible

Invisible/Hidden Items:

rope (rope)
  Location: thief
  Status: INVISIBLE
  Flags: visible=false, hidden=false, touched=true
  Item is invisible (likely stolen by thief or moved by game mechanics)

secret-door (secret door)
  Location: library
  Status: HIDDEN
  Flags: visible=true, hidden=true, touched=false
  Item is explicitly hidden (puzzle/secret mechanic)
```

#### Inspect Touched Items (Thief Debugging)

```
> debug touched

Touched Items (TOUCHBIT):

rope (rope)
  Location: thief
  Status: INVISIBLE
  Flags: visible=false, hidden=false, touched=true
  Item is invisible (likely stolen by thief or moved by game mechanics)

lamp (brass lantern)
  Location: inventory
  Status: VISIBLE
  Flags: visible=true, hidden=false, touched=true
  Item is visible normally
```

#### Inspect Specific Item

```
> debug item rope

rope (rope)
  Location: thief
  Status: INVISIBLE
  Flags: visible=false, hidden=false, touched=true
  Item is invisible (likely stolen by thief or moved by game mechanics)
```

#### Inspect Room Contents

```
> debug location west-of-house

Items in location "west-of-house":

mailbox (small mailbox)
  Location: west-of-house
  Status: VISIBLE
  Flags: visible=true, hidden=false, touched=false
  Item is visible normally
```

## Service API

### VisibilityInspectorService

The `VisibilityInspectorService` provides programmatic access to visibility inspection:

```typescript
import { VisibilityInspectorService } from '@core/services';

// Inject the service
constructor(private visibilityInspector: VisibilityInspectorService) {}

// Inspect a single item
const info = this.visibilityInspector.inspectItem(item);
console.log(info.effectiveVisibility); // 'visible' | 'invisible' | 'hidden' | 'conditional'
console.log(info.explanation); // Human-readable explanation

// Find all invisible items
const invisibleItems = this.visibilityInspector.findInvisibleItems(gameObjects);

// Find all touched items
const touchedItems = this.visibilityInspector.findTouchedItems(gameObjects);

// Inspect a location
const locationItems = this.visibilityInspector.inspectLocation(gameObjects, 'west-of-house');

// Format for console display
const formatted = this.visibilityInspector.formatForConsole(info);
```

### VisibilityInfo Interface

```typescript
interface VisibilityInfo {
  id: string;                    // Item ID
  name: string;                  // Item name
  location: string;              // Current location
  visible: boolean;              // visible flag state
  hidden: boolean;               // hidden flag state
  touched: boolean;              // touched flag state
  visibleFor?: string[];         // Visibility conditions
  effectiveVisibility: 'visible' | 'invisible' | 'hidden' | 'conditional';
  explanation: string;           // Human-readable explanation
}
```

## Use Cases

### 1. Debugging Thief Mechanics

The thief steals items and marks them as invisible with touchbit:

```typescript
// In ROB/STEAL-JUNK routines
item.visible = false;           // Set INVISIBLE
item.properties.touched = true; // Set TOUCHBIT

// Debug with:
// > debug touched
// Shows all items stolen by thief
```

### 2. Implementing Puzzles

Hide items until puzzle conditions are met:

```typescript
// Secret door hidden until lever is pulled
const secretDoor: GameObject = {
  id: 'secret-door',
  name: 'secret door',
  visible: true,
  hidden: true,  // Explicitly hidden
  location: 'library'
};

// When lever is pulled:
secretDoor.hidden = false;  // Reveal the door
```

### 3. Conditional Visibility

Make items visible only under certain conditions:

```typescript
// Shadow only visible with light
const shadow: GameObject = {
  id: 'shadow',
  name: 'mysterious shadow',
  visible: true,
  visibleFor: ['has_lantern', 'daylight'],
  location: 'dark-room'
};

// Check conditions before showing in room description
if (item.visibleFor && !conditionsMet(item.visibleFor)) {
  // Don't show in description
}
```

### 4. Testing Item State

In tests, verify visibility state:

```typescript
it('should hide stolen items', () => {
  service.stealJunk('room1', items);
  
  const invisibleItems = visibilityInspector.findInvisibleItems(items);
  expect(invisibleItems.length).toBeGreaterThan(0);
  
  const touchedItems = visibilityInspector.findTouchedItems(items);
  expect(touchedItems.length).toBeGreaterThan(0);
});
```

## Integration with Legacy Code

### ROB and STEAL-JUNK Routines

The original Zork I ROB and STEAL-JUNK routines used FSET to mark items:

```zil
; Legacy ZIL code
<MOVE .X ,THIEF>
<FSET .X ,TOUCHBIT>
<FSET .X ,INVISIBLE>
```

In Zork Web:

```typescript
// Modern TypeScript equivalent
item.location = 'thief';
item.properties = { ...item.properties, touched: true };
item.visible = false;
```

### DEPOSIT-BOOTY Routine

The DEPOSIT-BOOTY routine clears flags when returning items:

```zil
; Legacy ZIL code
<FCLEAR .X ,INVISIBLE>
<FCLEAR .X ,TOUCHBIT>
```

In Zork Web:

```typescript
// Modern TypeScript equivalent
item.visible = true;
item.properties = { ...item.properties, touched: false };
```

## Best Practices

### 1. Distinguish Between Invisible and Hidden

- **Invisible (`visible: false`)**: For game mechanics (thief stealing, magic effects)
- **Hidden (`hidden: true`)**: For puzzle mechanics (secret doors, hidden passages)

### 2. Use Touched Flag for Debugging

The `touched` flag helps debug item movement:

```typescript
// When thief steals an item
item.properties.touched = true;

// Later, debug which items were stolen
const stolenItems = visibilityInspector.findTouchedItems(items);
```

### 3. Document Visibility Conditions

When using `visibleFor`, document the conditions:

```typescript
const item: GameObject = {
  id: 'shadow',
  name: 'shadow',
  visible: true,
  visibleFor: ['has_lantern', 'daylight'],  // Clear condition names
  location: 'dark-room'
};
```

### 4. Test Visibility State

Always test visibility changes:

```typescript
it('should hide items when stolen', () => {
  const item = items.get('rope');
  service.stealJunk('room1', items);
  
  const info = visibilityInspector.inspectItem(item);
  expect(info.effectiveVisibility).toBe('invisible');
  expect(info.touched).toBe(true);
});
```

## Troubleshooting

### Items Not Showing in Room

1. Check base visibility: `debug item <item-id>`
2. Verify location: Item must be in the room
3. Check hidden flag: `hidden: true` suppresses display
4. Check conditions: `visibleFor` array must be satisfied

### Items Still Visible After Being Stolen

1. Verify `visible` flag is set to `false`
2. Check if `hidden` flag is interfering
3. Use `debug touched` to see if touchbit was set
4. Review thief stealing logic in `InventoryService`

### Debug Commands Not Working

1. Verify `debug` verb is registered in `CommandParserService`
2. Check `VerbType` includes `'debug'`
3. Ensure `handleDebug` is called in `GameEngineService.executeCommand`

## Future Enhancements

Potential improvements to the visibility system:

1. **Player Hint Mode**: Optional UI to show hidden items (accessibility feature)
2. **Visibility History**: Track when items became invisible/visible
3. **Conditional Logic Engine**: Define complex visibility rules
4. **Visual Indicators**: UI hints for hidden items (e.g., "Something seems off here...")
5. **Save/Load Integration**: Persist visibility state across saves

## See Also

- `InventoryService` - Implements ROB/STEAL-JUNK mechanics
- `GameObject` model - Item data structure
- Legacy source: `docs/original-src-1980/1actions.zil` (ROB, STEAL-JUNK, DEPOSIT-BOOTY routines)
