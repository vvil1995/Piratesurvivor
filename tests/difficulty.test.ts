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
  assert.ok(mid.interval < start.interval); assert.equal(late.batch, 3);
  assert.deepEqual(at(36000), capped); assert.ok(capped.interval >= 0.22);
  assert.deepEqual(at(-1), start);
  assert.equal(difficultyAt(600, 0.7).hp, 1);
});

test('los enemigos tardíos nacen más fuertes sin depender de HP máximos del jugador', () => {
  function born(time: number, hp: number) {
    const run = new Run('luffy', 0, () => 0.5); run.player.stats.maxHp = hp;
    const field = new FlowField(run.world); field.update(run.player, 1);
    spawnEnemy(run.enemies, [run.player], { centerX: 256, centerY: 256, width: 920, height: 600 }, run.world, field, run.definition, () => 0.5, 1, time);
    const e = run.enemies.items.find(e => e.active); assert.ok(e); return e;
  }
  const early = born(0, 100), late = born(600, 100), tank = born(600, 10000);
  assert.ok(late.maxHp > early.maxHp && late.damage > early.damage && late.speed > early.speed);
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
