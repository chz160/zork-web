/**
 * Types for C source data conversion
 */

/**
 * C binary data header information
 */
export interface CDataHeader {
  version: {
    major: number;
    minor: number;
    edit: number;
  };
  gameParams: {
    maxScore: number;
    strbit: number;
    endgameMaxScore: number;
  };
}

/**
 * Room data from C source
 */
export interface CRoomData {
  index: number; // Original C array index (0-based)
  rdesc1: number; // Long description message index
  rdesc2: number; // Short description message index
  rexit: number; // Exit data pointer into travel array
  ractio?: number; // Room action routine number (sparse)
  rval?: number; // Room value for scoring (sparse)
  rflag: number; // Room flags bitfield
}

/**
 * Object data from C source
 */
export interface CObjectData {
  index: number; // Original C array index (0-based)
  odesc1: number; // Short name message index
  odesc2: number; // Full description message index
  odesco?: number; // Container description (sparse)
  oactio?: number; // Object action routine (sparse)
  oflag1: number; // Primary flags
  oflag2?: number; // Secondary flags (sparse)
  ofval?: number; // Object value (sparse)
  otval?: number; // Object tval (sparse)
  osize: number; // Object size
  ocapac?: number; // Container capacity (sparse)
  oroom: number; // Current room location
  oadv?: number; // Adventurer carrying object (sparse)
  ocan?: number; // Container holding object (sparse)
  oread?: number; // Readable text message index (sparse)
}

/**
 * Travel/exit data from C source
 */
export interface CTravelData {
  index: number; // Index in travel array
  direction: number; // Direction constant (NORTH, SOUTH, etc.)
  destination: number; // Destination room index
  condition?: number; // Optional condition flag
}

/**
 * Message data with chunk assembly
 */
export interface CMessageData {
  index: number; // Message index (1-based in rtext)
  offset: number; // Byte offset in text section
  text: string; // Assembled message text
  chunks: number[]; // Original chunk indices used
  hasSubstitutions: boolean; // Contains # markers
  substitutionIndices?: number[]; // Message indices referenced for substitution
}

/**
 * C index trace for auditability
 */
export interface CIndexTrace {
  roomIndex?: number;
  objectIndex?: number;
  messageIndex?: number;
  chunkIndices?: number[];
  flags?: string[]; // Decoded flag names
}

/**
 * Parsed room with C source traceability
 */
export interface CRoom {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  exits: Record<string, string>;
  objectIds: string[];
  visited: boolean;
  isDark?: boolean;
  properties?: Record<string, unknown>;
  cIndexTrace: CIndexTrace;
}

/**
 * Parsed object with C source traceability
 */
export interface CGameObject {
  id: string;
  name: string;
  aliases: string[];
  description: string;
  portable: boolean;
  visible: boolean;
  location: string;
  properties?: Record<string, unknown>;
  cIndexTrace: CIndexTrace;
}

/**
 * Complete C data extraction result
 */
export interface CDataExtraction {
  header: CDataHeader;
  rooms: CRoomData[];
  objects: CObjectData[];
  travel: CTravelData[];
  messages: CMessageData[];
  messageCount: number;
  roomCount: number;
  objectCount: number;
  travelCount: number;
}

/**
 * Room flag constants (from C source)
 */
export const RoomFlags = {
  RSEEN: 0x8000, // 32768 - Room has been visited
  RLIGHT: 0x4000, // 16384 - Room has light
  RLAND: 0x2000, // 8192 - Land location
  RWATER: 0x1000, // 4096 - Water location
  RAIR: 0x0800, // 2048 - Air/flying location
  RSACRD: 0x0400, // 1024 - Sacred location
  RFILL: 0x0200, // 512 - Filled (e.g., with water)
  RMUNG: 0x0100, // 256 - Munged/altered
  RBUCK: 0x0080, // 128 - Bucket location
  RHOUSE: 0x0040, // 64 - Inside house
  REND: 0x0020, // 32 - End game location
  RNWALL: 0x0010, // 16 - No wall
  RWALL: 0x0008, // 8 - Has walls
  RNMUNG: 0x0004, // 4 - Cannot be munged
  RALRMG: 0x0002, // 2 - Already munged
  RALGBT: 0x0001, // 1 - Always lit
} as const;

/**
 * Object flag constants (from C source)
 */
export const ObjectFlags1 = {
  VISIBT: 0x8000, // 32768 - Visible
  READBT: 0x4000, // 16384 - Readable
  TAKEBT: 0x2000, // 8192 - Takeable/portable
  DOORBT: 0x1000, // 4096 - Is a door
  TRANBT: 0x0800, // 2048 - Transparent
  FOODBT: 0x0400, // 1024 - Edible food
  NDSCBT: 0x0200, // 512 - No description
  DRNKBT: 0x0100, // 256 - Drinkable
  CONTBT: 0x0080, // 128 - Container
  LIGHTBT: 0x0040, // 64 - Light source
  VICTBT: 0x0020, // 32 - Villain/NPC
  BURNBT: 0x0010, // 16 - Flammable
  FLAMBT: 0x0008, // 8 - On fire
  TOOLBT: 0x0004, // 4 - Tool
  TURNBT: 0x0002, // 2 - Turnable
  ONBT: 0x0001, // 1 - Turned on
} as const;

/**
 * Direction constants (from C source)
 */
export const Directions = {
  NORTH: 1,
  SOUTH: 2,
  EAST: 3,
  WEST: 4,
  NORTHEAST: 5,
  NORTHWEST: 6,
  SOUTHEAST: 7,
  SOUTHWEST: 8,
  UP: 9,
  DOWN: 10,
  IN: 11,
  OUT: 12,
} as const;

/**
 * Direction names mapping
 */
export const DirectionNames: Record<number, string> = {
  1: 'north',
  2: 'south',
  3: 'east',
  4: 'west',
  5: 'northeast',
  6: 'northwest',
  7: 'southeast',
  8: 'southwest',
  9: 'up',
  10: 'down',
  11: 'in',
  12: 'out',
};
