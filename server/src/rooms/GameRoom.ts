import { Room, Client } from 'colyseus';
import { Schema, type, MapSchema } from '@colyseus/schema';
import { getSpawn } from '../../../shared/src/mapData';

class PlayerState extends Schema {
  @type('string') id: string = '';
  @type('number') x: number = 0;
  @type('number') y: number = 0;
}

class GameState extends Schema {
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
}

export class GameRoom extends Room<GameState> {
  maxClients = parseInt(process.env.ROOM_MAX_CLIENTS ?? '4', 10);

  onCreate(): void {
    this.setState(new GameState());
    console.log(`[GameRoom] Room created: ${this.roomId}`);
  }

  onJoin(client: Client): void {
    const player = new PlayerState();
    player.id = client.sessionId;
    const sp = getSpawn('player');
    player.x = sp ? sp.x : Math.floor(Math.random() * 400);
    player.y = sp ? sp.y : Math.floor(Math.random() * 300);
    this.state.players.set(client.sessionId, player);
    console.log(`[GameRoom] Player joined: ${client.sessionId}`);
  }

  onLeave(client: Client): void {
    this.state.players.delete(client.sessionId);
    console.log(`[GameRoom] Player left: ${client.sessionId}`);
  }

  onDispose(): void {
    console.log(`[GameRoom] Room disposed: ${this.roomId}`);
  }
}
