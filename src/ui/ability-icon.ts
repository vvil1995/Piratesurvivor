import type { AbilityDefinition } from '../content/types.ts';
import type { IconName } from './pixel-art.ts';
export function abilityIcon(ability: AbilityDefinition): IconName {
  if (ability.buff) return ({ speed: 'boost-speed', armor: 'boost-defense', damage: 'boost-attack', cooldown: 'boost-cadence' } as const)[ability.buff.stat];
  if (ability.visual === 'kick') return 'boot';
  if (ability.visual === 'heal') return 'heart';
  if (ability.visual === 'slash') return 'swords';
  if (ability.visual === 'staff') return 'staff';
  if (ability.visual === 'projectile') return 'slingshot';
  return ability.behavior === 'sweep' || ability.behavior === 'slam' ? 'boot' : ability.behavior === 'guard' ? 'armor' : 'fist';
}
