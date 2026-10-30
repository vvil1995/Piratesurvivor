import { ABILITIES, ATTACK_MAX_LEVEL, ATTACK_SLOTS } from '../../content/attacks.ts';
import { CHARACTERS } from '../../content/catalog.ts';
import type { EquippedAttack, Player } from '../core/types.ts';
export const newAttack = (id: string): EquippedAttack => ({ id, level: 1, cooldown: 0, pending: 0, burstTimer: 0 });
export function canImproveAttack(player: Player, id: string): boolean {
  if (!ABILITIES[id] || !CHARACTERS[player.characterId].abilities.includes(id)) return false;
  const equipped = player.attacks.find(a => a.id === id);
  return equipped ? equipped.level < ATTACK_MAX_LEVEL : player.attacks.length < ATTACK_SLOTS;
}
export function improveAttack(player: Player, id: string): boolean {
  if (!canImproveAttack(player, id)) return false;
  const equipped = player.attacks.find(a => a.id === id);
  if (equipped) equipped.level++;
  else player.attacks.push(newAttack(id));
  return true;
}
