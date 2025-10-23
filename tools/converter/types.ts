/**
 * Types for the legacy Zork data conversion tool
 */

/**
 * Parsed ZIL object from the original source
 */
export interface ZilObject {
  type: 'OBJECT' | 'ROOM' | 'VERB' | 'SYNTAX';
  name: string;
  properties: Map<string, string | string[] | boolean | number>;
}

/**
 * Parsed room from ZIL source
 */
export interface ParsedRoom {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  exits: Record<string, string>;
  objectIds: string[];
  visited: boolean;
  isDark?: boolean;
  properties?: Record<string, unknown>;
}

/**
 * Parsed game object from ZIL source
 */
export interface ParsedGameObject {
  id: string;
  name: string;
  aliases: string[];
  description: string;
  portable: boolean;
  visible: boolean;
  location: string;
  properties?: Record<string, unknown>;
}

/**
 * Parsed verb from ZIL source
 */
export interface ParsedVerb {
  name: string;
  aliases: string[];
  requiresObject: boolean;
  allowsIndirectObject: boolean;
  description?: string;
}

/**
 * Conversion options
 */
export interface ConversionOptions {
  /** Source file or directory to convert */
  source: string;
  /** Output directory for converted JSON files */
  output: string;
  /** Whether to validate output against schemas */
  validate?: boolean;
  /** Whether to overwrite existing output files */
  overwrite?: boolean;
  /** Entity types to convert (if not specified, converts all) */
  entityTypes?: ('rooms' | 'objects' | 'verbs')[];
  /** Whether to output verbose logging */
  verbose?: boolean;
}

/**
 * Conversion result
 */
export interface ConversionResult {
  success: boolean;
  processed: number;
  converted: number;
  errors: string[];
  warnings: string[];
  outputFiles: string[];
}
