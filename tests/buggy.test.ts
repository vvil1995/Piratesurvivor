import test from 'node:test';
import assert from 'node:assert/strict';
import { BuggyEncounter } from '../src/game/bosses/buggy.ts';
import { BUGGY_ATTACKS } from '../src/content/bosses/buggy.ts';
import { Run } from '../src/game/core/run.ts';
import { ArenaWorld, BUGGY_ARENA } from '../src/game/world/arena.ts';
import type { CollisionWorld } from '../src/game/world/world.ts';
import { improveAttack } from '../src/game/systems/loadout.ts';
import { equipItem } from '../src/game/systems/items.ts';
import { SaveStore } from '../src/platform/persistence/save.ts';
const axis = { x: 0, y: 0 }, noop = () => {};
const clear: CollisionWorld = { canOccupy: () => true, segmentClear: () => true, moveCircle: (p, x, y) => { p.x += x; p.y += y; } };
const attack = (id: string) => BUGGY_ATTACKS.find(a => a.id === id)!;
function tick(b: BuggyEncounter, p: Run['player'], seconds: number, world = clear): void {
  for (let i = 0; i < Math.ceil(seconds * 60); i++) { p.hurtTimer = Math.max(0, p.hurtTimer - 1 / 60); b.tick(1 / 60, p, world, () => axis, noop); }
}
function orange(): Run { const r = new Run('luffy', 0, () => 0.5); r.morganDefeated = true; r.boardToOrangeTown(); r.player.hurtTimer = 1e6; return r; }
function finish(r: Run): void { for (let i = 0; i < 181 && r.status === 'voyage'; i++) r.update(1 / 60, axis); }
const build = (r: Run) => JSON.stringify({ level: r.player.level, xp: r.player.xp, items: r.player.items, fruit: r.player.fruit, berries: r.player.collectedBerries, slots: r.player.abilitySlots, attacks: r.player.attacks.map(a => [a.id, a.level, a.cooldown, a.activeFor]) });
test('bomba fija destino, avisa sin daño y permite esquivar; cobertura impide explosión', () => {
  const b=new BuggyEncounter(),p=new Run().player;p.x=1408;p.y=1152;
  b.prepare(attack('bomb'),p,clear);const z={...b.telegraph!.zone},hp=p.hp;
  tick(b,p,1.5);assert.equal(p.hp,hp);p.x+=100;tick(b,p,.2);assert.equal(p.hp,hp);assert.deepEqual(b.hazards[0].zone,z);
  const other=new BuggyEncounter();other.prepare(attack('bomb'),p,clear);tick(other,p,1.7);assert.equal(p.hp,hp-45);
  p.hurtTimer=0;const covered=new BuggyEncounter();covered.prepare(attack('bomb'),p,clear);tick(covered,p,1.7,{...clear,segmentClear:()=>false});assert.equal(p.hp,hp-45);
});
test('abanico 5/7/9 y círculo con huecos: proyectiles reales, aviso fijado y sin daño instantáneo',()=>{
 for(const [ratio,count]of [[1,5],[.5,7],[.2,9]]){
  const b=new BuggyEncounter(),p=new Run().player;b.body.x=1000;b.body.y=1000;p.x=1300;p.y=1000;b.body.hp=b.body.maxHp*ratio;
  b.prepare(attack('knives'),p,clear);const zones=[b.telegraph!.zone,...b.extraWarnings];assert.equal(zones.length,count);const angle=zones[Math.floor(count/2)].angle;
  tick(b,p,b.telegraph!.attack.preparation-.05);assert.equal(p.hp,100);tick(b,p,.06);assert.equal(p.hp,100);assert.equal(b.knives.length,count);assert.equal(b.knives[Math.floor(count/2)].angle,angle);
  p.y+=100;tick(b,p,.8);assert.equal(p.hp,100);b.cancel();assert.equal(b.knives.length,0);
 }
 const b=new BuggyEncounter(),p=new Run().player;p.x=b.body.x+200;p.y=b.body.y;b.prepare(attack('ring'),p,clear);assert.equal(b.extraWarnings.length+1,12);
 const angles=[b.telegraph!.zone,...b.extraWarnings].map(z=>z.angle);assert.ok(Math.abs(angles[0]-b.angle)>0);tick(b,p,1.4);assert.equal(b.knives.length,12);
});
test('Bara Bara tiene tres partes independientes, cuerpo expuesto y retorno sin teletransporte',()=>{
 const b=new BuggyEncounter(),p=new Run().player;b.body.x=1000;b.body.y=1000;p.x=1200;p.y=1000;
 b.prepare(attack('split'),p,clear);assert.equal(b.parts.length,3);const from={x:b.body.x,y:b.body.y},hand={...b.parts[1]};
 tick(b,p,1.2);assert.equal(p.hp,100);assert.equal(b.parts[1].x,hand.x);tick(b,p,.4);
 assert.deepEqual({x:b.body.x,y:b.body.y},from);assert.ok(b.parts[1].x>hand.x);assert.ok(b.body.statuses!.exposed!>0);
 tick(b,p,3.5);assert.equal(b.parts.length,0);assert.ok(b.state==='recovering'||b.state==='approach');
});
test('carga solo mueve la cabeza en dirección fijada, colisión con pared aturde y cancela peligros',()=>{
 const r=orange();r.beginBuggy();const b=r.encounter as BuggyEncounter,p=r.player;const world=r.world;
 b.body.x=600;b.body.y=600;p.x=100;p.y=600;b.body.hp=b.body.maxHp*.5;
 b.prepare(attack('charge'),p,world);const angle=b.telegraph!.zone.angle,from={x:b.body.x,y:b.body.y};p.y+=200;
 tick(b,p,2.8,world);assert.equal(b.state,'stunned');assert.deepEqual({x:b.body.x,y:b.body.y},from);assert.ok(b.body.statuses!.exposed!>0);assert.ok(angle>3);
 b.defeated();assert.equal(b.parts.length,0);assert.equal(b.hazards.length,0);assert.equal(b.telegraph,undefined);
});
test('pluja de ganivets deja huecos, no daña antes del aviso y cada zona explota una sola vez',()=>{
 const b=new BuggyEncounter(),p=new Run().player;p.x=1408;p.y=1152;b.body.hp=b.body.maxHp*.2;
 b.prepare(attack('barrage'),p,clear);const zones=[b.telegraph!.zone,...b.extraWarnings];assert.equal(zones.length,7);assert.ok(zones.every(z=>z.radius===32));
 tick(b,p,1.15);assert.equal(p.hp,100);tick(b,p,.2);assert.equal(p.hp,58);tick(b,p,.5);assert.equal(p.hp,58);
 b.cancel();assert.equal(b.hazards.length,0);assert.equal(b.parts.length,0);
});
test('Orange exige Morgan; carta propia, derrota con25HP y mismo mundo/cofres; victoria ofrece Log Pose voluntario a Syrup sin curar', () => {
  assert.equal(new Run().beginBuggy(), false);
  const r = orange(), world = r.world; r.explorationChests!.sync(r.world, r.player); const field = r.explorationChests;
  improveAttack(r.player, 'bazooka'); equipItem(r.player, 'vest'); r.player.fruit = 'bomu'; r.player.collectedBerries = 37; r.player.level = 22; r.player.xp = 4;
  r.buggyRoute.signal = { ...r.player }; r.update(1 / 60, axis); assert.equal(r.voyage?.destination, 'buggy'); finish(r);
  assert.equal(r.encounter!.profile.id, 'buggy'); assert.equal(r.inArena, true); assert.equal(r.visibleChests.length, 0);
  r.player.hp = 0; const before = build(r); r.update(1 / 60, axis); assert.equal(r.voyage?.destination, 'orange-return'); finish(r);
  assert.equal(r.world, world); assert.equal(r.explorationChests, field); assert.equal(r.player.hp, 25); assert.equal(build(r), before); assert.equal(r.result(), undefined);
  r.beginBuggy(); const b = r.encounter!; b.body.x = r.player.x + 40; b.body.y = r.player.y; b.body.hp = 1; r.player.attacks[0].cooldown = 0;
  r.update(1 / 60, axis); assert.ok(r.buggyDefeated); assert.equal(b.state, 'dead'); assert.ok(r.canJoinMovements);
  for (let i = 0; i < 100 && r.status === 'playing'; i++) r.update(1 / 60, axis);
  assert.equal(r.voyage,undefined);assert.ok(r.exitSignal);assert.equal(r.zone,'buggy-arena');
  assert.equal(r.status,'combining');r.finishCombinations();Object.assign(r.player,r.exitSignal);r.update(1/60,axis);const won = build(r), hp = r.player.hp; assert.equal(r.voyage?.destination, 'syrup'); finish(r);
  assert.equal(r.zone, 'syrup-village'); assert.equal(build(r), won); assert.equal(r.player.hp, hp); assert.equal(r.beginBuggy(), false);
});
test('sesión de tres fases usa seis patrones y pools limitados sin atravesar obstáculos', () => {
  const r = orange(); r.beginBuggy(); const b = r.encounter!, seen = new Set<string>(); r.player.hurtTimer = 1e6;
  r.player.attacks.forEach(a => a.cooldown = 1e6);
  for (const ratio of [1, 0.5, 0.2]) {
    b.body.hp = b.body.maxHp * ratio;
    for (let i = 0; i < 60 * 50; i++) {
      r.update(1 / 60, axis); if (b.telegraph) seen.add(b.telegraph.attack.id);
      assert.ok(r.enemies.count <= b.profile.reinforcementCap); assert.ok(r.world.canOccupy(b.body.x, b.body.y, b.body.radius));
      assert.ok(r.enemies.items.filter(e => e.active).every(e => e.visual === 'buggy-pirate'));
    }
  }
  assert.deepEqual([...seen].sort(), BUGGY_ATTACKS.map(a => a.id).sort());
});
test('victoria de Buggy se guarda una vez y acepta perfiles anteriores sin campos nuevos', () => {
  const memory = new Map<string, string>(), storage = { getItem: (k: string) => memory.get(k) ?? null, setItem: (k: string, v: string) => { memory.set(k, v); } };
  const store = new SaveStore(storage); assert.equal(store.recordBuggyVictory('run'), true); assert.equal(store.recordBuggyVictory('run'), false);
  assert.equal(new SaveStore(storage).progress.buggyVictories, 1);
  assert.equal(store.import(JSON.stringify({ ...store.progress, buggyVictories: -1 })), false);
});

