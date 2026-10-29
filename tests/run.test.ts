import test from 'node:test';
import assert from 'node:assert/strict';
import { Run } from '../src/game/core/run.ts';
import { MARINEFORD, UPGRADES } from '../src/content/catalog.ts';
import { chooseUpgrades } from '../src/game/systems/progression.ts';
import { SaveStore, SAVE_KEY, freshProgress } from '../src/platform/persistence/save.ts';
import { spawnMarine } from '../src/game/systems/spawner.ts';

function seeded() { let s = 19; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }
function storage() { const data = new Map<string, string>(); return { data, getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } }; }

test('movimiento diagonal, límites y pausa no alteran tiempo ni vida', () => {
  const a = new Run(), b = new Run();
  a.update(1 / 60, { x: 1, y: 0 }); b.update(1 / 60, { x: 1, y: 1 });
  assert.ok(Math.abs(Math.hypot(b.player.x - 1200, b.player.y - 900) - (a.player.x - 1200)) < 1e-8);
  b.pause(); const t = b.time, x = b.player.x; b.update(1 / 30, { x: 1, y: 0 });
  assert.equal(b.time, t); assert.equal(b.player.x, x);
  b.resume(); b.player.x = MARINEFORD.width - 45; b.update(1 / 30, { x: 1, y: 0 }); assert.equal(b.player.x, MARINEFORD.width - 45);
});
test('generación fuera de cámara y sin superar el pool', () => {
  const run = new Run(), random = seeded();
  const view = { width: 920, height: 600, centerX: 1200, centerY: 900 };
  for (let i = 0; i < 500; i++) spawnMarine(run.enemies, run.player, 0, view, random, i);
  assert.equal(run.enemies.count, 150);
  for (const e of run.enemies.items) assert.ok(Math.abs(e.x - 1200) > 460 || Math.abs(e.y - 900) > 300);
});
test('combate, XP y mejora única; escoger dos veces no aplica de nuevo', () => {
  const run = new Run('luffy', 0, seeded()), p = run.player;
  const enemy = run.enemies.acquire()!;
  Object.assign(enemy, { id: 1, x: p.x + 22, y: p.y, hp: 1, maxHp: 1, speed: 0, damage: 0, xp: 30, radius: 13 });
  for (let i = 0; i < 30 && run.status === 'playing'; i++) run.update(1 / 60, { x: 0, y: 0 });
  assert.equal(p.kills, 1); assert.equal(run.status, 'levelup'); assert.equal(p.level, 2); assert.equal(run.choices.length, 3);
  const choice = run.choices[0]; assert.equal(run.selectUpgrade(choice.id), true); assert.equal(run.selectUpgrade(choice.id), false); assert.equal(run.taken[choice.id], 1);
});
test('cartas distintas, límites y opción de recuperación al agotarse', () => {
  const random = seeded(), choices = chooseUpgrades({}, random);
  assert.equal(new Set(choices.map(c => c.id)).size, 3);
  const taken = Object.fromEntries(UPGRADES.map(u => [u.id, u.max]));
  assert.ok(chooseUpgrades(taken, random).every(c => c.id.startsWith('recover-')));
});
test('derrota y victoria producen resultado y se detienen', () => {
  const lost = new Run(); lost.player.hp = 0; lost.update(1 / 60, { x: 0, y: 0 }); assert.equal(lost.status, 'defeat');
  const won = new Run(); won.time = 600 - 1 / 60; won.update(1 / 60, { x: 0, y: 0 }); assert.equal(won.status, 'victory');
  const result = won.result()!; won.update(1 / 60, { x: 1, y: 0 }); assert.deepEqual(won.result(), result);
});
test('simulación de diez minutos con 150 enemigos mantiene límites y llega a victoria', () => {
  const run = new Run('luffy', 0, seeded());
  // Resistencia de QA: prueba todo el reloj sin depender del equilibrio del personaje.
  run.player.stats.maxHp = 100000; run.player.hp = 100000;
  for (let i = 0; i < 36001 && run.status !== 'victory'; i++) {
    if (run.status === 'levelup') run.selectUpgrade(run.choices[0].id);
    const angle = i / 240;
    run.update(1 / 60, { x: Math.cos(angle), y: Math.sin(angle) });
    assert.ok(run.enemies.count <= 150); assert.ok(run.pickups.count <= 180);
  }
  assert.equal(run.status, 'victory'); assert.equal(run.time, 600); assert.ok(run.player.kills > 0);
});
test('guardado, premio idempotente, entrenamiento y recarga', () => {
  const memory = storage(), store = new SaveStore(memory);
  const result = { id: 'test-run', outcome: 'victory' as const, seconds: 600, kills: 60, level: 9, coins: 110 };
  assert.equal(store.record(result), true); assert.equal(store.record(result), false);
  assert.equal(store.progress.coins, 110); assert.equal(store.train(), true); assert.equal(store.progress.coins, 80);
  const loaded = new SaveStore(memory); assert.equal(loaded.progress.training, 1); assert.equal(loaded.progress.wins, 1);
  const trained = new Run('luffy', loaded.progress.training); assert.equal(trained.player.hp, 105);
});
test('guardado corrupto recupera copia; sin almacenamiento sigue jugable', () => {
  const memory = storage(); memory.setItem(`${SAVE_KEY}.backup`, JSON.stringify({ ...freshProgress(), coins: 10 })); memory.setItem(SAVE_KEY, '{bad');
  const recovered = new SaveStore(memory); assert.equal(recovered.progress.coins, 10); assert.match(recovered.warning, /copia/);
  const blocked = new SaveStore({ getItem() { throw new Error(); }, setItem() { throw new Error(); } });
  assert.ok(blocked.warning); assert.equal(blocked.import('{"version":99}'), false); assert.equal(blocked.progress.coins, 0);
});
