import * as Colyseus from 'colyseus.js';
import Phaser from 'phaser';

export interface InputPayload {
  dx: number;
  dy: number;
  facing: number;
  shooting: boolean;
  dash: boolean;
}

const SEND_INTERVAL_MS = 50; // 20 Hz

export class InputManager {
  private room: Colyseus.Room;
  private scene: Phaser.Scene;

  private keys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    SHIFT: Phaser.Input.Keyboard.Key;
  };

  private isShooting = false;
  private lastSendTime = 0;

  constructor(scene: Phaser.Scene, room: Colyseus.Room) {
    this.scene = scene;
    this.room = room;
    this._setupKeys();
    this._setupMouseListeners();
  }

  private _setupKeys(): void {
    const kb = this.scene.input.keyboard!;
    this.keys = {
      W: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      SHIFT: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
    };
  }

  private _setupMouseListeners(): void {
    this.scene.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (ptr.leftButtonDown()) this.isShooting = true;
    });
    this.scene.input.on('pointerup', (ptr: Phaser.Input.Pointer) => {
      if (!ptr.leftButtonDown()) this.isShooting = false;
    });
  }

  /**
   * Call this every frame from scene update().
   * Returns the current payload (useful for local prediction).
   */
  update(playerX: number, playerY: number): InputPayload {
    let dx = 0;
    let dy = 0;

    if (this.keys.W.isDown) dy -= 1;
    if (this.keys.S.isDown) dy += 1;
    if (this.keys.A.isDown) dx -= 1;
    if (this.keys.D.isDown) dx += 1;

    const pointer = this.scene.input.activePointer;
    // Convert screen pointer to world coords
    const worldX = pointer.worldX;
    const worldY = pointer.worldY;
    const facing = Math.atan2(worldY - playerY, worldX - playerX);

    const dash = this.keys.SHIFT.isDown;

    const payload: InputPayload = { dx, dy, facing, shooting: this.isShooting, dash };

    // Rate-limited send
    const now = Date.now();
    if (now - this.lastSendTime >= SEND_INTERVAL_MS) {
      this.room.send('input', payload);
      this.lastSendTime = now;
    }

    return payload;
  }

  destroy(): void {
    this.scene.input.off('pointerdown');
    this.scene.input.off('pointerup');
  }
}
