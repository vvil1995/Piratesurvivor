import test from 'node:test';import assert from 'node:assert/strict';
import { Run } from '../src/game/core/run.ts';import { ProceduralWorld } from '../src/game/world/world.ts';
import { generateArlongChunk,arlongDistrict } from '../src/game/world/arlong.ts';
import { aquaticWorld,landReward } from '../src/game/world/aquatic.ts';
import { ArlongArenaWorld,ARLONG_ARENA } from '../src/game/world/arlong-arena.ts';
import { ArlongEncounter } from '../src/game/bosses/arlong.ts';
import { ARLONG,ARLONG_ATTACKS,ARLONG_RAGE } from '../src/content/bosses/arlong.ts';
import { ARLONG_PARK } from '../src/content/worlds/arlong-park.ts';
import { ENEMIES,CHARACTERS } from '../src/content/catalog.ts';
import { chooseEnemyType,spawnEnemy } from '../src/game/systems/spawner.ts';
import { FlowField } from '../src/game/navigation/flow-field.ts';
import { ChestField } from '../src/game/systems/loot.ts';
import { LOOT } from '../src/content/loot.ts';
import { damageEnemy } from '../src/game/systems/hits.ts';
import { equipItem } from '../src/game/systems/items.ts';
import { improveAttack } from '../src/game/systems/loadout.ts';
import { KRIEG } from '../src/content/bosses/krieg.ts';
const axis={x:0,y:0},noop=()=>{},a=(id:string)=>ARLONG_ATTACKS.find(a=>a.id===id)!;
const step=(r:Run,n:number)=>{for(let i=0;i<Math.ceil(n*60);i++)r.update(1/60,axis);};
function finishVoyage(r:Run){for(let i=0;i<190&&r.status==='voyage';i++)r.update(1/60,axis);}
function arlong(id='luffy',beforeSail?:(r:Run)=>void){
 const r=new Run(id,0,()=>.5,{seed:42});r.morganDefeated=true;r.boardToOrangeTown();r.beginBuggy();r.buggyDefeated=true;r.encounter!.defeated();step(r,1.4);r.finishCombinations();r.sailToSyrup();finishVoyage(r);r.beginKuro();r.kuroDefeated=true;r.encounter!.defeated();step(r,1.4);r.finishCombinations();r.sailToBaratie();finishVoyage(r);r.beginKrieg();r.kriegDefeated=true;r.encounter!.defeated();step(r,1.4);r.finishCombinations();beforeSail?.(r);assert.equal(r.zone,'krieg-arena');assert.ok(r.exitSignal);assert.ok(r.sailToArlong());finishVoyage(r);assert.equal(r.zone,'arlong-park');r.player.hurtTimer=1e6;return r;
}
function tick(b:ArlongEncounter,p:Run['player'],n:number,w:ArlongArenaWorld){for(let i=0;i<Math.ceil(n*100);i++){p.hurtTimer=Math.max(0,p.hurtTimer-.01);b.tick(.01,p,w,from=>{const f=new FlowField(aquaticWorld(w),25,true);f.update(p,1);return f.direction(from,p,25);},noop);}}
function fixture(ratio=1){const w=new ArlongArenaWorld(42),b=new ArlongEncounter({rage:()=>w.breakObstacles()}),p=new Run().player;Object.assign(b.body,ARLONG_ARENA.bossSpawn);Object.assign(p,ARLONG_ARENA.playerSpawn);p.hurtTimer=1e6;b.body.hp=b.body.maxHp*ratio;return {w,b,p};}
function rage(b:ArlongEncounter,p:Run['player'],w:ArlongArenaWorld){b.body.hp=b.body.maxHp*.2;for(let i=0;i<200&&!b.rageTransformed;i++)b.tick(.01,p,w,()=>axis,noop);assert.ok(b.rageTransformed);}
test('Arlong procedural:243chunks conectados, tres regiones y puentes entre canales',()=>{
 const regions=new Set<string>();for(const seed of [3,42,827])for(let cy=-4;cy<=4;cy++)for(let cx=-4;cx<=4;cx++){
  const c=generateArlongChunk(seed,cx,cy);regions.add(arlongDistrict(seed,cx*16+8,cy*16+8));assert.deepEqual(c,generateArlongChunk(seed,cx,cy));
  const seen=new Set([136]),q=[136];for(let n=0;n<q.length;n++){const at=q[n],x=at%16,y=Math.floor(at/16);for(const[dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy,id=xx+yy*16;if(xx>=0&&xx<16&&yy>=0&&yy<16&&!c.solids[id]&&!seen.has(id)){seen.add(id);q.push(id);}}}
  for(let n=0;n<256;n++)if(!c.solids[n])assert.ok(seen.has(n),`${seed}/${cx}/${cy}/${n}`);
  for(let x=6;x<=9;x++)for(let y=0;y<16;y++)assert.equal(c.solids[x+y*16],0);assert.ok(c.obstacles.some(o=>o.kind==='dock'));
 }assert.equal(regions.size,3);
});
test('agua: solo los hombres-pez cruzan canales; muros sólidos y puentes siguen funcionando',()=>{
 for(const seed of [3,42,827]){const w=new ProceduralWorld(seed,'arlong'),swim=aquaticWorld(w);assert.ok(w.isWater(16,400));assert.equal(w.canOccupy(16,400,14),false);assert.equal(swim.canOccupy(16,400,14),true);assert.ok(w.canOccupy(256,400,14));
  const landActor={x:16,y:352},fish={...landActor};w.moveCircle(landActor,0,120,14);swim.moveCircle(fish,0,120,14);assert.ok(landActor.y<384);assert.ok(fish.y>=472);assert.ok(w.canOccupy(landActor.x,landActor.y,14));
 }
 const w=new ArlongArenaWorld(42),s=aquaticWorld(w);assert.equal(s.canOccupy(0,0,25),false);assert.equal(s.canOccupy(1152,1088,25),false);assert.equal(w.canOccupy(480,1000,14),false);assert.equal(s.canOccupy(480,1000,14),true);
});
test('cofres3/24 solo tierra y puentes alcanzables; recompensas acuáticas se acercan a la orilla',()=>{
 assert.equal(LOOT.smallChunkEvery,3);assert.equal(LOOT.largeChunkEvery,24);
 for(const seed of [3,42,827]){const w=new ProceduralWorld(seed,'arlong'),c=new ChestField();let count=0;for(let y=-2;y<=2;y++)for(let x=-2;x<=2;x++){const p={x:x*512+256,y:y*512+256};c.sync(w,p);const f=new FlowField(w);f.update(p,1);for(const chest of c.active){count++;assert.ok(w.canOccupy(chest.x,chest.y,18));assert.equal(w.isWater(chest.x,chest.y),false);assert.ok(f.reachable(chest));}}assert.ok(count>0);assert.ok(w.canOccupy(landReward(w,{x:16,y:400}).x,landReward(w,{x:16,y:400}).y,20));}
});
test('cinco personajes conservan la build completa en Krieg→Arlong y al entrar al boss',()=>{
 const snapshot=(p:Run['player'])=>JSON.stringify([p.hp,p.level,p.xp,p.attacks,p.abilitySlots,p.selectedSlot,p.items,p.learnedBuffs,p.fruit,p.collectedBerries,p.modifiers]);
 for(const id of Object.keys(CHARACTERS)){let before='';const r=arlong(id,r=>{const p=r.player;p.hp=57;p.level=45;p.xp=9;p.collectedBerries=300;equipItem(p,'dagger');p.fruit='bomu';improveAttack(p,r.character.abilities[1]);improveAttack(p,'frenzy');p.abilitySlots=[[p.attacks[0].id,'frenzy'],[p.attacks[1].id],[],[]];p.attacks[0].level=6;p.attacks[0].cooldown=.72;before=snapshot(p);});assert.equal(snapshot(r.player),before);assert.ok(r.beginArlong());assert.equal(snapshot(r.player),before);assert.equal(r.world.theme,'arlong');assert.equal(r.visibleChests.length,0);}
});
test('tipos por minuto y spawn acuático real con movilidad distinta a la del jugador',()=>{
 for(const[time,count]of [[0,1],[60,2],[120,3],[180,3]]){const ids=new Set<string>();for(let i=0;i<100;i++)ids.add(chooseEnemyType(ARLONG_PARK,time,()=>(i+.5)/100));assert.equal(ids.size,count);}
 const r=arlong(),f=new FlowField(aquaticWorld(r.world));f.update(r.player,1);let seed=17;const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
 for(let i=0;i<200;i++)spawnEnemy(r.enemies,[r.player],{centerX:256,centerY:256,width:640,height:400},r.world,f,ARLONG_PARK,random,i,200,aquaticWorld(r.world));assert.ok(r.enemies.count>0&&r.enemies.count<=105);assert.ok(r.enemies.items.some(e=>e.active&&r.world.isWater(e.x,e.y)));for(const e of r.enemies.items)if(e.active){assert.ok(e.swimming);assert.ok(aquaticWorld(r.world).canOccupy(e.x,e.y,e.radius));}
});
test('fúria destruye solo seleccionados, una vez; reconstruye colisiones y navegación',()=>{
 const w=new ArlongArenaWorld(42),swim=aquaticWorld(w),f=new FlowField(w);f.update({x:1536,y:1216},1);const chunk=w.getChunk(2,2),point={x:1152,y:1088};assert.equal(w.canOccupy(point.x,point.y,14),false);assert.equal(swim.canOccupy(point.x,point.y,14),false);assert.ok(w.breakObstacles());assert.equal(w.revision,1);assert.ok(w.canOccupy(point.x,point.y,14));assert.ok(swim.canOccupy(point.x,point.y,14));assert.notEqual(w.getChunk(2,2),chunk);f.update({x:1536,y:1216},.01);assert.ok(f.reachable(point));assert.equal(w.breakObstacles(),false);assert.equal(w.revision,1);assert.equal(w.canOccupy(1536,640,14),false);assert.equal(w.canOccupy(480,1000,14),false);
});
test('Arlong: seis patrones y tercera fase sin aumentar daño ni añadir armadura',()=>{
 assert.equal(ARLONG_ATTACKS.length,6);assert.ok(ARLONG.hp>=KRIEG.hp&&ARLONG.hp<KRIEG.hp*1.15);
 for(const ratio of [1,.5,.2])for(const attack of ARLONG_ATTACKS.filter(a=>a.id!=='dive')){const {w,b,p}=fixture(ratio);if(ratio===.2)rage(b,p,w);b.prepare(attack,p,w);assert.equal(b.phase,ratio===1?1:ratio===.5?2:3);assert.equal(b.telegraph!.attack.preparation,ratio===.2?Math.max(attack.minimumWarning??.35,attack.preparation*.7):attack.preparation);assert.equal(b.telegraph!.attack.damage,attack.damage);assert.equal(b.body.defense,undefined);b.cancel();assert.equal(b.tooth,undefined);assert.equal(b.trails.length,0);}
});
test('mossegada: cone fijado, nada de daño temprano y una sola embestida corta',()=>{
 const {w,b,p}=fixture();Object.assign(b.body,{x:1500,y:1200});Object.assign(p,{x:1630,y:1200,hp:100,hurtTimer:0});b.prepare(a('bite'),p,w);const zone=JSON.stringify(b.telegraph!.zone);tick(b,p,.69,w);assert.equal(p.hp,100);assert.equal(JSON.stringify(b.telegraph!.zone),zone);tick(b,p,.26,w);assert.equal(p.hp,48);assert.ok(b.body.x>1500&&b.body.x<=1640);tick(b,p,.2,w);assert.equal(p.hp,48);
});
test('Kiribachi tres cortes separados; Darts tres pasadas con colisión continua y avisos',()=>{
 for(const[id,count]of [['kiribachi',3],['darts',3]]as const){const {w,b,p}=fixture();rage(b,p,w);b.body.x=1400;b.body.y=1216;p.x=1700;p.y=1216;b.prepare(a(id),p,w);let old=b.state,hits=0;
  for(let i=0;i<2000;i++){b.tick(.01,p,w,()=>axis,noop);if(old==='preparing'&&b.state==='impact')hits++;old=b.state;assert.ok(aquaticWorld(w).canOccupy(b.body.x,b.body.y,b.body.radius));if(b.state==='approach')break;}assert.equal(hits,count);b.defeated();assert.equal(b.telegraph,undefined);assert.equal(b.trails.length,0);
 }
});
test('dentadura: ida y vuelta fijas, un impacto por tramo y limpieza',()=>{
 const {w,b,p}=fixture();b.body.hp=b.body.maxHp*.5;Object.assign(b.body,{x:1200,y:1216});Object.assign(p,{x:1500,y:1216,hp:1000,hurtTimer:0});b.prepare(a('tooth'),p,w);tick(b,p,1.19,w);assert.equal(p.hp,1000);tick(b,p,1.3,w);assert.equal(p.hp,956);tick(b,p,1.7,w);assert.equal(p.hp,912);tick(b,p,.7,w);assert.equal(b.tooth,undefined);tick(b,p,.4,w);assert.equal(p.hp,912);b.cancel();assert.equal(b.tooth,undefined);
});
test('inmersión: entra en piscina, recibe daño, avisa antes de salir y vuelve a tierra',()=>{
 for(const point of [{x:1536,y:1216},{x:1000,y:1800},{x:2150,y:500}]){const {w,b,p}=fixture(.5);Object.assign(p,point);b.prepare(a('dive'),p,w);let submerged=false,warning=false;
  for(let i=0;i<2400;i++){b.tick(.01,p,w,()=>axis,noop);if(b.submerged){submerged=true;assert.ok(w.isWater(b.body.x,b.body.y));const hp=b.body.hp;damageEnemy(p,b.body,1,0,p,w,noop,()=>1);assert.ok(b.body.hp<hp);}if(b.telegraph){warning=true;assert.ok(Math.hypot(p.x-b.body.x,p.y-b.body.y)>20);}assert.ok(aquaticWorld(w).canOccupy(b.body.x,b.body.y,25));if(submerged&&warning&&b.state==='recovering'&&!b.divingStage)break;}
  assert.ok(submerged);assert.ok(warning);assert.ok(w.canOccupy(b.body.x,b.body.y,25));assert.equal(p.hp,100);
 }
});
test('victoria da unión y Log Pose voluntario de Roger; derrota vuelve con25HP al mismo mundo',()=>{
 const r=arlong(),world=r.world,field=r.explorationChests;improveAttack(r.player,'gatling');r.beginArlong();r.player.hp=0;r.update(1/60,axis);assert.equal(r.voyage?.destination,'arlong-return');finishVoyage(r);assert.equal(r.player.hp,25);assert.equal(r.world,world);assert.equal(r.explorationChests,field);
 r.beginArlong();const b=r.encounter as ArlongEncounter;b.body.hp=1;damageEnemy(r.player,b.body,100,0,r.player,r.world,e=>(r as any).dropXp(e,r.player.id),()=>1);step(r,1.4);assert.ok(r.arlongDefeated);assert.equal(r.status,'combining');const n=r.unionTokens;assert.ok(r.joinPair(0,1));assert.equal(r.unionTokens,n-1);assert.equal(r.status,'playing');assert.ok(r.exitSignal);assert.ok(r.rogerUnlocked);assert.equal(r.sailToRoger(),true);assert.equal(r.voyage?.destination,'roger');assert.equal(r.zone,'arlong-arena');assert.equal(b.tooth,undefined);
});
test('IA real de los tres hombres-pez: cruzan agua, escupen desde el canal y golpean',()=>{
 for(const id of ['fishman-fighter','fishman-spitter','fishman-karate']){
  const r=arlong(),p=r.player,d=ENEMIES[id];r.enemies.clear();Object.assign(r,{spawnTimer:1e9});Object.assign(p,{x:16,y:480,hurtTimer:0});for(const a of p.attacks)a.cooldown=1e6;
  const e=r.enemies.acquire()!;Object.assign(e,d,{id:996,active:true,x:16,y:d.ranged?400:330,maxHp:d.hp,flash:0,meleeTimer:0,meleeWindup:0,meleeHits:0,shotTimer:0,shotWindup:0,shotRecovery:0});let water=false,projectile=false;
  for(let i=0;i<180;i++){r.update(1/60,axis);water ||= r.world.isWater(e.x,e.y);projectile ||= r.projectiles.items.some(b=>b.active&&b.visual==='water');assert.ok(aquaticWorld(r.world).canOccupy(e.x,e.y,e.radius),`${id}/${i}/${e.x}/${e.y}`);assert.ok(r.world.canOccupy(p.x,p.y,14));}
  assert.ok(water,id);assert.ok(p.hp<100,id);if(d.ranged)assert.ok(projectile);
 }
});
test('Darts barre la trayectoria a alta velocidad sin atravesar paredes ni duplicar impacto',()=>{
 const {w,b,p}=fixture();rage(b,p,w);Object.assign(b.body,{x:1400,y:1216});Object.assign(p,{x:1600,y:1216,hp:100,hurtTimer:0});b.prepare(a('darts'),p,w);tick(b,p,.83,w);assert.equal(p.hp,100);tick(b,p,.02,w);b.tick(.4,p,w,()=>axis,noop);assert.equal(p.hp,46);assert.ok(b.body.x>=1800);assert.ok(aquaticWorld(w).canOccupy(b.body.x,b.body.y,25));b.tick(.2,p,w,()=>axis,noop);assert.equal(p.hp,46);
});
test('fúria se aplica una sola vez al cruzar33%, sin daño durante la transformación',()=>{
 const {w,b,p}=fixture(.5);p.hurtTimer=0;b.prepare(a('bite'),p,w);b.tick(.1,p,w,()=>axis,noop);b.body.hp=b.body.maxHp*.33;b.tick(.01,p,w,()=>axis,noop);assert.equal(b.telegraph!.attack.id,ARLONG_RAGE.id);assert.equal(p.hp,100);tick(b,p,1.1,w);assert.equal(w.revision,1);assert.ok(w.transformed);b.body.hp=b.body.maxHp*.5;tick(b,p,.1,w);b.body.hp=b.body.maxHp*.1;tick(b,p,.1,w);assert.equal(w.revision,1);
});
test('scheduler natural de Arlong usa seis ataques y todas las fases con piscinas y furia',()=>{
 const r=arlong();r.beginArlong();const b=r.encounter as ArlongEncounter,seen=new Set<string>();for(const a of r.player.attacks)a.cooldown=1e6;let submerged=false;
 for(const ratio of [1,.5,.2]){b.body.hp=b.body.maxHp*ratio;for(let i=0;i<3600;i++){r.update(1/60,axis);if(b.telegraph)seen.add(b.telegraph.attack.id);submerged ||= b.submerged;assert.ok(aquaticWorld(r.world).canOccupy(b.body.x,b.body.y,25));}}
 assert.deepEqual([...seen].filter(id=>id!=='rage').sort(),ARLONG_ATTACKS.map(a=>a.id).sort());assert.ok(submerged);assert.equal(r.world.revision,1);
});
test('bajas acuáticas conservan recompensas y dejan pickups en tierra',()=>{
 const r=arlong(),d=ENEMIES['fishman-fighter'],e=r.enemies.acquire()!;Object.assign(e,d,{id:997,active:true,x:16,y:400,maxHp:d.hp,flash:0,hp:1});damageEnemy(r.player,e,200,0,r.player,r.world,enemy=>(r as any).dropXp(enemy,r.player.id),()=>1);
 assert.ok(r.pickups.count>0);for(const pickup of r.pickups.items)if(pickup.active)assert.ok(r.world.canOccupy(pickup.x,pickup.y,2));
});
