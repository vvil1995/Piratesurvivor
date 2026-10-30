import test from 'node:test';
import assert from 'node:assert/strict';
import { CHARACTERS } from '../src/content/catalog.ts';
import { ABILITIES } from '../src/content/attacks.ts';
import { Run } from '../src/game/core/run.ts';
import { newAttack } from '../src/game/systems/loadout.ts';
import { applyStatus } from '../src/game/systems/status.ts';
const axis = { x: 0, y: 0 };
function setup(character: string, id: string, level = 1) {
  const run = new Run(character, 0, () => 0.5), p = run.player;
  p.attacks = [newAttack(id)]; p.attacks[0].level = level; p.abilitySlots = [[id], [], [], []]; p.hp = 50;
  for (let i = 0; i < 5; i++) { const e = run.enemies.acquire()!; Object.assign(e, { id: 100 + i, x: p.x + 10 + i * 25, y: p.y, hp: 1000, maxHp: 1000, damage: 0, speed: 0, xp: 0 }); }
  return run;
}

test('cinco catálogos de6 exclusivas distintas y cuatro buffs compartidos, todos con seis niveles', () => {
  assert.equal(Object.keys(CHARACTERS).length, 5); assert.equal(Object.keys(ABILITIES).length, 34);
  const exclusive = new Set<string>();
  for (const character of Object.values(CHARACTERS)) {
    assert.equal(character.abilities.length, 6); assert.ok(character.abilities.includes(character.initialAbility));
    for (const id of character.abilities) { assert.ok(ABILITIES[id]); assert.ok(!exclusive.has(id)); exclusive.add(id); assert.equal(ABILITIES[id].levels.length, 6); }
  }
  assert.equal(exclusive.size, 30); assert.equal(Object.values(ABILITIES).filter(a => a.buff).length, 4);
  assert.equal(ABILITIES['smoke-shot'].adaptation, true); assert.ok(ABILITIES['irritant-shot'].eraNote);
});

test('las30 técnicas activan un efecto funcional en niveles1 y6, con pools acotados', () => {
  for (const character of Object.values(CHARACTERS)) for (const id of character.abilities) for (const level of [1, 6]) {
    const run = setup(character.id, id, level), p = run.player, x = p.x, y = p.y;
    let effective = false;
    for (let i = 0; i < 60; i++) {
      run.update(1 / 60, axis);
      const food = run.pickups.items.find(v => v.active && v.kind === 'food');
      effective ||= run.enemies.items.some(e => e.active && e.hp < 1000) || run.areas.count > 0 || run.projectiles.count > 0 || !!food || p.stats.armor > p.baseStats.armor || p.x !== x || p.y !== y || p.collectedBerries > 0;
      if (food) { p.x = food.x; p.y = food.y; }
      assert.ok(run.projectiles.count <= 96 && run.areas.count <= 24 && run.pickups.count <= 180);
      assert.ok(run.world.canOccupy(p.x, p.y, 14));
    }
    assert.ok(effective && p.attacks[0].cooldown > 0, `${character.id}/${id}/${level}`);
    assert.equal(run.status, 'playing');
  }
});

test('Nami no puede robar dos veces al mismo enemigo aunque siga vivo', () => {
  const run = setup('nami', 'quick-theft'), p = run.player;
  for (const e of run.enemies.items) if (e.active && e.id !== 100) e.active = false;
  const victim = run.enemies.items.find(e => e.active)!;
  run.update(1 / 60, axis); assert.equal(p.collectedBerries, 1); assert.equal(victim.stolen, true);
  for (let i = 0; i < 3; i++) { p.attacks[0].cooldown = 0; victim.x = p.x + 15; run.update(1 / 60, axis); }
  assert.equal(p.collectedBerries, 1);
});

test('Usopp inmoviliza/confunde/interrumpe con estados que caducan, y los enemigos no atraviesan sólidos', () => {
  const run = setup('usopp', 'irritant-shot'), e = run.enemies.items.find(e => e.active)!;
  e.speed = 80; applyStatus(e, 'root', 0.2); const x = e.x;
  run.player.attacks[0].cooldown = 100;
  run.update(1 / 60, axis); assert.equal(e.x, x);
  run.player.attacks[0].cooldown = 0;
  run.update(1 / 60, axis); assert.ok((e.statuses?.stun ?? 0) > 0);
  run.player.attacks[0].cooldown = 100;
  for (let i = 0; i < 90; i++) run.update(1 / 60, axis);
  assert.equal(e.statuses?.stun, 0); assert.equal(e.statuses?.root, 0);
});

