import test from 'node:test';
import assert from 'node:assert/strict';
import { generateChunk, CHUNK_SIZE, TILE } from '../src/game/world/generator.ts';
import { ProceduralWorld } from '../src/game/world/world.ts';

test('chunks deterministas, semillas distintas y calles conectadas en coordenadas negativas', () => {
  assert.deepEqual(generateChunk(42, -12, 9), generateChunk(42, -12, 9));
  assert.notEqual(generateChunk(42, 0, 0).variation, generateChunk(43, 0, 0).variation);
  const world = new ProceduralWorld(42);
  for (let i = -50; i < 50; i++) {
    assert.equal(world.canOccupy(i * 32 + 16, 256, 14), true);
    assert.equal(world.canOccupy(256, i * 32 + 16, 14), true);
  }
});
test('colisión, deslizamiento y prevención de túnel en obstáculos reales', () => {
  const world = new ProceduralWorld(3), obstacle = world.getChunk(0, 0).obstacles[0];
  const p = { x: obstacle.x - 15, y: obstacle.y + 20 };
  world.moveCircle(p, 500, 0, 14);
  assert.ok(p.x < obstacle.x); assert.equal(world.canOccupy(p.x, p.y, 14), true);
  world.moveCircle(p, 10, 15, 14); assert.ok(p.y > obstacle.y + 20);
  assert.equal(world.segmentClear(obstacle.x - 20, obstacle.y + 16, obstacle.x + obstacle.width + 20, obstacle.y + 16, 4), false);
});
test('exploración larga con caché acotada y regeneración idéntica al volver', () => {
  const world = new ProceduralWorld(887), original = structuredClone(world.getChunk(-2, -3));
  for (let i = -400; i < 400; i++) {
    for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) world.getChunk(i + x, y);
    world.prune([{ x: i * CHUNK_SIZE, y: 0 }]);
    assert.ok(world.chunkCount <= world.maxChunks);
  }
  assert.deepEqual(world.getChunk(-2, -3), original);
});
test('cada celda caminable tiene salida: las parcelas no encierran huecos', () => {
  const world = new ProceduralWorld(73);
  for (let cy = -2; cy <= 2; cy++) for (let cx = -2; cx <= 2; cx++) {
    const chunk = world.getChunk(cx, cy), seen = new Set<number>([0]), queue = [0];
    for (let i = 0; i < queue.length; i++) {
      const at = queue[i], x = at % 16, y = Math.floor(at / 16);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, id = nx + ny * 16;
        if (nx < 0 || ny < 0 || nx >= 16 || ny >= 16 || seen.has(id) || chunk.solids[id]) continue;
        seen.add(id); queue.push(id);
      }
    }
    for (let i = 0; i < 256; i++) if (!chunk.solids[i]) {
      assert.ok(seen.has(i));
      assert.ok(world.canOccupy((cx * 16 + i % 16) * TILE + 16, (cy * 16 + Math.floor(i / 16)) * TILE + 16, 14));
    }
  }
});

test('los enemigos salen de un recinto en U y rodean la pared para alcanzar el objetivo', async () => {
  const { FlowField } = await import('../src/game/navigation/flow-field.ts');
  const world = new ProceduralWorld(42);
  let wall;
  for (let cx = -5; cx <= 5 && !wall; cx++) wall = world.getChunk(cx, 0).obstacles.find(o => o.kind === 'wall' && o.height === 96);
  assert.ok(wall);
  const target = { x: wall.x + 48, y: wall.y - 48 }, enemy = { x: wall.x + 48, y: wall.y + 48 };
  assert.ok(world.canOccupy(target.x, target.y, 14)); assert.ok(world.canOccupy(enemy.x, enemy.y, 13));
  assert.equal(world.segmentClear(enemy.x, enemy.y, target.x, target.y, 13), false);
  const field = new FlowField(world); field.update(target, 1);
  for (let i = 0; i < 1800 && Math.hypot(enemy.x - target.x, enemy.y - target.y) > 20; i++) {
    const direction = field.direction(enemy, target, 13);
    world.moveCircle(enemy, direction.x * 1.5, direction.y * 1.5, 13);
    assert.ok(world.canOccupy(enemy.x, enemy.y, 13));
  }
  assert.ok(Math.hypot(enemy.x - target.x, enemy.y - target.y) < 25, JSON.stringify({ enemy, target }));
  assert.equal(field.rebuilds, 1);
});

test('navegación con dirección actualizada por intervalos no se atasca en esquinas', async () => {
  const { FlowField } = await import('../src/game/navigation/flow-field.ts');
  const world = new ProceduralWorld(42);
  let wall;
  for (let cx = -5; cx <= 5 && !wall; cx++) wall = world.getChunk(cx, 0).obstacles.find(o => o.kind === 'wall' && o.height === 96);
  assert.ok(wall);
  const target = { x: wall.x + 48, y: wall.y - 48 }, enemy = { x: wall.x + 48, y: wall.y + 48 };
  const field = new FlowField(world); field.update(target, 1);
  let direction = { x: 0, y: 0 };
  for (let i = 0; i < 1800 && Math.hypot(enemy.x - target.x, enemy.y - target.y) > 24; i++) {
    if (i % 12 === 0) direction = field.direction(enemy, target, 13);
    world.moveCircle(enemy, direction.x * 1.1, direction.y * 1.1, 13);
  }
  assert.ok(Math.hypot(enemy.x - target.x, enemy.y - target.y) < 25);
});

test('barrios variados y parcelas con geometrías diferentes, sin ocupar avenidas', () => {
  const districts = new Set<string>(), layouts = new Set<string>();
  for (let cy = -5; cy <= 5; cy++) for (let cx = -5; cx <= 5; cx++) {
    const c = generateChunk(42, cx, cy); districts.add(c.district);
    layouts.add(JSON.stringify(c.obstacles.map(o => [o.kind, o.x - cx * CHUNK_SIZE, o.y - cy * CHUNK_SIZE, o.width, o.height])));
    for (let i = 0; i < 16; i++) for (let lane = 6; lane <= 9; lane++) {
      assert.equal(c.solids[i + lane * 16], 0); assert.equal(c.solids[lane + i * 16], 0);
    }
  }
  assert.equal(districts.size, 4); assert.ok(layouts.size > 25);
});
