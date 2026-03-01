import Phaser from 'phaser';

export class ProjectileSprite {
  private graphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.graphics = scene.add.graphics();
    this.graphics.fillStyle(0xffff44, 1);
    this.graphics.fillCircle(0, 0, 5);
    this.graphics.setPosition(x, y);
    this.graphics.setDepth(9);
  }

  update(x: number, y: number): void {
    this.graphics.setPosition(x, y);
  }

  destroy(): void {
    this.graphics.destroy();
  }
}
