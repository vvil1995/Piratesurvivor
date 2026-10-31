import test from 'node:test';
import assert from 'node:assert/strict';
import { Run } from '../src/game/core/run.ts';
import { improveAttack } from '../src/game/systems/loadout.ts';
import { equipItem } from '../src/game/systems/items.ts';
import { spawnProjectile } from '../src/game/systems/effects.ts';
import { isInvulnerable } from '../src/game/systems/guards.ts';
import { MORGAN_ATTACKS } from '../src/content/bosses/morgan.ts';
const axis = { x: 0, y: 0 };
test('Balloon bloquea contacto y proyectil, hace daño y lanza rivales durante su ventana', () => {
  const r = new Run(), p = r.player; improveAttack(p, 'balloon'); r.selectSlot(1); p.hp = 80;
  const e = r.enemies.acquire()!; Object.assign(e, { id: 999, x: p.x + 20, y: p.y, hp: 1000, maxHp: 1000, radius: 13, damage: 999, speed: 0, xp: 0 });
  r.update(1 / 60, axis); assert.ok(p.hp >= 80); assert.ok(e.hp < 1000); assert.ok((e.launchTime ?? 0) > 0); assert.ok(isInvulnerable(p));
  const before = p.hp; spawnProjectile(r, p.x - 10, p.y, p.x, p.y, 999, 200, '', true); p.hurtTimer = 0;
  r.update(1 / 60, axis); assert.ok(p.hp >= before); assert.equal(r.projectiles.count, 0);
  for (let i = 0; i < 25; i++) r.update(1 / 60, axis);
  assert.ok(r.world.canOccupy(e.x, e.y, e.radius)); assert.ok(e.x > p.x + 25);
  r.selectSlot(0); assert.equal(isInvulnerable(p), false);
});
test('Balloon también evita el golpe de Morgan y la inmunidad termina al desinflarse', () => {
  const r = new Run(); improveAttack(r.player, 'balloon'); r.beginMorgan(); r.selectSlot(1); r.player.hp = 80;
  r.player.attacks.find(a => a.id === 'balloon')!.cooldown = 1;
  const b = r.encounter!; b.body.x = r.player.x + 50; b.body.y = r.player.y;
  b.prepare(MORGAN_ATTACKS[0], r.player, r.world);
  for (let i = 0; i < 80; i++) r.update(1 / 60, axis);
  assert.ok(isInvulnerable(r.player)); assert.ok(r.player.hp >= 80);
  for (let i = 0; i < 50; i++) r.update(1 / 60, axis);
  assert.equal(isInvulnerable(r.player), false); const hp = r.player.hp;
  r.player.hurtTimer = 0; b.prepare(MORGAN_ATTACKS[0], r.player, r.world);
  for (let i = 0; i < 73; i++) r.update(1 / 60, axis);
  assert.ok(r.player.hp < hp - 30);
});
test('la quinta carta no abre unión; solo el objeto de jefe permite juntar sin alterar cooldowns', () => {
  const r = new Run(); for (const id of ['gatling', 'bazooka', 'whip']) improveAttack(r.player, id);
  r.status = 'levelup'; r.player.choices = [{ kind: 'ability', id: 'ability:fury', abilityId: 'fury', name: 'Furia', description: '', symbol: '', max: 6 }];
  assert.equal(r.selectUpgrade('ability:fury'), false); assert.equal(r.pendingAbility, undefined);
  r.status = 'playing'; r.openCombinations(); const state = r.player.attacks[1]; state.level = 3; state.cooldown = 4.2;
  const slots = JSON.stringify(r.player.abilitySlots); assert.equal(r.joinPair(1, 0), false); assert.equal(JSON.stringify(r.player.abilitySlots), slots);
  r.grantCombinationReward(); assert.equal(r.joinPair(0, 0), false); assert.equal(r.joinPair('pending', 0), false);
  assert.equal(r.joinPair(1, 0), true); assert.equal(r.player.attacks.length, 4); assert.equal(state.level, 3); assert.equal(state.cooldown, 4.2); assert.equal(r.unionTokens, 0);
});
test('pareja por recompensa de jefe funciona con menos de cinco y se consume una vez', () => {
  const r = new Run(); improveAttack(r.player, 'gatling'); r.grantCombinationReward(); r.openCombinations();
  assert.equal(r.joinPair(0, 1), true); assert.equal(r.canJoinMovements, false); assert.equal(r.player.attacks.length, 2);
  r.openCombinations(); assert.equal(r.joinPair(0, 1), false); r.cancelCombinations();
});
test('recoger otro objeto permite conservar o reemplazar, siempre un solo efecto equipado', () => {
  const r = new Run(), p = r.player; equipItem(p, 'vest'); const armor = p.stats.armor;
  const offer = () => { const item = r.pickups.acquire()!; Object.assign(item, { x: p.x, y: p.y, kind: 'item', itemId: 'whetstone', value: 0 }); r.update(1 / 60, axis); };
  offer(); assert.equal(r.status, 'item'); assert.deepEqual(p.items, { vest: 1 }); r.selectItem(false); assert.equal(p.stats.armor, armor);
  offer(); assert.equal(r.selectItem(true), true); assert.deepEqual(p.items, { whetstone: 1 }); assert.equal(p.stats.armor, p.baseStats.armor);
  assert.ok(p.stats.damage > p.baseStats.damage); assert.equal(r.selectItem(true), false); assert.deepEqual(new Run().player.items, {});
});
