import { hash } from './seed.ts';
import type { Chunk,Obstacle } from './generator.ts';
const mod=(n:number)=>((n%16)+16)%16;
/** Puerto compartido por arista: ambos vecinos calculan exactamente la misma entrada. */
export function deckAt(seed:number,tx:number,ty:number):boolean{
 const cx=Math.floor(tx/16),cy=Math.floor(ty/16),x=mod(tx),y=mod(ty),v=hash(seed,cx,cy);
 const horizontal=!!(v%2),bow=horizontal?x:y,side=horizontal?y:x;
 const lo=2+(v>>>4)%2,hi=12+(v>>>5)%2,sideLo=2+(v>>>6)%2,sideHi=12+(v>>>7)%2;
 const hull=bow>=lo&&bow<=hi&&side>=sideLo&&side<=sideHi&&!(bow<lo+2&&(side<sideLo+lo+2-bow||side>sideHi-lo-2+bow));
 const secondary=v%3===0&&x>=11&&x<=14&&y>=10&&y<=13;
 const port=(axis:number,a:number,b:number)=>5+hash(seed^axis,a,b)%3;
 const eastWest=x<4?port(781,cx,cy):port(781,cx+1,cy);
 const northSouth=y<4?port(953,cx,cy):port(953,cx,cy+1);
 // Cuatro celdas (128px), con tramos curvos escalonados suaves hasta la cubierta.
 const hy=x<4||x>11?eastWest:6, vx=y<4||y>11?northSouth:6;
 return hull||secondary||(y>=hy&&y<hy+4)||(x>=vx&&x<vx+4);
}
export function generateBaratieChunk(seed:number,cx:number,cy:number):Chunk{
 const key=`${cx},${cy}`,v=hash(seed,cx,cy),c:Chunk={key,cx,cy,district:'harbor',variation:v,solids:new Uint8Array(256),obstacles:[]};
 // Agua compactada en rectángulos verticales, no un objeto físico por baldosa.
 const runs=new Map<string,Obstacle>();
 for(let y=0;y<16;y++)for(let x=0;x<16;){
  if(deckAt(seed,cx*16+x,cy*16+y)){x++;continue;}
  const start=x;while(x<16&&!deckAt(seed,cx*16+x,cy*16+y)){c.solids[x+y*16]=1;x++;}
  const runKey=`${start}/${x}`,previous=runs.get(runKey);
  if(previous&&previous.y+previous.height===(cy*16+y)*32)previous.height+=32;
  else{const o:Obstacle={id:`${key}/water/${start}/${y}`,kind:'water',x:(cx*16+start)*32,y:(cy*16+y)*32,width:(x-start)*32,height:32,variant:0};c.obstacles.push(o);runs.set(runKey,o);}
 }
 const add=(x:number,y:number,w:number,h:number,art:string,solid=true)=>{
  if(solid){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)if(!deckAt(seed,cx*16+i,cy*16+j))return;}
  c.obstacles.push({id:`${key}/prop/${c.obstacles.length}`,kind:'crate',x:(cx*16+x)*32,y:(cy*16+y)*32,width:w*32,height:h*32,variant:0,art});
  if(solid)for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)c.solids[i+j*16]=1;
 };
 // Solo rincones; el cruce central de cuatro celdas siempre queda libre.
 if(v%3!==0)add(3,10,2,1,'coastal-crates');
 add(11,3,2,2,v%2?'krieg-cannon':'baratie-mast');
 add(3,3,1,1,'krieg-flag',false);
 if(cx===0&&cy===0||v%13===0)add(1,0,4,2,'baratie-restaurant',false);
 return c;
}
