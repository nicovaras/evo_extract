import { WALLS } from '@evo/shared';

export function resolveWallCollision(x: number, y: number, radius: number = 16): { x: number; y: number } {
  let nx = x, ny = y;
  for (const w of WALLS) {
    // AABB vs circle: encontrar el punto más cercano del rect al círculo
    const closestX = Math.max(w.x, Math.min(nx, w.x + w.w));
    const closestY = Math.max(w.y, Math.min(ny, w.y + w.h));
    const dx = nx - closestX;
    const dy = ny - closestY;
    const distSq = dx * dx + dy * dy;
    if (distSq < radius * radius && distSq > 0) {
      const dist = Math.sqrt(distSq);
      const overlap = radius - dist;
      nx += (dx / dist) * overlap;
      ny += (dy / dist) * overlap;
    } else if (distSq === 0) {
      // Dentro del rect: empujar al borde más cercano
      nx += radius;
    }
  }
  return { x: nx, y: ny };
}
