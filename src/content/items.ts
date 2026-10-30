import type { StatModifiers } from './types.ts';
export const ITEM_SLOTS = 6, ITEM_MAX_LEVEL = 3;
export const ITEMS: Record<string, { name: string; description: string; modifiers: StatModifiers }> = {
  boots: { name: 'Botes de navegant', description: '+8% velocidad por nivel', modifiers: { speed: 0.08 } },
  whetstone: { name: 'Pedra d’esmolar', description: '+8% daño por nivel', modifiers: { damage: 0.08 } },
  vest: { name: 'Armilla de mariner', description: '−6% daño recibido por nivel', modifiers: { armor: 0.06 } },
  medicine: { name: 'Farmaciola', description: '+0,2 HP/s por nivel', modifiers: { regeneration: 0.2 } },
  watch: { name: 'Rellotge de butxaca', description: '−5% cooldown por nivel', modifiers: { cooldown: -0.05 } },
  telescope: { name: 'Ullera de llarga vista', description: '+8% alcance por nivel', modifiers: { range: 0.08 } },
  compass: { name: 'Brúixola', description: '+10% radio de recogida por nivel', modifiers: { magnet: 0.1 } },
  charm: { name: 'Amulet de la sort', description: '+3 puntos de crítico por nivel', modifiers: { critChance: 0.03 } },
};
