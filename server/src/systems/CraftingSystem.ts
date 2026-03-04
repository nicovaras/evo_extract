import { CraftResult, PartDefinition } from '@evo/shared';
import { inZone } from '../../../shared/src/mapData';
import { GameState, PlayerState } from '../schemas/GameState';
import { getPartById } from '../config/partsTable';

/** Minimum ms between craft requests per player (client holds 1s, server adds margin). */
const CRAFT_RATE_LIMIT_MS = 800;

export class CraftingSystem {
  /** sessionId → timestamp of last successful craft */
  private lastCraftTime = new Map<string, number>();

  craft(player: PlayerState, partId: string, gameState: GameState): CraftResult {
    const part: PartDefinition | undefined = getPartById(partId);

    // 1. Part exists?
    if (!part) {
      return { success: false, reason: `Parte desconocida: ${partId}` };
    }

    // 2. Part is in this player's assigned pool (Ranged is always allowed)
    if (part.slot !== 'Ranged') {
      const assigned: string[] = [];
      for (let i = 0; i < player.assignedParts.length; i++)
        assigned.push(player.assignedParts[i] as string);
      if (!assigned.includes(partId)) {
        return { success: false, reason: 'Esta parte no está disponible para vos esta partida.' };
      }
    }

    // 3. Player in Hub zone?
    if (!inZone('hub', player.x, player.y)) {
      return { success: false, reason: 'Debés estar en el Hub para craftear.' };
    }

    // 3. Rate limit (prevent duplicate requests < CRAFT_RATE_LIMIT_MS)
    const last = this.lastCraftTime.get(player.id) ?? 0;
    if (Date.now() - last < CRAFT_RATE_LIMIT_MS) {
      return { success: false, reason: 'Crafteo demasiado rápido. Esperá un momento.' };
    }

    // 4. Already equipped in this slot?
    const alreadyInSlot = this._getEquippedForSlot(player, part.slot);
    if (alreadyInSlot === partId) {
      return { success: false, reason: 'Esta parte ya está equipada.' };
    }

    // 5. ADN suficiente (global pool)?
    if (gameState.timers.adn < part.cost) {
      return {
        success: false,
        reason: `ADN insuficiente. Necesitás ${part.cost}, hay ${gameState.timers.adn}.`,
      };
    }

    // ── Apply ──────────────────────────────────────────────────────────────────

    // Remove previous part in same slot and revert its modifiers
    if (alreadyInSlot) {
      const oldPart = getPartById(alreadyInSlot);
      if (oldPart) {
        this._applyModifiers(player, oldPart, -1);
      }
      // Rebuild equippedParts without the old part (ArraySchema-safe)
      const remaining: string[] = [];
      for (let i = 0; i < player.equippedParts.length; i++) {
        const p = player.equippedParts[i];
        if (p !== alreadyInSlot && p !== undefined) remaining.push(p);
      }
      player.equippedParts.splice(0, player.equippedParts.length);
      remaining.forEach((p) => player.equippedParts.push(p as string));
    }

    // Deduct ADN from global pool
    gameState.timers.adn -= part.cost;

    // Add to equippedParts
    player.equippedParts.push(partId);

    // Apply new stat modifiers
    this._applyModifiers(player, part, 1);

    // Ranged module: toggle combat mode
    if (part.slot === 'Ranged') {
      player.isRanged = true;
    }
    // If the old part in this slot was Ranged and we're replacing it, revert
    if (alreadyInSlot) {
      const oldPart = getPartById(alreadyInSlot);
      if (oldPart?.slot === 'Ranged') player.isRanged = false;
    }

    // Keep meleeDamage in sync (base before ranged penalty)
    player.meleeDamage = player.attackDamage;

    // Clamp HP to maxHp after potential maxHp changes
    if (player.hp > player.maxHp) player.hp = player.maxHp;

    // Record timestamp for rate limiting
    this.lastCraftTime.set(player.id, Date.now());

    return { success: true, part };
  }

  /** Find which partId (if any) is currently equipped for a given slot. */
  private _getEquippedForSlot(player: PlayerState, slot: string): string | null {
    for (let i = 0; i < player.equippedParts.length; i++) {
      const id: string | undefined = player.equippedParts[i];
      if (!id) continue;
      const def = getPartById(id);
      if (def && def.slot === slot) return id;
    }
    return null;
  }

  private _applyModifiers(player: PlayerState, part: PartDefinition, sign: 1 | -1): void {
    const m = part.statModifiers;
    if (m.speed !== undefined) player.speed += sign * m.speed;
    if (m.maxHp !== undefined) player.maxHp += sign * m.maxHp;
    if (m.damage !== undefined) player.attackDamage += sign * m.damage;
    if (m.armor !== undefined) player.armor += sign * m.armor;
    if (m.critChance !== undefined) player.critChance += sign * m.critChance;
    if (m.critMult !== undefined) player.critMult += sign * m.critMult;
    if (m.lifeSteal !== undefined) player.lifeSteal += sign * m.lifeSteal;
    if (m.attackRate !== undefined) player.attackRate += sign * m.attackRate;
    if (m.pickupRadius !== undefined) player.pickupRadius += sign * m.pickupRadius;
    if (m.carryPenalty !== undefined) player.carryPenalty += sign * m.carryPenalty;
    if (m.interactSpeed !== undefined) player.interactSpeed += sign * m.interactSpeed;
    // Clamp sanity
    player.critChance = Math.max(0, Math.min(0.95, player.critChance));
    player.critMult = Math.max(1.0, player.critMult);
    player.armor = Math.max(0, player.armor);
    player.speed = Math.max(1.0, player.speed);
    player.attackRate = Math.max(0.2, player.attackRate);
    player.pickupRadius = Math.max(0.5, player.pickupRadius);
    player.carryPenalty = Math.max(0.3, Math.min(1.0, player.carryPenalty));
    player.interactSpeed = Math.max(0.3, player.interactSpeed);
  }
}
