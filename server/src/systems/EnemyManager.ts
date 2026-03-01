import { GameState, EnemyState, CargoState } from '../schemas/GameState';
import { getEnemyStats, MINIBOSS_A_STATS, MINIBOSS_B_STATS, EnemyType } from '../config/enemyConfig';

let _eidCounter = 0;

export class EnemyManager {
  private state: GameState;

  constructor(state: GameState) {
    this.state = state;
  }

  /**
   * Spawns an enemy, returns its generated id.
   */
  spawnEnemy(
    type: EnemyType | 'miniBossA' | 'miniBossB',
    x: number,
    y: number,
    isElite: boolean = false,
    isBoss: boolean = false
  ): string {
    const id = `e${++_eidCounter}_${Date.now()}`;
    const enemy = new EnemyState();
    enemy.id = id;
    enemy.x = x;
    enemy.y = y;
    enemy.isElite = isElite;
    enemy.isBoss = isBoss;

    if (type === 'miniBossA') {
      enemy.type = MINIBOSS_A_STATS.type;
      enemy.hp = MINIBOSS_A_STATS.hp;
      enemy.maxHp = MINIBOSS_A_STATS.hp;
      enemy.damage = MINIBOSS_A_STATS.damage;
      enemy.speed = MINIBOSS_A_STATS.speed;
      enemy.adnDrop = MINIBOSS_A_STATS.adnDrop;
    } else if (type === 'miniBossB') {
      enemy.type = MINIBOSS_B_STATS.type;
      enemy.hp = MINIBOSS_B_STATS.hp;
      enemy.maxHp = MINIBOSS_B_STATS.hp;
      enemy.damage = MINIBOSS_B_STATS.damage;
      enemy.speed = MINIBOSS_B_STATS.speed;
      enemy.adnDrop = MINIBOSS_B_STATS.adnDrop;
    } else {
      const stats = getEnemyStats(type, isElite);
      enemy.type = type;
      enemy.hp = stats.hp;
      enemy.maxHp = stats.hp;
      enemy.damage = stats.damage;
      enemy.speed = stats.speed;
      enemy.adnDrop = stats.adnDrop;
    }

    this.state.enemies.set(id, enemy);
    return id;
  }

  /**
   * Removes an enemy from the state. Returns the adnDrop amount and
   * whether it was a mini-boss B (for cargo reward).
   */
  removeEnemy(id: string): { adnDrop: number; isMiniBossB: boolean; x: number; y: number } {
    const enemy = this.state.enemies.get(id);
    if (!enemy) return { adnDrop: 0, isMiniBossB: false, x: 0, y: 0 };

    const adnDrop = enemy.adnDrop;
    const isMiniBossB = enemy.isBoss && enemy.type === 'tank';
    const x = enemy.x;
    const y = enemy.y;

    this.state.enemies.delete(id);
    return { adnDrop, isMiniBossB, x, y };
  }

  /**
   * Returns all enemies within `radius` of (x, y).
   */
  getEnemiesInRadius(x: number, y: number, radius: number): EnemyState[] {
    const result: EnemyState[] = [];
    const r2 = radius * radius;
    this.state.enemies.forEach((enemy) => {
      const dx = enemy.x - x;
      const dy = enemy.y - y;
      if (dx * dx + dy * dy <= r2) {
        result.push(enemy);
      }
    });
    return result;
  }

  /**
   * Spawns a sealed CargoState at (x, y) with no carrier — used on mini-boss B death.
   */
  spawnCargo(x: number, y: number): string {
    const id = `cargo_boss_${Date.now()}`;
    const cargo = new CargoState();
    cargo.id = id;
    cargo.x = x;
    cargo.y = y;
    cargo.isSealed = true;
    cargo.carrierId = '';
    this.state.cargo.set(id, cargo);
    return id;
  }

  get enemyCount(): number {
    return this.state.enemies.size;
  }
}
