import type { CollisionWorld } from './world.ts';
import type { Vector } from '../core/types.ts';
/** Capacidad explícita: solo la reciben los hombres-pez. Muros y edificios siguen sólidos. */
export class AquaticWorld implements CollisionWorld {
 readonly land:CollisionWorld;
 constructor(land:CollisionWorld){this.land=land;}
 get revision():number{return this.land.revision??0;}
 canOccupy(x:number,y:number,r:number):boolean{return this.land.canOccupy(x,y,r,'attack');}
 segmentClear(ax:number,ay:number,bx:number,by:number,r:number):boolean{return this.land.segmentClear(ax,ay,bx,by,r,'attack');}
 moveCircle(p:Vector,dx:number,dy:number,r:number):void{
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/6));
  for(let i=0;i<steps;i++){if(this.canOccupy(p.x+dx/steps,p.y,r))p.x+=dx/steps;if(this.canOccupy(p.x,p.y+dy/steps,r))p.y+=dy/steps;}
 }
}
const adapters=new WeakMap<CollisionWorld,AquaticWorld>();
export function aquaticWorld(land:CollisionWorld):AquaticWorld{
 if(land instanceof AquaticWorld)return land;
 let world=adapters.get(land);if(!world){world=new AquaticWorld(land);adapters.set(land,world);}return world;
}
/** Recompensas de bajas acuáticas: acercarlas a una orilla transitable sin cambiar cantidades. */
export function landReward(world:CollisionWorld,position:Vector):Vector{
 if(world.canOccupy(position.x,position.y,20))return position;
 for(let radius=32;radius<=512;radius+=32)for(let i=0;i<24;i++){const a=i*Math.PI/12,p={x:position.x+Math.cos(a)*radius,y:position.y+Math.sin(a)*radius};if(world.canOccupy(p.x,p.y,20))return p;}
 return position;
}
