import Phaser from 'phaser';

export class CombatFX {
  /**
   * Floating damage number that rises and fades in 600ms.
   */
  static showHitNumber(
    scene: Phaser.Scene,
    x: number,
    y: number,
    damage: number,
    isCrit: boolean,
    overrideColor?: string
  ): void {
    const label = isCrit ? `${Math.ceil(damage)}!` : `${Math.ceil(damage)}`;
    const color = overrideColor ?? (isCrit ? '#ffff00' : '#ffffff');
    const style: Phaser.Types.GameObjects.Text.TextStyle = isCrit
      ? { fontSize: '20px', color, fontStyle: 'bold', fontFamily: 'monospace' }
      : { fontSize: '14px', color, fontFamily: 'monospace' };

    const text = scene.add.text(x, y, label, style);
    text.setOrigin(0.5, 0.5);
    text.setDepth(20);

    scene.tweens.add({
      targets: text,
      y: y - 40,
      alpha: 0,
      duration: 700,
      ease: 'Quad.easeOut',
      onComplete: () => text.destroy(),
    });
  }

  /**
   * Burst of 4-6 small circles that expand and fade in 400ms.
   */
  static showEnemyDeath(
    scene: Phaser.Scene,
    x: number,
    y: number,
    color: number = 0xff4444
  ): void {
    const count = Phaser.Math.Between(4, 6);

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const dist = Phaser.Math.Between(20, 50);
      const tx = x + Math.cos(angle) * dist;
      const ty = y + Math.sin(angle) * dist;

      const g = scene.add.graphics();
      g.fillStyle(color, 1);
      g.fillCircle(0, 0, Phaser.Math.Between(4, 8));
      g.setPosition(x, y);
      g.setDepth(15);

      scene.tweens.add({
        targets: g,
        x: tx,
        y: ty,
        alpha: 0,
        scaleX: 0.1,
        scaleY: 0.1,
        duration: 400,
        ease: 'Quad.easeOut',
        onComplete: () => g.destroy(),
      });
    }
  }

  /**
   * Flash red on the player sprite: alpha 0.3 → 1 in 200ms.
   */
  static showPlayerHit(scene: Phaser.Scene, x: number, y: number): void {
    const flash = scene.add.graphics();
    flash.fillStyle(0xff0000, 0.6);
    flash.fillCircle(0, 0, 20);
    flash.setPosition(x, y);
    flash.setDepth(20);
    flash.setAlpha(0.3);

    scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 200,
      ease: 'Linear',
      onComplete: () => flash.destroy(),
    });
  }

  /**
   * Green tint overlay for toxic damage.
   */
  static showToxicHit(scene: Phaser.Scene, x: number, y: number): void {
    const flash = scene.add.graphics();
    flash.fillStyle(0x00ff44, 0.5);
    flash.fillCircle(0, 0, 22);
    flash.setPosition(x, y);
    flash.setDepth(20);

    scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 250,
      ease: 'Linear',
      onComplete: () => flash.destroy(),
    });
  }

  /**
   * Player downed: grey + semitransparent.
   */
  static showDownedEffect(
    scene: Phaser.Scene,
    playerSprite: Phaser.GameObjects.GameObject & {
      setTint: (color: number) => void;
      setAlpha: (alpha: number) => void;
    }
  ): void {
    playerSprite.setTint(0x888888);
    playerSprite.setAlpha(0.5);
  }
}
