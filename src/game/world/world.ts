import type { Vector } from '../core/types.ts';
import { cellKey, CHUNK_SIZE, generateChunk, generateOrangeChunk, generateSyrupChunk, TILE, type Chunk } from './generator.ts';

export interface CollisionWorld {
  canOccupy(x: number, y: number, radius: number, layer?: 'movement' | 'attack'): boolean;
  moveCircle(actor: Vector, dx: number, dy: number, radius: number): void;
  segmentClear(ax: number, ay: number, bx: number, by: number, radius: number, layer?: 'movement' | 'attack'): boolean;
}
export class ProceduralWorld implements CollisionWorld {
  private attackMasks = new WeakMap<Chunk, Uint8Array>();
  private chunks = new Map<string, Chunk>();
  readonly maxChunks = 128;
  readonly seed: number;
  readonly theme: 'shells' | 'orange' | 'syrup';
  constructor(seed: number, theme: 'shells' | 'orange' | 'syrup' = 'shells') { this.seed = seed; this.theme = theme; }
  get chunkCount(): number { return this.chunks.size; }
  getChunk(cx: number, cy: number): Chunk {
    const key = cellKey(cx, cy);
    let chunk = this.chunks.get(key);
    if (!chunk) {
      chunk = this.theme === 'orange' ? generateOrangeChunk(this.seed, cx, cy) : this.theme === 'syrup' ? generateSyrupChunk(this.seed,cx,cy) : generateChunk(this.seed, cx, cy);
      if (this.chunks.size >= this.maxChunks) this.chunks.delete(this.chunks.keys().next().value!);
      this.chunks.set(key, chunk);
    }
    return chunk;
  }
  prune(centers: readonly Vector[], radius = 4): void {
    for (const [key, chunk] of this.chunks) if (!centers.some(p => Math.abs(chunk.cx - Math.floor(p.x / CHUNK_SIZE)) <= radius && Math.abs(chunk.cy - Math.floor(p.y / CHUNK_SIZE)) <= radius)) this.chunks.delete(key);
  }
  solidTile(tx: number, ty: number, layer: 'movement' | 'attack' = 'movement'): boolean {
    const cx = Math.floor(tx / 16), cy = Math.floor(ty / 16);
    const chunk = this.getChunk(cx, cy);
    let mask = chunk.solids;
    if (layer === 'attack' && chunk.obstacles.some(o => o.kind === 'water')) {
      let attackMask = this.attackMasks.get(chunk);
      if (!attackMask) {
        attackMask = chunk.solids.slice();
        const fill = (o: Chunk['obstacles'][number], value: number) => {
          const ox = Math.floor((o.x - cx * CHUNK_SIZE) / TILE), oy = Math.floor((o.y - cy * CHUNK_SIZE) / TILE);
          for (let y = oy; y < oy + o.height / TILE; y++) for (let x = ox; x < ox + o.width / TILE; x++) attackMask![x + y * 16] = value;
        };
        for (const o of chunk.obstacles) if (o.kind === 'water') fill(o, 0);
        for (const o of chunk.obstacles) if (o.kind !== 'water' && o.kind !== 'dock') fill(o, 1);
        this.attackMasks.set(chunk, attackMask);
      }
      mask = attackMask;
    }
    return mask[(tx - cx * 16) + (ty - cy * 16) * 16] === 1;
  }
  canOccupy(x: number, y: number, radius: number, layer: 'movement' | 'attack' = 'movement'): boolean {
    const r = Math.max(0.01, radius);
    for (let ty = Math.floor((y - r) / TILE); ty <= Math.floor((y + r) / TILE); ty++) {
      for (let tx = Math.floor((x - r) / TILE); tx <= Math.floor((x + r) / TILE); tx++) {
        if (!this.solidTile(tx, ty, layer)) continue;
        const dx = x - Math.max(tx * TILE, Math.min((tx + 1) * TILE, x));
        const dy = y - Math.max(ty * TILE, Math.min((ty + 1) * TILE, y));
        if (dx * dx + dy * dy < r * r - 0.000001) return false;
      }
    }
    return true;
  }
  moveCircle(actor: Vector, dx: number, dy: number, radius: number): void {
    // Pasos cortos: ni velocidad alta ni retroceso atraviesan una pared fina.
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 6));
    const sx = dx / steps, sy = dy / steps;
    for (let i = 0; i < steps; i++) {
      if (this.canOccupy(actor.x + sx, actor.y, radius)) actor.x += sx;
      if (this.canOccupy(actor.x, actor.y + sy, radius)) actor.y += sy;
    }
  }
  segmentClear(ax: number, ay: number, bx: number, by: number, radius: number, layer: 'movement' | 'attack' = 'movement'): boolean {
    const distance = Math.hypot(bx - ax, by - ay), steps = Math.max(1, Math.ceil(distance / 12));
    for (let i = 0; i <= steps; i++) if (!this.canOccupy(ax + (bx - ax) * i / steps, ay + (by - ay) * i / steps, radius, layer)) return false;
    return true;
  }
}
