import { SPRITE_PLAYER, SPRITE_RIP, SPRITE_PARTS } from '../assets/spriteKeys';
import { getPartById } from '@evo/shared';

export type PartSlot = 'Head' | 'Arms' | 'Legs' | 'Torso' | 'Ranged';

// ── Slot layout: offset + size relative to body center ───────────────────────
// Body center is at (0,0). Body itself is 32×32.
const SLOT_LAYOUT: Record<PartSlot, { x: number; y: number; w: number; h: number; label: string }> =
  {
    Head: { x: 0, y: -16, w: 24, h: 24, label: '▲' }, // above
    Arms: { x: 0, y: 0, w: 64, h: 20, label: '◀' }, // left
    Torso: { x: -2, y: 0, w: 42, h: 24, label: '▶' }, // right (secondary torso visual)
    Legs: { x: 0, y: 16, w: 32, h: 20, label: '▼' }, // below
    Ranged: { x: 20, y: -20, w: 10, h: 10, label: '◆' }, // top-right corner
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
    const same =
      newSet.size === this._equipped.size && [...newSet].every((id) => this._equipped.has(id));
    if (same) return;

    this._equipped = newSet;
    this._rebuild();
  }

  /** Switch to/from the RIP sprite on death/revive */
  setDowned(isDowned: boolean): void {
    this.baseBody.setTexture(isDowned ? SPRITE_RIP : SPRITE_PLAYER);
    // Hide parts while dead, show them when alive
    for (const [, att] of this.attachments) {
      att.setVisible(!isDowned);
    }
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
      const def = getPartById(id);
      if (def) slotMap.set(def.slot as PartSlot, id);
    }

    for (const [slot, partId] of slotMap) {
      const layout = SLOT_LAYOUT[slot];
      const spriteKey = SPRITE_PARTS[partId];
      if (!spriteKey || !this.scene.textures.exists(spriteKey)) continue;

      const img = this.scene.add.image(0, 0, spriteKey).setDisplaySize(layout.w, layout.h);

      const att = this.scene.add.container(layout.x, layout.y, [img]);
      this.attachments.set(slot, att);
      this.container.add(att);
    }
  }
}
