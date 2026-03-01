import { v4 as uuidv4 } from 'uuid';
import { EnemyState, GameState, PlayerState, ProjectileState } from '../../schemas/GameState';
import { DamageSystem } from '../DamageSystem';
import { resolveWallCollision } from '../WallCollision';

const ENGAGE_RANGE = 160;       // px — approach until this distance
const RETREAT_RANGE = 80;       // px — retreat if closer than this
const SHOOT_COOLDOWN = 1.2;     // seconds
const PROJECTILE_SPEED = 160;   // px/s

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

export function tickRangedBehavior(
  enemy: EnemyState,
  state: GameState,
  dt: number,
  _damageSystem: DamageSystem
): void {
  const target = findTarget(enemy, state);

  if (!target) {
    enemy.behaviorState = 'IDLE';
    return;
  }

  const d = dist(enemy.x, enemy.y, target.x, target.y);

  // Cooldown always ticks
  enemy.shootCooldown -= dt;

  if (d < RETREAT_RANGE) {
    // RETREAT: back away
    enemy.behaviorState = 'RETREAT';
    const dx = enemy.x - target.x;
    const dy = enemy.y - target.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const spd = enemy.speed * 16 * dt;
    enemy.x += (dx / len) * spd;
    enemy.y += (dy / len) * spd;
    const wResolved0 = resolveWallCollision(enemy.x, enemy.y, 16);
    enemy.x = wResolved0.x;
    enemy.y = wResolved0.y;

  } else if (d <= ENGAGE_RANGE) {
    // SHOOT: in range, fire when cooldown ready
    enemy.behaviorState = 'SHOOT';

    if (enemy.shootCooldown <= 0) {
      const dx = target.x - enemy.x;
      const dy = target.y - enemy.y;
      const len = Math.sqrt(dx * dx + dy * dy);

      const proj = new ProjectileState();
      proj.id = uuidv4();
      proj.x = enemy.x;
      proj.y = enemy.y;
      proj.vx = (dx / len) * PROJECTILE_SPEED;
      proj.vy = (dy / len) * PROJECTILE_SPEED;
      proj.damage = enemy.damage;
      proj.ownerId = enemy.id;

      state.projectiles.set(proj.id, proj);
      enemy.shootCooldown = SHOOT_COOLDOWN;
    }

  } else {
    // APPROACH: move closer
    enemy.behaviorState = 'APPROACH';
    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const spd = enemy.speed * 16 * dt;
    enemy.x += (dx / len) * spd;
    enemy.y += (dy / len) * spd;
    const wResolved1 = resolveWallCollision(enemy.x, enemy.y, 16);
    enemy.x = wResolved1.x;
    enemy.y = wResolved1.y;
  }
}
