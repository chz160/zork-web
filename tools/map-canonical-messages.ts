#!/usr/bin/env node
/**
 * Message Mapping Tool - Phase 3
 *
 * Maps canonical C message indices (negative numbers) to messages.json entries.
 * Based on C source analysis (dsub.c), the formula is:
 *   byte_offset = ((- messageIndex) - 1) * 8
 *
 * Strategy: Use offset-based proximity matching to find the closest message.
 */

/* eslint-disable no-console */

import * as fs from 'fs';
import * as path from 'path';

interface Message {
  index: number;
  offset: number;
  text: string;
  chunks: number[];
  hasSubstitutions: boolean;
}

interface MappingResult {
  canonicalIndex: number;
  messageIndex: number | null;
  messageOffset: number | null;
  text: string | null;
  strategy: 'offset' | 'manual' | 'unmapped';
  confidence: number;
  offsetDiff?: number;
}

// Known manual mappings from validation (if any exceptions are found)
const MANUAL_MAPPINGS: Record<number, number> = {
  // Will be populated as exceptions are found
};

/**
 * Maps a negative canonical message index to a message from messages.json.
 *
 * Key insight: The negative canonical index represents a CHUNK number in the
 * dtextc.txt file (8-byte chunks). We need to find which message contains that chunk.
 *
 * Formula: chunkNumber = Math.abs(messageIndex) / 8
 */
function mapMessage(canonicalIndex: number, messages: Message[]): MappingResult {
  // Check manual mappings first
  if (MANUAL_MAPPINGS[canonicalIndex]) {
    const msg = messages.find((m) => m.index === MANUAL_MAPPINGS[canonicalIndex]);
    return {
      canonicalIndex,
      messageIndex: msg?.index || null,
      messageOffset: msg?.offset || null,
      text: msg?.text || null,
      strategy: 'manual',
      confidence: 1.0,
    };
  }

  // For zero or positive indices, no mapping needed
  if (canonicalIndex >= 0) {
    return {
      canonicalIndex,
      messageIndex: null,
      messageOffset: null,
      text: null,
      strategy: 'unmapped',
      confidence: 0.0,
    };
  }

  // Calculate chunk number from negative index
  // The negative index represents a position in the 8-byte chunk array
  // Round to nearest integer chunk
  const chunkNumber = Math.round(Math.abs(canonicalIndex) / 8);

  // Find message that contains this chunk
  for (const msg of messages) {
    if (msg.chunks && Array.isArray(msg.chunks) && msg.chunks.length > 0) {
      const minChunk = Math.min(...msg.chunks);
      const maxChunk = Math.max(...msg.chunks);

      if (chunkNumber >= minChunk && chunkNumber <= maxChunk) {
        // Found the message containing this chunk
        // Confidence based on how close to start of message
        const distanceFromStart = chunkNumber - minChunk;
        const messageLength = maxChunk - minChunk + 1;
        const positionRatio = distanceFromStart / messageLength;

        // Higher confidence if chunk is near start of message
        // (room descriptions typically start at their canonical chunk)
        const confidence = 1.0 - positionRatio * 0.3; // 1.0 at start, 0.7 at end

        return {
          canonicalIndex,
          messageIndex: msg.index,
          messageOffset: msg.offset,
          text: msg.text,
          strategy: 'offset',
          confidence,
        };
      }
    }
  }

  return {
    canonicalIndex,
    messageIndex: null,
    messageOffset: null,
    text: null,
    strategy: 'unmapped',
    confidence: 0.0,
  };
}

/**
 * Validates mapping accuracy against known room descriptions
 */
