import { GameState, PlayerState, CargoState } from '../schemas/GameState';
import { CARGO_COST, CARRY_SPEED_MULT, WIN_CARGO_COUNT, EXTRACTION_COUNTDOWN } from '@evo/shared';
import { inZone } from '../../../shared/src/mapData';

export interface SealResult {
  success: boolean;
  cargoId?: string;
  reason?: string;
}

export interface DeliverResult {
  success: boolean;
  reason?: string;
}

// Track last seal time per player (rate-limit 2s)
const lastSealTime = new Map<string, number>();

// ── Zone helpers — driven by map JSON ─────────────────────────────────────────
function inHub(x: number, y: number): boolean {
  return inZone('hub', x, y);
}

function inExtraction(x: number, y: number): boolean {
  return inZone('extraction', x, y);
}

let cargoSeq = 0;

export class CargoSystem {
  // ── Tarea 23: ADN → Cargo ──────────────────────────────────────────────────
  sealCargo(player: PlayerState, state: GameState): SealResult {
    if (!inHub(player.x, player.y)) {
      return { success: false, reason: 'not_in_hub' };
    }
    const currentCost = CARGO_COST + state.timers.cargoSealed * 10;
    if (state.timers.adn < currentCost) {
      return { success: false, reason: 'insufficient_adn' };
    }
    if (player.isCarrying) {
      return { success: false, reason: 'already_carrying' };
    }

    const now = Date.now();
    const lastSeal = lastSealTime.get(player.id) ?? 0;
    if (now - lastSeal < 2000) {
      return { success: false, reason: 'rate_limited' };
    }
    lastSealTime.set(player.id, now);

    // Deduct ADN from global pool
    state.timers.adn -= currentCost;
    state.timers.cargoSealed += 1;
    player.statCargoSealed += 1;

    // Create cargo
    const cargo = new CargoState();
    cargo.id = `cargo_${++cargoSeq}`;
    cargo.x = player.x;
    cargo.y = player.y;
    cargo.isSealed = true;
    cargo.carrierId = player.id;

    state.cargo.set(cargo.id, cargo);
    player.isCarrying = true;

    return { success: true, cargoId: cargo.id };
  }

  // ── Tarea 25: tick — update cargo position, handle drop on down ───────────
  tick(state: GameState): void {
    state.players.forEach((player) => {
      if (!player.isCarrying) return;

      // Find this player's cargo
      let carriedCargo: CargoState | undefined;
      state.cargo.forEach((c) => {
        if (c.carrierId === player.id) carriedCargo = c;
      });
      if (!carriedCargo) {
        player.isCarrying = false;
        return;
      }

      if (player.isDown) {
        // Drop cargo in place
        carriedCargo.carrierId = '';
        player.isCarrying = false;
        return;
      }

      // Follow player
      carriedCargo.x = player.x;
      carriedCargo.y = player.y;
    });
  }

  // ── Tarea 25: deliver cargo ────────────────────────────────────────────────
  deliverCargo(player: PlayerState, state: GameState): DeliverResult {
    if (!player.isCarrying) {
      return { success: false, reason: 'not_carrying' };
    }
    if (!inExtraction(player.x, player.y)) {
      return { success: false, reason: 'not_in_extraction_zone' };
    }

    // Find cargo
    let cargoId: string | undefined;
    state.cargo.forEach((c, id) => {
      if (c.carrierId === player.id) cargoId = id;
    });

    if (!cargoId) {
      player.isCarrying = false;
      return { success: false, reason: 'cargo_not_found' };
    }

    state.cargo.delete(cargoId);
    player.isCarrying = false;
    state.timers.cargoDelivered += 1;

    // Check if we should start extraction phase
    if (state.timers.cargoDelivered >= WIN_CARGO_COUNT && !state.timers.isExtracting) {
      state.timers.isExtracting = true;
      state.timers.extractionCountdown = EXTRACTION_COUNTDOWN;
    }

    return { success: true };
  }

  // Apply carry speed multiplier during input processing
  getSpeedMultiplier(player: PlayerState): number {
    return player.isCarrying ? CARRY_SPEED_MULT : 1.0;
  }

  isPlayerInExtraction(player: PlayerState): boolean {
    return inExtraction(player.x, player.y);
  }
}
