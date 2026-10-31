import { itemValue, ITEM_RULES } from '../../content/items.ts';
import type { Player, Enemy } from '../core/types.ts';

/** Timers belong to this run and stop while any reward modal is open. */
export function tickItem(player: Player, dt: number): void {
  const state = player.itemState ??= { heal: 0, leech: 0, budget: 0, explosion: 0, stun: 0, queue: [] };
  state.explosion = Math.max(0, state.explosion - dt);
  state.stun = Math.max(0, state.stun - dt);
  state.leech += dt;
  if (state.leech >= 1) { state.leech %= 1; state.budget = 0; }
  state.heal += dt;
  while (state.heal >= 5) {
    state.heal -= 5;
    if (player.hp > 0) player.hp = Math.min(player.stats.maxHp, player.hp + itemValue(player.items, 'medicine'));
  }
}

/** Secondary explosions never enter this function, preventing recursive item procs. */
export function itemHit(player: Player, enemy: Enemy, actual: number, area: boolean, random: () => number): void {
  if (actual <= 0 || enemy.kind === 'chest') return;
  tickItem(player, 0);
  const state = player.itemState!;
  const healing = Math.min(
    Math.max(0, ITEM_RULES.lifestealPerSecond - state.budget),
    actual * itemValue(player.items, 'dagger') * (area ? ITEM_RULES.areaLifestealFactor : 1),
  );
  if (player.hp > 0) {
    player.hp = Math.min(player.stats.maxHp, player.hp + healing);
    state.budget += healing;
  }
  if (itemValue(player.items, 'pendulum') > 0 && (!enemy.kind || state.stun <= 0) && random() < itemValue(player.items, 'pendulum')) {
    enemy.statuses ??= {};
    enemy.statuses.stun = Math.max(enemy.statuses.stun ?? 0, enemy.kind ? ITEM_RULES.bossStunDuration : ITEM_RULES.stunDuration);
    if (enemy.kind) state.stun = ITEM_RULES.bossStunCooldown;
  }
  if (state.explosion <= 0 && itemValue(player.items, 'powder') > 0 && random() < itemValue(player.items, 'powder')) {
    state.explosion = ITEM_RULES.explosionCooldown;
    if (state.queue.length < 4) state.queue.push({ x: enemy.x, y: enemy.y, damage: actual * ITEM_RULES.explosionDamage });
  }
}
