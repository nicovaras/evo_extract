import { MapSchema } from '@colyseus/schema';
import { AdnNode, GameState } from '../schemas/GameState';
import { getZoneBounds } from '../../../shared/src/mapData';
import adnConfig from '../config/adnConfig.json';

interface ZoneConfig {
  rate: number;
  amount: number;
  maxNodes: number;
}

interface ZoneBounds {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

/** Build zone bounds from map JSON at startup — falls back to empty if zone missing. */
function buildZoneBounds(): Record<string, ZoneBounds> {
  const names = ['hub', 'zoneA', 'zoneB'];
  const result: Record<string, ZoneBounds> = {};
  for (const name of names) {
    const b = getZoneBounds(name);
    if (b) result[name] = b;
    else console.warn(`[AdnSpawner] Zone "${name}" not found in map JSON`);
  }
  return result;
}
const ZONE_BOUNDS: Record<string, ZoneBounds> = buildZoneBounds();

/** Generates a short unique id (no external deps needed). */
function shortId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function countNodesInZone(nodes: MapSchema<AdnNode>, bounds: ZoneBounds): number {
  let count = 0;
  nodes.forEach((node) => {
    if (
      node.active &&
      node.x >= bounds.xMin && node.x <= bounds.xMax &&
      node.y >= bounds.yMin && node.y <= bounds.yMax
    ) {
      count++;
    }
  });
  return count;
}

export class AdnSpawner {
  private intervalHandle: ReturnType<typeof setInterval> | null = null;

  start(adnNodes: MapSchema<AdnNode>, gameState?: GameState): void {
    this.intervalHandle = setInterval(() => {
      if (gameState && !gameState.gameStarted) return;
      this.spawnTick(adnNodes);
    }, adnConfig.spawnIntervalMs);
  }

  stop(): void {
    if (this.intervalHandle !== null) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  private spawnTick(adnNodes: MapSchema<AdnNode>): void {
    for (const [zoneName, cfg] of Object.entries(adnConfig.zones) as [string, ZoneConfig][]) {
      const bounds = ZONE_BOUNDS[zoneName];
      if (!bounds) continue;

      // Roll rate
      if (Math.random() > cfg.rate) continue;

      const currentCount = countNodesInZone(adnNodes, bounds);
      if (currentCount >= cfg.maxNodes) continue;

      const node = new AdnNode();
      node.id = shortId();
      node.x = Math.round(bounds.xMin + Math.random() * (bounds.xMax - bounds.xMin));
      node.y = Math.round(bounds.yMin + Math.random() * (bounds.yMax - bounds.yMin));
      node.amount = cfg.amount;
      node.active = true;

      adnNodes.set(node.id, node);
    }
  }
}
