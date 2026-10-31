import { KURO, KURO_ATTACKS } from '../../content/bosses/kuro.ts';
import { PatternEncounter } from './pattern-encounter.ts';
import type { BossAttack } from './telegraphs.ts';
import type { Player, Vector } from '../core/types.ts';
import type { CollisionWorld } from '../world/world.ts';
/** Only Kuro chains sub-attacks: each pass has its own fixed telegraph and recovery. */
export class KuroEncounter extends PatternEncounter {
 private chain?:{attack:BossAttack;remaining:number};
 trails:{x:number;y:number;life:number}[]=[];
 private trailClock=0;
 constructor(){super(KURO,KURO_ATTACKS);}
 override get moveName():string{return this.state==='dead'?'VICTORIA · RUTA A BARATIE':super.moveName;}
 override cancel():void{super.cancel();this.chain=undefined;this.trails=[];}
 override prepare(attack:BossAttack,target:Vector,world:CollisionWorld):void{
  this.chain=attack.id==='shakushi'||attack.id==='flurry'?{attack,remaining:attack.id==='shakushi'?2:3}:undefined;
  super.prepare(this.subAttack(attack,true),target,world);
  if(attack.id==='cross'&&this.telegraph){
   const z=this.telegraph.zone;z.angle-=Math.PI/4;z.x=this.body.x-Math.cos(z.angle)*z.length/2;z.y=this.body.y-Math.sin(z.angle)*z.length/2;
   const a=z.angle+Math.PI/2;this.extraWarnings=[{...z,angle:a,x:this.body.x-Math.cos(a)*z.length/2,y:this.body.y-Math.sin(a)*z.length/2}];
  }
 }
 private subAttack(a:BossAttack,first:boolean):BossAttack{
  return {...a,preparation:first?a.preparation:a.id==='shakushi'?.8:.38,recovery:(this.chain?.remaining??0)>0?.18:a.recovery};
 }
 override tick(dt:number,p:Player,w:CollisionWorld,direction:(from:Vector)=>Vector,reinforce:()=>void):void{
  this.trails=this.trails.filter(t=>(t.life-=dt)>0);this.trailClock-=dt;
  const moving=this.state==='impact'&&this.impactZone?.shape==='line';
  if(moving&&this.trailClock<=0){if(this.trails.length<12)this.trails.push({x:this.body.x,y:this.body.y,life:.3});this.trailClock=.06;}
  const before=this.state,ghost=before==='preparing'&&this.telegraph?.attack.id==='ghost',from={x:this.body.x,y:this.body.y};
  super.tick(dt,p,w,from=>{const d=direction(from),speed=1+.07*(this.phase-1);return {x:d.x*speed,y:d.y*speed};},reinforce);
  if(ghost&&this.state==='impact'){
   // The underlying split relocation checks full body clearance and segment collision.
   for(let i=0;i<6;i++)this.trails.push({x:from.x+(this.body.x-from.x)*i/6,y:from.y+(this.body.y-from.y)*i/6,life:.35});
   this.trails=this.trails.slice(-12);
  }
  if(!this.body.active||p.hp<=0)return;
  if(before==='recovering'&&this.state==='approach'&&this.chain){
   const {attack,remaining}=this.chain;
   if(remaining>0){this.chain.remaining--;super.prepare(this.subAttack(attack,false),p,w);}
   else this.chain=undefined;
  }
 }
}
