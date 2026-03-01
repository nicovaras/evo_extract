import { Room } from 'colyseus';
import { EnemyState, GameState, PlayerState } from '../schemas/GameState';

export interface DamageResult {
  damage: number;
  isCrit: boolean;
  killed?: boolean;
  adnDrop?: number;
}

export class DamageSystem {
  constructor(private room: Room<GameState>) {}

  applyDamageToPlayer(player: PlayerState, rawDamage: number, knockback?: { x: number; y: number }): DamageResult {
    const damage = Math.max(1, rawDamage - player.armor);
    player.hp = Math.max(0, player.hp - damage);

    // Life steal (Núcleo Regenerativo)
    if (player.lifeSteal > 0) {
      const heal = damage * player.lifeSteal;
      player.hp = Math.min(player.maxHp, player.hp + heal);
    }

    if (player.hp <= 0) {
      player.isDown = true;
      player.hp = 0;
      player.downedAt = Date.now();
    }

    // Apply knockback to server-side position
    if (knockback) {
      const dt = 0.05; // approx one tick
      player.x = Math.max(16, Math.min(1984, player.x + knockback.x * dt));
      player.y = Math.max(16, Math.min(1984, player.y + knockback.y * dt));
    }

    this.room.broadcast('playerHit', {
      sessionId: player.id,
      damage,
      hp: player.hp,
      maxHp: player.maxHp,
      remaining: player.hp,
      isDown: player.isDown,
      knockbackX: knockback?.x ?? 0,
      knockbackY: knockback?.y ?? 0,
    });

    return { damage, isCrit: false };
  }

  applyPlayerAttackToEnemy(enemy: EnemyState, player: PlayerState): DamageResult {
    let damage = player.attackDamage;
    let isCrit = false;

    if (Math.random() < player.critChance) {
      damage = Math.floor(damage * player.critMult);
      isCrit = true;
    }

    enemy.hp = Math.max(0, enemy.hp - damage);

    if (enemy.hp <= 0) {
      return { damage, isCrit, killed: true, adnDrop: enemy.adnDrop ?? 8 };
    }

    return { damage, isCrit, killed: false };
  }
}
