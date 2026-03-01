import Phaser from 'phaser';

interface ZoneConfig {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  activatesAt?: string;
  active?: boolean;
}

export class ToxicZone {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private particles: Phaser.GameObjects.Graphics[] = [];
  private pulseTween: Phaser.Tweens.Tween | null = null;
  private particleTimers: Phaser.Time.TimerEvent[] = [];

  public readonly id: string;
  public readonly config: ZoneConfig;
  private _active: boolean = false;

  constructor(scene: Phaser.Scene, config: ZoneConfig) {
    this.scene = scene;
    this.id = config.id;
    this.config = config;

    this.graphics = scene.add.graphics();
    this.graphics.setDepth(2);
    this.graphics.setVisible(false);
    this._draw(0.25);
  }

  private _draw(alpha: number): void {
    const g = this.graphics;
    g.clear();
    g.fillStyle(0x00ff44, alpha);
    g.fillRect(this.config.x, this.config.y, this.config.width, this.config.height);
    g.lineStyle(2, 0x00ff88, 1);
    g.strokeRect(this.config.x, this.config.y, this.config.width, this.config.height);
  }

  get active(): boolean {
    return this._active;
  }

  activate(fadeIn: boolean = false): void {
    if (this._active) return;
    this._active = true;
    this.graphics.setVisible(true);

    if (fadeIn) {
      this.graphics.setAlpha(0);
      this.scene.tweens.add({
        targets: this.graphics,
        alpha: 0.25,
        duration: 600,
        ease: 'Quad.easeOut',
        onComplete: () => this._startPulse(),
      });
    } else {
      this.graphics.setAlpha(0.25);
      this._startPulse();
    }

    this._startParticles();
  }

  private _startPulse(): void {
    this.pulseTween = this.scene.tweens.add({
      targets: this.graphics,
      alpha: { from: 0.15, to: 0.35 },
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    // Redraw at lower alpha won't update the fill — instead use tween on alpha directly
    // The graphics alpha handles it via setAlpha tween target above
  }

  private _startParticles(): void {
    const spawnParticle = (): void => {
      const px =
        this.config.x + Math.random() * this.config.width;
      const py =
        this.config.y + this.config.height - Math.random() * 20;

      const g = this.scene.add.graphics();
      g.fillStyle(0x00ff66, 0.7);
      g.fillCircle(0, 0, Phaser.Math.Between(2, 5));
      g.setPosition(px, py);
      g.setDepth(3);
      this.particles.push(g);

      this.scene.tweens.add({
        targets: g,
        y: py - Phaser.Math.Between(30, 70),
        alpha: 0,
        duration: Phaser.Math.Between(1000, 2000),
        ease: 'Linear',
        onComplete: () => {
          g.destroy();
          const idx = this.particles.indexOf(g);
          if (idx !== -1) this.particles.splice(idx, 1);
        },
      });
    };

    const timer = this.scene.time.addEvent({
      delay: 300,
      loop: true,
      callback: () => {
        if (this._active) spawnParticle();
      },
    });
    this.particleTimers.push(timer);
  }

  destroy(): void {
    this.pulseTween?.stop();
    this.particleTimers.forEach((t) => t.destroy());
    this.particles.forEach((g) => g.destroy());
    this.graphics.destroy();
  }
}
