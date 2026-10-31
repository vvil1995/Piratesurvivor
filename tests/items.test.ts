import test from 'node:test';
import assert from 'node:assert/strict';
import { Run } from '../src/game/core/run.ts';
import { ITEMS, ITEM_RULES, itemDescription } from '../src/content/items.ts';
import { equipItem, replaceItem } from '../src/game/systems/items.ts';
import { tickItem, itemHit } from '../src/game/systems/item-effects.ts';
import { damageEnemy } from '../src/game/systems/hits.ts';
const axis = { x: 0, y: 0 };
const near = (a: number, b: number) => assert.ok(Math.abs(a-b)<1e-8, `${a} != ${b}`);
function victim(r: Run, hp=100) { const e=r.enemies.acquire()!; Object.assign(e,{x:r.player.x+30,y:r.player.y,hp,maxHp:hp,radius:12,speed:0,damage:0,xp:0,statuses:{},kind:undefined}); return e; }

test('diez objetos: magnitudes exactas, hasta tres niveles, efectos no acumulados', () => {
 assert.equal(Object.keys(ITEMS).length,10);
 for (const id of Object.keys(ITEMS)) {
  const p=new Run().player;
  for(let level=1;level<=3;level++){assert.ok(equipItem(p,id));assert.equal(p.items[id],level);assert.ok(itemDescription(id,level).length);}
  assert.equal(equipItem(p,id),false); assert.equal(equipItem(p,'invalid'),false);
 }
 const p=new Run().player;
 for(const armor of [.08,.14,.20]){equipItem(p,'vest');near(p.stats.armor,armor);}
 replaceItem(p,'whetstone');near(p.stats.armor,p.baseStats.armor);near(p.stats.damage,p.baseStats.damage*1.08);
 replaceItem(p,'telescope');near(p.stats.damage,p.baseStats.damage);near(p.stats.range,p.baseStats.range*1.15);
});
test('Haramaki cura solo el incremento; mandarinas curan cada cinco segundos',()=>{
 const p=new Run().player;p.hp=40;const base=p.stats.maxHp;
 for(const multiplier of [1.15,1.30,1.45]){const old=p.stats.maxHp,hp=p.hp;equipItem(p,'haramaki');near(p.stats.maxHp,base*multiplier);near(p.hp,hp+p.stats.maxHp-old);}
 replaceItem(p,'medicine');near(p.stats.maxHp,base);p.hp=40;
 tickItem(p,4.99);near(p.hp,40);tickItem(p,.01);near(p.hp,42);
 equipItem(p,'medicine');tickItem(p,5);near(p.hp,46);equipItem(p,'medicine');tickItem(p,5);near(p.hp,52);
 p.hp=p.stats.maxHp-1;tickItem(p,5);near(p.hp,p.stats.maxHp);p.hp=0;tickItem(p,5);near(p.hp,0);
});
test('berries y mapa multiplican las recompensas recogidas realmente',()=>{
 for(const [id,kind,value,expected] of [['berries','berry',10,12],['treasure','xp',10,11]] as const){
  const r=new Run();for(const c of r.chests.active)c.active=false;equipItem(r.player,id);
  const p=r.pickups.acquire()!;Object.assign(p,{x:r.player.x,y:r.player.y,kind,value});r.update(1/60,axis);
  near(kind==='berry'?r.player.collectedBerries:r.player.xp,expected);assert.equal(p.active,false);
 }
});
test('pólvora tiene cooldown, daño real, área y no genera cadenas',()=>{
 const r=new Run(),p=r.player;equipItem(p,'powder');const e=victim(r,10);
 damageEnemy(p,e,1000,0,p,r.world,()=>{},()=>0);assert.equal(p.itemState!.queue.length,1);near(p.itemState!.queue[0].damage,3.5);
 itemHit(p,victim(r),100,false,()=>0);assert.equal(p.itemState!.queue.length,1);
 tickItem(p,ITEM_RULES.explosionCooldown);itemHit(p,victim(r),100,false,()=>0);assert.equal(p.itemState!.queue.length,2);
 p.itemState!.queue=[];tickItem(p,1);damageEnemy(p,victim(r),10,0,p,r.world,()=>{},()=>0,true,true);assert.equal(p.itemState!.queue.length,0);
 // La cola se resuelve en el mundo real y afecta a enemigos próximos.
 const other=victim(r,100);p.itemState!.queue=[{x:other.x,y:other.y,damage:7}];for(const a of p.attacks)a.cooldown=1e6;
 r.update(1/60,axis);near(other.hp,93);assert.equal(p.itemState!.queue.length,0);
});
test('péndulo aturde normales y limita la duración y frecuencia contra bosses',()=>{
 const r=new Run(),p=r.player;equipItem(p,'pendulum');const e=victim(r);itemHit(p,e,1,false,()=>0);near(e.statuses!.stun!,.4);
 e.kind='boss';e.statuses={};itemHit(p,e,1,false,()=>0);near(e.statuses.stun!,.1);e.statuses={};itemHit(p,e,1,false,()=>0);assert.equal(e.statuses.stun,undefined);
 tickItem(p,4);itemHit(p,e,1,false,()=>0);near(e.statuses.stun!,.1);
});
test('daga cura por daño real sin overkill, con límite y penalización de área',()=>{
 const r=new Run(),p=r.player;equipItem(p,'dagger');p.hp=20;
 damageEnemy(p,victim(r,10),1000,0,p,r.world,()=>{},()=>1);near(p.hp,20.2);
 tickItem(p,1);itemHit(p,victim(r),1000,false,()=>1);near(p.hp,24.2);itemHit(p,victim(r),1000,false,()=>1);near(p.hp,24.2);
 tickItem(p,1);itemHit(p,victim(r),100,true,()=>1);near(p.hp,24.7);
});
test('objeto temporal conserva nivel al viajar, desaparece en partida nueva',()=>{
 const r=new Run();equipItem(r.player,'vest');equipItem(r.player,'vest');r.beginMorgan();
 r.encounter!.body.x=r.player.x+40;r.encounter!.body.y=r.player.y;r.encounter!.body.hp=1;r.update(1/60,axis);
 for(let i=0;i<100&&r.status==='playing';i++)r.update(1/60,axis);
 assert.equal(r.status,'combining');assert.ok(r.finishCombinations());
 for(let i=0;i<181&&r.status==='voyage';i++)r.update(1/60,axis);
 assert.equal(r.zone,'orange-town');assert.deepEqual(r.player.items,{vest:2});near(r.player.stats.armor,.14);
 assert.deepEqual(new Run().player.items,{});
});

test('sprites suministrados: diez PNG RGBA de 96px, orden y hashes registrados', async()=>{
 const {readFile}=await import('node:fs/promises'),{createHash}=await import('node:crypto');
 const root=new URL('../src/assets/items/',import.meta.url),manifest=JSON.parse(await readFile(new URL('manifest.json',root),'utf8'));
 assert.equal(manifest.realAlpha,true);assert.deepEqual(Object.keys(manifest.items),Object.keys(ITEMS));
 for(const [i,id] of Object.keys(ITEMS).entries()){
  const png=await readFile(new URL(id+'.png',root));assert.equal(png.readUInt32BE(16),96);assert.equal(png.readUInt32BE(20),96);assert.equal(png[25],6);
  assert.equal(createHash('sha256').update(png).digest('hex'),manifest.items[id].sha256);assert.equal(manifest.items[id].sourceCell,i+1);
 }
});
