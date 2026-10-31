import { hash } from './seed.ts';
export type TownTheme = 'shells' | 'orange' | 'syrup';
export type TownGround = 'stone' | 'earth' | 'grass';
const smooth = (t: number) => t*t*(3-2*t);
/** Global value noise: never restarts at a chunk edge, including negative coordinates. */
export function townNoise(seed: number, x: number, y: number): number {
 const ix=Math.floor(x),iy=Math.floor(y),fx=smooth(x-ix),fy=smooth(y-iy);
 const value=(dx:number,dy:number)=>hash(seed,ix+dx,iy+dy)/0xffffffff;
 const a=value(0,0)*(1-fx)+value(1,0)*fx,b=value(0,1)*(1-fx)+value(1,1)*fx;
 return a*(1-fy)+b*fy;
}
export function townRoadAt(seed:number,x:number,y:number):boolean{
 const cx=Math.floor(x/16),cy=Math.floor(y/16),lx=x-cx*16,ly=y-cy*16;
 const h=8+(townNoise(seed^731,x/12,cy*3)-.5)*1.6;
 const v=8+(townNoise(seed^931,cx*3,y/12)-.5)*1.6;
 const width=1.25+townNoise(seed^127,x/11,y/11)*.35;
 if(Math.abs(ly-h)<width || Math.abs(lx-v)<width)return true;
 const plan=hash(seed^617,cx,cy);
 // Occasional open junctions, never a whole paved chunk.
 if(plan%5===0 && Math.hypot(lx-8,ly-8)<3.1)return true;
 // Optional broad side lane ends inside the block, not at an unmatched chunk edge.
 if(plan%3===0 && (cx!==0||cy!==0)){
  const ex=plan&8?12:4,ey=plan&16?12:4,dx=ex-8,dy=ey-8;
  const t=Math.max(0,Math.min(1,((lx-8)*dx+(ly-8)*dy)/(dx*dx+dy*dy)));
  if(Math.hypot(lx-8-dx*t,ly-8-dy*t)<1.1)return true;
 }
 return false;
}
export function townGroundAt(seed:number,x:number,y:number,theme:TownTheme):TownGround{
 if(townRoadAt(seed,x,y))return theme==='syrup'?'earth':'stone';
 const field=townNoise(seed^419,x/15,y/15)*.7+townNoise(seed^819,x/4,y/4)*.3;
 if(field>(theme==='syrup'?.30:theme==='orange'?.54:.43))return 'grass';
 return 'earth';
}