test('un cuchillo daña al llegar, huecos radiales y fases66/33 exactas',()=>{
 const b=new BuggyEncounter(),p=new Run().player;b.body.x=1000;b.body.y=1000;p.x=1300;p.y=1000;
 b.prepare(attack('knives'),p,clear);tick(b,p,2.2);assert.equal(p.hp,72);
 for(const [ratio,phase]of [[.6601,1],[.66,2],[.3301,2],[.33,3]]){b.body.hp=b.body.maxHp*ratio;b.tick(0,p,clear,()=>axis,noop);assert.equal(b.phase,phase);}
});
test('arena propia grande, sin edificios navales; muros/coberturas sólidos y spawns libres',()=>{
 const world=new ArenaWorld(42,BUGGY_ARENA,'orange');assert.ok(BUGGY_ARENA.width>1800&&BUGGY_ARENA.height>1000);
 assert.ok(world.canOccupy(BUGGY_ARENA.playerSpawn.x,BUGGY_ARENA.playerSpawn.y,14));assert.ok(world.canOccupy(BUGGY_ARENA.bossSpawn.x,BUGGY_ARENA.bossSpawn.y,24));
 for(const c of BUGGY_ARENA.covers){assert.equal(world.canOccupy(c.x+c.width/2,c.y+c.height/2,14),false);assert.equal(c.art?.startsWith('naval'),false);}
 assert.equal(world.canOccupy(0,0,14),false);assert.equal(world.canOccupy(BUGGY_ARENA.width,1000,14),false);
});
test('pausa congela proyectiles; muerte/cancelación limpian peligros y recomposición',()=>{
 const r=orange();r.beginBuggy();const b=r.encounter as BuggyEncounter;r.player.attacks.forEach(a=>a.cooldown=1e6);
 b.prepare(attack('knives'),r.player,r.world);for(let i=0;i<66;i++)r.update(1/60,axis);assert.ok(b.knives.length);
 r.pause();const snapshot=JSON.stringify({knives:b.knives,hazards:b.hazards,parts:b.parts,elapsed:b.elapsed});for(let i=0;i<60;i++)r.update(1/60,axis);
 assert.equal(JSON.stringify({knives:b.knives,hazards:b.hazards,parts:b.parts,elapsed:b.elapsed}),snapshot);
 b.prepare(attack('split'),r.player,r.world);assert.equal(b.parts.length,3);b.defeated();assert.equal(b.parts.length+b.hazards.length+b.knives.length,0);assert.equal(b.state,'dead');
});

