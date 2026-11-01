import type { BossAttack } from '../../game/bosses/telegraphs.ts';
export const ROGER_RULES={summonInterval:40,summonSeconds:2,bossCap:8,bossXp:80,bossBerries:10,bossHp:.6,bossSpeed:1.2,enemyCap:70,minimumWarning:.35} as const;
export const ROGER={id:'roger',name:'GOL D. ROGER',visual:'roger-s-0',weapon:'roger-s-0',entityId:-2000000,hp:1,radius:25,speed:190,engageRange:240,phaseThresholds:[.66,.33],pursuitSprint:260,sprintAfter:1.2,rangedWait:1,patterns:[['king'],['king'],['king']],stunSeconds:1,reinforcementCap:0,reinforcementCount:0,reinforcementEnemy:'marine-sword',phaseCadence:[1,.9,.8]} as const;
const base={phase:1,length:0,width:0,radius:0,innerRadius:0,arc:Math.PI,preparation:1.1,finalWarning:.3,impact:.2,damage:48,cooldown:0,recovery:1.1,animation:'sweep'};
export const ROGER_ATTACKS:readonly BossAttack[]=[
 {...base,id:'king',name:'Tall del Rei',shape:'cone',radius:260,arc:Math.PI*.8},
 {...base,id:'kamusari',name:'Kamusari',shape:'line',length:1100,width:72,preparation:1.2,impact:2,animation:'wave',speed:760},
 {...base,id:'haki',name:'Haki del Conqueridor',shape:'circle',radius:450,preparation:1.6,impact:1.6,animation:'order',recovery:1.4},
 {...base,id:'storm',name:'Tempesta de talls',shape:'line',length:1000,width:64,preparation:1,animation:'wave',speed:800,impact:1.5,recovery:.25},
 {...base,id:'summon',name:'Reis d’East Blue',shape:'circle',radius:0,preparation:2,animation:'order',damage:0},
 {...base,id:'will',name:'Voluntat del Rei',shape:'line',length:600,width:180,preparation:1.8,minimumWarning:1,animation:'order',impact:.8,recovery:1.5},
];
export function summonCount(seconds:number):number{return seconds>=480?5:seconds>=360?4:seconds>=240?3:seconds>=160?2:1;}
export function hordeWorldCount(seconds:number):number{return Math.min(5,1+Math.floor(seconds/30));}
