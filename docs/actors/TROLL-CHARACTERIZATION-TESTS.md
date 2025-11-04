# Troll Characterization Tests

## Purpose

This document describes the characterization tests for the Troll in Zork. These tests capture the **current, existing behavior** of the Troll before any refactoring occurs. They serve as a safety net to ensure user-visible behavior doesn't change accidentally during future actor system refactors.

## Test Location

`/src/app/core/integration/troll-characterization.spec.ts`

## Running the Tests

```bash
# Run only troll characterization tests
npm test -- --include='**/troll-characterization.spec.ts' --browsers=ChromeHeadless

# Run all integration tests (includes troll tests)
npm test -- --include='**/integration/*.spec.ts' --browsers=ChromeHeadless
```

## Test Coverage Summary

### 1. Initial State and Location (3 tests)

- **Troll in troll-room with armed state**: Verifies the troll starts in `troll-room` with properties:
  - `isActor: true`
  - `actorState: "armed"`
  - `strength: 2`
  - `isFighting: true`
  - `blocksPassage: true`

- **Troll description when entering room**: Confirms the player sees "nasty-looking troll" and "bloody axe" messages when entering the troll room.

- **Axe in troll possession**: Validates the axe starts in the troll's possession (`location: "troll"`).

### 2. Passage Blocking (3 tests)

- **Blocks east passage**: When the troll is armed, attempting to go east results in: "The troll fends you off with a menacing gesture." (Note: Tests check for partial match "troll fends you off")

- **Blocks west passage**: Same blocking behavior for west direction.

- **Allows south passage**: The path south to the cellar is always open.

### 3. Combat Mechanics (3 tests)

- **Attack with weapon**: The command `kill troll with sword` is accepted and returns combat messages starting with "Attacking the troll with the..."

- **Combat messages display**: Various attack commands (`kill`, `attack`) produce appropriate combat feedback.

- **Bare-handed attack rejection**: Without a weapon, attacking produces:
  - "Attacking the troll with your bare hands..."
  - "The troll laughs at your puny gesture."

### 4. Combat Outcomes (2 tests)

- **Troll counterattacks**: During combat, the troll counterattacks with messages like:
  - "The troll swings his axe, but it misses."
  - "The troll's axe barely misses your ear."
  - "The troll swings. The blade turns on your armor but crashes broadside into your head."

- **Combat variation**: Multiple combat rounds produce varied outcomes, testing the randomness system.

### 5. Unconscious State (6 tests)

- **Becomes unconscious at strength 0**: When the troll's strength reaches 0 or below:
  - `actorState` changes to `"unconscious"`
  - `isFighting` becomes `false`
  - `blocksPassage` becomes `false`

- **Drops axe**: When unconscious, the axe moves from `location: "troll"` to `location: "troll-room"`.

- **Description change**: The troll's description updates to:
  > "An unconscious troll is sprawled on the floor. All passages out of the room are open."

- **East passage opens**: With unconscious troll, `go east` succeeds and takes player to `ew-passage`.

- **West passage opens**: With unconscious troll, `go west` succeeds and takes player to `maze-1`.

- **Cannot attack unconscious troll**: Attempting to attack returns: "The troll is unconscious."

### 6. Sword Glow Behavior (3 tests)

- **Faint glow in adjacent room**: When in the cellar (one room south of troll), the sword displays:
  > "Your sword is glowing with a faint blue glow."

- **Bright glow in same room**: When in the troll room with the troll conscious, the sword displays:
  > "Your sword has begun to glow very brightly."

- **No glow when troll unconscious**: After the troll is knocked unconscious, the sword stops glowing.

### 7. State Persistence (2 tests)

- **Damage persists**: Troll's strength reduction persists when the player leaves and returns to the room.

- **Unconscious state persists**: Once unconscious, the troll remains unconscious across room transitions.

## Current Implementation Details

### Troll Properties

Located in `/src/app/data/objects.json`:

```json
{
  "id": "troll",
  "name": "troll",
  "aliases": ["troll", "nasty troll"],
  "description": "A nasty-looking troll, brandishing a bloody axe, blocks all passages out of the room.",
  "portable": false,
  "visible": true,
  "location": "troll-room",
  "properties": {
    "isActor": true,
    "strength": 2,
    "maxStrength": 2,
    "isFighting": true,
    "actorState": "armed",
    "blocksPassage": true
  }
}
```

### Room Configuration

Located in `/src/app/data/rooms.json`, the troll-room has conditional exits:

```json
{
  "id": "troll-room",
  "conditionalExits": {
    "east": {
      "type": "actorState",
      "objectId": "troll",
      "requiredActorState": "armed",
      "invertCondition": true,
      "failureMessage": "The troll fends you off with a menacing gesture."
    },
    "west": {
      "type": "actorState",
      "objectId": "troll",
      "requiredActorState": "armed",
      "invertCondition": true,
      "failureMessage": "The troll fends you off with a menacing gesture."
    }
  }
}
```

### Combat Logic

Implemented in `GameEngineService.handleTrollCombat()`:

- **Random combat outcomes**: Uses `Math.random()` to determine:
  - Player hits (>0.7: good hit, >0.3: glancing blow, else: miss)
  - Troll counterattacks (>0.6: misses, >0.3: barely misses, else: hits)

- **Strength reduction**: Each good hit reduces troll strength by 1.

- **State transition**: At strength ≤ 0:
  - `actorState` → `"unconscious"`
  - `isFighting` → `false`
  - `blocksPassage` → `false`
  - Axe dropped to room

### Sword Glow

Implemented in `GameEngineService.updateSwordGlowState()`:

- **Bright glow**: When player and troll in same room
- **Faint glow**: When troll in adjacent room
- **No glow**: When troll not visible or unconscious

## Behavior NOT Currently Implemented

The original issue acceptance criteria mentioned:

- ❌ **Giving food to troll**: Not implemented
- ❌ **Bribing with gold**: Not implemented
- ❌ **Save/load preserves troll state**: Not tested (save/load not implemented)

These features are not part of the current codebase and therefore not covered by these characterization tests.

## Test Results

**Status**: ✅ All 22 tests passing

**Execution time**: ~0.226 seconds

**Last verified**: 2024-11-04

## Future Considerations

When refactoring the troll into the actor system:

1. **Preserve exact message text**: The tests assert on specific message strings. Any changes to wording will require test updates.

2. **Combat randomness**: The current implementation uses direct `Math.random()` calls. Consider using `RandomService` for deterministic testing.

3. **State machine**: The troll has implicit states (armed → unconscious). Consider explicit state machine modeling.

4. **Actor lifecycle**: The troll doesn't currently use the actor tick system. Future integration should preserve the synchronous combat behavior.

5. **Blocking mechanism**: The conditional exit system works well. Ensure actor refactor maintains this or provides equivalent functionality.

## Related Files

- Test file: `/src/app/core/integration/troll-characterization.spec.ts`
- Troll data: `/src/app/data/objects.json` (search: `"id": "troll"`)
- Room data: `/src/app/data/rooms.json` (search: `"id": "troll-room"`)
- Combat logic: `/src/app/core/services/game-engine.service.ts` (`handleTrollCombat()`, `updateTrollState()`)
- Sword glow: `/src/app/core/services/game-engine.service.ts` (`updateSwordGlowState()`)
- Original messages: `/artifacts/messages.json` (search: `"troll"`)

## References

- Actor system docs: `/docs/actors/THIEF-ACTOR.md`
- Actor lifecycle tests: `/src/app/core/integration/actor-lifecycle.spec.ts`
- Thief lifecycle tests: `/src/app/core/integration/thief-lifecycle.spec.ts`
