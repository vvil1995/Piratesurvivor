import { ArenaWorld,type ArenaDefinition } from './arena.ts';
import type { Chunk } from './generator.ts';
export const ARLONG_POOLS=[{x:320,y:704,width:320,height:704},{x:2432,y:704,width:320,height:704}] as const;
const channels=[{x:640,y:1536,width:704,height:64},{x:1728,y:1536,width:704,height:64}];
export const ARLONG_ARENA:ArenaDefinition={width:3072,height:2176,playerSpawn:{x:1536,y:1216},bossSpawn:{x:1728,y:1216},gates:[],
 covers:[{x:1120,y:1056,width:64,height:64,art:'arlong-column',breakable:true},{x:1920,y:1056,width:64,height:64,art:'arlong-column',breakable:true},{x:1056,y:1344,width:128,height:32,art:'coastal-wall',breakable:true},{x:1888,y:1344,width:128,height:32,art:'coastal-wall',breakable:true},{x:1376,y:544,width:320,height:192,art:'arlong-pagoda'},{x:704,y:640,width:64,height:64,art:'coastal-palm'},{x:2304,y:640,width:64,height:64,art:'coastal-palm'}],
 decorations:[{x:1216,y:704,width:64,height:96,art:'arlong-flag'},{x:1792,y:704,width:64,height:96,art:'arlong-flag'}]};
export class ArlongArenaWorld extends ArenaWorld {
 readonly pools=ARLONG_POOLS;
 transformed=false;
 private decorated=new WeakSet<Chunk>();
 constructor(seed:number){super(seed,{...ARLONG_ARENA,covers:[...ARLONG_ARENA.covers],decorations:[...(ARLONG_ARENA.decorations??[])]},'arlong');}
 override getChunk(cx:number,cy:number):Chunk{
  const c=super.getChunk(cx,cy);if(this.decorated.has(c))return c;this.decorated.add(c);
  for(const [i,p]of [...ARLONG_POOLS,...channels].entries()){
   const x=Math.max(cx*512,p.x),y=Math.max(cy*512,p.y),right=Math.min((cx+1)*512,p.x+p.width),bottom=Math.min((cy+1)*512,p.y+p.height);
   if(right<=x||bottom<=y)continue;
   c.obstacles.push({id:`${c.key}/pool/${i}`,kind:'water',x,y,width:right-x,height:bottom-y,variant:0});
   for(let ty=(y-cy*512)/32;ty<(bottom-cy*512)/32;ty++)for(let tx=(x-cx*512)/32;tx<(right-cx*512)/32;tx++)c.solids[tx+ty*16]=1;
  }
  return c;
 }
 breakObstacles():boolean{
  if(this.transformed)return false;this.transformed=true;
  const broken=this.arena.covers.filter(c=>c.breakable);this.arena.covers=this.arena.covers.filter(c=>!c.breakable);
  this.arena.decorations=[...(this.arena.decorations??[]),...broken.map(c=>({x:c.x,y:c.y+c.height-16,width:c.width,height:16,art:'arlong-rubble'}))];
  this.arenaChunks.clear();this.revision++;return true;
 }
}
