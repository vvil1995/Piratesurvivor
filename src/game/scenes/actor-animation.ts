// Estado visual por entidad, independiente del jugador global y de los ataques.
export type Direction = 'e' | 'se' | 's' | 'sw' | 'w' | 'nw' | 'n' | 'ne';
const directions: Direction[] = ['e', 'se', 's', 'sw', 'w', 'nw', 'n', 'ne'];
export function movementDirection(dx: number, dy: number): Direction {
  return directions[(Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8];
}
export class ActorAnimation {
  private x = 0; private y = 0; private id?: string | number;
  private distance = 0;
  direction: Direction = 's';
  frame = 0;
  update(id: string | number, x: number, y: number, animate: boolean): void {
    if (id !== this.id) { this.id = id; this.x = x; this.y = y; this.distance = 0; this.direction = 's'; }
    const dx = x - this.x, dy = y - this.y, step = Math.hypot(dx, dy);
    this.x = x; this.y = y;
    if (animate && step > 0.05 && step < 40) {
      this.direction = movementDirection(dx, dy); this.distance += step;
      this.frame = 1 + Math.floor(this.distance / 7) % 4;
    } else this.frame = 0;
  }
}
