import test from 'node:test';import assert from 'node:assert/strict';import {enemyFlipX} from '../src/game/scenes/enemy-facing.ts';
test('Baratie/Arlong: perfil izquierdo en oeste y diagonales, derecho al invertir marcha',()=>{
 for(const id of ['krieg-saber','krieg-gunner','krieg-armored','fishman-fighter','fishman-spitter','fishman-karate']){for(const d of ['w','nw','sw'] as const)assert.equal(enemyFlipX(id,d),true);for(const d of ['e','ne','se','n','s'] as const)assert.equal(enemyFlipX(id,d),false);}
});
test('Syrup conserva sus direcciones pintadas; no se invierten otros actores ni bosses',()=>{for(const id of ['blackcat-pirate','blackcat-claw','blackcat-hypnotist','marine-sword','buggy-pirate','kuro','arlong','don-krieg','roger',undefined])assert.equal(enemyFlipX(id,'w'),false);});