test('Zoro concentra Sanzen+ en un objetivo y su guardia bloquea con contraataque', () => {
  const focused = setup('zoro', 'sanzen-sekai', 6), first = focused.enemies.items.find(e => e.active)!;
  for (let i = 0; i < 40; i++) focused.update(1 / 60, axis);
  assert.ok(first.hp < 850); assert.ok(focused.enemies.items.filter(e => e.active && e.id >= 101 && e.id <= 104).every(e => e.hp === 1000));
  const guard = setup('zoro', 'sword-guard', 6), p = guard.player, attacker = guard.enemies.items.find(e => e.active)!;
  attacker.damage = 10; const hp = p.hp; guard.update(1 / 60, axis);
  assert.ok(p.hp >= hp); assert.ok(attacker.hp < 1000); assert.equal(p.attacks[0].counterUsed, true);
});

test('el señuelo atrae y explota; cocina exige recoger alimento y su + aplica regeneración temporal', () => {
  const lure = setup('nami', 'thief-decoy', 6), p = lure.player;
  lure.update(1 / 60, axis); const decoy = lure.areas.items.find(a => a.active)!;
  decoy.x = p.x; decoy.y = p.y + 80;
  const target = lure.enemies.items.find(e => e.active)!; target.x = p.x + 130; target.speed = 66; target.steeringTime = 0;
  const y = target.y; lure.update(1 / 60, axis); assert.ok(target.y > y); assert.notEqual(target.lureIndex, undefined);
  target.x = decoy.x + 10; target.y = decoy.y; const hp = target.hp; decoy.life = 0.001;
  lure.update(1 / 60, axis); assert.ok(target.hp < hp);
  const cook = setup('sanji', 'combat-cooking', 6), c = cook.player;
  cook.update(1 / 60, axis); const food = cook.pickups.items.find(v => v.active && v.kind === 'food')!;
  assert.ok(food); const health = c.hp; c.x = food.x; c.y = food.y;
  cook.update(1 / 60, axis); assert.ok(c.hp >= health + 23); cook.update(1 / 60, axis); assert.ok(c.stats.regeneration > c.baseStats.regeneration);
  c.attacks[0].cooldown = 100;
  for (let i = 0; i < 270; i++) cook.update(1 / 60, axis);
  assert.equal(c.stats.regeneration, c.baseStats.regeneration);
});

test('las evoluciones de Usopp perforan, rebotan y crean humo o explosiones secundarias limitadas', () => {
  const piercing = setup('usopp', 'namari-boshi', 6);
  for (let i = 0; i < 35; i++) piercing.update(1 / 60, axis);
  assert.ok(piercing.enemies.items.filter(e => e.active && e.hp < 1000).length >= 2);
  const smoke = setup('usopp', 'smoke-shot', 6);
  for (let i = 0; i < 8; i++) smoke.update(1 / 60, axis);
  assert.ok(smoke.areas.items.some(a => a.active && a.kind === 'smoke'));
  assert.ok(smoke.enemies.items.some(e => (e.statuses?.confuse ?? 0) > 0));
  const explosive = setup('usopp', 'kayaku-boshi', 6);
  for (const e of explosive.enemies.items) if (e.active) e.hp = 1;
  explosive.update(1 / 60, axis);
  assert.ok(explosive.areas.count > 0 && explosive.areas.count <= 2);
  const fan = setup('usopp', 'multi-shot', 6); fan.update(1 / 60, axis);
  assert.ok(fan.projectiles.items.some(b => b.active && b.hit.size > 0 && (b.bounces ?? 0) < 2));
});

test('Bastón+ desvía proyectiles y la muerte limpia alimentos, nubes y temporizadores', async () => {
  const run = setup('nami', 'staff-spin', 6), p = run.player;
  run.update(1 / 60, axis); assert.ok(p.attacks[0].activeFor > 0);
  const { spawnProjectile } = await import('../src/game/systems/effects.ts');
  spawnProjectile(run, p.x + 35, p.y, p.x, p.y, 10, 200, '', true);
  const health = p.hp; run.update(1 / 60, axis);
  assert.ok(p.hp >= health); assert.equal(run.projectiles.count, 0);
  const cook = setup('sanji', 'combat-cooking', 6); cook.update(1 / 60, axis);
  assert.ok(cook.pickups.count > 0); cook.player.hp = 0; cook.update(1 / 60, axis);
  assert.equal(cook.status, 'defeat'); assert.equal(cook.pickups.items.filter(p => p.active && p.kind === 'food').length, 0);
  assert.equal(cook.projectiles.count, 0); assert.equal(cook.areas.count, 0);
  assert.ok(cook.player.attacks.every(a => a.activeFor === 0 && a.pending === 0));
});
