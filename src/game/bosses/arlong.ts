import { ARLONG,ARLONG_ATTACKS,ARLONG_RAGE,ARLONG_RULES as R } from '../../content/bosses/arlong.ts';
import { PatternEncounter } from './pattern-encounter.ts';
import { inDanger,type BossAttack,type DangerZone } from './telegraphs.ts';
import { AquaticWorld,aquaticWorld } from '../world/aquatic.ts';
import { ARLONG_POOLS } from '../world/arlong-arena.ts';
import { FlowField } from '../navigation/flow-field.ts';
import type { CollisionWorld } from '../world/world.ts';
import type { Player,Vector } from '../core/types.ts';
import { isInvulnerable } from '../systems/guards.ts';
import { receivedDamage } from '../systems/stats.ts';
export interface ArlongHooks {fire?:(from:Vector,angle:number,damage:number)=>void;clear?:()=>void;rage?:()=>void}
export interface Tooth extends Vector {path:DangerZone;distance:number;returning:boolean;outHit:boolean;backHit:boolean}
export class ArlongEncounter extends PatternEncounter {
 private hooks:ArlongHooks;
 private current?:BossAttack;
 private chain?:{attack:BossAttack;remaining:number;index:number;angle:number};
 private bite?:{zone:DangerZone;start:Vector;distance:number;hit:boolean};
 private diving?:{stage:'travel'|'submerged'|'return';target:Vector;elapsed:number};
 private surfacing=false;
 private guide?:FlowField;
 private land:Vector={x:1536,y:1216};
 private rageStarted=false;
 rageTransformed=false;
 tooth?:Tooth;
 trails:{x:number;y:number;life:number}[]=[];
 private trailTimer=0;
 constructor(hooks:ArlongHooks={}){super(ARLONG,ARLONG_ATTACKS);this.hooks=hooks;this.body.swimming=true;}
 get attackId(){return this.current?.id;}
 get submerged(){return this.diving?.stage==='submerged'||this.surfacing;}
 get divingStage(){return this.diving?.stage;}
 override cancel():void{super.cancel();this.current=undefined;this.chain=undefined;this.bite=undefined;this.diving=undefined;this.surfacing=false;this.tooth=undefined;this.trails=[];this.guide=undefined;this.hooks.clear?.();}
 private water(w:CollisionWorld):CollisionWorld{return aquaticWorld(w);}
 private shore(w:CollisionWorld):CollisionWorld{return w instanceof AquaticWorld?w.land:w;}
 override prepare(a:BossAttack,target:Vector,w:CollisionWorld):void{
  this.current=a;this.bite=undefined;this.tooth=undefined;this.surfacing=false;
  const count=a.id==='kiribachi'?3:a.id==='darts'?R.dartsPasses:1;
  this.chain=count>1?{attack:a,remaining:count-1,index:0,angle:Math.atan2(target.y-this.body.y,target.x-this.body.x)}:undefined;
  if(a.id==='dive'){
   const shore=this.shore(w);if(shore.canOccupy(this.body.x,this.body.y,this.body.radius))this.land={x:this.body.x,y:this.body.y};
   const pool=[...ARLONG_POOLS].sort((a,b)=>Math.hypot(a.x+a.width/2-this.body.x,a.y+a.height/2-this.body.y)-Math.hypot(b.x+b.width/2-this.body.x,b.y+b.height/2-this.body.y))[0];
   this.diving={stage:'travel',target:{x:pool.x+pool.width/2,y:pool.y+pool.height/2},elapsed:0};this.state='approach';this.elapsed=0;this.telegraph=undefined;this.impactZone=undefined;this.extraWarnings=[];this.extraImpacts=[];this.guide=new FlowField(this.water(w),this.body.radius,true);return;
  }
  this.preparePart(a,true,target,w);
 }
 private preparePart(a:BossAttack,first:boolean,target:Vector,w:CollisionWorld):void{
  const intermediate=(this.chain?.remaining??0)>0;
  super.prepare({...a,preparation:first?a.preparation:a.id==='darts'?1.2:.5,recovery:intermediate?.18:a.recovery,fixedRecovery:intermediate||a.fixedRecovery},target,this.water(w));
  const z=this.telegraph!.zone;
  if(a.id==='kiribachi'&&this.chain){z.angle=this.chain.angle+[-.25,.25,0][this.chain.index];this.angle=z.angle;}
  if(a.id==='water'){
   const count=this.phase===3?7:5,zones=Array.from({length:count},(_,i)=>({...z,angle:this.angle-.65+1.3*i/(count-1)}));this.telegraph!.zone=zones[0];this.extraWarnings=zones.slice(1);
  }
  if(a.id==='tooth'){
   const water=this.water(w);let length=0;
   for(let d=4;d<=a.length;d+=4){if(!water.canOccupy(z.x+Math.cos(z.angle)*d,z.y+Math.sin(z.angle)*d,z.width/2))break;length=d;}
   z.length=length;this.telegraph!.attack.impact=Math.max(.4,length*2/R.toothSpeed+.1);
  }
 }
 private hurtPlayer(p:Player,damage:number,name:string):void{
  if(p.hp<=0||p.hurtTimer>0||isInvulnerable(p))return;
  p.hp=Math.max(0,p.hp-receivedDamage(damage,p.stats.armor));p.hurtTimer=.65;p.lastHit=name;p.damageNoticeFor=1.2;
 }
 private nearestShore(w:CollisionWorld):Vector{
  const shore=this.shore(w),water=this.water(w);
  for(const radius of [64,128,192,256,384,512])for(let i=0;i<24;i++){const a=i*Math.PI/12,p={x:this.body.x+Math.cos(a)*radius,y:this.body.y+Math.sin(a)*radius};if(shore.canOccupy(p.x,p.y,this.body.radius)&&water.segmentClear(this.body.x,this.body.y,p.x,p.y,this.body.radius))return p;}
  return this.land;
 }
 private diveExit(p:Player,w:CollisionWorld):void{
  const shore=this.shore(w),water=this.water(w),base=Math.atan2(p.y-this.body.y,p.x-this.body.x);
  let exit:Vector|undefined;
  for(const radius of [180,220,260]){for(const offset of [0,.6,-.6,1.2,-1.2,Math.PI]){const angle=base+offset,to={x:p.x+Math.cos(angle)*radius,y:p.y+Math.sin(angle)*radius};if(shore.canOccupy(to.x,to.y,this.body.radius)&&water.segmentClear(this.body.x,this.body.y,to.x,to.y,this.body.radius)){exit=to;break;}}if(exit)break;}
  exit??=this.nearestShore(w);this.land={...exit};const distance=Math.hypot(exit.x-this.body.x,exit.y-this.body.y);
  this.diving=undefined;this.surfacing=true;this.guide=undefined;
  super.prepare({...this.current!,length:distance+this.body.radius,impact:distance/820+.3},exit,water);
 }
 private tickDive(dt:number,p:Player,w:CollisionWorld):void{
  const dive=this.diving!,water=this.water(w);dive.elapsed+=dt;this.body.flash=Math.max(0,this.body.flash-dt);
  if(dive.stage==='submerged'){if(dive.elapsed>=R.submergeSeconds)this.diveExit(p,w);return;}
  this.guide??=new FlowField(water,this.body.radius,true);this.guide.update(dive.target,dt);const d=this.guide.direction(this.body,dive.target,this.body.radius);
  const distance=Math.hypot(this.body.x-dive.target.x,this.body.y-dive.target.y),step=Math.min(distance,R.diveSpeed*dt);
  water.moveCircle(this.body,d.x*step,d.y*step,this.body.radius);this.angle=Math.atan2(d.y,d.x);
  if(dive.stage==='return'&&dive.elapsed>=R.diveTravelTimeout&&!this.shore(w).canOccupy(this.body.x,this.body.y,this.body.radius)){dive.target=this.nearestShore(w);dive.elapsed=0;}
  if(distance<16||(dive.stage!=='return'&&dive.elapsed>=R.diveTravelTimeout)){
   if(dive.stage==='return'){this.diving=undefined;this.state='recovering';this.elapsed=0;this.body.statuses={exposed:1.3};}
   else{dive.stage='submerged';dive.elapsed=0;}
  }
 }
 private tickTooth(dt:number,p:Player):void{
  const t=this.tooth!;if(t.path.length<=0){this.tooth=undefined;return;}const previous={x:t.x,y:t.y};t.distance=Math.max(0,Math.min(t.path.length,t.distance+(t.returning?-1:1)*R.toothSpeed*dt));
  t.x=t.path.x+Math.cos(t.path.angle)*t.distance;t.y=t.path.y+Math.sin(t.path.angle)*t.distance;
  const zone={...t.path,x:previous.x,y:previous.y,angle:Math.atan2(t.y-previous.y,t.x-previous.x),length:Math.hypot(t.x-previous.x,t.y-previous.y)};
  const already=t.returning?t.backHit:t.outHit;
  if(!already&&inDanger(zone,p)){if(t.returning)t.backHit=true;else t.outHit=true;this.hurtPlayer(p,this.current!.damage,'Shark on Tooth');}
  if(t.distance>=t.path.length)t.returning=true;else if(t.returning&&t.distance<=0)this.tooth=undefined;
 }
 override tick(dt:number,p:Player,w:CollisionWorld,direction:(from:Vector)=>Vector,reinforce:()=>void):void{
  const water=this.water(w);
  if(!this.body.active||this.body.hp<=0||p.hp<=0){super.tick(dt,p,water,direction,reinforce);return;}
  this.trails=this.trails.filter(t=>(t.life-=dt)>0);this.trailTimer-=dt;
  if(!this.rageStarted&&this.body.hp/this.body.maxHp<=.33){this.cancel();this.body.statuses=undefined;this.rageStarted=true;this.current=ARLONG_RAGE;super.prepare(ARLONG_RAGE,p,water);}
  if(this.diving){this.tickDive(dt,p,w);return;}
  const before=this.state,zones=this.telegraph?[this.telegraph.zone,...this.extraWarnings].map(z=>({...z})):[];
  if(before==='impact'&&this.bite){
   const b=this.bite,step=Math.min(R.biteDistance-b.distance,R.biteSpeed*dt),from={x:this.body.x,y:this.body.y};
   water.moveCircle(this.body,Math.cos(b.zone.angle)*step,Math.sin(b.zone.angle)*step,this.body.radius);b.distance+=step;
   if(!b.hit&&(b.distance>=R.biteDistance||Math.hypot(from.x-this.body.x,from.y-this.body.y)<step*.5)){b.hit=true;if(inDanger(b.zone,p)&&water.segmentClear(b.start.x,b.start.y,p.x,p.y,2))this.hurtPlayer(p,ARLONG_ATTACKS[0].damage,ARLONG_ATTACKS[0].name);}
  }
  if(this.tooth)this.tickTooth(dt,p);
  if(before==='impact'&&this.current?.animation==='charge'&&this.trailTimer<=0){this.trails.push({x:this.body.x,y:this.body.y,life:.35});this.trails=this.trails.slice(-12);this.trailTimer=.04;}
  super.tick(dt,p,water,from=>{const d=direction(from),scale=1+.06*(this.phase-1);return {x:d.x*scale,y:d.y*scale};},reinforce);
  if(before==='preparing'&&this.state==='impact'){
   const a=this.current!;this.surfacing=false;
   if(a.id==='water')for(const z of zones)this.hooks.fire?.(this.body,z.angle,a.damage);
   if(a.id==='tooth')this.tooth={x:zones[0].x,y:zones[0].y,path:zones[0],distance:0,returning:false,outHit:false,backHit:false};
   if(a.id==='bite')this.bite={zone:zones[0],start:{x:this.body.x,y:this.body.y},distance:0,hit:false};
   if(a.id==='rage'&&!this.rageTransformed){this.rageTransformed=true;this.hooks.rage?.();}
  }
  if(this.bite&&this.state==='impact')this.impactZone=this.bite.zone;
  if(before==='impact'&&(this.state==='recovering'||this.state==='stunned')){
   this.bite=undefined;
   if(this.current?.id==='dive'&&!this.shore(w).canOccupy(this.body.x,this.body.y,this.body.radius)){this.diving={stage:'return',target:{...this.land},elapsed:0};this.guide=new FlowField(water,this.body.radius,true);}
  }
  if(this.state==='stunned')this.chain=undefined;
  if(before==='recovering'&&this.state==='approach'&&this.chain){
   if(this.chain.remaining>0){this.chain.remaining--;this.chain.index++;this.preparePart(this.chain.attack,false,p,w);}else this.chain=undefined;
  }
 }
}
