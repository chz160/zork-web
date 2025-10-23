/**
 * Parser for ZIL (Zork Implementation Language) source files
 */

import { ZilObject } from './types';

/**
 * Parse ZIL source code into structured objects
 */
export class ZilParser {
  /**
   * Parse a ZIL file content into objects
   */
  parse(content: string): ZilObject[] {
    const objects: ZilObject[] = [];
    const lines = content.split('\n');
    let currentObject: Partial<ZilObject> | null = null;
    let currentProperty: string | null = null;
    let multilineValue: string[] = [];

    for (const line of lines.map((l) => l.trim())) {
      // Skip empty lines and comments
      if (!line || line.startsWith('"') || line.startsWith(';')) {
        continue;
      }

      // Start of an object definition: <OBJECT NAME
      if (line.startsWith('<OBJECT ')) {
        if (currentObject) {
          objects.push(this.finalizeObject(currentObject));
        }
        const name = line.substring(8).trim().replace(/\s*$/, '');
        currentObject = {
          type: 'OBJECT',
          name: this.normalizeIdentifier(name),
          properties: new Map(),
        };
        continue;
      }

      // Start of a room definition: <ROOM NAME
      if (line.startsWith('<ROOM ')) {
        if (currentObject) {
          objects.push(this.finalizeObject(currentObject));
        }
        const name = line.substring(6).trim().replace(/\s*$/, '');
        currentObject = {
          type: 'ROOM',
          name: this.normalizeIdentifier(name),
          properties: new Map(),
        };
        continue;
      }

      // End of object: >
      if (line === '>') {
        if (currentObject) {
          if (currentProperty && multilineValue.length > 0) {
            currentObject.properties!.set(currentProperty, multilineValue.join(' '));
            multilineValue = [];
            currentProperty = null;
          }
          objects.push(this.finalizeObject(currentObject));
          currentObject = null;
        }
        continue;
      }

      // Property definition: (PROPERTY_NAME value)
      if (currentObject && line.startsWith('(')) {
        // If we have an ongoing multiline property, save it first
        if (currentProperty && multilineValue.length > 0) {
          currentObject.properties!.set(currentProperty, multilineValue.join(' '));
          multilineValue = [];
          currentProperty = null;
        }

        const propertyMatch = line.match(/^\(([A-Z-]+)\s*(.*)$/);
        if (propertyMatch) {
          const propName = propertyMatch[1];
          const propValue = propertyMatch[2].replace(/\)$/, '').trim();

          // Check if this is a multiline property (ends without closing paren)
          if (!line.includes(')') || line.match(/\(.*"[^"]*$/)) {
            currentProperty = propName;
            multilineValue = [propValue];
          } else {
            // Single line property
            currentObject.properties!.set(propName, this.parsePropertyValue(propValue));
          }
        }
        continue;
      }

      // Continuation of multiline property
      if (currentObject && currentProperty) {
        multilineValue.push(line);
        // Check if this line closes the property
        if (line.includes(')')) {
          const fullValue = multilineValue.join(' ').replace(/\)$/, '').trim();
          currentObject.properties!.set(currentProperty, this.parsePropertyValue(fullValue));
          multilineValue = [];
          currentProperty = null;
        }
      }
    }

    // Finalize any remaining object
    if (currentObject) {
      objects.push(this.finalizeObject(currentObject));
    }

    return objects;
  }

  /**
   * Parse a property value into appropriate type
   */
  private parsePropertyValue(value: string): string | string[] | boolean | number {
    // Clean up any trailing characters
    value = value.trim();

    // Remove surrounding quotes if present
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1);
    }

    // Boolean values
    if (value === 'T' || value === '<>') {
      return value === 'T';
    }

    // Numeric values (extract just the number)
    const numMatch = value.match(/^(-?\d+)/);
    if (numMatch) {
      return parseInt(numMatch[1], 10);
    }

    // List of values
    if (value.includes(' ') && !value.startsWith('"')) {
      return value.split(/\s+/).filter((v) => v.length > 0);
    }

    return value;
  }

  /**
   * Finalize an object by ensuring all required fields are present
   */
  private finalizeObject(obj: Partial<ZilObject>): ZilObject {
    return {
      type: obj.type || 'OBJECT',
      name: obj.name || 'UNKNOWN',
      properties: obj.properties || new Map(),
    };
  }

  /**
   * Normalize an identifier (convert to kebab-case)
   */
  private normalizeIdentifier(name: string): string {
    return name
      .toLowerCase()
      .replace(/_/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }
}
