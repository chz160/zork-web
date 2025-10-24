import { Injectable } from '@angular/core';
import { Room, GameObject, Direction } from '../models';
import roomsData from '../../data/rooms.json';
import objectsData from '../../data/objects.json';

/**
 * Interface for raw room data from JSON files.
 * The exits are stored as plain objects in JSON, not Maps.
 */
interface RoomJson {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  exits: Record<string, string>;
  objectIds: string[];
  visited: boolean;
  isDark?: boolean;
}

/**
 * Interface for the structure of the rooms.json file.
 */
interface RoomsDataJson {
  rooms: RoomJson[];
}

/**
 * Interface for the structure of the objects.json file.
 */
interface ObjectsDataJson {
  objects: GameObject[];
}

/**
 * Service responsible for loading and converting game data from JSON files.
 * Converts the JSON format to the TypeScript interfaces used by the game engine.
 */
@Injectable({
  providedIn: 'root',
})
export class DataLoaderService {
  /**
   * Load all rooms from the converted data file.
   * Converts plain object exits to Map format required by Room interface.
   * @returns Array of Room objects ready for use by the engine
   */
  loadRooms(): Room[] {
    const data = roomsData as unknown as RoomsDataJson;
    return data.rooms.map((roomJson) => this.convertRoom(roomJson));
  }

  /**
   * Load all game objects from the converted data file.
   * @returns Array of GameObject objects ready for use by the engine
   */
  loadObjects(): GameObject[] {
    const data = objectsData as unknown as ObjectsDataJson;
    return data.objects;
  }

  /**
   * Convert a room from JSON format to the Room interface format.
   * The main conversion needed is exits: object → Map.
   * @param roomJson Raw room data from JSON
   * @returns Room object with exits as a Map
   */
  private convertRoom(roomJson: RoomJson): Room {
    // Convert exits object to Map
    const exitsMap = new Map<Direction, string>();
    Object.entries(roomJson.exits).forEach(([direction, targetRoomId]) => {
      // Cast to Direction type - validate at runtime
      exitsMap.set(direction as Direction, targetRoomId);
    });

    return {
      id: roomJson.id,
      name: roomJson.name,
      description: roomJson.description,
      shortDescription: roomJson.shortDescription,
      exits: exitsMap,
      objectIds: roomJson.objectIds,
      visited: roomJson.visited,
    };
  }
}
