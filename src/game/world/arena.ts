import { ProceduralWorld } from './world.ts';
import { CHUNK_SIZE, TILE, cellKey, type Chunk, type Obstacle } from './generator.ts';
export const MORGAN_ARENA = { width: 768, height: 512, playerSpawn: { x: 384, y: 416 }, bossSpawn: { x: 384, y: 112 },
  gates: [{ x: 96, y: 80 }, { x: 672, y: 80 }, { x: 96, y: 432 }, { x: 672, y: 432 }],
  covers: [{ x: 224, y: 224, width: 64, height: 64 }, { x: 480, y: 224, width: 64, height: 64 }] } as const;
export class ArenaWorld extends ProceduralWorld {
  private arenaChunks = new Map<string, Chunk>();
  override getChunk(cx: number, cy: number): Chunk {
    const key = cellKey(cx, cy); let chunk = this.arenaChunks.get(key); if (chunk) return chunk;
    chunk = { key, cx, cy, district: 'plaza', solids: new Uint8Array(256), obstacles: [], variation: 37 };
    for (let ty = 0; ty < 16; ty++) for (let tx = 0; tx < 16; tx++) {
      const x = cx * CHUNK_SIZE + tx * TILE, y = cy * CHUNK_SIZE + ty * TILE;
      const outside = x < 32 || y < 32 || x >= MORGAN_ARENA.width - 32 || y >= MORGAN_ARENA.height - 32;
      const cover = MORGAN_ARENA.covers.some(c => x >= c.x && x < c.x + c.width && y >= c.y && y < c.y + c.height);
      if (outside || cover) chunk.solids[tx + ty * 16] = 1;
      if (outside && x >= 0 && y >= 0 && x < MORGAN_ARENA.width && y < MORGAN_ARENA.height) {
        chunk.obstacles.push({ id: `arena/${x}/${y}`, kind: 'wall', x, y, width: TILE, height: TILE, variant: 0 });
      }
    }
    for (const [i, c] of MORGAN_ARENA.covers.entries()) if (Math.floor(c.x / CHUNK_SIZE) === cx && Math.floor(c.y / CHUNK_SIZE) === cy) {
      chunk.obstacles.push({ ...c, id: `cover/${i}`, kind: 'crate', variant: 0 } as Obstacle);
    }
    // La cámara del combate es fija. Solo se pintan sus chunks, no un mundo nuevo infinito.
    if (this.arenaChunks.size < 64) this.arenaChunks.set(key, chunk);
    return chunk;
  }
}
