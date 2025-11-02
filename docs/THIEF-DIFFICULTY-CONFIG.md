# Thief Configuration & Difficulty Modes

This document explains the configurable thief behavior system and difficulty modes in Zork Web.

## Overview

The thief actor's behavior is now configurable through a JSON configuration file (`src/app/data/thief-config.json`). This allows game designers to:

- Tune thief probabilities, drop rates, and aggressiveness
- Define multiple difficulty modes (easy, normal, hard)
- Switch difficulty modes at runtime
- Reload configuration in development mode
- Test different game balance scenarios

## Configuration File Structure

### Location

`src/app/data/thief-config.json`

### Schema

```json
{
  "description": "Configuration description",
  "devMode": false,
  "currentDifficulty": "normal",
  "difficulties": {
    "easy": { ... },
    "normal": { ... },
    "hard": { ... }
  }
}
```

### Difficulty Mode Structure

Each difficulty mode contains:

```json
{
  "name": "Normal",
  "description": "Thief behavior matches original Zork difficulty",
  "thief": {
    "strength": 5,
    "maxStrength": 5,
    "aggressiveness": 0.6,
    "appearProbability": 0.3,
    "stealProbability": 0.5,
    "fleeWhenWeakProbability": 0.4,
    "dropWorthlessProbability": 0.7,
    "engrossedDuration": 2,
    "combatHitProbability": 0.6,
    "combatCriticalHitProbability": 0.2,
    "combatDisarmProbability": 0.15,
    "tickMovementProbability": 0.7,
    "depositBootyProbability": 0.8
  }
}
```

## Thief Parameters

### Strength Parameters

- **`strength`**: Initial health/strength of the thief (1-10 range)
- **`maxStrength`**: Maximum health/strength the thief can have

### Behavior Parameters

- **`aggressiveness`**: General aggressiveness factor (0.0 to 1.0)
  - Affects overall thief behavior intensity
  - Higher values make the thief more dangerous

### Probability Parameters

All probabilities are in the range 0.0 to 1.0 (0% to 100%).

#### Encounter Probabilities

- **`appearProbability`**: Chance thief appears when player enters a room
  - Legacy: PROB 30 (0.3)
  - Easy: 0.2, Normal: 0.3, Hard: 0.5

#### Stealing Probabilities

- **`stealProbability`**: Chance thief steals an item per tick
  - Legacy: PROB 50 (0.5)
  - Easy: 0.3, Normal: 0.5, Hard: 0.7

- **`dropWorthlessProbability`**: Chance thief drops worthless items
  - Legacy: PROB 70 (0.7)
  - Easy: 0.8, Normal: 0.7, Hard: 0.5

#### Combat Probabilities

- **`combatHitProbability`**: Chance thief lands a hit in combat
  - Legacy: PROB 60 (0.6)
  - Easy: 0.4, Normal: 0.6, Hard: 0.75

- **`combatCriticalHitProbability`**: Chance of critical hit
  - Legacy: PROB 20 (0.2)
  - Easy: 0.1, Normal: 0.2, Hard: 0.3

- **`combatDisarmProbability`**: Chance thief disarms player
  - Legacy: PROB 15 (0.15)
  - Easy: 0.05, Normal: 0.15, Hard: 0.25

#### Movement Probabilities

- **`tickMovementProbability`**: Chance thief moves to new room per tick
  - Legacy: PROB 70 (0.7)
  - Easy: 0.5, Normal: 0.7, Hard: 0.9

- **`fleeWhenWeakProbability`**: Chance thief flees when weak
  - Legacy: PROB 40 (0.4)
  - Easy: 0.6, Normal: 0.4, Hard: 0.2

- **`depositBootyProbability`**: Chance thief deposits booty in treasure room
  - Legacy: PROB 80 (0.8)
  - Easy: 0.7, Normal: 0.8, Hard: 0.9

### Duration Parameters

- **`engrossedDuration`**: Number of ticks thief remains engrossed after receiving a valuable gift
  - Easy: 3, Normal: 2, Hard: 1
  - Higher duration gives player more time to act

## Difficulty Modes

### Easy Mode

- **Target Audience**: New players, casual gameplay
- **Thief Strength**: 3 (vs. 5 normal)
- **Key Differences**:
  - Less aggressive (40% vs. 60%)
  - Appears less often (20% vs. 30%)
  - Steals less frequently (30% vs. 50%)
  - Flees more when weak (60% vs. 40%)
  - Easier combat (40% hit rate vs. 60%)
  - Longer engrossed time (3 ticks vs. 2)

### Normal Mode

- **Target Audience**: Standard Zork experience
- **Thief Strength**: 5 (legacy default)
- **Key Differences**:
  - Matches original Zork behavior
  - Balanced gameplay
  - All parameters at legacy PROB values

### Hard Mode

- **Target Audience**: Experienced players, challenge seekers
- **Thief Strength**: 7 (vs. 5 normal)
- **Key Differences**:
  - More aggressive (80% vs. 60%)
  - Appears more often (50% vs. 30%)
  - Steals more frequently (70% vs. 50%)
  - Flees less when weak (20% vs. 40%)
  - Harder combat (75% hit rate vs. 60%)
  - Shorter engrossed time (1 tick vs. 2)

## Using the ThiefConfigService

### Importing the Service

```typescript
import { ThiefConfigService } from './core/services/thief-config.service';
```

### Getting Current Configuration

