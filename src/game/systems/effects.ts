import { ABILITIES } from '../../content/attacks.ts';
import type { AttackLevel } from '../../content/types.ts';
import type { AreaEffect, Enemy, Player, Projectile } from '../core/types.ts';
import type { Pool } from '../core/pool.ts';
import type { SpatialGrid } from '../spatial/grid.ts';
import type { CollisionWorld } from '../world/world.ts';
import { damageEnemy } from './hits.ts';
import { receivedDamage } from './stats.ts';
export const PROJECTILE_CAP = 96, AREA_CAP = 24;
export interface Effects { projectiles: Pool<Projectile>; areas: Pool<AreaEffect> }
export function nearestTarget(player: Player, grid: SpatialGrid, world: CollisionWorld, range: number): Enemy | undefined {
  let target: Enemy | undefined, best = range * range;
  grid.visit(player.x, player.y, range, enemy => {
    const d = (player.x - enemy.x) ** 2 + (player.y - enemy.y) ** 2;
    if (d <= best && world.segmentClear(player.x, player.y, enemy.x, enemy.y, 2)) { target = enemy; best = d; }
  });
  return target;
}
export function castArea(player: Player, params: AttackLevel, level: number, effects: Effects, grid: SpatialGrid, world: CollisionWorld): boolean {
  const target = nearestTarget(player, grid, world, player.stats.range * params.range); if (!target) return false;
  const area = effects.areas.acquire(); if (!area) return false;
  Object.assign(area, { x: target.x, y: target.y, ownerId: player.id, radius: params.area ?? 40,
    shockRadius: params.splash, damage: player.stats.damage * params.damage, knockback: params.knockback,
    delay: params.delay ?? 0.4, life: 0.3, triggered: false, evolved: level === 6 });
  return true;
}
function segmentDistance(x: number, y: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax, dy = by - ay, length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / length)) : 0;
  return Math.hypot(x - ax - t * dx, y - ay - t * dy);
}
export function tickEffects(effects: Effects, actors: ReadonlyMap<string, Player>, grid: SpatialGrid, world: CollisionWorld, dt: number,
  onKill: (enemy: Enemy, owner: string) => void, random: () => number): void {
  for (const area of effects.areas.items) {
    if (!area.active) continue;
    const owner = actors.get(area.ownerId); if (!owner || owner.hp <= 0) { area.active = false; continue; }
    area.delay = Math.max(0, area.delay - dt);
    if (area.delay > 0) continue;
    if (!area.triggered) {
      area.triggered = true;
      grid.visit(area.x, area.y, Math.max(area.radius, area.shockRadius) + 15, enemy => {
        const d = Math.hypot(enemy.x - area.x, enemy.y - area.y);
        const factor = d <= area.radius + enemy.radius ? 1 : d <= area.shockRadius + enemy.radius ? 0.55 : 0;
        if (factor && world.segmentClear(area.x, area.y, enemy.x, enemy.y, 2)) damageEnemy(owner, enemy, area.damage * factor, area.knockback, area, world, e => onKill(e, owner.id), random);
      });
    }
    area.life -= dt; if (area.life <= 0) area.active = false;
  }
  for (const bullet of effects.projectiles.items) {
    if (!bullet.active) continue;
    bullet.life -= dt; if (bullet.life <= 0) { bullet.active = false; continue; }
    const ax = bullet.x, ay = bullet.y, bx = ax + bullet.vx * dt, by = ay + bullet.vy * dt;
    if (!world.segmentClear(ax, ay, bx, by, bullet.radius)) { bullet.active = false; continue; }
    let reflected = false;
    if (bullet.hostile) for (const actor of actors.values()) {
      if (actor.hp <= 0) continue;
      const shield = actor.attacks.find(a => ABILITIES[a.id].behavior === 'guard' && a.level === 6 && a.activeFor > 0);
      if (!bullet.reflected && shield && segmentDistance(actor.x, actor.y, ax, ay, bx, by) < 40 + bullet.radius) {
        bullet.hostile = false; bullet.ownerId = actor.id; bullet.reflected = true; bullet.vx *= -1; bullet.vy *= -1; bullet.hit.clear(); reflected = true; break;
      }
      if (segmentDistance(actor.x, actor.y, ax, ay, bx, by) < 14 + bullet.radius) {
        if (actor.hurtTimer <= 0) { actor.hp = Math.max(0, actor.hp - receivedDamage(bullet.damage, actor.stats.armor)); actor.hurtTimer = 0.65; }
        bullet.active = false; break;
      }
    }
    else {
      const owner = actors.get(bullet.ownerId); if (!owner || owner.hp <= 0) { bullet.active = false; continue; }
      grid.visit((ax + bx) / 2, (ay + by) / 2, Math.hypot(bx - ax, by - ay) / 2 + 20, enemy => {
        if (!bullet.active || bullet.hit.has(enemy.id) || segmentDistance(enemy.x, enemy.y, ax, ay, bx, by) > bullet.radius + enemy.radius) return;
        bullet.hit.add(enemy.id); damageEnemy(owner, enemy, bullet.damage, 5, bullet, world, e => onKill(e, owner.id), random);
        if (--bullet.remainingHits <= 0) bullet.active = false;
      });
    }
    if (!reflected) { bullet.x = bx; bullet.y = by; }
  }
}

export function spawnProjectile(effects: Effects, x: number, y: number, targetX: number, targetY: number,
  damage: number, speed: number, ownerId: string, hostile = false, hits = 1): boolean {
  const projectile = effects.projectiles.acquire(); if (!projectile) return false;
  const d = Math.max(1, Math.hypot(targetX - x, targetY - y));
  projectile.hit.clear();
  Object.assign(projectile, { x, y, vx: (targetX - x) / d * speed, vy: (targetY - y) / d * speed,
    radius: 3, life: 2.5, damage, ownerId, hostile, reflected: false, remainingHits: hits });
  return true;
}
