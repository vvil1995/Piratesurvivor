import { ProceduralWorld } from './world.ts';
import { CHUNK_SIZE, TILE, cellKey, type Chunk, type Obstacle } from './generator.ts';
export const MORGAN_ARENA: ArenaDefinition = { width: 2560, height: 1792, playerSpawn: { x: 1280, y: 1056 }, bossSpawn: { x: 1280, y: 864 },
  gates: [{ x: 320, y: 160 }, { x: 2240, y: 160 }, { x: 160, y: 1568 }, { x: 2400, y: 1568 }],
  covers: [{ x: 224, y: 224, width: 64, height: 64 }, { x: 480, y: 224, width: 64, height: 64 },
    { x: 960, y: 864, width: 64, height: 64 }, { x: 1536, y: 864, width: 64, height: 64 },
    { x: 448, y: 1280, width: 96, height: 64, art: 'naval-cannon' }, { x: 2016, y: 1280, width: 96, height: 64, art: 'naval-cannon' },
    { x: 32, y: 32, width: 128, height: 128, art: 'naval-tower' }, { x: 2400, y: 32, width: 128, height: 128, art: 'naval-tower' },
    { x: 1152, y: 128, width: 256, height: 96, art: 'naval-gate' }],
  decorations: [{ x: 832, y: 160, width: 48, height: 112, art: 'naval-flag' }, { x: 1680, y: 160, width: 48, height: 112, art: 'naval-flag' }] };
export interface ArenaDefinition { width: number; height: number; playerSpawn: { x: number; y: number }; bossSpawn: { x: number; y: number }; gates: readonly { x: number; y: number }[]; covers: readonly { x: number; y: number; width: number; height: number; art?: string }[]; decorations?: readonly { x: number; y: number; width: number; height: number; art: string }[] }
export const BUGGY_ARENA: ArenaDefinition = { width: 768, height: 512, playerSpawn: { x: 384, y: 416 }, bossSpawn: { x: 384, y: 112 }, gates: [{x:96,y:80},{x:672,y:80},{x:96,y:432},{x:672,y:432}], covers: [{ x: 160, y: 224, width: 64, height: 64 }, { x: 544, y: 224, width: 64, height: 64 }] };
export class ArenaWorld extends ProceduralWorld {
  readonly arena: ArenaDefinition;
  constructor(seed: number, arena: ArenaDefinition = MORGAN_ARENA, theme: 'shells' | 'orange' = 'shells') { super(seed, theme); this.arena = arena; }
  private arenaChunks = new Map<string, Chunk>();
  override getChunk(cx: number, cy: number): Chunk {
    const key = cellKey(cx, cy); let chunk = this.arenaChunks.get(key); if (chunk) return chunk;
    chunk = { key, cx, cy, district: 'plaza', solids: new Uint8Array(256), obstacles: [], variation: 37 };
    for (let ty = 0; ty < 16; ty++) for (let tx = 0; tx < 16; tx++) {
      const x = cx * CHUNK_SIZE + tx * TILE, y = cy * CHUNK_SIZE + ty * TILE;
      const outside = x < 32 || y < 32 || x >= this.arena.width - 32 || y >= this.arena.height - 32;
      const cover = this.arena.covers.some(c => x >= c.x && x < c.x + c.width && y >= c.y && y < c.y + c.height);
      if (outside || cover) chunk.solids[tx + ty * 16] = 1;
      if (outside && x >= 0 && y >= 0 && x < this.arena.width && y < this.arena.height) {
        chunk.obstacles.push({ id: `arena/${x}/${y}`, kind: 'wall', x, y, width: TILE, height: TILE, variant: 0 });
      }
    }
    for (const [i, c] of this.arena.covers.entries()) if (Math.floor(c.x / CHUNK_SIZE) === cx && Math.floor(c.y / CHUNK_SIZE) === cy) {
      chunk.obstacles.push({ ...c, id: `cover/${i}`, kind: 'crate', variant: 0 } as Obstacle);
    }
    for (const [i, c] of (this.arena.decorations ?? []).entries()) if (Math.floor(c.x / CHUNK_SIZE) === cx && Math.floor(c.y / CHUNK_SIZE) === cy) chunk.obstacles.push({ ...c, id: `decoration/${i}`, kind: 'crate', variant: 0 });
    // La cámara solo solicita los chunks visibles. Solo se pintan sus chunks, no un mundo nuevo infinito.
    if (this.arenaChunks.size < 64) this.arenaChunks.set(key, chunk);
    return chunk;
  }
}
