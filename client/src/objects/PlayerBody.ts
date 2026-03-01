/**
 * PlayerBody — Visual placeholder for a player's equipped parts.
 *
 * The "body" is a Phaser.GameObjects.Container with:
 *   - A central 32×32 square (the base body)
 *   - Up to 5 slot attachments: Head, Arms, Legs, Torso, Ranged
 *
 * Each attachment is a colored rectangle at a fixed offset from center.
 * Color encodes the tier of the equipped part.
 */

export type PartSlot = 'Head' | 'Arms' | 'Legs' | 'Torso' | 'Ranged';

// ── Tier colors ───────────────────────────────────────────────────────────────
const TIER_COLORS: Record<string, number> = {
  T1: 0x88ccff,   // light blue
  T2: 0xffaa33,   // orange
  T3: 0xff44aa,   // pink/magenta
};

// ── Slot layout: offset + size relative to body center ───────────────────────
// Body center is at (0,0). Body itself is 32×32.
const SLOT_LAYOUT: Record<PartSlot, { x: number; y: number; w: number; h: number; label: string }> = {
  Head:   { x:  0,  y: -24, w: 20, h: 12, label: '▲' },   // above
  Arms:   { x: -26, y:   0, w: 12, h: 20, label: '◀' },   // left
  Torso:  { x:  26, y:   0, w: 12, h: 20, label: '▶' },   // right (secondary torso visual)
  Legs:   { x:  0,  y:  24, w: 20, h: 12, label: '▼' },   // below
  Ranged: { x:  20, y: -20, w: 10, h: 10, label: '◆' },   // top-right corner
};

// Parts table (id → slot + tier) — mirrors CraftingPanel
const PART_SLOTS: Record<string, { slot: PartSlot; tier: string }> = {
  garras_rapidas:      { slot: 'Arms',   tier: 'T1' },
  martillos_oseos:     { slot: 'Arms',   tier: 'T2' },
  latigos_tendinosos:  { slot: 'Arms',   tier: 'T3' },
  patas_felinas:       { slot: 'Legs',   tier: 'T1' },
  piernas_saltador:    { slot: 'Legs',   tier: 'T2' },
  zancos_queratinosos: { slot: 'Legs',   tier: 'T3' },
  craneo_cazador:      { slot: 'Head',   tier: 'T1' },
  ojo_compuesto:       { slot: 'Head',   tier: 'T2' },
  bulbo_neural:        { slot: 'Head',   tier: 'T3' },
  caparazon_ligero:    { slot: 'Torso',  tier: 'T1' },
  masa_muscular:       { slot: 'Torso',  tier: 'T2' },
  nucleo_regenerativo: { slot: 'Torso',  tier: 'T3' },
  modulo_ranged:       { slot: 'Ranged', tier: 'T1' },
};

export class PlayerBody {
  readonly container: Phaser.GameObjects.Container;

  private scene: Phaser.Scene;
  private baseBody: Phaser.GameObjects.Rectangle;
  private attachments: Map<PartSlot, Phaser.GameObjects.Container> = new Map();

  // Current equipped part ids (for diffing)
  private _equipped: Set<string> = new Set();

  constructor(scene: Phaser.Scene, x: number, y: number, baseColor = 0x00ff66, depth = 10) {
    this.scene = scene;

    // Base body square
    this.baseBody = scene.add.rectangle(0, 0, 32, 32, baseColor);

    this.container = scene.add.container(x, y, [this.baseBody]);
    this.container.setDepth(depth);
  }

  /** Call whenever equippedParts on the server state changes. */
  updateEquipped(equippedIds: string[]): void {
    const newSet = new Set(equippedIds);

    // Check if anything actually changed
    const same = newSet.size === this._equipped.size &&
      [...newSet].every(id => this._equipped.has(id));
    if (same) return;

    this._equipped = newSet;
    this._rebuild();
  }

  /** Reposition container to follow a physics body */
  setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  /** Match rotation of the base player sprite */
  setRotation(r: number): void {
    this.container.rotation = r;
  }

  destroy(): void {
    this.container.destroy();
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  private _rebuild(): void {
    // Remove old attachments
    for (const [, att] of this.attachments) {
      this.container.remove(att, true);
    }
    this.attachments.clear();

    // Build new ones from equipped list
    const slotMap = new Map<PartSlot, string>(); // slot → partId (last one wins)
    for (const id of this._equipped) {
      const def = PART_SLOTS[id];
      if (def) slotMap.set(def.slot, id);
    }

    for (const [slot, partId] of slotMap) {
      const def = PART_SLOTS[partId]!;
      const layout = SLOT_LAYOUT[slot];
      const color = TIER_COLORS[def.tier] ?? 0xffffff;

      const rect = this.scene.add.rectangle(0, 0, layout.w, layout.h, color, 1);

      // Tier indicator: small dot in top-right of attachment
      const dot = this.scene.add.circle(
        layout.w / 2 - 3,
        -layout.h / 2 + 3,
        2,
        def.tier === 'T1' ? 0xffffff : def.tier === 'T2' ? 0xffd700 : 0xff00ff,
        0.9,
      );

      // Glow outline matching tier
      const outline = this.scene.add.rectangle(0, 0, layout.w + 2, layout.h + 2, color, 0.25);

      const att = this.scene.add.container(layout.x, layout.y, [outline, rect, dot]);
      this.attachments.set(slot, att);
      this.container.add(att);
    }
  }
}
