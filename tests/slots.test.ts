import test from 'node:test';
import assert from 'node:assert/strict';
import { Run } from '../src/game/core/run.ts';
import { improveAttack, mergeSlots, moveAbility, validLoadout, canImproveAttack, selectSlot } from '../src/game/systems/loadout.ts';
import { tickBuffs, updateBuffModifiers } from '../src/game/systems/buffs.ts';
import { chooseUpgrades } from '../src/game/systems/progression.ts';
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-8);

test('agrupar y separar conserva identidad, nivel, ráfaga y cooldown', () => {
  const p = new Run().player; improveAttack(p, 'gatling');
  const state = p.attacks[1]; state.cooldown = 4; state.pending = 2; state.burstTimer = 0.1; state.level = 4;
  assert.equal(mergeSlots(p, 1, 0), true); assert.equal(p.attacks[1], state);
  assert.deepEqual([state.cooldown, state.pending, state.burstTimer, state.level], [4, 2, 0.1, 4]);
  assert.equal(moveAbility(p, 'gatling', 2), true); assert.equal(state.cooldown, 4);
  assert.equal(validLoadout(p), true); assert.equal(moveAbility(p, 'inventada', 1), false);
});

test('dos buffs aprendidos, combinar no libera límite y siguen mejorando a6', () => {
  const p = new Run().player;
  assert.equal(improveAttack(p, 'impulse'), true); assert.equal(improveAttack(p, 'fury'), true);
  assert.equal(canImproveAttack(p, 'fortress'), false); assert.equal(improveAttack(p, 'frenzy'), false);
  mergeSlots(p, 1, 0); mergeSlots(p, 2, 0);
  assert.equal(p.learnedBuffs.length, 2); assert.equal(canImproveAttack(p, 'fortress'), false);
  for (let i = 0; i < 5; i++) assert.equal(improveAttack(p, 'impulse'), true);
  assert.equal(canImproveAttack(p, 'impulse'), false);
  const offered = new Set<string>();
  for (let i = 0; i < 20; i++) for (const c of chooseUpgrades({}, () => i / 20, p)) offered.add(c.id);
  assert.equal(offered.has('ability:fortress'), false); assert.equal(offered.has('ability:frenzy'), false);
});

test('buff individual alterna y combinado es constante menor, sin duplicar modificadores', () => {
  const p = new Run().player; improveAttack(p, 'fury'); selectSlot(p, 1);
  tickBuffs(p, 0.01); const temporary = p.stats.damage;
  assert.ok(temporary > p.baseStats.damage);
  tickBuffs(p, 4); close(p.stats.damage, p.baseStats.damage);
  const state = p.attacks.find(a => a.id === 'fury')!, timer = state.cooldown;
  mergeSlots(p, 1, 0); updateBuffModifiers(p);
  assert.ok(p.stats.damage > p.baseStats.damage && p.stats.damage < temporary);
  assert.equal(state.cooldown, timer);
  const constant = p.stats.damage;
  for (let i = 0; i < 100; i++) tickBuffs(p, 0.1);
  close(p.stats.damage, constant); updateBuffModifiers(p); close(p.stats.damage, constant);
});

test('ranuras no admiten duplicados ni más de4 componentes y un aprendizaje no borra movimiento', () => {
  const p = new Run().player;
  for (const id of ['gatling', 'bazooka', 'whip']) improveAttack(p, id);
  assert.equal(canImproveAttack(p, 'fury'), true); assert.equal(improveAttack(p, 'fury'), false);
  assert.equal(mergeSlots(p, 1, 0), true); assert.equal(improveAttack(p, 'fury'), true);
  mergeSlots(p, 2, 0); mergeSlots(p, 3, 0);
  assert.equal(p.abilitySlots[0].length, 4); assert.equal(mergeSlots(p, 1, 0), false);
  assert.equal(validLoadout(p), true);
});

test('la quinta habilidad pausa para agrupar y se aprende exactamente una vez al confirmar', () => {
  const run = new Run(), p = run.player;
  for (const id of ['gatling', 'bazooka', 'whip']) improveAttack(p, id);
  run.status = 'levelup'; p.choices = [{ kind: 'ability', id: 'ability:fury', abilityId: 'fury', name: 'Furia', description: '', symbol: '', max: 6 }];
  assert.equal(run.selectUpgrade('ability:fury'), true); assert.equal(run.status, 'combining');
  assert.equal(p.attacks.length, 4); assert.equal(run.finishCombinations(), false);
  const time = run.time; run.update(1, { x: 1, y: 0 }); assert.equal(run.time, time);
  const first = p.attacks[0]; first.cooldown = 3.5;
  assert.equal(run.combine(1, 0), true); assert.equal(run.finishCombinations(), true);
  assert.equal(p.attacks.length, 5); assert.equal(first.cooldown, 3.5); assert.equal(p.taken['ability:fury'], 1);
  assert.equal(run.finishCombinations(), false); assert.equal(p.taken['ability:fury'], 1); assert.equal(validLoadout(p), true);
});

