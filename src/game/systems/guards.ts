import { activeMovements } from './loadout.ts';
import { ABILITIES } from '../../content/attacks.ts';
import type { Enemy, Player, Vector } from '../core/types.ts';
import type { CollisionWorld } from '../world/world.ts';
import type { SpatialGrid } from '../spatial/grid.ts';
import { damageEnemy } from './hits.ts';
import { attackCooldown, refreshStats } from './stats.ts';
export function tickGuards(player: Player, dt: number): void {
  let armor = 0, regeneration = 0;
  for (const state of player.attacks) {
    const ability = ABILITIES[state.id]; if (ability.buff) continue;
    state.activeFor = Math.max(0, state.activeFor - dt);
    const params = ability.levels[state.level - 1];
    if (ability.behavior === 'guard') {
      state.cooldown = Math.max(0, state.cooldown - dt);
      if (!activeMovements(player).includes(state.id)) { state.activeFor = 0; state.activationPending = false; continue; }
      if (state.cooldown <= 0) {
        state.activeFor = params.duration ?? 2; state.activationPending = true; state.counterUsed = false;
        state.cooldown = attackCooldown(ability.levels[0].cooldown, params.cooldown, player);
      }
      if (state.activeFor > 0) armor = Math.max(armor, params.guard ?? 0);
    }
    if (ability.behavior === 'heal' && state.activeFor > 0) regeneration = Math.max(regeneration, params.regeneration ?? 0);
  }
  if ((player.modifiers.skills.armor ?? 0) !== armor || (player.modifiers.skills.regeneration ?? 0) !== regeneration) {
    player.modifiers.skills.armor = armor; player.modifiers.skills.regeneration = regeneration; refreshStats(player);
  }
}
export function counterGuard(player: Player, origin: Vector, grid: SpatialGrid, world: CollisionWorld, onKill: (e: Enemy) => void, random: () => number): boolean {
  for (const state of player.attacks) {
    const p = ABILITIES[state.id].levels[state.level - 1];
    if (!activeMovements(player).includes(state.id) || state.activeFor <= 0 || state.counterUsed || !p.counterDamage) continue;
    state.counterUsed = true;
    const angle = Math.atan2(origin.y - player.y, origin.x - player.x), radius = player.stats.range * p.range;
    grid.visit(player.x, player.y, radius + 15, enemy => {
      const dx = enemy.x - player.x, dy = enemy.y - player.y, d = Math.max(1, Math.hypot(dx, dy));
      if (d <= radius + enemy.radius && (dx * Math.cos(angle) + dy * Math.sin(angle)) / d >= Math.cos(p.counterArc ?? 0.8) && world.segmentClear(player.x, player.y, enemy.x, enemy.y, 2)) damageEnemy(player, enemy, player.stats.damage * p.counterDamage!, 15, player, world, onKill, random);
    });
    return true;
  }
  return false;
}
