import Phaser from 'phaser';

interface PlayerStat {
  name?: string;
  adnFarmed: number;
  damageDealt: number;
  kills: number;
  cargoSealed: number;
  timesDowned: number;
}

interface GameOverData {
  win: boolean;
  reason?: 'wipe' | 'timeout';
  stats?: {
    runTime: number;
    cargoDelivered: number;
    playerStats?: Record<string, PlayerStat>;
  };
}

export class GameOverlay {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show(data: GameOverData): void {
    if (this.container) return;

    const cam = this.scene.cameras.main;
    const W = cam.width;
    const H = cam.height;

    const bgColor = data.win ? 0x001a00 : 0x1a0000;
    const accentColor = data.win ? '#44ff88' : '#ff4444';

    const bg = this.scene.add
      .rectangle(0, 0, W, H, bgColor, 0.92)
      .setOrigin(0, 0)
      .setScrollFactor(0);

    const objects: Phaser.GameObjects.GameObject[] = [bg];

    // ── Título ──────────────────────────────────────────────────────────────
    let titleText: string;
    if (data.win) titleText = '🧬 EXTRACCIÓN EXITOSA';
    else if (data.reason === 'wipe') titleText = '💀 EQUIPO ELIMINADO';
    else titleText = '⏰ TIEMPO AGOTADO';

    const title = this.scene.add
      .text(W / 2, 60, titleText, {
        fontSize: '34px',
        color: accentColor,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(300);
    objects.push(title);

    // ── Tiempo y cargas ──────────────────────────────────────────────────────
    if (data.stats) {
      const mm = String(Math.floor(data.stats.runTime / 60)).padStart(2, '0');
      const ss = String(data.stats.runTime % 60).padStart(2, '0');
      const sub = this.scene.add
        .text(W / 2, 110, `⏱ ${mm}:${ss}   📦 ${data.stats.cargoDelivered}/8 cargas entregadas`, {
          fontSize: '17px',
          color: '#aaaaaa',
          fontFamily: 'monospace',
        })
        .setOrigin(0.5, 0)
        .setScrollFactor(0)
        .setDepth(300);
      objects.push(sub);
    }

    // ── Tabla de stats por jugador ───────────────────────────────────────────
    const playerStats = data.stats?.playerStats ?? {};
    const entries = Object.entries(playerStats);

    if (entries.length > 0) {
      const tableTop = 160;
      const rowH = 44;
      const cols = [80, 220, 360, 480, 600, 720];
      const tableW = 760;
      const tableX = (W - tableW) / 2;

      // Header
      const headers = ['#', 'ADN 🧬', 'Daño ⚔', 'Kills 💀', 'Cargas 📦', 'Caídas 💔'];
      headers.forEach((h, i) => {
        const txt = this.scene.add
          .text(tableX + cols[i], tableTop, h, {
            fontSize: '13px',
            color: '#888888',
            fontFamily: 'monospace',
            fontStyle: 'bold',
          })
          .setScrollFactor(0)
          .setDepth(300);
        objects.push(txt);
      });

      // Separator line
      const sep = this.scene.add.graphics().setScrollFactor(0).setDepth(300);
      sep.lineStyle(1, 0x444444, 1);
      sep.lineBetween(tableX, tableTop + 22, tableX + tableW, tableTop + 22);
      objects.push(sep);

      // Rows
      const playerColors = ['#ffffff', '#88aaff', '#ffaa44', '#ff88aa'];
      entries.forEach(([_sid, stat], idx) => {
        const rowY = tableTop + 30 + idx * rowH;
        const color = playerColors[idx % playerColors.length];

        // Row background alternating
        if (idx % 2 === 0) {
          const rowBg = this.scene.add
            .rectangle(tableX - 8, rowY - 4, tableW + 16, rowH - 4, 0xffffff, 0.04)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(299);
          objects.push(rowBg);
        }

        const values = [
          stat.name ?? `P${idx + 1}`,
          stat.adnFarmed.toString(),
          stat.damageDealt.toString(),
          stat.kills.toString(),
          stat.cargoSealed.toString(),
          stat.timesDowned.toString(),
        ];

        values.forEach((v, ci) => {
          const txt = this.scene.add
            .text(tableX + cols[ci], rowY, v, {
              fontSize: '16px',
              color: ci === 0 ? color : '#dddddd',
              fontFamily: 'monospace',
              fontStyle: ci === 0 ? 'bold' : 'normal',
            })
            .setScrollFactor(0)
            .setDepth(300);
          objects.push(txt);
        });
      });

      // MVP highlight (más daño)
      if (entries.length > 1) {
        const mvpIdx = entries.reduce(
          (best, [, s], i) => (s.damageDealt > entries[best][1].damageDealt ? i : best),
          0
        );
        const mvpY = tableTop + 30 + mvpIdx * rowH - 4;
        const mvpLabel = this.scene.add
          .text(tableX + tableW + 10, mvpY, '⭐ MVP', {
            fontSize: '13px',
            color: '#ffdd44',
            fontFamily: 'monospace',
            fontStyle: 'bold',
          })
          .setScrollFactor(0)
          .setDepth(300);
        objects.push(mvpLabel);
      }
    }

    // ── Botón volver ─────────────────────────────────────────────────────────
    const btnY = H - 70;
    const btnBg = this.scene.add
      .rectangle(W / 2, btnY, 220, 48, 0x333333)
      .setScrollFactor(0)
      .setDepth(300)
      .setInteractive({ useHandCursor: true });

    const btnText = this.scene.add
      .text(W / 2, btnY, 'Volver al Lobby', {
        fontSize: '19px',
        color: '#ffffff',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(301);

    btnBg.on('pointerover', () => btnBg.setFillStyle(0x555555));
    btnBg.on('pointerout', () => btnBg.setFillStyle(0x333333));
    btnBg.on('pointerdown', () => this.scene.scene.start('LobbyScene'));

    objects.push(btnBg, btnText);

    // ── Container ────────────────────────────────────────────────────────────
    this.container = this.scene.add.container(0, 0, objects).setDepth(299).setScrollFactor(0);

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
