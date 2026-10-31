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
    const chunk = world.getChunk(cx, cy), seen = new Set<number>([chunk.solids.findIndex(v => !v)]), queue = [chunk.solids.findIndex(v => !v)];
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
    for (let i = 0; i < 16; i++) for (let lane = c.district === 'harbor' ? 7 : 6; lane <= (c.district === 'harbor' ? 8 : 9); lane++) {
      assert.equal(c.solids[i + lane * 16], 0); assert.equal(c.solids[lane + i * 16], 0);
    }
  }
  assert.equal(districts.size, 5); assert.ok(layouts.size > 25);
});

test('Orange Town tiene barrios y obstáculos propios, rutas conectadas y regeneración estable', () => {
  const orange = new ProceduralWorld(73, 'orange'), shells = new ProceduralWorld(73);
  const districts = new Set<string>(), kinds = new Set<string>();
  for (let cy = -4; cy <= 4; cy++) for (let cx = -4; cx <= 4; cx++) {
    const chunk = orange.getChunk(cx, cy);
    assert.notDeepEqual(chunk.obstacles, shells.getChunk(cx, cy).obstacles);
    districts.add(chunk.district); chunk.obstacles.forEach(o => kinds.add(o.kind));
    const queue = [0], seen = new Set(queue);
    for (let i = 0; i < queue.length; i++) {
      const at = queue[i], x = at % 16, y = Math.floor(at / 16);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, id = nx + ny * 16;
        if (nx < 0 || ny < 0 || nx >= 16 || ny >= 16 || chunk.solids[id] || seen.has(id)) continue;
        queue.push(id); seen.add(id);
      }
    }
    for (let i = 0; i < 256; i++) if (!chunk.solids[i]) assert.ok(seen.has(i), `${cx},${cy}/${i}`);
    for (const obstacle of chunk.obstacles) assert.equal(orange.canOccupy(obstacle.x + 16, obstacle.y + 16, 13), false);
  }
  assert.deepEqual([...districts].sort(), ['circus', 'market', 'occupied', 'orchard']);
  for (const kind of ['tent', 'stall', 'ruin', 'tree', 'house']) assert.ok(kinds.has(kind));
  const original = structuredClone(orange.getChunk(-2, -3));
  for (let i = -200; i < 200; i++) { orange.getChunk(i, 10); assert.ok(orange.chunkCount <= orange.maxChunks); }
  assert.deepEqual(orange.getChunk(-2, -3), original);
  for (let i = -50; i < 50; i++) {
    assert.ok(orange.canOccupy(i * 32 + 16, 256, 14)); assert.ok(orange.canOccupy(256, i * 32 + 16, 14));
  }
});

test('puerto: agua sólida, pasarelas conectadas y muelle accesible desde tierra', () => {
  const world = new ProceduralWorld(42);
  for (const cy of [-5, -4, 3, 4]) for (const cx of [-1, 0, 1]) {
    const chunk = world.getChunk(cx, cy); assert.equal(chunk.district, 'harbor');
    assert.equal(chunk.obstacles.filter(o => o.kind === 'water').length, 4);
    for (const water of chunk.obstacles) assert.equal(world.canOccupy(water.x + 32, water.y + 32, 14), false);
    for (let i = 0; i < 16; i++) {
      assert.ok(world.canOccupy(cx * 512 + i * 32 + 16, cy * 512 + 256, 14));
      assert.ok(world.canOccupy(cx * 512 + 256, cy * 512 + i * 32 + 16, 14));
    }
  }
  let dock;
  for (let cx = -30; cx < 30 && !dock; cx++) dock = world.getChunk(cx, 0).obstacles.find(o => o.kind === 'dock');
  assert.ok(dock);
  assert.ok(world.canOccupy(dock.x + 32, dock.y + dock.height + 16, 14));
  assert.ok(world.segmentClear(dock.x + 32, dock.y + dock.height + 16, dock.x + 32, dock.y + 16, 14));
});

test('el mar impide caminar pero permite disparar; edificios y barcos siguen dando cobertura', () => {
  const world = new ProceduralWorld(42), y = 3 * 512;
  assert.equal(world.segmentClear(256, y + 384, 384, y + 256, 3), false);
  assert.equal(world.segmentClear(256, y + 384, 384, y + 256, 3, 'attack'), true);
  assert.equal(world.segmentClear(128, y + 96, 200, y + 190, 3, 'attack'), false);
  const house = world.getChunk(0, 0).obstacles.find(o => o.kind === 'house')!;
  assert.equal(world.segmentClear(house.x - 20, house.y + 16, house.x + house.width + 20, house.y + 16, 3, 'attack'), false);
});

test('cámara naval sigue suavemente y se limita sin cambiar escala', async () => {
  const { arenaCamera } = await import('../src/game/scenes/arena-camera.ts');
  const arena = {width:2560,height:1792};
  const p = arenaCamera({x:1280,y:900},{x:1600,y:1100},1200,700,arena,.016);
  assert.ok(p.x>1280 && p.x<1600);assert.ok(p.y>900 && p.y<1100);
  assert.deepEqual(arenaCamera({x:-1000,y:-1000},{x:0,y:0},1200,700,arena,1),{x:600,y:350});
  assert.deepEqual(arenaCamera({x:9000,y:9000},{x:2560,y:1792},1200,700,arena,1),{x:1960,y:1442});
});

test('el patio naval completo conserva rutas entre todas las celdas transitables', async () => {
  const {ArenaWorld,MORGAN_ARENA}=await import('../src/game/world/arena.ts');const world=new ArenaWorld(42), w=MORGAN_ARENA.width/32,h=MORGAN_ARENA.height/32;
  const start=8+8*w,queue=[start],seen=new Set(queue);
  for(let i=0;i<queue.length;i++){const x=queue[i]%w,y=Math.floor(queue[i]/w);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,id=nx+ny*w;if(nx<0||ny<0||nx>=w||ny>=h||seen.has(id)||world.solidTile(nx,ny))continue;seen.add(id);queue.push(id);}}
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(!world.solidTile(x,y))assert.ok(seen.has(x+y*w));
});
