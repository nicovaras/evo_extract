import Phaser from 'phaser';
import * as Colyseus from 'colyseus.js';
import { PartDefinition, PartSlot, CraftResult } from '@evo/shared';

// Inline parts table (mirrors server config — avoids a server round-trip for UI)
const PARTS: PartDefinition[] = [
  // Arms
  { id: 'garras_rapidas',      name: 'Garras Rápidas',       slot: 'Arms',  tier: 'T1', cost: 55,  statModifiers: { attackRate: 0.8,  damage: -4 } },
  { id: 'martillos_oseos',     name: 'Martillos Óseos',      slot: 'Arms',  tier: 'T2', cost: 120, statModifiers: { damage: 14, attackRate: -0.3, speed: -0.5 } },
  { id: 'latigos_tendinosos',  name: 'Látigos Tendinosos',   slot: 'Arms',  tier: 'T3', cost: 210, statModifiers: { damage: 10, attackRate: 0.5, armor: -1 } },
  // Legs
  { id: 'patas_felinas',       name: 'Patas Felinas',        slot: 'Legs',  tier: 'T1', cost: 55,  statModifiers: { speed: 2.0, maxHp: -10 } },
  { id: 'piernas_saltador',    name: 'Piernas Saltador',     slot: 'Legs',  tier: 'T2', cost: 120, statModifiers: { speed: 1.0, armor: -1, attackRate: 0.3 } },
  { id: 'zancos_queratinosos', name: 'Zancos Queratinosos',  slot: 'Legs',  tier: 'T3', cost: 210, statModifiers: { speed: 1.5, maxHp: 20, carryPenalty: -0.25 } },
  // Head
  { id: 'craneo_cazador',      name: 'Cráneo Cazador',       slot: 'Head',  tier: 'T1', cost: 55,  statModifiers: { critChance: 0.15, critMult: 0.5, attackRate: -0.2 } },
  { id: 'ojo_compuesto',       name: 'Ojo Compuesto',        slot: 'Head',  tier: 'T2', cost: 120, statModifiers: { pickupRadius: 2.0, damage: 5 } },
  { id: 'bulbo_neural',        name: 'Bulbo Neural',         slot: 'Head',  tier: 'T3', cost: 210, statModifiers: { critChance: 0.10, critMult: 0.8, maxHp: -15, interactSpeed: 0.5 } },
  // Torso
  { id: 'caparazon_ligero',    name: 'Caparazón Ligero',     slot: 'Torso', tier: 'T1', cost: 55,  statModifiers: { maxHp: 50, armor: 3, speed: -0.5 } },
  { id: 'masa_muscular',       name: 'Masa Muscular',        slot: 'Torso', tier: 'T2', cost: 120, statModifiers: { maxHp: 40, armor: 2, critChance: -0.05, carryPenalty: -0.15 } },
  { id: 'nucleo_regenerativo', name: 'Núcleo Regenerativo',  slot: 'Torso', tier: 'T3', cost: 210, statModifiers: { lifeSteal: 0.12, maxHp: 30, speed: -0.3 } },
  // Ranged
  { id: 'modulo_ranged',       name: 'Módulo de Disparo',    slot: 'Ranged', tier: 'T1', cost: 60,  statModifiers: { damage: -6 } },
];

const SLOTS: PartSlot[] = ['Head', 'Arms', 'Legs', 'Torso', 'Ranged'];
const SLOT_LABELS: Record<PartSlot, string> = { Head: '🧠 Head', Arms: '💪 Arms', Legs: '🦵 Legs', Torso: '🛡 Torso', Ranged: '🔫 Ranged' };
const TIER_COLORS: Record<string, string> = { T1: '#aaffaa', T2: '#aaaaff', T3: '#ffaaaa' };

const EXTRA_EFFECTS: Record<string, string> = {
  piernas_saltador:    '  · Dash CD -0.5s',
  nucleo_regenerativo: '  · Regen 1HP/s base',
  modulo_ranged:       '  · Activa ataque a distancia',
};

