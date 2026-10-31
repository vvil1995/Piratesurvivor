import { ITEMS, ITEM_MAX_LEVEL, itemValue } from '../../content/items.ts';
import type { Player } from '../core/types.ts';
import { refreshStats } from './stats.ts';

export function itemChoices(_player: Player, random: () => number): string[] {
  const ids = Object.keys(ITEMS);
  return [ids[Math.min(ids.length - 1, Math.floor(random() * ids.length))]];
}
function apply(player: Player): void {
  const oldMaximum = player.stats.maxHp;
  player.modifiers.items = {
    armor: itemValue(player.items, 'vest'), range: itemValue(player.items, 'telescope'), damage: itemValue(player.items, 'whetstone'),
  };
  refreshStats(player); // Includes Haramaki relative to HP from all other sources.
  player.hp = Math.min(player.stats.maxHp, player.hp + Math.max(0, player.stats.maxHp - oldMaximum));
  player.itemState = undefined;
}
export function equipItem(player: Player, id: string): boolean {
  if (!ITEMS[id] || (player.items[id] ?? 0) >= ITEM_MAX_LEVEL || (!player.items[id] && Object.keys(player.items).length > 0)) return false;
  player.items[id] = (player.items[id] ?? 0) + 1;
  apply(player);
  return true;
}
export function replaceItem(player: Player, id: string): boolean {
  if (!ITEMS[id]) return false;
  if (player.items[id]) return equipItem(player, id);
  player.items = { [id]: 1 };
  apply(player);
  return true;
}
