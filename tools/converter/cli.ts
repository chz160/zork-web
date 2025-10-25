#!/usr/bin/env node
/**
 * Command-line interface for the Zork data conversion tool
 */

/* eslint-disable no-console */

import * as path from 'path';
import { Converter } from './converter';
import { CDataConverter } from './c-data-converter';
import { ConversionOptions } from './types';

interface CliOptions extends ConversionOptions {
  format?: 'zil' | 'c' | 'auto';
}

/**
 * Parse command-line arguments
 */
function parseArgs(): CliOptions {
  const args = process.argv.slice(2);

  const options: CliOptions = {
    source: '',
    output: '',
    validate: true,
    overwrite: false,
    verbose: false,
    format: 'auto',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--source':
      case '-s':
        options.source = args[++i];
        break;
      case '--output':
      case '-o':
        options.output = args[++i];
        break;
      case '--format':
      case '-f':
        options.format = args[++i] as 'zil' | 'c' | 'auto';
        break;
      case '--no-validate':
        options.validate = false;
        break;
      case '--overwrite':
        options.overwrite = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--entities':
      case '-e': {
        const entities = args[++i].split(',');
        options.entityTypes = entities.filter((e) => ['rooms', 'objects', 'verbs'].includes(e)) as (
          | 'rooms'
          | 'objects'
          | 'verbs'
        )[];
        break;
      }
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
      default:
        if (!arg.startsWith('-')) {
          // Assume it's the source if not set
          if (!options.source) {
            options.source = arg;
          } else if (!options.output) {
            options.output = arg;
          }
        }
    }
  }

  return options;
}

/**
 * Detect source format (ZIL or C binary)
 */
function detectFormat(sourcePath: string): 'zil' | 'c' {
  const ext = path.extname(sourcePath).toLowerCase();
  const basename = path.basename(sourcePath).toLowerCase();

  if (ext === '.dat' || basename === 'dtextc.dat') {
    return 'c';
  }

  if (ext === '.zil') {
    return 'zil';
  }

  // Default to ZIL for directories
  return 'zil';
}

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
Zork Data Conversion Tool
==========================

Convert legacy Zork source data to TypeScript/JSON schema format.

Supports:
  - ZIL source files (.zil) from the 1980 MDL implementation
  - C binary data (dtextc.dat) from the C implementation

Usage:
  npm run convert -- [options]
  
  or
  
  node tools/converter/cli.js [options]

Options:
  -s, --source <path>       Path to source file or directory (required)
  -o, --output <path>       Output directory for converted JSON files (required)
  -f, --format <type>       Source format: 'zil', 'c', or 'auto' (default: auto)
  -e, --entities <types>    Comma-separated list of entity types to convert
                            (rooms, objects, verbs). Default: all (ZIL only)
  --no-validate             Skip validation against JSON schemas
  --overwrite               Overwrite existing output files
  -v, --verbose             Enable verbose output
  -h, --help                Show this help message

Examples:
  # Convert ZIL source from a directory
  npm run convert -- --source docs/original-src-1980 --output src/app/data

  # Convert C binary data (auto-detected)
  npm run convert -- -s docs/original-src-c/dtextc.dat -o artifacts -v

  # Convert C binary data (explicit format)
  npm run convert -- -s docs/original-src-c/dtextc.dat -o artifacts -f c --overwrite

  # Convert only rooms from ZIL source
  npm run convert -- -s docs/original-src-1980 -o src/app/data -e rooms -v

Documentation:
  See docs/CONVERTER.md for detailed usage and limitations.
  See docs/C-SOURCE-TEXT-ANALYSIS.md for C source conversion details.
`);
}

/**
 * Validate options
 */
function validateOptions(options: ConversionOptions): boolean {
  if (!options.source) {
    console.error('Error: --source is required');
    console.error('Use --help for usage information');
    return false;
  }

  if (!options.output) {
    console.error('Error: --output is required');
    console.error('Use --help for usage information');
    return false;
  }

  return true;
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const options = parseArgs();

  if (!validateOptions(options)) {
    process.exit(1);
  }

  console.log('Zork Data Conversion Tool');
  console.log('=========================\n');

  // Detect format if auto
  if (options.format === 'auto') {
    options.format = detectFormat(options.source);
    if (options.verbose) {
      console.log(`Auto-detected format: ${options.format.toUpperCase()}`);
    }
  }

  // Use appropriate converter based on format
  if (options.format === 'c') {
    // C binary data conversion
    const converter = new CDataConverter();
    const result = await converter.convert({
      source: options.source,
      output: options.output,
      validate: options.validate,
      overwrite: options.overwrite,
      verbose: options.verbose,
    });

    // Print summary
    console.log('\nConversion Summary:');
    console.log(`  Rooms converted: ${result.roomsConverted}`);
    console.log(`  Objects converted: ${result.objectsConverted}`);
    console.log(`  Messages extracted: ${result.messagesExtracted}`);
    console.log(`  Output files: ${result.outputFiles.length}`);

    if (result.warnings.length > 0) {
      console.log(`\nWarnings (${result.warnings.length}):`);
      result.warnings.forEach((warning) => console.log(`  - ${warning}`));
    }

    if (result.errors.length > 0) {
      console.error(`\nErrors (${result.errors.length}):`);
      result.errors.forEach((error) => console.error(`  - ${error}`));
      process.exit(1);
    }

    if (result.success) {
      console.log('\n✓ C source conversion completed successfully!');
      if (result.outputFiles.length > 0) {
        console.log('\nOutput files:');
        result.outputFiles.forEach((file) => console.log(`  - ${file}`));
      }
      process.exit(0);
    } else {
      console.error('\n✗ C source conversion failed');
      process.exit(1);
    }
  } else {
    // ZIL source conversion (existing)
    const converter = new Converter();
    const result = await converter.convert(options);

    // Print summary
    console.log('\nConversion Summary:');
    console.log(`  Processed: ${result.processed} entities`);
    console.log(`  Converted: ${result.converted} entities`);
    console.log(`  Output files: ${result.outputFiles.length}`);

    if (result.warnings.length > 0) {
      console.log(`\nWarnings (${result.warnings.length}):`);
      result.warnings.forEach((warning) => console.log(`  - ${warning}`));
    }

    if (result.errors.length > 0) {
      console.error(`\nErrors (${result.errors.length}):`);
      result.errors.forEach((error) => console.error(`  - ${error}`));
      process.exit(1);
    }

    if (result.success) {
      console.log('\n✓ ZIL conversion completed successfully!');
      if (result.outputFiles.length > 0) {
        console.log('\nOutput files:');
        result.outputFiles.forEach((file) => console.log(`  - ${file}`));
      }
      process.exit(0);
    } else {
      console.error('\n✗ ZIL conversion failed');
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
