import Phaser from 'phaser';

/** Minimal interface mirroring server EnemyData for client use */
export interface EnemyData {
  id: string;
  type: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  isElite: boolean;
  isBoss: boolean;
}

const ENEMY_COLORS: Record<string, number> = {
  basic: 0xff2222,
  ranged: 0xff8800,
  tank: 0x7a4a2a,
  boss: 0xff2222, // base color, border is gold
  elite: 0xff2222, // tinted brighter overlay
};

const ENEMY_SIZES: Record<string, number> = {
  basic: 28,
  ranged: 24,
  tank: 36,
  boss: 56, // 2x basic
  elite: 28,
};

export class EnemySprite {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private hpBarBg: Phaser.GameObjects.Rectangle;
  private hpBarFill: Phaser.GameObjects.Rectangle;
  private crownText: Phaser.GameObjects.Text | null = null;
  private container: Phaser.GameObjects.Container;

  private targetX: number;
  private targetY: number;

  constructor(scene: Phaser.Scene, enemy: EnemyData) {
    this.scene = scene;
    this.targetX = enemy.x;
    this.targetY = enemy.y;

    // Main graphics
    this.graphics = scene.add.graphics();
    this._drawShape(enemy.type, enemy.isElite, enemy.isBoss);

    // HP bar background (grey)
    const barW = 36;
    const barH = 5;
    this.hpBarBg = scene.add.rectangle(0, 0, barW, barH, 0x444444);
    this.hpBarFill = scene.add.rectangle(0, 0, barW, barH, 0xff3333);
    this.hpBarBg.setOrigin(0.5, 0.5);
    this.hpBarFill.setOrigin(0, 0.5);

    const yOffset = -(ENEMY_SIZES[enemy.type] ?? 28) / 2 - 10;
    this.hpBarBg.setPosition(0, yOffset);
    this.hpBarFill.setPosition(-barW / 2, yOffset);

    // Container holds everything together
    this.container = scene.add.container(enemy.x, enemy.y, [
      this.graphics,
      this.hpBarBg,
      this.hpBarFill,
    ]);
    this.container.setDepth(8);

    // Crown for boss
    if (enemy.isBoss) {
      this.crownText = scene.add.text(0, -(ENEMY_SIZES[enemy.type] ?? 28) / 2 - 22, '👑', {
        fontSize: '16px',
      });
      this.crownText.setOrigin(0.5, 0.5);
      this.container.add(this.crownText);
    }

    // Elite overlay
    if (enemy.isElite && !enemy.isBoss) {
      const overlayGfx = scene.add.graphics();
      const size = ENEMY_SIZES[enemy.type] ?? 28;
      overlayGfx.fillStyle(0xffffff, 0.3);
      overlayGfx.fillCircle(0, 0, size / 2 + 2);
      this.container.add(overlayGfx);
    }

    this._updateHpBar(enemy.hp, enemy.maxHp);
  }

  private _drawShape(type: string, isElite: boolean, isBoss: boolean): void {
    const color = ENEMY_COLORS[type] ?? 0xff2222;
    const size = ENEMY_SIZES[type] ?? 28;
    const g = this.graphics;
    g.clear();

    if (isBoss) {
      // Gold border
      g.lineStyle(3, 0xffd700, 1);
    }

    switch (type) {
      case 'basic':
      case 'boss':
      case 'elite': {
        // Triangle pointing up
        const h = size;
        const w = size;
        g.fillStyle(color, 1);
        g.beginPath();
        g.moveTo(0, -h / 2);
        g.lineTo(w / 2, h / 2);
        g.lineTo(-w / 2, h / 2);
        g.closePath();
        g.fillPath();
        if (isBoss) g.strokePath();
        break;
      }
      case 'ranged': {
        // Diamond / rhombus
        const r = size / 2;
        g.fillStyle(color, 1);
        g.beginPath();
        g.moveTo(0, -r);
        g.lineTo(r, 0);
        g.lineTo(0, r);
        g.lineTo(-r, 0);
        g.closePath();
        g.fillPath();
        break;
      }
      case 'tank': {
        // Square
        const s = size;
        g.fillStyle(color, 1);
        g.fillRect(-s / 2, -s / 2, s, s);
        break;
      }
      default: {
        g.fillStyle(color, 1);
        g.fillCircle(0, 0, size / 2);
      }
    }

    if (isElite && !isBoss) {
      // Brighter outline
      g.lineStyle(2, 0xffffff, 0.7);
      g.strokeCircle(0, 0, size / 2 + 3);
    }
  }

  private _updateHpBar(hp: number, maxHp: number): void {
    const barW = 36;
    const ratio = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0;
    this.hpBarFill.width = barW * ratio;
  }

  update(enemy: EnemyData): void {
    this.targetX = enemy.x;
    this.targetY = enemy.y;

    // Lerp position
    this.container.x = Phaser.Math.Linear(this.container.x, this.targetX, 0.2);
    this.container.y = Phaser.Math.Linear(this.container.y, this.targetY, 0.2);

    this._updateHpBar(enemy.hp, enemy.maxHp);
  }

  getPosition(): { x: number; y: number } {
    return { x: this.container.x, y: this.container.y };
  }

  destroy(): void {
    this.container.destroy(true);
  }
}
