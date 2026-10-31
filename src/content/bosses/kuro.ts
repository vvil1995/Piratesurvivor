import { BUGGY } from './buggy.ts';
import type { BossAttack } from '../../game/bosses/telegraphs.ts';
export const KURO = {id:'kuro',name:'CAPITÀ KURO',visual:'kuro-s-0',weapon:'kuro-s-0',entityId:-1000002,hp:BUGGY.hp*1.25,radius:21,speed:260,engageRange:165,phaseThresholds:[.66,.33],pursuitSprint:330,sprintAfter:1.2,rangedWait:1.1,patterns:[['cross','pounce','flurry'],['ghost','cross','surprise','pounce','flurry'],['shakushi','surprise','cross','ghost','flurry','pounce']],stunSeconds:1.1,reinforcementCap:0,reinforcementCount:0,reinforcementEnemy:'blackcat-pirate',phaseCadence:[1,.9,.8]} as const;
const base={length:0,width:0,radius:0,innerRadius:0,arc:Math.PI,finalWarning:.28,impact:.16,cooldown:0,recovery:.9};
export const KURO_ATTACKS:readonly BossAttack[]=[
 {...base,id:'cross',name:'Urpes creuades',phase:1,shape:'rectangle',length:190,width:48,preparation:.5,damage:38,animation:'axe',recovery:.65},
 {...base,id:'pounce',name:'Embestida felina',phase:1,shape:'line',length:470,width:58,preparation:.8,impact:1,damage:36,animation:'charge',speed:700,recovery:1,fixedRecovery:true},
 {...base,id:'ghost',name:'Passos fantasma',phase:2,shape:'circle',radius:32,preparation:.65,damage:0,animation:'split',targeted:true,recovery:.55},
 {...base,id:'shakushi',name:'Shakushi',phase:3,shape:'line',length:580,width:54,preparation:1,impact:1,damage:42,animation:'charge',speed:920,recovery:2,fixedRecovery:true,cooldown:14},
 {...base,id:'flurry',name:"Ràfega d'urpes",phase:1,shape:'cone',radius:125,arc:Math.PI*.65,preparation:.7,damage:23,animation:'sweep',recovery:1.2,fixedRecovery:true},
 {...base,id:'surprise',name:'Urpes sorpresa',phase:2,shape:'arc',radius:145,arc:Math.PI,preparation:.5,damage:32,animation:'sweep',recovery:.8,fixedRecovery:true},
];
