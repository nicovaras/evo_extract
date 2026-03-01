export class HoldProgressBar {
  private bg: Phaser.GameObjects.Rectangle;
  private fill: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, labelText: string) {
    // Background bar (dark gray)
    this.bg = scene.add.rectangle(0, 0, 80, 10, 0x333333, 0.85);
    this.bg.setDepth(60);
    this.bg.setScrollFactor(1);

    // Fill bar (green)
    this.fill = scene.add.rectangle(0, 0, 0, 10, 0x44ff88, 1);
    this.fill.setDepth(61);
    this.fill.setOrigin(0, 0.5);
    this.fill.setScrollFactor(1);

    // Label above bar
    this.label = scene.add.text(0, 0, labelText, {
      fontSize: '11px',
      color: '#ffffff',
      fontFamily: 'monospace',
      backgroundColor: '#00000066',
      padding: { x: 3, y: 1 },
    });
    this.label.setDepth(62);
    this.label.setOrigin(0.5, 1);
    this.label.setScrollFactor(1);
  }

  update(x: number, y: number, progress: number): void {
    const barY = y - 50;
    const clampedProgress = Math.max(0, Math.min(1, progress));
    const fillWidth = 80 * clampedProgress;

    this.bg.setPosition(x, barY);
    this.fill.setPosition(x - 40, barY);
    this.fill.width = fillWidth;

    this.label.setPosition(x, barY - 8);
  }

  destroy(): void {
    this.bg.destroy();
    this.fill.destroy();
    this.label.destroy();
  }
}
