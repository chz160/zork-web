# Thief Probability Test Harness

## Overview

This test harness provides comprehensive deterministic testing for thief probabilistic behaviors based on the legacy PROB mechanism from the original Zork ZIL code. It ensures that all probability-based thief actions (stealing, movement, encounters) are fully testable and reproducible.

## Test Coverage

The harness includes **27 tests** covering:

### 1. RandomService Determinism (3 tests)
- Identical sequences with same seed
- Different sequences with different seeds
- Seed retrieval for test replay

### 2. Edge Case: 0% Probability (3 tests)
- Never succeeds with 0% probability (100 iterations)
- Never moves items with 0% probability
- Consistent repeated checks

### 3. Edge Case: 100% Probability (3 tests)
- Always succeeds with 100% probability (100 iterations)
- Always moves all items with 100% probability
- Consistent repeated checks

### 4. Middle Probabilities (6 tests)
- **30% probability**: Approximates 30% success rate over 1000 trials
- **50% probability**: Approximates 50% success rate over 1000 trials
- **75% probability**: Approximates 75% success rate over 1000 trials
- Deterministic sequences for each probability level

### 5. Deterministic Tick Sequences (3 tests)
- Reproducible tick behavior with same seed
- Deterministic thief movement sequences
- Deterministic stealing sequences

### 6. Complex Probabilistic Scenarios (6 tests)
- Multiple independent probability checks in sequence
- Complex thief encounter scenarios (appear, steal, flee)
- Item stealing with visibility and touch flags
- Lit light theft detection (deterministic)

### 7. Thief State Integration (2 tests)
- Deterministic behavior across state transitions
- Combat probability outcomes

### 8. Test Harness Utilities (2 tests)
- Seed management for test replay
- Test parameterization across probabilities

## Usage Examples

### Basic Probability Testing

```typescript
it('should test thief stealing with deterministic outcome', () => {
  const randomService = TestBed.inject(RandomService);
  const inventoryService = TestBed.inject(InventoryService);
  
  // Set seed for reproducibility
  randomService.setSeed(12345);
  
  const items = new Map<string, GameObject>([
    ['treasure', { 
      id: 'treasure', 
      name: 'Ruby',
      description: 'A precious ruby',
      portable: true,
      location: 'room1',
      visible: true
    }]
  ]);
  
  // 50% chance to steal
  const result = inventoryService.moveItems(
    ['treasure'], 
    'thief', 
    items, 
    { probability: 0.5 }
  );
  
  // Result is deterministic with same seed
  // Can be replayed by resetting seed
});
```

### Testing Edge Cases

```typescript
it('should handle 0% probability correctly', () => {
  randomService.setSeed(1000);
  
  // Should never succeed
  for (let i = 0; i < 100; i++) {
    expect(randomService.nextBoolean(0.0)).toBe(false);
  }
});

it('should handle 100% probability correctly', () => {
  randomService.setSeed(1000);
  
  // Should always succeed
  for (let i = 0; i < 100; i++) {
    expect(randomService.nextBoolean(1.0)).toBe(true);
  }
});
```

### Testing Tick Sequences

```typescript
it('should produce reproducible movement pattern', () => {
  const seed = 12000;
  const rooms = ['round-room', 'maze-1', 'treasure-room'];
  
  // First simulation
  randomService.setSeed(seed);
  let currentRoom = 0;
  const path1: string[] = [];
  
  for (let tick = 0; tick < 10; tick++) {
    path1.push(rooms[currentRoom]);
    
    // 70% chance to move
    if (randomService.nextBoolean(0.7)) {
      currentRoom = (currentRoom + 1) % rooms.length;
    }
  }
  
  // Second simulation - same path
  randomService.setSeed(seed);
  currentRoom = 0;
  const path2: string[] = [];
  
  for (let tick = 0; tick < 10; tick++) {
    path2.push(rooms[currentRoom]);
    if (randomService.nextBoolean(0.7)) {
      currentRoom = (currentRoom + 1) % rooms.length;
    }
  }
  
  expect(path1).toEqual(path2);
});
```

### Testing Complex Scenarios

