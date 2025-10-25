/**
 * Validator for converted game entities against JSON schemas
 */

import { ParsedRoom, ParsedGameObject, ParsedVerb } from './types';
import { CRoom, CGameObject } from './c-types';

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates game entities against their schemas
 */
export class Validator {
  /**
   * Validate a room against the room schema
   */
  validateRoom(room: ParsedRoom | CRoom): ValidationResult {
    const errors: string[] = [];

    // Required fields
    if (!room.id || typeof room.id !== 'string') {
      errors.push('Room must have a valid id (string)');
    } else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(room.id)) {
      errors.push(`Room id "${room.id}" must be in kebab-case format`);
    }

    if (!room.name || typeof room.name !== 'string') {
      errors.push('Room must have a valid name (string)');
    }

    if (!room.description || typeof room.description !== 'string') {
      errors.push('Room must have a valid description (string)');
    } else if (room.description.length < 10) {
      errors.push('Room description must be at least 10 characters');
    }

    if (!room.exits || typeof room.exits !== 'object') {
      errors.push('Room must have exits (object)');
    } else {
      const validDirections = [
        'north',
        'south',
        'east',
        'west',
        'northeast',
        'northwest',
        'southeast',
        'southwest',
        'up',
        'down',
        'in',
        'out',
      ];
      for (const [dir, target] of Object.entries(room.exits)) {
        if (!validDirections.includes(dir)) {
          errors.push(`Invalid direction "${dir}" in exits`);
        }
        if (typeof target !== 'string' || !target) {
          errors.push(`Invalid target for direction "${dir}"`);
        }
      }
    }

    if (!Array.isArray(room.objectIds)) {
      errors.push('Room objectIds must be an array');
    }

    if (typeof room.visited !== 'boolean') {
      errors.push('Room visited must be a boolean');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate a game object against the game-object schema
   */
  validateObject(obj: ParsedGameObject | CGameObject): ValidationResult {
    return this.validateGameObject(obj);
  }

  /**
   * Validate a game object against the game-object schema
   */
  validateGameObject(obj: ParsedGameObject | CGameObject): ValidationResult {
    const errors: string[] = [];

    // Required fields
    if (!obj.id || typeof obj.id !== 'string') {
      errors.push('Object must have a valid id (string)');
    } else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(obj.id)) {
      errors.push(`Object id "${obj.id}" must be in kebab-case format`);
    }

    if (!obj.name || typeof obj.name !== 'string') {
      errors.push('Object must have a valid name (string)');
    }

    if (!Array.isArray(obj.aliases)) {
      errors.push('Object aliases must be an array');
    } else if (obj.aliases.length === 0) {
      errors.push('Object must have at least one alias');
    }

    if (!obj.description || typeof obj.description !== 'string') {
      errors.push('Object must have a valid description (string)');
    } else if (obj.description.length < 5) {
      errors.push('Object description must be at least 5 characters');
    }

    if (typeof obj.portable !== 'boolean') {
      errors.push('Object portable must be a boolean');
    }

    if (typeof obj.visible !== 'boolean') {
      errors.push('Object visible must be a boolean');
    }

    if (!obj.location || typeof obj.location !== 'string') {
      errors.push('Object must have a valid location (string)');
    }

    // Validate properties if present
    if (obj.properties) {
      if (typeof obj.properties !== 'object') {
        errors.push('Object properties must be an object');
      } else {
        // Validate specific property types
        if ('isOpen' in obj.properties && typeof obj.properties['isOpen'] !== 'boolean') {
          errors.push('Property isOpen must be a boolean');
        }
        if ('isLocked' in obj.properties && typeof obj.properties['isLocked'] !== 'boolean') {
          errors.push('Property isLocked must be a boolean');
        }
        if ('contains' in obj.properties && !Array.isArray(obj.properties['contains'])) {
          errors.push('Property contains must be an array');
        }
        if ('isLight' in obj.properties && typeof obj.properties['isLight'] !== 'boolean') {
          errors.push('Property isLight must be a boolean');
        }
        if ('isLit' in obj.properties && typeof obj.properties['isLit'] !== 'boolean') {
          errors.push('Property isLit must be a boolean');
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate a verb against the verb schema
   */
  validateVerb(verb: ParsedVerb): ValidationResult {
    const errors: string[] = [];

    // Required fields
    if (!verb.name || typeof verb.name !== 'string') {
      errors.push('Verb must have a valid name (string)');
    } else if (!/^[a-z]+( [a-z]+)?$/.test(verb.name)) {
      errors.push(`Verb name "${verb.name}" must be lowercase letters with optional space`);
    }

    if (!Array.isArray(verb.aliases)) {
      errors.push('Verb aliases must be an array');
    }

    if (typeof verb.requiresObject !== 'boolean') {
      errors.push('Verb requiresObject must be a boolean');
    }

    if (typeof verb.allowsIndirectObject !== 'boolean') {
      errors.push('Verb allowsIndirectObject must be a boolean');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
