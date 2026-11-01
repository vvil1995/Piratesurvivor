import type { Run } from '../game/core/run.ts';
import { BETA_DESTINATIONS,type BetaSettings } from './config.ts';
import { availableAbilities,improveAttack,validLoadout } from '../game/systems/loadout.ts';
import { xpForLevel } from '../game/systems/progression.ts';
import { updateBuffModifiers } from '../game/systems/buffs.ts';
import { ABILITIES } from '../content/attacks.ts';
/** Usa las transiciones y las habilidades reales. No concede moneda ni recompensas permanentes. */
export function prepareBeta(run:Run,settings:BetaSettings):void{
 if(!BETA_DESTINATIONS.some(d=>d[0]===settings.destination))throw Error('Destino inválido');
 const allowed=availableAbilities(run.player),seen=new Set<string>(),counts=[0,0,0,0];let buffs=0;
 for(const a of settings.attacks){if(!allowed.includes(a.id)||seen.has(a.id)||!Number.isInteger(a.slot)||a.slot<0||a.slot>3||++counts[a.slot]>4||!Number.isInteger(a.level)||a.level<1||a.level>6)throw Error('Build inválida');seen.add(a.id);if(ABILITIES[a.id].buff&&++buffs>2)throw Error('Máximo dos buffs');}
 if(!seen.size||!Number.isInteger(settings.level)||settings.level<1||settings.level>100)throw Error('Nivel o build inválidos');
 run.practice=true;const p=run.player;p.attacks=[];p.abilitySlots=[[],[],[],[]];p.learnedBuffs=[];p.selectedSlot=settings.attacks[0].slot;
 for(const a of settings.attacks){if(!improveAttack(p,a.id,a.slot))throw Error('No se pudo equipar');for(let n=1;n<a.level;n++)improveAttack(p,a.id);}
 if(!validLoadout(p))throw Error('Ranuras inválidas');
 p.level=settings.level;p.xp=0;p.xpNext=xpForLevel(p.level);updateBuffModifiers(p);p.hp=p.stats.maxHp;
 const target=settings.destination,index=BETA_DESTINATIONS.findIndex(d=>d[0]===target);
 run.morganDefeated=index>=2;run.buggyDefeated=index>=4;run.kuroDefeated=index>=6;run.kriegDefeated=index>=8;run.arlongDefeated=index>=10;
 if(target==='morgan')run.beginMorgan();
 else if(target==='orange'||target==='buggy'){run.boardToOrangeTown();if(target==='buggy')run.beginBuggy();}
 else if(index>=4){const destination=target==='syrup'||target==='kuro'?'syrup':target==='baratie'||target==='krieg'?'baratie':target==='roger'?'roger':'arlong';run.voyage={destination,elapsed:0};run.status='voyage';for(let i=0;i<190&&run.status==='voyage';i++)run.update(1/60,{x:0,y:0});if(target==='kuro')run.beginKuro();if(target==='krieg')run.beginKrieg();if(target==='arlong-boss')run.beginArlong();}
 p.hp=p.stats.maxHp;run.lootNotice='BETA TEST · SIN GUARDADO';run.lootNoticeFor=3;
 for(let i=0;i<8;i++)run.grantCombinationReward();
}
