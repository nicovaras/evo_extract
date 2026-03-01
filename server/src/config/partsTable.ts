import { PartDefinition, PartSlot, PartTier } from '@evo/shared';

const TIER_COSTS: Record<PartTier, number> = {
  T1: 55,
  T2: 120,
  T3: 210,
};

export const PARTS_TABLE: PartDefinition[] = [
  // ── Arms ──────────────────────────────────────────────────────────────────
  {
    id: 'garras_rapidas',
    name: 'Garras Rápidas',
    slot: 'Arms',
    tier: 'T1',
    cost: TIER_COSTS.T1,
    statModifiers: { attackRate: 0.5, damage: -3 },
  },
  {
    id: 'martillos_oseos',
    name: 'Martillos Óseos',
    slot: 'Arms',
    tier: 'T2',
    cost: TIER_COSTS.T2,
    statModifiers: { damage: 6, attackRate: -0.4, speed: -0.5 },
  },
  {
    id: 'latigos_tendinosos',
    name: 'Látigos Tendinosos',
    slot: 'Arms',
    tier: 'T3',
    cost: TIER_COSTS.T3,
    statModifiers: { damage: 4, attackRate: 0.3, armor: -1 },
  },

  // ── Legs ──────────────────────────────────────────────────────────────────
  {
    id: 'patas_felinas',
    name: 'Patas Felinas',
    slot: 'Legs',
    tier: 'T1',
    cost: TIER_COSTS.T1,
    statModifiers: { speed: 1.5, maxHp: -15 },
  },
  {
    id: 'piernas_saltador',
    name: 'Piernas Saltador',
    slot: 'Legs',
    tier: 'T2',
    cost: TIER_COSTS.T2,
    // dash cooldown -0.5s tracked via equipped parts; armor penalty here
    statModifiers: { armor: -1 },
  },
  {
    id: 'zancos_queratinosos',
    name: 'Zancos Queratinosos',
    slot: 'Legs',
    tier: 'T3',
    cost: TIER_COSTS.T3,
    // load penalty reduction handled via equipped parts
    statModifiers: { speed: -0.5 },
  },

  // ── Head ──────────────────────────────────────────────────────────────────
  {
    id: 'craneo_cazador',
    name: 'Cráneo Cazador',
    slot: 'Head',
    tier: 'T1',
    cost: TIER_COSTS.T1,
    statModifiers: { critChance: 0.08, critMult: 0.3, attackRate: -0.3 },
  },
  {
    id: 'ojo_compuesto',
    name: 'Ojo Compuesto',
    slot: 'Head',
    tier: 'T2',
    cost: TIER_COSTS.T2,
    statModifiers: { pickupRadius: 1.0, damage: -2 },
  },
  {
    id: 'bulbo_neural',
    name: 'Bulbo Neural',
    slot: 'Head',
    tier: 'T3',
    cost: TIER_COSTS.T3,
    // interaction time -30% handled via equipped parts
    statModifiers: { critChance: 0.05, maxHp: -20 },
  },

  // ── Torso ─────────────────────────────────────────────────────────────────
  {
    id: 'caparazon_ligero',
    name: 'Caparazón Ligero',
    slot: 'Torso',
    tier: 'T1',
    cost: TIER_COSTS.T1,
    statModifiers: { maxHp: 30, armor: 2, speed: -0.5 },
  },
  {
    id: 'masa_muscular',
    name: 'Masa Muscular',
    slot: 'Torso',
    tier: 'T2',
    cost: TIER_COSTS.T2,
    // load penalty 0.85x handled via equipped parts
    statModifiers: { maxHp: 20, critChance: -0.03 },
  },
  {
    id: 'nucleo_regenerativo',
    name: 'Núcleo Regenerativo',
    slot: 'Torso',
    tier: 'T3',
    cost: TIER_COSTS.T3,
    // regen 1HP/s handled via equipped parts
    statModifiers: { lifeSteal: 0.05, speed: -0.5 },
  },
];

export function getPartById(id: string): PartDefinition | undefined {
  return PARTS_TABLE.find((p) => p.id === id);
}

export function getPartsBySlot(slot: PartSlot): PartDefinition[] {
  return PARTS_TABLE.filter((p) => p.slot === slot);
}
