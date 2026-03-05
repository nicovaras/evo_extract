/* eslint-disable @typescript-eslint/no-explicit-any */
import Phaser from 'phaser';
import * as Colyseus from 'colyseus.js';
import { WIN_CARGO_COUNT, getPartById } from '@evo/shared';

// Extraction capsule center (matches extraction zone in default-map.json: x:558 y:1560 w:746 h:207)
const CAPSULE_X = 558 + 746 / 2; // 931
const CAPSULE_Y = 1560 + 207 / 2; // 1663

// Parts now come from shared — no inline table needed.

export class HUD {
  private scene: Phaser.Scene;
  private room: Colyseus.Room;
  private roomCode: string;

  // HP bar
  private hpBarBg!: Phaser.GameObjects.Rectangle;
  private hpBarFill!: Phaser.GameObjects.Rectangle;
  private hpText!: Phaser.GameObjects.Text;

  // ADN text
  private adnText!: Phaser.GameObjects.Text;

  // Cargo carry icon
  private carryIcon!: Phaser.GameObjects.Text;

  // Run timer
  private timerText!: Phaser.GameObjects.Text;

  // Player count
  private playerCountText!: Phaser.GameObjects.Text;

  // Room code (top-right)
  private roomCodeText!: Phaser.GameObjects.Text;

  // Ping (top-right under room code)
  private pingText!: Phaser.GameObjects.Text;
  private lastPingTime: number = 0;
  private pingMs: number = 0;

  // Shop panel (shown in hub)
  private shopBg!: Phaser.GameObjects.Rectangle;
  private shopText!: Phaser.GameObjects.Text;
  private shopBtnPotion!: Phaser.GameObjects.Text;
  private shopBtnGrenade!: Phaser.GameObjects.Text;

  // Cargo progress (bottom-center)
  private cargoProgressText!: Phaser.GameObjects.Text;

  // Extraction countdown (center screen)
  private extractionCountdownText!: Phaser.GameObjects.Text;
  private extractionTween: Phaser.Tweens.Tween | null = null;

  // Distance to capsule
  private distanceText!: Phaser.GameObjects.Text;

  // Stats panel (bottom-left)
  private statsBg!: Phaser.GameObjects.Rectangle;
  private statsText!: Phaser.GameObjects.Text;

  // Downed allies alert (top-left under HP)
  private downedText!: Phaser.GameObjects.Text;
  private downedTween: Phaser.Tweens.Tween | null = null;

  private readonly BAR_W = 180;
  private readonly BAR_H = 18;
  private readonly PAD = 14;

  constructor(scene: Phaser.Scene, room: Colyseus.Room, roomCode: string = '') {
    this.scene = scene;
    this.room = room;
    this.roomCode = roomCode || room.id || '';
    this._build();
  }

