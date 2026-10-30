import test from 'node:test';
import assert from 'node:assert/strict';
import { ActorAnimation, movementDirection } from '../src/game/scenes/actor-animation.ts';

test('ocho direcciones visuales y pasos según desplazamiento, no según ataque', () => {
  const expected = ['e', 'se', 's', 'sw', 'w', 'nw', 'n', 'ne'];
  for (let i = 0; i < 8; i++) assert.equal(movementDirection(Math.cos(i * Math.PI / 4), Math.sin(i * Math.PI / 4)), expected[i]);
  const actor = new ActorAnimation(); actor.update('p1', 0, 0, true);
  actor.update('p1', 0, -8, true); assert.equal(actor.direction, 'n'); assert.ok(actor.frame > 0);
  actor.update('p1', 0, -8, true); assert.ok(actor.frame > 0);
  for (let i = 0; i < 6; i++) actor.update('p1', 0, -8, true);
  assert.equal(actor.frame, 0);
  actor.update('p1', 8, 0, false); assert.equal(actor.frame, 0);
  actor.update('p2', 1000, 1000, true); assert.equal(actor.frame, 0); assert.equal(actor.direction, 's');
});

test('apoyo de pies por distancia y ausencia de balanceo en reposo o movimiento reducido', () => {
  const actor = new ActorAnimation(); actor.update('a', 0, 0, true);
  actor.update('a', 24, 0, true); assert.equal(actor.footfall, false);
  actor.update('a', 48, 0, true); assert.equal(actor.footfall, true); assert.ok(actor.weight > 0);
  actor.update('a', 48, 0, true); assert.equal(actor.footfall, false);
  for (let i = 0; i < 6; i++) actor.update('a', 48, 0, true);
  assert.equal(actor.weight, 0); assert.equal(actor.lean, 0);
  actor.update('a', 60, 0, false); assert.equal(actor.footfall, false); assert.equal(actor.weight, 0);
});

test('el paso lateral y diagonal flexiona rodilla, alterna piernas y vuelve a reposo', async () => {
  const { legPose } = await import('../src/game/scenes/walk-pose.ts');
  for (const direction of ['e', 'w', 'ne', 'nw', 'se', 'sw', 'n', 's'] as const) {
    const a = legPose(direction, Math.PI / 2, -1, true), b = legPose(direction, Math.PI / 2, 1, true);
    assert.ok(Math.abs(a.thigh - b.thigh) >= 24); assert.ok(Math.abs(a.knee) > 0); assert.ok(Math.abs(b.knee) === 0);
    assert.deepEqual(legPose(direction, Math.PI / 2, -1, false), { thigh: 0, knee: 0 });
  }
});
