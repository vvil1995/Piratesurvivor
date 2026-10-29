import { ABILITIES } from '../../content/catalog.ts';
import type { Enemy, Player, Strike } from '../core/types.ts';
import type { SpatialGrid } from '../spatial/grid.ts';
export function attack(player: Player, grid: SpatialGrid, abilityId: string, onKill: (enemy: Enemy) => void): Strike | undefined {
  let target: Enemy | undefined;
  let closest = player.stats.range ** 2;
  grid.visit(player.x, player.y, player.stats.range, enemy => {
    const d = (player.x - enemy.x) ** 2 + (player.y - enemy.y) ** 2;
    if (d <= closest) { closest = d; target = enemy; }
  });
  if (!target) return;
  const angle = Math.atan2(target.y - player.y, target.x - player.x);
  const arc = ABILITIES[abilityId].arc;
  player.facing = angle;
  grid.visit(player.x, player.y, player.stats.range + 15, enemy => {
    const dx = enemy.x - player.x, dy = enemy.y - player.y, distance = Math.hypot(dx, dy);
    if (distance > player.stats.range + enemy.radius) return;
    if (distance > 1 && (dx * Math.cos(angle) + dy * Math.sin(angle)) / distance < Math.cos(arc)) return;
    enemy.hp -= player.stats.damage; enemy.flash = 0.15;
    const knock = 13 / Math.max(1, distance);
    enemy.x += dx * knock; enemy.y += dy * knock;
    if (enemy.hp <= 0) { enemy.active = false; player.kills++; onKill(enemy); }
  });
  player.attackTimer = player.stats.cooldown;
  return { x: player.x, y: player.y, angle, reach: Math.sqrt(closest), life: 0.18 };
}
