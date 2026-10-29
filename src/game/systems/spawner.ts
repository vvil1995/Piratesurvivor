import { ENEMIES, MARINEFORD } from '../../content/catalog.ts';
import type { Pool } from '../core/pool.ts';
import type { Enemy, Player } from '../core/types.ts';
export interface View { width: number; height: number; centerX: number; centerY: number }
export function spawnMarine(pool: Pool<Enemy>, player: Player, time: number, view: View, random: () => number, id: number): void {
  if (pool.count >= MARINEFORD.enemyCap) return;
  // Un rectángulo exterior, no un radio aproximado: tampoco aparecen en las esquinas visibles.
  let x = 0, y = 0, found = false;
  for (let tries = 0; tries < 20; tries++) {
    const side = Math.floor(random() * 4), pad = 60;
    if (side < 2) {
      x = view.centerX + (side === 0 ? -1 : 1) * (view.width / 2 + pad);
      y = view.centerY + (random() - 0.5) * (view.height + pad * 2);
    } else {
      x = view.centerX + (random() - 0.5) * (view.width + pad * 2);
      y = view.centerY + (side === 2 ? -1 : 1) * (view.height / 2 + pad);
    }
    if (x > 50 && x < MARINEFORD.width - 50 && y > 130 && y < MARINEFORD.height - 70 && Math.hypot(x - player.x, y - player.y) > 180) { found = true; break; }
  }
  if (!found) return;
  const enemy = pool.acquire();
  if (!enemy) return;
  const def = ENEMIES.marine, scale = 1 + time / 220;
  Object.assign(enemy, { x, y, id, hp: def.hp * scale, maxHp: def.hp * scale,
    speed: def.speed + Math.min(50, time * 0.09), damage: def.damage + Math.floor(time / 90) * 2,
    xp: def.xp, radius: def.radius, flash: 0 });
}
