// Server-side map data loader (Node.js only — uses fs/path).
// The client has its own loader at client/src/mapData.ts.
import * as fs from 'fs';
import * as path from 'path';
import type { MapData, WallRect, ZoneRect, SpawnPoint } from './mapTypes';
export type { MapData, WallRect, ZoneRect, SpawnPoint };

// ── Loader ─────────────────────────────────────────────────────────────────
function loadMapData(): MapData {
  const candidates = [
    process.env.MAP_FILE,
    // From dist/shared/src/ (server build output) → ../../../../map-editor/
    path.resolve(__dirname, '../../../../map-editor/default-map.json'),
    // From dist/ (flat build) → ../../map-editor/
    path.resolve(__dirname, '../../map-editor/default-map.json'),
    // From shared/src/ (ts-node / dev) → ../../map-editor/
    path.resolve(__dirname, '../../../map-editor/default-map.json'),
    path.resolve(process.cwd(), 'map-editor/default-map.json'),
    path.resolve(process.cwd(), '../map-editor/default-map.json'),
    path.resolve(process.cwd(), 'default-map.json'),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      try {
        const raw = fs.readFileSync(candidate, 'utf-8');
        const data = JSON.parse(raw) as MapData;
        console.log(`[MapData] Loaded map from: ${candidate}`);
        console.log(`[MapData]   walls=${data.walls?.length ?? 0}  zones=${data.zones?.length ?? 0}  spawns=${data.spawns?.length ?? 0}`);
        return {
          walls:  Array.isArray(data.walls)  ? data.walls  : [],
          zones:  Array.isArray(data.zones)  ? data.zones  : [],
          spawns: Array.isArray(data.spawns) ? data.spawns : [],
        };
      } catch (e) {
        console.error(`[MapData] Failed to parse ${candidate}:`, e);
      }
    }
  }

  console.warn('[MapData] No map JSON found — using empty map.');
  return { walls: [], zones: [], spawns: [] };
}

export const MAP_DATA: MapData = loadMapData();
export const MAP_WALLS: WallRect[] = MAP_DATA.walls;

// ── Convenience accessors ──────────────────────────────────────────────────

export function getZone(name: string): ZoneRect | undefined {
  return MAP_DATA.zones.find(z => z.name === name);
}

export function inZone(name: string, x: number, y: number): boolean {
  const z = getZone(name);
  if (!z) return false;
  return x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h;
}

export function getSpawns(type: string): SpawnPoint[] {
  return MAP_DATA.spawns.filter(s => s.type === type);
}

export function getSpawn(type: string): SpawnPoint | undefined {
  return MAP_DATA.spawns.find(s => s.type === type);
}

export function getZoneBounds(name: string): { xMin: number; xMax: number; yMin: number; yMax: number } | undefined {
  const z = getZone(name);
  if (!z) return undefined;
  return { xMin: z.x, xMax: z.x + z.w, yMin: z.y, yMax: z.y + z.h };
}
