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

// Max pixels per substep — smaller than the thinnest wall (30px) to prevent tunneling
const MAX_STEP_PX = 12;

export class InputProcessor {
  process(player: PlayerState, input: InputPayload, delta: number): void {
    if (player.isDown) return;

    let { dx, dy } = input;

    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 1) { dx /= len; dy /= len; }

    const dt = delta / 1000;
    const carryMult = player.isCarrying ? CARRY_SPEED_MULT : 1.0;
    const speed = player.speed * 100 * carryMult;

    // Total displacement this tick
    const totalX = dx * speed * dt;
    const totalY = dy * speed * dt;
    const totalDist = Math.sqrt(totalX * totalX + totalY * totalY);

    // Subdivide movement into steps no larger than MAX_STEP_PX
    const steps = Math.max(1, Math.ceil(totalDist / MAX_STEP_PX));
    const stepX = totalX / steps;
    const stepY = totalY / steps;

    for (let i = 0; i < steps; i++) {
      player.x += stepX;
      player.y += stepY;

      // Clamp to world
      player.x = Math.max(WORLD_MIN + PLAYER_HALF, Math.min(WORLD_MAX - PLAYER_HALF, player.x));
      player.y = Math.max(WORLD_MIN + PLAYER_HALF, Math.min(WORLD_MAX - PLAYER_HALF, player.y));

      // Resolve walls each substep
      const resolved = resolveWallCollision(player.x, player.y, PLAYER_HALF);
      player.x = resolved.x;
      player.y = resolved.y;
    }

    player.facing = input.facing;
  }
}
