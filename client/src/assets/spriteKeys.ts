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
export const SPRITE_PLAYER = 'player_base';

// ── Parts (slot attachments) ──────────────────────────────────────────────────
// One sprite per slot×tier combination.
// Maps part ID → sprite key.
// Multiple variants share the same slot×tier sprite until unique sprites are added.
export const SPRITE_PARTS: Record<string, string> = {
  // ── Arms T1
  garras_rapidas: 'part_arms_t1_1',
  espinas_afiladas: 'part_arms_t1_2',
  tenazas_acidas: 'part_arms_t1_3',
  plumas_cortantes: 'part_arms_t1_4',
  nudillos_duros: 'part_arms_t1_5',
  // ── Arms T2
  martillos_oseos: 'part_arms_t2_1',
  cuchillas_vibrantes: 'part_arms_t2_2',
  garfios_de_caza: 'part_arms_t2_3',
  brazos_pistonicos: 'part_arms_t2_4',
  lanzas_membranosas: 'part_arms_t2_5',
  // ── Arms T3
  latigos_tendinosos: 'part_arms_t3_1',
  colmillos_venenosos: 'part_arms_t3_2',
  mazo_quitinoso: 'part_arms_t3_3',
  sierra_osea: 'part_arms_t3_4',
  garra_rapaz: 'part_arms_t3_5',
  // ── Legs T1
  patas_felinas: 'part_legs_t1_1',
  zancas_largas: 'part_legs_t1_2',
  membranas_saltadoras: 'part_legs_t1_3',
  patas_de_muelle: 'part_legs_t1_4',
  tendones_elasticos: 'part_legs_t1_5',
  // ── Legs T2
  piernas_saltador: 'part_legs_t2_1',
  musculos_acelerados: 'part_legs_t2_2',
  patas_ciclopes: 'part_legs_t2_3',
  articulaciones_hidraulicas: 'part_legs_t2_4',
  piernas_blindadas: 'part_legs_t2_5',
  // ── Legs T3
  zancos_queratinosos: 'part_legs_t3_1',
  propulsores_organicos: 'part_legs_t3_2',
  exoesqueleto_inferior: 'part_legs_t3_3',
  corredores_micelares: 'part_legs_t3_4',
  patas_parasitas: 'part_legs_t3_5',
  // ── Head T1
  craneo_cazador: 'part_head_t1_1',
  antenas_receptoras: 'part_head_t1_2',
  oculos_depredador: 'part_head_t1_3',
  mandibulas_extra: 'part_head_t1_4',
  cresta_sensorial: 'part_head_t1_5',
  // ── Head T2
  ojo_compuesto: 'part_head_t2_1',
  lobulo_tactico: 'part_head_t2_2',
  cerebro_auxiliar: 'part_head_t2_3',
  cuernos_ofensivos: 'part_head_t2_4',
  cabeza_blindada: 'part_head_t2_5',
  // ── Head T3
  bulbo_neural: 'part_head_t3_1',
  nodo_psiquico: 'part_head_t3_2',
  hemisferio_tactil: 'part_head_t3_3',
  cortex_bestial: 'part_head_t3_4',
  procesador_biomecanico: 'part_head_t3_5',
  // ── Torso T1
  caparazon_ligero: 'part_torso_t1_1',
  membrana_absorbente: 'part_torso_t1_2',
  torso_acelerado: 'part_torso_t1_3',
  costillas_externas: 'part_torso_t1_4',
  exoderma_fino: 'part_torso_t1_5',
  // ── Torso T2
  masa_muscular: 'part_torso_t2_1',
  placas_ceramicas: 'part_torso_t2_2',
  fibras_reactivas: 'part_torso_t2_3',
  torso_de_acero: 'part_torso_t2_4',
  coraza_adaptativa: 'part_torso_t2_5',
  // ── Torso T3
  nucleo_regenerativo: 'part_torso_t3_1',
  reactor_vital: 'part_torso_t3_2',
  blindaje_total: 'part_torso_t3_3',
  matriz_simbiotica: 'part_torso_t3_4',
  corazon_reforzado: 'part_torso_t3_5',
  // ── Ranged
  modulo_ranged: 'part_ranged_t1',
};

