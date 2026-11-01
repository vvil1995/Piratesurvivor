import { MORGAN } from '../../content/bosses/morgan.ts';
import { ROGER_RULES as R,summonCount,hordeWorldCount } from '../../content/bosses/roger.ts';
import { RogerEncounter } from '../bosses/roger.ts';
import { MorganEncounter } from '../bosses/morgan.ts';
import { BuggyEncounter } from '../bosses/buggy.ts';
import { KuroEncounter } from '../bosses/kuro.ts';
import { KriegEncounter } from '../bosses/krieg.ts';
import { ArlongEncounter } from '../bosses/arlong.ts';
import type { PatternEncounter } from '../bosses/pattern-encounter.ts';
import type { Enemy,Player,Vector } from '../core/types.ts';
import { RogerArenaWorld,ROGER_ARENA } from '../world/roger-arena.ts';
import { aquaticWorld } from '../world/aquatic.ts';
import { FlowField } from '../navigation/flow-field.ts';
export const SUMMON_TYPES=['morgan','buggy','kuro','krieg','arlong'] as const;
export type SummonType=typeof SUMMON_TYPES[number];
export interface Summoned {boss:PatternEncounter;remaining:number;field:FlowField;deathFor:number;ambientFor:number}
export interface ChallengeHooks {
 fire:(id:number,from:Vector,angle:number,damage:number,water:boolean)=>void;
 clear:(id:number)=>void;
 reflect:(body:Enemy,damage:number)=>void;
 counter:(from:Vector)=>boolean;
 absorb?:(position:Vector,damage:number)=>boolean;
 reinforce:(boss:PatternEncounter)=>void;
}
export class RogerChallenge {
 readonly roger=new RogerEncounter();readonly world:RogerArenaWorld;
 readonly summons:Summoned[]=[];seconds=0;bossesDefeated=0;stopped=false;nextSummon=40;waves=0;
 private serial=-2100000;private previous:SummonType[]=[];private spawnTimer=0;private field:FlowField;private fields=new Map<string,FlowField>();
 private random:()=>number;private hooks:ChallengeHooks;
 constructor(seed:number,random:()=>number,hooks:ChallengeHooks){this.random=random;this.hooks=hooks;this.world=new RogerArenaWorld(seed);Object.assign(this.roger.body,ROGER_ARENA.bossSpawn);this.field=new FlowField(this.world,25,true);}
 get damage(){return this.roger.body.damageTaken??0;}
 get bodies():Enemy[]{return [this.roger.body,...this.summons.filter(s=>s.remaining<=0&&s.boss.body.active).map(s=>s.boss.body)];}
 get living(){return this.summons.filter(s=>s.boss.state!=='dead').length;}
 get worlds(){return hordeWorldCount(this.seconds);}
 spawnBudget(dt:number):number{if(this.stopped)return 0;this.spawnTimer-=dt;if(this.spawnTimer>0)return 0;this.spawnTimer=Math.max(.24,.9-this.seconds/900);return this.seconds>=180?2:1;}
 private create(type:SummonType):PatternEncounter{
  const id=--this.serial,fire=(water:boolean)=>(from:Vector,angle:number,damage:number)=>this.hooks.fire(id,from,angle,damage,water),clear=()=>this.hooks.clear(id);
  let boss:PatternEncounter;
  if(type==='morgan')boss=new MorganEncounter();
  else if(type==='buggy')boss=new BuggyEncounter({reflectHit:d=>this.hooks.reflect(boss.body,d),counter:this.hooks.counter,absorb:this.hooks.absorb});
  else if(type==='kuro')boss=new KuroEncounter();
  else if(type==='krieg')boss=new KriegEncounter({fire:fire(false),clear});
  else boss=new ArlongEncounter({fire:fire(true),clear});
  boss.body.id=id;boss.body.hp=boss.body.maxHp=boss.profile.hp*R.bossHp;return boss;
 }
 private navigation(boss:PatternEncounter):FlowField{
  const key=`${boss.body.swimming?'water':'land'}:${boss.body.radius}`;
  let field=this.fields.get(key);if(!field){field=new FlowField(boss.body.swimming?aquaticWorld(this.world):this.world,boss.body.radius,true);this.fields.set(key,field);}return field;
 }
 private position(p:Player):Vector|undefined{
  for(let i=0;i<160;i++){
   const q={x:224+this.random()*2624,y:576+this.random()*1344};
   if(Math.hypot(q.x-p.x,q.y-p.y)<380||Math.hypot(q.x-this.roger.body.x,q.y-this.roger.body.y)<150||this.summons.some(s=>s.boss.state!=='dead'&&Math.hypot(q.x-s.boss.body.x,q.y-s.boss.body.y)<180))continue;
   if(this.world.canOccupy(q.x,q.y,28))return q;
  }return;
 }
 summon(p:Player):void{
  const seats=Math.min(summonCount(this.seconds),R.bossCap-this.living);if(seats<=0)return;
  const pool=[...SUMMON_TYPES];for(let i=pool.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  if(this.seconds<480)pool.sort((a,b)=>Number(this.previous.includes(a))-Number(this.previous.includes(b)));
  const selected:SummonType[]=[];
  for(const type of pool.slice(0,seats)){
   const at=this.position(p);if(!at)continue;const boss=this.create(type);Object.assign(boss.body,at);
   this.summons.push({boss,remaining:R.summonSeconds,deathFor:0,ambientFor:6,field:this.navigation(boss)});selected.push(type);
  }
  this.previous=selected;this.roger.summoningFor=2;this.waves++;
 }
 defeated(body:Enemy):boolean{
  const s=this.summons.find(s=>s.boss.body===body);if(!s||s.boss.state==='dead')return false;
  s.boss.defeated();this.hooks.clear(body.id);this.bossesDefeated++;return true;
 }
 tick(dt:number,p:Player):void{
  if(this.stopped||p.hp<=0)return;this.seconds+=dt;
  while(this.seconds+1e-7>=this.nextSummon){this.summon(p);this.nextSummon+=R.summonInterval;}
  this.field.update(p,dt);for(const field of this.fields.values())field.update(p,dt);
  this.roger.body.statuses??={};this.roger.body.statuses.stun=Math.max(0,(this.roger.body.statuses.stun??0)-dt);
  this.roger.tick(dt,p,this.world,from=>(this.roger.body.statuses?.stun??0)>0?{x:0,y:0}:this.field.direction(from,p,25),()=>{});
  for(const s of this.summons){
   if(s.boss.state==='dead'){s.deathFor+=dt;s.boss.elapsed+=dt;continue;}
   if(s.remaining>0){s.remaining=Math.max(0,s.remaining-dt);continue;}
   s.boss.body.statuses??={};s.boss.body.statuses.stun=Math.max(0,(s.boss.body.statuses.stun??0)-dt);
   if(s.boss.profile.id==='morgan'){s.ambientFor-=dt;if(s.ambientFor<=0){s.ambientFor=MORGAN.ambientReinforcementSeconds;this.hooks.reinforce(s.boss);}}
   // La aceleración se aplica a la simulación original completa, con suelo de aviso en tiempo real.
   const fixed=s.boss instanceof KuroEncounter&&s.boss.exhausted||s.boss instanceof KriegEncounter&&s.boss.attackId==='shield'&&s.boss.state==='impact';
   const steps=Math.max(1,Math.ceil(dt/(1/60))),step=dt*(fixed?1:R.bossSpeed)/steps;
   for(let i=0;i<steps;i++){
    if(s.boss.telegraph)s.boss.telegraph.attack.preparation=Math.max((s.boss.telegraph.attack.minimumWarning??R.minimumWarning)*R.bossSpeed,s.boss.telegraph.attack.preparation);
    s.boss.tick(step,p,this.world,from=>(s.boss.body.statuses?.stun??0)>0?{x:0,y:0}:s.field.direction(from,p,s.boss.body.radius),()=>this.hooks.reinforce(s.boss));
   }
  }
  for(let i=this.summons.length-1;i>=0;i--)if(this.summons[i].deathFor>=1.3)this.summons.splice(i,1);
 }
 stop():void{if(this.stopped)return;this.stopped=true;this.roger.cancel();for(const s of this.summons){s.boss.cancel();this.hooks.clear(s.boss.body.id);}}
}
