import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';import {Run} from '../src/game/core/run.ts';import {prepareBeta} from '../src/beta/prepare.ts';import {TRAINING,trainingModifiers} from '../src/content/training.ts';import {refreshStats} from '../src/game/systems/stats.ts';import {clearFruit} from '../src/game/systems/fruit-effects.ts';import type {BetaSettings} from '../src/beta/config.ts';
const bench=JSON.parse(readFileSync('docs/audits/balance-2026-11-03.json','utf8'));
const rows=[];
for(const hero of ['luffy','zoro','nami','sanji','usopp'])for(const boss of ['morgan','buggy','kuro','krieg','arlong-boss','roger'])for(const trained of [false,true]){
 let seed=9001;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};const r=new Run(hero,0,rng);const ids=bench.combos.find((c:{hero:string;rank:number;targets:number})=>c.hero===hero&&c.rank===6&&c.targets===1).ids as string[];
 prepareBeta(r,{destination:boss as BetaSettings['destination'],level:35,attacks:ids.map(id=>({id,slot:0,level:6}))});const p=r.player;if(trained){p.modifiers.permanent=trainingModifiers({levels:Object.fromEntries(Object.entries(TRAINING).map(([k,v])=>[k,v.max])),bans:[]});refreshStats(p);p.hp=p.stats.maxHp;}
 const b=r.encounter?.body??r.finalChallenge!.roger.body,initial=b.hp,maxHp=b.maxHp;let seconds=0,minHp=p.hp,outcome='30s limit';const phaseMin:number[]=[];
 for(let i=0;i<1800;i++){
  if(r.encounter?.state==='dead'){outcome='boss defeated';break;}if(p.hp<=0||r.status==='voyage'||r.status==='defeat'){outcome='player defeated';break;}
  if(r.status==='levelup'){r.status='playing';p.choices=[];}if(r.status==='fruit')r.selectFruit(false);if(r.status==='item')r.selectItem(false);
  if(r.status!=='playing'){outcome=r.status;break;}
  clearFruit(p);p.fruit=undefined;
  const dx=b.x-p.x,dy=b.y-p.y,d=Math.max(1,Math.hypot(dx,dy)),wanted=hero==='usopp'?200:p.stats.range*.5,radial=Math.max(-1,Math.min(1,(d-wanted)/90));
  r.update(1/60,{x:dx/d*radial-dy/d*.7,y:dy/d*radial+dx/d*.7});seconds+=1/60;minHp=Math.min(minHp,p.hp);const fraction=b.hp/maxHp;phaseMin.push(fraction);
 }
 rows.push({hero,boss,trained,ids,maxHp,seconds:Math.round(seconds*10)/10,outcome,playerHp:Math.round(p.hp),minHp:Math.round(minHp),bossDamage:Math.round(r.finalChallenge?.damage??Math.min(initial,Math.max(0,initial-b.hp))),bossPercentLeft:r.finalChallenge?null:Math.max(0,Math.round(b.hp/maxHp*100)),normalKills:p.kills});
 console.log(JSON.stringify(rows.at(-1)));
}
writeFileSync('docs/audits/encounters-2026-11-03.json',JSON.stringify({sourceRevision:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),method:'30s max, fixed seed9001; four linked level6 skills selected by stationary single-target bench; level35 cosmetic, no upgrade cards/passives/buffs/items/fruits. Maximum training is a separate arm; foods can be collected. Orbit controller uses innate range, no telegraph reading; this is NOT a human difficulty/TTK benchmark. All real Run/encounter/AI/navigation/damage systems. Roger window ends before first40s summon.',rows},null,2)+'\n');