test('cancelar aprendizaje devuelve las cartas sin consumir nivel ni buff', () => {
  const run = new Run(), p = run.player;
  for (const id of ['gatling', 'bazooka', 'whip']) improveAttack(p, id);
  run.status = 'levelup'; p.choices = [{ kind: 'ability', id: 'ability:fury', abilityId: 'fury', name: 'Furia', description: '', symbol: '', max: 6 }];
  run.selectUpgrade('ability:fury'); run.cancelCombinations();
  assert.equal(run.status, 'levelup'); assert.equal(p.attacks.length, 4); assert.equal(p.learnedBuffs.length, 0); assert.equal(p.choices.length, 1);
});

test('una carta aprende solo un movimiento, en ranura propia; no se puede juntar antes del quinto', () => {
  const run = new Run(), p = run.player;
  run.status = 'levelup'; p.choices = ['gatling', 'bazooka', 'whip'].map(id => ({ kind: 'ability', id: `ability:${id}`, abilityId: id, name: id, description: '', symbol: '', max: 6 }));
  assert.equal(run.selectUpgrade('ability:gatling'), true);
  assert.deepEqual(p.abilitySlots, [['elastic-punch'], ['gatling'], [], []]);
  assert.equal(p.attacks.length, 2); assert.equal(run.selectUpgrade('ability:whip'), false);
  run.openCombinations(); assert.equal(run.canJoinMovements, false);
  assert.equal(run.combine(1, 0), false); assert.equal(run.moveComponent('gatling', 0), false);
  run.finishCombinations(); assert.equal(p.attacks.length, 2);
});

test('quinto movimiento concede una agrupación, cancelar revierte y la recompensa futura se consume una vez', () => {
  const run = new Run(), p = run.player;
  for (const id of ['gatling', 'bazooka', 'whip']) improveAttack(p, id);
  const before = p.abilitySlots.map(s => [...s]);
  run.status = 'levelup'; p.choices = [{ kind: 'ability', id: 'ability:fury', abilityId: 'fury', name: 'Furia', description: '', symbol: '', max: 6 }];
  run.selectUpgrade('ability:fury'); assert.equal(run.canJoinMovements, true);
  assert.equal(run.combine(1, 0), true); assert.equal(run.canJoinMovements, false); assert.equal(run.combine(2, 0), false);
  run.cancelCombinations(); assert.deepEqual(p.abilitySlots, before); assert.equal(p.attacks.length, 4);
  run.selectUpgrade('ability:fury'); run.combine(1, 0); run.finishCombinations(); run.openCombinations();
  assert.equal(run.combine(2, 0), false);
  run.grantCombinationReward(); assert.equal(run.combine(2, 0), true); assert.equal(run.combine(3, 0), false);
});

test('capacidad futura real de dieciséis componentes, cuatro por ranura, sin reiniciar recargas', async () => {
  const { ABILITIES, MAX_LEARNED_ABILITIES } = await import('../src/content/attacks.ts');
  const { CHARACTERS } = await import('../src/content/catalog.ts');
  const original = CHARACTERS.luffy.abilities, extra = Array.from({ length: 15 }, (_, i) => `qa-future-${i}`);
  try {
    for (const id of extra) ABILITIES[id] = { ...ABILITIES.gatling, id };
    CHARACTERS.luffy.abilities = ['elastic-punch', ...extra];
    const run = new Run(), p = run.player; p.attacks[0].cooldown = 3;
    for (const id of extra) {
      if (p.abilitySlots.some(s => !s.length)) assert.equal(improveAttack(p, id), true);
      else {
        run.status = 'levelup'; p.choices = [{ kind: 'ability', id: `ability:${id}`, abilityId: id, name: id, description: '', symbol: '', max: 6 }];
        assert.equal(run.selectUpgrade(`ability:${id}`), true);
        assert.equal(run.finishCombinations(p.abilitySlots.findIndex(s => s.length < 4)), true);
      }
    }
    assert.equal(MAX_LEARNED_ABILITIES, 16); assert.equal(p.attacks.length, 16); assert.equal(validLoadout(p), true);
    assert.ok(p.abilitySlots.every(s => s.length === 4)); assert.equal(p.attacks[0].cooldown, 3);
  } finally { CHARACTERS.luffy.abilities = original; for (const id of extra) delete ABILITIES[id]; }
});
