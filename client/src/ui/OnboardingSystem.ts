import Phaser from 'phaser';

const TIPS = {
  WELCOME: 'WASD para moverse · Click para disparar · Shift para dash',
  ADN: 'Recolectaste ADN 🧬 · Ve al HUB (zona verde) · Presioná E para evolucionar',
  HUB: 'E → Panel de evolución · F (hold) → Sellar Carga (30 ADN) · Necesitás 8 cargas para ganar',
  CARGO: '¡Llevá la carga 📦 a la zona de EXTRACCIÓN (amarilla, arriba-derecha)!',
  EXTRACTING: '¡EXTRACCIÓN ACTIVA! ⏱ Quedate en la zona amarilla 60 segundos',
} as const;

interface PlayerState {
  adn: number;
  x: number;
  y: number;
  isCarrying?: boolean;
}

interface GameState {
  cargoDelivered?: number;
  timers?: { isExtracting?: boolean };
}

const HUB_X_MIN = 800;
const HUB_X_MAX = 1200;
const HUB_Y_MIN = 800;
const HUB_Y_MAX = 1200;

export class OnboardingSystem {
  private scene: Phaser.Scene;
  private shown = new Set<string>();
  private currentTip: { bg: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text } | null = null;
  private tipTimer: Phaser.Time.TimerEvent | null = null;
  private keyListener: ((ev: KeyboardEvent) => void) | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Show the welcome tip immediately (call after joining room). */
  showWelcome(): void {
    this._show(TIPS.WELCOME);
  }

  update(player: PlayerState, game: GameState): void {
    // Tip 2: first ADN pickup
    if (!this.shown.has(TIPS.ADN) && player.adn > 0) {
      this._show(TIPS.ADN);
      return;
    }

    // Tip 3: first time entering hub
    const inHub =
      player.x >= HUB_X_MIN && player.x <= HUB_X_MAX &&
      player.y >= HUB_Y_MIN && player.y <= HUB_Y_MAX;
    if (!this.shown.has(TIPS.HUB) && inHub && this.shown.has(TIPS.ADN)) {
      this._show(TIPS.HUB);
      return;
    }

    // Tip 4: first cargo delivered
    if (!this.shown.has(TIPS.CARGO) && (game.cargoDelivered ?? 0) >= 1 && this.shown.has(TIPS.HUB)) {
      this._show(TIPS.CARGO);
      return;
    }

    // Tip 5: extraction active
    if (!this.shown.has(TIPS.EXTRACTING) && game.timers?.isExtracting) {
      this._show(TIPS.EXTRACTING);
    }
  }

  private _show(tipText: string): void {
    // Mark as shown immediately (avoid re-triggering before dismiss)
    this.shown.add(tipText);

    // If there's already a tip showing, destroy it
    this._destroyCurrentTip();

    const cam = this.scene.cameras.main;
    const cx = cam.width / 2;
    const cy = cam.height - 120;

    const bg = this.scene.add.rectangle(cx, cy, 500, 70, 0x000000, 0.7);
    bg.setScrollFactor(0);
    bg.setDepth(150);
    bg.setAlpha(0);

    const text = this.scene.add.text(cx, cy, tipText, {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 480 },
    });
    text.setOrigin(0.5);
    text.setScrollFactor(0);
    text.setDepth(151);
    text.setAlpha(0);

    this.currentTip = { bg, text };

    // Fade in
    this.scene.tweens.add({
      targets: [bg, text],
      alpha: 1,
      duration: 300,
      ease: 'Linear',
    });

    // Auto-dismiss after 4s
    this.tipTimer = this.scene.time.delayedCall(4000, () => {
      this._fadeOutAndDestroy();
    });

    // Dismiss on any key
    this.keyListener = () => this._fadeOutAndDestroy();
    window.addEventListener('keydown', this.keyListener, { once: true });
  }

  private _fadeOutAndDestroy(): void {
    if (!this.currentTip) return;
    const { bg, text } = this.currentTip;
    this.scene.tweens.add({
      targets: [bg, text],
      alpha: 0,
      duration: 300,
      ease: 'Linear',
      onComplete: () => {
        bg.destroy();
        text.destroy();
      },
    });
    this.currentTip = null;
    this.tipTimer?.remove(false);
    this.tipTimer = null;
    if (this.keyListener) {
      window.removeEventListener('keydown', this.keyListener);
      this.keyListener = null;
    }
  }

  private _destroyCurrentTip(): void {
    if (!this.currentTip) return;
    this.currentTip.bg.destroy();
    this.currentTip.text.destroy();
    this.currentTip = null;
    this.tipTimer?.remove(false);
    this.tipTimer = null;
    if (this.keyListener) {
      window.removeEventListener('keydown', this.keyListener);
      this.keyListener = null;
    }
  }

  destroy(): void {
    this._destroyCurrentTip();
  }
}
