import { STAT_LIMITS } from '../../content/stat-rules.ts';
import type { Enemy, Player, Vector } from '../core/types.ts';
import type { CollisionWorld } from '../world/world.ts';
export function damageEnemy(player: Player, enemy: Enemy, amount: number, knockback: number, origin: Vector,
  world: CollisionWorld, onKill: (enemy: Enemy) => void, random: () => number): void {
  if (!enemy.active) return;
  const critical = player.stats.critChance > 0 && random() < Math.min(STAT_LIMITS.critChance, player.stats.critChance);
  enemy.hp -= amount * (critical ? STAT_LIMITS.critMultiplier : 1); enemy.flash = 0.15;
  const dx = enemy.x - origin.x, dy = enemy.y - origin.y, distance = Math.max(1, Math.hypot(dx, dy));
  world.moveCircle(enemy, dx / distance * knockback, dy / distance * knockback, enemy.radius);
  if (enemy.hp <= 0) { enemy.active = false; player.kills++; onKill(enemy); }
}
