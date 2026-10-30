import test from 'node:test';
import assert from 'node:assert/strict';
import { Run } from '../src/game/core/run.ts';
import { ABILITIES } from '../src/content/attacks.ts';
import { CHARACTERS, UPGRADES } from '../src/content/catalog.ts';
import { improveAttack, mergeSlots, newAttack } from '../src/game/systems/loadout.ts';
import { chooseUpgrades } from '../src/game/systems/progression.ts';
import { attack, tickAttacks } from '../src/game/systems/combat.ts';
import { SpatialGrid } from '../src/game/spatial/grid.ts';
import type { Enemy } from '../src/game/core/types.ts';
import type { CollisionWorld } from '../src/game/world/world.ts';
const clearWorld: CollisionWorld = { canOccupy: () => true, segmentClear: () => true, moveCircle: (p, x, y) => { p.x += x; p.y += y; } };
const makeEnemy = (id: number, x: number, y = 0, hp = 100): Enemy => ({ id, x, y, hp, maxHp: hp, active: true, damage: 0, xp: 5, speed: 0, radius: 13, flash: 0 });
const actor = () => { const p = new Run().player; p.x = 0; p.y = 0; return p; };

test('cuatro ataques, seis niveles, evolución automática y fin de ofertas al máximo', () => {
  const p = actor();
  for (const id of CHARACTERS.luffy.abilities) {
    assert.equal(ABILITIES[id].levels.length, 6);
    if (!p.attacks.some(a => a.id === id) && p.abilitySlots.every(slot => slot.length)) mergeSlots(p, 1, 0);
    while ((p.attacks.find(a => a.id === id)?.level ?? 0) < 6) assert.equal(improveAttack(p, id), true);
    assert.equal(improveAttack(p, id), false);
  }
  assert.equal(p.attacks.length, 6); assert.equal(improveAttack(p, 'inventado'), false);
  const choices = chooseUpgrades({}, () => 0.99, p);
  assert.equal(choices.length, 3); assert.ok(choices.every(c => !('kind' in c) || ABILITIES[c.abilityId].category === 'buff'));
  const fresh = actor(); assert.equal(fresh.attacks.length, 1); assert.equal(fresh.attacks[0].level, 1);
});

test('Pistol normal alcanza un enemigo y Pistol+ perfora la fila', () => {
  for (const level of [1, 6]) {
    const p = actor(), enemies = [makeEnemy(1, 45), makeEnemy(2, 80), makeEnemy(3, 115)];
    const grid = new SpatialGrid(); grid.rebuild(enemies);
    const strike = attack(p, grid, 'elastic-punch', () => {}, clearWorld, level)!;
    assert.equal(enemies.filter(e => e.hp < 100).length, level === 1 ? 1 : 3);
    assert.equal(strike.evolved, level === 6);
  }
});

test('Gatling dispara en tiempos distintos y busca al siguiente enemigo tras una baja', () => {
  const p = actor(); p.attacks = [newAttack('gatling')];
  const enemies = [makeEnemy(1, 45, 0, 10), makeEnemy(2, 0, 65, 10), makeEnemy(3, -85, 0, 10)];
  const grid = new SpatialGrid(), kills: number[] = [], moments: number[] = [];
  for (let i = 0; i < 28; i++) {
    grid.rebuild(enemies);
    tickAttacks(p, grid, clearWorld, 1 / 60, e => kills.push(e.id), () => moments.push(i));
  }
  assert.deepEqual(kills, [1, 2, 3]); assert.equal(moments.length, 3);
  assert.ok(moments[1] - moments[0] >= 7); assert.ok(moments[2] > moments[1]);
});

test('Whip+ gira 360 grados; Bazooka empuja más y su evolución genera onda', () => {
  for (const level of [1, 6]) {
    const p = actor(), front = makeEnemy(1, 60), back = makeEnemy(2, -80);
    const grid = new SpatialGrid(); grid.rebuild([front, back]);
    attack(p, grid, 'whip', () => {}, clearWorld, level);
    assert.equal(back.hp < 100, level === 6);
  }
  const p = actor(), enemy = makeEnemy(1, 50), grid = new SpatialGrid(); grid.rebuild([enemy]);
  const strike = attack(p, grid, 'bazooka', () => {}, clearWorld, 6)!;
  assert.ok(enemy.x >= 110); assert.ok(strike.splash > 0);
});

test('temporizadores independientes y pausa de Run congelan ataques y ráfagas', () => {
  const run = new Run(); improveAttack(run.player, 'gatling');
  run.player.attacks[0].cooldown = 10;
  const e = run.enemies.acquire()!; Object.assign(e, makeEnemy(99, run.player.x + 30, run.player.y));
  run.update(1 / 60, { x: 0, y: 0 });
  assert.ok(run.strikes.some(s => s.behavior === 'burst'));
  assert.ok(run.player.attacks[0].cooldown > 9);
  run.pause(); const before = structuredClone(run.player.attacks);
  run.update(1, { x: 0, y: 0 }); assert.deepEqual(run.player.attacks, before);
});

test('ningún ejecutor atraviesa muros ni concede doble recompensa en golpes múltiples', () => {
  const wallWorld: CollisionWorld = { ...clearWorld, segmentClear: () => false };
  for (const id of ['elastic-punch', 'gatling', 'bazooka', 'whip']) {
    const p = actor(), enemy = makeEnemy(1, 50, 0, 1), grid = new SpatialGrid(); grid.rebuild([enemy]);
    let kills = 0;
    assert.equal(attack(p, grid, id, () => kills++, wallWorld, 6), undefined);
    assert.equal(kills, 0); assert.equal(enemy.hp, 1);
    attack(p, grid, id, () => kills++, clearWorld, 6);
    attack(p, grid, id, () => kills++, clearWorld, 6);
    assert.equal(kills, 1);
  }
});

test('las cartas mezclan aprendizaje y mejoras con pasivas sin repetir opciones', () => {
  const p = actor(); const taken = Object.fromEntries(UPGRADES.map(u => [u.id, u.max]));
  const cards = chooseUpgrades(taken, () => 0, p);
  assert.equal(cards.length, 3); assert.equal(new Set(cards.map(c => c.id)).size, 3);
  assert.ok(cards.every(c => 'kind' in c));
  assert.ok(cards.some(c => c.id === 'ability:elastic-punch'));
});

test('el trazo de Pistol+ se corta antes de la pared detrás del objetivo', () => {
  const p = actor(), grid = new SpatialGrid(); grid.rebuild([makeEnemy(1, 40)]);
  const wall: CollisionWorld = { ...clearWorld, canOccupy: x => x < 90, segmentClear: (_ax, _ay, bx) => bx < 90 };
  const strike = attack(p, grid, 'elastic-punch', () => {}, wall, 6)!;
  assert.ok(strike.reach < 90); assert.ok(strike.reach > 40);
});
