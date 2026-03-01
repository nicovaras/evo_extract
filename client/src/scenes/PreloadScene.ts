import Phaser from 'phaser';
import { ALL_SPRITES } from '../assets/spriteKeys';

const SPRITES_PATH = 'sprites/';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    // Progress bar
    const { width, height } = this.scale;
    const bar = this.add.rectangle(width / 2 - 200, height / 2, 0, 20, 0x00ff66).setOrigin(0, 0.5);
    this.add.rectangle(width / 2 - 200, height / 2, 400, 20, 0x333344).setOrigin(0, 0.5);
    this.add.text(width / 2, height / 2 - 40, 'Cargando assets...', {
      fontSize: '18px', color: '#aaaaaa', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.load.on('progress', (v: number) => { bar.width = 400 * v; });

    // Load every sprite — no fallback, missing file = error
    for (const { key, file } of ALL_SPRITES) {
      this.load.image(key, `${SPRITES_PATH}${file}`);
    }

    // Fail hard on any load error
    this.load.on('loaderror', (file: { key: string; src: string }) => {
      throw new Error(`[PreloadScene] Missing sprite: "${file.key}" → ${file.src}`);
    });
  }

  create(): void {
    this.scene.start('LobbyScene');
  }
}
