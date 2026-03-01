/**
 * Canonical sprite key registry.
 * All keys here must have a corresponding file in client/public/sprites/.
 *
 * Naming convention:
 *   - Lowercase, underscores
 *   - Enemies:    enemy_<type>[_elite][_boss]
 *   - Parts:      part_<slot>_<tier>   (slot lowercase, tier t1/t2/t3)
 *   - Player:     player_base
 *   - World:      bg_floor, wall, adn_node, cargo, bullet
 */

// ── Player ────────────────────────────────────────────────────────────────────
export const SPRITE_PLAYER      = 'player_base';

// ── Parts (slot attachments) ──────────────────────────────────────────────────
// One sprite per slot×tier combination.
export const SPRITE_PARTS: Record<string, string> = {
  // Arms
  garras_rapidas:      'part_arms_t1',
  martillos_oseos:     'part_arms_t2',
  latigos_tendinosos:  'part_arms_t3',
  // Legs
  patas_felinas:       'part_legs_t1',
  piernas_saltador:    'part_legs_t2',
  zancos_queratinosos: 'part_legs_t3',
  // Head
  craneo_cazador:      'part_head_t1',
  ojo_compuesto:       'part_head_t2',
  bulbo_neural:        'part_head_t3',
  // Torso
  caparazon_ligero:    'part_torso_t1',
  masa_muscular:       'part_torso_t2',
  nucleo_regenerativo: 'part_torso_t3',
  // Ranged
  modulo_ranged:       'part_ranged_t1',
};

// ── Enemies ───────────────────────────────────────────────────────────────────
export const SPRITE_ENEMY_BASIC       = 'enemy_basic';
export const SPRITE_ENEMY_BASIC_ELITE = 'enemy_basic_elite';
export const SPRITE_ENEMY_RANGED      = 'enemy_ranged';
export const SPRITE_ENEMY_RANGED_ELITE= 'enemy_ranged_elite';
export const SPRITE_ENEMY_TANK        = 'enemy_tank';
export const SPRITE_ENEMY_TANK_ELITE  = 'enemy_tank_elite';
export const SPRITE_ENEMY_BOSS_A      = 'enemy_boss_a';
export const SPRITE_ENEMY_BOSS_B      = 'enemy_boss_b';

export function enemySpriteKey(type: string, isElite: boolean, isBoss: boolean, bossId?: string): string {
  if (isBoss) return bossId === 'miniBossB' ? SPRITE_ENEMY_BOSS_B : SPRITE_ENEMY_BOSS_A;
  if (isElite) {
    if (type === 'ranged') return SPRITE_ENEMY_RANGED_ELITE;
    if (type === 'tank')   return SPRITE_ENEMY_TANK_ELITE;
    return SPRITE_ENEMY_BASIC_ELITE;
  }
  if (type === 'ranged') return SPRITE_ENEMY_RANGED;
  if (type === 'tank')   return SPRITE_ENEMY_TANK;
  return SPRITE_ENEMY_BASIC;
}

// ── World ─────────────────────────────────────────────────────────────────────
export const SPRITE_BG_FLOOR  = 'bg_floor';
export const SPRITE_WALL      = 'wall';
export const SPRITE_ADN_NODE  = 'adn_node';
export const SPRITE_CARGO     = 'cargo';
export const SPRITE_BULLET    = 'bullet';

// ── All keys (used by preloader) ──────────────────────────────────────────────
export const ALL_SPRITES: { key: string; file: string }[] = [
  // Player
  { key: SPRITE_PLAYER,             file: 'player_base.png' },

  // Parts
  { key: 'part_arms_t1',            file: 'part_arms_t1.png' },
  { key: 'part_arms_t2',            file: 'part_arms_t2.png' },
  { key: 'part_arms_t3',            file: 'part_arms_t3.png' },
  { key: 'part_legs_t1',            file: 'part_legs_t1.png' },
  { key: 'part_legs_t2',            file: 'part_legs_t2.png' },
  { key: 'part_legs_t3',            file: 'part_legs_t3.png' },
  { key: 'part_head_t1',            file: 'part_head_t1.png' },
  { key: 'part_head_t2',            file: 'part_head_t2.png' },
  { key: 'part_head_t3',            file: 'part_head_t3.png' },
  { key: 'part_torso_t1',           file: 'part_torso_t1.png' },
  { key: 'part_torso_t2',           file: 'part_torso_t2.png' },
  { key: 'part_torso_t3',           file: 'part_torso_t3.png' },
  { key: 'part_ranged_t1',          file: 'part_ranged_t1.png' },

  // Enemies
  { key: SPRITE_ENEMY_BASIC,        file: 'enemy_basic.png' },
  { key: SPRITE_ENEMY_BASIC_ELITE,  file: 'enemy_basic_elite.png' },
  { key: SPRITE_ENEMY_RANGED,       file: 'enemy_ranged.png' },
  { key: SPRITE_ENEMY_RANGED_ELITE, file: 'enemy_ranged_elite.png' },
  { key: SPRITE_ENEMY_TANK,         file: 'enemy_tank.png' },
  { key: SPRITE_ENEMY_TANK_ELITE,   file: 'enemy_tank_elite.png' },
  { key: SPRITE_ENEMY_BOSS_A,       file: 'enemy_boss_a.png' },
  { key: SPRITE_ENEMY_BOSS_B,       file: 'enemy_boss_b.png' },

  // World
  { key: SPRITE_BG_FLOOR,           file: 'bg_floor.png' },
  { key: SPRITE_WALL,               file: 'wall.png' },
  { key: SPRITE_ADN_NODE,           file: 'adn_node.png' },
  { key: SPRITE_CARGO,              file: 'cargo.png' },
  { key: SPRITE_BULLET,             file: 'bullet.png' },
];
