import Phaser from 'phaser';
import { SPRITE_ADN_NODE } from '../assets/spriteKeys';

export class AdnNodeSprite {
  private sprite: Phaser.GameObjects.Image;
  private pulseTween: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, worldX: number, worldY: number) {
    this.sprite = scene.add.image(worldX, worldY, SPRITE_ADN_NODE)
      .setDisplaySize(16, 16)
      .setDepth(5);

    this.pulseTween = scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.25,
      scaleY: 1.25,
      duration: 700,
      ease: 'Sine.easeInOut',
      yoyo: true,
      loop: -1,
    });
  }

  setPosition(x: number, y: number): void {
    this.sprite.setPosition(x, y);
  }

  destroy(): void {
    this.pulseTween.stop();
    this.sprite.destroy();
  }
}
