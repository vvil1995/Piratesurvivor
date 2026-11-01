import test from 'node:test';import assert from 'node:assert/strict';
import { Run } from '../src/game/core/run.ts';
import { KuroEncounter } from '../src/game/bosses/kuro.ts';
import { KURO_ATTACKS } from '../src/content/bosses/kuro.ts';
import { SYRUP_VILLAGE } from '../src/content/worlds/syrup-village.ts';
import { ENEMIES, CHARACTERS } from '../src/content/catalog.ts';
import { chooseEnemyType } from '../src/game/systems/spawner.ts';
import { ProceduralWorld } from '../src/game/world/world.ts';
import { ArenaWorld,KURO_ARENA } from '../src/game/world/arena.ts';
import type { CollisionWorld } from '../src/game/world/world.ts';
import { improveAttack } from '../src/game/systems/loadout.ts';
import { equipItem } from '../src/game/systems/items.ts';
import { spawnProjectile } from '../src/game/systems/effects.ts';
import { tickEnemyMelee } from '../src/game/systems/enemy-melee.ts';
const axis={x:0,y:0},noop=()=>{};
const clear:CollisionWorld={canOccupy:()=>true,segmentClear:()=>true,moveCircle:(p,x,y)=>{p.x+=x;p.y+=y;}};
const attack=(id:string)=>KURO_ATTACKS.find(a=>a.id===id)!;
const step=(r:Run,n:number)=>{for(let i=0;i<Math.ceil(n*60);i++)r.update(1/60,axis);};
function syrup(id='luffy'){
 const r=new Run(id,0,()=>.5);r.morganDefeated=true;r.boardToOrangeTown();r.beginBuggy();r.buggyDefeated=true;r.encounter!.body.hp=0;r.encounter!.defeated();step(r,1.4);assert.ok(r.exitSignal);r.finishCombinations();assert.ok(r.sailToSyrup());step(r,3.1);assert.equal(r.zone,'syrup-village');r.player.hurtTimer=1e6;return r;
}
function tick(b:KuroEncounter,p:Run['player'],seconds:number,w=clear){for(let i=0;i<Math.ceil(seconds*60);i++){p.hurtTimer=Math.max(0,p.hurtTimer-1/60);b.tick(1/60,p,w,()=>axis,noop);}}
test('Syrup: mezcla por minutos, cap móvil y dificultad moderada respecto a Orange',()=>{
 for(const [t,allowed]of [[0,1],[59,1],[60,2],[120,3],[180,3]] as const){const ids=new Set<string>();for(let i=0;i<100;i++)ids.add(chooseEnemyType(SYRUP_VILLAGE,t,()=>(i+.5)/100));assert.equal(ids.size,allowed);assert.ok(ids.has('blackcat-pirate'));}
 assert.ok(SYRUP_VILLAGE.enemyCap<=120);assert.ok(ENEMIES['blackcat-pirate'].speed>ENEMIES.marine.speed);assert.ok(ENEMIES['blackcat-claw'].hp>ENEMIES['blackcat-pirate'].hp);
});
test('Syrup rural: determinista, casas/árboles/colinas, mansión y todos los claros conectados',()=>{
 for(const seed of [3,42,887]){const w=new ProceduralWorld(seed,'syrup');assert.ok(w.getChunk(0,0).obstacles.some(o=>o.art==='syrup-mansion'));
  for(let cy=-2;cy<=2;cy++)for(let cx=-2;cx<=2;cx++){
   const c=w.getChunk(cx,cy),seen=new Set([0]),q=[0];assert.deepEqual(c,new ProceduralWorld(seed,'syrup').getChunk(cx,cy));
   for(let n=0;n<q.length;n++){const a=q[n],x=a%16,y=Math.floor(a/16);for(const[dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,b=nx+ny*16;if(nx>=0&&ny>=0&&nx<16&&ny<16&&!c.solids[b]&&!seen.has(b)){seen.add(b);q.push(b);}}}
   for(let n=0;n<256;n++)if(!c.solids[n])assert.ok(seen.has(n));
   assert.ok(c.obstacles.every(o=>!o.art?.startsWith('naval-')));
  }
 }
});
test('cinco personajes conservan HP/build al viajar y no hay acceso anticipado a Kuro',()=>{
 assert.equal(new Run().beginKuro(),false);
 for(const id of Object.keys(CHARACTERS)){const r=syrup(id),p=r.player;equipItem(p,'vest');p.fruit='bomu';p.level=36;p.xp=7;p.collectedBerries=50;p.hp=57;const state=JSON.stringify([p.level,p.xp,p.attacks,p.items,p.fruit,p.collectedBerries]);
  assert.ok(r.beginKuro());assert.equal(p.hp,57);assert.equal(JSON.stringify([p.level,p.xp,p.attacks,p.items,p.fruit,p.collectedBerries]),state);assert.equal(r.world.theme,'syrup');assert.equal(r.inArena,true);assert.equal(r.visibleChests.length,0);
 }
});
test('Kuro: X con dos cortes avisados, ningún daño temprano y zona fijada antes de esquivar',()=>{
 const b=new KuroEncounter(),p=new Run().player;b.body.x=500;b.body.y=500;p.x=560;p.y=500;b.prepare(attack('cross'),p,clear);
 const zones=JSON.stringify([b.telegraph!.zone,...b.extraWarnings]);assert.equal(b.extraWarnings.length,0);tick(b,p,.4);assert.equal(p.hp,100);assert.equal(JSON.stringify([b.telegraph!.zone,...b.extraWarnings]),zones);
 p.x=1000;p.y=1000;tick(b,p,.12);assert.equal(p.hp,100);assert.ok(b.impactZone);
});
test('Kuro: carga advierte, fija rumbo y no atraviesa obstáculos',()=>{
 const b=new KuroEncounter(),p=new Run().player,w=new ArenaWorld(42,KURO_ARENA,'syrup');b.body.x=700;b.body.y=600;p.x=100;p.y=600;b.prepare(attack('pounce'),p,w);const angle=b.telegraph!.zone.angle;p.y+=200;
 tick(b,p,.7);assert.equal(b.body.x,700);tick(b,p,1.2,w);assert.ok(w.canOccupy(b.body.x,b.body.y,b.body.radius));assert.ok(b.body.x<700);assert.equal(angle,Math.PI);
});
test('Kuro: pasos fantasma no dañan y generan estela acotada',()=>{
 const b=new KuroEncounter(),p=new Run().player;p.x=b.body.x+130;p.y=b.body.y;b.body.hp=b.body.maxHp*.5;b.prepare(attack('ghost'),p,clear);tick(b,p,.7);assert.equal(p.hp,100);assert.ok(b.trails.length>0&&b.trails.length<=12);assert.ok(Math.hypot(b.body.x-p.x,b.body.y-p.y)>=120);
});
test('Kuro: Shakushi tiene cinco pasadas avisadas y ráfaga cuatro golpes separados',()=>{
 for(const [id,expected]of [['shakushi',5],['flurry',4],['cross',2]] as const){const b=new KuroEncounter(),p=new Run().player;p.x=1000;p.y=500;p.hurtTimer=100;b.body.x=500;b.body.y=500;b.body.hp=b.body.maxHp*.2;b.prepare(attack(id),p,clear);let impacts=0,old=b.state;
  for(let i=0;i<900;i++){b.tick(1/60,p,clear,()=>axis,noop);if(old==='preparing'&&b.state==='impact')impacts++;old=b.state;if(b.state==='approach')break;}
  assert.equal(impacts,expected);assert.ok(b.body.active);b.defeated();assert.equal(b.trails.length,0);assert.equal(b.telegraph,undefined);assert.equal(b.extraWarnings.length,0);
 }
});
test('Kuro: las tres fases ejecutan sus seis patrones con colisión segura',()=>{
 const r=syrup();r.beginKuro();const b=r.encounter!,seen=new Set<string>();r.player.attacks.forEach(a=>a.cooldown=1e6);
 for(const ratio of [1,.5,.2]){b.body.hp=b.body.maxHp*ratio;for(let i=0;i<60*55;i++){r.update(1/60,axis);if(b.telegraph)seen.add(b.telegraph.attack.id);assert.ok(r.world.canOccupy(b.body.x,b.body.y,b.body.radius));}}
 assert.deepEqual([...seen].sort(),KURO_ATTACKS.map(a=>a.id).sort());
});
test('urpas: preparación y dos cortes; guardias y esquivas siguen siendo válidas',()=>{
 const r=new Run(),p=r.player,e={...r.enemies.items[0],...ENEMIES['blackcat-claw'],id:900,x:p.x+40,y:p.y,active:true,maxHp:110,flash:0,meleeTimer:0};
 tickEnemyMelee(e,p,clear,.01);assert.ok(e.meleeWindup!>0);assert.equal(p.hp,100);for(let i=0;i<37;i++)tickEnemyMelee(e,p,clear,1/60);assert.ok(p.hp<100);assert.equal(e.meleeHits,1);
 const hp=p.hp;p.x+=200;for(let i=0;i<20;i++)tickEnemyMelee(e,p,clear,1/60);assert.equal(e.meleeHits,0);assert.equal(p.hp,hp);
});
test('hipnosis: proyectil real aplica slow breve sin acumularse y el pool no lo hereda',()=>{
 const r=new Run(),p=r.player;spawnProjectile(r,p.x-30,p.y,p.x,p.y,1,165,'',true,1,undefined,2.5,{multiplier:.72,duration:1.8});
 for(let i=0;i<20;i++)r.update(1/60,axis);assert.ok((p.slowFor??0)>0);assert.equal(p.slowMultiplier,.72);const before=p.x;r.update(1/30,{x:1,y:0});assert.ok(p.x-before<p.stats.speed/30*.8);
 p.slowFor=.01;r.update(1/30,axis);assert.equal(p.slowFor,0);r.projectiles.clear();spawnProjectile(r,0,0,100,0,1,165,'',true);assert.equal(r.projectiles.items.find(b=>b.active)!.slow,undefined);
});
test('victoria de Kuro: unión, mismo estado, Baratie voluntario con build conservada; derrota vuelve a Syrup',()=>{
 const r=syrup(),world=r.world;preset(r);r.beginKuro();r.player.hp=0;step(r,.02);assert.equal(r.voyage?.destination,'syrup-return');for(let i=0;i<190&&r.status==='voyage';i++)r.update(1/60,axis);assert.equal(r.world,world);assert.equal(r.player.hp,25);
 r.beginKuro();r.encounter!.body.x=r.player.x+40;r.encounter!.body.y=r.player.y;r.encounter!.body.hp=1;r.player.attacks[0].cooldown=0;r.player.hurtTimer=100;step(r,.02);assert.ok(r.kuroDefeated);step(r,1.4);assert.equal(r.status,'combining');assert.ok(r.exitSignal);const token=r.unionTokens;
 assert.ok(r.joinPair(0,1));assert.equal(r.unionTokens,token-1);assert.equal(r.status,'playing');assert.equal(r.player.abilitySlots.filter(s=>s.length).length,1);assert.ok(r.baratieUnlocked);assert.equal(r.zone,'kuro-arena');assert.equal(r.voyage,undefined);assert.equal(r.sailToBaratie(),true);assert.equal(r.voyage?.destination,'baratie');
});
function preset(r:Run){improveAttack(r.player,'gatling');}

test('hipnotizador dispara desde la IA compartida y no solo desde una fixture de proyectil',()=>{
 const r=syrup(),p=r.player;p.hurtTimer=0;for(const a of p.attacks)a.cooldown=100;
 const e=r.enemies.acquire()!;Object.assign(e,ENEMIES['blackcat-hypnotist'],{id:900,x:p.x+200,y:p.y,active:true,maxHp:75,shotTimer:0,shotWindup:0,flash:0});
 step(r,1);assert.ok(r.projectiles.items.some(b=>b.active&&b.hostile&&b.slow));step(r,1.3);assert.ok((p.slowFor??0)>0);assert.ok(p.hp<p.stats.maxHp);
});
test('Kuro con un único ataque permite cerrar recompensa sin conceder habilidades',()=>{
 const r=syrup();r.beginKuro();r.encounter!.body.x=r.player.x+35;r.encounter!.body.y=r.player.y;r.encounter!.body.hp=1;r.player.attacks[0].cooldown=0;step(r,.02);step(r,1.4);assert.equal(r.status,'combining');assert.equal(r.player.attacks.length,1);assert.ok(r.finishCombinations());assert.equal(r.status,'playing');assert.equal(r.player.attacks.length,1);assert.ok(r.exitSignal);assert.equal(r.voyage,undefined);
});

test('salida voluntaria Buggy: estado completo conservado con los cinco personajes',()=>{
 for(const id of Object.keys(CHARACTERS)){
  const r=new Run(id,0,()=>.5);r.morganDefeated=true;r.boardToOrangeTown();r.beginBuggy();const p=r.player;
  p.hp=53;p.level=35;p.xp=8;p.collectedBerries=77;equipItem(p,'vest');p.fruit='bomu';improveAttack(p,r.character.abilities[1]);
  r.buggyDefeated=true;r.encounter!.body.hp=0;r.encounter!.defeated();step(r,1.4);assert.equal(r.zone,'buggy-arena');assert.equal(r.voyage,undefined);
  const state=()=>JSON.stringify([p.hp,p.level,p.xp,p.items,p.fruit,p.collectedBerries,p.abilitySlots,p.modifiers,p.attacks.map(a=>[a.id,a.level,a.cooldown,a.activeFor]),p.learnedBuffs]);
  r.finishCombinations();assert.ok(r.sailToSyrup());const before=state();for(let i=0;i<190&&r.status==='voyage';i++)r.update(1/60,axis);assert.equal(r.zone,'syrup-village');assert.equal(state(),before);assert.ok(r.world.canOccupy(p.x,p.y,14));
 }
});

import { ChestField } from '../src/game/systems/loot.ts';
import { LOOT } from '../src/content/loot.ts';
test('cofres rurales conservan candidatos3/24, acceso libre y memoria al reintentar Kuro',()=>{
 assert.equal(LOOT.smallChunkEvery,3);assert.equal(LOOT.largeChunkEvery,24);
 for(const seed of [3,42,887]){const w=new ProceduralWorld(seed,'syrup'),f=new ChestField();let count=0;
  for(let y=-3;y<=3;y++)for(let x=-3;x<=3;x++){f.sync(w,{x:x*512+256,y:y*512+256});for(const c of f.active){count++;assert.ok(w.canOccupy(c.x,c.y,18));}}assert.ok(count>0);
 }
 const r=syrup(),field=r.explorationChests;r.beginKuro();r.player.hp=0;r.update(1/60,axis);for(let i=0;i<190&&r.status==='voyage';i++)r.update(1/60,axis);assert.equal(r.explorationChests,field);
});
