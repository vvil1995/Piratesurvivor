import { PatternEncounter } from './pattern-encounter.ts';
import { ROGER,ROGER_ATTACKS } from '../../content/bosses/roger.ts';
import type { BossAttack,DangerZone } from './telegraphs.ts';
import { inDanger } from './telegraphs.ts';
import type { Player,Vector } from '../core/types.ts';
import type { CollisionWorld } from '../world/world.ts';
import { isInvulnerable } from '../systems/guards.ts';
import { receivedDamage } from '../systems/stats.ts';
export class RogerEncounter extends PatternEncounter {
 seconds=0;summoningFor=0;private sequence=0;private current='';private storm=0;private ringHit=false;
 private sectors:DangerZone[]=[];
 private ringOrigin:Vector={x:0,y:0};ring?:DangerZone;
 constructor(){super(ROGER,ROGER_ATTACKS);this.body.immortal=true;this.body.damageTaken=0;}
 get attackId(){return this.current;}
 protected override encounterPhase():number{return this.seconds>=240?3:this.seconds>=60?2:1;}
 override prepare(a:BossAttack,p:Vector,w:CollisionWorld):void{
  if(a.id==='king'){
   const ids=['king','kamusari',...(this.seconds>=60?['haki']:[]),...(this.seconds>=120?['storm']:[]),...(this.seconds>=180?['will']:[])];
   const id=ids[this.sequence++%ids.length];a=ROGER_ATTACKS.find(a=>a.id===id)!;
  }
  this.current=a.id;if(a.id==='storm'&&!this.storm)this.storm=this.seconds>=240?6:4;
  super.prepare(a,p,w);this.ringHit=false;this.ring=undefined;this.sectors=[];this.ringOrigin={x:this.body.x,y:this.body.y};
  if(a.id==='will'){
   const z=this.telegraph!.zone,ys=[Math.max(400,Math.min(1700,p.y)),400,1800];
   const zones=ys.map((y,i)=>({...z,x:800+i*380,y,angle:0}));this.telegraph!.zone=zones[0];this.extraWarnings=zones.slice(1);
  }
 }
 override cancel():void{super.cancel();this.storm=0;this.ring=undefined;this.sectors=[];this.summoningFor=0;}
 private hurtWave(p:Player,z:DangerZone):void{
  if(this.ringHit||!inDanger(z,p)||p.hurtTimer>0||isInvulnerable(p))return;
  this.ringHit=true;p.hp=Math.max(0,p.hp-receivedDamage(48,p.stats.armor));p.hurtTimer=.65;p.lastHit=this.current;p.damageNoticeFor=1.2;
 }
 override tick(dt:number,p:Player,w:CollisionWorld,direction:(from:Vector)=>Vector,reinforce:()=>void):void{
  this.seconds+=dt;this.summoningFor=Math.max(0,this.summoningFor-dt);const before=this.state;
  const willZones=this.telegraph?[this.telegraph.zone,...this.extraWarnings].map(z=>({...z})):[];
  super.tick(dt,p,w,direction,reinforce);
  if(before==='preparing'&&this.state==='impact'&&this.current==='will'){this.sectors=willZones;this.ringHit=false;}
  if(this.state==='impact'&&this.current==='haki'){
   const r=Math.min(450,this.elapsed/1.5*450);this.ring={...this.ringOrigin,shape:'arc',angle:0,length:0,width:0,radius:r,innerRadius:Math.max(0,r-24),arc:Math.PI*2};this.hurtWave(p,this.ring);
  }else this.ring=undefined;
  if(this.state==='impact'&&this.current==='will'){const sector=this.sectors[Math.floor(this.elapsed/.25)];this.extraImpacts=sector?[sector]:[];if(sector)this.hurtWave(p,sector);}
  if(before==='recovering'&&this.state==='approach'&&this.current==='storm'&&--this.storm>0){super.prepare(ROGER_ATTACKS.find(a=>a.id==='storm')!,p,w);}
 }
}
