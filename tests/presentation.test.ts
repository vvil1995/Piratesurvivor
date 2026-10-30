import test from 'node:test';
import assert from 'node:assert/strict';
import { armSocket } from '../src/game/scenes/attack-anchor.ts';
import { buffEffect } from '../src/ui/buff-info.ts';
import { ABILITIES } from '../src/content/attacks.ts';
test('hombros en ocho direcciones y manos separadas en vez de origen en el centro', () => {
  for (const d of ['s', 'se', 'e', 'ne', 'n', 'nw', 'w', 'sw'] as const) {
    const left = armSocket(d, -1), right = armSocket(d, 1);
    assert.ok(left.y <= -30 && right.y <= -30); assert.notEqual(left.x, right.x);
  }
});
test('buffs describen estadística, magnitud y modo sin inventar multiplicadores', () => {
  assert.match(buffEffect(ABILITIES.fury.buff!, 1, false), /ATK \+12%/);
  assert.match(buffEffect(ABILITIES.fury.buff!, 1, true), /ATK \+6%/);
  assert.match(buffEffect(ABILITIES.frenzy.buff!, 1, false), /−12% de cooldown/);
});
