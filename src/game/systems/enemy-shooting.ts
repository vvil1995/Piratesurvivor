import type { Enemy, Vector } from '../core/types.ts';

/** Per-enemy windup locks aim; interruption cancels the shot, never fires through stun. */
export function tickEnemyShot(enemy: Enemy, aim: Vector, dt: number, canFire: boolean,
  fire: (angle: number, lifetime?: number) => boolean): void {
  const attack = enemy.ranged;
  if (!attack) return;
  // Preserve legacy ranged pirates, including retries when the shared pool is full.
  if (!attack.preparation) {
    enemy.shotTimer = Math.max(0, (enemy.shotTimer ?? 0) - dt);
    if (canFire && enemy.shotTimer <= 0 && fire(Math.atan2(aim.y-enemy.y, aim.x-enemy.x))) enemy.shotTimer = attack.interval;
    return;
  }
  enemy.shotRecovery = Math.max(0, (enemy.shotRecovery ?? 0) - dt);
  enemy.shotTimer = Math.max(0, (enemy.shotTimer ?? 0) - dt);
  if (!canFire) { enemy.shotWindup = 0; return; }
  if ((enemy.shotWindup ?? 0) > 0) {
    enemy.shotWindup = Math.max(0, enemy.shotWindup! - dt);
    if (enemy.shotWindup > 0) return;
  } else {
    if (enemy.shotTimer > 0) return;
    enemy.shotAngle = Math.atan2(aim.y - enemy.y, aim.x - enemy.x);
    if (attack.preparation) { enemy.shotWindup = attack.preparation; return; }
  }
  const count = attack.pellets ?? 1;
  for (let i = 0; i < count; i++) {
    const angle = enemy.shotAngle! + (count > 1 ? (i / (count - 1) - .5) * (attack.spread ?? 0) : 0);
    if (!fire(angle, attack.lifetime)) break; // Shared bounded projectile pool.
  }
  enemy.shotTimer = attack.interval;
  // Preserve legacy ranged pirates, including retries when the shared pool is full.
  if (!attack.preparation) {
    enemy.shotTimer = Math.max(0, (enemy.shotTimer ?? 0) - dt);
    if (canFire && enemy.shotTimer <= 0 && fire(Math.atan2(aim.y-enemy.y, aim.x-enemy.x))) enemy.shotTimer = attack.interval;
    return;
  }
  enemy.shotRecovery = .3;
}
