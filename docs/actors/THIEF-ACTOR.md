# ThiefActor Implementation

## Overview

The `ThiefActor` class implements the THIEF character from the original Zork game. This is a complex NPC that wanders through the dungeon, steals treasures, and engages in combat with the player.

## Legacy Code References

The implementation is based on the following legacy ZIL code:

- **OBJECT THIEF**: `1dungeon.zil` lines 956-983 - The thief object definition
- **ROBBER-FUNCTION**: `1actions.zil` lines 1929-2150 - The thief's action handler
- **I-THIEF**: `1actions.zil` lines 3890-4050 - The thief's interrupt/tick function
- **THIEF-VS-ADVENTURER**: `1actions.zil` lines 1764-1920 - Encounter logic
- **RECOVER-STILETTO**: `1actions.zil` lines 3940-3960 - Weapon recovery logic

## Architecture

### Class Structure

```typescript
export class ThiefActor extends BaseActor {
  // State machine modes
  private mode: ThiefMode = ThiefMode.CONSCIOUS;
  
  // Engagement state for valuable gifts
  private engrossed = false;
  
  // Key item references
  private readonly stilettoId = 'stiletto';
  private readonly largeBagId = 'large-bag';
  private readonly treasureRoomId = 'treasure-room';
}
```

### State Machine

The thief operates in one of four modes:

1. **CONSCIOUS** (default) - Active, can tick, move, steal, and fight
2. **UNCONSCIOUS** - Damaged but alive (strength < 0), ticking disabled
3. **DEAD** - Killed (strength = 0), ticking permanently disabled
4. **BUSY** - Special state for specific behaviors (reserved for future use)

### Key Behaviors

#### 1. Damage and State Transitions

The thief tracks health through a `strength` flag (default: 5):

- **onDamage(amount)**: Reduces strength, transitions to UNCONSCIOUS (< 0) or DEAD (= 0)
- **onConscious()**: Revives from unconscious state, re-enables ticking
- **onDeath()**: Transitions to DEAD, permanently disables ticking

```typescript
// Example: Combat sequence
thief.onDamage(3); // strength: 5 -> 2, still CONSCIOUS
thief.onDamage(3); // strength: 2 -> -1, now UNCONSCIOUS
thief.onConscious(); // Revived, back to CONSCIOUS
```

#### 2. Gift Acceptance

The thief can accept items from the player via GIVE/THROW verbs:

- **Worthless items** (value = 0): Accepted, stored in bag
- **Valuable items** (value > 0): Accepted, thief becomes **engrossed** (distracted admiring the gift)

```typescript
// Example: Gift handling
thief.acceptGift('rock', 0);    // Added to inventory, not engrossed
thief.acceptGift('jewel', 50);  // Added to inventory, becomes engrossed
```

The engrossed state can be used to give the player time to escape or act without interference.

#### 3. Tick Behavior (Stub - To Be Implemented)

The `onTick()` method will implement the I-THIEF interrupt logic:

1. **If in treasure room and invisible**: Deposit stolen treasures silently
2. **If in same room as player**: Call THIEF-VS-ADVENTURER encounter logic
3. **Otherwise**:
   - Steal items from the current room (STEAL-JUNK)
   - Move to next room in dungeon sequence
   - Drop worthless items (DROP-JUNK)
   - Recover stiletto if dropped

**Current Status**: Stub implementation (no-op)

#### 4. Encounter Behavior (Stub - To Be Implemented)

The `onEncounter()` method will implement THIEF-VS-ADVENTURER logic:

- 30% chance to appear/become visible when player enters room
- Can steal treasures from player or room
- May flee if losing combat
- Can disappear into shadows

**Current Status**: Stub implementation (no-op)

#### 5. Death Handling (Partial Implementation)

The `onDeath()` method handles the thief's death:

- ✓ Sets mode to DEAD
- ✓ Disables ticking
- ⚠ TODO: Drop stiletto in current location
- ⚠ TODO: Deposit all treasures (booty) in current location
- ⚠ TODO: If in treasure room, reveal all invisible items (break magic)

## Integration with Game Systems

### ActorManager Integration

The thief is registered with the `ActorManagerService`:

```typescript
const thief = new ThiefActor();
actorManager.register(thief);
```

The ActorManager handles:
- Calling `onTick()` when ticking is enabled
- Calling `onEncounter()` when player enters thief's room
- Calling `onDamage()` and `onDeath()` during combat

### Game State Access (Future Work)

Full implementation will require access to:
- `GameEngineService` - For object location and movement
- Room data - For dungeon navigation
- Player state - For stealing and combat
- Random number generation - For probabilistic behaviors