// ── Enemies ───────────────────────────────────────────────────────────────────
export const SPRITE_ENEMY_BASIC = 'enemy_basic';
export const SPRITE_ENEMY_BASIC_ELITE = 'enemy_basic_elite';
export const SPRITE_ENEMY_RANGED = 'enemy_ranged';
export const SPRITE_ENEMY_RANGED_ELITE = 'enemy_ranged_elite';
export const SPRITE_ENEMY_TANK = 'enemy_tank';
export const SPRITE_ENEMY_TANK_ELITE = 'enemy_tank_elite';
export const SPRITE_ENEMY_BOSS_A = 'enemy_boss_a';
export const SPRITE_ENEMY_BOSS_B = 'enemy_boss_b';

export function enemySpriteKey(
  type: string,
  isElite: boolean,
  isBoss: boolean,
  bossId?: string
): string {
  if (isBoss) return bossId === 'miniBossB' ? SPRITE_ENEMY_BOSS_B : SPRITE_ENEMY_BOSS_A;
  if (isElite) {
    if (type === 'ranged') return SPRITE_ENEMY_RANGED_ELITE;
    if (type === 'tank') return SPRITE_ENEMY_TANK_ELITE;
    return SPRITE_ENEMY_BASIC_ELITE;
  }
  if (type === 'ranged') return SPRITE_ENEMY_RANGED;
  if (type === 'tank') return SPRITE_ENEMY_TANK;
  return SPRITE_ENEMY_BASIC;
}

// ── World ─────────────────────────────────────────────────────────────────────
export const SPRITE_BG_FLOOR = 'bg_floor';
export const SPRITE_WALL = 'wall';
export const SPRITE_WALL_VARIANTS = ['wall_a', 'wall_b', 'wall_c'];
export const SPRITE_ADN_NODE = 'adn_node';
export const SPRITE_CARGO = 'cargo';
export const SPRITE_BULLET = 'bullet';