function formatModifiers(mods: Partial<Record<string, number>>): string {
  const lines: string[] = [];
  const labels: Record<string, string> = {
    speed: 'Vel', maxHp: 'MaxHP', damage: 'Daño', attackRate: 'Cadencia',
    armor: 'Armor', critChance: 'Crit%', critMult: 'CritX', lifeSteal: 'LifeSteal',
    pickupRadius: 'Radio ADN', carryPenalty: 'Carga pen.', interactSpeed: 'Interacción',
  };
  for (const [key, val] of Object.entries(mods)) {
    if (val === undefined) continue;
    const sign = val > 0 ? '+' : '';
    lines.push(`  · ${labels[key] ?? key}: ${sign}${val}`);
  }
  return lines.join('\n');
}

const PANEL_W = 600;
const PANEL_H = 540;
const DEPTH = 100;

export class CraftingPanel {
  private scene: Phaser.Scene;
  private room: Colyseus.Room;

  private _visible = false;

  // All persistent elements (bg, tabs, feedback)
  private elements: Phaser.GameObjects.GameObject[] = [];
  // Content elements rebuilt per-tab
  private contentElements: Phaser.GameObjects.GameObject[] = [];

  // Tab button refs for color updates
  private tabButtons: Partial<Record<PartSlot, Phaser.GameObjects.Text>> = {};
  // Feedback text ref
  private feedbackText!: Phaser.GameObjects.Text;

  // Hold-to-craft state
  private holdTimer: ReturnType<typeof setTimeout> | null = null;
  private holdInterval: ReturnType<typeof setInterval> | null = null;
  private holdPartId: string | null = null;

  // Feedback timeout
  private feedbackTimeout: ReturnType<typeof setTimeout> | null = null;

  // Tab state
  private activeTab: PartSlot = 'Head';

  // Panel origin (top-left), computed at build time
  private ox = 0;
  private oy = 0;

  constructor(scene: Phaser.Scene, room: Colyseus.Room) {
    this.scene = scene;
    this.room = room;
    this._build();
    this._listenCraftResult();
    this.hide();
  }

  // ── Public API ────────────────────────────────────────────────────────────────

  isVisible(): boolean { return this._visible; }

  show(): void {
    this._visible = true;
    this.elements.forEach((e) => (e as any).setVisible(true));
    this.contentElements.forEach((e) => (e as any).setVisible(true));
    this._renderTab(this.activeTab);
  }

  hide(): void {
    this._visible = false;
    this.elements.forEach((e) => (e as any).setVisible(false));
    this.contentElements.forEach((e) => (e as any).setVisible(false));
    this._cancelHold();
  }

  toggle(): void {
    this._visible ? this.hide() : this.show();
  }

  destroy(): void {
    this._cancelHold();
    if (this.feedbackTimeout) clearTimeout(this.feedbackTimeout);
    this.elements.forEach((e) => e.destroy());
    this.elements = [];
    this.contentElements.forEach((e) => e.destroy());
    this.contentElements = [];
  }

  // ── Build persistent UI (bg, tabs, feedback) ──────────────────────────────────

  private _build(): void {
    const sw = this.scene.scale.width;
    const sh = this.scene.scale.height;
    this.ox = Math.floor((sw - PANEL_W) / 2);
    this.oy = Math.floor((sh - PANEL_H) / 2);
    const { ox, oy } = this;

    // Background
    const bg = this.scene.add.graphics()
      .setScrollFactor(0)
      .setDepth(DEPTH);
    bg.fillStyle(0x0d0d1a, 0.95);
    bg.fillRoundedRect(ox, oy, PANEL_W, PANEL_H, 12);
    bg.lineStyle(2, 0x2aff6a, 1);
    bg.strokeRoundedRect(ox, oy, PANEL_W, PANEL_H, 12);
    this.elements.push(bg);

    // Title
    const title = this.scene.add.text(ox + PANEL_W / 2, oy + 18, '⚗ ESTACIÓN DE EVOLUCIÓN', {
      fontSize: '18px', color: '#2aff6a', fontFamily: 'monospace', fontStyle: 'bold',
    })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH + 1);
    this.elements.push(title);

