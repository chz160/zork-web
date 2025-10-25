/**
 * Binary parser for dtextc.dat C source data file
 * Implements decryption and parsing logic from decode.py
 */

import * as fs from 'fs';
import {
  CDataHeader,
  CRoomData,
  CObjectData,
  CTravelData,
  CMessageData,
  CDataExtraction,
} from './c-types';

/**
 * Parser for Zork C binary data format (dtextc.dat)
 */
export class CBinaryParser {
  private readonly ENCRYPTION_KEY = 'IanLanceTaylorJr';
  private buffer: Buffer | null = null;
  private position = 0;

  /**
   * Parse dtextc.dat file and extract all game data
   */
  async parse(filePath: string): Promise<CDataExtraction> {
    this.buffer = fs.readFileSync(filePath);
    this.position = 0;

    // Parse header
    const header = this.parseHeader();

    // Parse room data
    const roomCount = this.readInt16BE();
    const rooms = this.parseRooms(roomCount);

    // Parse travel/exit data
    const travelCount = this.readInt16BE();
    const travel = this.parseTravel(travelCount);

    // Parse object data
    const objectCount = this.readInt16BE();
    const objects = this.parseObjects(objectCount);

    // Skip secondary room data
    this.skipSecondaryRoomData();

    // Skip clock events
    this.skipClockEvents();

    // Skip villains
    this.skipVillains();

    // Skip adventurers
    this.skipAdventurers();

    // Parse message indices
    this.readInt16BE(); // mbase - not used
    const messageCount = this.readInt16BE();
    const messageIndices = this.readMultipleInts(messageCount);

    // Current position is where encrypted text starts
    const textStartPos = this.position;

    // Decrypt and extract messages
    const messages = this.extractMessages(textStartPos, messageIndices);

    return {
      header,
      rooms,
      objects,
      travel,
      messages,
      messageCount,
      roomCount,
      objectCount,
      travelCount,
    };
  }

  /**
   * Parse header section
   */
  private parseHeader(): CDataHeader {
    const vmaj = this.readInt16BE();
    const vmin = this.readInt16BE();
    const vedit = this.readInt16BE();
    const mxscor = this.readInt16BE();
    const strbit = this.readInt16BE();
    const egmxsc = this.readInt16BE();

    return {
      version: {
        major: vmaj,
        minor: vmin,
        edit: vedit,
      },
      gameParams: {
        maxScore: mxscor,
        strbit: strbit,
        endgameMaxScore: egmxsc,
      },
    };
  }

  /**
   * Parse room data arrays
   */
  private parseRooms(count: number): CRoomData[] {
    const rdesc1 = this.readMultipleInts(count);
    const rdesc2 = this.readMultipleInts(count);
    const rexit = this.readMultipleInts(count);
    const ractio = this.readPartialInts(count);
    const rval = this.readPartialInts(count);
    const rflag = this.readMultipleInts(count);

    const rooms: CRoomData[] = [];
    for (let i = 0; i < count; i++) {
      rooms.push({
        index: i,
        rdesc1: rdesc1[i],
        rdesc2: rdesc2[i],
        rexit: rexit[i],
        ractio: ractio[i],
        rval: rval[i],
        rflag: rflag[i],
      });
    }

    return rooms;
  }

  /**
   * Parse travel/exit data array
   */
  private parseTravel(count: number): CTravelData[] {
    const travelData = this.readMultipleInts(count);
    const travel: CTravelData[] = [];

    for (let i = 0; i < travelData.length; i += 3) {
      if (i + 2 < travelData.length) {
        travel.push({
          index: Math.floor(i / 3),
          direction: travelData[i],
          destination: travelData[i + 1],
          condition: travelData[i + 2],
        });
      }
    }

    return travel;
  }

  /**
   * Parse object data arrays
   */
  private parseObjects(count: number): CObjectData[] {
    const odesc1 = this.readMultipleInts(count);
    const odesc2 = this.readMultipleInts(count);
    const odesco = this.readPartialInts(count);
    const oactio = this.readPartialInts(count);
    const oflag1 = this.readMultipleInts(count);
    const oflag2 = this.readPartialInts(count);
    const ofval = this.readPartialInts(count);
    const otval = this.readPartialInts(count);
    const osize = this.readMultipleInts(count);
    const ocapac = this.readPartialInts(count);
    const oroom = this.readMultipleInts(count);
    const oadv = this.readPartialInts(count);
    const ocan = this.readPartialInts(count);
    const oread = this.readPartialInts(count);

    const objects: CObjectData[] = [];
    for (let i = 0; i < count; i++) {
      objects.push({
        index: i,
        odesc1: odesc1[i],
        odesc2: odesc2[i],
        odesco: odesco[i],
        oactio: oactio[i],
        oflag1: oflag1[i],
        oflag2: oflag2[i],
        ofval: ofval[i],
        otval: otval[i],
        osize: osize[i],
        ocapac: ocapac[i],
        oroom: oroom[i],
        oadv: oadv[i],
        ocan: ocan[i],
        oread: oread[i],
      });
    }

    return objects;
  }

