import { GameState, GameTimers } from '../schemas/GameState';
import { WIPE_TIMEOUT, RUN_TIME_LIMIT } from '@evo/shared';

export type LoseReason = 'wipe' | 'timeout';

export interface WinLoseResult {
  lose: boolean;
  reason?: LoseReason;
}

export class WinLoseChecker {
  /** Timestamp (ms) when all players first went down simultaneously */
  private wipeStartTime: number | null = null;

  checkWipe(state: GameState): boolean {
    if (state.players.size === 0) return false;

    let allDown = true;
    state.players.forEach((p) => {
      if (!p.isDown) allDown = false;
    });

    if (allDown) {
      if (this.wipeStartTime === null) {
        this.wipeStartTime = Date.now();
      }
      const elapsed = (Date.now() - this.wipeStartTime) / 1000;
      return elapsed >= WIPE_TIMEOUT;
    } else {
      this.wipeStartTime = null;
      return false;
    }
  }

  checkTimeout(timers: GameTimers): boolean {
    return timers.runTime >= RUN_TIME_LIMIT;
  }

  check(state: GameState): WinLoseResult {
    if (this.checkWipe(state)) {
      return { lose: true, reason: 'wipe' };
    }
    if (this.checkTimeout(state.timers)) {
      return { lose: true, reason: 'timeout' };
    }
    return { lose: false };
  }
}
