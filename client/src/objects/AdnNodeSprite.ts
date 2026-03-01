import Phaser from 'phaser';

const RADIUS = 8;
const PULSE_SCALE = 1.2;
const PULSE_DURATION = 700; // ms per half-cycle

export class AdnNodeSprite {
  private scene: Phaser.Scene;
  private circle: Phaser.GameObjects.Arc;
  private pulseTween: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, worldX: number, worldY: number) {
    this.scene = scene;

    // Yellow circle
    this.circle = scene.add
      .circle(worldX, worldY, RADIUS, 0xffe600)
      .setDepth(5);

    // Pulse tween: scale 1 → 1.2 → 1, looping
    this.pulseTween = scene.tweens.add({
      targets: this.circle,
      scaleX: PULSE_SCALE,
      scaleY: PULSE_SCALE,
      duration: PULSE_DURATION,
      ease: 'Sine.easeInOut',
      yoyo: true,
      loop: -1,
    });
  }

  setPosition(x: number, y: number): void {
    this.circle.setPosition(x, y);
  }

  destroy(): void {
    this.pulseTween.stop();
    this.circle.destroy();
  }
}
