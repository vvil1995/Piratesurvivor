import type { BossAttack } from './telegraphs.ts';
/** Reglas comunes; se fijan al preparar, nunca se acorta un aviso ya iniciado. */
export const FINAL_PHASE = { threshold: .33, warningScale: .7, minimumWarning: .35, movementScale: 1.15, cadenceScale: .85 } as const;
export function bossPhase(hp:number,maxHp:number,firstThreshold:number):number {
 const ratio=hp/maxHp;return ratio<=FINAL_PHASE.threshold?3:ratio<=firstThreshold?2:1;
}
export function warningSeconds(seconds:number,phase:number,minimum:number=FINAL_PHASE.minimumWarning):number {
 return phase===3?Math.max(minimum,seconds*FINAL_PHASE.warningScale):seconds;
}
export function pressuredAttack(attack:BossAttack,phase:number):BossAttack {
 return {...attack,preparation:warningSeconds(attack.preparation,phase,attack.minimumWarning)};
}
export function movementScale(phase:number):number{return phase===3?FINAL_PHASE.movementScale:1;}
export function cadenceScale(phase:number):number{return phase===3?FINAL_PHASE.cadenceScale:1;}
