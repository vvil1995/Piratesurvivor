import { KRIEG } from './krieg.ts';
import type { BossAttack } from '../../game/bosses/telegraphs.ts';
export const ARLONG={id:'arlong',name:'ARLONG',visual:'arlong-s-0',weapon:'arlong-s-0',entityId:-1000004,hp:Math.round(KRIEG.hp*1.08),radius:25,speed:220,engageRange:180,phaseThresholds:[.66,.33],pursuitSprint:290,sprintAfter:1.3,rangedWait:1.1,patterns:[['bite','kiribachi','water'],['tooth','bite','dive','kiribachi','water'],['darts','kiribachi','tooth','water','dive','bite']],stunSeconds:1.1,reinforcementCap:0,reinforcementCount:0,reinforcementEnemy:'fishman-fighter',phaseCadence:[1,.9,.78]} as const;
const base={length:0,width:0,radius:0,innerRadius:0,arc:Math.PI,finalWarning:.3,impact:.2,cooldown:0,recovery:1.1};
export const ARLONG_ATTACKS:readonly BossAttack[]=[
 {...base,id:'bite',name:'Mossegada de tauró',phase:1,shape:'cone',radius:220,arc:Math.PI*.5,preparation:.7,impact:.3,damage:52,animation:'order',recovery:1.1},
 {...base,id:'kiribachi',name:'Kiribachi',phase:1,shape:'arc',radius:215,arc:Math.PI*.75,preparation:.8,damage:42,animation:'sweep',recovery:1.3},
 {...base,id:'water',name:"Dards d'aigua",phase:1,shape:'line',length:780,width:14,preparation:1.1,damage:34,animation:'order',recovery:1.3},
 {...base,id:'tooth',name:'Shark on Tooth',phase:2,shape:'line',length:600,width:36,preparation:1.2,damage:44,animation:'order',impact:4.1,recovery:1.2,cooldown:7},
 {...base,id:'dive',name:'Immersió',phase:2,shape:'line',length:640,width:72,preparation:1.2,minimumWarning:.65,damage:50,animation:'charge',speed:820,impact:4,recovery:1.3,cooldown:9},
 {...base,id:'darts',name:'Shark on Darts',phase:3,shape:'line',length:780,width:68,preparation:1.2,minimumWarning:.65,damage:54,animation:'charge',speed:1000,impact:1.1,recovery:1.6,fixedRecovery:true,cooldown:15},
];
export const ARLONG_RAGE:BossAttack={...base,id:'rage',name:"Fúria d'Arlong",phase:3,shape:'circle',radius:0,preparation:1,damage:0,animation:'order',impact:.35,recovery:.9,fixedRecovery:true};
export const ARLONG_RULES={waterSpeed:220,waterRange:780,toothSpeed:330,biteDistance:140,biteSpeed:650,diveSpeed:330,submergeSeconds:.65,diveTravelTimeout:5,dartsPasses:3} as const;
