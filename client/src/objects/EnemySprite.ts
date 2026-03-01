import Phaser from 'phaser';
import { enemySpriteKey } from '../assets/spriteKeys';

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

const ENEMY_SIZES: Record<string, number> = {
  basic:  32,
  ranged: 28,
  tank:   40,
  boss:   56,
};

export class EnemySprite {
  private sprite: Phaser.GameObjects.Image;
  private hpBarBg: Phaser.GameObjects.Rectangle;
  private hpBarFill: Phaser.GameObjects.Rectangle;
  private container: Phaser.GameObjects.Container;

  private targetX: number;
  private targetY: number;

  constructor(scene: Phaser.Scene, enemy: EnemyData) {
    this.targetX = enemy.x;
    this.targetY = enemy.y;

    const key  = enemySpriteKey(enemy.type, enemy.isElite, enemy.isBoss);
    const size = ENEMY_SIZES[enemy.isBoss ? 'boss' : enemy.type] ?? 32;

    this.sprite = scene.add.image(0, 0, key);
    this.sprite.setDisplaySize(size, size);

    // HP bar
    const barW = size + 8;
    const barH = 5;
    const yOff = -(size / 2) - 10;

    this.hpBarBg   = scene.add.rectangle(0, yOff, barW, barH, 0x444444).setOrigin(0.5, 0.5);
    this.hpBarFill = scene.add.rectangle(-barW / 2, yOff, barW, barH, 0xff3333).setOrigin(0, 0.5);

    this.container = scene.add.container(enemy.x, enemy.y, [
      this.sprite, this.hpBarBg, this.hpBarFill,
    ]);
    this.container.setDepth(8);

    // Crown emoji for bosses
    if (enemy.isBoss) {
      const crown = scene.add.text(0, -(size / 2) - 22, '👑', { fontSize: '16px' }).setOrigin(0.5);
      this.container.add(crown);
    }

    this._updateHpBar(enemy.hp, enemy.maxHp);
  }

  private _updateHpBar(hp: number, maxHp: number): void {
    const barW = (this.hpBarBg.width);
    const ratio = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0;
    this.hpBarFill.width = barW * ratio;
  }

  update(enemy: EnemyData): void {
    this.targetX = enemy.x;
    this.targetY = enemy.y;
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
