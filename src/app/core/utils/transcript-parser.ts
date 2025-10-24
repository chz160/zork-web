/**
 * Utility for parsing Zork game transcripts into testable command sequences
 */

export interface TranscriptEntry {
  command: string;
  expectedOutput: string[];
  lineNumber: number;
}

export interface TranscriptTestCase {
  name: string;
  entries: TranscriptEntry[];
}

/**
 * Parse a Zork transcript file into structured test cases
 *
 * Transcript format expected:
 * >command
 * Expected output line 1
 * Expected output line 2
 * >next command
 * ...
 */
export class TranscriptParser {
  /**
   * Parse a transcript markdown file into test cases
   * @param content The raw transcript content
   * @param name Optional name for the test case
   * @returns Parsed transcript test case
   */
  static parseTranscript(content: string, name = 'Transcript'): TranscriptTestCase {
    const lines = content.split('\n');
    const entries: TranscriptEntry[] = [];
    let currentCommand: string | null = null;
    let currentOutput: string[] = [];
    let commandLineNumber = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines
      if (!line) {
        continue;
      }

      // Check if this is a command line (starts with >)
      if (line.startsWith('>')) {
        // Save previous command and output if exists
        if (currentCommand !== null) {
          entries.push({
            command: currentCommand,
            expectedOutput: currentOutput,
            lineNumber: commandLineNumber,
          });
        }

        // Start new command
        currentCommand = line.substring(1).trim();
        currentOutput = [];
        commandLineNumber = i + 1;
      } else {
        // This is output from the previous command
        if (currentCommand !== null) {
          // Filter out markdown formatting and excessive whitespace
          const cleanLine = line.replace(/\*\*/g, '').replace(/\|\s+/g, '');
          if (cleanLine) {
            currentOutput.push(cleanLine);
          }
        }
      }
    }

    // Don't forget the last command
    if (currentCommand !== null) {
      entries.push({
        command: currentCommand,
        expectedOutput: currentOutput,
        lineNumber: commandLineNumber,
      });
    }

    return {
      name,
      entries,
    };
  }

  /**
   * Extract a sample of key commands from a full transcript
   * This is useful for creating focused regression tests
   * @param testCase The full transcript test case
   * @param sampleSize Maximum number of entries to include
   * @returns A sampled test case with key moments
   */
  static sampleKeyCommands(testCase: TranscriptTestCase, sampleSize = 20): TranscriptTestCase {
    const entries = testCase.entries;

    if (entries.length <= sampleSize) {
      return testCase;
    }

    // Always include the first command (usually initialization)
    const sampled: TranscriptEntry[] = [entries[0]];

    // Sample evenly throughout the transcript
    const step = Math.floor((entries.length - 1) / (sampleSize - 1));
    for (let i = step; i < entries.length && sampled.length < sampleSize; i += step) {
      sampled.push(entries[i]);
    }

    return {
      name: `${testCase.name} (Sampled)`,
      entries: sampled,
    };
  }

  /**
   * Extract specific command types from a transcript for focused testing
   * @param testCase The full transcript test case
   * @param commandPatterns Regular expressions matching commands to extract
   * @returns Filtered test case with only matching commands
   */
  static filterCommands(
    testCase: TranscriptTestCase,
    commandPatterns: RegExp[]
  ): TranscriptTestCase {
    const filtered = testCase.entries.filter((entry) =>
      commandPatterns.some((pattern) => pattern.test(entry.command))
    );

    return {
      name: `${testCase.name} (Filtered)`,
      entries: filtered,
    };
  }
}
