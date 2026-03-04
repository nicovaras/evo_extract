import { EnemyState, GameState, PlayerState } from '../../schemas/GameState';
import { DamageSystem } from '../DamageSystem';
import { resolveWallCollision } from '../WallCollision';
import { inZone } from '../../../../shared/src/mapData';

const ATTACK_RANGE = 22; // px
const HUB_SAFE_DURATION = 300; // seconds (5 min)
const ATTACK_COOLDOWN = 1.0; // seconds

function dist(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

function findTarget(enemy: EnemyState, state: GameState): PlayerState | null {
  let target: PlayerState | null = null;
  let bestDist = Infinity;

  state.players.forEach((player) => {
    if (player.isDown) return;
    const d = dist(enemy.x, enemy.y, player.x, player.y);
    if (player.isCarrying && (target === null || !target.isCarrying || d < bestDist)) {
      target = player;
      bestDist = d;
    } else if (!player.isCarrying && target === null) {
      target = player;
      bestDist = d;
    } else if (!player.isCarrying && target !== null && !target.isCarrying && d < bestDist) {
      target = player;
      bestDist = d;
    }
  });

  return target;
}

export function tickTankBehavior(
  enemy: EnemyState,
  state: GameState,
  dt: number,
  damageSystem: DamageSystem
): void {
  // Tank ignores knockback — flag is set on spawn, no extra logic needed here
  const target = findTarget(enemy, state);

  if (!target) {
    enemy.behaviorState = 'IDLE';
    return;
  }

  // During the first 5 minutes, enemies don't enter the hub.
  // If the target is inside the hub, go idle.
  if (state.timers.runTime < HUB_SAFE_DURATION && inZone('hub', target.x, target.y)) {
    enemy.behaviorState = 'IDLE';
    return;
  }

  const d = dist(enemy.x, enemy.y, target.x, target.y);

  if (d <= ATTACK_RANGE) {
    enemy.behaviorState = 'ATTACK';

    enemy.attackCooldown -= dt;
    if (enemy.attackCooldown <= 0) {
      const kbStrength = 400;
      const dx = target.x - enemy.x;
      const dy = target.y - enemy.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      damageSystem.applyDamageToPlayer(target, enemy.damage, {
        x: (dx / len) * kbStrength,
        y: (dy / len) * kbStrength,
      });
      enemy.attackCooldown = ATTACK_COOLDOWN;
    }
  } else {
    enemy.behaviorState = 'CHASE';

    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const spd = enemy.speed * 16 * dt;
    enemy.x += (dx / len) * spd;
    enemy.y += (dy / len) * spd;

    const wResolved = resolveWallCollision(enemy.x, enemy.y, 16);
    enemy.x = wResolved.x;
    enemy.y = wResolved.y;

    enemy.attackCooldown -= dt;
  }
}
