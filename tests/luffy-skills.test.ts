import test from 'node:test';
import assert from 'node:assert/strict';
import { Run } from '../src/game/core/run.ts';
import { improveAttack } from '../src/game/systems/loadout.ts';
import { spawnProjectile, tickEffects } from '../src/game/systems/effects.ts';

const axis = { x: 0, y: 0 };
function enemy(run: Run, id: number, x: number, y: number) {
  const e = run.enemies.acquire()!; Object.assign(e, { id, x, y, hp: 1000, maxHp: 1000, speed: 0, damage: 0, xp: 5 }); return e;
}
test('Balloon repele y mitiga contacto; su evolución refleja proyectiles reales del pool', () => {
  const run = new Run(), p = run.player; improveAttack(p, 'balloon');
  p.attacks[0].cooldown = 100;
  const e = enemy(run, 900, p.x + 20, p.y); e.damage = 10;
  run.update(1 / 60, axis);
  assert.ok(p.stats.armor > 0); assert.ok(p.hp > 90); assert.ok(e.x > p.x + 40);
  while (p.attacks.find(a => a.id === 'balloon')!.level < 6) improveAttack(p, 'balloon');
  const shield = p.attacks.find(a => a.id === 'balloon')!; shield.activeFor = 2;
  assert.equal(spawnProjectile(run, p.x - 35, p.y, p.x, p.y, 10, 200, '', true), true);
  const bullet = run.projectiles.items.find(b => b.active)!;
  const hp = p.hp; run.update(1 / 60, axis);
  assert.equal(bullet.reflected, true); assert.equal(bullet.hostile, false); assert.equal(bullet.ownerId, p.id);
  assert.ok(bullet.vx < 0); assert.ok(p.hp >= hp);
});

test('Axe avisa, no daña antes del impacto y se resuelve una sola vez', () => {
  const run = new Run(), p = run.player; improveAttack(p, 'axe'); p.attacks[0].cooldown = 100;
  const e = enemy(run, 900, p.x + 70, p.y);
  run.update(1 / 60, axis); assert.equal(run.areas.count, 1); assert.equal(e.hp, 1000);
  const area = run.areas.items.find(a => a.active)!;
  for (let i = 0; i < 10; i++) run.update(1 / 60, axis);
  assert.equal(e.hp, 1000); assert.ok(area.delay > 0);
  for (let i = 0; i < 30; i++) run.update(1 / 60, axis);
  assert.ok(e.hp < 1000); const hp = e.hp;
  for (let i = 0; i < 10; i++) run.update(1 / 60, axis);
  assert.equal(e.hp, hp);
});

test('pausa congela áreas/proyectiles y muerte limpia efectos', () => {
  const run = new Run(), p = run.player; improveAttack(p, 'axe'); p.attacks[0].cooldown = 100;
  enemy(run, 900, p.x + 70, p.y); run.update(1 / 60, axis);
  spawnProjectile(run, p.x, p.y, p.x + 200, p.y, 10, 200, p.id);
  run.pause(); const area = run.areas.items.find(a => a.active)!, delay = area.delay;
  const projectile = run.projectiles.items.find(a => a.active)!, x = projectile.x;
  run.update(1, axis); assert.equal(area.delay, delay); assert.equal(projectile.x, x);
  run.resume(); p.hp = 0; run.update(1 / 60, axis);
  assert.equal(run.projectiles.count, 0); assert.equal(run.areas.count, 0);
});

test('proyectil respeta paredes, impactos únicos y capacidad fija', () => {
  const run = new Run(), p = run.player;
  const wall = { canOccupy: () => false, segmentClear: () => false, moveCircle: () => {} };
  for (let i = 0; i < 150; i++) spawnProjectile(run, p.x, p.y, p.x + 50, p.y, 10, 200, p.id);
  assert.equal(run.projectiles.count, 96);
  tickEffects(run, run.players, run.grid, wall, 1 / 60, () => {}, () => 0.5);
  assert.equal(run.projectiles.count, 0);
});

test('un marine con rifle dispara un proyectil hostil en la simulación', () => {
  const run = new Run(), p = run.player; p.attacks[0].cooldown = 100;
  const e = enemy(run, 900, p.x + 220, p.y); e.ranged = { interval: 2.4, speed: 200, range: 250 }; e.shotTimer = 0;
  run.update(1 / 60, axis);
  const bullet = run.projectiles.items.find(b => b.active); assert.ok(bullet); assert.equal(bullet.hostile, true); assert.ok(bullet.vx < 0);
});
