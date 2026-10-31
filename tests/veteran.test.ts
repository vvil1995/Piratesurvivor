import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseEnemyType } from '../src/game/systems/spawner.ts';
import { SHELLS_TOWN } from '../src/content/worlds/shells-town.ts';
import { ENEMIES } from '../src/content/catalog.ts';
import { MORGAN } from '../src/content/bosses/morgan.ts';
import { tickEnemyShot } from '../src/game/systems/enemy-shooting.ts';
import type { Enemy } from '../src/game/core/types.ts';
import { Run } from '../src/game/core/run.ts';
import { spawnProjectile } from '../src/game/systems/effects.ts';
test('veterano:40% HP adicional y distribución exacta por minutos, sin oleadas adicionales',()=>{
 assert.equal(ENEMIES['marine-veteran'].hp,ENEMIES.marine.hp*1.4);
 for(const [seconds,expected] of [[0,0],[59.99,0],[60,5],[119.99,5],[120,10],[180,15],[240,20],[600,20]]){
  const counts:Record<string,number>={};for(let i=0;i<10000;i++){const id=chooseEnemyType(SHELLS_TOWN,seconds,()=>(i+.5)/10000);counts[id]=(counts[id]??0)+1;}
  assert.equal(counts['marine-veteran']??0,expected*100);
  assert.ok((counts['marine-veteran']??0)<counts.marine);assert.ok((counts['marine-veteran']??0)<counts['marine-rifle']);
 }
 assert.equal(SHELLS_TOWN.enemyCap,150);assert.equal(SHELLS_TOWN.spawnInterval,.95);assert.equal(MORGAN.hp,4200);assert.equal(MORGAN.reinforcementEnemy,'marine');
});


test('escopeta: preparación sin daño, dirección fija, cinco perdigones, cooldown y cancelación',()=>{
 const e:Enemy={...ENEMIES['marine-veteran'],x:0,y:0,maxHp:44.8,active:true,id:1,flash:0,shotTimer:0};
 const shots:number[]=[];const fire=(angle:number)=>{shots.push(angle);return true;};
 tickEnemyShot(e,{x:100,y:0},.1,true,fire);assert.equal(shots.length,0);assert.equal(e.shotWindup,.9);
 tickEnemyShot(e,{x:0,y:100},.5,true,fire);assert.equal(shots.length,0);
 tickEnemyShot(e,{x:0,y:100},.4,true,fire);assert.equal(shots.length,5);
 assert.ok(Math.abs(shots[0]+.35)<1e-9);assert.equal(shots[2],0);assert.ok(Math.abs(shots[4]-.35)<1e-9);
 tickEnemyShot(e,{x:100,y:0},.1,true,fire);assert.equal(shots.length,5);
 e.shotTimer=0;tickEnemyShot(e,{x:100,y:0},.1,true,fire);tickEnemyShot(e,{x:100,y:0},.9,false,fire);assert.equal(shots.length,5);assert.equal(e.shotWindup,0);
 tickEnemyShot(e,{x:100,y:0},.1,true,fire);assert.equal(e.shotWindup,.9);
});

test('fusil: avisa antes del disparo; enemigos antiguos mantienen un solo proyectil',()=>{
 for(const id of ['marine-rifle','buggy-gunner']){
  const e:Enemy={...ENEMIES[id],x:0,y:0,maxHp:32,active:true,id:1,flash:0,shotTimer:0};let shots=0;
  const fire=()=>{shots++;return true;};tickEnemyShot(e,{x:100,y:0},.1,true,fire);
  assert.equal(shots,id==='marine-rifle'?0:1);
  if(id==='marine-rifle'){tickEnemyShot(e,{x:100,y:0},.55,true,fire);assert.equal(shots,1);}
 }
});

test('perdigones respetan el pool compartido y su alcance corto',()=>{
 const run=new Run('luffy',0,()=>.5),e:Enemy={...ENEMIES['marine-veteran'],x:0,y:0,maxHp:44.8,active:true,id:1,flash:0,shotWindup:.01,shotAngle:0};
 tickEnemyShot(e,{x:100,y:0},.02,true,(angle,life)=>spawnProjectile(run,0,0,Math.cos(angle)*100,Math.sin(angle)*100,14,175,'',true,1,undefined,life));
 assert.equal(run.projectiles.count,5);for(const b of run.projectiles.items.filter(b=>b.active)){assert.equal(b.life,1.3);assert.ok(b.vx>0);}
 for(let i=0;i<200;i++)spawnProjectile(run,0,0,100,0,14,175,'',true);assert.equal(run.projectiles.count,run.projectiles.items.length);
});

test('escopeta integrada en Run: preparación visible y disparo real, sin daño previo',()=>{
 const r=new Run('luffy',0,()=>.5),p=r.player;for(const a of p.attacks)a.cooldown=100;p.hurtTimer=100;
 const def=ENEMIES['marine-veteran'],e=r.enemies.acquire()!;Object.assign(e,{...def,id:700,x:p.x+150,y:p.y,active:true,maxHp:def.hp,flash:0,shotTimer:0,speed:0});
 r.update(1/60,{x:0,y:0});assert.ok(e.shotWindup!>0);assert.equal(r.projectiles.count,0);assert.equal(p.hp,100);
 for(let i=0;i<55;i++)r.update(1/60,{x:0,y:0});
 const pellets=r.projectiles.items.filter(b=>b.active);assert.equal(pellets.length,5);assert.ok(pellets.every(b=>b.hostile&&b.vx<0));
});
