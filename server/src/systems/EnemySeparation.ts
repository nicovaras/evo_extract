import { GameState } from '../schemas/GameState';

export function separateEnemies(state: GameState): void {
  const enemies = Array.from(state.enemies.values());
  const MIN_DIST = 32; // diámetro mínimo entre centros

  for (let i = 0; i < enemies.length; i++) {
    for (let j = i + 1; j < enemies.length; j++) {
      const a = enemies[i];
      const b = enemies[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < MIN_DIST && d > 0) {
        const push = (MIN_DIST - d) / 2;
        const nx = dx / d;
        const ny = dy / d;
        a.x -= nx * push;
        a.y -= ny * push;
        b.x += nx * push;
        b.y += ny * push;
      }
    }
  }
}
