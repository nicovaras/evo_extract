import Phaser from 'phaser';
import { SPRITE_CARGO } from '../assets/spriteKeys';

export class CargoSprite {
  readonly id: string;
  private sprite: Phaser.GameObjects.Image;
  private blinkTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, id: string, x: number, y: number) {
    this.id = id;
    this.sprite = scene.add.image(x, y, SPRITE_CARGO)
      .setDisplaySize(24, 24)
      .setDepth(9);
  }

  update(x: number, y: number, carrierId: string): void {
    this.sprite.setPosition(x, y);

    const isDropped = !carrierId || carrierId === '';

    if (isDropped && !this.blinkTween) {
      this.blinkTween = this.sprite.scene.tweens.add({
        targets: this.sprite,
        alpha: { from: 1, to: 0.25 },
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else if (!isDropped && this.blinkTween) {
      this.blinkTween.stop();
      this.blinkTween = null;
      this.sprite.setAlpha(1);
    }
  }

  destroy(): void {
    if (this.blinkTween) { this.blinkTween.stop(); this.blinkTween = null; }
    this.sprite.destroy();
  }
}
