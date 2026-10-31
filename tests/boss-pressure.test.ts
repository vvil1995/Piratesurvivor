import test from 'node:test';
import assert from 'node:assert/strict';
import { MorganEncounter } from '../src/game/bosses/morgan.ts';
import { BuggyEncounter } from '../src/game/bosses/buggy.ts';
import { KuroEncounter } from '../src/game/bosses/kuro.ts';
import { MORGAN_ATTACKS } from '../src/content/bosses/morgan.ts';
import { BUGGY,BUGGY_ATTACKS } from '../src/content/bosses/buggy.ts';
import { KURO,KURO_ATTACKS } from '../src/content/bosses/kuro.ts';
import { Run } from '../src/game/core/run.ts';
import { bossPhase,warningSeconds } from '../src/game/bosses/pressure.ts';
import type { CollisionWorld } from '../src/game/world/world.ts';
const clear:CollisionWorld={canOccupy:()=>true,segmentClear:()=>true,moveCircle:(p,x,y)=>{p.x+=x;p.y+=y;}};
const axis={x:0,y:0},noop=()=>{};
function step(b:MorganEncounter,p:Run['player'],n:number){for(let t=0;t<n-1e-9;t+=.01){p.hurtTimer=Math.max(0,p.hurtTimer-.01);b.tick(Math.min(.01,n-t),p,clear,()=>axis,noop);}}
test('tres bosses: 33% activa fase3, avisos al70%, mismo daño/geometría; fases1/2 intactas',()=>{
 for(const [create,attacks] of [[()=>new MorganEncounter(),MORGAN_ATTACKS],[()=>new BuggyEncounter(),BUGGY_ATTACKS],[()=>new KuroEncounter(),KURO_ATTACKS]] as const){
  const original=JSON.stringify(attacks);
  for(const ratio of [1,.5,.3301,.33,.2])for(const a of attacks){
   const b=create(),p=new Run().player;p.x=b.body.x+120;p.y=b.body.y;b.body.hp=b.body.maxHp*ratio;b.prepare(a,p,clear);
   assert.equal(b.phase,ratio<=.33?3:ratio<=b.profile.phaseThresholds[0]?2:1);
   assert.equal(b.telegraph!.attack.preparation,ratio<=.33?Math.max(.35,a.preparation*.7):a.preparation);
   assert.equal(b.telegraph!.attack.damage,a.damage);assert.equal(b.telegraph!.attack.width,a.width);
  }
  assert.equal(JSON.stringify(attacks),original);
 }
 assert.equal(warningSeconds(.4,3),.35);assert.equal(warningSeconds(.4,3,.5),.5);assert.equal(bossPhase(33,100,.65),3);
});
test('un aviso iniciado no se acorta al cambiar de fase, sin daño prematuro',()=>{
 for(const create of [()=>new MorganEncounter(),()=>new BuggyEncounter(),()=>new KuroEncounter()]){
  const b=create(),p=new Run().player;p.x=b.body.x+60;p.y=b.body.y;b.prepare(b.attacks[0],p,clear);const seconds=b.telegraph!.attack.preparation;b.body.hp=b.body.maxHp*.2;
  step(b,p,seconds-.05);assert.equal(p.hp,100);assert.equal(b.state,'preparing');assert.equal(b.telegraph!.attack.preparation,seconds);
 }
});
test('Kuro tiene25% más HP que Buggy y seis ataques; reposicionamientos no solapan al jugador',()=>{
 assert.equal(KURO.hp,BUGGY.hp*1.25);assert.equal(KURO_ATTACKS.length,6);
 for(const id of ['ghost','surprise']){
  const b=new KuroEncounter(),p=new Run().player;p.x=b.body.x+100;p.y=b.body.y;b.prepare(KURO_ATTACKS.find(a=>a.id===id)!,p,clear);
  step(b,p,.1);assert.equal(p.hp,100);
  if(id==='ghost')step(b,p,.6);
  assert.ok(Math.hypot(b.body.x-p.x,b.body.y-p.y)>=120);
  b.cancel();assert.equal(b.telegraph,undefined);assert.equal(b.trails.length,0);
 }
});
test('Shakushi: cinco avisos separados, barrido de colisión y agotamiento fijo2s vulnerable',()=>{
 const b=new KuroEncounter(),p=new Run().player;b.body.x=500;b.body.y=500;p.x=1300;p.y=500;p.hp=10000;p.hurtTimer=100;b.body.hp=b.body.maxHp*.2;
 b.prepare(KURO_ATTACKS.find(a=>a.id==='shakushi')!,p,clear);let passes=0,old=b.state;
 for(let i=0;i<2000&&!b.exhausted;i++){
  b.tick(.01,p,clear,()=>axis,noop);
  if(old==='preparing'&&b.state==='impact')passes++;
  if(b.state==='preparing')assert.equal(b.telegraph!.attack.preparation,.7);
  old=b.state;
 }
 assert.equal(passes,5);assert.ok(b.exhausted);assert.equal(b.elapsed,0);
 step(b,p,1.99);assert.ok(b.exhausted);const hp=b.body.hp;b.body.hp-=5;assert.equal(b.body.hp,hp-5);
 step(b,p,.02);assert.equal(b.exhausted,false);assert.equal(b.state,'approach');
});
test('Kuro: X registra dos impactos separados, ráfaga no persigue con precisión al jugador',()=>{
 const b=new KuroEncounter(),p=new Run().player;b.body.x=500;b.body.y=500;p.x=560;p.y=500;p.hp=1000;
 b.prepare(KURO_ATTACKS[0],p,clear);step(b,p,.49);assert.equal(p.hp,1000);step(b,p,.02);assert.equal(p.hp,962);
 step(b,p,.82);assert.equal(p.hp,962);step(b,p,.05);assert.equal(p.hp,924);
 const f=new KuroEncounter();p.x=f.body.x+60;p.y=f.body.y;f.prepare(KURO_ATTACKS.find(a=>a.id==='flurry')!,p,clear);const angle=f.telegraph!.zone.angle;
 p.x=f.body.x-500;step(f,p,1.1);assert.equal(f.state,'preparing');assert.equal(f.telegraph!.zone.angle,angle);
});
test('Buggy aplica la misma reducción a avisos escalonados y a la bomba secundaria',()=>{
 const b=new BuggyEncounter(),p=new Run().player;b.body.hp=b.body.maxHp*.2;b.body.x=1000;b.body.y=1000;p.x=1300;p.y=1000;p.hurtTimer=100;
 b.prepare(BUGGY_ATTACKS.find(a=>a.id==='bomb')!,p,clear);const prep=b.telegraph!.attack.preparation;step(b,p,prep);
 assert.equal(b.hazards.length,3);assert.ok(Math.abs(b.hazards[2].remaining-.28*2*.7)<1e-8);
 b.cancel();b.prepare(BUGGY_ATTACKS.find(a=>a.id==='ring')!,p,clear);step(b,p,b.telegraph!.attack.preparation);
 assert.equal(b.hazards.length,1);assert.ok(Math.abs(b.hazards[0].remaining-1.6*.7)<1e-8);assert.equal(b.hazards[0].exploded,false);
});
