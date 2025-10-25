/**
 * Converter for transforming C source data to JSON entities
 */

import {
  CRoomData,
  CObjectData,
  CMessageData,
  CTravelData,
  CRoom,
  CGameObject,
  RoomFlags,
  ObjectFlags1,
  DirectionNames,
  CIndexTrace,
} from './c-types';

/**
 * Converts C source data to canonical JSON entities
 */
export class CEntityConverter {
  private messages = new Map<number, CMessageData>();
  private travelData: CTravelData[] = [];
  private roomIdMap = new Map<number, string>();
  private objectIdMap = new Map<number, string>();

  /**
   * Initialize converter with parsed C data
   */
  initialize(messages: CMessageData[], travel: CTravelData[]): void {
    // Store messages by their original index (1-based position in rtext array)
    this.messages = new Map(messages.map((m) => [m.index, m]));

    // Create a map from actual rtext values (negative offsets) to message objects
    // This is because rooms/objects may reference messages by rtext value, not index

    const rtextValueMap = new Map<number, CMessageData>();
    for (const msg of messages) {
      if (msg.offset >= 0) {
        // Calculate the rtext value: -(offset/8 + 1)
        const rtextValue = -(msg.offset / 8 + 1);
        rtextValueMap.set(rtextValue, msg);
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any).rtextValueMap = rtextValueMap;

    this.travelData = travel;
  }

  /**
   * Convert C room data to canonical room
   */
  convertRoom(roomData: CRoomData, allRooms: CRoomData[]): CRoom {
    const roomId = this.generateRoomId(roomData, allRooms);
    this.roomIdMap.set(roomData.index, roomId);

    // Room descriptions reference messages by rtext values (negative numbers)
    const longDesc = this.getMessageByRtextValue(roomData.rdesc1);
    const shortDesc = this.getMessageByRtextValue(roomData.rdesc2);

    // Extract room name from description (usually first sentence or line)
    const name = this.extractRoomName(longDesc);

    // Parse exits from travel data
    const exits = this.parseExits(roomData.rexit);

    // Decode room flags
    const flags = this.decodeRoomFlags(roomData.rflag);
    const isDark = !flags.includes('RLIGHT') && !flags.includes('RALGBT');

    const cIndexTrace: CIndexTrace = {
      roomIndex: roomData.index,
      messageIndex: roomData.rdesc1,
      flags: flags,
    };

    return {
      id: roomId,
      name: name,
      description: longDesc,
      shortDescription: shortDesc || name,
      exits: exits,
      objectIds: [], // Will be populated by object converter
      visited: false,
      isDark: isDark,
      properties: {
        ractio: roomData.ractio,
        rval: roomData.rval,
        rflag: roomData.rflag,
      },
      cIndexTrace: cIndexTrace,
    };
  }

  /**
   * Convert C object data to canonical game object
   */
  convertObject(objectData: CObjectData, allObjects: CObjectData[]): CGameObject {
    const objectId = this.generateObjectId(objectData, allObjects);
    this.objectIdMap.set(objectData.index, objectId);

    // Object descriptions use rtext values
    const name = this.getMessageByRtextValue(objectData.odesc1);
    const description = this.getMessageByRtextValue(objectData.odesc2);

    // Generate aliases from name
    const aliases = this.generateAliases(name);

    // Decode object flags
    const flags = this.decodeObjectFlags(objectData.oflag1);
    const portable = flags.includes('TAKEBT');
    const visible = flags.includes('VISIBT');

    // Determine location
    const location = this.getObjectLocation(objectData.oroom);

    // Build properties
    const properties: Record<string, unknown> = {
      oactio: objectData.oactio,
      ofval: objectData.ofval,
      otval: objectData.otval,
      osize: objectData.osize,
    };

    // Container properties
    if (flags.includes('CONTBT')) {
      properties['isContainer'] = true;
      properties['capacity'] = objectData.ocapac;
      properties['acceptsPrepositions'] = ['in'];
    }

    // Light source properties
    if (flags.includes('LIGHTBT')) {
      properties['isLight'] = true;
      properties['isLit'] = flags.includes('ONBT');
      if (properties['isLit']) {
        properties['batteryLife'] = 330; // Default battery life
      }
    }

    // Readable text
    if (objectData.oread !== undefined) {
      properties['readableText'] = this.getMessageByRtextValue(objectData.oread);
    }

    // Food/drink properties
    if (flags.includes('FOODBT')) {
      properties['consumable'] = true;
      properties['edible'] = true;
    }
    if (flags.includes('DRNKBT')) {
      properties['consumable'] = true;
      properties['drinkable'] = true;
    }

    // NPC/Villain properties
    if (flags.includes('VICTBT')) {
      properties['isNPC'] = true;
      properties['npcState'] = 'idle';
    }

    const cIndexTrace: CIndexTrace = {
      objectIndex: objectData.index,
      messageIndex: objectData.odesc1,
      flags: flags,
    };

    return {
      id: objectId,
      name: name,
      aliases: aliases,
      description: description,
      portable: portable,
      visible: visible,
      location: location,
      properties: properties,
      cIndexTrace: cIndexTrace,
    };
  }

  /**
   * Get message text by index (1-based position in rtext array)
   */
  private getMessage(index: number): string {
    const message = this.messages.get(index);
    return message ? message.text.trim() : '';
  }

  /**
   * Get message text by rtext value (negative offset from C source)
   */
  private getMessageByRtextValue(rtextValue: number): string {
    if (rtextValue === 0) return '';
    if (rtextValue > 0) return this.getMessage(rtextValue);

    // Look up by actual rtext value
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rtextValueMap = (this as any).rtextValueMap as Map<number, CMessageData>;
    if (rtextValueMap) {
      const message = rtextValueMap.get(rtextValue);
      if (message) {
        return message.text.trim();
      }
    }

    return '';
  }

  /**
   * Generate room ID from room data
   */
  private generateRoomId(roomData: CRoomData, _allRooms: CRoomData[]): string {
    const longDesc = this.getMessageByRtextValue(roomData.rdesc1);
    const name = this.extractRoomName(longDesc);
    return this.toKebabCase(name);
  }

  /**
   * Generate object ID from object data
   */
  private generateObjectId(objectData: CObjectData, _allObjects: CObjectData[]): string {
    const name = this.getMessageByRtextValue(objectData.odesc1);
    return this.toKebabCase(name);
  }

  /**
   * Extract room name from description
   */
  private extractRoomName(description: string): string {
    // Try to extract from "You are in the X" or "This is X"
    const patterns = [
      /You are (?:in|at|on|standing in) (?:the |an? )?(.*?)(?:\.|,|\n)/i,
      /This is (?:the |an? )?(.*?)(?:\.|,|\n)/i,
      /^(.*?)(?:\.|,|\n)/,
    ];

    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        return this.capitalizeWords(match[1].trim());
      }
    }

