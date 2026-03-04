import * as Colyseus from 'colyseus.js';

export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'retrying' | 'failed';

export interface NetworkEvents {
  stateChange: (state: ConnectionState, attempt?: number) => void;
  connected: (room: Colyseus.Room) => void;
  disconnected: () => void;
  error: (err: Error) => void;
}

type EventListener<K extends keyof NetworkEvents> = NetworkEvents[K];

const _host = import.meta.env.VITE_SERVER_HOST ?? window.location.hostname;
const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? `ws://${_host}:2567`;
const HTTP_URL = import.meta.env.VITE_HTTP_URL ?? `http://${_host}:2567`;

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

export class NetworkClient {
  private static instance: NetworkClient;

  private client: Colyseus.Client;
  private room: Colyseus.Room | null = null;
  private state: ConnectionState = 'idle';
  private roomCode: string = '';
  private listeners: { [K in keyof NetworkEvents]?: Array<EventListener<K>> } = {};

  private constructor() {
    this.client = new Colyseus.Client(SERVER_URL);
  }

  static getInstance(): NetworkClient {
    if (!NetworkClient.instance) {
      NetworkClient.instance = new NetworkClient();
    }
    return NetworkClient.instance;
  }

  // ─── Event Emitter ──────────────────────────────────────────────────────────

  on<K extends keyof NetworkEvents>(event: K, listener: EventListener<K>): this {
    if (!this.listeners[event]) {
      (this.listeners as Record<string, unknown[]>)[event] = [];
    }
    (this.listeners[event] as EventListener<K>[]).push(listener);
    return this;
  }

  off<K extends keyof NetworkEvents>(event: K, listener: EventListener<K>): this {
    const arr = this.listeners[event] as EventListener<K>[] | undefined;
    if (arr) {
      const idx = arr.indexOf(listener);
      if (idx !== -1) arr.splice(idx, 1);
    }
    return this;
  }

  private emit<K extends keyof NetworkEvents>(
    event: K,
    ...args: Parameters<NetworkEvents[K]>
  ): void {
    const arr = this.listeners[event] as
      | ((...a: Parameters<NetworkEvents[K]>) => void)[]
      | undefined;
    arr?.forEach((fn) => fn(...args));
  }

  // ─── State Management ───────────────────────────────────────────────────────

  private setState(state: ConnectionState, attempt?: number): void {
    this.state = state;
    this.emit('stateChange', state, attempt);
  }

  getState(): ConnectionState {
    return this.state;
  }

  getRoom(): Colyseus.Room | null {
    return this.room;
  }

  getRoomCode(): string {
    return this.roomCode;
  }

  // ─── Connection ─────────────────────────────────────────────────────────────

  async connect(roomId: string, playerName?: string): Promise<Colyseus.Room> {
    this.setState('connecting');

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const room = await this.client.joinById(roomId, { name: playerName ?? 'Jugador' });
        this.room = room;
        this.setState('connected');
        this.emit('connected', room);
        this._watchRoom(room);
        return room;
      } catch (err) {
        if (attempt < MAX_RETRIES) {
          this.setState('retrying', attempt);
          await this._delay(RETRY_DELAY_MS);
        } else {
          this.setState('failed');
          const error = err instanceof Error ? err : new Error(String(err));
          this.emit('error', error);
          throw error;
        }
      }
    }

    // Should not reach here
    throw new Error('Connection failed');
  }

  // ─── Create Room via HTTP ───────────────────────────────────────────────────

  async createRoom(): Promise<{ roomId: string; code: string }> {
    const res = await fetch(`${HTTP_URL}/rooms/create`, { method: 'POST' });
    if (!res.ok) {
      throw new Error(`Failed to create room: ${res.statusText}`);
    }
    const data = (await res.json()) as { roomId: string; code: string };
    this.roomCode = data.code;
    return data;
  }

  // ─── Internal Helpers ───────────────────────────────────────────────────────

  private _watchRoom(room: Colyseus.Room): void {
    room.onLeave(() => {
      this.room = null;
      this.setState('idle');
      this.emit('disconnected');
    });
  }

  private _delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  disconnect(): void {
    this.room?.leave();
    this.room = null;
    this.setState('idle');
  }
}
