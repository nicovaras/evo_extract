import rawConfig from './enemyConfig.json';

export interface BaseEnemyStats {
  hp: number;
  damage: number;
  speed: number;
  adnDrop: number;
}

export interface RangedStats extends BaseEnemyStats {
  projectileSpeed: number;
  attackCooldown: number;
  range: number;
}

export interface MiniBossAStats extends BaseEnemyStats {
  type: string;
}

export interface MiniBossBStats extends BaseEnemyStats {
  cargoReward: number;
  type: string;
}

export interface EnemyConfig {
  basic: BaseEnemyStats;
  ranged: RangedStats;
  tank: BaseEnemyStats;
  eliteMultipliers: { hp: number; damage: number; speed: number; adnDrop: number };
  miniBossA: MiniBossAStats;
  miniBossB: MiniBossBStats;
}

const config = rawConfig as EnemyConfig;

export type EnemyType = 'basic' | 'ranged' | 'tank';

/**
 * Returns base stats for an enemy type, with elite multipliers applied if isElite=true.
 * adnDrop for elites is replaced by the flat eliteMultipliers.adnDrop value.
 */
export function getEnemyStats(
  type: EnemyType,
  isElite: boolean
): BaseEnemyStats {
  const base = config[type] as BaseEnemyStats;
  if (!isElite) {
    return { hp: base.hp, damage: base.damage, speed: base.speed, adnDrop: base.adnDrop };
  }
  const m = config.eliteMultipliers;
  return {
    hp: Math.round(base.hp * m.hp),
    damage: Math.round(base.damage * m.damage),
    speed: parseFloat((base.speed * m.speed).toFixed(2)),
    adnDrop: m.adnDrop,
  };
}

export const MINIBOSS_A_STATS: MiniBossAStats = config.miniBossA;
export const MINIBOSS_B_STATS: MiniBossBStats = config.miniBossB;
