import { UPGRADES } from '../../content/catalog.ts';
import type { UpgradeDefinition } from '../../content/types.ts';
import type { Player } from '../core/types.ts';
export const xpForLevel = (level: number): number => Math.round(12 + level * 7 + level ** 1.35 * 2);
export function chooseUpgrades(taken: Record<string, number>, random: () => number): UpgradeDefinition[] {
  const pool = UPGRADES.filter(u => (taken[u.id] || 0) < u.max);
  const selected: UpgradeDefinition[] = [];
  while (pool.length && selected.length < 3) selected.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  // Siempre habrá tres opciones, incluso si se agotan todas las mejoras.
  while (selected.length < 3) selected.push({
    id: `recover-${selected.length}`, name: 'Un respiro', description: 'Recupera 30 de vida.',
    symbol: '♥', stat: 'maxHp', mode: 'add', value: 0, max: Infinity,
  });
  return selected;
}
export function applyUpgrade(player: Player, upgrade: UpgradeDefinition): void {
  const current = player.stats[upgrade.stat];
  player.stats[upgrade.stat] = upgrade.mode === 'add' ? current + upgrade.value : current * upgrade.value;
  if (upgrade.stat === 'maxHp') player.hp = Math.min(player.stats.maxHp, player.hp + 30);
}
