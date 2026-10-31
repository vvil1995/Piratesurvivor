import test from 'node:test';
import assert from 'node:assert/strict';
import { Run } from '../src/game/core/run.ts';
import { ChestField, chestReward, largeChestReward } from '../src/game/systems/loot.ts';
import { damageEnemy } from '../src/game/systems/hits.ts';
import { SaveStore, SAVE_KEY, freshProgress } from '../src/platform/persistence/save.ts';

test('cofres deterministas sin reaparición ni curación al descargar chunks', () => {
  const r = new Run('luffy', 0, () => 0.5, { seed: 42 }), a = r.chests.active.find(c => c.active)!;
  assert.ok(a); const position = { x: a.x, y: a.y }, hp = a.hp;
  a.hp -= 3;
  r.chests.sync(r.world, { x: 10000, y: -10000 }); r.world.prune([{ x: 10000, y: -10000 }]);
  r.chests.sync(r.world, r.player); assert.equal(r.chests.active.find(c => c.id === a.id)!.hp, hp - 3);
  a.active = false; r.chests.sync(r.world, { x: -10000, y: 10000 }); r.chests.sync(r.world, r.player);
  assert.equal(r.chests.active.find(c => c.id === a.id)!.active, false);
  const other = new ChestField(); other.sync(r.world, r.player);
  assert.ok(other.active.some(c => c.x === position.x && c.y === position.y));
  assert.ok(r.chests.active.length <= 18);
  assert.ok(other.active.every(c => r.world.canOccupy(c.x, c.y, 18)));
});
test('ataques rompen cofres, no suman bajas ni empujan y generan una única recompensa', () => {
  const r = new Run('luffy', 0, () => 0.5, { seed: 42 }), c = r.chests.active.find(c => c.active)!; let rewards = 0;
  const origin = { x: c.x - 20, y: c.y }, x = c.x;
  const hit = () => damageEnemy(r.player, c, 100, 50, origin, r.world, chest => { rewards++; chestReward(r.pickups, chest, r.player.id, () => 0); }, () => 0.5);
  hit(); hit(); assert.equal(c.x, x); assert.equal(r.player.kills, 0); assert.equal(rewards, 1);
  const coin = r.pickups.items.find(p => p.active)!; assert.equal(coin.kind, 'berry'); assert.equal(coin.value, 2);
  assert.equal(r.player.collectedBerries, 0);
});
test('recolección de monedas y guardado incremental sin duplicación al morir', () => {
  const values = new Map<string, string>();
  const storage = { getItem: (k: string) => values.get(k) ?? null, setItem: (k: string, v: string) => { values.set(k, v); } };
  const s = new SaveStore(storage), r = new Run();
  const coin = r.pickups.acquire()!; Object.assign(coin, { x: r.player.x, y: r.player.y, ownerId: r.player.id, kind: 'berry', value: 3 });
  r.update(1 / 60, { x: 0, y: 0 }); assert.equal(r.player.collectedBerries, 3); assert.equal(coin.active, false);
  s.bank(r.id, 3); s.bank(r.id, 3); s.bank(r.id, 2); assert.equal(s.progress.coins, 3);
  const restored = new SaveStore(storage); restored.bank(r.id, 3); assert.equal(restored.progress.coins, 3);
  r.player.hp = 0; r.update(1 / 60, { x: 0, y: 0 }); const result = r.result()!;
  assert.equal(result.coins, 3); restored.record(result); restored.record(result); assert.equal(restored.progress.coins, 3);
  restored.bank('another-run', 2); assert.equal(restored.progress.coins, 5);
  storage.setItem(SAVE_KEY, JSON.stringify({ ...freshProgress(), coins: 123 })); assert.equal(new SaveStore(storage).progress.coins, 123);
});
test('cofre grande requiere tres segundos, pausa al alejarse y entrega botín sin cartas', () => {
  const r = new Run('luffy', 0, () => 0.5, { seed: 42 });
  const large = r.chests.active[0]; assert.ok(large); large.large = true;
  large.x = r.player.x; large.y = r.player.y; r.player.stats.armor = 0.6;
  for (const a of r.player.attacks) a.cooldown = 1e6;
  const tick = (n: number) => { for (let i = 0; i < n; i++) { r.enemies.clear(); r.update(1 / 60, { x: 0, y: 0 }); } };
  tick(60); assert.ok((large.openProgress ?? 0) > 0.9); assert.equal(r.status, 'playing');
  large.x += 100; const before = large.openProgress; tick(60); assert.equal(large.openProgress, before);
  large.x -= 100; tick(121); assert.equal(r.status, 'item'); assert.equal(large.active, false);
  assert.ok(r.pendingItem);
  assert.equal(r.pickups.count, 0);
  assert.equal(Object.keys(r.player.items).length, 0);
  const count = r.pickups.count; tick(1); assert.ok(r.pickups.count <= count); // No vuelve a entregar.

});
test('un único objeto, hasta tres niveles y sustitución sin acumular efectos', async () => {
  const { equipItem, itemChoices, replaceItem } = await import('../src/game/systems/items.ts');
  const r = new Run(), p = r.player;
  for (let i = 0; i < 3; i++) assert.equal(equipItem(p, 'haramaki'), true);
  assert.equal(equipItem(p, 'haramaki'), false); assert.equal(equipItem(p, 'whetstone'), false);
  assert.equal(itemChoices(p, () => 0).length, 1);
  assert.equal(replaceItem(p, 'vest'), true); assert.deepEqual(p.items, { vest: 1 });
  assert.equal(p.stats.speed, p.baseStats.speed); assert.equal(p.stats.armor, 0.08);
  assert.equal(replaceItem(p, 'invalid'), false); assert.deepEqual(p.items, { vest: 1 });
});

