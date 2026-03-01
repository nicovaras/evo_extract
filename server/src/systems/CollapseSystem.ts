import { Room } from 'colyseus';
import { GameState, ToxicZoneState } from '../schemas/GameState';
import { getZoneBounds } from '@evo/shared/mapData';
import collapseConfig from '../config/collapseConfig.json';

const MAX_MINUTE = 13;

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Returns a random point inside zone A or zone B (from map JSON). */
function randCoord(): number {
  const a = getZoneBounds('zoneA');
  const b = getZoneBounds('zoneB');
  if (Math.random() < 0.5) {
    return a ? rand(a.xMin + 50, a.xMax - 50) : rand(50, 700);
  } else {
    return b ? rand(b.xMin + 50, b.xMax - 50) : rand(1300, 1950);
  }
}

export class CollapseSystem {
  private dps: number = collapseConfig.damagePerSecond;
  private lastMinute: number = 0;
  // id → { x, y, width, height }
  private activeZones = new Map<string, { x: number; y: number; width: number; height: number }>();

  /** Call once after room is created */
  init(_state: GameState, _room: Room<GameState>): void {
    // No pre-defined zones — zones are generated dynamically each minute
  }

  tick(state: GameState, room: Room<GameState>, deltaMs: number): void {
    const currentMinute = Math.floor(state.timers.runTime / 60);

    // Generate new zones at the start of each new full minute (1–MAX_MINUTE)
    if (
      state.gameStarted &&
      currentMinute > this.lastMinute &&
      currentMinute <= MAX_MINUTE
    ) {
      this.lastMinute = currentMinute;
      const count = rand(1, 2);

      for (let i = 0; i < count; i++) {
        const id = `zone_${currentMinute}_${i}`;
        const width = rand(80, 200);
        const height = rand(80, 200);
        const x = randCoord();
        const y = randCoord();

        // Register in state
        const tz = new ToxicZoneState();
        tz.id = id;
        tz.x = x;
        tz.y = y;
        tz.width = width;
        tz.height = height;
        tz.active = true;
        state.toxicZones.set(id, tz);

        // Track locally for damage
        this.activeZones.set(id, { x, y, width, height });

        // Broadcast to all clients with full geometry
        room.broadcast('toxicZoneActivated', { id, x, y, width, height });
      }
    }

    // Apply toxic damage
    if (this.activeZones.size === 0) return;

    state.players.forEach((player) => {
      for (const zone of this.activeZones.values()) {
        if (
          player.x >= zone.x &&
          player.x <= zone.x + zone.width &&
          player.y >= zone.y &&
          player.y <= zone.y + zone.height
        ) {
          const dmg = this.dps * (deltaMs / 1000);
          player.hp = Math.max(0, player.hp - dmg);
          room.clients.forEach((client) => {
            if (client.sessionId === player.id) {
              client.send('playerHit', {
                damage: dmg,
                source: 'toxic',
                hp: player.hp,
                maxHp: player.maxHp,
              });
            }
          });
          break;
        }
      }
    });
  }
}
