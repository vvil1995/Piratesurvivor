import test from 'node:test';import assert from 'node:assert/strict';
import { Run } from '../src/game/core/run.ts';
import { ProceduralWorld } from '../src/game/world/world.ts';
import { generateBaratieChunk,deckAt } from '../src/game/world/baratie.ts';
import { FlowField } from '../src/game/navigation/flow-field.ts';
import { BARATIE } from '../src/content/worlds/baratie.ts';
import { CHARACTERS,ENEMIES } from '../src/content/catalog.ts';
import { chooseEnemyType,spawnEnemy } from '../src/game/systems/spawner.ts';
import { KriegEncounter,gasZone } from '../src/game/bosses/krieg.ts';
import { KRIEG,KRIEG_ATTACKS,KRIEG_RULES as R } from '../src/content/bosses/krieg.ts';
import { KURO } from '../src/content/bosses/kuro.ts';
import { ArenaWorld,KRIEG_ARENA } from '../src/game/world/arena.ts';
import { damageEnemy } from '../src/game/systems/hits.ts';
import { improveAttack } from '../src/game/systems/loadout.ts';
import { equipItem } from '../src/game/systems/items.ts';
import { ChestField } from '../src/game/systems/loot.ts';
import { LOOT } from '../src/content/loot.ts';
import { inDanger } from '../src/game/bosses/telegraphs.ts';
const axis={x:0,y:0},noop=()=>{},a=(id:string)=>KRIEG_ATTACKS.find(a=>a.id===id)!;
const step=(r:Run,seconds:number)=>{for(let i=0;i<Math.ceil(seconds*60);i++)r.update(1/60,axis);};
function baratie(id='luffy',seed=42,beforeSail?:(r:Run)=>void){
 const r=new Run(id,0,()=>.5,{seed});r.morganDefeated=true;r.boardToOrangeTown();r.beginBuggy();r.buggyDefeated=true;r.encounter!.defeated();step(r,1.4);r.sailToSyrup();step(r,3.1);r.beginKuro();r.kuroDefeated=true;r.encounter!.defeated();step(r,1.4);r.finishCombinations();assert.equal(r.zone,'kuro-arena');beforeSail?.(r);assert.ok(r.sailToBaratie());for(let i=0;i<190&&r.status==='voyage';i++)r.update(1/60,axis);assert.equal(r.zone,'baratie');r.player.hurtTimer=1e6;return r;
}
function tick(b:KriegEncounter,p:Run['player'],seconds:number,w=new ArenaWorld(42,KRIEG_ARENA,'baratie')){for(let t=0;t<seconds-1e-8;t+=.01){p.hurtTimer=Math.max(0,p.hurtTimer-.01);b.tick(Math.min(.01,seconds-t),p,w,()=>axis,noop);}}
test('flota: determinismo, puentes compartidos y todos los claros conectados en243chunks',()=>{
 for(const seed of [3,42,987])for(let cy=-4;cy<=4;cy++)for(let cx=-4;cx<=4;cx++){
  const c=generateBaratieChunk(seed,cx,cy);assert.deepEqual(c,generateBaratieChunk(seed,cx,cy));
  const first=c.solids.findIndex(v=>!v),seen=new Set([first]),q=[first];
  for(let n=0;n<q.length;n++){const at=q[n],x=at%16,y=Math.floor(at/16);for(const[dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy,id=xx+yy*16;if(xx>=0&&xx<16&&yy>=0&&yy<16&&!c.solids[id]&&!seen.has(id)){seen.add(id);q.push(id);}}}
  for(let n=0;n<256;n++)if(!c.solids[n])assert.ok(seen.has(n),`${seed}/${cx}/${cy}/${n}`);
  let links=0;for(let t=0;t<16;t++){assert.equal(deckAt(seed,cx*16+15,cy*16+t),deckAt(seed,(cx+1)*16,cy*16+t));assert.equal(deckAt(seed,cx*16+t,cy*16+15),deckAt(seed,cx*16+t,(cy+1)*16));if(deckAt(seed,cx*16+15,cy*16+t))links++;}assert.ok(links>=4);
 }
});
test('navegación: ocho semillas, enemigos rodean mar y cruzan pasarelas sin caminar sobre agua',()=>{
 for(const seed of [1,2,3,4,42,81,827,934]){const w=new ProceduralWorld(seed,'baratie'),p={x:768,y:400},e={x:256,y:400},f=new FlowField(w,16,true);f.update(p,1);assert.ok(f.reachable(e));assert.equal(w.segmentClear(e.x,e.y,p.x,p.y,16),false);
  for(let i=0;i<1400;i++){const d=f.direction(e,p,16);w.moveCircle(e,d.x*3,d.y*3,16);assert.ok(w.canOccupy(e.x,e.y,16));}assert.ok(Math.hypot(p.x-e.x,p.y-e.y)<35,`${seed}:${JSON.stringify(e)}`);
 }
 const w=new ProceduralWorld(42,'baratie');assert.equal(w.canOccupy(16,16,10),false);assert.equal(w.canOccupy(16,16,10,'attack'),true);
 const p={x:256,y:256};w.moveCircle(p,-500,-500,14);assert.ok(w.canOccupy(p.x,p.y,14));
});
test('Baratie: tipos por minuto, cap moderado y generación real sin acumular enemigos',()=>{
 assert.ok(BARATIE.enemyCap<=110);assert.ok(ENEMIES['krieg-armored'].hp>ENEMIES['krieg-saber'].hp);
 for(const [time,count]of [[0,1],[60,2],[120,3],[180,3]]){const ids=new Set<string>();for(let i=0;i<100;i++)ids.add(chooseEnemyType(BARATIE,time,()=>(i+.5)/100));assert.equal(ids.size,count);}
 const r=baratie(),f=new FlowField(r.world);f.update(r.player,1);let seed=41;const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
 for(let i=0;i<200;i++)spawnEnemy(r.enemies,[r.player],{centerX:256,centerY:256,width:600,height:400},r.world,f,BARATIE,random,i,190);
 assert.ok(r.enemies.count>0&&r.enemies.count<=BARATIE.enemyCap);assert.ok(r.enemies.items.some(e=>e.active&&e.defense));for(const e of r.enemies.items)if(e.active){assert.ok(r.world.canOccupy(e.x,e.y,e.radius));assert.ok(f.reachable(e));}
});
test('cofres:3/24, solo cubiertas accesibles y registro conservado al descargar chunks',()=>{
 assert.equal(LOOT.smallChunkEvery,3);assert.equal(LOOT.largeChunkEvery,24);
 for(const seed of [3,42,827]){const w=new ProceduralWorld(seed,'baratie'),chests=new ChestField();let total=0;
  for(let y=-3;y<=3;y++)for(let x=-3;x<=3;x++){chests.sync(w,{x:x*512+256,y:y*512+256});for(const c of chests.active){total++;assert.ok(w.canOccupy(c.x,c.y,18));const f=new FlowField(w);f.update({x:x*512+256,y:y*512+256},1);assert.ok(f.reachable(c));}}
  assert.ok(total>0);chests.sync(w,{x:256,y:256});const c=chests.active[0];if(c){c.active=false;chests.sync(w,{x:4096,y:4096});w.prune([{x:4096,y:4096}]);chests.sync(w,{x:256,y:256});assert.equal(c.active,false);}
 }
});
test('cinco personajes: viaje voluntario Kuro→Baratie conserva todos los datos de build',()=>{
 const state=(p:Run['player'])=>JSON.stringify([p.hp,p.level,p.xp,p.attacks,p.abilitySlots,p.items,p.fruit,p.learnedBuffs,p.collectedBerries,p.modifiers,p.selectedSlot]);
 for(const id of Object.keys(CHARACTERS)){let snapshot='';
  const r=baratie(id,42,r=>{const p=r.player;p.level=42;p.xp=9;p.hp=57;p.collectedBerries=123;equipItem(p,'dagger');p.fruit='bomu';improveAttack(p,r.character.abilities[1]);improveAttack(p,'frenzy');p.attacks[0].level=6;p.attacks[0].cooldown=.73;p.attacks[2].activeFor=2;p.abilitySlots=[[p.attacks[0].id,'frenzy'],[p.attacks[1].id],[],[]];snapshot=state(p);});
  assert.equal(state(r.player),snapshot);assert.ok(r.beginKrieg());assert.equal(state(r.player),snapshot);assert.equal(r.world.theme,'baratie');assert.equal(r.visibleChests.length,0);
 }
});
test('Krieg: seis patrones, tres fases y avisos70% con MH5 mínimo1,2s',()=>{
 assert.equal(KRIEG.hp,KURO.hp*1.35);const w=new ArenaWorld(42,KRIEG_ARENA,'baratie');
 for(const ratio of [1,.5,.2])for(const attack of KRIEG_ATTACKS){const b=new KriegEncounter(),p=new Run().player;Object.assign(b.body,KRIEG_ARENA.bossSpawn);Object.assign(p,KRIEG_ARENA.playerSpawn);b.body.hp=b.body.maxHp*ratio;b.prepare(attack,p,w);
  assert.equal(b.phase,ratio===1?1:ratio===.5?2:3);assert.equal(b.telegraph!.attack.preparation,ratio===.2?Math.max(attack.minimumWarning??.35,attack.preparation*.7):attack.preparation);tick(b,p,b.telegraph!.attack.preparation-.05,w);assert.equal(p.hp,100);assert.equal(b.state,'preparing');b.cancel();assert.equal(b.hazards.length,0);
 }
});
test('armadura independiente y escudo frontal temporal: laterales útiles y reducción combinada<=70%',()=>{
 const r=baratie(),w=r.world,p=r.player,b=new KriegEncounter();b.body.x=256;b.body.y=256;const d=b.body.defense!;d.angle=0;p.x=356;p.y=256;
 damageEnemy(p,b.body,100,0,p,w,noop,()=>1);assert.equal(b.body.hp,KRIEG.hp-75);assert.equal(d.armor!.remaining,R.armor-100);assert.equal(b.armorStage,'intact');
 d.frontal=.6;let hp=b.body.hp;damageEnemy(p,b.body,100,0,p,w,noop,()=>1);assert.equal(b.body.hp,hp-30);
 p.x=156;hp=b.body.hp;damageEnemy(p,b.body,100,0,p,w,noop,()=>1);assert.equal(b.body.hp,hp-75);
 d.armor!.remaining=1;damageEnemy(p,b.body,100,0,p,w,noop,()=>1);assert.equal(b.armorStage,'broken');d.frontal=0;hp=b.body.hp;damageEnemy(p,b.body,100,0,p,w,noop,()=>1);assert.equal(b.body.hp,hp-100);
 const shield=new KriegEncounter(),arena=new ArenaWorld(42,KRIEG_ARENA,'baratie');Object.assign(shield.body,KRIEG_ARENA.bossSpawn);Object.assign(p,KRIEG_ARENA.playerSpawn);p.hurtTimer=100;shield.prepare(a('shield'),p,arena);tick(shield,p,.7,arena);assert.equal(shield.body.defense!.frontal,.6);tick(shield,p,2.99,arena);assert.equal(shield.body.defense!.frontal,.6);tick(shield,p,.03,arena);assert.equal(shield.body.defense!.frontal,0);
});
test('gas: ticks espaciados, crecimiento visible, zonas seguras y limpieza al morir',()=>{
 const b=new KriegEncounter(),p=new Run().player,w=new ArenaWorld(42,KRIEG_ARENA,'baratie');Object.assign(b.body,KRIEG_ARENA.bossSpawn);Object.assign(p,{x:1536,y:1250});p.hp=1000;b.body.hp=b.body.maxHp*.2;b.prepare(a('mh5'),p,w);const zones=[b.telegraph!.zone,...b.extraWarnings];assert.equal(zones.length,3);const safe={x:1536,y:1450};assert.ok(w.canOccupy(safe.x,safe.y,14));assert.ok(zones.every(z=>!inDanger(z,safe)));
 tick(b,p,b.telegraph!.attack.preparation,w);assert.equal(p.hp,1000);assert.ok(gasZone(b.hazards[0]).width<b.hazards[0].zone.width);tick(b,p,.7,w);assert.equal(p.hp,1000);tick(b,p,.11,w);assert.equal(p.hp,982);tick(b,p,.2,w);assert.equal(p.hp,982);
 Object.assign(p,safe);tick(b,p,5,w);assert.equal(p.hp,982);assert.equal(b.hazards.length,0);b.defeated();assert.equal(b.telegraph,undefined);assert.equal(b.hazards.length,0);
});
test('gun: siete proyectiles fijos; bombardeo5–7 sin daño previo y lanza sin impacto duplicado',()=>{
 const r=baratie();r.beginKrieg();const b=r.encounter as KriegEncounter,p=r.player;p.hurtTimer=0;Object.assign(p,{x:1536,y:1400});b.prepare(a('gun'),p,r.world);tick(b,p,1.2,r.world);assert.equal(r.projectiles.count,7);assert.ok(new Set(r.projectiles.items.filter(e=>e.active).map(e=>e.vx)).size>=4);
 b.cancel();assert.equal(r.projectiles.count,0);
 for(const ratio of [1,.2]){b.body.hp=b.body.maxHp*ratio;b.prepare(a('naval'),p,r.world);assert.equal(1+b.extraWarnings.length,ratio===1?5:7);b.cancel();}
 b.body.hp=b.body.maxHp;Object.assign(b.body,{x:1500,y:1200});Object.assign(p,{x:1700,y:1200,hp:100,hurtTimer:0});b.prepare(a('spear'),p,r.world);tick(b,p,.8,r.world);assert.equal(p.hp,55);tick(b,p,.2,r.world);assert.equal(p.hp,55);
});
test('victoria, unión y Arlong pendiente; perder regresa al mismo Baratie con25HP',()=>{
 const r=baratie(),world=r.world,field=r.explorationChests;improveAttack(r.player,'gatling');r.beginKrieg();r.player.hp=0;step(r,.02);assert.equal(r.voyage?.destination,'baratie-return');for(let i=0;i<190&&r.status==='voyage';i++)r.update(1/60,axis);assert.equal(r.player.hp,25);assert.equal(r.world,world);assert.equal(r.explorationChests,field);
 r.beginKrieg();const b=r.encounter as KriegEncounter;b.body.hp=1;damageEnemy(r.player,b.body,100,0,r.player,r.world,e=>r.dropXp(e,r.player.id),()=>1);step(r,.02);step(r,1.4);assert.ok(r.kriegDefeated);assert.equal(r.status,'combining');const n=r.unionTokens;assert.ok(r.joinPair(0,1));assert.equal(r.unionTokens,n-1);assert.equal(r.status,'playing');assert.ok(r.exitSignal);assert.ok(r.arlongUnlocked);assert.equal(r.sailToArlong(),false);assert.equal(r.voyage,undefined);assert.equal(r.zone,'krieg-arena');
});
test('tres enemigos ejecutan su IA real: corte, ráfaga recargada y golpe blindado',()=>{
 for(const id of ['krieg-saber','krieg-gunner','krieg-armored']){
  const r=baratie(),p=r.player,d=ENEMIES[id],e=r.enemies.acquire()!;p.hurtTimer=0;for(const a of p.attacks)a.cooldown=1e6;
  Object.assign(e,d,{id:991,active:true,x:p.x+(d.ranged?200:40),y:p.y,maxHp:d.hp,flash:0,meleeTimer:0,meleeWindup:0,meleeHits:0,shotTimer:0,shotWindup:0,shotRecovery:0,defense:d.frontalReduction?{angle:Math.PI,arc:Math.PI*.8,frontal:d.frontalReduction}:undefined});
  step(r,d.ranged?1:.3);if(d.ranged){assert.equal(r.projectiles.count,3);assert.ok(e.shotTimer!>0);step(r,1.3);}else{assert.equal(p.hp,100);assert.ok(e.meleeWindup!>0);step(r,1);}
  assert.ok(p.hp<100,id);
  if(d.frontalReduction){const hp=e.hp;damageEnemy(p,e,40,0,p,r.world,noop,()=>1);assert.ok(Math.abs(e.hp-(hp-30))<1e-7);}
 }
});
test('ruta de Krieg empieza a05:00 en Baratie; perder conserva el progreso y permite reintentar',()=>{
 const r=baratie();assert.equal(r.kriegRoute.signal,undefined);Object.assign(r,{zoneTime:299});r.update(1/60,axis);assert.equal(r.kriegRoute.signal,undefined);
 Object.assign(r,{zoneTime:300});r.update(1/60,axis);Object.assign(r,{zoneTime:346});r.update(1/60,axis);assert.ok(r.kriegRoute.signal);assert.ok(r.world.canOccupy(r.kriegRoute.signal!.x,r.kriegRoute.signal!.y,24));Object.assign(r.player,r.kriegRoute.signal);r.update(1/60,axis);assert.equal(r.voyage?.destination,'krieg');step(r,3.1);assert.equal(r.zone,'krieg-arena');
});
test('MH5: cada posición de prueba tiene una salida navegable dentro del margen de reacción',()=>{
 const w=new ArenaWorld(42,KRIEG_ARENA,'baratie');let positions=0;
 for(let ty=8;ty<64;ty+=7)for(let tx=8;tx<88;tx+=9){const p=new Run().player;Object.assign(p,{x:tx*32+16,y:ty*32+16});if(!w.canOccupy(p.x,p.y,14))continue;
  const b=new KriegEncounter();Object.assign(b.body,KRIEG_ARENA.bossSpawn);b.body.hp=b.body.maxHp*.2;b.prepare(a('mh5'),p,w);const zones=[b.telegraph!.zone,...b.extraWarnings],seen=new Set<string>(),queue=[{x:tx,y:ty,d:0}];let safe=false;
  for(let n=0;n<queue.length;n++){const q=queue[n],point={x:q.x*32+16,y:q.y*32+16},key=`${q.x},${q.y}`;if(seen.has(key)||!w.canOccupy(point.x,point.y,14))continue;seen.add(key);if(zones.every(z=>!inDanger(z,point))){safe=true;break;}if(q.d>=8)continue;for(const[dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]])queue.push({x:q.x+dx,y:q.y+dy,d:q.d+1});}
  assert.ok(safe,`${tx},${ty}`);positions++;
 }assert.ok(positions>=60);
});
test('navegación real con steering espaciado: tres tipos alcanzan la cubierta vecina',()=>{
 for(const dt of [1/60,1/30])for(const seed of [1,2,3,4,42,81,827,934])for(const id of ['krieg-saber','krieg-gunner','krieg-armored']){
  const r=baratie('luffy',seed),p=r.player,d=ENEMIES[id];r.enemies.clear();Object.assign(r,{spawnTimer:1e9});Object.assign(p,{x:768,y:400,hurtTimer:1e6});for(const a of p.attacks)a.cooldown=1e6;
  const e=r.enemies.acquire()!;Object.assign(e,d,{speed:d.speed*1.15,id:990,active:true,x:256,y:400,maxHp:d.hp,flash:0,steeringTime:0,meleeTimer:0,meleeHits:0,meleeWindup:0,shotTimer:100});
  for(let i=0;i<2400&&Math.hypot(p.x-e.x,p.y-e.y)>100;i++){r.update(dt,axis);assert.ok(r.world.canOccupy(e.x,e.y,e.radius));}
  // El artillero puede detenerse a distancia de tiro, pero debe cruzar al otro lado del agua.
  if(d.ranged)assert.ok(e.x>512,`${seed}/${id}/${e.x}/${e.y}`);else assert.ok(Math.hypot(p.x-e.x,p.y-e.y)<100,`${seed}/${id}/${e.x}/${e.y}`);
 }
});
test('Krieg: scheduler real ejecuta los seis ataques y limpia pools al derrotarlo',()=>{
 const r=baratie();r.beginKrieg();const b=r.encounter as KriegEncounter,seen=new Set<string>();for(const a of r.player.attacks)a.cooldown=1e6;
 for(const ratio of [1,.5,.2]){b.body.hp=b.body.maxHp*ratio;for(let i=0;i<4000;i++){r.update(1/60,axis);if(b.telegraph)seen.add(b.telegraph.attack.id);assert.ok(r.world.canOccupy(b.body.x,b.body.y,b.body.radius));assert.ok(b.hazards.length<=R.hazardCap);}}
 assert.deepEqual([...seen].sort(),KRIEG_ATTACKS.map(a=>a.id).sort());b.body.hp=1;damageEnemy(r.player,b.body,100,0,r.player,r.world,e=>r.dropXp(e,r.player.id),()=>1);assert.equal(r.projectiles.count,0);assert.equal(b.hazards.length,0);assert.equal(b.telegraph,undefined);
});
test('MH5 termina con recuperación de1,5s completos sin escalar y sin gas residual',()=>{
 const b=new KriegEncounter(),p=new Run().player,w=new ArenaWorld(42,KRIEG_ARENA,'baratie');Object.assign(b.body,KRIEG_ARENA.bossSpawn);Object.assign(p,KRIEG_ARENA.playerSpawn);p.hurtTimer=100;b.body.hp=b.body.maxHp*.2;b.prepare(a('mh5'),p,w);
 tick(b,p,b.telegraph!.attack.preparation,w);tick(b,p,5.01,w);assert.equal(b.state,'recovering');assert.equal(b.hazards.length,0);assert.ok(b.elapsed<.02);tick(b,p,1.48,w);assert.equal(b.state,'recovering');tick(b,p,.04,w);assert.notEqual(b.state,'recovering');
});
test('cuirassado fija la guardia durante la preparación y puede recibir un golpe por detrás',()=>{
 const r=baratie(),p=r.player,d=ENEMIES['krieg-armored'];for(const a of p.attacks)a.cooldown=1e6;Object.assign(r,{spawnTimer:1e9});const e=r.enemies.acquire()!;
 Object.assign(e,d,{id:995,active:true,x:p.x+40,y:p.y,maxHp:d.hp,flash:0,meleeTimer:0,meleeWindup:0,meleeHits:0,defense:{angle:Math.PI,arc:Math.PI*.8,frontal:.25}});step(r,.3);const angle=e.defense!.angle;p.x=e.x+40;step(r,.1);assert.equal(e.defense!.angle,angle);const hp=e.hp;damageEnemy(p,e,40,0,p,r.world,noop,()=>1);assert.equal(e.hp,hp-40);
});
