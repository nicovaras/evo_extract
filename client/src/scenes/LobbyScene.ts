/* eslint-disable @typescript-eslint/no-explicit-any */
import Phaser from 'phaser';
import { NetworkClient, ConnectionState } from '../network/ColyseusClient';

const HTTP_URL =
  (import.meta as { env?: { VITE_HTTP_URL?: string } }).env?.VITE_HTTP_URL ??
  `http://${window.location.hostname}:2567`;

const STYLE_LABEL: Phaser.Types.GameObjects.Text.TextStyle = {
  fontSize: '16px',
  color: '#aaaaaa',
  fontFamily: 'monospace',
};

const STYLE_STATUS: Phaser.Types.GameObjects.Text.TextStyle = {
  fontSize: '18px',
  color: '#00ff88',
  fontFamily: 'monospace',
  backgroundColor: '#00000088',
  padding: { x: 12, y: 6 },
};

export class LobbyScene extends Phaser.Scene {
  private statusText!: Phaser.GameObjects.Text;
  private codeInput!: HTMLInputElement;
  private nameInput!: HTMLInputElement;
  private network: NetworkClient;
  private retryAttempt = 0;

  constructor() {
    super({ key: 'LobbyScene' });
    this.network = NetworkClient.getInstance();
  }

  create(): void {
    const { width, height } = this.scale;
    const cx = width / 2;

    // ── Title ────────────────────────────────────────────────────────────────
    this.add
      .text(cx, 80, 'EVO-EXTRACT', {
        fontSize: '48px',
        color: '#00ff88',
        fontStyle: 'bold',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 135, 'Lobby', { ...STYLE_LABEL, fontSize: '22px', color: '#ffffff' })
      .setOrigin(0.5);

    // ── Name input ────────────────────────────────────────────────────────────
    this.add.text(cx - 130, 195, 'Tu nombre:', STYLE_LABEL).setOrigin(0, 0.5);
    this.nameInput = this._createInput(cx, 220, 'Nombre', false);

    // ── Code input (HTML overlay) ─────────────────────────────────────────────
    this.add.text(cx - 130, 275, 'Código de sala:', STYLE_LABEL).setOrigin(0, 0.5);
    this.codeInput = this._createInput(cx, 300, 'Ej: ABC123', true);

    // ── Buttons ───────────────────────────────────────────────────────────────
    this._createButton(cx - 95, 370, 'Crear sala', '#1a6b3a', () => this._handleCreate());
    this._createButton(cx + 95, 370, 'Unirse', '#1a3a6b', () => this._handleJoin());

    // ── Status overlay ────────────────────────────────────────────────────────
    this.statusText = this.add
      .text(cx, height - 60, '', STYLE_STATUS)
      .setOrigin(0.5)
      .setVisible(false);

    // ── Network listeners ─────────────────────────────────────────────────────
    this.network.on('stateChange', (state: ConnectionState, attempt?: number) => {
      this._updateStatus(state, attempt);
    });

    this.network.on('connected', () => {
      this._setStatus('Conectado ✓', '#00ff88');
      this.time.delayedCall(800, () => {
        this._destroyInput();
        this.scene.start('GameScene');
      });
    });

    this.network.on('error', () => {
      this._setStatus('Error al conectar', '#ff4444');
    });
  }

  shutdown(): void {
    this._destroyInput();
  }

  // ─── Handlers ───────────────────────────────────────────────────────────────

  private async _handleCreate(): Promise<void> {
    try {
      this._setStatus('Creando sala...', '#ffcc00');
      const { roomId, code } = await this.network.createRoom();
      this.codeInput.value = code;
      this._setStatus(`Sala creada: ${code}`, '#00ff88');
      await this.network.connect(roomId, this._getPlayerName());
    } catch {
      // error event already handled
    }
  }

  private async _handleJoin(): Promise<void> {
    const code = this.codeInput.value.trim().toUpperCase();
    if (!code) {
      this._setStatus('Ingresá un código', '#ffcc00');
      return;
    }
    try {
      this._setStatus('Buscando sala...', '#ffcc00');
      const res = await fetch(`${HTTP_URL}/rooms/${code}`);
      if (!res.ok) {
        this._setStatus('Sala no encontrada', '#ff4444');
        return;
      }
      const data = (await res.json()) as { roomId: string; hasSpace: boolean };
      if (!data.hasSpace) {
        this._setStatus('Sala llena', '#ff4444');
        return;
      }
      (this.network as any).roomCode = code;
      await this.network.connect(data.roomId, this._getPlayerName());
    } catch {
      this._setStatus('Error al buscar sala', '#ff4444');
    }
  }

  // ─── Status UI ──────────────────────────────────────────────────────────────

  private _updateStatus(state: ConnectionState, attempt?: number): void {
    const messages: Record<ConnectionState, string> = {
      idle: '',
      connecting: 'Conectando...',
      connected: 'Conectado ✓',
      retrying: `Reintentando (${attempt ?? '?'}/3)...`,
      failed: 'Error al conectar',
    };
    const colors: Record<ConnectionState, string> = {
      idle: '#aaaaaa',
      connecting: '#ffcc00',
      connected: '#00ff88',
      retrying: '#ff8800',
      failed: '#ff4444',
    };
    this._setStatus(messages[state], colors[state]);
  }

  private _setStatus(message: string, color: string): void {
    if (!message) {
      this.statusText.setVisible(false);
      return;
    }
    this.statusText
      .setText(message)
      .setStyle({ ...STYLE_STATUS, color })
      .setVisible(true);
  }

  // ─── DOM Helpers ─────────────────────────────────────────────────────────────

  private _createInput(
    x: number,
    y: number,
    placeholder: string,
    uppercase = false
  ): HTMLInputElement {
    const canvas = this.game.canvas;
    const rect = canvas.getBoundingClientRect();

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = placeholder;
    input.maxLength = uppercase ? 12 : 20;
    input.style.cssText = `
      position: fixed;
      left: ${rect.left + x - 130}px;
      top: ${rect.top + y - 18}px;
      width: 260px;
      height: 36px;
      background: #0d0d1a;
      color: #ffffff;
      border: 2px solid #00ff8888;
      border-radius: 6px;
      padding: 0 10px;
      font-size: 18px;
      font-family: monospace;
      outline: none;
      text-align: center;
      ${uppercase ? 'text-transform: uppercase; letter-spacing: 4px;' : ''}
      z-index: 1000;
    `;
    document.body.appendChild(input);
    return input;
  }

  private _createButton(
    x: number,
    y: number,
    label: string,
    bg: string,
    onClick: () => void
  ): void {
    const btn = this.add
      .text(x, y, label, {
        fontSize: '20px',
        color: '#ffffff',
        fontFamily: 'monospace',
        backgroundColor: bg,
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setAlpha(0.8));
    btn.on('pointerout', () => btn.setAlpha(1));
    btn.on('pointerdown', onClick);
  }

  private _getPlayerName(): string {
    return this.nameInput?.value.trim() || 'Jugador';
  }

  private _destroyInput(): void {
    if (this.codeInput?.parentNode) this.codeInput.parentNode.removeChild(this.codeInput);
    if (this.nameInput?.parentNode) this.nameInput.parentNode.removeChild(this.nameInput);
  }
}
