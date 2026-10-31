import type { AbilityDefinition } from '../content/types.ts';
import type { IconName } from './pixel-art.ts';
export function abilityIcon(ability: AbilityDefinition): IconName { return `ability-${ability.id}`; }