test('bombas de fase2 incluyen el objetivo y esperan sus retardos; proyectiles aceleran moderadamente',()=>{
 const b=new BuggyEncounter(),p=new Run().player;p.x=1408;p.y=1152;b.body.hp=b.body.maxHp*.5;
 b.prepare(attack('bomb'),p,clear);assert.equal(b.telegraph!.zone.x,p.x);assert.equal(b.extraWarnings.length,1);assert.equal(b.extraWarnings[0].x,p.x+150);
 tick(b,p,1.5);assert.equal(p.hp,100);tick(b,p,.2);assert.equal(p.hp,55);assert.ok(b.hazards.some(h=>!h.exploded&&h.remaining>0));
 const fast=new BuggyEncounter();fast.body.hp=fast.body.maxHp*.2;fast.prepare(attack('knives'),p,clear);tick(fast,p,1.1);assert.ok(fast.knives.every(k=>k.speed>280&&k.speed<350));
});

test('Balloon+ refleja cuchillos y puede ganar el combate con recompensa y limpieza normales',()=>{
 const r=orange();r.beginBuggy();const b=r.encounter as BuggyEncounter,p=r.player;
 for(let i=0;i<6;i++)improveAttack(p,'balloon');r.selectSlot(1);p.attacks.find(a=>a.id==='balloon')!.activeFor=5;
 b.body.x=p.x+240;b.body.y=p.y;b.body.hp=1;b.prepare(attack('bomb'),p,r.world);
 b.knives.push({x:p.x+42,y:p.y,angle:Math.PI,speed:280,life:3,damage:28,active:true,reflected:false});
 b.tick(1/60,p,r.world,()=>axis,noop);assert.equal(b.knives[0].reflected,true);assert.equal(p.hp,100);
 tick(b,p,1,r.world);assert.equal(b.state,'dead');assert.equal(r.buggyDefeated,true);assert.ok(r.canJoinMovements);assert.equal(b.knives.length,0);
});
test('los esquers existentes absorben cuchillos; los bloqueos reutilizan el guardia del personaje',async()=>{
 const r=orange();r.beginBuggy();const b=r.encounter as BuggyEncounter,p=r.player;b.prepare(attack('bomb'),p,r.world);
 const lure=r.areas.acquire()!;Object.assign(lure,{active:true,x:p.x+80,y:p.y,kind:'decoy',hp:40,radius:24,life:10});
 b.knives.push({x:p.x+100,y:p.y,angle:Math.PI,speed:280,life:3,damage:28,active:true,reflected:false});b.tick(1/60,p,r.world,()=>axis,noop);
 assert.equal(lure.hp,12);assert.equal(b.knives.length,0);assert.equal(p.hp,100);
 const {ABILITIES}=await import('../src/content/attacks.ts');const guard=Object.values(ABILITIES).find(a=>a.levels[0].counterDamage)!;
 const z=new Run('zoro');z.morganDefeated=true;z.boardToOrangeTown();z.beginBuggy();for(const a of z.player.attacks)a.cooldown=1e6;z.update(1/60,axis);
 improveAttack(z.player,guard.id);z.selectSlot(1);const state=z.player.attacks.find(a=>a.id===guard.id)!;state.activeFor=4;
 const boss=z.encounter as BuggyEncounter;boss.prepare(attack('bomb'),z.player,z.world);
 boss.knives.push({x:z.player.x+3,y:z.player.y,angle:Math.PI,speed:280,life:3,damage:28,active:true,reflected:false});const hp=z.player.hp;
 boss.tick(1/60,z.player,z.world,()=>axis,noop);assert.equal(z.player.hp,hp);assert.equal(state.counterUsed,true);assert.equal(boss.knives.length,0);
});

