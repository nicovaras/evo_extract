import Phaser from 'phaser';

interface GameOverData {
  win: boolean;
  reason?: 'wipe' | 'timeout';
  stats?: {
    runTime: number;
    cargoDelivered: number;
  };
}

export class GameOverlay {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show(data: GameOverData): void {
    if (this.container) return; // already shown

    const cam = this.scene.cameras.main;
    const W = cam.width;
    const H = cam.height;

    // Semi-transparent background
    const bgColor = data.win ? 0x003300 : 0x330000;
    const bg = this.scene.add
      .rectangle(0, 0, W, H, bgColor, 0.85)
      .setOrigin(0, 0)
      .setScrollFactor(0);

    // Main title
    let titleText: string;
    if (data.win) {
      titleText = '🧬 EXTRACCIÓN EXITOSA';
    } else if (data.reason === 'wipe') {
      titleText = '💀 EQUIPO ELIMINADO';
    } else {
      titleText = '⏰ TIEMPO AGOTADO';
    }

    const title = this.scene.add
      .text(W / 2, H / 2 - 80, titleText, {
        fontSize: '36px',
        color: data.win ? '#44ff88' : '#ff4444',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        backgroundColor: '#00000066',
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(300);

    // Stats subtitle
    let statsText = '';
    if (data.stats) {
      const mm = String(Math.floor(data.stats.runTime / 60)).padStart(2, '0');
      const ss = String(data.stats.runTime % 60).padStart(2, '0');
      statsText = `Tiempo: ${mm}:${ss}  |  Cargas entregadas: ${data.stats.cargoDelivered}/8`;
    }

    const subtitle = this.scene.add
      .text(W / 2, H / 2 - 20, statsText, {
        fontSize: '18px',
        color: '#cccccc',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(300);

    // Lobby button
    const btnBg = this.scene.add
      .rectangle(W / 2, H / 2 + 60, 220, 50, 0x555555)
      .setScrollFactor(0)
      .setDepth(300)
      .setInteractive({ useHandCursor: true });

    const btnText = this.scene.add
      .text(W / 2, H / 2 + 60, 'Volver al Lobby', {
        fontSize: '20px',
        color: '#ffffff',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(301);

    btnBg.on('pointerover', () => btnBg.setFillStyle(0x888888));
    btnBg.on('pointerout', () => btnBg.setFillStyle(0x555555));
    btnBg.on('pointerdown', () => {
      this.scene.scene.start('LobbyScene');
    });

    this.container = this.scene.add
      .container(0, 0, [bg, title, subtitle, btnBg, btnText])
      .setDepth(299)
      .setScrollFactor(0);

    // Animate in
    this.container.setAlpha(0);
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 600,
      ease: 'Power2',
    });
  }

  destroy(): void {
    this.container?.destroy();
    this.container = null;
  }
}