test('solo algunos enemigos dejan berries y hay que recogerlas', () => {
  for (const [roll, expected] of [[0, true], [0.9, false]] as const) {
    const r = new Run('luffy', 0, () => roll);
    for (const chest of r.chests.active) chest.active = false;
    const e = r.enemies.acquire()!;
    Object.assign(e, { id: 9999, x: r.player.x + 40, y: r.player.y, hp: 1, maxHp: 1, speed: 0, damage: 0, xp: 0, radius: 13 });
    r.update(1 / 60, { x: 0, y: 0 });
    assert.equal(e.active, false);
    assert.equal(r.pickups.items.some(p => p.active && p.kind === 'berry'), expected);
    assert.equal(r.player.collectedBerries, 0);
  }
});
test('cofres escasos: densidad determinista baja y sin duplicación al volver', () => {
  const r = new Run('luffy', 0, () => 0.5, { seed: 42 }), field = new ChestField(); let small = 0, big = 0;
  for (let x = 0; x < 90; x += 3) {
    field.sync(r.world, { x: x * 512 + 256, y: 256 });
    small += field.active.filter(c => !c.large).length; big += field.active.filter(c => c.large).length;
  }
  assert.ok(small >= 60 && small <= 120, `${small} pequeños en270 chunks`); assert.ok(big > 0 && big < 25, `${big} grandes en270 chunks`);
});
test('cada cofre grande entrega exactamente un objeto sin equipar ni botín adicional', async () => {
  const { ITEMS } = await import('../src/content/items.ts');
  const r = new Run(), chest = { x: 0, y: 0 } as never;
  const ids = Object.keys(ITEMS);
  for (let i = 0; i < ids.length; i++) {
    assert.equal(largeChestReward(r.pickups, chest, r.player, () => (i + .5) / ids.length), ids[i]);
    assert.deepEqual(r.player.items, {}); assert.equal(r.pickups.count, 0);
  }
});
test('menjar cura sin superar HP y aproximadamente diez por ciento de rivales lo deja', () => {
  let drops = 0;
  for (let i = 0; i < 100; i++) {
    const r = new Run('luffy', 0, () => (i + 0.5) / 100);
    for (const c of r.chests.active) c.active = false;
    const e = r.enemies.acquire()!; Object.assign(e, { id: 9999, x: r.player.x + 40, y: r.player.y, hp: 1, maxHp: 1, speed: 0, damage: 0, xp: 0, radius: 13 });
    r.update(1 / 60, { x: 0, y: 0 }); if (r.pickups.items.some(p => p.active && p.kind === 'food')) drops++;
  }
  assert.equal(drops, 10);
  const r = new Run(); r.player.hp = 95; const food = r.pickups.acquire()!;
  Object.assign(food, { x: r.player.x, y: r.player.y, kind: 'food', value: 12 });
  r.update(1 / 60, { x: 0, y: 0 }); assert.equal(r.player.hp, r.player.stats.maxHp); assert.equal(r.player.xp, 1);
});
test('fruta temporal: recoger, rechazar/aceptar y explosión con límite de cadencia', () => {
  const r = new Run(); for (const c of r.chests.active) c.active = false;
  const pickup = () => { const p = r.pickups.acquire()!; Object.assign(p, { x: r.player.x, y: r.player.y, kind: 'fruit', fruitId: 'bomu', value: 0 }); r.update(1 / 60, { x: 0, y: 0 }); };
  pickup(); assert.equal(r.status, 'fruit'); r.selectFruit(false); assert.equal(r.player.fruit, undefined);
  pickup(); r.selectFruit(true); assert.equal(r.player.fruit, 'bomu');
  for (let i = 0; i < 2; i++) { const e = r.enemies.acquire()!; Object.assign(e, { id: 999 + i, x: r.player.x + 40 + i * 5, y: r.player.y, hp: 1, maxHp: 1, speed: 0, damage: 0, xp: 0, radius: 13 }); }
  r.player.attacks[0].cooldown = 0; r.update(1 / 60, { x: 0, y: 0 });
  assert.equal(r.areas.count, 1); assert.equal(new Run().player.fruit, undefined);
});

test('la poca experiencia del alimento puede provocar la subida normal, sin cartas propias de botín', () => {
  const r = new Run(); r.player.xp = r.player.xpNext - 1;
  const food = r.pickups.acquire()!; Object.assign(food, { x: r.player.x, y: r.player.y, kind: 'food', value: 12 });
  r.update(1 / 60, { x: 0, y: 0 }); assert.equal(r.status, 'levelup'); assert.equal(r.player.level, 2); assert.equal(r.choices.length, 3);
});
