import { Room } from 'colyseus';
import { Client } from 'colyseus';
import { GameState, PlayerState } from '../schemas/GameState';

const REVIVE_RANGE = 48;          // px — max distance to start/maintain revive
const REVIVE_DURATION = 2500;     // ms
const REVIVE_HP_FRACTION = 0.4;   // revived at 40% maxHp

interface ReviveEntry {
  targetId: string;
  startTime: number;
}

export class ReviveSystem {
  /** reviverSessionId → ReviveEntry */
  private activeRevives = new Map<string, ReviveEntry>();

  constructor(private room: Room<GameState>) {
    // Register message handlers
    room.onMessage('startRevive', (client: Client, { targetId }: { targetId: string }) => {
      this.startRevive(client.sessionId, targetId);
    });

    room.onMessage('cancelRevive', (client: Client) => {
      this.cancelRevive(client.sessionId);
    });
  }

  private dist(a: PlayerState, b: PlayerState): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  startRevive(reviverId: string, targetId: string): void {
    const state = this.room.state as GameState;
    const reviver = state.players.get(reviverId);
    const target = state.players.get(targetId);

    if (!reviver || !target) return;
    if (reviver.isDown) return;
    if (!target.isDown) return;
    const dist = this.dist(reviver, target);
    if (dist > REVIVE_RANGE) {
      console.log('[ReviveSystem] too far:', dist, 'range:', REVIVE_RANGE);
      return;
    }

    // Cancel any existing revive this player was doing
    this.activeRevives.delete(reviverId);

    this.activeRevives.set(reviverId, { targetId, startTime: Date.now() });

    this.room.broadcast('reviveStarted', {
      reviverId,
      targetId,
      duration: REVIVE_DURATION,
    });
  }

  cancelRevive(reviverId: string): void {
    if (!this.activeRevives.has(reviverId)) return;
    this.activeRevives.delete(reviverId);
    this.room.broadcast('reviveCancelled', { reviverId });
  }

  tick(): void {
    const state = this.room.state as GameState;
    const now = Date.now();

    this.activeRevives.forEach((entry, reviverId) => {
      const reviver = state.players.get(reviverId);
      const target = state.players.get(entry.targetId);

      // Abort if players gone or states invalid
      if (!reviver || !target || reviver.isDown || !target.isDown) {
        this.cancelRevive(reviverId);
        return;
      }

      // Cancel if reviver moved too far
      if (this.dist(reviver, target) > REVIVE_RANGE) {
        this.cancelRevive(reviverId);
        return;
      }

      // Check completion
      if (now - entry.startTime >= REVIVE_DURATION) {
        target.isDown = false;
        target.hp = Math.floor(target.maxHp * REVIVE_HP_FRACTION);
        this.activeRevives.delete(reviverId);

        this.room.broadcast('reviveComplete', {
          reviverId,
          targetId: entry.targetId,
          hp: target.hp,
        });
      }
    });
  }
}
