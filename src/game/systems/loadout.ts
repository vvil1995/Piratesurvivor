import { ABILITIES, ATTACK_MAX_LEVEL, ATTACK_SLOTS, COMPONENTS_PER_SLOT, MAX_LEARNED_ABILITIES, MAX_LEARNED_BUFFS } from '../../content/attacks.ts';
import { CHARACTERS } from '../../content/catalog.ts';
import type { EquippedAttack, Player } from '../core/types.ts';
export const newAttack = (id: string): EquippedAttack => ({ id, level: 1, cooldown: 0, pending: 0, burstTimer: 0, activeFor: 0 });
export const activeMovements = (player: Player): readonly string[] => player.abilitySlots[player.selectedSlot] ?? [];
export function selectSlot(player: Player, slot: number): boolean {
  if (!Number.isInteger(slot) || !player.abilitySlots[slot]?.length || slot === player.selectedSlot) return false;
  player.selectedSlot = slot;
  const active = activeMovements(player);
  for (const state of player.attacks) if (!active.includes(state.id)) {
    state.pending = 0; state.burstTimer = 0; state.activationPending = false;
    const ability = ABILITIES[state.id], groupedBuff = ability.buff && player.abilitySlots.some(s => s.length > 1 && s.includes(state.id));
    if (ability.behavior !== 'heal' && (!ability.buff || groupedBuff)) state.activeFor = 0;
  }
  return true;
}
export function availableAbilities(player: Player): string[] {
  return [...CHARACTERS[player.characterId].abilities, ...Object.keys(ABILITIES).filter(id => ABILITIES[id].category === 'buff')];
}
export function canImproveAttack(player: Player, id: string): boolean {
  if (!ABILITIES[id] || !availableAbilities(player).includes(id)) return false;
  const equipped = player.attacks.find(a => a.id === id);
  if (equipped) return equipped.level < ATTACK_MAX_LEVEL;
  return player.attacks.length < MAX_LEARNED_ABILITIES &&
    (ABILITIES[id].category !== 'buff' || player.learnedBuffs.includes(id) || player.learnedBuffs.length < MAX_LEARNED_BUFFS);
}
export const hasFreeSlot = (player: Player): boolean => player.abilitySlots.some(slot => slot.length === 0);
export function improveAttack(player: Player, id: string, joinSlot?: number): boolean {
  if (!canImproveAttack(player, id)) return false;
  const equipped = player.attacks.find(a => a.id === id);
  if (equipped) { equipped.level++; return true; }
  const slot = joinSlot === undefined ? player.abilitySlots.find(slot => slot.length === 0) : player.abilitySlots[joinSlot];
  if (!slot || slot.length >= COMPONENTS_PER_SLOT) return false;
  player.attacks.push(newAttack(id)); slot.push(id);
  if (ABILITIES[id].category === 'buff' && !player.learnedBuffs.includes(id)) player.learnedBuffs.push(id);
  return true;
}
export function mergeSlots(player: Player, from: number, to: number): boolean {
  const source = player.abilitySlots[from], target = player.abilitySlots[to];
  if (!source || !target || from === to || !source.length || !target.length || target.length + source.length > COMPONENTS_PER_SLOT) return false;
  target.push(...source); source.length = 0; if (player.selectedSlot === from) player.selectedSlot = to; return true;
}
export function moveAbility(player: Player, id: string, to: number): boolean {
  const from = player.abilitySlots.findIndex(slot => slot.includes(id)), target = player.abilitySlots[to];
  if (from < 0 || !target || from === to || target.length >= COMPONENTS_PER_SLOT) return false;
  player.abilitySlots[from].splice(player.abilitySlots[from].indexOf(id), 1); target.push(id);
  if (!player.abilitySlots[player.selectedSlot]?.length) player.selectedSlot = to;
  return true;
}
export function validLoadout(player: Player): boolean {
  const all = player.abilitySlots.flat();
  return player.abilitySlots.length === ATTACK_SLOTS && player.abilitySlots.every(slot => slot.length <= COMPONENTS_PER_SLOT) &&
    all.length === player.attacks.length && new Set(all).size === all.length && all.every(id => player.attacks.some(a => a.id === id));
}
