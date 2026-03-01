// Client-side map data loader — fetches the JSON from /default-map.json (public asset).
// Call initMapData() once before the game starts; then use MAP_WALLS, getZone, inZone, etc.

export interface WallRect   { x: number; y: number; w: number; h: number; }
export interface ZoneRect   { name: string; x: number; y: number; w: number; h: number; color?: string; }
export interface SpawnPoint { type: string; x: number; y: number; }

export interface MapData {
  walls:  WallRect[];
  zones:  ZoneRect[];
  spawns: SpawnPoint[];
}

// Mutable singleton — populated by initMapData()
let _mapData: MapData = { walls: [], zones: [], spawns: [] };

export async function initMapData(url = '/default-map.json'): Promise<MapData> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as MapData;
    _mapData = {
      walls:  Array.isArray(data.walls)  ? data.walls  : [],
      zones:  Array.isArray(data.zones)  ? data.zones  : [],
      spawns: Array.isArray(data.spawns) ? data.spawns : [],
    };
    console.log(`[MapData] Loaded from ${url} — walls=${_mapData.walls.length} zones=${_mapData.zones.length} spawns=${_mapData.spawns.length}`);
  } catch (e) {
    console.error('[MapData] Failed to load map JSON, using empty map:', e);
  }
  return _mapData;
}

export const MAP_WALLS = new Proxy([] as WallRect[], {
  get(_, prop) { return (_mapData.walls as any)[prop]; }
});

// For direct array access after init
export function getMapData(): MapData { return _mapData; }
export function getWalls(): WallRect[] { return _mapData.walls; }

export function getZone(name: string): ZoneRect | undefined {
  return _mapData.zones.find(z => z.name === name);
}

export function inZone(name: string, x: number, y: number): boolean {
  const z = getZone(name);
  if (!z) return false;
  return x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h;
}

export function getSpawn(type: string): SpawnPoint | undefined {
  return _mapData.spawns.find(s => s.type === type);
}

export function getSpawns(type: string): SpawnPoint[] {
  return _mapData.spawns.filter(s => s.type === type);
}
