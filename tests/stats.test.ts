import test from 'node:test';
import assert from 'node:assert/strict';
import { Run } from '../src/game/core/run.ts';
import { UPGRADES } from '../src/content/catalog.ts';
import { applyUpgrade, chooseUpgrades } from '../src/game/systems/progression.ts';
import { resolveStats, refreshStats, receivedDamage, attackCooldown } from '../src/game/systems/stats.ts';
import { attack } from '../src/game/systems/combat.ts';
import { SpatialGrid } from '../src/game/spatial/grid.ts';
const upgrade = (id: string) => UPGRADES.find(u => u.id === id)!;
const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);

test('vida +20 cura exactamente20, puede repetirse más allá del máximo antiguo', () => {
  const p = new Run().player; p.hp = 40;
  for (let i = 0; i < 30; i++) applyUpgrade(p, upgrade('heart'));
  assert.equal(p.stats.maxHp, 700); assert.equal(p.hp, 640);
  p.hp = p.stats.maxHp; applyUpgrade(p, upgrade('heart'));
  assert.equal(p.hp, 720);
});

test('las bonificaciones se suman sobre la base, sin multiplicación exponencial', () => {
  const p = new Run().player;
  for (let i = 0; i < 10; i++) applyUpgrade(p, upgrade('power'));
  near(p.stats.damage, 24 * 1.8);
  p.modifiers.items = { damage: 0.24 }; refreshStats(p);
  near(p.stats.damage, 24 * 2.04);
  const stats = structuredClone(p.stats); refreshStats(p); assert.deepEqual(p.stats, stats);
  p.modifiers.items = {}; refreshStats(p); near(p.stats.damage, 24 * 1.8);
});

test('límites combinados de todas las fuentes, incluidos cooldown de técnicas evolucionadas', () => {
  const p = new Run().player;
  p.stats = resolveStats(p.baseStats, [{ damage: 9, speed: 4, cooldown: -0.9, armor: 1, regeneration: 30, critChance: 1 }]);
  near(p.stats.armor, 0.6); near(p.stats.critChance, 0.5); near(p.stats.speed, 195 * 1.75);
  near(p.stats.damage, 24 * 3.5); near(p.stats.cooldown, 0.72 * 0.5); near(p.stats.regeneration, 0.5);
  near(attackCooldown(0.72, 0.63, p), 0.36); near(attackCooldown(2.7, 2.3625, p), 1.35);
  near(receivedDamage(100, 100), 40); assert.equal(receivedDamage(0, 1), 0);
});

test('cambiar una fruta reemplaza su fuente y regeneración acumulada se aprovecha con más HP', () => {
  const p = new Run().player;
  p.modifiers.fruit = { damage: 0.2 }; refreshStats(p); near(p.stats.damage, 28.8);
  p.modifiers.fruit = { damage: 0.5 }; refreshStats(p); near(p.stats.damage, 36);
  for (let i = 0; i < 30; i++) applyUpgrade(p, upgrade('regen'));
  near(p.stats.regeneration, 0.5);
  applyUpgrade(p, upgrade('heart')); near(p.stats.regeneration, 0.6);
  const fresh = new Run().player; near(fresh.stats.regeneration, 0.2); assert.equal(fresh.stats.maxHp, 100);
});

test('vida/regen siguen disponibles y estadísticas finitas al tope dejan de ofrecerse', () => {
  const p = new Run().player;
  p.attacks.forEach(a => a.level = 6);
  p.taken = Object.fromEntries(UPGRADES.filter(u => Number.isFinite(u.max)).map(u => [u.id, u.max]));
  p.taken.heart = 1000; p.taken.regen = 1000;
  const options = chooseUpgrades(p.taken, () => 0, p);
  assert.ok(options.some(c => c.id === 'heart')); assert.ok(options.some(c => c.id === 'regen'));
  p.modifiers.items = { armor: 0.6 }; refreshStats(p); delete p.taken.armor;
  for (let i = 0; i < 20; i++) assert.ok(chooseUpgrades(p.taken, () => i / 20, p).every(c => c.id !== 'armor'));
});

test('armadura y regeneración se aplican realmente en Run y no reviven a muertos', () => {
  const run = new Run(), p = run.player;
  for (let i = 0; i < 10; i++) applyUpgrade(p, upgrade('armor'));
  const e = run.enemies.acquire()!; Object.assign(e, { id: 999, x: p.x + 10, y: p.y, hp: 10000, maxHp: 10000, damage: 10, speed: 0, xp: 0 });
  run.update(1 / 60, { x: 0, y: 0 }); near(p.hp, 93);
  e.active = false; p.hp = 50;
  for (let i = 0; i < 60; i++) run.update(1 / 60, { x: 0, y: 0 }); near(p.hp, 50.2);
  p.hp = 0; run.update(1 / 60, { x: 0, y: 0 }); assert.equal(run.status, 'defeat'); assert.equal(p.hp, 0);
});

test('críticos tienen daño real ×1,5 con RNG inyectado, sin crítico el daño sigue igual', () => {
  for (const [roll, expected] of [[0, 36], [0.9, 24]]) {
    const run = new Run(), p = run.player, e = run.enemies.acquire()!;
    p.stats.critChance = 0.5;
    Object.assign(e, { id: 99, x: p.x + 30, y: p.y, hp: 1000, maxHp: 1000, speed: 0 });
    const grid = new SpatialGrid(); grid.rebuild(run.enemies.items);
    attack(p, grid, 'elastic-punch', () => {}, run.world, 1, () => roll);
    near(1000 - e.hp, expected);
  }
});

test('regeneración no supera3 HP/s aunque la vida máxima crezca indefinidamente', () => {
  const p = new Run().player;
  const stats = resolveStats({ ...p.baseStats, maxHp: 100000 }, [{ regeneration: 1000 }]);
  assert.equal(stats.regeneration, 3);
});
