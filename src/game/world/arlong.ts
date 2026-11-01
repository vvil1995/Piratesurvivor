import { generateOrangeChunk, type Chunk, type Obstacle } from './generator.ts';
import { townNoise,townRoadAt } from './town-ground.ts';
export function arlongDistrict(seed:number,x:number,y:number):'village'|'jungle'|'park'{const n=townNoise(seed^357,x/40,y/40);return n<.36?'village':n>.63?'park':'jungle';}
export function arlongGround(seed:number,x:number,y:number):'stone'|'earth'|'grass'{
 if(townRoadAt(seed,x,y))return townNoise(seed^357,x/40,y/40)>.6?'stone':'earth';
 return townNoise(seed^819,x/12,y/12)>.3?'grass':'earth';
}
export function generateArlongChunk(seed:number,cx:number,cy:number):Chunk{
 const c=generateOrangeChunk(seed,cx,cy),district=arlongDistrict(seed,cx*16+8,cy*16+8);c.district=district==='park'?'occupied':district==='jungle'?'garden':'residential';
 const waters=[{x:0,y:12,w:6,h:2},{x:10,y:12,w:6,h:2},...(c.variation%3===0?[{x:2,y:2,w:3,h:3}]:[])];
 const touches=(o:Obstacle,r:{x:number;y:number;w:number;h:number})=>o.x<(cx*16+r.x+r.w)*32&&o.x+o.width>(cx*16+r.x)*32&&o.y<(cy*16+r.y+r.h)*32&&o.y+o.height>(cy*16+r.y)*32;
 c.obstacles=c.obstacles.filter(o=>!waters.some(r=>touches(o,r)));
 for(const o of c.obstacles){
  if(o.kind==='house'||o.kind==='tent'){o.kind='house';o.art=district==='park'?'arlong-pagoda':'cocoyasi-house';}
  else if(o.kind==='tree')o.art=o.variant%2?'coastal-palm':'orange-tree';
  else if(o.kind==='ruin'||o.kind==='rock'){o.kind='rock';o.art='arlong-rubble';}
  else if(o.kind==='pennant'){o.kind='crate';o.art='arlong-flag';}
  else if(o.kind==='stall'){o.kind='crate';o.art='coastal-crates';}
 }
 for(const [i,r]of waters.entries())c.obstacles.push({id:`${c.key}/canal/${i}`,kind:'water',x:(cx*16+r.x)*32,y:(cy*16+r.y)*32,width:r.w*32,height:r.h*32,variant:0});
 c.obstacles.push({id:`${c.key}/bridge`,kind:'dock',x:cx*512+192,y:cy*512+384,width:128,height:64,variant:0,art:'wooden-dock'});
 const rebuild=()=>{c.solids.fill(0);for(const o of c.obstacles){if(o.kind==='dock')continue;const x=o.x/32-cx*16,y=o.y/32-cy*16;for(let j=y;j<y+o.height/32;j++)for(let i=x;i<x+o.width/32;i++)c.solids[i+j*16]=1;}};
 // Reparación local acotada: los canales conservan el puente central y nunca se eliminan.
 for(let repair=0;repair<24;repair++){
  rebuild();const seen=new Set([136]),q=[136];
  for(let n=0;n<q.length;n++){const at=q[n],x=at%16,y=Math.floor(at/16);for(const[dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy,id=xx+yy*16;if(xx>=0&&xx<16&&yy>=0&&yy<16&&!c.solids[id]&&!seen.has(id)){seen.add(id);q.push(id);}}}
  const isolated=c.solids.findIndex((v,i)=>!v&&!seen.has(i));if(isolated<0)break;
  const remove=c.obstacles.findIndex(o=>o.kind!=='water'&&o.kind!=='dock');if(remove<0)break;c.obstacles.splice(remove,1);
 }
 rebuild();return c;
}
