import test from 'node:test';
import assert from 'node:assert/strict';
import { BuggyEncounter } from '../src/game/bosses/buggy.ts';
import { BUGGY_ATTACKS } from '../src/content/bosses/buggy.ts';
import { Run } from '../src/game/core/run.ts';
import { ArenaWorld, BUGGY_ARENA } from '../src/game/world/arena.ts';
import type { CollisionWorld } from '../src/game/world/world.ts';
import { improveAttack } from '../src/game/systems/loadout.ts';
import { equipItem } from '../src/game/systems/items.ts';
import { SaveStore } from '../src/platform/persistence/save.ts';
const axis = { x: 0, y: 0 }, noop = () => {};
const clear: CollisionWorld = { canOccupy: () => true, segmentClear: () => true, moveCircle: (p, x, y) => { p.x += x; p.y += y; } };
const attack = (id: string) => BUGGY_ATTACKS.find(a => a.id === id)!;
function tick(b: BuggyEncounter, p: Run['player'], seconds: number, world = clear): void {
  for (let i = 0; i < Math.ceil(seconds * 60); i++) { p.hurtTimer = Math.max(0, p.hurtTimer - 1 / 60); b.tick(1 / 60, p, world, () => axis, noop); }
}
function orange(): Run { const r = new Run('luffy', 0, () => 0.5); r.morganDefeated = true; r.boardToOrangeTown(); r.player.hurtTimer = 1e6; return r; }
function finish(r: Run): void { for (let i = 0; i < 181 && r.status === 'voyage'; i++) r.update(1 / 60, axis); }
const build = (r: Run) => JSON.stringify({ level: r.player.level, xp: r.player.xp, items: r.player.items, fruit: r.player.fruit, berries: r.player.collectedBerries, slots: r.player.abilitySlots, attacks: r.player.attacks.map(a => [a.id, a.level, a.cooldown, a.activeFor]) });
test('bomba fija destino, avisa sin daño y permite esquivar; cobertura impide explosión', () => {
  const b = new BuggyEncounter(), p = new Run().player; p.x = 400; p.y = 320;
  b.prepare(attack('bomb'), p, clear); const z = { ...b.telegraph!.zone }, hp = p.hp;
  tick(b, p, 1.3); assert.equal(p.hp, hp); p.x += 100; tick(b, p, 0.3);
  assert.equal(p.hp, hp); assert.deepEqual(b.impactZone, z);
  b.prepare(attack('bomb'), p, clear); tick(b, p, 1.6); assert.equal(p.hp, hp - 45);
  p.hurtTimer = 0; b.prepare(attack('bomb'), p, clear);
  tick(b, p, 1.6, { ...clear, segmentClear: () => false }); assert.equal(p.hp, hp - 45);
});
test('cuchillas separadas viajan por el corredor anunciado, sin golpe instantáneo lejano', () => {
  const b = new BuggyEncounter(), p = new Run().player; b.body.x = b.body.y = 0; p.x = 300; p.y = 0;
  b.prepare(attack('knives'), p, clear); const angle = b.telegraph!.zone.angle, hp = p.hp;
  tick(b, p, 1.25); assert.equal(p.hp, hp); p.y = 100;
  tick(b, p, 0.9); assert.equal(p.hp, hp); assert.equal(b.impactZone!.angle, angle);
});
test('asalto desmontable solo cambia posición al impactar y no atraviesa coberturas', () => {
  const b = new BuggyEncounter(), p = new Run().player; p.x = 400; p.y = 320;
  b.prepare(attack('split'), p, clear); const from = { x: b.body.x, y: b.body.y }, destination = { ...b.telegraph!.zone };
  tick(b, p, 1.2); assert.equal(b.body.x, from.x); p.x += 160; tick(b, p, 0.3);
  assert.equal(b.body.x, destination.x); assert.equal(b.body.y, destination.y); assert.equal(p.hp, 100);
  const world = new ArenaWorld(1, BUGGY_ARENA, 'orange'); b.body.x = 112; b.body.y = 256; p.x = 300; p.y = 256;
  b.prepare(attack('split'), p, world); assert.equal(b.telegraph!.zone.x, 112);
});
test('bombardeo muestra las tres zonas reales y solo aplica un impacto por patrón', () => {
  const b = new BuggyEncounter(), p = new Run().player; p.x = 400; p.y = 320;
  b.prepare(attack('barrage'), p, clear); const extra = b.extraWarnings.map(z => ({ ...z }));
  assert.equal(extra.length, 2); p.x = extra[0].x;
  tick(b, p, 2); assert.equal(p.hp, 45); assert.deepEqual(b.extraImpacts, extra); assert.equal(b.extraWarnings.length, 0);
  tick(b, p, 0.1); assert.equal(p.hp, 45); b.defeated(); assert.equal(b.extraImpacts.length, 0); assert.equal(b.telegraph, undefined);
});
test('Orange exige Morgan; carta propia, derrota con25HP y mismo mundo/cofres; victoria lleva a Syrup sin curar', () => {
  assert.equal(new Run().beginBuggy(), false);
  const r = orange(), world = r.world; r.explorationChests!.sync(r.world, r.player); const field = r.explorationChests;
  improveAttack(r.player, 'bazooka'); equipItem(r.player, 'vest'); r.player.fruit = 'bomu'; r.player.collectedBerries = 37; r.player.level = 22; r.player.xp = 4;
  r.buggyRoute.signal = { ...r.player }; r.update(1 / 60, axis); assert.equal(r.voyage?.destination, 'buggy'); finish(r);
  assert.equal(r.encounter!.profile.id, 'buggy'); assert.equal(r.inArena, true); assert.equal(r.visibleChests.length, 0);
  r.player.hp = 0; const before = build(r); r.update(1 / 60, axis); assert.equal(r.voyage?.destination, 'orange-return'); finish(r);
  assert.equal(r.world, world); assert.equal(r.explorationChests, field); assert.equal(r.player.hp, 25); assert.equal(build(r), before); assert.equal(r.result(), undefined);
  r.beginBuggy(); const b = r.encounter!; b.body.x = r.player.x + 40; b.body.y = r.player.y; b.body.hp = 1; r.player.attacks[0].cooldown = 0;
  r.update(1 / 60, axis); assert.ok(r.buggyDefeated); assert.equal(b.state, 'dead'); assert.ok(r.canJoinMovements);
  for (let i = 0; i < 100 && r.status === 'playing'; i++) r.update(1 / 60, axis);
  const won = build(r), hp = r.player.hp; assert.equal(r.voyage?.destination, 'syrup'); finish(r);
  assert.equal(r.zone, 'syrup-village'); assert.equal(build(r), won); assert.equal(r.player.hp, hp); assert.equal(r.beginBuggy(), false);
});
test('sesión de tres fases usa los seis patrones y refuerzos piratas limitados', () => {
  const r = orange(); r.beginBuggy(); const b = r.encounter!, seen = new Set<string>(); r.player.hurtTimer = 1e6;
  r.player.attacks.forEach(a => a.cooldown = 1e6);
  for (const ratio of [1, 0.5, 0.2]) {
    b.body.hp = b.body.maxHp * ratio;
    for (let i = 0; i < 60 * 50; i++) {
      r.update(1 / 60, axis); if (b.telegraph) seen.add(b.telegraph.attack.id);
      assert.ok(r.enemies.count <= b.profile.reinforcementCap); assert.ok(r.world.canOccupy(b.body.x, b.body.y, b.body.radius));
      assert.ok(r.enemies.items.filter(e => e.active).every(e => e.visual === 'buggy-pirate'));
    }
  }
  assert.deepEqual([...seen].sort(), BUGGY_ATTACKS.map(a => a.id).sort());
});
test('victoria de Buggy se guarda una vez y acepta perfiles anteriores sin campos nuevos', () => {
  const memory = new Map<string, string>(), storage = { getItem: (k: string) => memory.get(k) ?? null, setItem: (k: string, v: string) => { memory.set(k, v); } };
  const store = new SaveStore(storage); assert.equal(store.recordBuggyVictory('run'), true); assert.equal(store.recordBuggyVictory('run'), false);
  assert.equal(new SaveStore(storage).progress.buggyVictories, 1);
  assert.equal(store.import(JSON.stringify({ ...store.progress, buggyVictories: -1 })), false);
});
