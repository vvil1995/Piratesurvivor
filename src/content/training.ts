import type { StatModifiers } from './types.ts';
export interface TrainingRule { name: string; icon: string; max: number; value: number; effect: string; stat?: keyof StatModifiers; baseCost: number; growth: number }
export const TRAINING: Record<string, TrainingRule> = {
  vitality: { name: 'Vitalidad', icon: 'heart', max: 10, value: 8, stat: 'maxHp', effect: '+8 HP máximos', baseCost: 30, growth: 1.45 },
  force: { name: 'Fuerza', icon: 'fist', max: 10, value: .04, stat: 'damage', effect: '+4% daño base', baseCost: 35, growth: 1.45 },
  speed: { name: 'Zancada', icon: 'boot', max: 8, value: .03, stat: 'speed', effect: '+3% velocidad base', baseCost: 40, growth: 1.5 },
  cooldown: { name: 'Reflejos', icon: 'clock', max: 8, value: -.03, stat: 'cooldown', effect: '−3% intervalo base', baseCost: 45, growth: 1.5 },
  armor: { name: 'Coraza', icon: 'armor', max: 8, value: .02, stat: 'armor', effect: '+2 puntos de defensa', baseCost: 40, growth: 1.5 },
  regeneration: { name: 'Recuperación', icon: 'heart', max: 5, value: .04, stat: 'regeneration', effect: '+0,04 HP/s', baseCost: 45, growth: 1.6 },
  magnet: { name: 'Imán', icon: 'magnet', max: 6, value: .12, stat: 'magnet', effect: '+12% radio de recogida', baseCost: 25, growth: 1.5 },
  experience: { name: 'Aprendizaje', icon: 'arm', max: 8, value: .05, effect: '+5% experiencia', baseCost: 40, growth: 1.5 },
  fortune: { name: 'Fortuna', icon: 'coin', max: 8, value: .08, effect: '+8% berries recogidos', baseCost: 50, growth: 1.55 },
  critical: { name: 'Golpe crítico', icon: 'fist', max: 10, value: .03, stat: 'critChance', effect: '+3 puntos de crítico (×1,5 daño)', baseCost: 45, growth: 1.5 },
  rerolls: { name: 'Cambio de cartas', icon: 'clock', max: 5, value: 1, effect: '+1 cambio por partida', baseCost: 80, growth: 1.7 },
  bans: { name: 'Veto', icon: 'armor', max: 3, value: 1, effect: '+1 habilidad vetada por partida', baseCost: 100, growth: 1.8 },
  starter: { name: 'Ataque inicial', icon: 'fist', max: 1, value: 1, effect: 'Elige con qué ataque empiezas', baseCost: 150, growth: 1 },
  repertoire: { name: 'Repertorio', icon: 'arm', max: 1, value: 1, effect: 'Empieza con un segundo ataque distinto', baseCost: 400, growth: 1 },
};
export interface CharacterTraining { levels: Record<string, number>; starter?: string; second?: string; bans: string[] }
export const emptyTraining = (): CharacterTraining => ({ levels: {}, bans: [] });
export const trainingCost = (id: string, current: number): number => Math.ceil(TRAINING[id].baseCost * TRAINING[id].growth ** current / 5) * 5;
export const trainingLevel = (profile: CharacterTraining): number => 1 + Object.values(profile.levels).reduce((a, b) => a + b, 0);
export function trainingModifiers(profile: CharacterTraining): StatModifiers {
  const result: StatModifiers = {};
  for (const [id, level] of Object.entries(profile.levels)) { const rule = TRAINING[id]; if (rule?.stat) result[rule.stat] = (result[rule.stat] ?? 0) + rule.value * level; }
  return result;
}
