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
