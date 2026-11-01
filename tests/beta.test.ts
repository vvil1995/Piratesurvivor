import test from 'node:test';import assert from 'node:assert/strict';
import {Run} from '../src/game/core/run.ts';import {prepareBeta} from '../src/beta/prepare.ts';import {BETA_DESTINATIONS} from '../src/beta/config.ts';import {CHARACTERS} from '../src/content/catalog.ts';import {validLoadout} from '../src/game/systems/loadout.ts';
test('beta: todos los destinos y personajes reutilizan mundos reales con builds válidas',()=>{
 const zones=['shells-town','morgan-arena','orange-town','buggy-arena','syrup-village','kuro-arena','baratie','krieg-arena','arlong-park','arlong-arena','roger-arena'];
 for(const id of Object.keys(CHARACTERS))for(const [i,d]of BETA_DESTINATIONS.entries()){
  const r=new Run(id,0,()=>.5);prepareBeta(r,{destination:d[0],level:d[2],attacks:CHARACTERS[id].abilities.slice(0,4).map((id,n)=>({id,level:d[3],slot:n<d[4]?0:1}))});assert.equal(r.zone,zones[i]);assert.ok(r.practice);assert.ok(validLoadout(r.player));assert.equal(r.player.level,d[2]);assert.equal(r.player.hp,r.player.stats.maxHp);assert.equal(r.player.collectedBerries,0);assert.equal(r.status,'playing');
 }
});
test('beta rechaza duplicados y builds vacías',()=>{const r=new Run(),a={id:r.character.abilities[0],level:5,slot:0};assert.throws(()=>prepareBeta(r,{destination:'kuro',level:35,attacks:[a,a]}));assert.throws(()=>prepareBeta(r,{destination:'kuro',level:35,attacks:[]}));});
