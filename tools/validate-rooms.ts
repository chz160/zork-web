#!/usr/bin/env node
/**
 * Room Data Validation Utility
 *
 * @deprecated TEMPORARY TOOL - Can be deleted after all room data quality issues are fixed.
 * This tool was created specifically for the room data quality fix project (issue #78).
 * Once all 163 remaining room issues are resolved, this validation script is no longer needed.
 *
 * Scans rooms.json for data quality issues:
 * - Malformed descriptions (comma-separated tokens)
 * - Invalid exit destinations (error messages vs room IDs)
 * - Incomplete or duplicate descriptions
 * - Missing canonical text
 */

import * as fs from 'fs';
import * as path from 'path';

interface Room {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  exits: Record<string, string>;
  objectIds: string[];
  visited: boolean;
  isDark?: boolean;
}

interface RoomsData {
  rooms: Room[];
}

interface ValidationIssue {
  roomId: string;
  roomName: string;
  issueType:
    | 'malformed-description'
    | 'invalid-exit'
    | 'incomplete-description'
    | 'short-description';
  details: string;
  severity: 'high' | 'medium' | 'low';
}

// Path resolution depends on where the script is run from
const ROOMS_PATH = fs.existsSync(path.join(__dirname, '..', 'src', 'app', 'data', 'rooms.json'))
  ? path.join(__dirname, '..', 'src', 'app', 'data', 'rooms.json')
  : path.join(__dirname, '..', '..', 'src', 'app', 'data', 'rooms.json');

/**
 * Check if a description appears to be comma-separated tokens rather than prose
 */
function hasTokenizedDescription(description: string): boolean {
  // Check for comma-separated single words with no spaces
  const tokenPattern = /^[a-z]+,[a-z]+,/i;
  if (tokenPattern.test(description)) {
    return true;
  }

  // Check for excessive commas relative to spaces (more than 5 commas per sentence)
  const commaCount = (description.match(/,/g) || []).length;
  const sentenceCount = (description.match(/\./g) || []).length || 1;
  if (commaCount > sentenceCount * 5) {
    return true;
  }

  return false;
}

/**
 * Check if an exit destination looks like an error message rather than a room ID
 */
function isInvalidExitDestination(destination: string, validRoomIds: Set<string>): boolean {
  // First check if it's a valid room ID
  if (validRoomIds.has(destination)) {
    return false;
  }

  // Check for common error message patterns
  const errorPatterns = [
    /^the.*blocked/i,
    /^you.*cant/i,
    /^it.*too.*narrow/i,
    /^storm.*tossed/i,
    /^there.*is.*no/i,
    /are.*impassable/i,
    /prevents.*movement/i,
    /^to.*if.*else/i, // Conditional logic leak
    /^per.*diode/i, // Parser artifact
  ];

  return (
    errorPatterns.some((pattern) => pattern.test(destination)) ||
    destination.length > 50 || // Suspiciously long
    destination.includes('if') || // Conditional logic
    !destination.includes('-')
  ); // Room IDs typically use kebab-case
}

/**
 * Check if description is too short or incomplete
 */
function hasIncompleteDescription(description: string, roomName: string): boolean {
  // Description is just the room name
  if (description.toLowerCase() === roomName.toLowerCase()) {
    return true;
  }

  // Description is suspiciously short (less than 20 chars)
  if (description.length < 20) {
    return true;
  }

  return false;
}

/**
 * Main validation function
 */
function validateRooms(): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Load rooms data
  const roomsData: RoomsData = JSON.parse(fs.readFileSync(ROOMS_PATH, 'utf-8'));
  const rooms = roomsData.rooms;

  // Build set of valid room IDs
  const validRoomIds = new Set(rooms.map((r) => r.id));

  // Validate each room
  for (const room of rooms) {
    // Check for malformed descriptions
    if (hasTokenizedDescription(room.description)) {
      issues.push({
        roomId: room.id,
        roomName: room.name,
        issueType: 'malformed-description',
        details: `Description appears to be comma-separated tokens: "${room.description.substring(0, 80)}..."`,
        severity: 'high',
      });
    }

    // Check for incomplete descriptions
    if (hasIncompleteDescription(room.description, room.name)) {
      issues.push({
        roomId: room.id,
        roomName: room.name,
        issueType: 'incomplete-description',
        details: `Description is too short or duplicates room name: "${room.description}"`,
        severity: 'medium',
      });
    }

    // Check for invalid exits
    for (const [direction, destination] of Object.entries(room.exits)) {
      if (isInvalidExitDestination(destination, validRoomIds)) {
        issues.push({
          roomId: room.id,
          roomName: room.name,
          issueType: 'invalid-exit',
          details: `Exit "${direction}" points to invalid destination: "${destination}"`,
          severity: 'high',
        });
      }
    }

    // Check if short description is missing but description is long
    if (!room.shortDescription && room.description.length > 100) {
      issues.push({
        roomId: room.id,
        roomName: room.name,
        issueType: 'short-description',
        details: 'Missing short description for long room description',
        severity: 'low',
      });
    }
  }

  return issues;
}

/**
 * Print validation report
 */
function printReport(issues: ValidationIssue[]): void {
  console.log('\n=== Room Data Validation Report ===\n');

  if (issues.length === 0) {
    console.log('✅ No issues found! All rooms are valid.\n');
    return;
  }

  // Group by severity
  const highSeverity = issues.filter((i) => i.severity === 'high');
  const mediumSeverity = issues.filter((i) => i.severity === 'medium');
  const lowSeverity = issues.filter((i) => i.severity === 'low');

  console.log(`Total issues found: ${issues.length}\n`);
  console.log(`🔴 High severity: ${highSeverity.length}`);
  console.log(`🟡 Medium severity: ${mediumSeverity.length}`);
  console.log(`🟢 Low severity: ${lowSeverity.length}\n`);

  // Print high severity issues
  if (highSeverity.length > 0) {
    console.log('=== High Severity Issues ===\n');
    for (const issue of highSeverity) {
      console.log(`Room: ${issue.roomName} (${issue.roomId})`);
      console.log(`Type: ${issue.issueType}`);
      console.log(`Details: ${issue.details}`);
      console.log('');
    }
  }

  // Print medium severity issues
  if (mediumSeverity.length > 0) {
    console.log('=== Medium Severity Issues ===\n');
    for (const issue of mediumSeverity) {
      console.log(`Room: ${issue.roomName} (${issue.roomId})`);
      console.log(`Type: ${issue.issueType}`);
      console.log(`Details: ${issue.details}`);
      console.log('');
    }
  }

  // Print low severity summary
  if (lowSeverity.length > 0) {
    console.log(`=== Low Severity Issues (${lowSeverity.length} total) ===\n`);
    console.log('Rooms missing short descriptions:');
    for (const issue of lowSeverity) {
      console.log(`  - ${issue.roomName} (${issue.roomId})`);
    }
    console.log('');
  }

  // Print summary by issue type
  console.log('=== Issues by Type ===\n');
  const byType = issues.reduce(
    (acc, issue) => {
      acc[issue.issueType] = (acc[issue.issueType] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  for (const [type, count] of Object.entries(byType)) {
    console.log(`${type}: ${count}`);
  }
  console.log('');
}

// Run validation
const issues = validateRooms();
printReport(issues);

// Exit with error code if high severity issues found
const hasHighSeverity = issues.some((i) => i.severity === 'high');
process.exit(hasHighSeverity ? 1 : 0);
