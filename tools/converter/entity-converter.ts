/**
 * Converts parsed ZIL entities to TypeScript/JSON schema format
 */

import { ZilObject, ParsedRoom, ParsedGameObject } from './types';

/**
 * Converts ZIL objects to structured game entities
 */
export class EntityConverter {
  private readonly directionMap: Record<string, string> = {
    NORTH: 'north',
    SOUTH: 'south',
    EAST: 'east',
    WEST: 'west',
    NE: 'northeast',
    NW: 'northwest',
    SE: 'southeast',
    SW: 'southwest',
    UP: 'up',
    DOWN: 'down',
    IN: 'in',
    OUT: 'out',
  };

  /**
   * Convert a ZIL object to a Room
   */
  convertToRoom(zilObj: ZilObject): ParsedRoom | null {
    if (zilObj.type !== 'ROOM') {
      return null;
    }

    const id = this.normalizeId(zilObj.name);
    const desc = this.getProperty(zilObj, 'DESC') as string;
    const ldesc = this.getProperty(zilObj, 'LDESC') as string;
    const fdesc = this.getProperty(zilObj, 'FDESC') as string;

    // Use LDESC or FDESC for full description, DESC for short description
    const description = ldesc || fdesc || desc || '';
    const shortDescription = desc || '';

    const exits = this.parseExits(zilObj);
    const flags = this.getProperty(zilObj, 'FLAGS') as string | string[];
    const isDark = Array.isArray(flags)
      ? flags.some((f) => f.includes('DARK'))
      : typeof flags === 'string'
        ? flags.includes('DARK')
        : false;

    return {
      id,
      name: this.capitalize(zilObj.name),
      description: this.cleanDescription(description),
      shortDescription: this.cleanDescription(shortDescription),
      exits,
      objectIds: [],
      visited: false,
      isDark,
    };
  }

  /**
   * Convert a ZIL object to a GameObject
   */
  convertToGameObject(zilObj: ZilObject): ParsedGameObject | null {
    if (zilObj.type !== 'OBJECT') {
      return null;
    }

    const id = this.normalizeId(zilObj.name);
    const synonyms = this.getProperty(zilObj, 'SYNONYM') as string | string[];
    const adjectives = this.getProperty(zilObj, 'ADJECTIVE') as string | string[];
    const desc = this.getProperty(zilObj, 'DESC') as string;
    const ldesc = this.getProperty(zilObj, 'LDESC') as string;
    const fdesc = this.getProperty(zilObj, 'FDESC') as string;
    const flags = this.getProperty(zilObj, 'FLAGS') as string | string[];
    const location = this.getProperty(zilObj, 'IN') as string;

    // Build aliases from synonyms and adjectives
    const aliases = this.buildAliases(synonyms, adjectives);

    // Determine if object is portable
    const portable = this.hasFlag(flags, 'TAKEBIT');
    const visible = !this.hasFlag(flags, 'INVISIBLE');

    // Use LDESC or FDESC for detailed description, DESC for name
    const description = ldesc || fdesc || desc || '';

    // Build properties
    const properties: Record<string, unknown> = {};

    if (this.hasFlag(flags, 'CONTBIT')) {
      properties['isOpen'] = this.hasFlag(flags, 'OPENBIT');
      properties['contains'] = [];
      const capacity = this.getProperty(zilObj, 'CAPACITY') as number;
      if (capacity) {
        properties['capacity'] = capacity;
      }
    }

    if (this.hasFlag(flags, 'DOORBIT')) {
      properties['isOpen'] = this.hasFlag(flags, 'OPENBIT');
      properties['isLocked'] = this.hasFlag(flags, 'LOCKEDBIT');
    }

    if (this.hasFlag(flags, 'LIGHTBIT')) {
      properties['isLight'] = true;
      properties['isLit'] = this.hasFlag(flags, 'ONBIT');
    }

    if (this.hasFlag(flags, 'WEAPONBIT')) {
      properties['isWeapon'] = true;
    }

    const value = this.getProperty(zilObj, 'VALUE') as number;
    if (value) {
      properties['value'] = value;
    }

    return {
      id,
      name: this.cleanDescription(desc) || this.capitalize(zilObj.name),
      aliases,
      description: this.cleanDescription(description),
      portable,
      visible,
      location: this.normalizeId(location) || 'unknown',
      properties: Object.keys(properties).length > 0 ? properties : undefined,
    };
  }

  /**
   * Parse exits from a ZIL room object
   */
  private parseExits(zilObj: ZilObject): Record<string, string> {
    const exits: Record<string, string> = {};

    // Look for direction properties
    for (const [key, value] of zilObj.properties.entries()) {
      const normalizedKey = key.toUpperCase();
      if (this.directionMap[normalizedKey] && typeof value === 'string') {
        const targetRoom = this.normalizeId(value);
        if (targetRoom && targetRoom !== 'unknown') {
          exits[this.directionMap[normalizedKey]] = targetRoom;
        }
      }
    }

    // Also check for EXIT property which may contain a list
    const exitProp = this.getProperty(zilObj, 'EXIT') as string | string[];
    if (exitProp) {
      // Handle EXIT property format if present
      // This is a simplification; actual parsing may be more complex
    }

    return exits;
  }

  /**
   * Build aliases from synonyms and adjectives
   */
  private buildAliases(
    synonyms: string | string[] | undefined,
    adjectives: string | string[] | undefined
  ): string[] {
    const aliases: string[] = [];

    if (synonyms) {
      if (Array.isArray(synonyms)) {
        aliases.push(...synonyms.map((s) => s.toLowerCase()));
      } else {
        aliases.push(synonyms.toLowerCase());
      }
    }

    if (adjectives) {
      const adjs = Array.isArray(adjectives) ? adjectives : [adjectives as string];
      const syns = Array.isArray(synonyms) ? synonyms : [synonyms as string];

      // Create combinations of adjectives and synonyms
      for (const adj of adjs) {
        for (const syn of syns) {
          aliases.push(`${adj.toLowerCase()} ${syn.toLowerCase()}`);
        }
      }
    }

    // Remove duplicates and empty strings
    return [...new Set(aliases)].filter((a) => a && a.trim().length > 0);
  }

  /**
   * Check if an object has a specific flag
   */
  private hasFlag(flags: string | string[] | undefined, flagName: string): boolean {
    if (!flags) return false;
    if (Array.isArray(flags)) {
      return flags.some((f) => f.toUpperCase().includes(flagName));
    }
    return flags.toUpperCase().includes(flagName);
  }

  /**
   * Get a property value from a ZIL object
   */
  private getProperty(
    zilObj: ZilObject,
    propName: string
  ): string | string[] | boolean | number | undefined {
    return zilObj.properties.get(propName);
  }

  /**
   * Normalize an identifier to kebab-case
   */
  private normalizeId(name: string | undefined): string {
    if (!name) return '';
    return name
      .toString()
      .toLowerCase()
      .replace(/_/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  /**
   * Capitalize a string
   */
  private capitalize(str: string): string {
    return str
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Clean description text (remove extra whitespace, formatting)
   */
  private cleanDescription(desc: string | unknown): string {
    if (typeof desc !== 'string') {
      return String(desc || '');
    }
    return desc
      .replace(/^"|"$/g, '') // Remove surrounding quotes
      .replace(/\|/g, '\n') // ZIL uses | for line breaks
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n\s+/g, '\n') // Clean up newlines
      .trim();
  }
}
