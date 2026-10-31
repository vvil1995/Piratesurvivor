import test from 'node:test';
import assert from 'node:assert/strict';
import { Run } from '../src/game/core/run.ts';
import { improveAttack, validLoadout, selectSlot } from '../src/game/systems/loadout.ts';
import { tickBuffs } from '../src/game/systems/buffs.ts';
const axis={x:0,y:0};
function reward(second?:string){const r=new Run();if(second)improveAttack(r.player,second);r.beginMorgan();const b=r.encounter!;b.body.x=r.player.x+40;b.body.y=r.player.y;b.body.hp=1;r.update(1/60,axis);assert.ok(r.morganDefeated);for(let i=0;i<100&&r.status==='playing';i++)r.update(1/60,axis);assert.equal(r.status,'combining');return r;}
test('Morgan ofrece unión, conserva niveles/cooldowns y viaja con la misma build',()=>{
 const r=reward('gatling'),p=r.player;p.attacks[0].level=6;p.attacks[1].level=4;p.attacks[0].cooldown=.7;p.attacks[1].cooldown=3.2;
 const before=JSON.stringify(p.attacks.map(a=>({id:a.id,level:a.level,cooldown:a.cooldown})));assert.ok(r.joinPair(0,1));assert.equal(JSON.stringify(p.attacks.map(a=>({id:a.id,level:a.level,cooldown:a.cooldown}))),before);assert.equal(r.status,'voyage');assert.equal(p.abilitySlots.filter(s=>s.length).length,1);assert.ok(validLoadout(p));
 for(let i=0;i<181&&r.status==='voyage';i++)r.update(1/60,axis);assert.equal(r.zone,'orange-town');assert.equal(JSON.stringify(p.attacks.map(a=>({id:a.id,level:a.level,cooldown:a.cooldown}))),before);assert.ok(improveAttack(p,'gatling'));assert.equal(p.attacks[1].level,5);assert.equal(p.abilitySlots.length,4);
 const fresh=new Run();assert.equal(fresh.player.attacks.length,1);assert.equal(fresh.unionTokens,0);
});
test('Morgan permite Frenesí constante reducido y no cambia buffs aprendidos',()=>{
 const r=reward('frenzy'),p=r.player;assert.ok(r.joinPair(0,1));selectSlot(p,1);tickBuffs(p,0);assert.ok(p.modifiers.buffs.cooldown!<0);assert.deepEqual(p.learnedBuffs,['frenzy']);assert.ok(validLoadout(p));assert.equal(r.joinPair(0,1),false);
});
test('con una sola habilidad se puede continuar, sin conceder ni duplicar ataques',()=>{
 const r=reward();assert.equal(r.player.attacks.length,1);assert.ok(r.finishCombinations());assert.equal(r.status,'voyage');assert.equal(r.player.attacks.length,1);assert.equal(r.finishCombinations(),false);
});
