import { UPGRADES } from '../../content/catalog.ts';
import type { LevelChoice, UpgradeDefinition } from '../../content/types.ts';
import type { Player } from '../core/types.ts';
import { ABILITIES } from '../../content/attacks.ts';
import { availableAbilities, canImproveAttack, improveAttack, hasFreeSlot } from './loadout.ts';
import { refreshStats, regenerationLimit, resolveStats } from './stats.ts';
export const xpForLevel = (level: number): number => Math.round(12 + level * 7 + level ** 1.35 * 2);
export function chooseUpgrades(taken: Record<string, number>, random: () => number, player?: Player): LevelChoice[] {
  const pool: LevelChoice[] = UPGRADES.filter(u => (taken[u.id] || 0) < u.max && (!player || canGainStat(player, u)))
    .map(u => player && u.stat === 'regeneration' && player.stats.regeneration >= regenerationLimit(player.stats.maxHp) - 1e-8
      ? { ...u, description: 'Regeneración limitada. +0,02 HP/s acumulados en la build, sujetos a topes: este nivel puede no aumentar el efecto actual.' } : u);
  if (player) for (const id of availableAbilities(player).filter(id => !player.bannedAbilities?.includes(id))) {
    if (!canImproveAttack(player, id)) continue;
    const ability = ABILITIES[id], current = player.attacks.find(a => a.id === id)?.level ?? 0;
    if (!current && !hasFreeSlot(player)) continue;
    const next = current + 1, params = ability.levels[next - 1];
    pool.push({ kind: 'ability', id: `ability:${id}`, abilityId: id,
      name: `${ability.shortName}${next === 6 ? ' +' : ''} · NV. ${next}`,
      description: ability.buff ? `${({ speed: 'Velocidad', armor: 'Reducción de daño', damage: 'Daño', cooldown: 'Cooldown' })[ability.buff.stat]} ${ability.buff.temporary[next - 1] >= 0 ? '+' : ''}${(ability.buff.temporary[next - 1] * 100).toFixed(1)}${ability.buff.stat === 'armor' ? ' puntos porcentuales' : '%'} durante ${ability.buff.duration[next - 1]}s; descanso ${ability.buff.cooldown[next - 1]}s. En combinación: ${(ability.buff.constant[next - 1] * 100).toFixed(1)}% constante. Sujeto a límites globales.` : !current ? ability.description + ' Se aprende como opción: selecciónala en los cuadrados inferiores.' : next === 6 ? ability.evolution : `Daño ${Math.round(params.damage * 100)}% y alcance ${Math.round(params.range * 100)}% de base. Intervalo base ${params.cooldown.toFixed(2)}s.${params.shots > 1 ? ` Ráfaga: ${params.shots} golpes.` : ''}`,
      symbol: '✦', max: 6 });
  }
  const selected: LevelChoice[] = [];
  while (pool.length && selected.length < 3) selected.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  // Siempre habrá tres opciones, incluso si se agotan todas las mejoras.
  while (selected.length < 3) selected.push({
    id: `recover-${selected.length}`, name: 'Un respiro', description: 'Recupera 20 de vida.',
    symbol: '♥', stat: 'maxHp', value: 0, max: Infinity,
  });
  return selected;
}
export function applyUpgrade(player: Player, upgrade: LevelChoice): void {
  if ('kind' in upgrade && upgrade.kind === 'ability') { improveAttack(player, upgrade.abilityId); return; }
  if (!('stat' in upgrade)) return;
  player.modifiers.temporary[upgrade.stat] = (player.modifiers.temporary[upgrade.stat] ?? 0) + upgrade.value;
  const hp = player.hp;
  refreshStats(player);
  if (upgrade.stat === 'maxHp') player.hp = Math.min(player.stats.maxHp, hp + 20);
}
function canGainStat(player: Player, upgrade: UpgradeDefinition): boolean {
  if (!Number.isFinite(upgrade.max)) return true;
  const temporary = { ...player.modifiers.temporary, [upgrade.stat]: (player.modifiers.temporary[upgrade.stat] ?? 0) + upgrade.value };
  const candidate = resolveStats(player.baseStats, [player.modifiers.permanent, temporary, player.modifiers.items, player.modifiers.fruit, player.modifiers.buffs, player.modifiers.skills]);
  return upgrade.stat === 'cooldown' ? candidate.cooldown < player.stats.cooldown - 1e-8 : candidate[upgrade.stat] > player.stats[upgrade.stat] + 1e-8;
}
