import type { BossProfile } from '../../game/bosses/pattern-encounter.ts';
import type { BossAttack } from '../../game/bosses/telegraphs.ts';
export const BUGGY: BossProfile = {
    id: 'buggy', name: 'BUGGY', visual: 'buggy', weapon: 'buggy-knives', entityId: -1000001,
    hp: 6800, radius: 24, speed: 160, engageRange: 300, phaseThresholds: [0.66, 0.33],
    pursuitSprint: 240, sprintAfter: 2, rangedWait: 1.4, stunSeconds: 1.7,
    reinforcementCap: 0, reinforcementCount: 0, reinforcementEnemy: 'buggy-pirate', phaseCadence: [1, .93, .86],
    patterns: [['knives', 'bomb', 'ring'], ['split', 'knives', 'charge', 'bomb', 'ring'], ['barrage', 'ring', 'charge', 'bomb', 'split', 'knives']],
};
export const BUGGY_RULES = {
    knifeCap: 64, hazardCap: 12, knifeRadius: 6, knifeSpeed: 280, knifeSpeedScale: [1, 1.08, 1.16], knifeRange: 760,
    fanCount: [5, 7, 9], ringCount: [12, 14, 16], fanArc: 1.25,
    bombCount: [1, 2, 3], bombSpacing: 150, bombStagger: .28,
    rainRadius: 32, splitSeconds: 3, returnSeconds: .6, handSpeed: 125, handDamage: 22,
    preferredDistance: 245, retreatDistance: 180, repositionSeconds: .7,
} as const;
const base = { length: 0, width: 0, radius: 0, innerRadius: 0, arc: Math.PI, finalWarning: .35, impact: .3, cooldown: 0, recovery: 1.15 };
export const BUGGY_ATTACKS: readonly BossAttack[] = [
    { ...base, id: 'knives', name: 'Ganivets en ventall', phase: 1, shape: 'line', length: BUGGY_RULES.knifeRange, width: 12, preparation: 1.05, damage: 28, animation: 'knives', recovery: 1.1 },
    { ...base, id: 'ring', name: 'Cercle de ganivets', phase: 1, shape: 'line', length: BUGGY_RULES.knifeRange, width: 12, preparation: 1.3, damage: 28, animation: 'ring', recovery: 1.3 },
    { ...base, id: 'bomb', name: 'Bomba Buggy', phase: 1, shape: 'circle', radius: 62, targeted: true, cover: true, preparation: 1.6, damage: 45, animation: 'bomb', recovery: 1.25 },
    { ...base, id: 'split', name: 'Bara Bara · parts separades', phase: 2, shape: 'circle', radius: 12, preparation: 1.3, damage: 22, animation: 'split', impact: 3, recovery: 1.4, cooldown: 8 },
    { ...base, id: 'charge', name: 'Càrrega del cap', phase: 2, shape: 'line', length: 620, width: 28, preparation: 1.5, impact: 1.5, damage: 40, animation: 'charge', speed: 520, recovery: 1.5 },
    { ...base, id: 'barrage', name: 'Pluja de ganivets', phase: 3, shape: 'circle', radius: 32, targeted: true, cover: true, preparation: 1.8, damage: 42, animation: 'rain', recovery: 1.6, cooldown: 8 },
];
