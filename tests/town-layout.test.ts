import test from 'node:test';
import assert from 'node:assert/strict';
import { townGroundAt, townRoadAt } from '../src/game/world/town-ground.ts';
import { ProceduralWorld } from '../src/game/world/world.ts';
import { FlowField } from '../src/game/navigation/flow-field.ts';
import { ChestField } from '../src/game/systems/loot.ts';
import { generateLegacyChunk } from '../src/game/world/generator.ts';

test('terreno y calles globales coinciden a ambos lados de cada borde, incluso en negativos',()=>{
 for(const seed of [3,42,73,887])for(const theme of ['shells','orange'] as const){
  for(let border=-32;border<=32;border+=16)for(let at=-40;at<=40;at+=.5){
   for(const [x,y,dx,dy]of [[border,at,1,0],[at,border,0,1]]){
    assert.equal(townGroundAt(seed,x-dx*1e-7,y-dy*1e-7,theme),townGroundAt(seed,x+dx*1e-7,y+dy*1e-7,theme));
    assert.equal(townRoadAt(seed,x-dx*1e-7,y-dy*1e-7),townRoadAt(seed,x+dx*1e-7,y+dy*1e-7));
   }
  }
 }
});
test('muchas semillas: espacios libres conectados, entradas anchas y obstáculos con propiedad única',()=>{
 const arts=new Set<string>(),layouts=new Set<string>(),materials=new Set<string>();
 for(const seed of [3,42,73,887,12345])for(const theme of ['shells','orange'] as const){
  const w=new ProceduralWorld(seed,theme);
  for(let cy=-2;cy<=2;cy++)for(let cx=-2;cx<=2;cx++){
   const c=w.getChunk(cx,cy);assert.ok(c.obstacles.length<=20);
   assert.equal(new Set(c.obstacles.map(o=>o.id)).size,c.obstacles.length);
   const seen=new Set<number>([0]),queue=[0];
   for(let q=0;q<queue.length;q++){const at=queue[q],x=at%16,y=Math.floor(at/16);for(const[dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,n=nx+ny*16;if(nx>=0&&ny>=0&&nx<16&&ny<16&&!c.solids[n]&&!seen.has(n)){seen.add(n);queue.push(n);}}}
   for(let i=0;i<256;i++)if(!c.solids[i])assert.ok(seen.has(i),`${theme}/${seed}/${cx}/${cy}/${i}`);
   if(c.district!=='harbor')for(let i=0;i<16;i++)for(let lane=6;lane<=9;lane++){assert.equal(c.solids[lane+i*16],0);assert.equal(c.solids[i+lane*16],0);}
   for(const o of c.obstacles){assert.equal(Math.floor(o.x/512),cx);assert.equal(Math.floor(o.y/512),cy);if(o.art)arts.add(o.art);}
   layouts.add(JSON.stringify(c.obstacles.map(o=>[o.kind,o.x-cx*512,o.y-cy*512,o.width,o.height])));
   for(let y=0;y<16;y+=.5)for(let x=0;x<16;x+=.5)materials.add(townGroundAt(seed,cx*16+x,cy*16+y,theme));
  }
  const field=new FlowField(w);field.update({x:256,y:256},1);
  for(let y=-16;y<32;y++)for(let x=-16;x<32;x++)if(w.canOccupy(x*32+16,y*32+16,14))assert.ok(field.reachable({x:x*32+16,y:y*32+16}));
 }
 assert.ok(layouts.size>150);assert.deepEqual([...materials].sort(),['earth','grass','stone']);
 for(const art of ['naval-flag','naval-cannon','naval-tower','naval-crates'])assert.ok(arts.has(art),art);
});
test('cofres siguen teniendo espacio libre y terreno provisional de Syrup queda intacto',()=>{
 for(const theme of ['shells','orange'] as const)for(const seed of [3,42,887]){
  const w=new ProceduralWorld(seed,theme),field=new ChestField();let found=0;
  for(let y=-4;y<4;y++)for(let x=-4;x<4;x++){
   field.sync(w,{x:x*512+256,y:y*512+256});for(const c of field.active){found++;assert.ok(w.canOccupy(c.x,c.y,18));}
  }assert.ok(found>0);
 }
 const w=new ProceduralWorld(42,'syrup');assert.deepEqual(w.getChunk(-2,1),generateLegacyChunk(42,-2,1));
});
