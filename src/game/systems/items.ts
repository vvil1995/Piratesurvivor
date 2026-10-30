import { ITEMS, ITEM_MAX_LEVEL, ITEM_SLOTS } from '../../content/items.ts';
import type { StatModifiers } from '../../content/types.ts';
import type { Player } from '../core/types.ts';
import { refreshStats } from './stats.ts';
export function itemChoices(player: Player, random: () => number): string[] {
  const candidates = Object.keys(ITEMS).filter(id => (player.items[id] ?? 0) < ITEM_MAX_LEVEL && (player.items[id] || Object.keys(player.items).length < ITEM_SLOTS));
  for (let i = candidates.length - 1; i > 0; i--) { const j = Math.min(i, Math.floor(random() * (i + 1))); [candidates[i], candidates[j]] = [candidates[j], candidates[i]]; }
  // Al agotarse las mejoras, completar tres opciones válidas con suministros.
  return [...candidates, 'supplies-berries', 'supplies-heal', 'supplies-xp'].slice(0, 3);
}
export function equipItem(player: Player, id: string): boolean {
  if (!ITEMS[id] || (player.items[id] ?? 0) >= ITEM_MAX_LEVEL || !player.items[id] && Object.keys(player.items).length >= ITEM_SLOTS) return false;
  player.items[id] = (player.items[id] ?? 0) + 1;
  const modifiers: StatModifiers = {};
  for (const [key, level] of Object.entries(player.items)) for (const [stat, value] of Object.entries(ITEMS[key].modifiers)) {
    const name = stat as keyof StatModifiers; modifiers[name] = (modifiers[name] ?? 0) + value * level;
  }
  player.modifiers.items = modifiers; refreshStats(player); return true;
}
