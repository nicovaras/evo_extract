import Phaser from 'phaser';

export class SealFX {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Show "📦 Carga sellada" floating text at (x, y) in world coords */
  showSealSuccess(x: number, y: number): void {
    const cam = this.scene.cameras.main;

    // Convert world → screen
    const screenX = x - cam.scrollX;
    const screenY = y - cam.scrollY;

    const text = this.scene.add
      .text(screenX, screenY, '📦 Carga sellada', {
        fontSize: '18px',
        color: '#ffaa00',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        backgroundColor: '#00000088',
        padding: { x: 8, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(200)
      .setOrigin(0.5, 0.5)
      .setAlpha(0);

    // Appear then fade
    this.scene.tweens.add({
      targets: text,
      alpha: { from: 0, to: 1 },
      y: screenY - 10,
      duration: 300,
      ease: 'Power2',
      yoyo: false,
      onComplete: () => {
        this.scene.tweens.add({
          targets: text,
          alpha: 0,
          y: screenY - 50,
          duration: 900,
          ease: 'Power2',
          onComplete: () => text.destroy(),
        });
      },
    });
  }
}