    // Fallback: use first line
    const firstLine = description.split(/[.\n]/)[0].trim();
    return this.capitalizeWords(firstLine.substring(0, 50));
  }

  /**
   * Parse exits from travel data
   */
  private parseExits(rexitPointer: number): Record<string, string> {
    const exits: Record<string, string> = {};

    // Travel data is organized as triplets: [direction, destination, condition]
    // rexitPointer points to the start of this room's exit data
    for (let i = rexitPointer; i < this.travelData.length; i++) {
      const travel = this.travelData[i];

      // Check if this is still part of current room's data
      // (convention: direction 0 or -1 marks end of room's exits)
      if (travel.direction <= 0) break;

      const directionName = DirectionNames[travel.direction];
      if (directionName && travel.destination > 0) {
        const destRoomId = this.roomIdMap.get(travel.destination) || `room-${travel.destination}`;
        exits[directionName] = destRoomId;
      }
    }

    return exits;
  }

  /**
   * Decode room flags to string array
   */
  private decodeRoomFlags(rflag: number): string[] {
    const flags: string[] = [];
    for (const [name, value] of Object.entries(RoomFlags)) {
      if ((rflag & value) !== 0) {
        flags.push(name);
      }
    }
    return flags;
  }

  /**
   * Decode object flags to string array
   */
  private decodeObjectFlags(oflag1: number): string[] {
    const flags: string[] = [];
    for (const [name, value] of Object.entries(ObjectFlags1)) {
      if ((oflag1 & value) !== 0) {
        flags.push(name);
      }
    }
    return flags;
  }

  /**
   * Get object location (room ID or special location)
   */
  private getObjectLocation(oroom: number): string {
    if (oroom === 0) return 'void';
    if (oroom < 0) return 'inventory'; // Negative means in player inventory
    return this.roomIdMap.get(oroom) || `room-${oroom}`;
  }

  /**
   * Generate aliases from object name
   */
  private generateAliases(name: string): string[] {
    const aliases: string[] = [];
    const words = name.toLowerCase().split(/\s+/);

    // Add full name
    aliases.push(name.toLowerCase());

    // Add significant words (skip articles)
    const articles = ['a', 'an', 'the', 'of', 'and'];
    for (const word of words) {
      if (!articles.includes(word) && word.length > 2) {
        aliases.push(word);
      }
    }

    // Remove duplicates
    return [...new Set(aliases)];
  }

  /**
   * Convert string to kebab-case
   */
  private toKebabCase(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Capitalize words
   */
  private capitalizeWords(str: string): string {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  /**
   * Get room ID by index (after conversion)
   */
  getRoomId(index: number): string | undefined {
    return this.roomIdMap.get(index);
  }

  /**
   * Get object ID by index (after conversion)
   */
  getObjectId(index: number): string | undefined {
    return this.objectIdMap.get(index);
  }
}
