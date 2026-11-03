import {execFileSync} from 'node:child_process';
// Read-only offline diagnostic. Uses real combat executors, no Phaser or saves.
import {writeFileSync} from 'node:fs';
import {Run} from '../src/game/core/run.ts';
import {CHARACTERS,ENEMIES} from '../src/content/catalog.ts';
import {ABILITIES} from '../src/content/attacks.ts';
import {TRAINING,trainingModifiers} from '../src/content/training.ts';
import {refreshStats} from '../src/game/systems/stats.ts';
import {newAttack} from '../src/game/systems/loadout.ts';
import {tickAttacks} from '../src/game/systems/combat.ts';
import {tickGuards} from '../src/game/systems/guards.ts';
import {tickEffects} from '../src/game/systems/effects.ts';
import {difficultyAt} from '../src/game/systems/difficulty.ts';
import {densityTarget,earlyBalance} from '../src/content/early-balance.ts';
import {xpForLevel} from '../src/game/systems/progression.ts';
import {SHELLS_TOWN} from '../src/content/worlds/shells-town.ts';import {ORANGE_TOWN} from '../src/content/worlds/orange-town.ts';import {SYRUP_VILLAGE} from '../src/content/worlds/syrup-village.ts';import {BARATIE} from '../src/content/worlds/baratie.ts';import {ARLONG_PARK} from '../src/content/worlds/arlong-park.ts';
import type {CollisionWorld} from '../src/game/world/world.ts';
const flat={canOccupy:()=>true,segmentClear:()=>true,moveCircle:(p:{x:number;y:number},dx:number,dy:number)=>{p.x+=dx;p.y+=dy;}} as unknown as CollisionWorld;
const duration=30,dt=1/60;
function sample(hero:string,ids:string[],rank:number,targets:number,trained=false,distance=60){
 let seed=412;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const r=new Run(hero,0,random),p=r.player;p.x=0;p.y=0;p.facing=0;p.attacks=ids.map(id=>({...newAttack(id),level:rank}));p.abilitySlots=[ids,[],[],[]];p.selectedSlot=0;
 if(trained){p.modifiers.permanent=trainingModifiers({levels:Object.fromEntries(Object.entries(TRAINING).map(([k,v])=>[k,v.max])),bans:[]});refreshStats(p);}
 r.enemies.clear();r.projectiles.clear();r.areas.clear();r.pickups.clear();
 const starts=[];for(let i=0;i<targets;i++){const a=targets===1?0:(i-(targets-1)/2)*.18;const x=targets===1?distance:60+(i%4)*32,y=targets===1?0:(i<4?-18:18);starts.push({x,y});const e=r.enemies.acquire()!;Object.assign(e,{id:i+1,x,y,hp:1e7,maxHp:1e7,radius:13,speed:0,damage:0,xp:0,kind:targets===1?'boss':undefined,statuses:undefined});}
 for(let t=0;t<duration/dt;t++){
  p.x=0;p.y=0;r.enemies.items.slice(0,targets).forEach((e,i)=>Object.assign(e,starts[i]));r.grid.rebuild(r.enemies.items);tickGuards(p,dt);tickAttacks(p,r.grid,flat,dt,()=>{},()=>{},random,r);tickEffects(r,r.players,r.grid,flat,dt,()=>{},random);
 }
 const damage=r.enemies.items.slice(0,targets).reduce((n,e)=>n+1e7-e.hp,0);return Math.round(damage/duration*100)/100;
}
const skills=[];for(const hero of Object.keys(CHARACTERS))for(const id of CHARACTERS[hero].abilities)for(const rank of [1,3,6])skills.push({hero,id,rank,single:sample(hero,[id],rank,1),pack8:sample(hero,[id],rank,8)});
const combos=[];for(const hero of Object.keys(CHARACTERS))for(const rank of [1,3,6])for(const targets of [1,8]){const key=targets===1?'single':'pack8';const ids=skills.filter(s=>s.hero===hero&&s.rank===rank).sort((a,b)=>b[key]-a[key]).slice(0,4).map(s=>s.id);combos.push({hero,rank,targets,ids,dps:sample(hero,ids,rank,targets),maxTrainingDps:sample(hero,ids,rank,targets,true)});}
const worlds=[SHELLS_TOWN,ORANGE_TOWN,SYRUP_VILLAGE,BARATIE,ARLONG_PARK].map(w=>({world:w.id,cap:w.enemyCap,xpMultiplier:w.xpMultiplier,samples:[0,60,180,300,600,900].map(seconds=>{const d=difficultyAt(seconds,w.spawnInterval,w.difficulty),b=earlyBalance(w.id),e=ENEMIES[w.enemyId];return {seconds,basicHp:Math.round(e.hp*w.enemyScale*(b?.hp??1)*d.hp*10)/10,basicDamage:Math.round(e.damage*(b?.damage??1)*d.damage*10)/10,basicSpeed:Math.round(e.speed*d.speed),basicXp:Math.round(e.xp*(w.xpMultiplier??1)*(1+(d.hp-1)*(w.xpThreatScaling??0))),target:b?Math.ceil(densityTarget(w.id,seconds,0)):null,interval:b?.45:d.interval,batch:b?2:d.batch};})}));
const xp=[1,20,40,60,80,100].map(level=>({level,next:xpForLevel(level),totalToReach:Array.from({length:level-1},(_,i)=>xpForLevel(i+1)).reduce((a,b)=>a+b,0)}));
const result={sourceRevision:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),generated:new Date().toISOString(),method:{duration,seed:412,dt,notes:'Single target at60px; pack8 is a non-overlapping4x2 grid at x60/92/124/156,y±18, repositioned every tick; no incoming damage, terrain, fruits, items, temporary upgrades or buffs. Four linked skills is a late-game ceiling, not an initial loadout. Damage includes real projectiles, splash and bursts. Utility/healing not scored. One RNG seed, not confidence intervals.'},skills,combos,worlds,xp,farInitial:Object.keys(CHARACTERS).map(hero=>({hero,dps180:sample(hero,[CHARACTERS[hero].initialAbility],1,1,false,180)}))};
writeFileSync('docs/audits/balance-2026-11-03.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({combos,worlds,xp},null,2));
