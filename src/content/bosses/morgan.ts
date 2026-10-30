import type { BossAttack } from '../../game/bosses/telegraphs.ts';
const base = { length: 0, width: 0, radius: 0, innerRadius: 0, arc: Math.PI, finalWarning: 0.35, impact: 0.2, cooldown: 0, recovery: 0.9 };
export const MORGAN = { hp: 4200, radius: 25, speed: 228, engageRange: 155, phaseThresholds: [0.65, 0.30],
  pursuitSprint: 310, sprintAfter: 2, rangedWait: 1.6, patterns: [['axe', 'sweep'], ['charge', 'axe', 'order', 'sweep'], ['devastating', 'charge', 'axe', 'order', 'sweep']],
  stunSeconds: 2, reinforcementCap: 5, reinforcementCount: 4, reinforcementCooldown: 15, phaseCadence: [1, 0.88, 0.76] } as const;
export const MORGAN_ATTACKS: readonly BossAttack[] = [
  { ...base, id: 'axe', name: 'Cop de destral', phase: 1, shape: 'rectangle', length: 170, width: 90, preparation: 1.2, damage: 38, animation: 'axe', recovery: 1.0 },
  { ...base, id: 'sweep', name: 'Escombrada', phase: 1, shape: 'arc', radius: 175, preparation: 1.4, damage: 29, animation: 'sweep', recovery: 1.1 },
  { ...base, id: 'charge', name: 'Càrrega militar', phase: 2, shape: 'line', length: 430, width: 72, preparation: 1.5, impact: 1.2, damage: 36, animation: 'charge', speed: 480, recovery: 1.1 },
  { ...base, id: 'order', name: 'Ordre als marines', phase: 2, shape: 'circle', radius: 0, preparation: 1.2, damage: 0, animation: 'order', cooldown: MORGAN.reinforcementCooldown, recovery: 1.0 },
  { ...base, id: 'devastating', name: 'Destral devastadora', phase: 3, shape: 'line', length: 650, width: 92, preparation: 2, impact: 2, damage: 55, animation: 'wave', speed: 390, recovery: 1.6 },
];