## Testing

The implementation includes comprehensive test coverage:

### Unit Tests (26 tests)
File: `src/app/core/models/thief-actor.spec.ts`

Tests cover:
- Initialization and state management
- Mode transitions (conscious/unconscious/dead)
- Damage handling
- Gift acceptance
- Stiletto tracking
- State transition cycles

### Integration Tests (23 tests)
File: `src/app/core/integration/thief-lifecycle.spec.ts`

Tests cover:
- Registration with ActorManager
- Tick enabling/disabling
- Combat and state transitions via ActorManager
- Encounter triggering
- Death handling
- Complex multi-stage scenarios

**Total Coverage**: 49 passing tests

## Usage Example

```typescript
import { ThiefActor, ThiefMode } from '@core/models';
import { ActorManagerService } from '@core/services';

// Create and register thief
const thief = new ThiefActor();
actorManager.register(thief);

// Thief starts in round-room, conscious, ticking enabled
console.log(thief.locationId);    // 'round-room'
console.log(thief.getMode());     // ThiefMode.CONSCIOUS
console.log(thief.tickEnabled);   // true

// Player gives valuable item
thief.acceptGift('emerald', 100);
console.log(thief.isEngrossed()); // true

// Combat sequence
actorManager.triggerDamage('thief', 6);
console.log(thief.getMode());     // ThiefMode.UNCONSCIOUS
console.log(thief.tickEnabled);   // false

// Revive (e.g., player gives gift to unconscious thief)
thief.flags.set('strength', 5);
thief.onConscious();
console.log(thief.getMode());     // ThiefMode.CONSCIOUS
console.log(thief.tickEnabled);   // true
```

## Future Work

### Phase 1: Core Behavior (Current - DONE ✓)
- ✓ State machine and mode management
- ✓ Damage and death handling
- ✓ Gift acceptance
- ✓ Basic integration with ActorManager

### Phase 2: Tick Implementation (TODO)
- Room cycling/movement logic
- STEAL-JUNK: Steal items from rooms
- ROB: Steal treasures from player
- DROP-JUNK: Drop worthless items
- RECOVER-STILETTO: Pick up stiletto from ground
- DEPOSIT-BOOTY: Move treasures to treasure room

### Phase 3: Encounter Implementation (TODO)
- Appearing/disappearing (visibility control)
- Combat integration (FIGHTBIT flag)
- Fleeing behavior
- Theft during encounters
- Light stealing detection

### Phase 4: Game Integration (TODO)
- Wire GIVE/THROW verbs to thief
- Add thief to initial game state
- Connect with combat system
- Message generation from legacy strings

## Design Decisions

### SOLID Principles

- **Single Responsibility**: ThiefActor handles only thief-specific behavior
- **Open/Closed**: Extends BaseActor, can be extended further without modification
- **Liskov Substitution**: Can be used anywhere an Actor is expected
- **Interface Segregation**: Uses focused Actor interface
- **Dependency Inversion**: Depends on Actor abstraction, not concrete implementations

### DRY (Don't Repeat Yourself)

- Reuses BaseActor for common actor functionality
- State transitions centralized in mode enum
- Gift acceptance logic isolated in single method

### KISS (Keep It Simple)

- Clear state machine with four well-defined modes
- Simple flag-based health tracking
- Minimal dependencies for core functionality
- Stub methods for future implementation

### Evolutionary Change (Strangler Fig)

- Implemented as standalone actor alongside existing systems
- Can be enabled/disabled via ActorManager
- No changes to existing game code
- Can be incrementally enhanced with full behavior

## Legacy Message Strings

Legacy messages should be extracted to a dedicated messages file:

```typescript
// Future: thief-messages.ts
export const THIEF_MESSAGES = {
  UNCONSCIOUS_GREETING: "The thief, being temporarily incapacitated, is unable to acknowledge your greeting with his usual graciousness.",
  
  KNIFE_FLEE: "You evidently frightened the robber, though you didn't hit him. He flees",
  
  GIFT_ENGROSSED: "The thief is taken aback by your unexpected generosity, but accepts the {item} and stops to admire its beauty.",
  
  GIFT_ACCEPTED: "The thief places the {item} in his bag and thanks you politely.",
  
  // ... more messages from ROBBER-FUNCTION
};
```

## References

- [Original Zork Source Code](https://github.com/chz160/zork-web/tree/main/docs/original-src-1980)
- [Actor System Architecture](../IMPLEMENTATION-SUMMARY.md)
- [Game Tick Service](../../src/app/core/services/game-tick.service.ts)
- [Actor Manager Service](../../src/app/core/services/actor-manager.service.ts)
