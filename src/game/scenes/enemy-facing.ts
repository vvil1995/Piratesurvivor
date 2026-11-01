import type { Direction } from './actor-animation.ts';
/** Estos atlas provisionales repiten un perfil derecho en las ocho columnas. */
const rightProfiles=new Set(['krieg-saber','krieg-gunner','krieg-armored','fishman-fighter','fishman-spitter','fishman-karate']);
export function enemyFlipX(visual:string|undefined,direction:Direction):boolean{
 return !!visual&&rightProfiles.has(visual)&&(direction==='w'||direction==='nw'||direction==='sw');
}
