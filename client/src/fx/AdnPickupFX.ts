import Phaser from 'phaser';

/** Event key emitted when ADN amount changes — HUD can listen to this. */
export const ADN_UPDATED_EVENT = 'adnUpdated';

export interface AdnPickupPayload {
  amount: number;
  total: number;
}

export class AdnPickupFX {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Show a floating "+N 🧬" text at (worldX, worldY) and update the HUD.
   * Call this when the server sends an 'adnPickup' message.
   */
  show(worldX: number, worldY: number, payload: AdnPickupPayload): void {
    const { amount, total } = payload;

    // Floating text
    const label = this.scene.add
      .text(worldX, worldY, `+${amount} 🧬`, {
        fontSize: '18px',
        color: '#ffe600',
        stroke: '#000000',
        strokeThickness: 3,
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 1)
      .setDepth(100)
      .setAlpha(0);

    this.scene.tweens.add({
      targets: label,
      y: worldY - 40,
      alpha: { from: 0, to: 1 },
      duration: 400,
      ease: 'Cubic.easeOut',
      yoyo: false,
      onComplete: () => {
        this.scene.tweens.add({
          targets: label,
          alpha: 0,
          duration: 400,
          ease: 'Cubic.easeIn',
          onComplete: () => label.destroy(),
        });
      },
    });

    // Notify HUD via scene events
    this.scene.events.emit(ADN_UPDATED_EVENT, total);
  }
}
