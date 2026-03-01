// ─── Game Phase ────────────────────────────────────────────────────────────────
export type GamePhase = 'early' | 'mid' | 'late';

// ─── Player ────────────────────────────────────────────────────────────────────
export interface PlayerStats {
  maxHp: number;
  hp: number;
  damage: number;
  attackRate: number;
  speed: number;
  armor: number;
  critChance: number;
  critMult: number;
  lifeSteal: number;
  pickupRadius: number;
}

// ─── Cargo ─────────────────────────────────────────────────────────────────────
export interface CargoState {
  id: string;
  x: number;
  y: number;
  isSealed: boolean;
  carrierId: string | null;
}

// ─── Enemies ───────────────────────────────────────────────────────────────────
export type EnemyType = 'BasicMelee' | 'Ranged' | 'Tank';

export interface EnemyStats {
  type: EnemyType;
  hp: number;
  damage: number;
  speed: number;
  isElite: boolean;
}

// ─── Timers ────────────────────────────────────────────────────────────────────
export interface Timers {
  runTime: number;
  phase: GamePhase;
  cargoDelivered: number;
  isExtracting: boolean;
  extractionCountdown: number;
}

// ─── Parts ─────────────────────────────────────────────────────────────────────
export type PartSlot = 'Head' | 'Arms' | 'Legs' | 'Torso' | 'Ranged';
export type PartTier = 'T1' | 'T2' | 'T3';

export interface PartDefinition {
  id: string;
  name: string;
  slot: PartSlot;
  tier: PartTier;
  cost: number;
  statModifiers: Partial<PlayerStats>;
}

export type CraftResult =
  | { success: true; part: PartDefinition }
  | { success: false; reason: string };
