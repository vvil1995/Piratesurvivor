import { activeMovements } from './loadout.ts';
import { ABILITIES } from '../../content/attacks.ts';
import type { StatModifiers } from '../../content/types.ts';
import type { Player } from '../core/types.ts';
import { refreshStats } from './stats.ts';
export const combined = (player: Player, id: string): boolean => player.abilitySlots.some(slot => slot.length > 1 && slot.includes(id));
export function updateBuffModifiers(player: Player): void {
  const next: StatModifiers = {};
  for (const state of player.attacks) {
    const buff = ABILITIES[state.id].buff; if (!buff) continue;
    const constant = combined(player, state.id);
    if (constant && !activeMovements(player).includes(state.id)) continue;
    if (constant || state.activeFor > 0) next[buff.stat] = (next[buff.stat] ?? 0) + (constant ? buff.constant : buff.temporary)[state.level - 1];
  }
  const old = player.modifiers.buffs;
  if (old.speed !== next.speed || old.armor !== next.armor || old.damage !== next.damage || old.cooldown !== next.cooldown) {
    player.modifiers.buffs = next; refreshStats(player);
  }
}
export function tickBuffs(player: Player, dt: number): void {
  for (const state of player.attacks) {
    const buff = ABILITIES[state.id].buff; if (!buff) continue;
    state.cooldown = Math.max(0, state.cooldown - dt); state.activeFor = Math.max(0, state.activeFor - dt);
    if (!activeMovements(player).includes(state.id)) { if (combined(player, state.id)) state.activeFor = 0; continue; }
    if (!combined(player, state.id) && state.cooldown <= 0) {
      state.activeFor = buff.duration[state.level - 1]; state.cooldown = state.activeFor + buff.cooldown[state.level - 1];
    }
  }
  updateBuffModifiers(player);
}
