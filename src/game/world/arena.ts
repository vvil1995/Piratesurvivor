import { ProceduralWorld } from './world.ts';
import { CHUNK_SIZE, TILE, cellKey, type Chunk, type Obstacle } from './generator.ts';
export const MORGAN_ARENA: ArenaDefinition = { width: 3072, height: 2176, playerSpawn: { x: 1536, y: 1216 }, bossSpawn: { x: 1536, y: 1024 },
  gates: [{ x: 320, y: 160 }, { x: 2752, y: 160 }, { x: 160, y: 1856 }, { x: 2912, y: 1856 }, { x: 160, y: 960 }, { x: 2912, y: 960 }, { x: 1120, y: 1984 }, { x: 1952, y: 1984 }],
  covers: [{ x: 224, y: 224, width: 64, height: 64 }, { x: 480, y: 224, width: 64, height: 64 },
    { x: 960, y: 864, width: 64, height: 64 }, { x: 1536, y: 864, width: 64, height: 64 },
    { x: 448, y: 1280, width: 96, height: 64, art: 'naval-cannon' }, { x: 2016, y: 1280, width: 96, height: 64, art: 'naval-cannon' },
    { x: 32, y: 32, width: 128, height: 128, art: 'naval-tower' }, { x: 2400, y: 32, width: 128, height: 128, art: 'naval-tower' },
    { x: 1152, y: 128, width: 256, height: 96, art: 'naval-gate' }],
  decorations: [{ x: 832, y: 160, width: 48, height: 112, art: 'naval-flag' }, { x: 1680, y: 160, width: 48, height: 112, art: 'naval-flag' }] };
export interface ArenaDefinition { edgeInset?:number; width: number; height: number; playerSpawn: { x: number; y: number }; bossSpawn: { x: number; y: number }; gates: readonly { x: number; y: number }[]; covers: readonly { x: number; y: number; width: number; height: number; art?: string }[]; decorations?: readonly { x: number; y: number; width: number; height: number; art: string }[] }
export const BUGGY_ARENA: ArenaDefinition = {
  width: 2816, height: 2048, playerSpawn: { x: 1408, y: 1152 }, bossSpawn: { x: 1648, y: 1152 },
  gates: [{x:256,y:256},{x:2560,y:256},{x:256,y:1792},{x:2560,y:1792}],
  covers: [
    {x:320,y:224,width:192,height:128,art:'orange-house-0'}, {x:2304,y:224,width:192,height:128,art:'orange-house-0'},
    {x:1184,y:704,width:448,height:224,art:'orange-tent'},
    {x:1056,y:1056,width:160,height:128,art:'orange-stall'}, {x:1888,y:1248,width:128,height:96,art:'orange-ruin'},
    {x:192,y:768,width:160,height:128,art:'orange-stall'}, {x:2464,y:768,width:160,height:128,art:'orange-stall'},
    {x:416,y:1568,width:192,height:160,art:'orange-ruin'}, {x:2208,y:1568,width:192,height:160,art:'orange-ruin'},
    {x:992,y:960,width:64,height:64,art:'coastal-crates'}, {x:1760,y:960,width:64,height:64,art:'coastal-crates'},
    {x:832,y:1344,width:64,height:64,art:'coastal-crates'}, {x:1920,y:1344,width:64,height:64,art:'coastal-crates'},
    {x:1024,y:1760,width:128,height:64,art:'orange-ruin'}, {x:1664,y:1760,width:128,height:64,art:'orange-ruin'},
  ],
  decorations: [{x:1280,y:960,width:64,height:96,art:'buggy-flag'}, {x:1728,y:1344,width:64,height:96,art:'buggy-flag'}, {x:864,y:192,width:64,height:96,art:'buggy-flag'},{x:1888,y:192,width:64,height:96,art:'buggy-flag'},
    {x:640,y:640,width:64,height:96,art:'buggy-flag'},{x:2112,y:640,width:64,height:96,art:'buggy-flag'},
    {x:896,y:1120,width:64,height:96,art:'buggy-flag'}, {x:1856,y:1120,width:64,height:96,art:'buggy-flag'}, {x:640,y:1536,width:64,height:96,art:'buggy-flag'},{x:2112,y:1536,width:64,height:96,art:'buggy-flag'}],
};
export const KURO_ARENA:ArenaDefinition={width:2816,height:2048,playerSpawn:{x:1408,y:1200},bossSpawn:{x:1408,y:1090},gates:[],
 covers:[{x:1184,y:640,width:448,height:320,art:'syrup-mansion'},{x:416,y:512,width:64,height:64,art:'coastal-tree'},{x:2304,y:512,width:64,height:64,art:'coastal-tree'},{x:576,y:1376,width:64,height:64,art:'coastal-crates'},{x:2176,y:1376,width:64,height:64,art:'syrup-cart'},{x:864,y:1632,width:128,height:32,art:'coastal-fence'},{x:1824,y:1632,width:128,height:32,art:'coastal-fence'}],decorations:[{x:1056,y:864,width:48,height:96,art:'blackcat-banner'},{x:1712,y:864,width:48,height:96,art:'blackcat-banner'},{x:1120,y:912,width:64,height:96,art:'kaya-cat-statue'},{x:1696,y:912,width:64,height:96,art:'kaya-cat-statue'}]};
