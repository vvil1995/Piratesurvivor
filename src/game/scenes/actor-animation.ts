// Estado visual por entidad, independiente del jugador global y de los ataques.
export type Direction = 'e' | 'se' | 's' | 'sw' | 'w' | 'nw' | 'n' | 'ne';
const directions: Direction[] = ['e', 'se', 's', 'sw', 'w', 'nw', 'n', 'ne'];
export function movementDirection(dx: number, dy: number): Direction {
  return directions[(Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8];
}
export class ActorAnimation {
  private x = 0; private y = 0; private id?: string | number;
  private distance = 0; private stillTime = 0;
  private pendingDirection?: Direction; private turnTime = 0; private turnDistance = 0;
  direction: Direction = 's';
  frame = 0;
  footfall = false;
  get gaitPhase(): number { return this.distance / 48 * Math.PI; }
  get weight(): number { return this.frame ? Math.pow(Math.cos(this.distance / 48 * Math.PI), 8) * 0.018 : 0; }
  get legSwing(): number { return this.frame ? Math.sin(this.distance / 48 * Math.PI) * 9 : 0; }
  get lean(): number { return this.frame ? Math.sin(this.distance / 48 * Math.PI) * 0.9 : 0; }
  update(id: string | number, x: number, y: number, animate: boolean, dt = 1 / 60, stableCardinal = false): void {
    if (id !== this.id) { this.id = id; this.x = x; this.y = y; this.distance = 0; this.direction = 's'; this.frame = 0; this.stillTime = 1; this.pendingDirection = undefined; this.turnTime = this.turnDistance = 0; }
    this.footfall = false;
    const dx = x - this.x, dy = y - this.y, step = Math.hypot(dx, dy);
    this.x = x; this.y = y;
    if (animate && step > 0.05 && step < 40) {
      if (stableCardinal) {
        const horizontal = this.direction === 'e' || this.direction === 'w';
        // Four painted facings: retain current axis around diagonal boundaries.
        const useHorizontal = horizontal ? Math.abs(dy) <= Math.abs(dx)*1.35 : Math.abs(dx) > Math.abs(dy)*1.35;
        const candidate: Direction = useHorizontal ? dx >= 0 ? 'e' : 'w' : dy >= 0 ? 's' : 'n';
        if (candidate === this.direction) { this.pendingDirection = undefined; this.turnTime = this.turnDistance = 0; }
        else {
          if (candidate !== this.pendingDirection) { this.pendingDirection = candidate; this.turnTime = this.turnDistance = 0; }
          this.turnTime += Math.min(Math.max(dt, 0), .05); this.turnDistance += step;
          if (this.stillTime >= .08 || this.turnTime >= .1 && this.turnDistance >= 3) {
            this.direction = candidate; this.pendingDirection = undefined; this.turnTime = this.turnDistance = 0;
          }
        }
      } else this.direction = movementDirection(dx, dy);
      this.stillTime = 0;
      const oldStep = Math.floor(this.distance / 48); this.distance += step;
      this.footfall = Math.floor(this.distance / 48) !== oldStep;
      this.frame = 1 + Math.floor(this.distance / 24) % 4;
    } else {
      this.stillTime += Math.max(0, dt);
      // Un render sin paso de simulación no significa que el actor se haya parado.
      if (!animate || step >= 40 || this.stillTime >= 0.08) this.frame = 0;
    }
  }
}
