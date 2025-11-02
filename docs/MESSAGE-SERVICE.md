# MessageService

The `MessageService` provides a structured way to manage and retrieve game messages with deterministic randomness. It's designed to match the legacy LTABLE/TABLE message tables from the original Zork implementation.

## Overview

The MessageService:
- Manages message tables organized by category
- Provides deterministic random message selection via `RandomService`
- Supports template variable replacement (e.g., `{weapon}`, `{item}`)
- Enables consistent flavor text across the game

## Usage

### Basic Setup

```typescript
import { MessageService } from './core/services/message.service';
import { RandomService } from './core/services/random.service';

// Create service (or inject via Angular DI)
const randomService = new RandomService();
const messageService = new MessageService(randomService);

// Register a message table
messageService.registerTable('thief', {
  tables: {
    THIEF_MELEE_MISS: [
      'The thief stabs nonchalantly with his stiletto and misses.',
      'You dodge as the thief comes in low.',
    ],
    THIEF_EXAMINE: [
      'The thief is a slippery character with beady eyes.',
    ],
  },
});
```

### Getting Messages

```typescript
// Get a random message from a category
const message = messageService.getRandomMessage('thief', 'THIEF_MELEE_MISS');
// Returns one of the messages randomly

// Get all messages from a category
const allMessages = messageService.getAllMessages('thief', 'THIEF_MELEE_MISS');
// Returns: ['The thief stabs...', 'You dodge...']
```

### Template Replacement

Messages can include template variables that are replaced at runtime:

```typescript
messageService.registerTable('combat', {
  tables: {
    DISARM: [
      'The thief flips your {weapon} out of your hands.',
      'You parry, but your {weapon} slips from your grasp.',
    ],
  },
});

const message = messageService.getRandomMessage('combat', 'DISARM', {
  weapon: 'sword',
});
// Returns: "The thief flips your sword out of your hands."
```

### Deterministic Randomness

For testing or replay purposes, you can seed the random number generator:

```typescript
// Set seed for deterministic behavior
randomService.setSeed(42);

const message1 = messageService.getRandomMessage('thief', 'THIEF_MELEE_MISS');

// Reset to same seed produces same result
randomService.setSeed(42);
const message2 = messageService.getRandomMessage('thief', 'THIEF_MELEE_MISS');

// message1 === message2
```

## Integration with Actors

Actors can use the MessageService to provide flavor text for their actions:

```typescript
import { ThiefActor, ThiefCombatMessageType } from './models/thief-actor';
import { MessageService } from './services/message.service';

// Create thief with message service
const thief = new ThiefActor(messageService);

// Get combat messages
const missMessage = thief.getCombatMessage(ThiefCombatMessageType.MISS);
const disarmMessage = thief.getCombatMessage(
  ThiefCombatMessageType.DISARM,
  { weapon: 'sword' }
);

// Get action messages
const examineMessage = thief.getActionMessage('THIEF_EXAMINE');
const giftMessage = thief.getActionMessage('THIEF_GIFT_VALUABLE', {
  item: 'jewel',
});
```

## Message Table Structure

Message tables are organized as JSON files:

```json
{
  "description": "Description of message table",
  "tables": {
    "CATEGORY_NAME": [
      "Message variant 1",
      "Message variant 2",
      "Message with {template} variable"
    ],
    "ANOTHER_CATEGORY": [
      "Single message"
    ]
  }
}
```

### Existing Message Tables

- **thief-messages.json** - Complete thief actor messages
  - 9 THIEF_MELEE combat categories (miss, wounds, kill, etc.)
  - 17 thief action categories (examine, gifts, revival, etc.)

## API Reference

### MessageService

#### `registerTable(name: string, table: MessageTable): void`

Register a message table for use.

- `name` - Identifier for the table (e.g., 'thief')
- `table` - Message table data with categories

#### `getRandomMessage(tableName: string, category: string, replacements?: Record<string, string>): string | undefined`

Get a random message from a category.

- `tableName` - The message table name
- `category` - The message category within the table
- `replacements` - Optional template variable replacements
- Returns: Random message or undefined if not found

#### `getAllMessages(tableName: string, category: string): string[] | undefined`

Get all messages from a category.

- `tableName` - The message table name
- `category` - The message category within the table
- Returns: Array of all messages or undefined if not found

#### `hasTable(tableName: string): boolean`

Check if a message table exists.

#### `hasCategory(tableName: string, category: string): boolean`

Check if a category exists in a table.

## Legacy Mapping

The MessageService implementation maps to legacy Zork structures:

- **LTABLE** - Legacy list tables map to message categories
- **TABLE** - Legacy tables map to message tables
- **PROB** - Probability-based selection uses RandomService

### Example Legacy Mapping

Legacy code:
```zil
<GLOBAL THIEF-MELEE
<TABLE (PURE)
 <LTABLE (PURE)
  <LTABLE (PURE) "The thief stabs nonchalantly...">
  <LTABLE (PURE) "You dodge as the thief comes in low.">>>>
```

Modern equivalent:
```json
{
  "tables": {
    "THIEF_MELEE_MISS": [
      "The thief stabs nonchalantly...",
      "You dodge as the thief comes in low."
    ]
  }
}
```

## Testing

The MessageService is fully tested with:
- Unit tests for message retrieval and registration
- Integration tests for deterministic randomness
- Template replacement tests
- Error handling tests

See `message.service.spec.ts` for comprehensive test examples.

## Best Practices

1. **Register tables at initialization** - Load message tables when services are initialized
2. **Use type-safe enums** - Define message category enums like `ThiefCombatMessageType`
3. **Provide fallbacks** - Always have fallback messages if MessageService unavailable
4. **Test with seeds** - Use seeded randomness in tests for reproducible results
5. **Template sparingly** - Use templates only when truly variable content is needed

## Related Documentation

- [ACTOR-SYSTEM-USAGE.md](./ACTOR-SYSTEM-USAGE.md) - Actor system documentation
- [MESSAGE-MAPPING-GUIDE.md](./MESSAGE-MAPPING-GUIDE.md) - Message mapping guide
- Legacy reference: `docs/original-src-1980/1actions.zil`
