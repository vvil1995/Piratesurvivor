import type { Enemy } from '../core/types.ts';
// Reutiliza los contenedores entre ticks; consulta solo las celdas próximas.
export class SpatialGrid {
  private cells = new Map<string, Enemy[]>();
  private free: Enemy[][] = [];
  private key(x: number, y: number): string { return `${x},${y}`; }
  get cellCount(): number { return this.cells.size; }
  rebuild(enemies: Enemy[]): void {
    for (const bucket of this.cells.values()) { bucket.length = 0; this.free.push(bucket); }
    this.cells.clear();
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      const key = this.key(Math.floor(enemy.x / 96), Math.floor(enemy.y / 96));
      let bucket = this.cells.get(key);
      if (!bucket) { bucket = this.free.pop() || []; this.cells.set(key, bucket); }
      bucket.push(enemy);
    }
  }
  visit(x: number, y: number, radius: number, fn: (enemy: Enemy) => void): void {
    for (let cy = Math.floor((y - radius) / 96); cy <= Math.floor((y + radius) / 96); cy++) {
      for (let cx = Math.floor((x - radius) / 96); cx <= Math.floor((x + radius) / 96); cx++) {
        const bucket = this.cells.get(this.key(cx, cy));
        if (bucket) for (const enemy of bucket) if (enemy.active) fn(enemy);
      }
    }
  }
}
