import { MapSchema } from '@colyseus/schema';
import { Room } from 'colyseus';
import { GameState, PlayerState, AdnNode } from '../schemas/GameState';

/** 1 game unit = 16px. pickupRadius in units → pixels. */
const PICKUP_RADIUS_PX = 2.0 * 16; // 32px
const MAGNET_RADIUS_PX = 120; // magnetic attraction radius
const MAGNET_SPEED = 300; // px/s

function distSq(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt(distSq(ax, ay, bx, by));
}

export class AdnCollector {
  private room: Room<GameState>;

  constructor(room: Room<GameState>) {
    this.room = room;
  }

  tick(state: GameState, players: MapSchema<PlayerState>, dt: number): void {
    const magnetRadiusSq = MAGNET_RADIUS_PX * MAGNET_RADIUS_PX;

    // Track which nodes are being attracted and by whom (closest player wins)
    const magnetTargets = new Map<string, { sessionId: string; d: number }>();

    players.forEach((player, sessionId) => {
      if (player.isDown) return;

      const pickupPx = PICKUP_RADIUS_PX * (player.pickupRadius ?? 1.0);
      const radiusSq = pickupPx * pickupPx;

      state.adnNodes.forEach((node, nodeId) => {
        if (!node.active) return;

        const d = dist(player.x, player.y, node.x, node.y);

        if (d <= pickupPx) {
          // Collect into global pool
          state.timers.adn += node.amount;
          player.statAdnFarmed += node.amount;
          node.active = false;
          state.adnNodes.delete(nodeId);

          // Broadcast pickup to all clients
          this.room.broadcast('adnPickup', { amount: node.amount, total: state.timers.adn });
        } else if (d <= MAGNET_RADIUS_PX) {
          // Magnetic: closest player wins
          const current = magnetTargets.get(nodeId);
          if (!current || d < current.d) {
            magnetTargets.set(nodeId, { sessionId, d });
          }
        }
      });
    });

    // Apply magnetic movement for closest player per node
    magnetTargets.forEach(({ sessionId }, nodeId) => {
      const node = state.adnNodes.get(nodeId);
      const player = players.get(sessionId);
      if (!node || !node.active || !player) return;

      const d = dist(player.x, player.y, node.x, node.y);
      if (d === 0) return;

      node.x += ((player.x - node.x) / d) * MAGNET_SPEED * dt;
      node.y += ((player.y - node.y) / d) * MAGNET_SPEED * dt;
    });
  }
}
