import test from 'node:test';
import assert from 'node:assert/strict';
import { Run } from '../src/game/core/run.ts';
import { improveAttack, mergeSlots } from '../src/game/systems/loadout.ts';
import { tickBuffs } from '../src/game/systems/buffs.ts';
import { tickAttacks } from '../src/game/systems/combat.ts';
import { SpatialGrid } from '../src/game/spatial/grid.ts';
import { ABILITIES } from '../src/content/attacks.ts';
import type { CollisionWorld } from '../src/game/world/world.ts';
import type { Strike } from '../src/game/core/types.ts';
const axis = { x: 0, y: 0 };
const clear: CollisionWorld = { canOccupy: () => true, segmentClear: () => true, moveCircle: (p, x, y) => { p.x += x; p.y += y; } };
function enemy(run: Run, x = run.player.x + 30, y = run.player.y) {
  const e = run.enemies.acquire()!; Object.assign(e, { id: 999, x, y, hp: 10000, maxHp: 10000, speed: 0, damage: 0, xp: 0, radius: 13 }); return e;
}
test('aprender Bazooka no activa dos ataques: solo se ejecuta la ranura elegida', () => {
  const r = new Run(); improveAttack(r.player, 'bazooka'); enemy(r);
  assert.equal(r.player.selectedSlot, 0); r.update(1 / 60, axis);
  assert.deepEqual(r.strikes.map(s => s.behavior), ['line']);
  assert.equal(r.player.attacks[1].cooldown, 0);
  r.strikes.length = 0; assert.equal(r.selectSlot(1), true); r.update(1 / 60, axis);
  assert.deepEqual(r.strikes.map(s => s.behavior), ['cone']);
  assert.equal(r.selectSlot(3), false); assert.equal(r.player.selectedSlot, 1);
  const cooldown = r.player.attacks[1].cooldown;
  r.selectSlot(0); r.selectSlot(1); assert.equal(r.player.attacks[1].cooldown, cooldown);
  r.pause(); assert.equal(r.selectSlot(0), false);
  assert.equal(new Run().player.selectedSlot, 0);
});
test('los componentes de una combinación sí disparan juntos, con relojes independientes', () => {
  const r = new Run(); improveAttack(r.player, 'bazooka'); mergeSlots(r.player, 1, 0); enemy(r);
  r.update(1 / 60, axis); assert.deepEqual(r.strikes.map(s => s.behavior), ['line', 'cone']);
  assert.notEqual(r.player.attacks[0].cooldown, r.player.attacks[1].cooldown);
  improveAttack(r.player, 'gatling'); r.selectSlot(1); r.strikes.length = 0; r.update(1 / 60, axis);
  assert.deepEqual(r.strikes.map(s => s.behavior), ['burst']);
  const gatling = r.player.attacks.find(a => a.id === 'gatling')!; assert.ok(gatling.pending > 0);
  r.selectSlot(0); assert.equal(gatling.pending, 0); const remaining = gatling.cooldown;
  r.selectSlot(1); assert.equal(gatling.cooldown, remaining);
});
test('un buff temporal conserva su duración tras cambiar; los constantes exigen seleccionar su grupo', () => {
  const r = new Run(), p = r.player; improveAttack(p, 'fury'); r.selectSlot(1);
  assert.ok(p.stats.damage > p.baseStats.damage); r.selectSlot(0); assert.ok(p.stats.damage > p.baseStats.damage);
  tickBuffs(p, 4); assert.equal(p.stats.damage, p.baseStats.damage);
  mergeSlots(p, 1, 0); tickBuffs(p, 0); const boosted = p.stats.damage; assert.ok(boosted > p.baseStats.damage);
  improveAttack(p, 'gatling'); r.selectSlot(1); assert.equal(p.stats.damage, p.baseStats.damage);
  r.selectSlot(0); assert.equal(p.stats.damage, boosted);
  improveAttack(p, 'balloon'); r.selectSlot(2); assert.ok(p.stats.armor > 0);
  r.selectSlot(0); assert.equal(p.stats.armor, 0);
});
test('Zoro espera un blanco alcanzable y no consume carga ni cooldown en el aire o contra obstáculos', () => {
  const r = new Run('zoro'), p = r.player, e = enemy(r, 150, 0); p.x = p.y = 0;
  const grid = new SpatialGrid(), events: Strike[] = []; grid.rebuild(r.enemies.items);
  const tick = (world: CollisionWorld) => tickAttacks(p, grid, world, 1 / 60, () => {}, s => events.push(s), () => 0.5, r);
  tick(clear); assert.equal(events.length, 0); assert.equal(p.attacks[0].cooldown, 0); assert.equal(p.x, 0);
  e.x = 70; grid.rebuild(r.enemies.items); tick({ ...clear, moveCircle: () => {} });
  assert.equal(events.length, 0); assert.equal(e.hp, 10000); assert.equal(p.x, 0);
  tick({ ...clear, segmentClear: () => false }); assert.equal(events.length, 0);
  tick(clear); assert.equal(events.length, 1); assert.equal(events[0].targetId, e.id);
  assert.ok(e.hp < 10000); assert.ok(p.x > 0 && p.x <= 55); assert.ok(p.attacks[0].cooldown > 0);
});
test('ataques principales más rápidos desde el inicio y reducción adicional hasta nivel6', () => {
  for (const [id, cooldown] of [['elastic-punch', 0.45], ['oni-giri', 1.2], ['staff-hit', 0.9], ['namari-boshi', 0.9], ['collier', 0.8]] as const) {
    const a = ABILITIES[id]; assert.equal(a.levels[0].cooldown, cooldown);
    assert.ok(a.levels[5].cooldown < cooldown * 0.75);
  }
});

test('la comida ya preparada cura y mantiene su regeneración aunque se seleccione otra técnica', () => {
  const r = new Run('sanji'), p = r.player; improveAttack(p, 'combat-cooking');
  for (let i = 0; i < 5; i++) improveAttack(p, 'combat-cooking');
  r.selectSlot(1); r.update(1 / 60, axis);
  const food = r.pickups.items.find(v => v.active && v.kind === 'food')!; assert.ok(food);
  r.selectSlot(0); p.hp = 50; p.x = food.x; p.y = food.y;
  r.update(1 / 60, axis); assert.ok(p.hp >= 74);
  r.update(1 / 60, axis); assert.ok(p.stats.regeneration > p.baseStats.regeneration);
});
