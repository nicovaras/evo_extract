import Phaser from 'phaser';

export class CargoSprite {
  readonly id: string;
  private rect: Phaser.GameObjects.Rectangle;
  private blinkTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, id: string, x: number, y: number) {
    this.id = id;
    this.rect = scene.add.rectangle(x, y, 20, 20, 0xff8800).setDepth(9);
  }

  update(x: number, y: number, carrierId: string): void {
    this.rect.setPosition(x, y);

    const isDropped = !carrierId || carrierId === '';

    if (isDropped && !this.blinkTween) {
      // Start blinking
      this.blinkTween = this.rect.scene.tweens.add({
        targets: this.rect,
        alpha: { from: 1, to: 0.2 },
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else if (!isDropped && this.blinkTween) {
      // Stop blinking
      this.blinkTween.stop();
      this.blinkTween = null;
      this.rect.setAlpha(1);
    }
  }

  destroy(): void {
    if (this.blinkTween) {
      this.blinkTween.stop();
      this.blinkTween = null;
    }
    this.rect.destroy();
  }
}
