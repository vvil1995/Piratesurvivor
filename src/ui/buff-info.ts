import type { BuffDefinition } from '../content/types.ts';
export const BUFF_LOOK = {
  damage: { label: 'ATK', color: '#f0aa73', tint: 0xf0aa73 }, armor: { label: 'DEF', color: '#92c8ed', tint: 0x92c8ed },
  speed: { label: 'VEL', color: '#83dfc8', tint: 0x83dfc8 }, cooldown: { label: 'CAD', color: '#c0a1e8', tint: 0xc0a1e8 },
};
export function buffEffect(buff: BuffDefinition, level: number, constant: boolean): string {
  const value = (constant ? buff.constant : buff.temporary)[level - 1] * 100;
  return `${BUFF_LOOK[buff.stat].label} ${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(1).replace('.0', '')}%${buff.stat === 'armor' ? ' de reducción de daño' : buff.stat === 'cooldown' ? ' de cooldown' : ''}`;
}
