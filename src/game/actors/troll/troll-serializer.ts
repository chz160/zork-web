/**
 * TrollActor Serialization & Migration
 *
 * Purpose:
 * Provides serialization/deserialization for TrollActor state, including migration
 * from legacy save formats to the new actor-based model.
 *
 * Current Status:
 * The TrollActor migration is complete. All new games use the actor-based system.
 * Legacy migration utilities (isLegacyTrollData, migrateLegacyTrollData, LegacyTrollData)
 * are retained only for backward compatibility with old save files.
 *
 * Migration Utilities (Backward Compatibility):
 * - isLegacyTrollData: Detects pre-migration save format
 * - migrateLegacyTrollData: Converts legacy saves to actor format
 * - LegacyTrollData: Type definition for pre-migration format
 *
 * These utilities will be removed in a future major version after sufficient
 * time has passed for users to migrate their save files.
 */

import { TrollActor } from './troll-actor';
import { TrollConfig } from './troll-config';
import { TrollState } from './troll-behavior.strategy';

/**
 * Serialized representation of TrollActor state.
 * This is the canonical save format for TrollActor.
 */
export interface SerializedTrollActor {
  /** Actor ID (always 'troll') */
  id: string;

  /** Actor type identifier for deserialization */
  type: 'TrollActor';

  /** Current location (room ID) */
  locationId: string | null;

  /** Health/strength value */
  health: number;

  /** Items in inventory (e.g., ['axe']) */
  inventory: string[];

  /** Whether troll is conscious */
  isConscious: boolean;

  /** Whether troll is currently fighting */
  isFighting: boolean;

  /** Whether troll blocks passage */
  blocksPassage: boolean;

  /** Additional actor flags */
  flags: Record<string, boolean | number | string>;
}

/**
 * Legacy GameObject-based troll representation.
 *
 * @deprecated This format was used before the Actor migration.
 * Retained only for backward compatibility with old save files.
 * Will be removed in a future major version.
 */
export interface LegacyTrollData {
  id: string;
  location: string;
  properties?: {
    strength?: number;
    actorState?: 'armed' | 'unconscious' | 'dead' | 'disarmed' | 'awake';
    isFighting?: boolean;
    blocksPassage?: boolean;
    [key: string]: unknown; // Allow other properties from GameObject
  };
  [key: string]: unknown; // Allow other GameObject properties
}

/**
 * Serialize TrollActor to a plain object for saving.
 *
 * @param troll The TrollActor instance to serialize
 * @returns Serialized representation suitable for JSON.stringify
 */
export function serializeTrollActor(troll: TrollActor): SerializedTrollActor {
  const state = troll.getState();

  return {
    id: troll.id,
    type: 'TrollActor',
    locationId: troll.locationId,
    health: state.strength,
    inventory: [...troll.inventory], // Clone array
    isConscious: state.isConscious,
    isFighting: state.isFighting,
    blocksPassage: state.blocksPassage,
    flags: serializeFlags(troll.flags),
  };
}

/**
 * Deserialize TrollActor from saved data.
 *
 * @param data Serialized troll data
 * @param config Optional TrollConfig for initialization
 * @returns New TrollActor instance with restored state
 * @throws Error if data is invalid or missing required fields
 */
export function deserializeTrollActor(
  data: SerializedTrollActor,
  config?: TrollConfig
): TrollActor {
  validateSerializedData(data);

  // Create new actor instance
  const troll = new TrollActor(config);

  // Restore location
  troll.locationId = data.locationId;

  // Restore inventory
  troll.inventory = [...data.inventory];

  // Restore flags
  troll.flags.clear();
  Object.entries(data.flags).forEach(([key, value]) => {
    troll.flags.set(key, value);
  });

  // Restore internal troll state
  const restoredState: TrollState = {
    strength: data.health,
    isConscious: data.isConscious,
    isArmed: data.inventory.includes('axe'),
    isFighting: data.isFighting,
    blocksPassage: data.blocksPassage,
  };

  troll.restoreState(restoredState);

  return troll;
}

/**
 * Detect if save data contains legacy troll format.
 *
 * @deprecated Retained for backward compatibility with old save files.
 * Will be removed in a future major version.
 *
 * @param gameObjects Map of game objects from save data
 * @returns True if legacy troll data is detected
 */
