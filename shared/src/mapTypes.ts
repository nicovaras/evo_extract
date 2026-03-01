// Shared map types — safe to import from both server and client.
export interface WallRect   { x: number; y: number; w: number; h: number; }
export interface ZoneRect   { name: string; x: number; y: number; w: number; h: number; color?: string; }
export interface SpawnPoint { type: string; x: number; y: number; }

export interface MapData {
  walls:  WallRect[];
  zones:  ZoneRect[];
  spawns: SpawnPoint[];
}
