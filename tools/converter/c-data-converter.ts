/**
 * Main orchestrator for C source data conversion
 */

/* eslint-disable no-console */

import * as fs from 'fs';
import * as path from 'path';
import { CBinaryParser } from './c-binary-parser';
import { CEntityConverter } from './c-entity-converter';
import { Validator } from './validator';
import { CDataExtraction, CRoom, CGameObject } from './c-types';

export interface CConversionOptions {
  /** Path to dtextc.dat file */
  source: string;
  /** Output directory for converted JSON files */
  output: string;
  /** Whether to validate output against schemas */
  validate?: boolean;
  /** Whether to overwrite existing output files */
  overwrite?: boolean;
  /** Whether to output verbose logging */
  verbose?: boolean;
}

export interface CConversionResult {
  success: boolean;
  roomsConverted: number;
  objectsConverted: number;
  messagesExtracted: number;
  errors: string[];
  warnings: string[];
  outputFiles: string[];
}

/**
 * Main converter for C source data (dtextc.dat)
 */
export class CDataConverter {
  private parser: CBinaryParser;
  private entityConverter: CEntityConverter;
  private validator: Validator;

  constructor() {
    this.parser = new CBinaryParser();
    this.entityConverter = new CEntityConverter();
    this.validator = new Validator();
  }

  /**
   * Convert C source data to JSON format
   */
  async convert(options: CConversionOptions): Promise<CConversionResult> {
    const result: CConversionResult = {
      success: false,
      roomsConverted: 0,
      objectsConverted: 0,
      messagesExtracted: 0,
      errors: [],
      warnings: [],
      outputFiles: [],
    };

    try {
      // Validate source file
      if (!fs.existsSync(options.source)) {
        result.errors.push(`Source file does not exist: ${options.source}`);
        return result;
      }

      if (options.verbose) {
        console.log(`Parsing C binary data from: ${options.source}`);
      }

      // Parse binary data
      const extraction = await this.parser.parse(options.source);

      if (options.verbose) {
        console.log(`Extracted:`);
        console.log(`  - ${extraction.roomCount} rooms`);
        console.log(`  - ${extraction.objectCount} objects`);
        console.log(`  - ${extraction.messageCount} messages`);
        console.log(`  - ${extraction.travelCount} travel entries`);
      }

      result.messagesExtracted = extraction.messages.length;

      // Initialize entity converter
      this.entityConverter.initialize(extraction.messages, extraction.travel);

      // Convert rooms
      const rooms = this.convertRooms(extraction, options);
      result.roomsConverted = rooms.length;

      // Convert objects
      const objects = this.convertObjects(extraction, options);
      result.objectsConverted = objects.length;

      // Create output directory
      if (!fs.existsSync(options.output)) {
        fs.mkdirSync(options.output, { recursive: true });
      }

      // Write output files
      const outputFiles = this.writeOutputFiles(
        {
          extraction,
          rooms,
          objects,
        },
        options
      );

      result.outputFiles = outputFiles;
      result.success = true;

      return result;
    } catch (error) {
      result.errors.push(`Conversion failed: ${error}`);
      return result;
    }
  }

  /**
   * Convert all rooms from C data
   */
  private convertRooms(extraction: CDataExtraction, options: CConversionOptions): CRoom[] {
    const rooms: CRoom[] = [];

    for (const roomData of extraction.rooms) {
      try {
        const room = this.entityConverter.convertRoom(roomData, extraction.rooms);

        // Validate if requested
        if (options.validate) {
          const validation = this.validator.validateRoom(room);
          if (!validation.valid) {
            if (options.verbose) {
              console.warn(`Room ${room.id} validation errors: ${validation.errors.join(', ')}`);
            }
          }
        }

        rooms.push(room);
      } catch (error) {
        if (options.verbose) {
          console.error(`Error converting room ${roomData.index}: ${error}`);
        }
      }
    }

    return rooms;
  }

  /**
   * Convert all objects from C data
   */
  private convertObjects(extraction: CDataExtraction, options: CConversionOptions): CGameObject[] {
    const objects: CGameObject[] = [];

    for (const objectData of extraction.objects) {
      try {
        const object = this.entityConverter.convertObject(objectData, extraction.objects);

        // Validate if requested
        if (options.validate) {
          const validation = this.validator.validateObject(object);
          if (!validation.valid) {
            if (options.verbose) {
              console.warn(
                `Object ${object.id} validation errors: ${validation.errors.join(', ')}`
              );
            }
          }
        }

        objects.push(object);
      } catch (error) {
        if (options.verbose) {
          console.error(`Error converting object ${objectData.index}: ${error}`);
        }
      }
    }

    return objects;
  }

  /**
   * Write output JSON files
   */
  private writeOutputFiles(
    data: {
      extraction: CDataExtraction;
      rooms: CRoom[];
      objects: CGameObject[];
    },
    options: CConversionOptions
  ): string[] {
    const outputFiles: string[] = [];

    // Write messages.json
    const messagesFile = path.join(options.output, 'messages.json');
    if (options.overwrite || !fs.existsSync(messagesFile)) {
      const messagesData = data.extraction.messages.map((m) => ({
        index: m.index,
        offset: m.offset,
        text: m.text,
        chunks: m.chunks,
        hasSubstitutions: m.hasSubstitutions,
        substitutionIndices: m.substitutionIndices,
      }));
      fs.writeFileSync(messagesFile, JSON.stringify(messagesData, null, 2));
      outputFiles.push(messagesFile);
    }

    // Write rooms.canonical.json
    const roomsFile = path.join(options.output, 'rooms.canonical.json');
    if (options.overwrite || !fs.existsSync(roomsFile)) {
      fs.writeFileSync(roomsFile, JSON.stringify(data.rooms, null, 2));
      outputFiles.push(roomsFile);
    }

    // Write objects.canonical.json
    const objectsFile = path.join(options.output, 'objects.canonical.json');
    if (options.overwrite || !fs.existsSync(objectsFile)) {
      fs.writeFileSync(objectsFile, JSON.stringify(data.objects, null, 2));
      outputFiles.push(objectsFile);
    }

    // Write trace.json for auditability
    const traceFile = path.join(options.output, 'trace.json');
    if (options.overwrite || !fs.existsSync(traceFile)) {
      const traceData = {
        header: data.extraction.header,
        roomCount: data.extraction.roomCount,
        objectCount: data.extraction.objectCount,
        messageCount: data.extraction.messageCount,
        travelCount: data.extraction.travelCount,
        roomTraces: data.rooms.map((r) => ({
          id: r.id,
          cIndexTrace: r.cIndexTrace,
        })),
        objectTraces: data.objects.map((o) => ({
          id: o.id,
          cIndexTrace: o.cIndexTrace,
        })),
      };
      fs.writeFileSync(traceFile, JSON.stringify(traceData, null, 2));
      outputFiles.push(traceFile);
    }

    return outputFiles;
  }
}