export function isLegacyTrollData(gameObjects: Map<string, unknown>): boolean {
  const troll = gameObjects.get('troll') as LegacyTrollData | undefined;

  if (!troll) {
    return false;
  }

  // Legacy format has 'location' instead of 'locationId' and 'properties.actorState'
  return (
    typeof troll === 'object' &&
    'location' in troll &&
    !('type' in troll) &&
    (!('properties' in troll) || typeof troll.properties === 'object')
  );
}

/**
 * Migrate legacy troll GameObject to TrollActor format.
 *
 * @deprecated Retained for backward compatibility with old save files.
 * Will be removed in a future major version.
 *
 * @param legacyData Legacy troll object data
 * @returns Serialized TrollActor data
 * @throws Error if legacy data is invalid
 */
export function migrateLegacyTrollData(legacyData: unknown): SerializedTrollActor {
  // Type guard and validation
  if (!legacyData || typeof legacyData !== 'object') {
    throw new Error('Invalid legacy troll data: not an object');
  }

  const data = legacyData as {
    id?: string;
    location?: string;
    properties?: Record<string, unknown>;
  };

  if (!data.id || data.id !== 'troll') {
    throw new Error('Invalid legacy troll data: missing or incorrect id');
  }

  const properties = data.properties || {};
  const strength = typeof properties['strength'] === 'number' ? properties['strength'] : 2;

  // Preserve the actual actorState from legacy data, defaulting to 'armed'
  const rawActorState = properties['actorState'];
  const actorState: 'armed' | 'unconscious' | 'dead' | 'disarmed' | 'awake' =
    rawActorState === 'unconscious' ||
    rawActorState === 'dead' ||
    rawActorState === 'disarmed' ||
    rawActorState === 'awake'
      ? rawActorState
      : 'armed';

  const isFighting =
    typeof properties['isFighting'] === 'boolean' ? properties['isFighting'] : true;
  const blocksPassage =
    typeof properties['blocksPassage'] === 'boolean' ? properties['blocksPassage'] : true;

  // Determine if troll is conscious based on actorState
  // Conscious states: 'armed', 'awake', 'disarmed'
  // Unconscious states: 'unconscious', 'dead'
  const isConscious = actorState !== 'unconscious' && actorState !== 'dead';

  // Troll has axe when armed or awake
  const inventory = actorState === 'armed' || actorState === 'awake' ? ['axe'] : [];

  return {
    id: 'troll',
    type: 'TrollActor',
    locationId: data.location || 'troll-room',
    health: strength,
    inventory,
    isConscious,
    isFighting,
    blocksPassage,
    flags: {
      strength,
      actorState,
      isFighting,
      blocksPassage,
    },
  };
}

/**
 * Convert Map<string, unknown> to plain object for serialization.
 *
 * @param flags Actor flags map
 * @returns Plain object representation
 */
function serializeFlags(
  flags: Map<string, boolean | number | string>
): Record<string, boolean | number | string> {
  const result: Record<string, boolean | number | string> = {};
  flags.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

/**
 * Validate serialized troll data structure.
 *
 * @param data Data to validate
 * @throws Error if data is invalid
 */
function validateSerializedData(data: SerializedTrollActor): void {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid serialized troll data: not an object');
  }

  if (data.id !== 'troll') {
    throw new Error(`Invalid serialized troll data: expected id 'troll', got '${data.id}'`);
  }

  if (data.type !== 'TrollActor') {
    throw new Error(
      `Invalid serialized troll data: expected type 'TrollActor', got '${data.type}'`
    );
  }

  if (typeof data.health !== 'number') {
    throw new Error('Invalid serialized troll data: health must be a number');
  }

  if (!Array.isArray(data.inventory)) {
    throw new Error('Invalid serialized troll data: inventory must be an array');
  }

  if (typeof data.isConscious !== 'boolean') {
    throw new Error('Invalid serialized troll data: isConscious must be a boolean');
  }

  if (typeof data.isFighting !== 'boolean') {
    throw new Error('Invalid serialized troll data: isFighting must be a boolean');
  }

  if (typeof data.blocksPassage !== 'boolean') {
    throw new Error('Invalid serialized troll data: blocksPassage must be a boolean');
  }
}
