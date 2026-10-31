import { itemValue } from '../../content/items.ts';
import type { Stats, StatModifiers } from '../../content/types.ts';
import { STAT_LIMITS } from '../../content/stat-rules.ts';
import type { Player } from '../core/types.ts';
const clamp = (v: number, max: number) => Math.min(max, Math.max(0, v));
export const regenerationLimit = (maxHp: number): number => Math.min(STAT_LIMITS.maxRegenerationHpPerSecond, maxHp * STAT_LIMITS.regenerationFractionPerSecond);
export function regenerationRate(stats: Stats): number { return clamp(stats.regeneration, regenerationLimit(stats.maxHp)); }
export function resolveStats(base: Stats, sources: readonly StatModifiers[]): Stats {
  const sum = (key: keyof Stats) => sources.reduce((total, source) => total + (source[key] ?? 0), 0);
  const maxHp = Math.max(1, base.maxHp + sum('maxHp'));
  return {
    maxHp,
    damage: clamp(base.damage * (1 + sum('damage')), base.damage * STAT_LIMITS.damageMultiplier),
    speed: Math.max(1, clamp(base.speed * (1 + sum('speed')), base.speed * STAT_LIMITS.speedMultiplier)),
    cooldown: Math.max(base.cooldown * (1 - STAT_LIMITS.cooldownReduction), base.cooldown * (1 + sum('cooldown'))),
    range: clamp(base.range * (1 + sum('range')), base.range * STAT_LIMITS.rangeMultiplier),
    magnet: clamp(base.magnet * (1 + sum('magnet')), base.magnet * STAT_LIMITS.magnetMultiplier),
    armor: clamp(base.armor + sum('armor'), STAT_LIMITS.armor),
    critChance: clamp(base.critChance + sum('critChance'), STAT_LIMITS.critChance),
    regeneration: clamp(base.regeneration + sum('regeneration'), regenerationLimit(maxHp)),
  };
}
export function refreshStats(player: Player): void {
  const otherHp=player.baseStats.maxHp+Object.entries(player.modifiers).filter(([key])=>key!=='items').reduce((n,[,m])=>n+(m.maxHp??0),0);
  player.modifiers.items.maxHp=otherHp*itemValue(player.items,'haramaki');
  player.stats = resolveStats(player.baseStats, Object.values(player.modifiers));
  player.hp = Math.min(player.hp, player.stats.maxHp);
}
export function receivedDamage(raw: number, armor: number): number {
  return Math.max(0, raw) * (1 - clamp(armor, STAT_LIMITS.armor));
}
export function attackCooldown(base: number, atLevel: number, player: Player): number {
  return Math.max(STAT_LIMITS.minimumAttackCooldown, base * (1 - STAT_LIMITS.cooldownReduction), atLevel * player.stats.cooldown / player.baseStats.cooldown);
}
