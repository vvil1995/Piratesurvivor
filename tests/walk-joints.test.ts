import test from 'node:test';
import assert from 'node:assert/strict';
import { detectLegJoints, legTransform } from '../src/game/scenes/walk-joints.ts';
const pixels = new Uint8ClampedArray(96 * 96 * 4);
for (let y = 60; y < 94; y++) for (const start of [27, 60]) for (let x = start; x < start + 7; x++) pixels[(y * 96 + x) * 4 + 3] = 255;

test('detecta rodillas en las piernas opacas y no en el centro transparente del lienzo', () => {
  const joints = detectLegJoints(pixels)!;
  assert.deepEqual(joints.map(l => l.knee), [{ x: 30, y: 77 }, { x: 63, y: 77 }]);
  for (const l of joints) for (const p of [l.hip, l.knee]) assert.ok(pixels[(p.y * 96 + p.x) * 4 + 3] > 96);
  assert.equal(detectLegJoints(new Uint8ClampedArray(pixels.length)), undefined);
  const oneLeg = pixels.slice(); for (let y = 60; y < 94; y++) for (let x = 48; x < 96; x++) oneLeg[(y * 96 + x) * 4 + 3] = 0;
  assert.equal(detectLegJoints(oneLeg), undefined);
});

test('maluc fijo y rodilla compartida entre segmentos para todo el ciclo, escalas y giro corporal', () => {
  for (const scale of [0.6, 0.65, 1.2]) for (const angle of [-0.9, 0, 0.9]) for (const joint of detectLegJoints(pixels)!) {
    const body = { x: 140, y: 200, scaleX: scale * 1.1, scaleY: scale, angle, originX: 0.5, originY: 0.96 };
    const root = legTransform(body, joint, 0).root;
    for (let degrees = -24; degrees <= 24; degrees += 2) {
      const t = legTransform(body, joint, degrees), a = (angle + degrees) * Math.PI / 180;
      assert.deepEqual(t.root, root);
      const dx = (joint.knee.x - joint.hip.x) * body.scaleX, dy = (joint.knee.y - joint.hip.y) * body.scaleY;
      assert.ok(Math.abs(t.knee.x - root.x - dx * Math.cos(a) + dy * Math.sin(a)) < 1e-9);
      assert.ok(Math.abs(t.knee.y - root.y - dx * Math.sin(a) - dy * Math.cos(a)) < 1e-9);
    }
  }
});
