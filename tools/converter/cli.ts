#!/usr/bin/env node
/**
 * Command-line interface for the Zork data conversion tool
 */

/* eslint-disable no-console */

import { Converter } from './converter';
import { ConversionOptions } from './types';

/**
 * Parse command-line arguments
 */
function parseArgs(): ConversionOptions {
  const args = process.argv.slice(2);

  const options: ConversionOptions = {
    source: '',
    output: '',
    validate: true,
    overwrite: false,
    verbose: false,
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
 * Print help message
 */
function printHelp(): void {
  console.log(`
Zork Data Conversion Tool
==========================

Convert legacy Zork source (ZIL) to TypeScript/JSON schema format.

Usage:
  npm run convert -- [options]
  
  or
  
  node tools/converter/cli.js [options]

Options:
  -s, --source <path>       Path to ZIL source file or directory (required)
  -o, --output <path>       Output directory for converted JSON files (required)
  -e, --entities <types>    Comma-separated list of entity types to convert
                            (rooms, objects, verbs). Default: all
  --no-validate             Skip validation against JSON schemas
  --overwrite               Overwrite existing output files
  -v, --verbose             Enable verbose output
  -h, --help                Show this help message

Examples:
  # Convert all entities from a directory
  npm run convert -- --source docs/original-src-1980 --output src/app/data

  # Convert only rooms with verbose output
  npm run convert -- -s docs/original-src-1980 -o src/app/data -e rooms -v

  # Convert from a single file, overwrite existing
  npm run convert -- -s docs/original-src-1980/1dungeon.zil -o output --overwrite

Documentation:
  See docs/CONVERTER.md for detailed usage and limitations.
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
    console.log('\n✓ Conversion completed successfully!');
    if (result.outputFiles.length > 0) {
      console.log('\nOutput files:');
      result.outputFiles.forEach((file) => console.log(`  - ${file}`));
    }
    process.exit(0);
  } else {
    console.error('\n✗ Conversion failed');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