  /**
   * Extract and decrypt all messages from text section
   */
  private extractMessages(startPos: number, messageIndices: number[]): CMessageData[] {
    if (!this.buffer) {
      throw new Error('Buffer not initialized');
    }

    const encryptedData = this.buffer.slice(startPos);
    const decryptedData = this.decryptText(encryptedData, 0);

    const messages: CMessageData[] = [];

    for (let i = 0; i < messageIndices.length; i++) {
      const rtextValue = messageIndices[i];

      // Positive values are indirect references - skip for now
      if (rtextValue >= 0) {
        // Still add placeholder so indices align
        messages.push({
          index: i + 1,
          offset: -1, // Mark as indirect
          text: '',
          chunks: [],
          hasSubstitutions: false,
        });
        continue;
      }

      // Calculate byte offset: ((- rtextValue) - 1) * 8
      const offset = (Math.abs(rtextValue) - 1) * 8;

      // Assemble message from 8-byte chunks
      const assembled = this.assembleMessage(decryptedData, offset);

      messages.push({
        index: i + 1, // 1-based message index (position in rtext array)
        offset: offset,
        text: assembled.text,
        chunks: assembled.chunks,
        hasSubstitutions: assembled.hasSubstitutions,
        substitutionIndices: assembled.substitutionIndices,
      });
    }

    return messages;
  }

  /**
   * Assemble a complete message from 8-byte chunks
   */
  private assembleMessage(
    data: Buffer,
    startOffset: number
  ): {
    text: string;
    chunks: number[];
    hasSubstitutions: boolean;
    substitutionIndices?: number[];
  } {
    let text = '';
    let offset = startOffset;
    const chunks: number[] = [];
    let hasSubstitutions = false;
    const substitutionIndices: number[] = [];

    while (offset < data.length) {
      const chunkIndex = Math.floor(offset / 8) + 1; // 1-based chunk numbering
      chunks.push(chunkIndex);

      // Read 8-byte chunk
      const chunkEnd = Math.min(offset + 8, data.length);
      const chunk = data.slice(offset, chunkEnd);

      // Find null terminator
      const nullPos = chunk.indexOf(0);
      if (nullPos !== -1) {
        // End of message
        const finalText = chunk.slice(0, nullPos).toString('ascii');
        text += finalText;
        break;
      }

      // Add chunk to text
      const chunkText = chunk.toString('ascii');
      text += chunkText;

      // Check for substitution markers
      if (chunkText.includes('#')) {
        hasSubstitutions = true;
        // Note: actual substitution indices would need to be parsed from context
        // For now, we just flag that substitutions exist
      }

      offset += 8;
    }

    return {
      text: text.replace(/\0/g, ''), // Remove any null chars
      chunks,
      hasSubstitutions,
      substitutionIndices: hasSubstitutions ? substitutionIndices : undefined,
    };
  }

  /**
   * Decrypt text using IanLanceTaylorJr algorithm
   */
  private decryptText(data: Buffer, startOffset: number): Buffer {
    const key = Buffer.from(this.ENCRYPTION_KEY, 'ascii');
    const decrypted = Buffer.alloc(data.length);

    let x = startOffset;
    for (let i = 0; i < data.length; i++) {
      const keyChar = key[x & 0xf];
      const positionXor = x & 0xff;
      decrypted[i] = data[i] ^ keyChar ^ positionXor;
      x++;
    }

    return decrypted;
  }

  /**
   * Read a 16-bit big-endian signed integer
   */
  private readInt16BE(): number {
    if (!this.buffer) {
      throw new Error('Buffer not initialized');
    }
    const value = this.buffer.readInt16BE(this.position);
    this.position += 2;
    return value;
  }

  /**
   * Read multiple 16-bit integers
   */
  private readMultipleInts(count: number): number[] {
    const values: number[] = [];
    for (let i = 0; i < count; i++) {
      values.push(this.readInt16BE());
    }
    return values;
  }

  /**
   * Read sparse array (index-value pairs) until terminator
   */
  private readPartialInts(maxCount: number): number[] {
    const values: number[] = new Array(maxCount).fill(undefined);

    while (true) {
      let index: number;

      if (maxCount < 255) {
        if (!this.buffer || this.position >= this.buffer.length) break;
        index = this.buffer.readUInt8(this.position++);
        if (index === 255) break;
      } else {
        index = this.readInt16BE();
        if (index === -1) break;
      }

      const value = this.readInt16BE();
      if (index >= 0 && index < maxCount) {
        values[index] = value;
      }
    }

    return values;
  }

  /**
   * Read single-byte boolean flags
   */
  private readFlags(count: number): boolean[] {
    if (!this.buffer) {
      throw new Error('Buffer not initialized');
    }

    const flags: boolean[] = [];
    for (let i = 0; i < count; i++) {
      if (this.position >= this.buffer.length) break;
      flags.push(this.buffer.readUInt8(this.position++) !== 0);
    }
    return flags;
  }

  /**
   * Skip secondary room data
   */
  private skipSecondaryRoomData(): void {
    const r2lnt = this.readInt16BE();
    this.readMultipleInts(r2lnt); // oroom2
    this.readMultipleInts(r2lnt); // rroom2
  }

  /**
   * Skip clock events
   */
  private skipClockEvents(): void {
    const clnt = this.readInt16BE();
    this.readMultipleInts(clnt); // ctick
    this.readMultipleInts(clnt); // cactio
    this.readFlags(clnt); // cflag
  }

  /**
   * Skip villains
   */
  private skipVillains(): void {
    const vlnt = this.readInt16BE();
    this.readMultipleInts(vlnt); // villns
    this.readPartialInts(vlnt); // vprob
    this.readPartialInts(vlnt); // vopps
    this.readMultipleInts(vlnt); // vbest
    this.readMultipleInts(vlnt); // vmelee
  }

  /**
   * Skip adventurers
   */
  private skipAdventurers(): void {
    const alnt = this.readInt16BE();
    this.readMultipleInts(alnt); // aroom
    this.readPartialInts(alnt); // ascore
    this.readPartialInts(alnt); // avehic
    this.readMultipleInts(alnt); // aobj
    this.readMultipleInts(alnt); // aactio
    this.readMultipleInts(alnt); // astren
    this.readPartialInts(alnt); // aflag
  }
}
