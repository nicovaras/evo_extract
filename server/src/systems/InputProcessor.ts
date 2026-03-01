import { PlayerState } from '../schemas/GameState';
import { CARRY_SPEED_MULT } from '@evo/shared';
import { resolveWallCollision } from './WallCollision';

export interface InputPayload {
  dx: number;
  dy: number;
  facing: number;
  shooting: boolean;
  dash: boolean;
}

const WORLD_MIN = 0;
const WORLD_MAX = 2000;
const PLAYER_HALF = 16; // half of 32px sprite

export class InputProcessor {
  /**
   * Process one tick of movement for a player.
   * @param player  The Colyseus-synced PlayerState
   * @param input   Latest input payload from client
   * @param delta   Elapsed ms since last tick
   */
  process(player: PlayerState, input: InputPayload, delta: number): void {
    // Downed players can't move or act
    if (player.isDown) return;

    let { dx, dy } = input;

    // Normalize diagonal movement
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 1) {
      dx /= len;
      dy /= len;
    }

    const dt = delta / 1000; // convert ms → seconds
    const carryMult = player.isCarrying ? CARRY_SPEED_MULT : 1.0;
    const speed = player.speed * 100 * carryMult; // convert u/s → px/s (1 unit = 100px)

    player.x += dx * speed * dt;
    player.y += dy * speed * dt;

    // Clamp to world bounds
    player.x = Math.max(WORLD_MIN + PLAYER_HALF, Math.min(WORLD_MAX - PLAYER_HALF, player.x));
    player.y = Math.max(WORLD_MIN + PLAYER_HALF, Math.min(WORLD_MAX - PLAYER_HALF, player.y));

    // Resolve wall collisions
    const resolved = resolveWallCollision(player.x, player.y, 16);
    player.x = resolved.x;
    player.y = resolved.y;

    player.facing = input.facing;
  }
}
