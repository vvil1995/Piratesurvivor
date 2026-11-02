import {FRUITS,FRUIT_RULES as R} from '../../content/fruits.ts';
import type {Player,Enemy} from '../core/types.ts';
import type {CollisionWorld} from '../world/world.ts';
import {damageEnemy} from './hits.ts';
export interface FruitState {id:string;proc:number;period:number;explosion:number;evade:number;evadeBudget:number;queue:Enemy[];burns:{enemy:Enemy;id:number;life:number;tick:number}[];visuals:{x:number;y:number;kind:string;life:number}[];controls:{enemy:Enemy;id:number}[]}
export function fruitState(p:Player):FruitState {return p.fruitState??= {id:p.fruit??'',proc:0,period:1,explosion:0,evade:0,evadeBudget:0,queue:[],burns:[],visuals:[],controls:[]};}
export function clearFruit(p:Player){const s=p.fruitState;if(s)for(const c of s.controls)if(c.enemy.id===c.id)c.enemy.fruitControl=undefined;p.fruitState=undefined;}
export function fruitHit(p:Player,e:Enemy,actual:number,random:()=>number){if(!p.fruit||!['mera','goro','hie'].includes(p.fruit)||actual<=0||e.kind==='chest')return;const s=fruitState(p);if(s.proc>0||random()>=R.procChance)return;s.proc=R.procCooldown;if(s.queue.length<4)s.queue.push(e);}
export function tickFruit(p:Player,enemies:Enemy[],world:CollisionWorld,dt:number,onKill:(e:Enemy)=>void,random:()=>number){
 if(!p.fruit||p.hp<=0){clearFruit(p);return;}const s=fruitState(p),f=FRUITS[p.fruit];if(!f)return;
 s.proc=Math.max(0,s.proc-dt);s.explosion=Math.max(0,s.explosion-dt);s.evade=Math.max(0,s.evade-dt);s.period-=dt;
 for(const v of s.visuals)v.life-=dt;s.visuals=s.visuals.filter(v=>v.life>0);
 const visual=(e:{x:number;y:number},kind=p.fruit!)=>{if(s.visuals.length<24)s.visuals.push({x:e.x,y:e.y,kind,life:kind==='moku'?R.smokeDuration:.45});};
 const hit=(e:Enemy,amount:number,push=0)=>damageEnemy(p,e,p.stats.damage*amount,push,p,world,onKill,random,true,true);
 const control=(e:Enemy,key:'slow'|'stun'|'confuse',duration:number)=>{if(e.kind)return;let c=s.controls.find(c=>c.enemy===e&&c.id===e.id);if(!c){c={enemy:e,id:e.id};s.controls.push(c);}if(e.fruitControl?.id!==e.id)e.fruitControl={id:e.id};e.fruitControl![key]=Math.max(e.fruitControl![key]??0,duration);};
 const cloud=s.visuals.find(v=>v.kind==='moku');if(p.fruit==='moku'&&cloud)for(const e of enemies)if(e.active&&!e.kind&&Math.hypot(e.x-cloud.x,e.y-cloud.y)<f.radius&&world.segmentClear(cloud.x,cloud.y,e.x,e.y,2,'attack'))control(e,'confuse',cloud.life);
 s.controls=s.controls.filter(c=>c.enemy.active&&c.enemy.id===c.id);if(s.controls.length>256)s.controls.splice(0,s.controls.length-256);
 for(const e of s.queue.splice(0)){
  if(p.fruit==='mera'){if(e.active){const old=s.burns.find(b=>b.enemy===e&&b.id===e.id);if(old)old.life=R.burnDuration;else if(s.burns.length<24)s.burns.push({enemy:e,id:e.id,life:R.burnDuration,tick:0});}if(s.explosion<=0){s.explosion=f.cooldown;visual(e);for(const n of enemies)if(n.active&&Math.hypot(n.x-e.x,n.y-e.y)<=f.radius&&world.segmentClear(e.x,e.y,n.x,n.y,2,'attack'))hit(n,f.damage);}}
  if(p.fruit==='goro'){let at=e;const seen=new Set<Enemy>([e]);visual(e);hit(e,f.damage);for(let i=0;i<R.chainTargets;i++){const next=enemies.filter(n=>n.active&&!seen.has(n)&&n.kind!=='chest'&&Math.hypot(n.x-at.x,n.y-at.y)<R.chainRadius&&world.segmentClear(at.x,at.y,n.x,n.y,2,'attack')).sort((a,b)=>Math.hypot(a.x-at.x,a.y-at.y)-Math.hypot(b.x-at.x,b.y-at.y))[0];if(!next)break;seen.add(next);at=next;visual(next);hit(next,f.damage);}}
  if(p.fruit==='hie'){control(e,'slow',R.controlDuration);if(random()<.3)control(e,'stun',.35);visual(e);}
 }
 for(const b of s.burns){b.life-=dt;b.tick-=dt;if(b.enemy.active&&b.enemy.id===b.id&&b.life>0&&b.tick<=0){b.tick=R.burnTick;visual(b.enemy);hit(b.enemy,R.burnDamage);}}s.burns=s.burns.filter(b=>b.life>0&&b.enemy.active&&b.enemy.id===b.id);
 if(['suna','moku','nikyu'].includes(p.fruit)&&s.period<=0){s.period=f.cooldown;visual(p);if(p.fruit==='moku')s.evade=R.smokeDuration;for(const e of enemies)if(e.active&&e.kind!=='chest'&&Math.hypot(e.x-p.x,e.y-p.y)<f.radius&&world.segmentClear(p.x,p.y,e.x,e.y,2,'attack')){if(p.fruit==='moku')control(e,'confuse',R.smokeDuration);else{hit(e,f.damage,p.fruit==='nikyu'?65:15);if(p.fruit==='suna')control(e,'slow',R.controlDuration);}}}
}
