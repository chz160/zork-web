# TrollActor Serialization & Migration Documentation

## Overview

This document describes the serialization, deserialization, and migration strategy for the TrollActor implementation in the zork-web game engine.

## Purpose

The serialization system ensures that:
1. Saved games preserve complete TrollActor state
2. Legacy save files can be loaded and migrated to the new actor format
3. Save/load operations are transparent to the player
4. Both legacy GameObject and new Actor formats are supported during transition

## Serialization Format

### New Format (TrollActor)

```typescript
interface SerializedTrollActor {
  id: string;                  // Always 'troll'
  type: 'TrollActor';           // Type identifier for deserialization
  locationId: string | null;    // Current room ID
  health: number;               // Strength/health value
  inventory: string[];          // Items in inventory (e.g., ['axe'])
  isConscious: boolean;         // Whether troll is conscious
  isFighting: boolean;          // Whether troll is in combat
  blocksPassage: boolean;       // Whether troll blocks exits
  flags: Record<string, boolean | number | string>; // Additional flags
}
```

### Legacy Format (GameObject)

```typescript
interface LegacyTrollData {
  id: string;
  location: string;
  properties?: {
    strength?: number;
    actorState?: 'armed' | 'unconscious' | ...;
    isFighting?: boolean;
    blocksPassage?: boolean;
  };
}
```

## Migration Strategy

### Detection

The system automatically detects which format is present in save data:

1. **New format**: Save data contains `actors` array with TrollActor data
2. **Legacy format**: Only GameObject representation exists (no `actors` array)

Detection is performed by `isLegacyTrollData()` which checks for the presence of a `type` field.

### Migration Process

When loading a legacy save file:

1. Detect legacy format via `isLegacyTrollData()`
2. Extract troll GameObject data
3. Convert to `SerializedTrollActor` format using `migrateLegacyTrollData()`
4. Deserialize to TrollActor instance
5. Register with ActorManager
6. Sync back to GameObject for compatibility

### Default Values

When migrating from legacy format, the following defaults are applied:

- `strength`: 2 (default troll health)
- `actorState`: 'armed' (unless explicitly 'unconscious')
- `isFighting`: true
- `blocksPassage`: true
- `inventory`: ['axe'] if armed, [] if unconscious

## Implementation

### Key Functions

#### `serializeTrollActor(troll: TrollActor): SerializedTrollActor`

Converts a TrollActor instance to a serializable plain object.

**Usage:**
```typescript
const troll = actorManager.getActor('troll') as TrollActor;
const serialized = serializeTrollActor(troll);
```

#### `deserializeTrollActor(data: SerializedTrollActor): TrollActor`

Reconstructs a TrollActor instance from serialized data.

**Usage:**
```typescript
const trollData = saveData.actors.find(a => a.id === 'troll');
const troll = deserializeTrollActor(trollData);
```

#### `migrateLegacyTrollData(legacyData: unknown): SerializedTrollActor`

Converts legacy GameObject format to new SerializedTrollActor format.

**Usage:**
```typescript
const legacyTroll = gameObjects.get('troll');
const migratedData = migrateLegacyTrollData(legacyTroll);
const troll = deserializeTrollActor(migratedData);
```

### GameEngineService Integration

The `saveGame()` method serializes:
- Player state
- Rooms
- GameObjects
- **Actors array** (when feature flag enabled)

The `loadGame()` method:
1. Restores player, rooms, and gameObjects
2. Checks for actor data in save
3. If actor data exists: deserialize and restore
4. If no actor data: check for legacy format and migrate
5. Sync actor state back to GameObject for compatibility

## Testing

### Unit Tests

Located in `troll-serializer.spec.ts`:

- **Serialization tests**: Verify correct serialization of various troll states
- **Deserialization tests**: Verify reconstruction from serialized data
- **Roundtrip tests**: Ensure serialize→deserialize preserves state
- **Migration tests**: Verify legacy format conversion
- **Integration tests**: Test with actual TrollActor behavior

### Integration Tests

Located in `troll-integration.spec.ts`:

- Save/load preserves initial troll state
- Save/load preserves damaged troll state
- Save/load preserves unconscious troll state
- Works in both legacy and actor modes

## Compatibility

### Feature Flag Control

The serialization system respects the `ACTOR_MIGRATION_TROLL` feature flag:

- **Enabled**: Uses TrollActor and serializes to actors array
- **Disabled**: Uses legacy GameObject only (no actor serialization)

Both modes can load saves from either format due to migration support.

### GameObject Synchronization

After deserializing a TrollActor, the system calls `syncTrollActorToGameObject()` to ensure:

1. GameObject representation is updated with current actor state
2. Conditional exits check the correct properties
3. Legacy code paths continue to function

## Cleanup Timeline

### When to Remove Migration Logic

The migration code should be removed after:

1. **6 months** from initial release (target: [INSERT DATE])
2. All known save files have been migrated
3. Analytics confirm no legacy saves are being loaded

### What to Remove

When cleaning up:

1. `LegacyTrollData` interface
2. `isLegacyTrollData()` function
3. `migrateLegacyTrollData()` function
4. Legacy path in `loadGame()` method
5. Migration-related tests

### What to Keep

Permanent components:

1. `SerializedTrollActor` interface
2. `serializeTrollActor()` function
3. `deserializeTrollActor()` function
4. Core serialization tests

## Issue Tracking

- **Migration implementation**: [ISSUE #XXX]
- **Cleanup tracking**: [ISSUE #YYY - TO BE CREATED]

## Notes

- The serialization format is versioned via the `type` field
- Future actor types can follow the same pattern
- Migration is one-way: legacy→new (no backwards compatibility needed)
- The system handles both save formats transparently

## Related Files

- `src/game/actors/troll/troll-serializer.ts` - Core serialization logic
- `src/game/actors/troll/troll-serializer.spec.ts` - Unit tests
- `src/game/actors/troll/troll-actor.ts` - TrollActor implementation
- `src/app/core/services/game-engine.service.ts` - Save/load integration
- `src/app/core/integration/troll-integration.spec.ts` - Integration tests

## References

- Actor interface: `src/app/core/models/actor.model.ts`
- Feature flags: `src/app/core/services/feature-flag.service.ts`
- ActorManager: `src/app/core/services/actor-manager.service.ts`
