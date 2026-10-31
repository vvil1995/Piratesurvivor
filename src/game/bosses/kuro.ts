import { KURO, KURO_ATTACKS } from '../../content/bosses/kuro.ts';
import { PatternEncounter } from './pattern-encounter.ts';
import type { BossAttack } from './telegraphs.ts';
import type { Player, Vector } from '../core/types.ts';
import type { CollisionWorld } from '../world/world.ts';
/** Cada corte/pasada conserva su propio aviso fijado; nunca hay dos impactos simultáneos. */
export class KuroEncounter extends PatternEncounter {
 private chain?:{attack:BossAttack;remaining:number;index:number;target:Vector;angle:number};
 private currentId?:string;
 trails:{x:number;y:number;life:number}[]=[];
 private trailClock=0;
 get exhausted():boolean{return this.state==='recovering'&&this.currentId==='shakushi'&&!this.chain;}
 get attackId():string|undefined{return this.currentId;}
 constructor(){super(KURO,KURO_ATTACKS);}
 override get moveName():string{return this.state==='dead'?'VICTORIA · RUTA A BARATIE':this.exhausted?'ESGOTAT · CONTRAATACA':super.moveName;}
 override cancel():void{super.cancel();this.chain=undefined;this.currentId=undefined;this.trails=[];}
 private trail(from:Vector,to:Vector):void {
  for(let i=0;i<6;i++)this.trails.push({x:from.x+(to.x-from.x)*i/6,y:from.y+(to.y-from.y)*i/6,life:.35});
  this.trails=this.trails.slice(-12);
 }
 /** No teletransporta sobre el jugador, a través de obstáculos ni fuera de límites. */
 private nearby(target:Vector,world:CollisionWorld):Vector {
  const angle=Math.atan2(this.body.y-target.y,this.body.x-target.x);
  for(const radius of [125,160,200])for(const offset of [Math.PI/2,-Math.PI/2,0,Math.PI]){
   const a=angle+offset,to={x:target.x+Math.cos(a)*radius,y:target.y+Math.sin(a)*radius};
   if(world.canOccupy(to.x,to.y,this.body.radius)&&world.segmentClear(this.body.x,this.body.y,to.x,to.y,this.body.radius))return to;
  }
  return {x:this.body.x,y:this.body.y};
 }
 override prepare(attack:BossAttack,target:Vector,world:CollisionWorld):void{
  this.currentId=attack.id;
  const count=attack.id==='shakushi'?5:attack.id==='flurry'?4:attack.id==='cross'?2:1;
  this.chain=count>1?{attack,remaining:count-1,index:0,target:{...target},angle:Math.atan2(target.y-this.body.y,target.x-this.body.x)}:undefined;
  if(attack.id==='surprise'){
   const from={x:this.body.x,y:this.body.y},to=this.nearby(target,world);this.body.x=to.x;this.body.y=to.y;this.trail(from,to);
  }
  this.preparePart(attack,true,target,world);
 }
 private preparePart(a:BossAttack,first:boolean,target:Vector,w:CollisionWorld):void{
  const chain=this.chain,intermediate=(chain?.remaining??0)>0;
  const sub={...a,preparation:first?a.preparation:a.id==='shakushi'?1:.5,recovery:intermediate?.18:a.recovery,fixedRecovery:intermediate||a.fixedRecovery};
  super.prepare(sub,a.id==='ghost'?this.nearby(target,w):chain&&a.id!=='shakushi'?chain.target:target,w);
  if(a.id==='cross'&&this.telegraph&&chain){
   const z=this.telegraph.zone;z.angle=chain.angle+(chain.index===0?-Math.PI/4:Math.PI/4);
   z.x=this.body.x+Math.cos(chain.angle)*60-Math.cos(z.angle)*z.length/2;z.y=this.body.y+Math.sin(chain.angle)*60-Math.sin(z.angle)*z.length/2;
  }
  // El combo no gira siguiendo al jugador una vez iniciado.
  if(a.id==='flurry'&&this.telegraph&&chain)this.telegraph.zone.angle=chain.angle;
 }
 override tick(dt:number,p:Player,w:CollisionWorld,direction:(from:Vector)=>Vector,reinforce:()=>void):void{
  this.trails=this.trails.filter(t=>(t.life-=dt)>0);this.trailClock-=dt;
  const moving=this.state==='impact'&&this.impactZone?.shape==='line';
  if(moving&&this.trailClock<=0){if(this.trails.length<12)this.trails.push({x:this.body.x,y:this.body.y,life:.3});this.trailClock=.035;}
  const before=this.state,ghost=before==='preparing'&&this.currentId==='ghost',from={x:this.body.x,y:this.body.y};
  super.tick(dt,p,w,from=>{const d=direction(from),speed=1+.07*(this.phase-1);return {x:d.x*speed,y:d.y*speed};},reinforce);
  if(ghost&&this.state==='impact')this.trail(from,this.body);
  if(!this.body.active||p.hp<=0)return;
  // Un choque termina la secuencia y conserva el aturdimiento existente.
  if(this.state==='stunned')this.chain=undefined;
  if(before==='recovering'&&this.state==='approach'&&this.chain){
   if(this.chain.remaining>0){this.chain.remaining--;this.chain.index++;this.preparePart(this.chain.attack,false,p,w);}
   else this.chain=undefined;
  }
  // Solo la última pasada tiene agotamiento de dos segundos sin escalado por fase.
  if(this.state==='recovering'&&this.currentId==='shakushi'&&this.chain?.remaining===0)this.chain=undefined;
 }
}
