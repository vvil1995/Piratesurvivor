import test from 'node:test';
import assert from 'node:assert/strict';
import { difficultyAt } from '../src/game/systems/difficulty.ts';
import { SHELLS_TOWN } from '../src/content/worlds/shells-town.ts';
import { Run } from '../src/game/core/run.ts';
import { spawnEnemy } from '../src/game/systems/spawner.ts';
import { FlowField } from '../src/game/navigation/flow-field.ts';

test('presión progresiva, topes configurables y ninguna transición por reloj', () => {
  const at = (time: number) => difficultyAt(time, SHELLS_TOWN.spawnInterval, SHELLS_TOWN.difficulty);
  const start = at(0), mid = at(300), late = at(600), capped = at(1200);
  assert.equal(start.hp, 1); assert.equal(start.batch, 1);
  assert.ok(mid.hp > start.hp && late.damage > mid.damage && late.speed > mid.speed);
  assert.ok(mid.interval < start.interval); assert.equal(late.batch, 2); assert.equal(at(720).batch, 3);
  assert.deepEqual(at(36000), capped); assert.ok(capped.interval >= 0.22);
  assert.deepEqual(at(-1), start);
  assert.equal(difficultyAt(600, 0.7).hp, 1);
});

test('los enemigos tardíos nacen más fuertes sin depender de HP máximos del jugador', () => {
  function born(time: number, hp: number) {
    const run = new Run('luffy', 0, () => 0.5); run.player.stats.maxHp = hp;
    const field = new FlowField(run.world); field.update(run.player, 1);
    spawnEnemy(run.enemies, [run.player], { centerX: 256, centerY: 256, width: 920, height: 600 }, run.world, field, run.definition, () => 0.1, 1, time);
    const e = run.enemies.items.find(e => e.active); assert.ok(e); return e;
  }
  const early = born(0, 100), late = born(600, 100), tank = born(600, 10000);
  assert.ok(late.maxHp > early.maxHp && late.damage > early.damage && late.speed > early.speed);
  assert.equal(early.xp, 10); assert.equal(late.xp, 16); assert.equal(tank.xp, late.xp);
  assert.equal(late.maxHp, tank.maxHp); assert.equal(late.damage, tank.damage);
});

test('diez segundos avanzados generan más enemigos reales, respetando pool y sólidos', () => {
  function simulate(time: number) {
    let seed = 7; const random = () => ((seed = seed * 16807 % 2147483647) / 2147483647);
    const run = new Run('luffy', 0, random); run.time = time;
    run.player.stats.damage = 0; run.player.stats.maxHp = 100000; run.player.hp = 100000;
    for (let i = 0; i < 600; i++) run.update(1 / 60, { x: 0, y: 0 });
    assert.ok(run.enemies.count <= 150);
    for (const e of run.enemies.items) if (e.active) assert.ok(run.world.canOccupy(e.x, e.y, e.radius));
    assert.equal(run.status, 'playing'); assert.equal(run.definition.id, 'shells-town'); return run.enemies.count;
  }
  assert.ok(simulate(600) > simulate(0));
});

test('Shells Town permite mejorar antes y retrasa la acumulación sin eliminar la escalada', () => {
  const old = { ...SHELLS_TOWN.difficulty!, spawnAcceleration: 0.23, batchEveryMinutes: 4 };
  for (const t of [0, 120, 240, 480]) {
    const before = difficultyAt(t, 0.65, old), after = difficultyAt(t, SHELLS_TOWN.spawnInterval, SHELLS_TOWN.difficulty);
    assert.ok(after.batch / after.interval < before.batch / before.interval);
    assert.equal(after.hp, before.hp); assert.equal(after.damage, before.damage);
  }
  const current = new Run('luffy', 0, () => 0.5), previous = new Run('luffy', 0, () => 0.5);
  // Recogida real, mismo número de bajas: comprueba XP/nivel, no solo números del catálogo.
  for (let i = 0; i < 3; i++) for (const [run, value] of [[current, 10], [previous, 5]] as const) {
    const crystal = run.pickups.acquire()!; Object.assign(crystal, { x: run.player.x, y: run.player.y, value, kind: 'xp', ownerId: run.player.id });
    run.update(1 / 60, { x: 0, y: 0 });
  }
  assert.equal(current.player.level, 2); assert.equal(current.status, 'levelup');
  assert.equal(previous.player.level, 1); assert.equal(previous.player.xp, 15);
  const time = current.time; current.update(10, { x: 0, y: 0 }); assert.equal(current.time, time);
});
