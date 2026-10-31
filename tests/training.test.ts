import test from 'node:test';
import assert from 'node:assert/strict';
import { SaveStore, freshProgress, SAVE_KEY } from '../src/platform/persistence/save.ts';
import { Run } from '../src/game/core/run.ts';
import { TRAINING, trainingLevel, trainingCost } from '../src/content/training.ts';
import { chooseUpgrades } from '../src/game/systems/progression.ts';
import { canImproveAttack } from '../src/game/systems/loadout.ts';
const memory = () => { const data = new Map<string, string>(); return { data, storage: { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => { data.set(k, v); } } }; };
test('migración preserva berries/récords y convierte solo entrenamiento anterior de Luffy', () => {
  const { data, storage } = memory(); data.set(SAVE_KEY, JSON.stringify({ ...freshProgress(), coins: 123, training: 2, bestLevel: 19 }));
  const store = new SaveStore(storage), p = store.getTraining('luffy'); assert.equal(p.levels.vitality, 2); assert.equal(store.progress.coins, 123); assert.equal(store.progress.bestLevel, 19);
  assert.equal(new Run('luffy', p).player.stats.maxHp, 116); assert.deepEqual(store.getTraining('zoro').levels, {});
  assert.equal(new SaveStore(storage).getTraining('luffy').levels.vitality, 2); assert.equal(trainingLevel(p), 3);
});
test('compra específica: coste creciente, límite, personaje independiente y sin berries negativos', () => {
  const { storage } = memory(), store = new SaveStore(storage); store.progress.coins = 1000;
  assert.ok(store.buyTraining('zoro', 'force')); assert.equal(store.progress.coins, 1000 - trainingCost('force', 0));
  assert.equal(store.getTraining('zoro').levels.force, 1); assert.equal(store.getTraining('luffy').levels.force, undefined);
  assert.ok(trainingCost('force', 1) > trainingCost('force', 0)); store.progress.coins = 0;
  assert.equal(store.buyTraining('zoro', 'force'), false); assert.equal(store.buyTraining('unknown', 'force'), false);
  store.progress.coins = 1e6; for (let i = 0; i < TRAINING.force.max; i++) store.buyTraining('zoro', 'force');
  assert.equal(store.buyTraining('zoro', 'force'), false); assert.equal(store.getTraining('zoro').levels.force, 10);
  const hp = new Run('zoro', store.getTraining('zoro')).player.stats.damage; assert.ok(hp > new Run('zoro').player.stats.damage);
});
test('configuración de inicio/vetos y cambios de cartas se compra por personaje y se reinicia por partida', () => {
  const { storage } = memory(), store = new SaveStore(storage); store.progress.coins = 1e6;
  for (const id of ['starter', 'repertoire', 'bans', 'rerolls']) assert.ok(store.buyTraining('luffy', id));
  assert.equal(store.configureTraining('luffy', 'gatling', 'whip', ['balloon']), true);
  assert.equal(store.configureTraining('luffy', 'gatling', 'gatling', []), false);
  const r = new Run('luffy', store.getTraining('luffy')); assert.deepEqual(r.player.attacks.map(a => a.id), ['gatling', 'whip']);
  assert.equal(canImproveAttack(r.player, 'balloon'), false);
  for (let i = 0; i < 20; i++) assert.ok(chooseUpgrades({}, () => i / 20, r.player).every(c => !('kind' in c) || c.abilityId !== 'balloon'));
  r.status = 'levelup'; assert.equal(r.rerollChoices(), true); assert.equal(r.rerollChoices(), false);
  const fresh = new Run('luffy', store.getTraining('luffy')); assert.equal(fresh.player.rerolls, 1); assert.equal(fresh.player.level, 1); assert.deepEqual(fresh.player.items, {});
  assert.equal(store.import(JSON.stringify({ ...store.progress, characterTraining: { luffy: { levels: { force: 99 }, bans: [] } } })), false);
});
test('bonus de XP y berries se aplican al recoger y el guardado redondea una vez sin duplicar', () => {
  const { storage } = memory(), store = new SaveStore(storage); store.progress.coins = 1000;
  store.buyTraining('luffy', 'experience'); store.buyTraining('luffy', 'fortune'); const r = new Run('luffy', store.getTraining('luffy'));
  for (const kind of ['xp', 'berry'] as const) { const p = r.pickups.acquire()!; Object.assign(p, { x: r.player.x, y: r.player.y, kind, value: 10 }); }
  r.update(1 / 60, { x: 0, y: 0 }); assert.equal(r.player.xp, 10.5); assert.equal(r.player.collectedBerries, 10.8);
  const before = store.progress.coins; store.bank(r.id, Math.floor(r.player.collectedBerries)); store.bank(r.id, Math.floor(r.player.collectedBerries)); assert.equal(store.progress.coins, before + 10);
});
test('la extremidad ofensiva no es hurtbox; contacto y proyectil real explican el daño', () => {
  const r = new Run(), p = r.player, e = r.enemies.acquire()!; p.attacks[0].cooldown = 1e6;
  Object.assign(e, { id: 99, x: p.x + 120, y: p.y, hp: 10000, maxHp: 10000, damage: 20, speed: 0, radius: 13, xp: 0 });
  r.strikes.push({ x: p.x, y: p.y, angle: 0, reach: 150, arc: 1, life: .36, ownerId: p.id, behavior: 'sweep', evolved: false, splash: 0, impact: { x: e.x, y: e.y }, visual: 'rubber-kick' });
  r.update(1 / 60, { x: 0, y: 0 }); assert.equal(p.hp, p.stats.maxHp);
  e.x = p.x + 20; r.update(1 / 60, { x: 0, y: 0 }); assert.ok(p.hp < p.stats.maxHp); assert.equal(p.lastHit, 'CONTACTO'); e.active = false;
  p.hp = p.stats.maxHp; p.hurtTimer = 0; const bullet = r.projectiles.acquire()!; Object.assign(bullet, { x: p.x + 120, y: p.y, vx: 0, vy: 0, radius: 3, life: 3, damage: 10, hostile: true });
  r.update(1 / 60, { x: 0, y: 0 }); assert.equal(p.hp, p.stats.maxHp);
  bullet.x = p.x + 40; bullet.vx = -1800; r.update(1 / 60, { x: 0, y: 0 }); assert.ok(p.hp < p.stats.maxHp); assert.equal(p.lastHit, 'PROYECTIL');
});
test('comida también se atrae desde el radio base aumentado, sin atravesar paredes', () => {
  const r = new Run(), p = r.player; p.hp = 20; const food = r.pickups.acquire()!; Object.assign(food, { x: p.x + 80, y: p.y, kind: 'food', value: 12, life: 20 });
  const x = food.x; r.update(1 / 60, { x: 0, y: 0 }); assert.ok(food.x < x); assert.ok(p.stats.magnet > 75);
  for (let i = 0; i < 30; i++) r.update(1 / 60, { x: 0, y: 0 }); assert.equal(food.active, false); assert.ok(p.hp >= 32);
});
