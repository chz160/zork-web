import { Injectable, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Actor } from '../models/actor.model';
import { GameTickService } from './game-tick.service';

/**
 * Manager for all NPC actors in the game.
 * Handles actor registration, tick scheduling, and lifecycle management.
 *
 * Design:
 * - Actors are registered and stored by ID
 * - Each actor can enable/disable its own ticking
 * - On each tick, calls onTick() for all enabled actors
 * - Provides methods for actor lifecycle events
 */
@Injectable({
  providedIn: 'root',
})
export class ActorManagerService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly tickService = inject(GameTickService);

  /** Map of all registered actors by ID */
  private readonly actors = new Map<string, Actor>();

  constructor() {
    // Subscribe to ticks and call onTick for enabled actors
    this.tickService.tick$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.onTick();
    });
  }

  /**
   * Register an actor with the manager.
   * @param actor The actor to register
   * @throws Error if an actor with the same ID already exists
   */
  register(actor: Actor): void {
    if (this.actors.has(actor.id)) {
      throw new Error(`Actor with id '${actor.id}' is already registered`);
    }
    this.actors.set(actor.id, actor);
  }

  /**
   * Unregister an actor from the manager.
   * @param actorId The ID of the actor to remove
   * @returns True if the actor was removed, false if not found
   */
  unregister(actorId: string): boolean {
    return this.actors.delete(actorId);
  }

  /**
   * Get an actor by ID.
   * @param actorId The ID of the actor to retrieve
   * @returns The actor or undefined if not found
   */
  getActor(actorId: string): Actor | undefined {
    return this.actors.get(actorId);
  }

  /**
   * Get all registered actors.
   * @returns Array of all actors
   */
  getAllActors(): Actor[] {
    return Array.from(this.actors.values());
  }

  /**
   * Get all actors in a specific location.
   * @param locationId The room ID to search
   * @returns Array of actors in that location
   */
  getActorsInLocation(locationId: string): Actor[] {
    return this.getAllActors().filter((actor) => actor.locationId === locationId);
  }

  /**
   * Enable ticking for a specific actor.
   * @param actorId The ID of the actor
   * @returns True if successful, false if actor not found
   */
  enableTicks(actorId: string): boolean {
    const actor = this.actors.get(actorId);
    if (!actor) {
      return false;
    }
    actor.tickEnabled = true;
    return true;
  }

  /**
   * Disable ticking for a specific actor.
   * @param actorId The ID of the actor
   * @returns True if successful, false if actor not found
   */
  disableTicks(actorId: string): boolean {
    const actor = this.actors.get(actorId);
    if (!actor) {
      return false;
    }
    actor.tickEnabled = false;
    return true;
  }

  /**
   * Check if an actor's ticking is enabled.
   * @param actorId The ID of the actor
   * @returns True if enabled, false if disabled or not found
   */
  isTickEnabled(actorId: string): boolean {
    const actor = this.actors.get(actorId);
    return actor ? actor.tickEnabled : false;
  }

  /**
   * Called on each game tick. Iterates through all actors with
   * tickEnabled=true and calls their onTick() method.
   */
  private onTick(): void {
    for (const actor of this.actors.values()) {
      if (actor.tickEnabled) {
        try {
          actor.onTick();
        } catch (error) {
          console.error(`Error in actor ${actor.id} onTick:`, error);
        }
      }
    }
  }

  /**
   * Trigger encounter event for all actors in a location.
   * @param locationId The room ID where the encounter occurred
   */
  triggerEncounter(locationId: string): void {
    const actorsInRoom = this.getActorsInLocation(locationId);
    for (const actor of actorsInRoom) {
      try {
        actor.onEncounter(locationId);
      } catch (error) {
        console.error(`Error in actor ${actor.id} onEncounter:`, error);
      }
    }
  }

  /**
   * Trigger death event for an actor.
   * @param actorId The ID of the actor
   */
  triggerDeath(actorId: string): void {
    const actor = this.actors.get(actorId);
    if (actor) {
      try {
        actor.onDeath();
      } catch (error) {
        console.error(`Error in actor ${actorId} onDeath:`, error);
      }
    }
  }

  /**
   * Trigger damage event for an actor.
   * @param actorId The ID of the actor
   * @param amount Amount of damage
   */
  triggerDamage(actorId: string, amount: number): void {
    const actor = this.actors.get(actorId);
    if (actor) {
      try {
        actor.onDamage(amount);
      } catch (error) {
        console.error(`Error in actor ${actorId} onDamage:`, error);
      }
    }
  }

  /**
   * Clear all registered actors. Useful for testing.
   */
  clear(): void {
    this.actors.clear();
  }
}
