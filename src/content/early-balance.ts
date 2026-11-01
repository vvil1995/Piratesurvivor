/** Primeros tres mundos; no se aplica al desafío de Roger ni a los mundos posteriores. */
export const EARLY_BALANCE={
 'shells-town':{start:8,end:22,hp:1,damage:1,bossHp:1.5},
 'orange-town':{start:20,end:35,hp:1.35,damage:1.2,bossHp:2.5},
 'syrup-village':{start:32,end:48,hp:1.8,damage:1.4,bossHp:3},
} as const;
export function earlyBalance(zone:string){return EARLY_BALANCE[zone as keyof typeof EARLY_BALANCE];}
export function densityTarget(zone:string,localSeconds:number,previous:number):number{
 const b=earlyBalance(zone);return b?Math.min(48,Math.max(previous,b.start+(b.end-b.start)*Math.min(1,Math.max(0,localSeconds)/300))):previous;
}
