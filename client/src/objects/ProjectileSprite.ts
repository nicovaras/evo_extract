import Phaser from 'phaser';
import { SPRITE_BULLET } from '../assets/spriteKeys';

export class ProjectileSprite {
  private sprite: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.add.image(x, y, SPRITE_BULLET)
      .setDisplaySize(10, 10)
      .setDepth(9);
  }

  update(x: number, y: number): void {
    this.sprite.setPosition(x, y);
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