```typescript
constructor(private thiefConfig: ThiefConfigService) {}

ngOnInit() {
  // Get current difficulty
  const difficulty = this.thiefConfig.getCurrentDifficulty();
  console.log('Current difficulty:', difficulty); // "normal"

  // Get thief parameters for current difficulty
  const params = this.thiefConfig.getThiefParameters();
  console.log('Thief strength:', params.strength); // 5

  // Get all difficulty modes
  const modes = this.thiefConfig.getDifficultyModes();
  // [{ key: 'easy', name: 'Easy', description: '...' }, ...]
}
```

### Switching Difficulty Modes

```typescript
// Switch to easy mode
this.thiefConfig.setDifficulty('easy');

// Switch to hard mode
this.thiefConfig.setDifficulty('hard');

// Get parameters for specific difficulty without switching
const hardParams = this.thiefConfig.getThiefParametersForDifficulty('hard');
```

### Using Configuration in ThiefActor

```typescript
import { ThiefActor } from './core/models/thief-actor';
import { ThiefConfigService } from './core/services/thief-config.service';

// Create thief with config service
const thief = new ThiefActor(messageService, telemetryService, configService);

// Thief automatically uses config values for strength
const strength = thief.flags.get('strength'); // 5 (or config value)

// Get probability parameters
const stealProb = thief.getProbability('stealProbability', 0.5);
const aggressiveness = thief.getAggressiveness();
const engrossedDuration = thief.getEngrossedDuration();
```

### Dev Mode and Runtime Reload

```typescript
// Enable dev mode
this.thiefConfig.setDevMode(true);

// Check if dev mode is enabled
if (this.thiefConfig.isDevMode()) {
  // Reload configuration from source
  this.thiefConfig.reloadConfig();

  // Or apply custom configuration
  this.thiefConfig.reloadConfig({
    difficulties: {
      normal: {
        name: 'Normal',
        description: 'Test configuration',
        thief: {
          strength: 10, // Custom test value
          // ... other parameters
        }
      }
    }
  });
}
```

### Displaying Configuration Summary

```typescript
// Get human-readable summary
const summary = this.thiefConfig.getConfigSummary();
console.log(summary);
// Output:
// Difficulty: Normal
// Dev Mode: Disabled
//
// Thief Parameters:
//   Strength: 5/5
//   Aggressiveness: 60%
//   Appear Probability: 30%
//   Steal Probability: 50%
//   Combat Hit Probability: 60%
//   Movement Probability: 70%
```

## Legacy Compatibility

The system maintains backward compatibility with the original Zork implementation:

### Default Values

If `ThiefConfigService` is not provided to `ThiefActor`, it uses legacy defaults:

- Strength: 5
- Max Strength: 5
- Probabilities: Legacy PROB values (see Normal mode)

### Legacy PROB Mapping

| Legacy PROB Check | Config Parameter | Normal Value |
|-------------------|------------------|--------------|
| PROB 30 | appearProbability | 0.3 |
| PROB 50 | stealProbability | 0.5 |
| PROB 40 | fleeWhenWeakProbability | 0.4 |
| PROB 70 | dropWorthlessProbability | 0.7 |
| PROB 60 | combatHitProbability | 0.6 |
| PROB 20 | combatCriticalHitProbability | 0.2 |
| PROB 15 | combatDisarmProbability | 0.15 |
| PROB 70 | tickMovementProbability | 0.7 |
| PROB 80 | depositBootyProbability | 0.8 |

### Legacy STRENGTH Mapping

| Legacy Property | Config Parameter | Normal Value |
|----------------|------------------|--------------|
| P?STRENGTH | strength | 5 |
| (max) | maxStrength | 5 |

## Testing

### Unit Tests

```bash
# Test ThiefConfigService
npm test -- --include='**/thief-config.service.spec.ts'

# Test ThiefActor
npm test -- --include='**/thief-actor.spec.ts'
```

### Integration Tests

```bash
# Test difficulty mode behavior
npm test -- --include='**/thief-difficulty-modes.spec.ts'

# Test thief probabilities
npm test -- --include='**/thief-probability.spec.ts'
```

### Test Coverage

- **ThiefConfigService**: 36 tests covering all functionality
- **Difficulty Mode Integration**: 30 tests demonstrating behavior changes
- **ThiefActor**: 48 tests including config integration

## Design Principles

This implementation follows the Zork Web coding standards:

### SOLID Principles

- **Single Responsibility**: `ThiefConfigService` only manages configuration
- **Open/Closed**: Can extend with new difficulty modes without modifying existing code
- **Liskov Substitution**: `ThiefActor` works with or without config service
- **Interface Segregation**: Clean, focused interfaces for configuration
- **Dependency Inversion**: `ThiefActor` depends on `ThiefConfigService` abstraction

### DRY (Don't Repeat Yourself)

- Single source of truth for thief parameters
- Configuration shared across all difficulty modes
- No hardcoded values in implementation

### KISS (Keep It Simple)

- Simple JSON configuration format
- Straightforward service API
- Clear parameter names and documentation

## Future Enhancements

Potential improvements for future versions:

- [ ] UI controls for difficulty selection
- [ ] Admin commands to query/adjust config at runtime
- [ ] Save difficulty mode in game save files
- [ ] Custom difficulty mode creation via UI
- [ ] Telemetry tracking of difficulty mode usage
- [ ] Difficulty auto-adjustment based on player performance
- [ ] Per-save difficulty locks (prevent mid-game changes)

## References

- Original Zork source: `docs/original-src-1980/`
- Legacy thief routines: `ROBBER-FUNCTION`, `THIEF-VS-ADVENTURER`, `I-THIEF`
- Legacy PROB checks: See `docs/original-src-1980/*.zil` files
- Entity mapping guide: `docs/reference/entity-mapping.md`
