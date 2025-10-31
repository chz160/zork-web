# Actor System Usage Guide

This guide demonstrates how to use the new Actor system for implementing NPC behavior in Zork.

## Overview

The Actor system provides a foundation for implementing NPCs like the thief from the original ZIL code. It consists of:

- **Actor Model**: Base interface and class for all NPCs
- **GameTickService**: Drives turn-based behavior
- **ActorManager**: Central registry and lifecycle manager
- **RandomService**: Deterministic random behavior for testing

## Quick Start

### 1. Create a Custom Actor

```typescript
import { BaseActor } from './models/actor.model';

export class ThiefActor extends BaseActor {
  constructor() {
    super('thief', 'Sneaky Thief', {
      locationId: 'treasure-room',
      tickEnabled: true,
      inventory: ['stiletto'],
    });
    this.flags.set('health', 100);
    this.flags.set('aggression', 'low');
  }

  override onTick(): void {
    // Called each game turn
    // Implement thief AI: movement, stealing, combat
    const locations = ['treasure-room', 'hallway', 'gallery'];
    const currentIndex = locations.indexOf(this.locationId ?? '');
    const nextIndex = (currentIndex + 1) % locations.length;
    this.locationId = locations[nextIndex];
  }

  override onEncounter(playerRoomId: string): void {
    // Called when player enters the same room
    console.log('The thief eyes you suspiciously...');
  }

  override onDamage(amount: number): void {
    // Called when actor takes damage
    const health = (this.flags.get('health') as number) || 0;
    this.flags.set('health', Math.max(0, health - amount));
    
    if (this.flags.get('health') === 0) {
      this.onDeath();
    }
  }

  override onDeath(): void {
    // Called when actor dies
    this.tickEnabled = false;
    this.locationId = null;
    console.log('The thief falls to the ground, defeated.');
  }
}
```

### 2. Register and Use Actors

```typescript
import { inject } from '@angular/core';
import { ActorManagerService } from './services/actor-manager.service';
import { GameTickService } from './services/game-tick.service';

// In your game service
export class GameService {
  private actorManager = inject(ActorManagerService);
  private tickService = inject(GameTickService);

  initializeGame(): void {
    // Create and register actors
    const thief = new ThiefActor();
    this.actorManager.register(thief);
    
    // Enable ticking for the thief
    this.actorManager.enableTicks('thief');
  }

  executePlayerCommand(command: string): void {
    // Execute the player's command
    // ...
    
    // Advance the game tick (drives NPC behavior)
    this.tickService.tick();
    
    // Check for encounters in current room
    this.actorManager.triggerEncounter(this.player.currentRoomId);
  }

  attackActor(actorId: string, damage: number): void {
    this.actorManager.triggerDamage(actorId, damage);
  }
}
```

### 3. Using RandomService for Actor Behavior

```typescript
import { inject } from '@angular/core';
import { RandomService } from './services/random.service';

export class RandomThiefActor extends BaseActor {
  private random = inject(RandomService);

  override onTick(): void {
    // 30% chance to move
    if (this.random.nextBoolean(0.3)) {
      const directions = ['north', 'south', 'east', 'west'];
      const direction = this.random.choice(directions);
      this.moveInDirection(direction);
    }

    // 50% chance to steal if player is present
    if (this.isPlayerPresent() && this.random.nextBoolean(0.5)) {
      this.attemptTheft();
    }
  }

  private moveInDirection(direction: string | undefined): void {
    // Implementation
  }

  private isPlayerPresent(): boolean {
    // Check if player is in same room
    return false;
  }

  private attemptTheft(): void {
    // Try to steal from player
  }
}
```

## API Reference

### Actor Interface

```typescript
interface Actor {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  locationId: string | null;     // Current room ID
  inventory: string[];           // Object IDs
  flags: Map<string, any>;       // State storage
  tickEnabled: boolean;          // Should receive ticks?
  
  onTick(): void;                // Called each turn
  onEncounter(roomId: string): void;  // Called when player enters
  onDeath(): void;               // Called on death
  onDamage(amount: number): void;     // Called when damaged
}
```

### ActorManager Methods

```typescript
register(actor: Actor): void;
unregister(actorId: string): boolean;
getActor(actorId: string): Actor | undefined;
getAllActors(): Actor[];
getActorsInLocation(locationId: string): Actor[];
enableTicks(actorId: string): boolean;
disableTicks(actorId: string): boolean;
isTickEnabled(actorId: string): boolean;
triggerEncounter(locationId: string): void;
triggerDeath(actorId: string): void;
triggerDamage(actorId: string, amount: number): void;
```

### GameTickService Methods

```typescript
tick(): void;                           // Manual tick
startAutoTick(intervalMs: number): void;  // Auto-tick mode
stopAutoTick(): void;                   // Stop auto-tick
reset(): void;                          // Reset counter
getCount(): number;                     // Get tick count
tick$: Observable<number>;              // Tick stream
```

### RandomService Methods

```typescript
setSeed(seed: number): void;
getSeed(): number;
next(): number;                         // [0, 1)
nextInt(min: number, max: number): number;
nextBoolean(probability?: number): boolean;
choice<T>(array: T[]): T | undefined;
shuffle<T>(array: T[]): T[];
```

## Testing Actors

Use the deterministic RandomService for reproducible tests:

```typescript
describe('ThiefActor', () => {
  let thief: ThiefActor;
  let random: RandomService;
  let actorManager: ActorManagerService;
  let tickService: GameTickService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ActorManagerService, GameTickService, RandomService],
    });
    
    random = TestBed.inject(RandomService);
    random.setSeed(12345); // Deterministic behavior
    
    actorManager = TestBed.inject(ActorManagerService);
    tickService = TestBed.inject(GameTickService);
    
    thief = new ThiefActor();
    actorManager.register(thief);
  });

  it('should move on tick', () => {
    tickService.tick();
    expect(thief.locationId).toBe('hallway');
  });

  it('should respond to encounters', () => {
    actorManager.triggerEncounter('treasure-room');
    expect(thief.flags.get('encounterCount')).toBe(1);
  });
});
```

## Best Practices

1. **Actor IDs**: Use unique, descriptive IDs (e.g., 'thief', 'troll', 'wizard')

2. **Tick Efficiency**: Only enable ticking for actors that need it. Disable when:
   - Actor is dead
   - Actor is sleeping/inactive
   - Actor is in a cutscene

3. **Error Handling**: The ActorManager catches and logs errors in lifecycle methods, preventing one actor from breaking others

4. **State Management**: Use `flags` Map for actor state. Common patterns:
   ```typescript
   flags.set('health', 100)
   flags.set('state', 'idle' | 'aggressive' | 'fleeing')
   flags.set('target', 'player')
   ```

5. **Testing**: Always use `setSeed()` with RandomService in tests for deterministic behavior

## Legacy ZIL Mapping

The Actor system maps to ZIL concepts:

- `I-THIEF` routine → `Actor.onTick()`
- `PROB` checks → `RandomService.nextBoolean()`
- `LOC` → `Actor.locationId`
- `FSET?/FCLEAR` → `Actor.flags.get()/set()`
- `ENABLE/DISABLE` → `ActorManager.enableTicks()/disableTicks()`

## Next Steps

To implement the thief from the original Zork:

1. Create `ThiefActor` class extending `BaseActor`
2. Implement movement AI in `onTick()`
3. Implement combat in `onDamage()` and `onDeath()`
4. Implement stealing logic in `onTick()` when near player
5. Wire up combat commands to call `triggerDamage()`
6. Hook up movement to call `triggerEncounter()`

See `test-actor.ts` for a working example.
