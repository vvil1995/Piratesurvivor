import type { AbilityDefinition, CharacterDefinition, EnemyDefinition, EvolutionDefinition, UpgradeDefinition } from './types.ts';

export const CHARACTERS: Record<string, CharacterDefinition> = {
  luffy: {
    id: 'luffy', name: 'Monkey D. Luffy', title: 'El futuro rey de los piratas',
    initialAbility: 'elastic-punch', visual: 'straw-hat',
    stats: { maxHp: 100, speed: 195, damage: 24, cooldown: 0.72, range: 155, magnet: 75 },
  },
};
export const ENEMIES: Record<string, EnemyDefinition> = {
  marine: { id: 'marine', hp: 32, damage: 10, speed: 66, xp: 5, radius: 13, visual: 'marine' },
};
export const ABILITIES: Record<string, AbilityDefinition> = {
  'elastic-punch': { id: 'elastic-punch', name: 'Puño elástico', behavior: 'melee', arc: 0.65 },
};
// El catálogo admite recetas; el contenido evolucionado se incorporará en fase 6.
export const EVOLUTIONS: EvolutionDefinition[] = [];
export const UPGRADES: UpgradeDefinition[] = [
  { id: 'power', name: 'Puño de hierro', description: '+20% de daño con cada golpe.', symbol: '✦', stat: 'damage', mode: 'multiply', value: 1.2, max: 12 },
  { id: 'tempo', name: 'Sin descanso', description: 'Ataca un 10% más rápido.', symbol: '↯', stat: 'cooldown', mode: 'multiply', value: 0.9, max: 8 },
  { id: 'heart', name: 'Espíritu indomable', description: '+20 de vida máxima y recupera 30 de vida.', symbol: '♥', stat: 'maxHp', mode: 'add', value: 20, max: 12 },
  { id: 'feet', name: 'Viento a favor', description: '+8% de velocidad de movimiento.', symbol: '➶', stat: 'speed', mode: 'multiply', value: 1.08, max: 5 },
  { id: 'reach', name: 'Brazos de goma', description: '+15% de alcance del puño.', symbol: '↔', stat: 'range', mode: 'multiply', value: 1.15, max: 6 },
  { id: 'magnet', name: 'Instinto pirata', description: '+25% de radio para recoger experiencia.', symbol: '◈', stat: 'magnet', mode: 'multiply', value: 1.25, max: 5 },
];
export const TRAINING_COST = (level: number): number => 30 + level * 20;
export const TRAINING_MAX = 5;