// ── All keys (used by preloader) ──────────────────────────────────────────────
export const ALL_SPRITES: { key: string; file: string }[] = [
  // Player
  { key: SPRITE_PLAYER, file: 'player_base.png' },

  // Parts
  { key: 'part_arms_t1_1', file: 'part_arms_t1_1.png' },
  { key: 'part_arms_t1_2', file: 'part_arms_t1_2.png' },
  { key: 'part_arms_t1_3', file: 'part_arms_t1_3.png' },
  { key: 'part_arms_t1_4', file: 'part_arms_t1_4.png' },
  { key: 'part_arms_t1_5', file: 'part_arms_t1_5.png' },

  { key: 'part_arms_t2_1', file: 'part_arms_t2_1.png' },
  { key: 'part_arms_t2_2', file: 'part_arms_t2_2.png' },
  { key: 'part_arms_t2_3', file: 'part_arms_t2_3.png' },
  { key: 'part_arms_t2_4', file: 'part_arms_t2_4.png' },
  { key: 'part_arms_t2_5', file: 'part_arms_t2_5.png' },

  { key: 'part_arms_t3_1', file: 'part_arms_t3_1.png' },
  { key: 'part_arms_t3_2', file: 'part_arms_t3_2.png' },
  { key: 'part_arms_t3_3', file: 'part_arms_t3_3.png' },
  { key: 'part_arms_t3_4', file: 'part_arms_t3_4.png' },
  { key: 'part_arms_t3_5', file: 'part_arms_t3_5.png' },

  { key: 'part_legs_t1_1', file: 'part_legs_t1_1.png' },
  { key: 'part_legs_t1_2', file: 'part_legs_t1_2.png' },
  { key: 'part_legs_t1_3', file: 'part_legs_t1_3.png' },
  { key: 'part_legs_t1_4', file: 'part_legs_t1_4.png' },
  { key: 'part_legs_t1_5', file: 'part_legs_t1_5.png' },

  { key: 'part_legs_t2_1', file: 'part_legs_t2_1.png' },
  { key: 'part_legs_t2_2', file: 'part_legs_t2_2.png' },
  { key: 'part_legs_t2_3', file: 'part_legs_t2_3.png' },
  { key: 'part_legs_t2_4', file: 'part_legs_t2_4.png' },
  { key: 'part_legs_t2_5', file: 'part_legs_t2_5.png' },

  { key: 'part_legs_t3_1', file: 'part_legs_t3_1.png' },
  { key: 'part_legs_t3_2', file: 'part_legs_t3_2.png' },
  { key: 'part_legs_t3_3', file: 'part_legs_t3_3.png' },
  { key: 'part_legs_t3_4', file: 'part_legs_t3_4.png' },
  { key: 'part_legs_t3_5', file: 'part_legs_t3_5.png' },

  { key: 'part_head_t1_1', file: 'part_head_t1_1.png' },
  { key: 'part_head_t1_2', file: 'part_head_t1_2.png' },
  { key: 'part_head_t1_3', file: 'part_head_t1_3.png' },
  { key: 'part_head_t1_4', file: 'part_head_t1_4.png' },
  { key: 'part_head_t1_5', file: 'part_head_t1_5.png' },

  { key: 'part_head_t2_1', file: 'part_head_t2_1.png' },
  { key: 'part_head_t2_2', file: 'part_head_t2_2.png' },
  { key: 'part_head_t2_3', file: 'part_head_t2_3.png' },
  { key: 'part_head_t2_4', file: 'part_head_t2_4.png' },
  { key: 'part_head_t2_5', file: 'part_head_t2_5.png' },

  { key: 'part_head_t3_1', file: 'part_head_t3_1.png' },
  { key: 'part_head_t3_2', file: 'part_head_t3_2.png' },
  { key: 'part_head_t3_3', file: 'part_head_t3_3.png' },
  { key: 'part_head_t3_4', file: 'part_head_t3_4.png' },
  { key: 'part_head_t3_5', file: 'part_head_t3_5.png' },

  { key: 'part_torso_t1_1', file: 'part_torso_t1_1.png' },
  { key: 'part_torso_t1_2', file: 'part_torso_t1_2.png' },
  { key: 'part_torso_t1_3', file: 'part_torso_t1_3.png' },
  { key: 'part_torso_t1_4', file: 'part_torso_t1_4.png' },
  { key: 'part_torso_t1_5', file: 'part_torso_t1_5.png' },

  { key: 'part_torso_t2_1', file: 'part_torso_t2_1.png' },
  { key: 'part_torso_t2_2', file: 'part_torso_t2_2.png' },
  { key: 'part_torso_t2_3', file: 'part_torso_t2_3.png' },
  { key: 'part_torso_t2_4', file: 'part_torso_t2_4.png' },
  { key: 'part_torso_t2_5', file: 'part_torso_t2_5.png' },

  { key: 'part_torso_t3_1', file: 'part_torso_t3_1.png' },
  { key: 'part_torso_t3_2', file: 'part_torso_t3_2.png' },
  { key: 'part_torso_t3_3', file: 'part_torso_t3_3.png' },
  { key: 'part_torso_t3_4', file: 'part_torso_t3_4.png' },
  { key: 'part_torso_t3_5', file: 'part_torso_t3_5.png' },
  { key: 'part_ranged_t1', file: 'part_ranged_t1.png' },

  // Enemies
  { key: SPRITE_ENEMY_BASIC, file: 'enemy_basic.png' },
  { key: SPRITE_ENEMY_BASIC_ELITE, file: 'enemy_basic_elite.png' },
  { key: SPRITE_ENEMY_RANGED, file: 'enemy_ranged.png' },
  { key: SPRITE_ENEMY_RANGED_ELITE, file: 'enemy_ranged_elite.png' },
  { key: SPRITE_ENEMY_TANK, file: 'enemy_tank.png' },
  { key: SPRITE_ENEMY_TANK_ELITE, file: 'enemy_tank_elite.png' },
  { key: SPRITE_ENEMY_BOSS_A, file: 'enemy_boss_a.png' },
  { key: SPRITE_ENEMY_BOSS_B, file: 'enemy_boss_b.png' },

  // World
  { key: SPRITE_BG_FLOOR, file: 'bg_floor.png' },
  { key: SPRITE_WALL, file: 'wall.png' },
  { key: 'wall_a', file: 'wall_a.png' },
  { key: 'wall_b', file: 'wall_b.png' },
  { key: 'wall_c', file: 'wall_c.png' },
  { key: SPRITE_ADN_NODE, file: 'adn_node.png' },
  { key: SPRITE_CARGO, file: 'cargo.png' },
  { key: SPRITE_BULLET, file: 'bullet.png' },
];
