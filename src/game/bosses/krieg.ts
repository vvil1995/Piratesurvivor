import { KRIEG,KRIEG_ATTACKS,KRIEG_RULES as R } from '../../content/bosses/krieg.ts';
import { PatternEncounter } from './pattern-encounter.ts';
import { inDanger,type BossAttack,type DangerZone } from './telegraphs.ts';
import type { Player,Vector } from '../core/types.ts';
import type { CollisionWorld } from '../world/world.ts';
import { isInvulnerable } from '../systems/guards.ts';
import { receivedDamage } from '../systems/stats.ts';
export interface KriegHazard {zone:DangerZone;remaining:number;life:number;timer:number;kind:'poison'|'mh5'|'blast'}
export interface KriegHooks {fire?:(origin:Vector,angle:number,damage:number)=>void;clear?:()=>void}
export function gasZone(h:KriegHazard):DangerZone{
 const total=h.kind==='mh5'?R.mh5Life:R.gasLife,scale=Math.min(1,.35+(total-h.life)/.65);
 return h.zone.shape==='circle'?{...h.zone,radius:h.zone.radius*scale}:{...h.zone,width:h.zone.width*scale};
}
export class KriegEncounter extends PatternEncounter {
 readonly hazards:KriegHazard[]=[];
 private current?:BossAttack;
 private hooks:KriegHooks;
 constructor(hooks:KriegHooks={}){super(KRIEG,KRIEG_ATTACKS);this.hooks=hooks;this.body.defense={angle:0,frontal:0,arc:Math.PI*.85,armor:{remaining:R.armor,max:R.armor,reduction:R.armorReduction}};}
 get attackId(){return this.current?.id;}
 get armorStage(): 'intact'|'cracked'|'broken'{const a=this.body.defense!.armor!;return a.remaining<=0?'broken':a.remaining<a.max*.5?'cracked':'intact';}
 override cancel():void{super.cancel();this.hazards.length=0;this.current=undefined;this.body.defense!.frontal=0;this.hooks.clear?.();}
 override prepare(a:BossAttack,target:Vector,w:CollisionWorld):void{
  this.current=a;this.body.defense!.frontal=0;super.prepare(a,target,w);this.body.defense!.angle=this.angle;
  const z=this.telegraph!.zone;
  if(a.id==='gun'){
   const rays=Array.from({length:7},(_,i)=>({...z,angle:this.angle-.6+i*.2}));this.telegraph!.zone=rays[0];this.extraWarnings=rays.slice(1);
  }else if(a.id==='spear'){
   this.extraWarnings=[{...z,shape:'circle',x:this.body.x+Math.cos(this.angle)*220,y:this.body.y+Math.sin(this.angle)*220,radius:70}];
  }else if(a.id==='naval'||a.id==='poison'){
   const count=a.id==='poison'?3:this.phase===3?7:5;
   const points=Array.from({length:count},(_,i)=>i===0?{...target}:{x:target.x+Math.cos(i*2.4)*250,y:target.y+Math.sin(i*2.4)*250});
   const candidates=[...points];
   for(const distance of [250,420,600])for(let i=0;i<12;i++)candidates.push({x:Math.max(224,Math.min(2848,target.x+Math.cos(i*Math.PI/6)*distance)),y:Math.max(224,Math.min(1952,target.y+Math.sin(i*Math.PI/6)*distance))});
   const zones:DangerZone[]=[];
   for(const p of candidates){if(zones.length>=count)break;if(w.canOccupy(p.x,p.y,z.radius)&&zones.every(other=>Math.hypot(other.x-p.x,other.y-p.y)>z.radius*2.2))zones.push({...z,...p});}

   if(!zones.length)zones.push({...z,x:this.body.x,y:this.body.y});
   this.telegraph!.zone=zones[0];this.extraWarnings=zones.slice(1);
  }else if(a.id==='mh5'){
   // Sectores de240px de ancho: salida lateral a<=120px; nunca una pared total de gas.
   const zones=[0,-500,500].map((dy,i)=>({...z,x:Math.max(160,Math.min(2368,target.x-280+(i-1)*100)),y:Math.max(256,Math.min(1904,target.y+dy)),angle:0})).filter(p=>w.canOccupy(p.x+p.length/2,p.y,32));
   this.telegraph!.zone=zones[0]??{...z,x:this.body.x-280,y:this.body.y};this.extraWarnings=zones.slice(1);
  }
 }
 private hurtPlayer(p:Player,damage:number,name=this.current?.name??'Gas de Krieg'):void{
  if(p.hp<=0||p.hurtTimer>0||isInvulnerable(p))return;
  p.hp=Math.max(0,p.hp-receivedDamage(damage,p.stats.armor));p.hurtTimer=.65;p.lastHit=name;p.damageNoticeFor=1.2;
 }
 override tick(dt:number,p:Player,w:CollisionWorld,direction:(from:Vector)=>Vector,reinforce:()=>void):void{
  const before=this.state,zones=this.telegraph?[this.telegraph.zone,...this.extraWarnings].map(z=>({...z})):[];
  super.tick(dt,p,w,direction,reinforce);
  if(this.state==='dead'||p.hp<=0)return;
  this.body.defense!.frontal=this.state==='impact'&&this.current?.id==='shield'?R.shieldReduction:0;
  if(before==='preparing'&&this.state==='impact'){
   const a=this.current!;
   if(a.id==='gun')for(const z of zones)this.hooks.fire?.(this.body,z.angle,a.damage);
   if(a.id==='naval'||a.id==='poison'||a.id==='mh5')for(const z of zones){
    if(this.hazards.length>=R.hazardCap)break;
    if(a.id!=='mh5'&&inDanger(z,p))this.hurtPlayer(p,a.damage);
    this.hazards.push({zone:z,remaining:0,life:a.id==='naval'?.4:a.id==='mh5'?R.mh5Life:R.gasLife,timer:a.id==='naval'?1:R.gasTick,kind:a.id==='naval'?'blast':a.id==='mh5'?'mh5':'poison'});
   }
  }
  for(let i=this.hazards.length-1;i>=0;i--){const h=this.hazards[i];h.life-=dt;h.timer-=dt;
   if(h.life<=0){this.hazards.splice(i,1);continue;}
   if(h.kind!=='blast'&&h.timer<=0){h.timer+=R.gasTick;if(inDanger(gasZone(h),p))this.hurtPlayer(p,h.kind==='mh5'?R.mh5Damage:R.gasDamage,h.kind==='mh5'?'MH5 · Gas mortal':'Gas verinós de Krieg');}
  }
 }
}
