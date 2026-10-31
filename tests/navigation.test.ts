import test from 'node:test';
import assert from 'node:assert/strict';
import { Run } from '../src/game/core/run.ts';
import { MorganRoute } from '../src/game/systems/navigation-signal.ts';
import { MORGAN_ROUTE } from '../src/content/navigation.ts';
import { ORANGE_TOWN } from '../src/content/worlds/orange-town.ts';
import { ENEMIES } from '../src/content/catalog.ts';
import { improveAttack } from '../src/game/systems/loadout.ts';
import { equipItem } from '../src/game/systems/items.ts';
import type { CollisionWorld } from '../src/game/world/world.ts';
const axis = { x: 0, y: 0 };
const step = (r: Run, seconds: number) => { for (let i = 0; i < Math.ceil(seconds * 60); i++) r.update(1 / 60, axis); };
const finish = (r: Run) => { for (let i = 0; i < 181 && r.status === 'voyage'; i++) r.update(1 / 60, axis); };
const clear: CollisionWorld = { canOccupy: () => true, segmentClear: () => true, moveCircle: () => {} };
const snapshot = (r: Run) => JSON.stringify({ id: r.id, level: r.player.level, xp: r.player.xp, next: r.player.xpNext, attacks: r.player.attacks.map(a => [a.id, a.level, a.cooldown, a.activeFor]), slots: r.player.abilitySlots, buffs: r.player.learnedBuffs, items: r.player.items, fruit: r.player.fruit, berries: r.player.collectedBerries });
test('carta: no antes de05:00, posición transitable y alcanzable, proximidad y reaparición si se ignora', () => {
  const route = new MorganRoute(), random = () => 0.5;
  route.tick(299.99, axis, clear, random, () => true); assert.equal(route.signal, undefined);
  route.tick(300, axis, clear, random, () => true); assert.ok(route.nextAt > 300);
  route.tick(route.nextAt, axis, clear, random, () => false); assert.equal(route.signal, undefined);
  route.tick(route.nextAt, axis, clear, random, () => true); const signal = { ...route.signal! };
  assert.ok(Math.hypot(signal.x, signal.y) >= MORGAN_ROUTE.distanceMin);
  assert.equal(route.tick(330, axis, clear, random, () => true), false);
  route.tick(500, axis, clear, random, () => true); assert.equal(route.signal, undefined);
  route.tick(route.nextAt, axis, clear, random, () => true); assert.ok(route.signal);
  assert.equal(route.tick(route.nextAt, route.signal!, { ...clear, segmentClear: () => false }, random, () => true), false);
  assert.equal(route.tick(route.nextAt, route.signal!, clear, random, () => true), true);
  assert.equal(route.signal, undefined); assert.equal(route.nextAt, Infinity);
});
test('travesía por carta conserva build, pausa reloj/combate y permite pausa/reanudación', () => {
  const r = new Run('luffy', 0, () => 0.5); r.time = 301; r.route.signal = { ...r.player };
  improveAttack(r.player, 'bazooka'); equipItem(r.player, 'boots'); r.player.fruit = 'bomu'; r.player.collectedBerries = 17;
  r.update(1 / 60, axis); assert.equal(r.status, 'voyage'); assert.equal(r.voyage?.destination, 'morgan');
  const before = snapshot(r), hp = r.player.hp, time = r.time;
  r.pause(); step(r, 5); assert.equal(r.voyage!.elapsed, 0); r.resume(); assert.equal(r.status, 'voyage');
  step(r, 2); assert.equal(r.time, time); assert.equal(snapshot(r), before); assert.equal(r.enemies.count, 0);
  step(r, 1.02); assert.equal(r.zone, 'morgan-arena'); assert.equal(r.status, 'playing');
  assert.equal(r.player.hp, hp); assert.ok(r.encounter); assert.equal(r.route.signal, undefined);
});
test('derrota de Morgan vuelve al mismo Shells Town con25HP, conserva build y permite otro intento nuevo', () => {
  const r = new Run('luffy', 0, () => 0.5), world = r.world;
  improveAttack(r.player, 'bazooka'); equipItem(r.player, 'boots'); r.player.fruit = 'bomu'; r.player.level = 12; r.player.xp = 3; r.player.collectedBerries = 99;
  r.beginMorgan(); r.player.attacks.forEach(a => a.cooldown = 1e6); r.player.hp = 0;
  const before = snapshot(r), oldBoss = r.encounter;
  r.update(1 / 60, axis); assert.equal(r.result(), undefined); assert.equal(r.encounter!.telegraph, undefined);
  finish(r); assert.equal(r.status, 'playing'); assert.equal(r.zone, 'shells-town'); assert.equal(r.world, world);
  assert.equal(r.player.hp, 25); assert.equal(snapshot(r), before); assert.equal(r.encounter, undefined); assert.equal(r.enemies.count, 0);
  assert.equal(r.morganDefeated, false); assert.equal(r.canJoinMovements, false);
  assert.ok(r.route.nextAt >= r.time + MORGAN_ROUTE.retryMin - 0.1);
  r.route.signal = { ...r.player }; r.update(1 / 60, axis); finish(r);
  assert.equal(r.zone, 'morgan-arena'); assert.notEqual(r.encounter, oldBoss); assert.equal(r.encounter!.body.hp, r.encounter!.body.maxHp);
});
test('victoria viaja automáticamente a Orange, conserva HP/build y genera sus tres tipos de piratas', () => {
  const r = new Run('luffy', 0, () => 0.5); r.beginMorgan();
  const b = r.encounter!; b.body.x = r.player.x + 40; b.body.y = r.player.y; b.body.hp = 1; r.player.hp = 61;
  r.update(1 / 60, axis); assert.ok(r.morganDefeated); r.player.attacks.forEach(a => a.cooldown = 1e6);
  step(r, 1.4); assert.equal(r.status, 'voyage'); assert.equal(r.voyage?.destination, 'orange');
  const before = snapshot(r), hp = r.player.hp;
  finish(r); assert.equal(r.zone, 'orange-town'); assert.equal(r.definition, ORANGE_TOWN); assert.equal(r.player.hp, hp); assert.equal(snapshot(r), before);
  assert.equal(r.encounter, undefined); assert.equal(r.canJoinMovements, true);
  // Variantes definidas, con XP mayor que los marines y sin reaplicar presión de20min al llegar.
  for (const v of ORANGE_TOWN.enemyVariants!) { assert.ok(ENEMIES[v.id]); assert.equal(ENEMIES[v.id].visual, v.id); }
  assert.equal(new Set(ORANGE_TOWN.enemyVariants!.map(v => ENEMIES[v.id].visual)).size, 3);
  step(r, 2); assert.ok(r.enemies.count > 0); assert.ok(r.enemies.items.filter(e => e.active).every(e => e.visual?.startsWith('buggy-') && e.xp >= 28));
});
test('morir explorando sigue terminando la partida; pausa no genera cartas', () => {
  const r = new Run(); r.time = 299; r.pause(); step(r, 10); assert.equal(r.time, 299); assert.equal(r.route.signal, undefined);
  r.resume(); r.player.hp = 0; r.update(1 / 60, axis); assert.equal(r.status, 'defeat'); assert.ok(r.result());
});
