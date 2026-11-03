import { ABILITIES } from '../../content/attacks.ts';
import hammer from '../../assets/effects/hammer.png';
import rope from '../../assets/effects/rope.png';
import decoy from '../../assets/effects/decoy.png';
import loot from '../../assets/effects/loot.png';
import pepper from '../../assets/effects/pepper.png';
import Phaser from 'phaser';
import sheet from '../../assets/effects/crew-vfx.png';
import type {Run} from '../core/run.ts';
import type {Strike,AreaEffect,Projectile,Vector} from '../core/types.ts';
export const CREW_EFFECT_CAP=160;
export class CrewEffects{
 private run?:Run;private world?:Run['world'];private clock=0;private lastTime=0;
 private hits=new WeakMap<Projectile,{hits:number;serial:number}>();
 private bursts:{x:number;y:number;life:number;radius:number;kind:"blast"|"smoke"|"spark"|"pepper"}[]=[];
 private sprites:Phaser.GameObjects.Image[]=[];private used=0;private scene:Phaser.Scene;
 get diagnostics(){return {allocated:this.sprites.length,visible:this.sprites.filter(s=>s.visible).map(s=>s.texture.key+':'+s.frame.name)};}
 constructor(scene:Phaser.Scene){this.scene=scene;}
 static preload(scene:Phaser.Scene){for(const [id,url]of Object.entries({hammer,rope,decoy,loot,pepper}))scene.load.image('crew-'+id,url);scene.load.spritesheet('crew-vfx',sheet,{frameWidth:128,frameHeight:128});}
 begin(run?:Run,origin:Vector={x:0,y:0}){
  this.used=0;for(const s of this.sprites)s.setVisible(false);
  if(run!==this.run){this.bursts=[];this.hits=new WeakMap();this.run=run;this.clock=0;this.lastTime=run?.time??0;}
  if(run?.world!==this.world){this.bursts=[];this.world=run?.world;}
  if(!run)return;const dt=Math.min(.1,Math.max(0,run.time-this.lastTime));this.lastTime=run.time;this.clock+=dt*1000;
  for(const p of run.projectiles.items){const previous=this.hits.get(p),old=previous?.serial===(p.visualSerial??0)?previous.hits:0;if(p.hit.size>old&&!p.hostile&&p.abilityId&&ABILITIES[p.abilityId]?.visual==='projectile'){
    const params=ABILITIES[p.abilityId].levels[(p.level??1)-1];if(this.bursts.length<32)this.bursts.push({x:p.x,y:p.y,life:.3,radius:params.splash||18,kind:p.abilityId==='irritant-shot'?'pepper':p.abilityId==='smoke-shot'?'smoke':p.abilityId==='kayaku-boshi'?'blast':'spark'});
   }if(previous){previous.hits=p.hit.size;previous.serial=p.visualSerial??0;}else this.hits.set(p,{hits:p.hit.size,serial:p.visualSerial??0});}
  for(const b of this.bursts){if(run.status==='playing')b.life-=Math.min(.1,dt);if(b.life>0)this.draw(b.kind==='smoke'?5:4,b.kind==='spark'?0:Math.floor((.3-b.life)/.3*4),b.x-origin.x,b.y-origin.y-18,b.kind==='spark'?22:b.radius*2,0,Math.min(1,b.life/.05),b.kind==='pepper'?'crew-pepper':'crew-vfx');}
  this.bursts=this.bursts.filter(b=>b.life>0);
 }
 private draw(row:number,frame:number,x:number,y:number,width:number,angle=0,alpha=1,texture='crew-vfx',flipY=false){
  if(this.used>=CREW_EFFECT_CAP)return;const s=this.sprites[this.used]??(this.sprites[this.used]=this.scene.add.image(0,0,'crew-vfx'));this.used++;
  s.setFlip(false,flipY).setTexture(texture,texture==='crew-vfx'?row*4+Math.min(3,Math.max(0,frame)):undefined).setPosition(x,y).setOrigin(.5).setScale(1).setDisplaySize(width,width).setRotation(angle).setAlpha(Math.max(0,Math.min(1,alpha))).setTint(0xffffff).setVisible(true).setDepth(y+1020);
 }
 strike(s:Strike,x:number,y:number,origin:Vector):boolean{
  if(s.abilityId==='sword-guard'){this.guard(x,y);return true;}
  if(s.abilityId==='usopp-hammer'){const t=1-s.life/.18;this.draw(0,0,x+Math.cos(s.angle)*s.reach*.55,y-20+Math.sin(s.angle)*s.reach*.55,Math.min(110,s.reach),s.angle+Math.PI+(t-.5)*.6,Math.min(1,s.life/.04),'crew-hammer');return true;}
  if(s.abilityId==='rope-bind'){this.draw(0,0,s.impact.x-origin.x,s.impact.y-origin.y-18,Math.min(85,s.reach),0,Math.min(1,s.life/.04),'crew-rope');return true;}
  const row=s.visual==='slash'?0:s.visual==='kick'?1:s.visual==='staff'?2:-1;if(row<0)return false;
  const progress=Math.max(0,Math.min(.999,1-s.life/(s.behavior==='dash'||s.behavior==='evade'?.2:.18))),frame=Math.floor(progress*4);
  const sweep=s.behavior==='sweep'||s.behavior==='alternating',a=(s.behavior==='evade'?Math.atan2(s.impact.y-origin.y-y,s.impact.x-origin.x-x):s.angle)+(sweep?(progress-.5)*s.arc*2:0),size=Math.max(40,Math.min(row===1?60:180,s.reach*1.25)),offset=row===1?Math.min(18,s.reach*.2):s.reach*.45;
  if(s.abilityId==='double-sword'){for(const side of [-1,1])this.draw(0,2,x+Math.cos(a)*s.reach*.45,y-20+Math.sin(a)*s.reach*.45+side*5,size,a+side*.1,Math.min(1,s.life/.045));return true;}
  this.draw(row,frame,x+Math.cos(a)*offset,y-20+Math.sin(a)*offset,size,a,Math.min(1,s.life/.045),'crew-vfx',row===1&&!sweep&&Math.cos(a)<0);
  if(s.behavior==='focus'&&row!==1)this.draw(row,(frame+1)%4,s.impact.x-origin.x,s.impact.y-origin.y-20,Math.min(85,size*.65),a+.6,.65,'crew-vfx');
  if(s.abilityId==='quick-theft')this.draw(0,0,s.impact.x-origin.x,s.impact.y-origin.y-26,30,0,1,'crew-loot');
  if(s.abilityId==='smart-escape')this.draw(5,frame,s.x-origin.x,s.y-origin.y-15,45,0,.5);
  return true;
 }
 projectile(p:Projectile,origin:Vector):boolean{
  if(p.hostile||!p.abilityId)return false;const kinds:Record<string,number>={'namari-boshi':0,'multi-shot':1,'kayaku-boshi':2,'smoke-shot':2,'irritant-shot':3};const frame=kinds[p.abilityId];if(frame===undefined)return false;
  this.draw(3,frame,p.x-origin.x,p.y-origin.y-18,frame<2?15:23,Math.atan2(p.vy,p.vx));return true;
 }
 area(a:AreaEffect,run:Run,origin:Vector):boolean{
  if(a.visual==='bomu-explosion'||a.visual==='item-explosion')return false;
  const owner=run.players.get(a.ownerId);if(!owner||!['sanji','nami','usopp'].includes(owner.characterId))return false;
  const x=a.x-origin.x,y=a.y-origin.y;
  if(a.kind==='decoy'){this.draw(0,0,x,y-24,55,0,Math.min(.9,a.life/.3),'crew-decoy');return true;}
  if(a.visual==='thief-decoy'&&a.kind==='impact'&&a.triggered){this.draw(4,Math.floor((.3-a.life)/.3*4),x,y-12,a.radius*2,0,Math.min(1,a.life/.05));return true;}
  if(a.visual==='smart-escape'&&a.triggered){this.draw(0,0,x,y-8,a.radius*1.8,0,Math.min(1,a.life/.05),'crew-rope');return true;}
  if(a.kind==='trap'){this.draw(0,0,x,y,Math.max(35,a.radius*1.6),0,.8,'crew-rope');return true;}
  if(a.kind==='smoke'){this.draw(5,[0,1,2,1][Math.floor(this.clock/150)%4],x,y-12,a.radius*2,0,Math.min(.65,a.life));return true;}
  if(a.kind==='impact'&&owner.characterId==='usopp'&&a.triggered){this.draw(4,Math.floor((.3-a.life)/.3*4),x,y-12,a.radius*2,0,Math.min(1,a.life/.05));return true;}
  if(owner.characterId==='sanji'&&a.kind==='impact'&&a.triggered&&a.visual!=='kick'){this.draw(1,2,x,y-20,60,Math.PI/2,Math.min(1,a.life/.05));this.draw(4,Math.floor((.3-a.life)/.3*4),x,y,a.radius,0,.5);return true;}
  if(a.visual==='kick'){this.draw(1,a.triggered?2:0,x,y-(a.triggered?20:45),60,Math.PI/2, a.triggered?1:.45);return a.triggered;}
  return false;
 }
 guard(x:number,y:number){this.draw(0,0,x,y-22,58,Math.PI/2,.65);}
}
