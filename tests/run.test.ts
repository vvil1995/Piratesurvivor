import test from 'node:test';
import assert from 'node:assert/strict';
import { Run } from '../src/game/core/run.ts';
import { UPGRADES } from '../src/content/catalog.ts';
import { chooseUpgrades } from '../src/game/systems/progression.ts';
import { SaveStore, SAVE_KEY, freshProgress } from '../src/platform/persistence/save.ts';
import { spawnEnemy } from '../src/game/systems/spawner.ts';
import { FlowField } from '../src/game/navigation/flow-field.ts';
import { SpatialGrid } from '../src/game/spatial/grid.ts';

function seeded() { let s = 19; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }
function storage() { const data = new Map<string, string>(); return { data, getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } }; }

test('movimiento diagonal, límites y pausa no alteran tiempo ni vida', () => {
  const a = new Run(), b = new Run();
  a.update(1 / 60, { x: 1, y: 0 }); b.update(1 / 60, { x: 1, y: 1 });
  assert.ok(Math.abs(Math.hypot(b.player.x - 256, b.player.y - 256) - (a.player.x - 256)) < 1e-8);
  b.pause(); const t = b.time, x = b.player.x; b.update(1 / 30, { x: 1, y: 0 });
  assert.equal(b.time, t); assert.equal(b.player.x, x);
  b.resume(); b.player.x = -100000; b.player.y = 256; b.update(1 / 30, { x: -1, y: 0 }); assert.ok(b.player.x < -100000);
});
test('generación fuera de cámara y sin superar el pool', () => {
  const run = new Run(), random = seeded();
  const view = { width: 920, height: 600, centerX: 256, centerY: 256 };
  const field = new FlowField(run.world); field.update(run.player, 1);
  for (let i = 0; i < 700; i++) spawnEnemy(run.enemies, [run.player], view, run.world, field, run.definition, random, i);
  assert.equal(run.enemies.count, 150);
  for (const e of run.enemies.items) { assert.ok(run.world.canOccupy(e.x, e.y, 14)); assert.ok(Math.abs(e.x - 256) > 460 || Math.abs(e.y - 256) > 300); }
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
test('derrota se detiene; explorar no termina automáticamente a los diez minutos', () => {
  const lost = new Run(); lost.player.hp = 0; lost.update(1 / 60, { x: 0, y: 0 }); assert.equal(lost.status, 'defeat');
  const frozen = lost.time; lost.update(1, { x: 1, y: 0 }); assert.equal(lost.time, frozen);
  const exploring = new Run(); exploring.time = 700; exploring.update(1 / 60, { x: 0, y: 0 });
  assert.equal(exploring.status, 'playing'); assert.ok(exploring.time > 700); assert.equal(exploring.result(), undefined);
});
test('simulación con enemigos mantiene colisiones y presupuestos', () => {
  const run = new Run('luffy', 0, seeded()); run.player.baseStats.maxHp = 100000; run.player.stats.maxHp = 100000; run.player.hp = 100000;
  for (let i = 0; i < 3600; i++) {
    if (run.status === 'levelup') run.selectUpgrade(run.choices[0].id);
    run.update(1 / 60, { x: Math.cos(i / 240), y: Math.sin(i / 240) });
    if (i % 60 === 0) {
      assert.ok(run.enemies.count <= 150); assert.ok(run.pickups.count <= 180); assert.ok(run.world.chunkCount <= 128);
      assert.ok(run.world.canOccupy(run.player.x, run.player.y, 14));
      for (const e of run.enemies.items) if (e.active) assert.ok(run.world.canOccupy(e.x, e.y, e.radius));
    }
  }
  assert.notEqual(run.status, 'defeat');
});
test('graella sin alias a larga distancia y sin historial creciente de celdas', () => {
  const run = new Run(), a = run.enemies.items[0], b = run.enemies.items[1], grid = new SpatialGrid();
  Object.assign(a, { active: true, x: 128 * 96 + 1, y: 1 }); Object.assign(b, { active: true, x: 1, y: 97 });
  grid.rebuild([a, b]); const seen: unknown[] = []; grid.visit(a.x, a.y, 5, e => seen.push(e));
  assert.deepEqual(seen, [a]);
  for (let i = -500; i < 500; i++) { a.x = i * 100000; grid.rebuild([a]); assert.equal(grid.cellCount, 1); }
});
test('entrada y combate se atribuyen al actor, sin depender del alias local', () => {
  const run = new Run();
  const second = { ...run.player, id: 'player-2', x: 350, stats: { ...run.player.stats }, taken: {}, choices: [], attacks: structuredClone(run.player.attacks), abilitySlots: structuredClone(run.player.abilitySlots), learnedBuffs: [...run.player.learnedBuffs], baseStats: { ...run.player.baseStats }, modifiers: structuredClone(run.player.modifiers) };
  run.players.set(second.id, second);
  const x = second.x;
  run.update(1 / 60, new Map([['player-2', { x: 1, y: 0 }]]));
  assert.ok(second.x > x); assert.equal(run.player.x, 256);
  const enemy = run.enemies.acquire()!; Object.assign(enemy, { id: 99, x: second.x + 25, y: 256, hp: 1, damage: 0, speed: 0, radius: 13, xp: 5 });
  run.player.attacks[0].cooldown = 10; second.attacks[0].cooldown = 0; run.update(1 / 60, { x: 0, y: 0 });
  assert.equal(second.kills, 1); assert.ok(run.strikes.some(s => s.ownerId === second.id));
  assert.equal(run.player.kills, 0);
});
test('guardado, premio idempotente, entrenamiento y recarga', () => {
  const memory = storage(), store = new SaveStore(memory);
  const result = { id: 'test-run', outcome: 'victory' as const, seconds: 600, kills: 60, level: 9, coins: 110 };
  assert.equal(store.record(result), true); assert.equal(store.record(result), false);
  assert.equal(store.progress.coins, 110); assert.equal(store.buyTraining('luffy', 'vitality'), true); assert.equal(store.progress.coins, 80);
  const loaded = new SaveStore(memory); assert.equal(loaded.getTraining('luffy').levels.vitality, 1); assert.equal(loaded.progress.wins, 1);
  const trained = new Run('luffy', loaded.getTraining('luffy')); assert.equal(trained.player.hp, 108);
});
test('guardado corrupto recupera copia; sin almacenamiento sigue jugable', () => {
  const memory = storage(); memory.setItem(`${SAVE_KEY}.backup`, JSON.stringify({ ...freshProgress(), coins: 10 })); memory.setItem(SAVE_KEY, '{bad');
  const recovered = new SaveStore(memory); assert.equal(recovered.progress.coins, 10); assert.match(recovered.warning, /copia/);
  const blocked = new SaveStore({ getItem() { throw new Error(); }, setItem() { throw new Error(); } });
  assert.ok(blocked.warning); assert.equal(blocked.import('{"version":99}'), false); assert.equal(blocked.progress.coins, 0);
});

test('los ataques no atraviesan edificios y el retroceso respeta sólidos', () => {
  const run = new Run('luffy', 0, seeded());
  const wall = run.world.getChunk(0, 0).obstacles.find(o => o.kind === 'house' || o.kind === 'wall')!;
  const p = run.player;
  p.x = wall.x - 16; p.y = wall.y + 16; p.stats.range = 300;
  const enemy = run.enemies.acquire()!;
  Object.assign(enemy, { id: 990, x: wall.x + wall.width + 16, y: p.y, hp: 100, maxHp: 100, speed: 0, damage: 0, radius: 13, xp: 5 });
  run.update(1 / 60, { x: 0, y: 0 }); assert.equal(enemy.hp, 100);
  enemy.x = p.x - 24; enemy.y = p.y; p.attacks[0].cooldown = 0;
  run.update(1 / 60, { x: 0, y: 0 }); assert.ok(enemy.hp < 100); assert.ok(run.world.canOccupy(enemy.x, enemy.y, enemy.radius));
});

test('guardado v1 conserva tiempos largos y exporta sin el límite antiguo de 600 segundos', () => {
  const memory = storage(), store = new SaveStore(memory);
  store.record({ id: 'long-exploration', outcome: 'defeat', seconds: 7200, kills: 80, level: 10, coins: 20 });
  const reopened = new SaveStore(memory); assert.equal(reopened.progress.bestTime, 7200);
  const copy = new SaveStore(storage()); assert.equal(copy.import(reopened.export()), true); assert.equal(copy.progress.bestTime, 7200);
});
