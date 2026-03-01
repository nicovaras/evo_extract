// Walls are now loaded at runtime from the map JSON.
// - Server: uses mapData.ts (Node.js fs loader)
// - Client: uses client/src/mapData.ts (fetch loader)
// This file only re-exports the type for backwards compatibility.
export type { WallRect } from './mapTypes';

// WALLS is kept as empty array here — server overrides via mapData, client via getWalls().
import type { WallRect } from './mapTypes';
export const WALLS: WallRect[] = [];