```typescript
it('should simulate THIEF-VS-ADVENTURER encounter', () => {
  const seed = 15000;
  
  const simulateEncounter = () => {
    const appears = randomService.nextBoolean(0.3);    // 30% appear
    const steals = appears && randomService.nextBoolean(0.5);  // 50% steal
    const flees = appears && randomService.nextBoolean(0.2);   // 20% flee
    return { appears, steals, flees };
  };
  
  // First run
  randomService.setSeed(seed);
  const encounter1 = simulateEncounter();
  
  // Second run - identical
  randomService.setSeed(seed);
  const encounter2 = simulateEncounter();
  
  expect(encounter1).toEqual(encounter2);
});
```

## Statistical Tolerance

When testing probability distributions over many trials:

- **Edge cases (0%, 100%)**: Exact match required
- **30% probability**: Allow ±5% deviation (25%-35% range)
- **50% probability**: Allow ±5% deviation (45%-55% range)
- **75% probability**: Allow ±5% deviation (70%-80% range)
- **Large sample tests (100 items)**: Allow ±10% deviation

These tolerances account for statistical variance in pseudo-random number generation while ensuring meaningful validation.

## Debugging Failed Probability Tests

If a test fails:

1. **Capture the seed**: The seed is automatically set in each test
2. **Replay the sequence**: Use `randomService.setSeed(capturedSeed)`
3. **Check the sequence**: Generate values one at a time to identify divergence point
4. **Verify probability range**: Ensure test tolerance is appropriate for sample size

Example debugging:

```typescript
it('debug failing probability test', () => {
  const seed = 12345; // Captured from failed test
  randomService.setSeed(seed);
  
  // Step through the sequence
  console.log('Call 1:', randomService.nextBoolean(0.5));
  console.log('Call 2:', randomService.nextBoolean(0.5));
  console.log('Call 3:', randomService.nextBoolean(0.5));
  // ... identify where behavior diverged
});
```

## Integration with Thief Actor

The test harness integrates with:

- **ThiefActor**: Tests gift acceptance and state transitions
- **InventoryService**: Tests probabilistic item movement (ROB routine)
- **TelemetryService**: Validates logging of probabilistic events

## Legacy ZIL Mapping

Maps to original Zork concepts:

- **PROB** checks → `RandomService.nextBoolean(probability)`
- **ROB** routine → `InventoryService.moveItems()` with probability
- **I-THIEF** tick → Deterministic tick sequences
- **THIEF-VS-ADVENTURER** → Complex encounter scenarios

## Running the Tests

```bash
# Run thief probability tests only
npm test -- --include='**/thief-probability.spec.ts' --browsers=ChromeHeadless --watch=false

# Run all thief-related tests
npm test -- --include='**/thief*.spec.ts' --browsers=ChromeHeadless --watch=false

# Alternative: Run by specifying the file path directly (if include flag is not available)
npm test src/app/core/integration/thief-probability.spec.ts --browsers=ChromeHeadless --watch=false
```

## Acceptance Criteria ✅

All acceptance criteria from the issue have been met:

- ✅ RandomService with injectable seed (already existed)
- ✅ All PROB checks use RandomService (via InventoryService)
- ✅ Test harness for deterministic tick sequences
- ✅ Tests cover 0% probability (3 tests)
- ✅ Tests cover 100% probability (3 tests)
- ✅ Tests cover middle probabilities (6 tests: 30%, 50%, 75%)
- ✅ All probabilistic thief actions are testable deterministically

## Future Enhancements

Potential additions to the test harness:

1. **Combat system integration**: Test THIEF-MELEE probability table selection
2. **Appearance/disappearance**: Test visibility probability checks
3. **Treasure deposit**: Test DEPOSIT-BOOTY probabilistic behavior
4. **Multi-actor scenarios**: Test probability interactions between multiple NPCs
5. **Save/restore testing**: Test probability state across game saves

## References

- `src/app/core/integration/thief-probability.spec.ts` - Test harness implementation
- `src/app/core/services/random.service.ts` - RandomService implementation
- `src/app/core/services/inventory.service.ts` - ROB routine implementation
- `docs/actors/THIEF-ACTOR.md` - ThiefActor documentation
- `docs/ACTOR-SYSTEM-USAGE.md` - Actor system usage guide
