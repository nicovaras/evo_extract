import { PartDefinition, PartSlot, PartTier } from './types';

// Base ranges: T1 35-55, T2 55-75, T3 65-85
// Cost reflects power level: pure upsides cost more, trade-offs cost less

// ─── ALL PARTS ────────────────────────────────────────────────────────────────
// 5 variants per slot per tier (4 slots × 3 tiers × 5 = 60 parts)
// Ranged is handled separately (always available, not randomised).

export const ALL_PARTS: PartDefinition[] = [
  // ══════════════════════════════════════════════════════════════════════════
  // ARMS T1
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'garras_rapidas',
    name: 'Garras Rápidas',
    slot: 'Arms',
    tier: 'T1',
    cost: 42,
    statModifiers: { attackRate: 0.8, damage: -4 },
  },
  {
    id: 'espinas_afiladas',
    name: 'Espinas Afiladas',
    slot: 'Arms',
    tier: 'T1',
    cost: 48,
    statModifiers: { damage: 6, attackRate: -0.3 },
  },
  {
    id: 'tenazas_acidas',
    name: 'Tenazas Ácidas',
    slot: 'Arms',
    tier: 'T1',
    cost: 35,
    statModifiers: { damage: 4, armor: -2 },
  },
  {
    id: 'plumas_cortantes',
    name: 'Plumas Cortantes',
    slot: 'Arms',
    tier: 'T1',
    cost: 55,
    statModifiers: { attackRate: 1.2, maxHp: -15 },
  },
  {
    id: 'nudillos_duros',
    name: 'Nudillos Duros',
    slot: 'Arms',
    tier: 'T1',
    cost: 55,
    statModifiers: { damage: 2, armor: 1 },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ARMS T2
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'martillos_oseos',
    name: 'Martillos Óseos',
    slot: 'Arms',
    tier: 'T2',
    cost: 55,
    statModifiers: { damage: 14, attackRate: -0.3, speed: -0.5 },
  },
  {
    id: 'cuchillas_vibrantes',
    name: 'Cuchillas Vibrantes',
    slot: 'Arms',
    tier: 'T2',
    cost: 70,
    statModifiers: { damage: 8, attackRate: 0.4, critChance: -0.05 },
  },
  {
    id: 'garfios_de_caza',
    name: 'Garfios de Caza',
    slot: 'Arms',
    tier: 'T2',
    cost: 65,
    statModifiers: { damage: 6, critChance: 0.1, armor: -1 },
  },
  {
    id: 'brazos_pistonicos',
    name: 'Brazos Pistónicos',
    slot: 'Arms',
    tier: 'T2',
    cost: 75,
    statModifiers: { damage: 10, lifeSteal: 0.05, maxHp: -20 },
  },
  {
    id: 'lanzas_membranosas',
    name: 'Lanzas Membranosas',
    slot: 'Arms',
    tier: 'T2',
    cost: 60,
    statModifiers: { damage: 12, speed: -1.0, maxHp: -10 },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ARMS T3
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'latigos_tendinosos',
    name: 'Látigos Tendinosos',
    slot: 'Arms',
    tier: 'T3',
    cost: 76,
    statModifiers: { damage: 10, attackRate: 0.5, armor: -1 },
  },
  {
    id: 'colmillos_venenosos',
    name: 'Colmillos Venenosos',
    slot: 'Arms',
    tier: 'T3',
    cost: 72,
    statModifiers: { damage: 8, lifeSteal: 0.15, speed: -0.5 },
  },
  {
    id: 'mazo_quitinoso',
    name: 'Mazo Quitinoso',
    slot: 'Arms',
    tier: 'T3',
    cost: 65,
    statModifiers: { damage: 20, attackRate: -0.8, speed: -0.5 },
  },
  {
    id: 'sierra_osea',
    name: 'Sierra Ósea',
    slot: 'Arms',
    tier: 'T3',
    cost: 78,
    statModifiers: { damage: 12, critChance: 0.15, maxHp: -25 },
  },
  {
    id: 'garra_rapaz',
    name: 'Garra Rápaz',
    slot: 'Arms',
    tier: 'T3',
    cost: 85,
    statModifiers: { damage: 8, attackRate: 1.0, critChance: 0.05, armor: -2 },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // LEGS T1
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'patas_felinas',
    name: 'Patas Felinas',
    slot: 'Legs',
    tier: 'T1',
    cost: 55,
    statModifiers: { speed: 2.0, maxHp: -10 },
  },
  {
    id: 'zancas_largas',
    name: 'Zancas Largas',
    slot: 'Legs',
    tier: 'T1',
    cost: 48,
    statModifiers: { speed: 1.0, carryPenalty: -0.15 },
  },
  {
    id: 'membranas_saltadoras',
    name: 'Membranas Saltadoras',
    slot: 'Legs',
    tier: 'T1',
    cost: 42,
    statModifiers: { speed: 0.5, armor: 1 },
  },
  {
    id: 'patas_de_muelle',
    name: 'Patas de Muelle',
    slot: 'Legs',
    tier: 'T1',
    cost: 48,
    statModifiers: { speed: 1.5, attackRate: -0.2 },
  },
  {
    id: 'tendones_elasticos',
    name: 'Tendones Elásticos',
    slot: 'Legs',
    tier: 'T1',
    cost: 48,
    statModifiers: { speed: 0.8, pickupRadius: 0.5 },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // LEGS T2
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'piernas_saltador',
    name: 'Piernas Saltador',
    slot: 'Legs',
    tier: 'T2',
    cost: 65,
    statModifiers: { speed: 1.0, armor: -1, attackRate: 0.3 },
  },
  {
    id: 'musculos_acelerados',
    name: 'Músculos Acelerados',
    slot: 'Legs',
    tier: 'T2',
    cost: 55,
    statModifiers: { speed: 2.0, maxHp: -20, armor: -1 },
  },
  {
    id: 'patas_ciclopes',
    name: 'Patas Cíclopes',
    slot: 'Legs',
    tier: 'T2',
    cost: 70,
    statModifiers: { speed: 0.5, maxHp: 30, carryPenalty: -0.2 },
  },
  {
    id: 'articulaciones_hidraulicas',
    name: 'Articulaciones Hidráulicas',
    slot: 'Legs',
    tier: 'T2',
    cost: 75,
    statModifiers: { speed: 1.2, carryPenalty: -0.3, critChance: -0.05 },
  },
  {
    id: 'piernas_blindadas',
    name: 'Piernas Blindadas',
    slot: 'Legs',
    tier: 'T2',
    cost: 65,
    statModifiers: { armor: 3, speed: -0.5, maxHp: 20 },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // LEGS T3
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'zancos_queratinosos',
    name: 'Zancos Queratinosos',
    slot: 'Legs',
    tier: 'T3',
    cost: 76,
    statModifiers: { speed: 1.5, maxHp: 20, carryPenalty: -0.25 },
  },
  {
    id: 'propulsores_organicos',
    name: 'Propulsores Orgánicos',
    slot: 'Legs',
    tier: 'T3',
    cost: 67,
    statModifiers: { speed: 3.0, maxHp: -30, armor: -2 },
  },
  {
    id: 'exoesqueleto_inferior',
    name: 'Exoesqueleto Inferior',
    slot: 'Legs',
    tier: 'T3',
    cost: 78,
    statModifiers: { speed: 0.5, armor: 4, maxHp: 40, attackRate: -0.3 },
  },
  {
    id: 'corredores_micelares',
    name: 'Corredores Micelares',
    slot: 'Legs',
    tier: 'T3',
    cost: 81,
    statModifiers: { speed: 2.0, carryPenalty: -0.4, critChance: -0.1 },
  },
  {
    id: 'patas_parasitas',
    name: 'Patas Parásitas',
    slot: 'Legs',
    tier: 'T3',
    cost: 74,
    statModifiers: { speed: 1.5, lifeSteal: 0.08, maxHp: -15 },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // HEAD T1
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'craneo_cazador',
    name: 'Cráneo Cazador',
    slot: 'Head',
    tier: 'T1',
    cost: 48,
    statModifiers: { critChance: 0.15, critMult: 0.5, attackRate: -0.2 },
  },
  {
    id: 'antenas_receptoras',
    name: 'Antenas Receptoras',
    slot: 'Head',
    tier: 'T1',
    cost: 55,
    statModifiers: { pickupRadius: 1.0, damage: 2 },
  },
  {
    id: 'oculos_depredador',
    name: 'Óculos Depredador',
    slot: 'Head',
    tier: 'T1',
    cost: 42,
    statModifiers: { critChance: 0.1, critMult: 0.3 },
  },
  {
    id: 'mandibulas_extra',
    name: 'Mandíbulas Extra',
    slot: 'Head',
    tier: 'T1',
    cost: 48,
    statModifiers: { attackRate: 0.4, critChance: -0.03 },
  },
  {
    id: 'cresta_sensorial',
    name: 'Cresta Sensorial',
    slot: 'Head',
    tier: 'T1',
    cost: 48,
    statModifiers: { critChance: 0.08, armor: 1 },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // HEAD T2
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'ojo_compuesto',
    name: 'Ojo Compuesto',
    slot: 'Head',
    tier: 'T2',
    cost: 65,
    statModifiers: { pickupRadius: 2.0, damage: 5 },
  },
  {
    id: 'lobulo_tactico',
    name: 'Lóbulo Táctico',
    slot: 'Head',
    tier: 'T2',
    cost: 70,
    statModifiers: { critChance: 0.15, critMult: 0.4, pickupRadius: -0.5 },
  },
  {
    id: 'cerebro_auxiliar',
    name: 'Cerebro Auxiliar',
    slot: 'Head',
    tier: 'T2',
    cost: 65,
    statModifiers: { interactSpeed: 0.3, pickupRadius: 1.0 },
  },
  {
    id: 'cuernos_ofensivos',
    name: 'Cuernos Ofensivos',
    slot: 'Head',
    tier: 'T2',
    cost: 75,
    statModifiers: { damage: 8, critChance: 0.08, maxHp: -15 },
  },
  {
    id: 'cabeza_blindada',
    name: 'Cabeza Blindada',
    slot: 'Head',
    tier: 'T2',
    cost: 60,
    statModifiers: { armor: 3, maxHp: 25, critChance: -0.05 },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // HEAD T3
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'bulbo_neural',
    name: 'Bulbo Neural',
    slot: 'Head',
    tier: 'T3',
    cost: 76,
    statModifiers: { critChance: 0.1, critMult: 0.8, maxHp: -15, interactSpeed: 0.5 },
  },
  {
    id: 'nodo_psiquico',
    name: 'Nodo Psíquico',
    slot: 'Head',
    tier: 'T3',
    cost: 72,
    statModifiers: { critChance: 0.2, critMult: 1.0, speed: -0.5, armor: -1 },
  },
  {
    id: 'hemisferio_tactil',
    name: 'Hemisferio Táctil',
    slot: 'Head',
    tier: 'T3',
    cost: 78,
    statModifiers: { pickupRadius: 3.0, interactSpeed: 0.5, critChance: 0.05 },
  },
  {
    id: 'cortex_bestial',
    name: 'Córtex Bestial',
    slot: 'Head',
    tier: 'T3',
    cost: 83,
    statModifiers: { damage: 10, critChance: 0.15, critMult: 0.5, maxHp: -30 },
  },
  {
    id: 'procesador_biomecanico',
    name: 'Procesador Biomecánico',
    slot: 'Head',
    tier: 'T3',
    cost: 81,
    statModifiers: { interactSpeed: 0.8, critMult: 0.6, pickupRadius: 1.5, attackRate: -0.2 },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // TORSO T1
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'caparazon_ligero',
    name: 'Caparazón Ligero',
    slot: 'Torso',
    tier: 'T1',
    cost: 55,
    statModifiers: { maxHp: 50, armor: 3, speed: -0.5 },
  },
  {
    id: 'membrana_absorbente',
    name: 'Membrana Absorbente',
    slot: 'Torso',
    tier: 'T1',
    cost: 48,
    statModifiers: { armor: 4, maxHp: -10 },
  },
  {
    id: 'torso_acelerado',
    name: 'Torso Acelerado',
    slot: 'Torso',
    tier: 'T1',
    cost: 48,
    statModifiers: { attackRate: 0.3, speed: 0.5, armor: -1 },
  },
  {
    id: 'costillas_externas',
    name: 'Costillas Externas',
    slot: 'Torso',
    tier: 'T1',
    cost: 55,
    statModifiers: { maxHp: 30, armor: 2 },
  },
  {
    id: 'exoderma_fino',
    name: 'Exoderma Fino',
    slot: 'Torso',
    tier: 'T1',
    cost: 48,
    statModifiers: { maxHp: 20, lifeSteal: 0.04 },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // TORSO T2
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'masa_muscular',
    name: 'Masa Muscular',
    slot: 'Torso',
    tier: 'T2',
    cost: 70,
    statModifiers: { maxHp: 40, armor: 2, critChance: -0.05, carryPenalty: -0.15 },
  },
  {
    id: 'placas_ceramicas',
    name: 'Placas Cerámicas',
    slot: 'Torso',
    tier: 'T2',
    cost: 65,
    statModifiers: { armor: 5, maxHp: 20, speed: -0.8 },
  },
  {
    id: 'fibras_reactivas',
    name: 'Fibras Reactivas',
    slot: 'Torso',
    tier: 'T2',
    cost: 75,
    statModifiers: { attackRate: 0.5, lifeSteal: 0.06, maxHp: -20 },
  },
  {
    id: 'torso_de_acero',
    name: 'Torso de Acero',
    slot: 'Torso',
    tier: 'T2',
    cost: 65,
    statModifiers: { armor: 4, maxHp: 30, attackRate: -0.2 },
  },
  {
    id: 'coraza_adaptativa',
    name: 'Coraza Adaptativa',
    slot: 'Torso',
    tier: 'T2',
    cost: 70,
    statModifiers: { armor: 3, maxHp: 25, carryPenalty: -0.2 },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // TORSO T3
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'nucleo_regenerativo',
    name: 'Núcleo Regenerativo',
    slot: 'Torso',
    tier: 'T3',
    cost: 76,
    statModifiers: { lifeSteal: 0.12, maxHp: 30, speed: -0.3 },
  },
  {
    id: 'reactor_vital',
    name: 'Reactor Vital',
    slot: 'Torso',
    tier: 'T3',
    cost: 69,
    statModifiers: { lifeSteal: 0.2, maxHp: -20, armor: -1 },
  },
  {
    id: 'blindaje_total',
    name: 'Blindaje Total',
    slot: 'Torso',
    tier: 'T3',
    cost: 65,
    statModifiers: { armor: 8, maxHp: 60, speed: -1.5, attackRate: -0.3 },
  },
  {
    id: 'matriz_simbiotica',
    name: 'Matriz Simbiótica',
    slot: 'Torso',
    tier: 'T3',
    cost: 83,
    statModifiers: { lifeSteal: 0.1, maxHp: 40, armor: 3, critChance: -0.08 },
  },
  {
    id: 'corazon_reforzado',
    name: 'Corazón Reforzado',
    slot: 'Torso',
    tier: 'T3',
    cost: 81,
    statModifiers: { maxHp: 80, armor: 2, speed: -0.8, critChance: -0.1 },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // RANGED — always available, not randomised
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'modulo_ranged',
    name: 'Módulo de Disparo',
    slot: 'Ranged',
    tier: 'T1',
    cost: 62,
    statModifiers: { damage: -2 },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SLOTS_FOR_POOL: PartSlot[] = ['Head', 'Arms', 'Legs', 'Torso'];
const TIERS: PartTier[] = ['T1', 'T2', 'T3'];

export function getPartById(id: string): PartDefinition | undefined {
  return ALL_PARTS.find((p) => p.id === id);
}

export function getPartsBySlot(slot: PartSlot): PartDefinition[] {
  return ALL_PARTS.filter((p) => p.slot === slot);
}

/**
 * Returns a random pool of part IDs for one player:
 * 1 random variant per slot+tier combo (4 slots × 3 tiers = 12 IDs).
 * Ranged is excluded — it's always available separately.
 */
export function rollPartPool(): string[] {
  const pool: string[] = [];
  for (const slot of SLOTS_FOR_POOL) {
    for (const tier of TIERS) {
      const candidates = ALL_PARTS.filter((p) => p.slot === slot && p.tier === tier);
      if (candidates.length === 0) continue;
      const picked = candidates[Math.floor(Math.random() * candidates.length)];
      pool.push(picked.id);
    }
  }
  return pool;
}
