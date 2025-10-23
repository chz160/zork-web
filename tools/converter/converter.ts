/**
 * Main converter orchestrator
 */

/* eslint-disable no-console */

import * as fs from 'fs';
import * as path from 'path';
import { ZilParser } from './zil-parser';
import { EntityConverter } from './entity-converter';
import { Validator } from './validator';
import { ConversionOptions, ConversionResult, ParsedRoom, ParsedGameObject } from './types';

/**
 * Main converter class that orchestrates the conversion process
 */
export class Converter {
  private zilParser: ZilParser;
  private entityConverter: EntityConverter;
  private validator: Validator;

  constructor() {
    this.zilParser = new ZilParser();
    this.entityConverter = new EntityConverter();
    this.validator = new Validator();
  }

  /**
   * Convert legacy Zork data to TypeScript/JSON format
   */
  async convert(options: ConversionOptions): Promise<ConversionResult> {
    const result: ConversionResult = {
      success: false,
      processed: 0,
      converted: 0,
      errors: [],
      warnings: [],
      outputFiles: [],
    };

    try {
      // Validate source path
      if (!fs.existsSync(options.source)) {
        result.errors.push(`Source path does not exist: ${options.source}`);
        return result;
      }

      // Create output directory if it doesn't exist
      if (!fs.existsSync(options.output)) {
        fs.mkdirSync(options.output, { recursive: true });
      }

      // Get list of ZIL files to process
      const zilFiles = this.getZilFiles(options.source);
      if (zilFiles.length === 0) {
        result.warnings.push('No ZIL files found in source path');
        result.success = true;
        return result;
      }

      if (options.verbose) {
        console.log(`Found ${zilFiles.length} ZIL files to process`);
      }

      // Process each file
      const allRooms: ParsedRoom[] = [];
      const allObjects: ParsedGameObject[] = [];

      for (const filePath of zilFiles) {
        if (options.verbose) {
          console.log(`Processing ${path.basename(filePath)}...`);
        }

        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const zilObjects = this.zilParser.parse(content);
          result.processed += zilObjects.length;

          for (const zilObj of zilObjects) {
            // Convert based on type
            if (zilObj.type === 'ROOM') {
              if (!options.entityTypes || options.entityTypes.includes('rooms')) {
                const room = this.entityConverter.convertToRoom(zilObj);
                if (room) {
                  // Validate if requested
                  if (options.validate) {
                    const validation = this.validator.validateRoom(room);
                    if (!validation.valid) {
                      result.warnings.push(
                        `Room ${room.id} validation errors: ${validation.errors.join(', ')}`
                      );
                    } else {
                      allRooms.push(room);
                      result.converted++;
                    }
                  } else {
                    allRooms.push(room);
                    result.converted++;
                  }
                }
              }
            } else if (zilObj.type === 'OBJECT') {
              if (!options.entityTypes || options.entityTypes.includes('objects')) {
                const obj = this.entityConverter.convertToGameObject(zilObj);
                if (obj) {
                  // Validate if requested
                  if (options.validate) {
                    const validation = this.validator.validateGameObject(obj);
                    if (!validation.valid) {
                      result.warnings.push(
                        `Object ${obj.id} validation errors: ${validation.errors.join(', ')}`
                      );
                    } else {
                      allObjects.push(obj);
                      result.converted++;
                    }
                  } else {
                    allObjects.push(obj);
                    result.converted++;
                  }
                }
              }
            }
          }
        } catch (err) {
          const error = err as Error;
          result.errors.push(`Error processing ${path.basename(filePath)}: ${error.message}`);
        }
      }

      // Write output files
      if (allRooms.length > 0) {
        const roomsFile = path.join(options.output, 'rooms.json');
        this.writeJsonFile(roomsFile, { rooms: allRooms }, options.overwrite);
        result.outputFiles.push(roomsFile);
        if (options.verbose) {
          console.log(`Wrote ${allRooms.length} rooms to ${roomsFile}`);
        }
      }

      if (allObjects.length > 0) {
        const objectsFile = path.join(options.output, 'objects.json');
        this.writeJsonFile(objectsFile, { objects: allObjects }, options.overwrite);
        result.outputFiles.push(objectsFile);
        if (options.verbose) {
          console.log(`Wrote ${allObjects.length} objects to ${objectsFile}`);
        }
      }

      result.success = result.errors.length === 0;
    } catch (err) {
      const error = err as Error;
      result.errors.push(`Conversion failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Get all ZIL files from a path (file or directory)
   */
  private getZilFiles(sourcePath: string): string[] {
    const stats = fs.statSync(sourcePath);

    if (stats.isFile()) {
      if (sourcePath.endsWith('.zil')) {
        return [sourcePath];
      }
      return [];
    }

    if (stats.isDirectory()) {
      const files = fs.readdirSync(sourcePath);
      return files
        .filter((file) => file.endsWith('.zil'))
        .map((file) => path.join(sourcePath, file));
    }

    return [];
  }

  /**
   * Write JSON file with proper formatting
   */
  private writeJsonFile(filePath: string, data: unknown, overwrite?: boolean): void {
    if (!overwrite && fs.existsSync(filePath)) {
      throw new Error(`File already exists: ${filePath}. Use --overwrite to replace.`);
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }
}
