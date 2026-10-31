import test from 'node:test';
import assert from 'node:assert/strict';
import { inDanger, zoneFor, warningStage } from '../src/game/bosses/telegraphs.ts';
import { MORGAN, MORGAN_ATTACKS } from '../src/content/bosses/morgan.ts';
import { MorganEncounter } from '../src/game/bosses/morgan.ts';
import { ArenaWorld, MORGAN_ARENA } from '../src/game/world/arena.ts';
import { Run } from '../src/game/core/run.ts';
import { SaveStore } from '../src/platform/persistence/save.ts';
import { improveAttack } from '../src/game/systems/loadout.ts';
import { equipItem } from '../src/game/systems/items.ts';
import type { CollisionWorld } from '../src/game/world/world.ts';
const clear: CollisionWorld = { canOccupy: () => true, segmentClear: () => true, moveCircle: (p, x, y) => { p.x += x; p.y += y; } };
const noop = () => {}, axis = { x: 0, y: 0 };
const step = (boss: MorganEncounter, p: Run['player'], seconds: number, world = clear, reinforcements = noop) => {
  for (let i = 0; i < Math.ceil(seconds * 60); i++) { p.hurtTimer = Math.max(0, p.hurtTimer - 1 / 60); boss.tick(1 / 60, p, world, () => axis, reinforcements); }
};
test('geometría universal: rectángulo, línea, círculo, cono y arco con hueco', () => {
  const base = { ...zoneFor(MORGAN_ATTACKS[0], axis, { x: 1, y: 0 }), length: 100, width: 40, radius: 100, innerRadius: 30, arc: Math.PI / 2 };
  for (const shape of ['rectangle', 'line'] as const) {
    assert.ok(inDanger({ ...base, shape }, { x: 100, y: 20 })); assert.equal(inDanger({ ...base, shape }, { x: 101, y: 0 }), false);
    assert.equal(inDanger({ ...base, shape }, { x: -1, y: 0 }), false);
  }
  assert.ok(inDanger({ ...base, shape: 'circle' }, { x: -100, y: 0 }));
  assert.equal(inDanger({ ...base, shape: 'circle' }, { x: 101, y: 0 }), false);
  assert.ok(inDanger({ ...base, shape: 'cone' }, { x: 1, y: 0 }));
  assert.equal(inDanger({ ...base, shape: 'cone' }, { x: -30, y: 0 }), false);
  assert.equal(inDanger({ ...base, shape: 'arc' }, { x: 29, y: 0 }), false);
  assert.ok(inDanger({ ...base, shape: 'arc' }, { x: 70, y: 0 }));
  assert.ok(inDanger({ ...base, shape: 'line', angle: Math.PI / 2 }, { x: 0, y: 50 }));
});
test('sin daño antes del aviso; orientación fijada y colisión en la posición de impacto', () => {
  const p = new Run().player, boss = new MorganEncounter(); boss.body.x = boss.body.y = 0; p.x = 80; p.y = 0;
  boss.prepare(MORGAN_ATTACKS[0], p, clear); const zone = { ...boss.telegraph!.zone }, hp = p.hp;
  step(boss, p, 0.8); assert.equal(p.hp, hp); assert.equal(warningStage(boss.telegraph!), 'preparing');
  step(boss, p, 0.3); assert.equal(p.hp, hp); assert.equal(warningStage(boss.telegraph!), 'final');
  p.y = 100; step(boss, p, 0.1); assert.equal(p.hp, hp); assert.equal(boss.state, 'impact');
  assert.equal(inDanger(zone, p), false);
  const hitBoss = new MorganEncounter(); hitBoss.body.x = hitBoss.body.y = 0; p.y = 0;
  hitBoss.prepare(MORGAN_ATTACKS[0], p, clear); step(hitBoss, p, 1.2); assert.equal(p.hp, hp - 38);
  step(hitBoss, p, 0.2); assert.equal(p.hp, hp - 38); // No golpe repetido por fotograma.
});
test('carga choca con cobertura, no atraviesa cajas y queda aturdido dos segundos', () => {
  const world = new ArenaWorld(42), boss = new MorganEncounter(), p = new Run().player;
  boss.body.x = 384; boss.body.y = 256; p.x = 650; p.y = 256;
  boss.prepare(MORGAN_ATTACKS[2], p, world); const angle = boss.telegraph!.zone.angle;
  p.y = 400; assert.equal(boss.telegraph!.zone.angle, angle); // No persigue durante el aviso.
  step(boss, p, 2, world); assert.equal(boss.state, 'stunned'); assert.ok(boss.body.x < 480 - boss.body.radius);
  assert.ok(world.canOccupy(boss.body.x, boss.body.y, boss.body.radius));
  const elapsed = boss.elapsed; step(boss, p, MORGAN.stunSeconds - elapsed - 0.05, world); assert.equal(boss.state, 'stunned');
  step(boss, p, 0.1, world); assert.notEqual(boss.state, 'stunned');
});
test('onda móvil: no daño durante preparación ni a distancia antes de que llegue', () => {
  const boss = new MorganEncounter(), p = new Run().player; boss.body.x = boss.body.y = 0; p.x = 300; p.y = 0;
  boss.prepare(MORGAN_ATTACKS[4], p, clear); const hp = p.hp;
  step(boss, p, 2); assert.equal(p.hp, hp); step(boss, p, 0.4); assert.equal(p.hp, hp);
  step(boss, p, 0.4); assert.equal(p.hp, hp - 55); step(boss, p, 0.2); assert.equal(p.hp, hp - 55);
  const protectedBoss = new MorganEncounter(), world = new ArenaWorld(1);
  protectedBoss.body.x = 384; protectedBoss.body.y = 256; p.x = 650; p.y = 256; p.hurtTimer = 0;
  protectedBoss.prepare(MORGAN_ATTACKS[4], p, world); const before = p.hp; step(protectedBoss, p, 2.5, world); assert.equal(p.hp, before);
});
test('arena cerrada, fases configurables y refuerzos limitados lejos del jugador', () => {
  const r = new Run(); assert.equal(r.boardToOrangeTown(), false); assert.equal(r.beginMorgan(), true); assert.equal(r.beginMorgan(), false);
  assert.equal(r.world.canOccupy(0, 0, 14), false);
  for (const cover of MORGAN_ARENA.covers) assert.equal(r.world.canOccupy(cover.x + 16, cover.y + 16, 14), false);
  const boss = r.encounter!; boss.body.hp = boss.body.maxHp * 0.5;
  boss.tick(1 / 60, r.player, r.world, () => axis, noop); assert.equal(boss.phase, 2);
  boss.body.hp = boss.body.maxHp * 0.2; boss.tick(1 / 60, r.player, r.world, () => axis, noop); assert.equal(boss.phase, 3);
  for (const attack of r.player.attacks) attack.cooldown = 1e6;
  r.player.hp = 1000;
  for (let n = 0; n < 3; n++) {
    boss.prepare(MORGAN_ATTACKS[3], r.player, r.world);
    for (let i = 0; i < 73; i++) r.update(1 / 60, axis);
    assert.ok(r.enemies.count <= MORGAN.reinforcementCap);
  }
  assert.ok(r.enemies.count >= 3);
});
test('victoria cancela peligros, recompensa una combinación y transición conserva la build y HP', () => {
  const r = new Run(); improveAttack(r.player, 'bazooka'); equipItem(r.player, 'vest'); r.player.hp = 73; r.player.xp = 3;
  r.player.attacks[0].activeFor = 2; r.player.attacks[0].cooldown = 1e6;
  r.beginMorgan(); assert.equal(r.player.hp, 73); const boss = r.encounter!;
  boss.body.x = r.player.x + 50; boss.body.y = r.player.y; boss.body.hp = 1; boss.prepare(MORGAN_ATTACKS[0], r.player, r.world);
  r.player.attacks[0].cooldown = 0; r.update(1 / 60, axis);
  assert.equal(r.morganDefeated, true); assert.equal(boss.state, 'dead'); assert.equal(boss.telegraph, undefined); assert.equal(r.enemies.count, 0);
  const snapshot = JSON.stringify({ attacks: r.player.attacks, items: r.player.items, hp: r.player.hp, level: r.player.level, xp: r.player.xp, slots: r.player.abilitySlots });
  assert.equal(r.openCombinations(), true); assert.equal(r.canJoinMovements, true); assert.equal(r.combine(1, 0), true); assert.equal(r.canJoinMovements, false); r.finishCombinations();
  const after = JSON.stringify({ hp: r.player.hp, level: r.player.level, items: r.player.items, attacks: r.player.attacks.map(a => ({ id: a.id, level: a.level, cooldown: a.cooldown, activeFor: a.activeFor })), xp: r.player.xp, slots: r.player.abilitySlots });
  assert.equal(r.boardToOrangeTown(), true); assert.equal(r.zone, 'orange-town');
  assert.equal(JSON.stringify({ hp: r.player.hp, level: r.player.level, items: r.player.items, attacks: r.player.attacks.map(a => ({ id: a.id, level: a.level, cooldown: a.cooldown, activeFor: a.activeFor })), xp: r.player.xp, slots: r.player.abilitySlots }), after);
  assert.ok(snapshot.includes('73')); assert.equal(r.beginMorgan(), false); assert.equal(new Run().morganDefeated, false);
  const memory = new Map<string, string>(), store = new SaveStore({ getItem: k => memory.get(k) ?? null, setItem: (k, v) => { memory.set(k, v); } });
  assert.equal(store.recordMorganVictory(r.id), true); assert.equal(store.recordMorganVictory(r.id), false); assert.equal(store.progress.morganVictories, 1);
});
test('muerte del jugador cancela avisos y reinicio no hereda el encuentro', () => {
  const r = new Run(); r.beginMorgan(); r.encounter!.prepare(MORGAN_ATTACKS[4], r.player, r.world);
  r.player.hp = 0; r.update(1 / 60, axis); assert.equal(r.status, 'voyage'); assert.equal(r.voyage?.destination, 'shells'); assert.equal(r.encounter!.telegraph, undefined);
  const fresh = new Run(); assert.equal(fresh.encounter, undefined); assert.equal(fresh.zone, 'shells-town');
});
test('Morgan encuentra una ruta alrededor de cajas usando su radio real', () => {
  const r = new Run(); r.beginMorgan(); const boss = r.encounter!;
  boss.body.x = 600; boss.body.y = 256; r.player.x = 176; r.player.y = 256; r.player.hurtTimer = 1000;
  for (const attack of r.player.attacks) attack.cooldown = 1e6;
  for (let i = 0; i < 360; i++) r.update(1 / 60, axis);
  assert.ok(boss.body.x < 350, `No rodeó la cobertura: ${boss.body.x},${boss.body.y}`);
  assert.ok(r.world.canOccupy(boss.body.x, boss.body.y, boss.body.radius));
});
test('sesión de patrones completa: tres fases, cinco movimientos y máximo doce refuerzos', () => {
  const r = new Run(); r.beginMorgan(); const b = r.encounter!, seen = new Set<string>();
  r.player.hurtTimer = 1000000;
  for (const a of r.player.attacks) a.cooldown = 1e6;
  for (const ratio of [1, 0.5, 0.2]) {
    b.body.hp = b.body.maxHp * ratio;
    for (let i = 0; i < 3600; i++) {
      r.update(1 / 60, axis);
      if (b.telegraph) seen.add(b.telegraph.attack.id);
      assert.ok(r.enemies.count <= MORGAN.reinforcementCap); assert.ok(r.world.canOccupy(b.body.x, b.body.y, b.body.radius));
    }
  }
  assert.deepEqual([...seen].sort(), MORGAN_ATTACKS.map(a => a.id).sort());
});

test('Morgan: campo ampliado y refuerzos desde primera fase, con límite configurable',()=>{
 const r=new Run();r.beginMorgan();r.player.hurtTimer=1e6;for(const a of r.player.attacks)a.cooldown=1e6;
 assert.ok(MORGAN_ARENA.width>2560&&MORGAN_ARENA.height>1792);
 for(let i=0;i<60*7;i++)r.update(1/60,axis);assert.equal(r.enemies.count,6);
 for(let i=0;i<60*15;i++)r.update(1/60,axis);assert.equal(r.enemies.count,12);assert.equal(r.enemies.count,MORGAN.reinforcementCap);
 for(let i=0;i<60*28;i++)r.update(1/60,axis);assert.ok(r.enemies.items.filter(e=>e.active).every(e=>Math.hypot(e.x-r.player.x,e.y-r.player.y)<100));
});
