import { KURO } from './kuro.ts';
import type { BossAttack } from '../../game/bosses/telegraphs.ts';
export const KRIEG={id:'krieg',name:'DON KRIEG',visual:'don-krieg-s-0',weapon:'don-krieg-s-0',entityId:-1000003,hp:KURO.hp*1.35,radius:28,speed:130,engageRange:280,phaseThresholds:[.66,.33],pursuitSprint:175,sprintAfter:2,rangedWait:1.2,patterns:[['spear','gun','naval'],['shield','gun','poison','spear','naval'],['mh5','spear','gun','poison','naval','shield']],stunSeconds:1.5,reinforcementCap:0,reinforcementCount:0,reinforcementEnemy:'krieg-saber',phaseCadence:[1,.9,.78]} as const;
export const KRIEG_RULES={armor:3000,armorReduction:.25,shieldReduction:.6,shieldSeconds:3,bulletSpeed:230,bulletRange:850,gasTick:.8,gasLife:4,gasDamage:12,mh5Life:5,mh5Damage:18,hazardCap:16} as const;
const base={length:0,width:0,radius:0,innerRadius:0,arc:Math.PI,finalWarning:.35,impact:.2,cooldown:0,recovery:1.2};
export const KRIEG_ATTACKS:readonly BossAttack[]=[
 {...base,id:'spear',name:'Llança explosiva',phase:1,shape:'cone',radius:240,arc:Math.PI*.4,preparation:.8,damage:45,animation:'axe',recovery:1.3},
 {...base,id:'gun',name:'Metralladora oculta',phase:1,shape:'line',length:850,width:12,preparation:1.2,damage:32,animation:'order',recovery:1.6},
 {...base,id:'naval',name:'Bombardeig naval',phase:1,shape:'circle',radius:75,preparation:1.6,damage:48,animation:'order',recovery:1.5},
 {...base,id:'shield',name:'Escut daurat',phase:2,shape:'circle',radius:0,preparation:.7,damage:0,animation:'order',impact:3,recovery:.9,cooldown:9},
 {...base,id:'poison',name:'Bombes verinoses',phase:2,shape:'circle',radius:85,preparation:1.5,damage:24,animation:'order',recovery:1.4,cooldown:8},
 {...base,id:'mh5',name:'MH5 · Gas mortal',phase:3,shape:'rectangle',length:560,width:240,preparation:2.6,minimumWarning:1.2,damage:18,animation:'order',impact:5,recovery:1.5,fixedRecovery:true,cooldown:20},
];
