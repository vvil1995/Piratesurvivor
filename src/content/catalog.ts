import type { CharacterDefinition, EnemyDefinition, UpgradeDefinition } from './types.ts';

export const CHARACTERS: Record<string, CharacterDefinition> = {
  luffy: {
    id: 'luffy', name: 'Monkey D. Luffy', title: 'El futuro rey de los piratas',
    initialAbility: 'elastic-punch', abilities: ['elastic-punch', 'gatling', 'bazooka', 'whip', 'balloon', 'axe'], visual: 'straw-hat',
    stats: { maxHp: 100, speed: 195, damage: 24, cooldown: 0.72, range: 155, magnet: 75, armor: 0, regeneration: 0.2, critChance: 0 },
  },
};
export const ENEMIES: Record<string, EnemyDefinition> = {
  'marine-rifle': { id: 'marine-rifle', hp: 32, damage: 10, speed: 66, xp: 7, radius: 13, visual: 'marine', ranged: { interval: 2.4, speed: 200, range: 250 } },
  marine: { id: 'marine', hp: 32, damage: 10, speed: 66, xp: 5, radius: 13, visual: 'marine' },
};
export { ABILITIES } from './attacks.ts';
export const UPGRADES: UpgradeDefinition[] = [
  { id: 'power', name: 'Puño de hierro', description: '+8% de daño base.', symbol: '✦', stat: 'damage', value: 0.08, max: 10 },
  { id: 'tempo', name: 'Sin descanso', description: '−3% del intervalo base. Reducción total máxima: 50%.', symbol: '↯', stat: 'cooldown', value: -0.03, max: 10 },
  { id: 'heart', name: 'Espíritu indomable', description: '+20 de vida máxima y recupera 20 HP. Sin límite de elecciones.', symbol: '♥', stat: 'maxHp', value: 20, max: Infinity },
  { id: 'regen', name: 'Segundo aliento', description: '+0,02 HP/s. Sin límite de elecciones; efecto total ≤0,5% de vida máxima/s y ≤3 HP/s.', symbol: '♥', stat: 'regeneration', value: 0.02, max: Infinity },
  { id: 'armor', name: 'Guardia firme', description: '−3 puntos porcentuales de daño recibido. Mitigación total máxima: 60%.', symbol: '◈', stat: 'armor', value: 0.03, max: 10 },
  { id: 'feet', name: 'Viento a favor', description: '+4% de velocidad base. Máximo combinado: +75%.', symbol: '➶', stat: 'speed', value: 0.04, max: 8 },
  { id: 'critical', name: 'Golpe certero', description: '+2 puntos de probabilidad de crítico. Críticos: daño ×1,5.', symbol: '✦', stat: 'critChance', value: 0.02, max: 10 },
  { id: 'reach', name: 'Brazos de goma', description: '+10% del alcance base.', symbol: '↔', stat: 'range', value: 0.10, max: 6 },
  { id: 'magnet', name: 'Instinto pirata', description: '+15% del radio de recogida base.', symbol: '◈', stat: 'magnet', value: 0.15, max: 5 },
];
export const TRAINING_COST = (level: number): number => 30 + level * 20;
export const TRAINING_MAX = 5;