function validateMapping(mappings: MappingResult[]): void {
  console.log('\n=== Validation Report ===');
  console.log(`Total mappings: ${mappings.length}`);

  const mapped = mappings.filter((m) => m.messageIndex !== null);
  const unmapped = mappings.filter((m) => m.messageIndex === null);
  const highConfidence = mapped.filter((m) => m.confidence >= 0.8);
  const mediumConfidence = mapped.filter((m) => m.confidence >= 0.5 && m.confidence < 0.8);
  const lowConfidence = mapped.filter((m) => m.confidence < 0.5);

  console.log(`Mapped: ${mapped.length}`);
  console.log(`Unmapped: ${unmapped.length}`);
  console.log(`High confidence (≥0.8): ${highConfidence.length}`);
  console.log(`Medium confidence (0.5-0.8): ${mediumConfidence.length}`);
  console.log(`Low confidence (<0.5): ${lowConfidence.length}`);

  // Show sample mappings
  console.log('\n=== Sample Mappings ===');
  const samples = mapped.slice(0, 5);
  for (const sample of samples) {
    const chunkNum = Math.abs(sample.canonicalIndex) / 8;
    console.log(`\nCanonical Index: ${sample.canonicalIndex}`);
    console.log(`Chunk Number: ${chunkNum.toFixed(0)}`);
    console.log(`Message Index: ${sample.messageIndex}`);
    console.log(`Offset: ${sample.messageOffset}`);
    console.log(`Confidence: ${sample.confidence.toFixed(2)}`);
    console.log(`Text: ${sample.text?.substring(0, 100)}...`);
  }

  // Show low confidence mappings for review
  if (lowConfidence.length > 0) {
    console.log('\n=== Low Confidence Mappings (Need Review) ===');
    for (const mapping of lowConfidence.slice(0, 10)) {
      const chunkNum = Math.abs(mapping.canonicalIndex) / 8;
      console.log(
        `Canonical: ${mapping.canonicalIndex}, Chunk: ${chunkNum.toFixed(0)}, ` +
          `Message: ${mapping.messageIndex}, Confidence: ${mapping.confidence.toFixed(2)}`
      );
    }
    if (lowConfidence.length > 10) {
      console.log(`... and ${lowConfidence.length - 10} more`);
    }
  }
}

/**
 * Main execution
 */
function main(): void {
  console.log('=== Message Mapping Tool - Phase 3 ===\n');

  const rootDir = path.join(__dirname, '..', '..');
  const artifactsDir = path.join(rootDir, 'artifacts');
  const messagesPath = path.join(artifactsDir, 'messages.json');
  const roomsPath = path.join(artifactsDir, 'rooms.canonical.json');
  const outputPath = path.join(artifactsDir, 'message-mappings.json');

  // Load messages.json
  console.log('Loading messages.json...');
  const messages: Message[] = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
  console.log(`Loaded ${messages.length} messages`);

  // Load canonical rooms
  console.log('Loading rooms.canonical.json...');
  const rooms = JSON.parse(fs.readFileSync(roomsPath, 'utf8'));
  console.log(`Loaded ${rooms.length} rooms`);

  // Extract unique message indices
  const messageIndices = new Set<number>();
  for (const room of rooms) {
    if (room.cIndexTrace?.messageIndex) {
      messageIndices.add(room.cIndexTrace.messageIndex);
    }
  }

  console.log(`Found ${messageIndices.size} unique message indices to map\n`);

  // Map all indices
  console.log('Mapping canonical indices to messages...');
  const mappings: MappingResult[] = [];
  for (const index of Array.from(messageIndices).sort((a, b) => a - b)) {
    const result = mapMessage(index, messages);
    mappings.push(result);
  }

  // Validate mappings
  validateMapping(mappings);

  // Save results
  console.log(`\nSaving mappings to ${outputPath}...`);
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        totalMappings: mappings.length,
        mapped: mappings.filter((m) => m.messageIndex !== null).length,
        unmapped: mappings.filter((m) => m.messageIndex === null).length,
        mappings: mappings,
      },
      null,
      2
    )
  );

  console.log('\n=== Mapping Complete ===');
  console.log(`Results saved to: ${outputPath}`);
}

if (require.main === module) {
  main();
}

export { mapMessage };
export type { MappingResult };
