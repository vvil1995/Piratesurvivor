import type { AbilityDefinition } from '../content/types.ts';
import type { IconName } from './pixel-art.ts';
export function abilityIcon(ability: AbilityDefinition): IconName {
  if (ability.buff) return ({ speed: 'boot', armor: 'armor', damage: 'fist', cooldown: 'clock' } as const)[ability.buff.stat];
  return ability.behavior === 'sweep' || ability.behavior === 'slam' ? 'boot' : ability.behavior === 'guard' ? 'armor' : 'fist';
}
