import { CHARACTERS, UPGRADES } from '../../content/catalog.ts';
import type { LevelChoice } from '../../content/types.ts';
import type { Player } from '../core/types.ts';
import { ABILITIES } from '../../content/attacks.ts';
import { canImproveAttack, improveAttack } from './loadout.ts';
export const xpForLevel = (level: number): number => Math.round(12 + level * 7 + level ** 1.35 * 2);
export function chooseUpgrades(taken: Record<string, number>, random: () => number, player?: Player): LevelChoice[] {
  const pool: LevelChoice[] = UPGRADES.filter(u => (taken[u.id] || 0) < u.max);
  if (player) for (const id of CHARACTERS[player.characterId].abilities) {
    if (!canImproveAttack(player, id)) continue;
    const ability = ABILITIES[id], current = player.attacks.find(a => a.id === id)?.level ?? 0;
    const next = current + 1, params = ability.levels[next - 1];
    pool.push({ kind: 'ability', id: `ability:${id}`, abilityId: id,
      name: `${ability.shortName}${next === 6 ? ' +' : ''} · NV. ${next}`,
      description: !current ? ability.description : next === 6 ? ability.evolution : `Daño ${Math.round(params.damage * 100)}% y alcance ${Math.round(params.range * 100)}% de base. Intervalo ${params.cooldown.toFixed(2)}s.${params.shots > 1 ? ` Ráfaga: ${params.shots} golpes.` : ''}`,
      symbol: '✦', max: 6 });
  }
  const selected: LevelChoice[] = [];
  while (pool.length && selected.length < 3) selected.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  // Siempre habrá tres opciones, incluso si se agotan todas las mejoras.
  while (selected.length < 3) selected.push({
    id: `recover-${selected.length}`, name: 'Un respiro', description: 'Recupera 30 de vida.',
    symbol: '♥', stat: 'maxHp', mode: 'add', value: 0, max: Infinity,
  });
  return selected;
}
export function applyUpgrade(player: Player, upgrade: LevelChoice): void {
  if ('kind' in upgrade && upgrade.kind === 'ability') { improveAttack(player, upgrade.abilityId); return; }
  if (!('stat' in upgrade)) return;
  const current = player.stats[upgrade.stat];
  player.stats[upgrade.stat] = upgrade.mode === 'add' ? current + upgrade.value : current * upgrade.value;
  if (upgrade.stat === 'maxHp') player.hp = Math.min(player.stats.maxHp, player.hp + 30);
}