export const KRIEG_ARENA:ArenaDefinition={edgeInset:128,width:3072,height:2176,playerSpawn:{x:1536,y:1216},bossSpawn:{x:1728,y:1216},gates:[],
 covers:[{x:1216,y:1280,width:64,height:64,art:'baratie-mast'},{x:1792,y:1280,width:96,height:64,art:'krieg-cannon'},{x:384,y:512,width:96,height:64,art:'krieg-cannon'},{x:2528,y:512,width:96,height:64,art:'krieg-cannon'},{x:512,y:1600,width:64,height:64,art:'coastal-crates'},{x:2464,y:1600,width:64,height:64,art:'coastal-crates'},{x:800,y:352,width:64,height:64,art:'baratie-mast'},{x:2208,y:352,width:64,height:64,art:'baratie-mast'}],
 decorations:[{x:1184,y:32,width:704,height:64,art:'baratie-restaurant'},{x:192,y:256,width:64,height:96,art:'krieg-flag'},{x:2816,y:256,width:64,height:96,art:'krieg-flag'}]};
export class ArenaWorld extends ProceduralWorld {
  readonly arena: ArenaDefinition;
  constructor(seed: number, arena: ArenaDefinition = MORGAN_ARENA, theme: 'shells' | 'orange' | 'syrup' | 'baratie' = 'shells') { super(seed, theme); this.arena = arena; }
  private arenaChunks = new Map<string, Chunk>();
  override getChunk(cx: number, cy: number): Chunk {
    const key = cellKey(cx, cy); let chunk = this.arenaChunks.get(key); if (chunk) return chunk;
    chunk = { key, cx, cy, district: 'plaza', solids: new Uint8Array(256), obstacles: [], variation: 37 };
    for (let ty = 0; ty < 16; ty++) for (let tx = 0; tx < 16; tx++) {
      const x = cx * CHUNK_SIZE + tx * TILE, y = cy * CHUNK_SIZE + ty * TILE;
      const edge=this.arena.edgeInset??32;const outside = x < edge || y < edge || x >= this.arena.width - edge || y >= this.arena.height - edge;
      const cover = this.arena.covers.some(c => x >= c.x && x < c.x + c.width && y >= c.y && y < c.y + c.height);
      if (outside || cover) chunk.solids[tx + ty * 16] = 1;
      if(this.theme==='baratie'&&outside){chunk.obstacles.push({id:`sea/${x}/${y}`,kind:'water',x,y,width:TILE,height:TILE,variant:0});}
      if (this.theme!=='baratie' && outside && x >= 0 && y >= 0 && x < this.arena.width && y < this.arena.height) {
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