test('Buggy persigue a distancia y solo prepara disparos tras recuperar distancia media',()=>{
 const b=new BuggyEncounter(),p=new Run().player;b.body.x=1000;b.body.y=1000;p.x=1700;p.y=1000;
 for(let i=0;i<60;i++)b.tick(1/60,p,clear,()=>({x:1,y:0}),noop);
 assert.equal(b.telegraph,undefined);assert.ok(b.body.x>1200);
 for(let i=0;i<72;i++)b.tick(1/60,p,clear,()=>({x:1,y:0}),noop);
 assert.ok(b.body.x>1300);assert.equal(b.state,'preparing');assert.ok(Math.hypot(p.x-b.body.x,p.y-b.body.y)<310);
});

test('Buggy ofrece su propia fusión aunque la recompensa anterior ya se consumió, una sola vez',()=>{
 const r=orange();improveAttack(r.player,'gatling');r.grantCombinationReward();r.openCombinations();assert.ok(r.joinPair(0,1));assert.equal(r.unionTokens,0);
 const next=r.character.abilities.find(id=>!r.player.attacks.some(a=>a.id===id))!;improveAttack(r.player,next);r.beginBuggy();const b=r.encounter!;
 b.body.x=r.player.x+30;b.body.y=r.player.y;b.body.hp=1;for(const a of r.player.attacks)a.cooldown=0;
 for(let i=0;i<200&&r.status==='playing';i++)r.update(1/60,axis);
 assert.equal(r.status,'combining');assert.ok(r.buggyDefeated);assert.equal(r.unionTokens,1);assert.ok(r.joinPair(0,1));assert.equal(r.unionTokens,0);
 for(let i=0;i<120;i++)r.update(1/60,axis);assert.equal(r.status,'playing');assert.equal(r.unionTokens,0);assert.ok(r.sailToSyrup());
});
