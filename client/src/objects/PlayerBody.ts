import { SPRITE_PLAYER, SPRITE_PARTS } from '../assets/spriteKeys';

export type PartSlot = 'Head' | 'Arms' | 'Legs' | 'Torso' | 'Ranged';



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
  private baseBody: Phaser.GameObjects.Image;
  private attachments: Map<PartSlot, Phaser.GameObjects.Container> = new Map();

  // Current equipped part ids (for diffing)
  private _equipped: Set<string> = new Set();

  constructor(scene: Phaser.Scene, x: number, y: number, _baseColor = 0x00ff66, depth = 10) {
    this.scene = scene;

    // Base body square
    this.baseBody = scene.add.image(0, 0, SPRITE_PLAYER).setDisplaySize(32, 32);

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
      const layout = SLOT_LAYOUT[slot];
      const spriteKey = SPRITE_PARTS[partId];

      const img = this.scene.add.image(0, 0, spriteKey).setDisplaySize(layout.w, layout.h);

      const att = this.scene.add.container(layout.x, layout.y, [img]);
      this.attachments.set(slot, att);
      this.container.add(att);
    }
  }
}
