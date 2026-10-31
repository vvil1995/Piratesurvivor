import type { BossProfile } from '../../game/bosses/pattern-encounter.ts';
import type { BossAttack } from '../../game/bosses/telegraphs.ts';
export const BUGGY: BossProfile = {
  id: 'buggy', name: 'BUGGY EL PAYASO', visual: 'buggy', weapon: 'buggy-knives', entityId: -1000001,
  hp: 6800, radius: 24, speed: 240, engageRange: 215, phaseThresholds: [0.65, 0.30],
  pursuitSprint: 320, sprintAfter: 2, rangedWait: 1.4, stunSeconds: 1.5,
  reinforcementCap: 5, reinforcementCount: 3, reinforcementEnemy: 'buggy-pirate', phaseCadence: [1, 0.9, 0.8],
  patterns: [['knives', 'bomb', 'sweep'], ['split', 'knives', 'bomb', 'order', 'sweep'], ['barrage', 'split', 'knives', 'order', 'bomb']],
};
const base = { length: 0, width: 0, radius: 0, innerRadius: 0, arc: Math.PI, finalWarning: 0.35, impact: 0.3, cooldown: 0, recovery: 1.1 };
// Adaptaciones jugables de su cuerpo separable y explosivos; no nombres de técnicas oficiales.
export const BUGGY_ATTACKS: readonly BossAttack[] = [
  { ...base, id: 'knives', name: 'Mano de cuchillas', phase: 1, shape: 'line', length: 570, width: 62, preparation: 1.25, impact: 2, damage: 38, animation: 'wave', speed: 360 },
  { ...base, id: 'bomb', name: 'Bomba del payaso', phase: 1, shape: 'circle', radius: 78, targeted: true, cover: true, preparation: 1.6, damage: 45, animation: 'bomb', recovery: 1.3 },
  { ...base, id: 'sweep', name: 'Abanico de cuchillos', phase: 1, shape: 'arc', radius: 180, preparation: 1.3, damage: 32, animation: 'sweep' },
  { ...base, id: 'split', name: 'Asalto desmontable', phase: 2, shape: 'circle', radius: 95, targeted: true, preparation: 1.5, damage: 40, animation: 'split', recovery: 1.4 },
  { ...base, id: 'order', name: 'Orden a la tripulación', phase: 2, shape: 'circle', radius: 0, preparation: 1.2, damage: 0, animation: 'order', cooldown: 16 },
  { ...base, id: 'barrage', name: 'Bombardeo de circo', phase: 3, shape: 'circle', radius: 70, targeted: true, cover: true, offsets: [{ x: -135, y: 0 }, { x: 135, y: 0 }], preparation: 2, damage: 55, animation: 'bomb', recovery: 1.7 },
];
