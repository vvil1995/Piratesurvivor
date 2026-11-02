import Phaser from 'phaser';import {FRUIT_ART} from '../../ui/fruit-art.ts';import type {Run} from '../core/run.ts';import type {Vector} from '../core/types.ts';
import meraEffect from '../../assets/fruits/mera-effect.svg';
import goroEffect from '../../assets/fruits/goro-effect.svg';
import hieEffect from '../../assets/fruits/hie-effect.svg';
import sunaEffect from '../../assets/fruits/suna-effect.svg';
import mokuEffect from '../../assets/fruits/moku-effect.svg';
import nikyuEffect from '../../assets/fruits/nikyu-effect.svg';
const effects={mera:meraEffect,goro:goroEffect,hie:hieEffect,suna:sunaEffect,moku:mokuEffect,nikyu:nikyuEffect};
export class FruitRenderer{
 private images:Phaser.GameObjects.Image[]=[];
 constructor(private scene:Phaser.Scene){}
 static preload(s:Phaser.Scene){for(const[id,url]of Object.entries(FRUIT_ART))s.load.image('fruit-'+id,url);for(const[id,url]of Object.entries(effects))s.load.image('fruit-fx-'+id,url);}
 draw(run:Run|undefined,origin:Vector){for(const i of this.images)i.setVisible(false);if(!run)return;let n=0;
 for(const p of run.players.values())for(const v of p.fruitState?.visuals??[]){if(n>=80)break;const i=this.images[n]??(this.images[n]=this.scene.add.image(0,0,'fruit-fx-'+v.kind));n++;const t=1-v.life/(v.kind==='moku'?2:.45);i.setTexture('fruit-fx-'+v.kind).setPosition(v.x-origin.x,v.y-origin.y-18).setDisplaySize(v.kind==='nikyu'?70+t*100:v.kind==='moku'||v.kind==='suna'?100:44, v.kind==='nikyu'?70+t*100:v.kind==='moku'||v.kind==='suna'?100:44).setRotation(v.kind==='suna'?t*4:0).setAlpha(Math.min(1,v.life/.15)*(v.kind==='moku'?.5:1)).setDepth(v.y-origin.y+1030).setVisible(true);}
 }
}
