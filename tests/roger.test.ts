import test from 'node:test';import assert from 'node:assert/strict';
import { Run } from '../src/game/core/run.ts';
import { RogerChallenge,SUMMON_TYPES } from '../src/game/challenges/roger.ts';
import { ROGER_RULES as R,summonCount,hordeWorldCount,ROGER_ATTACKS } from '../src/content/bosses/roger.ts';
import { RogerEncounter } from '../src/game/bosses/roger.ts';
import { MorganEncounter } from '../src/game/bosses/morgan.ts';
import { BuggyEncounter } from '../src/game/bosses/buggy.ts';
import { KuroEncounter } from '../src/game/bosses/kuro.ts';
import { KriegEncounter } from '../src/game/bosses/krieg.ts';
import { ArlongEncounter } from '../src/game/bosses/arlong.ts';
import { damageEnemy } from '../src/game/systems/hits.ts';
import { SaveStore,SAVE_KEY } from '../src/platform/persistence/save.ts';
import { STAT_LIMITS } from '../src/content/stat-rules.ts';
import { CHARACTERS } from '../src/content/catalog.ts';
import { aquaticWorld } from '../src/game/world/aquatic.ts';
const axis={x:0,y:0},noop=()=>{};
function rng(){let n=73;return()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296;};}
function challenge(){const p=new Run().player;p.hp=1e6;p.hurtTimer=1e6;p.x=1536;p.y=1216;const f=new RogerChallenge(42,rng(),{fire:noop,clear:noop,reflect:noop,counter:()=>false,reinforce:noop});return{f,p};}
function finalRun(id='luffy'){
 const r=new Run(id,0,rng(),{seed:42});r.zone='arlong-arena';r.arlongDefeated=true;r.encounter=new ArlongEncounter();r.encounter.defeated();return r;
}
function voyage(r:Run){for(let i=0;i<190&&r.status==='voyage';i++)r.update(1/60,axis);}
function step(r:Run,n:number){for(let i=0;i<Math.ceil(n*60);i++){r.player.hurtTimer=100;r.update(1/60,axis);}}
test('Roger: acceso voluntario y cinco personajes conservan su estado completo, sin cofres',()=>{
 for(const id of Object.keys(CHARACTERS)){
  const r=finalRun(id);r.player.level=35;r.player.xp=3;r.player.collectedBerries=789;r.player.hp=67;r.player.items={hat:2};
  const snapshot=JSON.stringify({...r.player,x:0,y:0});assert.equal(r.zone,'arlong-arena');assert.ok(r.sailToRoger());assert.equal(r.status,'voyage');voyage(r);
  assert.equal(r.zone,'roger-arena');assert.equal(JSON.stringify({...r.player,x:0,y:0}),snapshot);assert.equal(r.visibleChests.length,0);assert.ok(r.finalChallenge);assert.equal(r.sailToRoger(),false);
 }
});
test('Roger recibe daño real ilimitado, crítico/área/secundario; nunca muere ni cuenta otros objetivos',()=>{
 const {f,p}=challenge(),b=f.roger.body;p.stats.critChance=0;
 damageEnemy(p,b,100,0,p,f.world,()=>assert.fail('Roger no muere'),()=>1);
 damageEnemy(p,b,50,0,p,f.world,noop,()=>1,true,true);assert.equal(f.damage,150);assert.equal(b.hp,1);assert.ok(b.active);
 p.stats.critChance=1;damageEnemy(p,b,100,0,p,f.world,noop,()=>0);assert.equal(f.damage,150+100*STAT_LIMITS.critMultiplier);
 const before=f.damage;damageEnemy(p,new MorganEncounter().body,100,0,p,f.world,noop,()=>1);assert.equal(f.damage,before);
 for(let i=0;i<1000;i++)damageEnemy(p,b,1000,0,p,f.world,noop,()=>1,true,true);assert.ok(f.damage>1e6);assert.equal(b.hp,1);
});
test('calendario exacto de tandas y mundos desbloqueados',()=>{
 assert.deepEqual([40,80,120,160,200,240,280,320,360,400,440,480,520].map(summonCount),[1,1,1,2,2,3,3,3,4,4,4,5,5]);
 assert.deepEqual([0,29,30,59,60,90,120,150].map(hordeWorldCount),[1,1,2,2,3,4,5,5]);
 const {f,p}=challenge();f.seconds=39.98;f.tick(.01,p);assert.equal(f.summons.length,0);f.tick(.01,p);assert.equal(f.summons.length,1);assert.equal(f.nextSummon,80);assert.ok(f.summons[0].remaining>1.9);
});
test('cada tanda reserva plazas, no repite tipos y a8min invoca cinco originales',()=>{
 for(const t of [40,160,240,360,480,520]){
  const {f,p}=challenge();f.seconds=t;f.summon(p);assert.equal(f.living,summonCount(t));assert.equal(new Set(f.summons.map(s=>s.boss.profile.id)).size,f.living);
  for(const s of f.summons){assert.ok(f.world.canOccupy(s.boss.body.x,s.boss.body.y,28));assert.ok(Math.hypot(s.boss.body.x-p.x,s.boss.body.y-p.y)>=380);assert.equal(s.boss.body.hp,s.boss.profile.hp*.6);}
  if(t>=480){assert.deepEqual(new Set(f.summons.map(s=>s.boss.profile.id)),new Set(SUMMON_TYPES));assert.ok(f.summons.some(s=>s.boss instanceof MorganEncounter));assert.ok(f.summons.some(s=>s.boss instanceof BuggyEncounter));assert.ok(f.summons.some(s=>s.boss instanceof KuroEncounter));assert.ok(f.summons.some(s=>s.boss instanceof KriegEncounter));assert.ok(f.summons.some(s=>s.boss instanceof ArlongEncounter));}
 }
});
test('límite8, sobrantes descartados, pueden coexistir instancias y reaparecer derrotados',()=>{
 const {f,p}=challenge();f.seconds=480;f.summon(p);f.seconds=520;f.summon(p);assert.equal(f.living,8);assert.equal(new Set(f.summons.map(s=>s.boss.body.id)).size,8);assert.ok(new Set(f.summons.map(s=>s.boss.profile.id)).size<8);
 f.summon(p);assert.equal(f.living,8);const s=f.summons[0];assert.ok(f.defeated(s.boss.body));assert.equal(f.defeated(s.boss.body),false);assert.equal(f.bossesDefeated,1);f.tick(.1,p);assert.ok(s.boss.elapsed>0);f.summon(p);assert.equal(f.living,8);assert.equal(R.bossCap,8);
});
test('materialización dura2s y luego usa el controlador original acelerado con aviso mínimo',()=>{
 const {f,p}=challenge();f.seconds=40;f.summon(p);const s=f.summons[0],old=s.boss.body.x;
 for(let i=0;i<119;i++)f.tick(1/60,p);assert.equal(s.boss.body.x,old);assert.ok(s.remaining>0);
 for(let i=0;i<30;i++)f.tick(1/60,p);assert.ok(s.remaining<=0);assert.ok(s.boss.state!=='approach'||s.boss.body.x!==old);
 s.boss.body.hp=s.boss.body.maxHp*.2;s.boss.prepare(s.boss.attacks[0],p,f.world);f.tick(.01,p);assert.ok((s.boss.telegraph?.attack.preparation??1)>=.35*1.2);
});
test('Roger desbloquea ataques por tiempo y reduce avisos solo desde4min',()=>{
 const {f,p}=challenge(),b=f.roger,seen=new Set<string>();
 for(const time of [0,60,120,180,240]){
  b.seconds=time;
  for(let i=0;i<10;i++){b.prepare(ROGER_ATTACKS[0],p,f.world);seen.add(b.attackId);if(time===0)assert.ok(['king','kamusari'].includes(b.attackId));if(time<240&&b.attackId==='king')assert.equal(b.telegraph!.attack.preparation,1.1);}
 }
 for(const id of ['king','kamusari','haki','storm','will'])assert.ok(seen.has(id));
 b.seconds=240;b.prepare(ROGER_ATTACKS[1],p,f.world);assert.ok(Math.abs(b.telegraph!.attack.preparation-1.2*.7)<1e-6);assert.equal(b.body.hp,1);
});
test('Haki expansivo tiene anillo esquivable; sectores de voluntad dejan pasos seguros',()=>{
 const {f,p}=challenge(),b=f.roger;b.seconds=200;b.prepare(ROGER_ATTACKS[2],p,f.world);
 for(let i=0;i<210;i++)b.tick(.01,p,f.world,()=>axis,noop);assert.ok(b.ring);assert.ok(b.ring.innerRadius>0);assert.ok(b.ring.radius<=450);
 b.prepare(ROGER_ATTACKS[5],p,f.world);const zones=[b.telegraph!.zone,...b.extraWarnings];assert.equal(zones.length,3);assert.ok(zones.every(z=>z.width===180));
});
test('arena fija conserva agua para Arlong y no destruye estructuras compartidas',()=>{
 const {f}=challenge(),w=f.world;assert.equal(w.canOccupy(480,1056,14),false);assert.equal(aquaticWorld(w).canOccupy(480,1056,25),true);assert.equal(w.breakObstacles(),false);assert.equal(w.canOccupy(1500,350,14),false);
});
test('hordas continúan con8bosses, cap configurable y muerte termina el desafío sin retorno',()=>{
 const r=finalRun();r.sailToRoger();voyage(r);r.player.xpNext=1e12;for(const a of r.player.attacks)a.cooldown=1e9;
 const f=r.finalChallenge!;f.seconds=480;f.summon(r.player);f.seconds=520;f.summon(r.player);step(r,4);assert.equal(f.living,8);assert.ok(r.enemies.count>0);assert.ok(r.enemies.count<=R.enemyCap);
 const seconds=f.seconds;r.pause();step(r,1);assert.equal(f.seconds,seconds);r.resume();r.player.hp=0;r.update(1/60,axis);assert.equal(r.status,'defeat');assert.ok(f.stopped);assert.equal(r.voyage,undefined);const result=r.result()!;assert.ok(result.challenge);const end=f.seconds;step(r,1);assert.equal(f.seconds,end);assert.equal(r.projectiles.count,0);
});
test('baja invocada suma1 y recompensa sin combinación, transición ni cambio de flags',()=>{
 const r=finalRun();r.sailToRoger();voyage(r);const f=r.finalChallenge!;f.seconds=480;f.summon(r.player);const b=f.summons[0];b.remaining=0;damageEnemy(r.player,b.boss.body,1e9,0,r.player,r.world,e=>(r as any).dropXp(e,r.player.id),()=>1);assert.equal(f.bossesDefeated,1);assert.equal(r.status,'playing');assert.equal(r.zone,'roger-arena');assert.equal(r.unionTokens,0);assert.equal(r.pickups.count,2);for(const p of r.pickups.items)if(p.active)assert.ok(r.world.canOccupy(p.x,p.y,14));
});
test('récords independientes globales/personaje persisten sin sobrescribir entrenamiento ni valores mayores',()=>{
 const memory=new Map<string,string>(),storage={getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>{memory.set(k,v);}};
 const store=new SaveStore(storage);store.progress.coins=100;const training=store.getTraining('luffy');training.levels.vitality=2;
 const result=(id:string,hero:string,damage:number,seconds:number,bosses:number)=>({id,outcome:'defeat' as const,seconds:10,kills:0,level:30,coins:0,challenge:{characterId:hero,damage,seconds,bosses}});
 store.record(result('a','luffy',123.5,70,2));store.record(result('b','luffy',10,80,1));store.record(result('c','zoro',200,30,4));
 const restored=new SaveStore(storage);assert.equal(restored.progress.coins,100);assert.equal(restored.getTraining('luffy').levels.vitality,2);assert.deepEqual(restored.progress.rogerRecords?.global,{damage:200,seconds:80,bosses:4});assert.deepEqual(restored.progress.rogerRecords?.characters.luffy,{damage:123.5,seconds:80,bosses:2});assert.ok(memory.get(SAVE_KEY));
 assert.equal(restored.record(result('c','zoro',500,100,5)),false);assert.equal(restored.progress.rogerRecords?.global.damage,200);
});
test('Morgan invocado se desplaza20% más rápido que su controlador original, sin tocar el original',()=>{
 const {f,p}=challenge();f.seconds=480;f.nextSummon=520;f.summon(p);const s=f.summons.find(s=>s.boss instanceof MorganEncounter)!;s.remaining=0;Object.assign(s.boss.body,{x:900,y:1216});
 const original=new MorganEncounter();Object.assign(original.body,{x:900,y:1216});
 for(let i=0;i<30;i++){f.tick(1/60,p);original.tick(1/60,p,f.world,()=>({x:1,y:0}),noop);}
 const moved=s.boss.body.x-900,base=original.body.x-900;assert.ok(base>0);assert.ok(Math.abs(moved/base-1.2)<.01,`${moved}/${base}`);
});
test('Voluntad del Rey ejecuta sectores sucesivos sin daño antes del aviso',()=>{
 const {f,p}=challenge(),b=f.roger;b.seconds=200;p.hurtTimer=0;p.hp=1000;Object.assign(b.body,{x:1760,y:1216});b.prepare(ROGER_ATTACKS[5],p,f.world);const before=p.hp;
 b.tick(1,p,f.world,()=>axis,noop);assert.equal(p.hp,before);b.tick(.81,p,f.world,()=>axis,noop);assert.equal(b.extraImpacts.length,1);const first=b.extraImpacts[0].y;b.tick(.26,p,f.world,()=>axis,noop);assert.equal(b.extraImpacts.length,1);assert.notEqual(b.extraImpacts[0].y,first);
});
test('proyectiles invocados conservan alcance original y se limpian solo por propietario',async()=>{
 const {ARLONG_ATTACKS,ARLONG_RULES}=await import('../src/content/bosses/arlong.ts'),{KRIEG_ATTACKS,KRIEG_RULES}=await import('../src/content/bosses/krieg.ts');
 const r=finalRun();r.sailToRoger();voyage(r);const f=r.finalChallenge!;f.seconds=480;f.summon(r.player);r.player.hurtTimer=100;
 for(const [id,attack]of [['arlong',ARLONG_ATTACKS.find(a=>a.id==='water')!],['krieg',KRIEG_ATTACKS.find(a=>a.id==='gun')!]] as const){
  const b=f.summons.find(s=>s.boss.profile.id===id)!.boss;b.prepare(attack,r.player,r.world);for(let i=0;i<200&&b.state==='preparing';i++)b.tick(.01,r.player,r.world,()=>axis,noop);
 }
 const arlong=f.summons.find(s=>s.boss.profile.id==='arlong')!.boss,krieg=f.summons.find(s=>s.boss.profile.id==='krieg')!.boss;
 const water=r.projectiles.items.filter(p=>p.active&&p.ownerId===`boss:${arlong.body.id}`),bullets=r.projectiles.items.filter(p=>p.active&&p.ownerId===`boss:${krieg.body.id}`);
 assert.equal(water.length,5);assert.equal(bullets.length,7);assert.equal(water[0].life,ARLONG_RULES.waterRange/ARLONG_RULES.waterSpeed);assert.equal(bullets[0].life,KRIEG_RULES.bulletRange/KRIEG_RULES.bulletSpeed);
 f.defeated(arlong.body);assert.ok(water.every(p=>!p.active));assert.ok(bullets.every(p=>p.active));
});
test('si el jugador entra en la silueta, se recoloca y vuelve a avisar antes de materializar',()=>{
 const {f,p}=challenge();f.seconds=40;f.nextSummon=80;f.summon(p);const s=f.summons[0];Object.assign(p,{x:s.boss.body.x,y:s.boss.body.y});
 f.tick(2,p);assert.equal(s.remaining,2);assert.ok(Math.hypot(s.boss.body.x-p.x,s.boss.body.y-p.y)>=380);assert.equal(s.boss.state,'approach');assert.equal(f.bodies.length,1);
});
