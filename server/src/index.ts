import 'dotenv/config';
import { createServer } from 'http';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { Server, matchMaker } from 'colyseus';
import { monitor } from '@colyseus/monitor';
import { GameRoom } from './rooms/GameRoom';
import { ExtractionRoom } from './rooms/ExtractionRoom';

const PORT = parseInt(process.env.PORT ?? '2567', 10);
const CLIENT_URL = process.env.CLIENT_URL ?? '*';

const app = express();

app.use(cors({ origin: CLIENT_URL === '*' ? true : CLIENT_URL }));
app.use(express.json());

const httpServer = createServer(app);

const gameServer = new Server({ server: httpServer });

gameServer.define('game_room', GameRoom);
gameServer.define('extraction', ExtractionRoom);

// ── Room code registry ───────────────────────────────────────────────────────
const codeToRoomId = new Map<string, string>();

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ── POST /rooms/create ───────────────────────────────────────────────────────
app.post('/rooms/create', async (_req: Request, res: Response) => {
  try {
    const room = await matchMaker.createRoom('extraction', {});
    let code = generateCode();
    while (codeToRoomId.has(code)) code = generateCode();
    codeToRoomId.set(code, room.roomId);
    res.json({ roomId: room.roomId, code });
  } catch (err) {
    console.error('[/rooms/create]', err);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// ── GET /rooms/:code ─────────────────────────────────────────────────────────
app.get('/rooms/:code', async (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase();
  const roomId = codeToRoomId.get(code);

  if (!roomId) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }

  try {
    const rooms = await matchMaker.query({ roomId });
    if (!rooms || rooms.length === 0) {
      codeToRoomId.delete(code);
      res.status(404).json({ error: 'Room no longer exists' });
      return;
    }
    const room = rooms[0];
    const hasSpace = room.clients < room.maxClients;

    res.json({
      roomId: room.roomId,
      code,
      clients: room.clients,
      maxClients: room.maxClients,
      hasSpace,
      metadata: room.metadata ?? null,
    });
  } catch (err) {
    console.error('[/rooms/:code]', err);
    res.status(500).json({ error: 'Failed to query room' });
  }
});

// ── GET /status ──────────────────────────────────────────────────────────────
app.get('/status', async (_req: Request, res: Response) => {
  try {
    const rooms = await matchMaker.query({});
    const activeRooms = rooms.length;
    const totalPlayers = rooms.reduce((sum, r) => sum + (r.clients ?? 0), 0);
    res.json({ activeRooms, totalPlayers });
  } catch (err) {
    console.error('[/status]', err);
    res.status(500).json({ error: 'Failed to retrieve status' });
  }
});

// ── Monitor & health ─────────────────────────────────────────────────────────
app.use('/colyseus', monitor());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 EVO-EXTRACT server running on port ${PORT}`);
  console.log(`   CORS allowed for: ${CLIENT_URL}`);
  console.log(`   Monitor: http://localhost:${PORT}/colyseus`);
});
