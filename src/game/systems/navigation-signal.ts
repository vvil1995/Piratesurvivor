import { MORGAN_ROUTE } from '../../content/navigation.ts';
import type { Vector } from '../core/types.ts';
import type { CollisionWorld } from '../world/world.ts';

// Una sola oportunidad, sin pickups ni temporizadores del navegador.
export class MorganRoute {
  signal?: Vector;
  nextAt: number = MORGAN_ROUTE.availableAt;
  private first = true;
  private expiresAt = 0;
  retry(now: number, random: () => number): void {
    this.signal = undefined; this.first = false;
    this.nextAt = Math.max(MORGAN_ROUTE.availableAt, now + MORGAN_ROUTE.retryMin + random() * MORGAN_ROUTE.retryExtra);
  }
  consume(): void { this.signal = undefined; this.nextAt = Infinity; }
  tick(now: number, player: Vector, world: CollisionWorld, random: () => number, reachable: (p: Vector) => boolean): boolean {
    if (this.signal) {
      const distance = Math.hypot(player.x - this.signal.x, player.y - this.signal.y);
      if (distance <= MORGAN_ROUTE.radius && world.segmentClear(player.x, player.y, this.signal.x, this.signal.y, 14)) { this.consume(); return true; }
      if (now >= this.expiresAt || distance > 1200) this.retry(now, random);
      return false;
    }
    if (now < this.nextAt) return false;
    if (this.first) { this.first = false; this.nextAt = now + random() * MORGAN_ROUTE.firstDelay; return false; }
    for (let attempt = 0; attempt < 48; attempt++) {
      const angle = random() * Math.PI * 2 + attempt * 2.4;
      const radius = MORGAN_ROUTE.distanceMin + random() * MORGAN_ROUTE.distanceExtra;
      const point = { x: player.x + Math.cos(angle) * radius, y: player.y + Math.sin(angle) * radius };
      if (!world.canOccupy(point.x, point.y, 24) || !reachable(point)) continue;
      this.signal = point; this.expiresAt = now + MORGAN_ROUTE.signalLife; return false;
    }
    this.nextAt = now + 5; return false; // Reintentar posición sin bucles ni aparición sobre el actor.
  }
}
