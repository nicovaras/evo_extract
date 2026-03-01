import { z } from 'zod';

// ─── Schemas ───────────────────────────────────────────────────────────────────

export const JoinRoomPayloadSchema = z.object({
  code: z.string().length(6),
  playerName: z.string().min(1).max(20),
});

export const CraftRequestSchema = z.object({
  partId: z.string(),
});

export const CarryCargoRequestSchema = z.object({
  cargoId: z.string(),
});

// ─── Inferred Types ────────────────────────────────────────────────────────────

export type JoinRoomPayload = z.infer<typeof JoinRoomPayloadSchema>;
export type CraftRequest = z.infer<typeof CraftRequestSchema>;
export type CarryCargoRequest = z.infer<typeof CarryCargoRequestSchema>;
