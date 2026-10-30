import { ABILITIES } from '../../content/attacks.ts';
import type { Player } from '../core/types.ts';
import { attackCooldown, refreshStats } from './stats.ts';
export function tickGuards(player: Player, dt: number): void {
  let armor = 0;
  for (const state of player.attacks) {
    const ability = ABILITIES[state.id]; if (ability.behavior !== 'guard') continue;
    const params = ability.levels[state.level - 1];
    state.cooldown = Math.max(0, state.cooldown - dt); state.activeFor = Math.max(0, state.activeFor - dt);
    if (state.cooldown <= 0) {
      state.activeFor = params.duration ?? 2; state.activationPending = true;
      state.cooldown = attackCooldown(ability.levels[0].cooldown, params.cooldown, player);
    }
    if (state.activeFor > 0) armor = Math.max(armor, params.guard ?? 0);
  }
  if ((player.modifiers.skills.armor ?? 0) !== armor) { player.modifiers.skills.armor = armor; refreshStats(player); }
}
