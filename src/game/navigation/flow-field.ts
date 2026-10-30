import type { Vector } from '../core/types.ts';
import type { CollisionWorld } from '../world/world.ts';
import { TILE } from '../world/generator.ts';

const SIDE = 81, HALF = 40;
const STEPS = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;
// Un campo compartido por objetivo, no un A* por enemigo y frame.
export class FlowField {
  private distances = new Int16Array(SIDE * SIDE);
  private queue = new Int32Array(SIDE * SIDE);
  private left = 0;
  private top = 0;
  private targetX = Infinity;
  private targetY = Infinity;
  private elapsed = 1;
  readonly world: CollisionWorld;
  rebuilds = 0;
  private clearance: number;
  constructor(world: CollisionWorld, clearance = 14) { this.world = world; this.clearance = clearance; this.distances.fill(-1); }
  update(target: Vector, dt: number): void {
    this.elapsed += dt;
    const tx = Math.floor(target.x / TILE), ty = Math.floor(target.y / TILE);
    if (tx === this.targetX && ty === this.targetY) return;
    if (this.elapsed < 0.3 && Math.abs(tx - this.targetX) + Math.abs(ty - this.targetY) < 4) return;
    this.elapsed = 0; this.targetX = tx; this.targetY = ty;
    this.left = tx - HALF; this.top = ty - HALF; this.distances.fill(-1); this.rebuilds++;
    const root = HALF + HALF * SIDE;
    this.distances[root] = 0; this.queue[0] = root;
    let read = 0, write = 1;
    while (read < write) {
      const at = this.queue[read++], x = at % SIDE, y = Math.floor(at / SIDE);
      for (const [dx, dy] of STEPS) {
        const nx = x + dx, ny = y + dy, next = nx + ny * SIDE;
        if (nx < 0 || nx >= SIDE || ny < 0 || ny >= SIDE || this.distances[next] !== -1) continue;
        // -2 distingue paredes ya evaluadas de celdas pendientes.
        if (!this.world.canOccupy((this.left + nx) * TILE + 16, (this.top + ny) * TILE + 16, this.clearance)) { this.distances[next] = -2; continue; }
        this.distances[next] = this.distances[at] + 1; this.queue[write++] = next;
      }
    }
  }
  private index(point: Vector): number {
    const x = Math.floor(point.x / TILE) - this.left, y = Math.floor(point.y / TILE) - this.top;
    return x < 0 || y < 0 || x >= SIDE || y >= SIDE ? -1 : x + y * SIDE;
  }
  reachable(point: Vector): boolean { const at = this.index(point); return at >= 0 && this.distances[at] >= 0; }
  direction(from: Vector, target: Vector, radius: number): Vector {
    let dx = target.x - from.x, dy = target.y - from.y;
    if (!this.world.segmentClear(from.x, from.y, target.x, target.y, radius)) {
      const at = this.index(from);
      if (at < 0 || this.distances[at] < 0) return { x: 0, y: 0 };
      let best = at, distance = this.distances[at];
      const x = at % SIDE, y = Math.floor(at / SIDE);
      for (const [sx, sy] of STEPS) {
        const nx = x + sx, ny = y + sy, next = nx + ny * SIDE;
        if (nx < 0 || nx >= SIDE || ny < 0 || ny >= SIDE) continue;
        if (this.distances[next] >= 0 && this.distances[next] < distance) { best = next; distance = this.distances[next]; }
      }
      let bx = (this.left + best % SIDE) * TILE + 16, by = (this.top + Math.floor(best / SIDE)) * TILE + 16;
      // Centrar primero si una esquina impide alcanzar el siguiente nodo.
      if (!this.world.segmentClear(from.x, from.y, bx, by, radius)) {
        bx = (this.left + x) * TILE + 16; by = (this.top + y) * TILE + 16;
      }
      dx = bx - from.x; dy = by - from.y;
    }
    const d = Math.hypot(dx, dy);
    return d < 0.5 ? { x: 0, y: 0 } : { x: dx / d, y: dy / d };
  }
}
