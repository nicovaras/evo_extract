import { GameState } from '../schemas/GameState';
import { EnemyManager } from './EnemyManager';
import { EnemyType } from '../config/enemyConfig';
import { getZoneBounds, getSpawn } from '../../../shared/src/mapData';

export interface SpawnEvent {
  id: string;
  type: string;
  x: number;
  y: number;
  isElite: boolean;
  isBoss: boolean;
}

// Enemy caps by phase (base values for 1 player — scale with player count)
const MAX_ENEMIES_EARLY_BASE = 5;
const MAX_ENEMIES_MID_BASE = 10;
const MAX_ENEMIES_LATE_BASE = 16;

function maxEnemiesForPhase(phase: string, playerCount: number): number {
  const scale = Math.max(1, playerCount);
  if (phase === 'early') return MAX_ENEMIES_EARLY_BASE + (scale - 1) * 3;
  if (phase === 'mid') return MAX_ENEMIES_MID_BASE + (scale - 1) * 5;
  return MAX_ENEMIES_LATE_BASE + (scale - 1) * 6;
}

// Returns a random point INSIDE a zone rect (with margin to avoid wall edges)
const SPAWN_MARGIN = 60;
function randomInsideZone(
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number
): { x: number; y: number } {
  return {
    x: xMin + SPAWN_MARGIN + Math.random() * Math.max(0, xMax - xMin - SPAWN_MARGIN * 2),
    y: yMin + SPAWN_MARGIN + Math.random() * Math.max(0, yMax - yMin - SPAWN_MARGIN * 2),
  };
}

function randomZoneA() {
  const b = getZoneBounds('zoneA') ?? { xMin: 0, xMax: 700, yMin: 0, yMax: 700 };
  return randomInsideZone(b.xMin, b.xMax, b.yMin, b.yMax);
}
function randomZoneB() {
  const b = getZoneBounds('zoneB') ?? { xMin: 1300, xMax: 2000, yMin: 1300, yMax: 2000 };
  return randomInsideZone(b.xMin, b.xMax, b.yMin, b.yMax);
}

function pickZone(): () => { x: number; y: number } {
  return Math.random() < 0.5 ? randomZoneA : randomZoneB;
}

export class SpawnDirector {
  private spawnAccum: number = 0;
  private manager: EnemyManager;

  miniBossASpawned: boolean = false;
  miniBossBSpawned: boolean = false;

  constructor(manager: EnemyManager) {
    this.manager = manager;
  }

  tick(state: GameState, deltaMs: number): SpawnEvent[] {
    const events: SpawnEvent[] = [];
    const runTime = state.timers.runTime;
    const phase = state.timers.phase;

    // Update phase based on runTime
    if (runTime < 240) {
      state.timers.phase = 'early';
    } else if (runTime < 510) {
      state.timers.phase = 'mid';
    } else {
      state.timers.phase = 'late';
    }

    // ── Mini-boss triggers — spawn at fixed times, no position gate ───────
    if (runTime >= 240 && !this.miniBossASpawned) {
      const sp = getSpawn('miniBossA') ?? { x: 451, y: 808 };
      const id = this.manager.spawnEnemy('miniBossA', sp.x, sp.y, false, true);
      events.push({ id, type: 'miniBossA', x: sp.x, y: sp.y, isElite: false, isBoss: true });
      this.miniBossASpawned = true;
      console.log(`[SpawnDirector] Mini-boss A spawned at (${sp.x}, ${sp.y})`);
    }

    if (runTime >= 420 && !this.miniBossBSpawned) {
      const sp = getSpawn('miniBossB') ?? { x: 1507, y: 737 };
      const id = this.manager.spawnEnemy('miniBossB', sp.x, sp.y, false, true);
      events.push({ id, type: 'miniBossB', x: sp.x, y: sp.y, isElite: false, isBoss: true });
      this.miniBossBSpawned = true;
      console.log(`[SpawnDirector] Mini-boss B spawned at (${sp.x}, ${sp.y})`);
    }

    // ── Regular spawn timer ─────────────────────────────────────────────────
    const playerCount = state.players.size;
    const maxEnemies = maxEnemiesForPhase(phase, playerCount);

    if (this.manager.enemyCount >= maxEnemies) {
      return events;
    }

    const intervalMs = phase === 'early' ? 5000 : phase === 'mid' ? 2500 : 1800;
    this.spawnAccum += deltaMs;

    while (this.spawnAccum >= intervalMs && this.manager.enemyCount < maxEnemies) {
      this.spawnAccum -= intervalMs;
      const newEvents = this._spawnWave(state, phase, maxEnemies);
      events.push(...newEvents);
    }

    return events;
  }

  private _spawnWave(state: GameState, phase: string, maxEnemies: number): SpawnEvent[] {
    const events: SpawnEvent[] = [];
    const playerCount = Math.max(1, state.players.size);
    // Wave size grows with phase and player count
    const baseCount =
      phase === 'early'
        ? Math.random() < 0.5
          ? 1
          : 2
        : phase === 'mid'
          ? Math.random() < 0.4
            ? 2
            : 3
          : Math.random() < 0.3
            ? 3
            : 4;
    const count = Math.min(
      baseCount + Math.floor((playerCount - 1) * 0.5),
      maxEnemies - this.manager.enemyCount
    );

    for (let i = 0; i < count; i++) {
      if (this.manager.enemyCount >= maxEnemies) break;

      const type = this._pickType(phase);
      const isElite = this._rollElite(phase);
      const pos = pickZone()();

      const id = this.manager.spawnEnemy(type, pos.x, pos.y, isElite, false);
      events.push({ id, type, x: pos.x, y: pos.y, isElite, isBoss: false });
    }

    return events;
  }

  private _pickType(phase: string): EnemyType {
    const r = Math.random();
    if (phase === 'early') return 'basic'; // solo melee al principio, aprender el ritmo
    if (phase === 'mid') return r < 0.15 ? 'tank' : r < 0.45 ? 'ranged' : 'basic';
    // late: 25% tank, 40% ranged, 35% basic
    if (r < 0.25) return 'tank';
    if (r < 0.65) return 'ranged';
    return 'basic';
  }

  private _rollElite(phase: string): boolean {
    const threshold = phase === 'early' ? 0.05 : phase === 'mid' ? 0.2 : 0.4;
    return Math.random() < threshold;
  }
}