    // Close hint
    const closeHint = this.scene.add.text(ox + PANEL_W - 10, oy + 10, '[E] Cerrar', {
      fontSize: '11px', color: '#888888', fontFamily: 'monospace',
    })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH + 1);
    this.elements.push(closeHint);

    // Tabs
    const tabY = oy + 50;
    SLOTS.forEach((slot, i) => {
      const tabX = ox + 10 + i * 116;
      const btn = this.scene.add.text(tabX, tabY, SLOT_LABELS[slot], {
        fontSize: '13px', color: '#aaaaaa', fontFamily: 'monospace',
        backgroundColor: '#1a1a2e', padding: { x: 8, y: 4 },
      })
        .setInteractive({ useHandCursor: true })
        .setScrollFactor(0)
        .setDepth(DEPTH + 2);

      btn.on('pointerdown', () => this._switchTab(slot));
      btn.on('pointerover', () => { if (this.activeTab !== slot) btn.setColor('#ffffff'); });
      btn.on('pointerout',  () => { if (this.activeTab !== slot) btn.setColor('#aaaaaa'); });

      this.tabButtons[slot] = btn;
      this.elements.push(btn);
    });

    // Feedback text
    this.feedbackText = this.scene.add.text(ox + PANEL_W / 2, oy + PANEL_H - 16, '', {
      fontSize: '13px', color: '#ffffff', fontFamily: 'monospace',
    })
      .setOrigin(0.5, 1)
      .setScrollFactor(0)
      .setDepth(DEPTH + 1);
    this.elements.push(this.feedbackText);

    // Click outside to close
    this.scene.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (!this._visible) return;
      if (ptr.x < ox || ptr.x > ox + PANEL_W || ptr.y < oy || ptr.y > oy + PANEL_H) {
        this.hide();
      }
    });
  }

  // ── Tab logic ─────────────────────────────────────────────────────────────────

  private _switchTab(slot: PartSlot): void {
    this.activeTab = slot;
    this._renderTab(slot);
  }

  private _renderTab(slot: PartSlot): void {
    // Update tab button colors
    SLOTS.forEach((s) => {
      const btn = this.tabButtons[s];
      if (!btn) return;
      if (s === slot) {
        btn.setColor('#2aff6a').setBackgroundColor('#1a3a1a');
      } else {
        btn.setColor('#aaaaaa').setBackgroundColor('#1a1a2e');
      }
    });

    // Destroy previous content
    this.contentElements.forEach((g) => g.destroy());
    this.contentElements = [];

    const { ox, oy } = this;
    const parts = PARTS.filter((p) => p.slot === slot);
    const playerState = this.room.state.players.get(this.room.sessionId);
    const equipped: Set<string> = new Set(playerState ? [...playerState.equippedParts] : []);
    const currentAdn: number = playerState ? playerState.adn : 0;

    const startY = oy + 80;
    const rowH = 130;

    parts.forEach((part, idx) => {
      const ry = startY + idx * rowH;
      const isEquipped = equipped.has(part.id);
      const canAfford = currentAdn >= part.cost;

      // Row bg
      const rowBg = this.scene.add.graphics()
        .setScrollFactor(0)
        .setDepth(DEPTH + 1);
      const rowColor = isEquipped ? 0x1a3a1a : canAfford ? 0x111122 : 0x1a1a1a;
      rowBg.fillStyle(rowColor, 1);
      rowBg.fillRoundedRect(ox + 10, ry, 540, rowH - 6, 6);
      this.contentElements.push(rowBg);

      // Part name
      const tierColor = TIER_COLORS[part.tier] ?? '#ffffff';
      const nameLabel = `${isEquipped ? '✓ ' : ''}${part.name}`;
      const nameText = this.scene.add.text(ox + 20, ry + 8, nameLabel, {
        fontSize: '15px', color: isEquipped ? '#2aff6a' : '#ffffff',
        fontFamily: 'monospace', fontStyle: 'bold',
      })
        .setScrollFactor(0)
        .setDepth(DEPTH + 2);
      this.contentElements.push(nameText);

      // Tier
      const tierText = this.scene.add.text(ox + 20, ry + 26, part.tier, {
        fontSize: '11px', color: tierColor, fontFamily: 'monospace',
      })
        .setScrollFactor(0)
        .setDepth(DEPTH + 2);
      this.contentElements.push(tierText);

      // Modifiers
      const modStr = formatModifiers(part.statModifiers as Record<string, number>);
      const extra = EXTRA_EFFECTS[part.id] ?? '';
      const fullMods = [modStr, extra].filter(Boolean).join('\n');
      const modText = this.scene.add.text(ox + 20, ry + 40, fullMods || '  —', {
        fontSize: '11px', color: '#bbbbbb', fontFamily: 'monospace',
      })
        .setScrollFactor(0)
        .setDepth(DEPTH + 2);
      this.contentElements.push(modText);

      // ADN cost
      const costColor = canAfford ? '#ffdd44' : '#666666';
      const costText = this.scene.add.text(ox + 420, ry + 8, `ADN: ${part.cost}`, {
        fontSize: '13px', color: costColor, fontFamily: 'monospace',
      })
        .setScrollFactor(0)
        .setDepth(DEPTH + 2);
      this.contentElements.push(costText);

      // Craft button
      const btnDisabled = isEquipped || !canAfford;
      const btnLabel = isEquipped ? '✓ Equipado' : 'Craftear';
      const btnColor = btnDisabled ? '#333333' : '#1a3a1a';
      const btnTextColor = btnDisabled ? '#555555' : '#2aff6a';

      const craftBtn = this.scene.add.text(ox + 420, ry + 36, btnLabel, {
        fontSize: '13px', color: btnTextColor, fontFamily: 'monospace',
        backgroundColor: btnColor, padding: { x: 10, y: 6 },
      })
        .setScrollFactor(0)
        .setDepth(DEPTH + 3);

      if (!btnDisabled) {
        craftBtn.setInteractive({ useHandCursor: true });
        craftBtn.on('pointerover', () => craftBtn.setBackgroundColor('#2a5a2a'));
        craftBtn.on('pointerout',  () => {
          craftBtn.setBackgroundColor(btnColor);
          this._cancelHold(part.id);
        });
        craftBtn.on('pointerdown', () => this._startHold(part.id, craftBtn));
        craftBtn.on('pointerup',   () => this._cancelHold(part.id));
      }

      this.contentElements.push(craftBtn);
    });

    // If panel is not visible, hide content immediately
    if (!this._visible) {
      this.contentElements.forEach((e) => (e as any).setVisible(false));
    }
  }

  // ── Hold-to-craft ─────────────────────────────────────────────────────────────

  private _startHold(partId: string, btn: Phaser.GameObjects.Text): void {
    this._cancelHold();
    this.holdPartId = partId;

    btn.setText('[ ═══ ]');

    const frames = ['[·    ]', '[██   ]', '[████ ]', '[█████]'];
    let f = 0;
    this.holdInterval = setInterval(() => {
      if (f < frames.length) { btn.setText(frames[f++]); }
    }, 250);

    this.holdTimer = setTimeout(() => {
      if (this.holdInterval) { clearInterval(this.holdInterval); this.holdInterval = null; }
      this.room.send('craft', { partId });
      this.holdPartId = null;
      this.holdTimer = null;
      btn.setText('Enviando...');
    }, 1000);
  }

  private _cancelHold(partId?: string): void {
    if (partId && this.holdPartId !== partId) return;
    if (this.holdTimer) { clearTimeout(this.holdTimer); this.holdTimer = null; }
    if (this.holdInterval) { clearInterval(this.holdInterval); this.holdInterval = null; }
    this.holdPartId = null;
  }

  // ── Network ───────────────────────────────────────────────────────────────────

  private _listenCraftResult(): void {
    this.room.onMessage('craftResult', (result: CraftResult) => {
      if (result.success) {
        this._showFeedback(`✓ ${result.part.name} equipada!`, '#2aff6a');
        // Delay re-render para que el estado del server se sincronice primero
        if (this._visible) this.scene.time.delayedCall(150, () => this._renderTab(this.activeTab));
      } else {
        this._showFeedback(`✗ ${result.reason}`, '#ff4444');
      }
    });
  }

  private _showFeedback(msg: string, color: string): void {
    if (this.feedbackTimeout) clearTimeout(this.feedbackTimeout);
    this.feedbackText.setText(msg).setColor(color);
    this.feedbackTimeout = setTimeout(() => {
      this.feedbackText.setText('');
    }, 3000);
  }
}
