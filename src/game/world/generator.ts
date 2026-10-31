export const TILE = 32;
export const CHUNK_TILES = 16;
export const CHUNK_SIZE = TILE * CHUNK_TILES;
export type ObstacleKind = 'house' | 'tree' | 'rock' | 'wall' | 'crate' | 'tent' | 'stall' | 'ruin' | 'pennant';
export interface Obstacle { id: string; kind: ObstacleKind; x: number; y: number; width: number; height: number; variant: number }
export interface Chunk {
  key: string; cx: number; cy: number; district: 'residential' | 'garden' | 'barracks' | 'plaza' | 'market' | 'circus' | 'orchard' | 'occupied';
  solids: Uint8Array; obstacles: Obstacle[]; variation: number;
}
export const cellKey = (x: number, y: number): string => `${x},${y}`;
export function hash(seed: number, x: number, y: number): number {
  let h = Math.imul(x | 0, 0x45d9f3b) ^ Math.imul(y | 0, 0x27d4eb2d) ^ seed;
  h = Math.imul(h ^ h >>> 16, 0x85ebca6b); h = Math.imul(h ^ h >>> 13, 0xc2b2ae35);
  return (h ^ h >>> 16) >>> 0;
}
export const roadTile = (x: number, y: number): boolean => (x >= 6 && x <= 9) || (y >= 6 && y <= 9);
// Orange Town conserva las conexiones entre chunks, pero tiene parcelas y usos propios.
// La calle central y el perímetro garantizan rutas incluso con coordenadas negativas.
export function generateOrangeChunk(seed: number, cx: number, cy: number): Chunk {
  const variation = hash(seed ^ 0x4f5247, cx, cy), key = cellKey(cx, cy);
  const district = (['market', 'circus', 'orchard', 'occupied'] as const)[variation % 4];
  const chunk: Chunk = { key, cx, cy, district, variation, solids: new Uint8Array(256), obstacles: [] };
  const add = (kind: ObstacleKind, x: number, y: number, w: number, h: number, variant = 0) => {
    chunk.obstacles.push({ id: `${key}/${chunk.obstacles.length}`, kind, x: (cx * 16 + x) * TILE, y: (cy * 16 + y) * TILE, width: w * TILE, height: h * TILE, variant });
    for (let ty = y; ty < y + h; ty++) for (let tx = x; tx < x + w; tx++) chunk.solids[tx + ty * 16] = 1;
  };
  for (const [i, [x, y]] of [[1, 1], [10, 1], [1, 10], [10, 10]].entries()) {
    const v = hash(variation, i, 31);
    if (district === 'circus') {
      if (i === variation % 4) add('tent', x, y, 4, 4);
      else { add('stall', x + 1, y + 1, 2, 1); add(v % 2 ? 'crate' : 'pennant', x + 3, y + 3, 1, 1); }
    } else if (district === 'market') {
      if (i % 2) add('stall', x, y + 1, 3, 2);
      else add('house', x + 1, y, 3, 3, v % 2);
      add('crate', x + 3, y + 3, 1, 1);
    } else if (district === 'orchard') {
      add('tree', x + 1, y + 1, 1, 1); add('tree', x + 3, y + 3, 1, 1);
      if (i === 0) add('stall', x + 2, y, 2, 1);
    } else {
      add(i % 2 ? 'ruin' : 'house', x, y, 3, 3, v % 2);
      if (v % 2) add('crate', x + 3, y + 3, 1, 1);
    }
  }
  return chunk;
}
export function generateChunk(seed: number, cx: number, cy: number): Chunk {
  const variation = hash(seed, cx, cy), key = cellKey(cx, cy);
  const district = (['residential', 'garden', 'barracks', 'plaza'] as const)[variation % 4];
  const chunk: Chunk = { key, cx, cy, district, variation, solids: new Uint8Array(256), obstacles: [] };
  const add = (kind: ObstacleKind, tx: number, ty: number, w: number, h: number, variant: number) => {
    const obstacle: Obstacle = { id: `${key}/${chunk.obstacles.length}`, kind, x: cx * CHUNK_SIZE + tx * TILE, y: cy * CHUNK_SIZE + ty * TILE, width: w * TILE, height: h * TILE, variant };
    chunk.obstacles.push(obstacle);
    for (let y = ty; y < ty + h; y++) for (let x = tx; x < tx + w; x++) chunk.solids[x + y * 16] = 1;
  };
  // Cuatro parcelas. Las avenidas centrales y el perímetro siempre quedan libres.
  // Todas las parcelas tienen acceso a esas avenidas, también entre chunks negativos.
  for (const [index, [qx, qy]] of [[1, 1], [10, 1], [1, 10], [10, 10]].entries()) {
    const v = hash(variation, index, 71), style = v % 4;
    if (district === 'residential' || (district === 'barracks' && index < 2)) {
      // Casas alternas, patios abiertos y pequeños almacenes; sin cerrar calles.
      if (style === 0) {
        add('house', qx + 1, qy, 2, 2, v % 3);
        add('rock', qx + 3, qy + 3, 1, 1, 0);
      } else {
        add('house', qx + (style === 1 ? 0 : 1), qy + (style === 3 ? 0 : 1), 3, 3, v % 3);
      }
      if (style > 1) add('tree', qx, qy + 3, 1, 1, v % 2);
    } else if (district === 'garden') {
      add('tree', qx + (style % 2 ? 3 : 1), qy + 1, 1, 1, v % 2);
      if (style !== 0) add('tree', qx + (style % 2 ? 1 : 3), qy + 3, 1, 1, (v + 1) % 2);
      if (style > 1) add('rock', qx + 1, qy + 3, 1, 1, 0);
    } else if (district === 'plaza') {
      // Plaza amplia con parterres en sus esquinas; no añade callejones cerrados.
      if (style < 2) add('tree', qx + 2, qy + 2, 1, 1, v % 2);
      else if (style === 2) add('rock', qx + 2, qy + 2, 1, 1, 0);
    } else {
      // Recinto en U: la abertura mira a la calle. Sirve también para probar rutas.
      add('wall', qx + 1, qy + 1, 1, 3, 0);
      add('wall', qx + 2, qy + 1, 2, 1, 0);
      add('wall', qx + 3, qy + 2, 1, 2, 0);
    }
  }
  return chunk;
}