  private _build(): void {
    const cam = this.scene.cameras.main;
    const pad = this.PAD;
    const W = cam.width;
    const H = cam.height;

    // ── Player name (top-left) ───────────────────────────────────────────────
    const localPlayer = this.room.state.players.get(this.room.sessionId);
    const playerName = (localPlayer as any)?.name ?? '';
    if (playerName) {
      this.scene.add
        .text(pad, pad - 18, playerName, {
          fontSize: '12px',
          color: '#aaffaa',
          fontFamily: 'monospace',
        })
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(102);
    }

    // ── HP bar (top-left) ────────────────────────────────────────────────────
    this.hpBarBg = this.scene.add
      .rectangle(pad, pad, this.BAR_W, this.BAR_H, 0x440000)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(100);

    this.hpBarFill = this.scene.add
      .rectangle(pad, pad, this.BAR_W, this.BAR_H, 0xdd2222)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(101);

    this.hpText = this.scene.add
      .text(pad + this.BAR_W / 2, pad + this.BAR_H / 2, '120/120', {
        fontSize: '12px',
        color: '#ffffff',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(102);

    // ── ADN (below HP bar) ────────────────────────────────────────────────────
    this.adnText = this.scene.add
      .text(pad, pad + this.BAR_H + 6, '🧬 0', {
        fontSize: '15px',
        color: '#ffdd00',
        fontFamily: 'monospace',
      })
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(100);

    // ── Downed allies alert (top-left, below ADN) ────────────────────────────
    this.downedText = this.scene.add
      .text(pad, pad + this.BAR_H + 30, '', {
        fontSize: '13px',
        color: '#ff3333',
        fontFamily: 'monospace',
        backgroundColor: '#00000088',
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(100)
      .setVisible(false);

    // ── Carry icon (below downed alert) ──────────────────────────────────────
    this.carryIcon = this.scene.add
      .text(pad, pad + this.BAR_H + 52, '📦', {
        fontSize: '20px',
        fontFamily: 'monospace',
      })
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(100)
      .setVisible(false);

    // ── Run timer (top-center) ────────────────────────────────────────────────
    this.timerText = this.scene.add
      .text(W / 2, pad, '00:00', {
        fontSize: '18px',
        color: '#ffffff',
        fontFamily: 'monospace',
        backgroundColor: '#00000066',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(100);

    // ── Player count (top-right) ──────────────────────────────────────────────
    this.playerCountText = this.scene.add
      .text(W - pad, pad, '👥 1/4', {
        fontSize: '15px',
        color: '#ffffff',
        fontFamily: 'monospace',
        backgroundColor: '#00000066',
        padding: { x: 6, y: 4 },
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(100);

    // ── Room code (top-right, below player count) — click to copy ────────────
    const shortCode = this.roomCode.slice(0, 8).toUpperCase();
    this.roomCodeText = this.scene.add
      .text(W - pad, pad + 34, `🔑 ${shortCode}  [clic]`, {
        fontSize: '12px',
        color: '#aaaaaa',
        fontFamily: 'monospace',
        backgroundColor: '#00000055',
        padding: { x: 4, y: 2 },
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(50)
      .setInteractive({ useHandCursor: true });

    this.roomCodeText.on('pointerdown', () => {
      navigator.clipboard?.writeText(shortCode).then(() => {
        this.roomCodeText.setText(`✅ ${shortCode} copiado!`).setColor('#88ff88');
        this.scene.time.delayedCall(1500, () => {
          this.roomCodeText.setText(`🔑 ${shortCode}  [clic]`).setColor('#aaaaaa');
        });
      });
    });
    this.roomCodeText.on('pointerover', () => this.roomCodeText.setColor('#ffffff'));
    this.roomCodeText.on('pointerout', () => this.roomCodeText.setColor('#aaaaaa'));

    // ── Ping (top-right, below room code) ────────────────────────────────────
    this.pingText = this.scene.add
      .text(W - pad, pad + 52, `📶 -- ms`, {
        fontSize: '11px',
        color: '#88ff88',
        fontFamily: 'monospace',
        backgroundColor: '#00000055',
        padding: { x: 4, y: 2 },
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(50);

    // ── Stats panel (bottom-left) ─────────────────────────────────────────────
    const statsLines = 10;
    const statsLineH = 16;
    const statsPanelH = statsLines * statsLineH + 12;
    const statsPanelW = 175;
    this.statsBg = this.scene.add
      .rectangle(pad, H - pad, statsPanelW, statsPanelH, 0x000000, 0.6)
      .setOrigin(0, 1)
      .setScrollFactor(0)
      .setDepth(99);

    this.statsText = this.scene.add
      .text(pad + 6, H - pad - statsPanelH + 6, '', {
        fontSize: '12px',
        color: '#ffffff',
        fontFamily: 'monospace',
        lineSpacing: 2,
      })
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(100);

    // ── Cargo progress (bottom-center) ────────────────────────────────────────
    this.cargoProgressText = this.scene.add
      .text(W / 2, H - pad, `📦 0/8`, {
        fontSize: '18px',
        color: '#ffaa00',
        fontFamily: 'monospace',
        backgroundColor: '#00000088',
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5, 1)
      .setScrollFactor(0)
      .setDepth(100);

    // ── Extraction countdown (center) ─────────────────────────────────────────
    this.extractionCountdownText = this.scene.add
      .text(W / 2, H / 2 - 40, '⏱ 60s', {
        fontSize: '48px',
        color: '#ffff00',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        backgroundColor: '#00000099',
        padding: { x: 16, y: 8 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(150)
      .setVisible(false);

    // ── Distance to capsule ───────────────────────────────────────────────────
    this.distanceText = this.scene.add
      .text(W / 2, H - pad - 40, '', {
        fontSize: '15px',
        color: '#88ffcc',
        fontFamily: 'monospace',
        backgroundColor: '#00000066',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5, 1)
      .setScrollFactor(0)
      .setDepth(100)
      .setVisible(false);

    // ── Shop panel (center-right, visible when in hub) ────────────────────────
    const shopX = W - pad - 160;
    const shopY = H / 2 - 60;
    this.shopBg = this.scene.add
      .rectangle(shopX, shopY, 170, 120, 0x000000, 0.75)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(99)
      .setVisible(false);

    this.shopText = this.scene.add
      .text(shopX + 8, shopY + 8, '🛒 Tienda Hub', {
        fontSize: '13px',
        color: '#ffdd44',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(100)
      .setVisible(false);

    this.shopBtnPotion = this.scene.add
      .text(shopX + 8, shopY + 32, '💊 Poción  [30 ADN]', {
        fontSize: '12px',
        color: '#88ff88',
        fontFamily: 'monospace',
        backgroundColor: '#1a3a1a',
        padding: { x: 6, y: 4 },
      })
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(100)
      .setVisible(false)
      .setInteractive({ useHandCursor: true });
    this.shopBtnPotion.on('pointerdown', () => this.room.send('buyPotion', {}));
    this.shopBtnPotion.on('pointerover', () => this.shopBtnPotion.setBackgroundColor('#2a5a2a'));
    this.shopBtnPotion.on('pointerout', () => this.shopBtnPotion.setBackgroundColor('#1a3a1a'));

    this.shopBtnGrenade = this.scene.add
      .text(shopX + 8, shopY + 68, '💣 Granada  [25 ADN]', {
        fontSize: '12px',
        color: '#ffaa44',
        fontFamily: 'monospace',
        backgroundColor: '#3a2a0a',
        padding: { x: 6, y: 4 },
      })
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(100)
      .setVisible(false)
      .setInteractive({ useHandCursor: true });
    this.shopBtnGrenade.on('pointerdown', () => this.room.send('buyGrenade', {}));
    this.shopBtnGrenade.on('pointerover', () => this.shopBtnGrenade.setBackgroundColor('#5a4a1a'));
    this.shopBtnGrenade.on('pointerout', () => this.shopBtnGrenade.setBackgroundColor('#3a2a0a'));
  }

  update(sessionId: string): void {
    const state = this.room.state;
    if (!state) return;

    // Ping — measure round-trip every 2s
    const now = performance.now();
    if (now - this.lastPingTime > 2000) {
      this.lastPingTime = now;
      const sent = now;
      this.room.send('ping', {});
      this.room.onMessage('pong', () => {
        this.pingMs = Math.round(performance.now() - sent);
        const color = this.pingMs < 80 ? '#88ff88' : this.pingMs < 180 ? '#ffdd44' : '#ff6666';
        this.pingText.setColor(color).setText(`📶 ${this.pingMs}ms`);
      });
    }

    const player = state.players.get(sessionId);

    // Shop panel visibility (shown when in hub)
    if (player) {
      const HUB = { x: 706, y: 46, w: 500, h: 250 };
      const inHub =
        player.x >= HUB.x &&
        player.x <= HUB.x + HUB.w &&
        player.y >= HUB.y &&
        player.y <= HUB.y + HUB.h;
      this.shopBg.setVisible(inHub);
      this.shopText.setVisible(inHub);
      this.shopBtnPotion.setVisible(inHub);
      this.shopBtnGrenade.setVisible(inHub);
    }

    // HP
    if (player) {
      const ratio = Math.max(0, Math.min(1, player.hp / player.maxHp));
      this.hpBarFill.width = this.BAR_W * ratio;
      this.hpText.setText(`${Math.ceil(player.hp)}/${player.maxHp}`);
      this.adnText.setText(`🧬 ${(this.room.state.timers as any)?.adn ?? 0}`);

      // Carry icon
      this.carryIcon.setVisible(player.isCarrying);

      // Distance to capsule when carrying
      if (player.isCarrying) {
        const dx = CAPSULE_X - player.x;
        const dy = CAPSULE_Y - player.y;
        const dist = Math.round(Math.sqrt(dx * dx + dy * dy));
        this.distanceText.setText(`→ Cápsula ${dist}m`).setVisible(true);
      } else {
        this.distanceText.setVisible(false);
      }

      // ── Stats panel with part deltas ──────────────────────────────────────
      const BASE_DAMAGE = 12;
      const BASE_SPEED = 4.2;
      const BASE_ARMOR = 2;
      const BASE_CRIT = 5; // percent

      const equipped = player.equippedParts ?? [];
      const equippedIds: string[] = [];
      for (let i = 0; i < equipped.length; i++) equippedIds.push(equipped[i]);

      // Accumulate deltas from equipped parts
      let dDamage = 0,
        dSpeed = 0,
        dArmor = 0,
        dCrit = 0,
        dCad = 0,
        dPickup = 0,
        dCarry = 0,
        dInteract = 0;
      for (const pid of equippedIds) {
        const part = getPartById(pid);
        if (!part) continue;
        dDamage += part.statModifiers.damage ?? 0;
        dSpeed += part.statModifiers.speed ?? 0;
        dArmor += part.statModifiers.armor ?? 0;
        dCrit += Math.round((part.statModifiers.critChance ?? 0) * 100);
        dCad += part.statModifiers.attackRate ?? 0;
        dPickup += part.statModifiers.pickupRadius ?? 0;
        dCarry += part.statModifiers.carryPenalty ?? 0;
        dInteract += part.statModifiers.interactSpeed ?? 0;
      }

      const fmtDelta = (val: number, decimals = 0): string => {
        if (val === 0) return '';
        const s = decimals > 0 ? val.toFixed(decimals) : String(val);
        return val > 0 ? ` [+${s}]` : ` [${s}]`;
      };
      const fmtPct = (val: number): string => {
        if (val === 0) return '';
        return val > 0 ? ` [+${Math.round(val * 100)}%]` : ` [${Math.round(val * 100)}%]`;
      };

      const p = player as any;
      const critPct = Math.round((player.critChance ?? 0) * 100);
      const mode = p.isRanged ? '🔫 Ranged' : '⚔️ Melee';
      const potions = p.potions ?? 0;
      const grenades = (p as any).grenades ?? 0;

      this.statsText.setText(
        `${mode}  💊 x${potions} (Q)  💣 x${grenades} (RClick)\n` +
          `⚔️  Daño:     ${player.attackDamage}${fmtDelta(dDamage)}\n` +
          `🎯  Crit:     ${critPct}%  x${(player.critMult ?? 1.6).toFixed(1)}${fmtDelta(dCrit)}%\n` +
          `⚡  Cadencia: ${(p.attackRate ?? 1.0).toFixed(1)}x${fmtDelta(dCad, 1)}\n` +
          `👟  Vel:      ${(player.speed ?? 4.2).toFixed(1)}${fmtDelta(dSpeed, 1)}\n` +
          `🛡️  Armor:    ${player.armor}${fmtDelta(dArmor)}\n` +
          `✨  LifeS:    ${Math.round((p.lifeSteal ?? 0) * 100)}%\n` +
          `🧲  Radio:    ${(p.pickupRadius ?? 1.0).toFixed(1)}x${fmtDelta(dPickup, 1)}\n` +
          `📦  Carga:    ${Math.round((1 - (p.carryPenalty ?? 1.0) * 0.45) * 100)}% vel${fmtPct(-dCarry)}\n` +
          `⏱️  Interac:  ${(p.interactSpeed ?? 1.0).toFixed(1)}x${fmtDelta(dInteract, 1)}`
      );
    }

    // ── Downed allies alert ───────────────────────────────────────────────────
    let downedCount = 0;
    state.players.forEach((p: { id: string; isDown: boolean }, id: string) => {
      if (id !== sessionId && p.isDown) downedCount++;
    });

    if (downedCount > 0) {
      this.downedText.setText(`💀 ${downedCount} aliado(s) downed`).setVisible(true);
      if (!this.downedTween) {
        this.downedTween = this.scene.tweens.add({
          targets: this.downedText,
          alpha: { from: 1, to: 0.2 },
          duration: 500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    } else {
      this.downedText.setVisible(false);
      if (this.downedTween) {
        this.downedTween.stop();
        this.downedTween = null;
        this.downedText.setAlpha(1);
      }
    }

    // Timer
    const seconds = Math.floor(state.timers?.runTime ?? 0);
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    this.timerText.setText(`${mm}:${ss}`);

    // Player count
    this.playerCountText.setText(`👥 ${state.players.size}/4`);

    // Cargo progress + current seal cost
    const delivered = state.timers?.cargoDelivered ?? 0;
    const sealed = (state.timers as any)?.cargoSealed ?? 0;
    const required = (state.timers as any)?.cargoRequired ?? WIN_CARGO_COUNT;
    const nextCost = 55 + sealed * 10;
    this.cargoProgressText.setText(`📦 ${delivered}/${required}  [F: ${nextCost} ADN]`);

    // Extraction countdown
    const isExtracting = state.timers?.isExtracting ?? false;
    if (isExtracting) {
      const cd = Math.ceil(state.timers.extractionCountdown);
      this.extractionCountdownText.setText(`⏱ ${cd}s`).setVisible(true);

      // Start pulsing tween if not already
      if (!this.extractionTween) {
        this.extractionTween = this.scene.tweens.add({
          targets: this.extractionCountdownText,
          scaleX: { from: 1, to: 1.15 },
          scaleY: { from: 1, to: 1.15 },
          duration: 500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    } else {
      this.extractionCountdownText.setVisible(false);
      if (this.extractionTween) {
        this.extractionTween.stop();
        this.extractionTween = null;
      }
    }
  }

  destroy(): void {
    this.hpBarBg.destroy();
    this.hpBarFill.destroy();
    this.hpText.destroy();
    this.adnText.destroy();
    this.carryIcon.destroy();
    this.timerText.destroy();
    this.playerCountText.destroy();
    this.roomCodeText.destroy();
    this.pingText.destroy();
    this.shopBg.destroy();
    this.shopText.destroy();
    this.shopBtnPotion.destroy();
    this.shopBtnGrenade.destroy();
    this.cargoProgressText.destroy();
    this.extractionCountdownText.destroy();
    this.distanceText.destroy();
    this.statsBg.destroy();
    this.statsText.destroy();
    this.downedText.destroy();
    if (this.extractionTween) this.extractionTween.stop();
    if (this.downedTween) this.downedTween.stop();
  }
}
