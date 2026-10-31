import type Phaser from 'phaser';
import type { Run } from '../core/run.ts';
import type { Vector } from '../core/types.ts';
// Efectos de muerte independientes de los enemigos reciclados: sin cuerpos físicos.
export class EnemyDeaths {
 private pool: {image:Phaser.GameObjects.Image; x:number;y:number;life:number}[];
 private cursor=0;private world?:object;private run?:Run;
 constructor(scene:Phaser.Scene){this.pool=Array.from({length:32},()=>({image:scene.add.image(0,0,'marine-s-0').setOrigin(.5,.96).setScale(.6).setVisible(false),x:0,y:0,life:0}));}
 update(run:Run|undefined,origin:Vector,dt:number):void{
  if(this.run!==run||this.world!==run?.world){for(const p of this.pool){p.life=0;p.image.setVisible(false);}this.run=run;this.world=run?.world;}
  if(!run)return;
  for(const e of run.visualDeaths.splice(0)){const p=this.pool[this.cursor++%32];p.x=e.x;p.y=e.y;p.life=.32;p.image.setOrigin(.5,120/128).setTexture(`${e.visual}-s-4`).setRotation(0).setAlpha(1);}
  for(const p of this.pool){if(run.status==='playing')p.life=Math.max(0,p.life-Math.min(dt,.1));p.image.setVisible(p.life>0&&run.status!=='voyage');if(p.life>0){const t=1-p.life/.32;p.image.setPosition(p.x-origin.x,p.y-origin.y).setDepth(p.y-origin.y+999).setRotation(t*1.4).setAlpha(1-t);}}
 }
}
