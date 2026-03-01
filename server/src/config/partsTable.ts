import { PartDefinition, PartSlot, PartTier } from '@evo/shared';

const TIER_COSTS: Record<PartTier, number> = {
  T1: 55,
  T2: 120,
  T3: 210,
};

export const PARTS_TABLE: PartDefinition[] = [
  // ── Arms — daño visible, hay que sentir cada tier ─────────────────────────
  {
    id: 'garras_rapidas',
    name: 'Garras Rápidas',
    slot: 'Arms',   tier: 'T1', cost: TIER_COSTS.T1,
    statModifiers: { attackRate: 0.8, damage: -4 },   // más rápido pero algo menos dmg
  },
  {
    id: 'martillos_oseos',
    name: 'Martillos Óseos',
    slot: 'Arms',   tier: 'T2', cost: TIER_COSTS.T2,
    statModifiers: { damage: 14, attackRate: -0.3, speed: -0.5 }, // +14 dmg se nota muchísimo
  },
  {
    id: 'latigos_tendinosos',
    name: 'Látigos Tendinosos',
    slot: 'Arms',   tier: 'T3', cost: TIER_COSTS.T3,
    statModifiers: { damage: 10, attackRate: 0.5, armor: -1 },    // velocidad + daño
  },

  // ── Legs — movilidad y supervivencia ─────────────────────────────────────
  {
    id: 'patas_felinas',
    name: 'Patas Felinas',
    slot: 'Legs',   tier: 'T1', cost: TIER_COSTS.T1,
    statModifiers: { speed: 2.0, maxHp: -10 },         // +2 speed se siente en la esquiva
  },
  {
    id: 'piernas_saltador',
    name: 'Piernas Saltador',
    slot: 'Legs',   tier: 'T2', cost: TIER_COSTS.T2,
    statModifiers: { speed: 1.0, armor: -1, attackRate: 0.3 }, // dash + ataque más rápido
  },
  {
    id: 'zancos_queratinosos',
    name: 'Zancos Queratinosos',
    slot: 'Legs',   tier: 'T3', cost: TIER_COSTS.T3,
    statModifiers: { speed: 1.5, maxHp: 20, carryPenalty: -0.25 }, // carga: penalidad -25%
  },

  // ── Head — crit e inteligencia ────────────────────────────────────────────
  {
    id: 'craneo_cazador',
    name: 'Cráneo Cazador',
    slot: 'Head',   tier: 'T1', cost: TIER_COSTS.T1,
    statModifiers: { critChance: 0.15, critMult: 0.5, attackRate: -0.2 }, // crits notorios
  },
  {
    id: 'ojo_compuesto',
    name: 'Ojo Compuesto',
    slot: 'Head',   tier: 'T2', cost: TIER_COSTS.T2,
    statModifiers: { pickupRadius: 2.0, damage: 5 },    // radio doble + algo de daño
  },
  {
    id: 'bulbo_neural',
    name: 'Bulbo Neural',
    slot: 'Head',   tier: 'T3', cost: TIER_COSTS.T3,
    statModifiers: { critChance: 0.10, critMult: 0.8, maxHp: -15, interactSpeed: 0.5 }, // glass cannon + interacción 50% más rápida
  },

  // ── Torso — tanquear ──────────────────────────────────────────────────────
  {
    id: 'caparazon_ligero',
    name: 'Caparazón Ligero',
    slot: 'Torso',  tier: 'T1', cost: TIER_COSTS.T1,
    statModifiers: { maxHp: 50, armor: 3, speed: -0.5 },  // mucha vida extra (+50 es ~40% más)
  },
  {
    id: 'masa_muscular',
    name: 'Masa Muscular',
    slot: 'Torso',  tier: 'T2', cost: TIER_COSTS.T2,
    statModifiers: { maxHp: 40, armor: 2, critChance: -0.05, carryPenalty: -0.15 }, // tanque + carga más fácil
  },
  {
    id: 'nucleo_regenerativo',
    name: 'Núcleo Regenerativo',
    slot: 'Torso',  tier: 'T3', cost: TIER_COSTS.T3,
    statModifiers: { lifeSteal: 0.12, maxHp: 30, speed: -0.3 }, // regen 1HP/s + lifesteal 12%
  },

  // ── Ranged — cambia el modo de ataque ─────────────────────────────────────
  {
    id: 'modulo_ranged',
    name: 'Módulo de Disparo',
    slot: 'Ranged', tier: 'T1', cost: 60,
    statModifiers: { damage: -6 },   // ranged siempre hace menos que melee
  },
];

export function getPartById(id: string): PartDefinition | undefined {
  return PARTS_TABLE.find((p) => p.id === id);
}

export function getPartsBySlot(slot: PartSlot): PartDefinition[] {
  return PARTS_TABLE.filter((p) => p.slot === slot);
}
