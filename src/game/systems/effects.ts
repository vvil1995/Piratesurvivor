import { ABILITIES } from '../../content/attacks.ts';
import type { AttackLevel } from '../../content/types.ts';
import type { AreaEffect, Enemy, Player, Projectile } from '../core/types.ts';
import type { Pool } from '../core/pool.ts';
import type { SpatialGrid } from '../spatial/grid.ts';
import type { CollisionWorld } from '../world/world.ts';
import { damageEnemy } from './hits.ts';
import { counterGuard } from './guards.ts';
import { applySkillHit, applyStatus } from './status.ts';
import { receivedDamage } from './stats.ts';
export const PROJECTILE_CAP = 96, AREA_CAP = 24;
export interface Effects { projectiles: Pool<Projectile>; areas: Pool<AreaEffect> }
export function nearestTarget(player: Player, grid: SpatialGrid, world: CollisionWorld, range: number, clearance = 2): Enemy | undefined {
  let target: Enemy | undefined, best = range * range;
  grid.visit(player.x, player.y, range, enemy => {
    const d = (player.x - enemy.x) ** 2 + (player.y - enemy.y) ** 2;
    if (d <= best && world.segmentClear(player.x, player.y, enemy.x, enemy.y, clearance)) { target = enemy; best = d; }
  });
  return target;
}
export function castArea(player: Player, params: AttackLevel, level: number, effects: Effects, grid: SpatialGrid, world: CollisionWorld, visual?: string): boolean {
  const target = nearestTarget(player, grid, world, player.stats.range * params.range); if (!target) return false;
  const area = effects.areas.acquire(); if (!area) return false;
  Object.assign(area, { x: target.x, y: target.y, ownerId: player.id, radius: params.area ?? 40,
    shockRadius: params.splash, damage: player.stats.damage * params.damage, knockback: params.knockback,
    delay: params.delay ?? 0.4, life: 0.3, triggered: false, evolved: level === 6, kind: 'impact', status: params.status, statusDuration: params.statusDuration, tickTimer: 0, hp: undefined, visual });
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
    if (area.kind === 'smoke') {
      area.life -= dt; area.tickTimer = (area.tickTimer ?? 0) - dt;
      if (area.tickTimer <= 0) {
        area.tickTimer = 0.2;
        grid.visit(area.x, area.y, area.radius + 15, enemy => {
          if (Math.hypot(enemy.x - area.x, enemy.y - area.y) <= area.radius + enemy.radius && world.segmentClear(area.x, area.y, enemy.x, enemy.y, 2)) applyStatus(enemy, 'confuse', 0.4);
        });
      }
      if (area.life <= 0) area.active = false; continue;
    }
    if (area.kind === 'decoy') {
      area.life -= dt;
      if (area.life > 0 && (area.hp ?? 0) > 0) continue;
      if (!area.shockRadius) { area.active = false; continue; }
      area.radius = area.shockRadius; area.shockRadius = 0; area.life = 0.3; area.kind = 'impact';
    }
    if (area.kind === 'trap') {
      area.life -= dt; if (area.life <= 0) { area.active = false; continue; }
      let touched = false; grid.visit(area.x, area.y, area.radius + 15, enemy => { if (Math.hypot(enemy.x - area.x, enemy.y - area.y) <= area.radius + enemy.radius) touched = true; });
      if (!touched) continue;
      area.kind = 'impact'; area.life = 0.3;
    }
    if (!area.triggered) {
      area.triggered = true;
      grid.visit(area.x, area.y, Math.max(area.radius, area.shockRadius) + 15, enemy => {
        const d = Math.hypot(enemy.x - area.x, enemy.y - area.y);
        const factor = d <= area.radius + enemy.radius ? 1 : d <= area.shockRadius + enemy.radius ? 0.55 : 0;
        if (factor && world.segmentClear(area.x, area.y, enemy.x, enemy.y, 2)) {
          if (area.status) applyStatus(enemy, area.status, area.statusDuration ?? 0.5);
          damageEnemy(owner, enemy, area.damage * factor, area.knockback, area, world, e => onKill(e, owner.id), random);
        }
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
    if (bullet.hostile) for (const lure of effects.areas.items) {
      if (lure.active && lure.kind === 'decoy' && segmentDistance(lure.x, lure.y, ax, ay, bx, by) < lure.radius + bullet.radius) { lure.hp = (lure.hp ?? 0) - bullet.damage; bullet.active = false; break; }
    }
    if (!bullet.active) continue;
    if (bullet.hostile) for (const actor of actors.values()) {
      if (actor.hp <= 0) continue;
      const shield = actor.attacks.find(a => a.activeFor > 0 && ABILITIES[a.id].levels[a.level - 1].reflect);
      const deflector = actor.attacks.some(a => a.activeFor > 0 && ABILITIES[a.id].levels[a.level - 1].deflect);
      if (deflector && segmentDistance(actor.x, actor.y, ax, ay, bx, by) < 40 + bullet.radius) { bullet.active = false; break; }
      if (!bullet.reflected && shield && segmentDistance(actor.x, actor.y, ax, ay, bx, by) < 40 + bullet.radius) {
        bullet.hostile = false; bullet.ownerId = actor.id; bullet.reflected = true; bullet.vx *= -1; bullet.vy *= -1; bullet.hit.clear(); reflected = true; break;
      }
      if (segmentDistance(actor.x, actor.y, ax, ay, bx, by) < 14 + bullet.radius) {
        if (actor.hurtTimer <= 0) { if (!counterGuard(actor, bullet, grid, world, e => onKill(e, actor.id), random)) actor.hp = Math.max(0, actor.hp - receivedDamage(bullet.damage, actor.stats.armor)); actor.hurtTimer = 0.65; }
        bullet.active = false; break;
      }
    }
    else {
      const owner = actors.get(bullet.ownerId); if (!owner || owner.hp <= 0) { bullet.active = false; continue; }
      grid.visit((ax + bx) / 2, (ay + by) / 2, Math.hypot(bx - ax, by - ay) / 2 + 20, enemy => {
        if (!bullet.active || bullet.hit.has(enemy.id) || segmentDistance(enemy.x, enemy.y, ax, ay, bx, by) > bullet.radius + enemy.radius) return;
        const params = bullet.abilityId ? ABILITIES[bullet.abilityId].levels[(bullet.level ?? 1) - 1] : undefined;
        bullet.hit.add(enemy.id);
        if (params) applySkillHit(owner, enemy, params);
        damageEnemy(owner, enemy, bullet.damage, 5, bullet, world, e => onKill(e, owner.id), random);
        let chains = 0;
        const chain = (victim: Enemy) => {
          if (params?.chain && victim.hp <= 0 && chains++ < params.chain) queueImpact(effects, owner, victim.x, victim.y, params.splash || 50, bullet.damage * 0.5, 0.12);
        };
        chain(enemy);
        if (params?.duration && params.status === 'confuse') spawnZone(effects, owner, params, 'smoke', enemy.x, enemy.y, bullet.level ?? 1);
        if (params?.splash) grid.visit(enemy.x, enemy.y, params.splash + 15, other => {
          if (!other.active || bullet.hit.has(other.id) || Math.hypot(other.x - enemy.x, other.y - enemy.y) > params.splash! + other.radius || !world.segmentClear(enemy.x, enemy.y, other.x, other.y, 2)) return;
          bullet.hit.add(other.id); applySkillHit(owner, other, params);
          damageEnemy(owner, other, bullet.damage * 0.7, params.knockback, enemy, world, e => onKill(e, owner.id), random); chain(other);
        });
        if ((bullet.bounces ?? 0) > 0) {
          let next: Enemy | undefined, best = 160;
          grid.visit(enemy.x, enemy.y, 160, candidate => {
            const d = Math.hypot(candidate.x - enemy.x, candidate.y - enemy.y);
            if (!bullet.hit.has(candidate.id) && d < best && world.segmentClear(enemy.x, enemy.y, candidate.x, candidate.y, 3)) { best = d; next = candidate; }
          });
          if (next) { const speed = Math.hypot(bullet.vx, bullet.vy), d = Math.max(1, Math.hypot(next.x - bx, next.y - by)); bullet.vx = (next.x - bx) / d * speed; bullet.vy = (next.y - by) / d * speed; bullet.bounces = Math.max(0, (bullet.bounces ?? 0) - 1); }
        }
        if (--bullet.remainingHits <= 0) bullet.active = false;
      });
    }
    if (!reflected) { bullet.x = bx; bullet.y = by; }
  }
}

export function spawnProjectile(effects: Effects, x: number, y: number, targetX: number, targetY: number,
  damage: number, speed: number, ownerId: string, hostile = false, hits = 1, details?: { abilityId: string; level: number; bounces: number }): boolean {
  const projectile = effects.projectiles.acquire(); if (!projectile) return false;
  const d = Math.max(1, Math.hypot(targetX - x, targetY - y));
  projectile.hit.clear();
  Object.assign(projectile, { x, y, vx: (targetX - x) / d * speed, vy: (targetY - y) / d * speed,
    radius: 3, life: 2.5, damage, ownerId, hostile, reflected: false, remainingHits: hits, abilityId: details?.abilityId, level: details?.level ?? 1, bounces: details?.bounces ?? 0 });
  return true;
}

export function spawnZone(effects: Effects, player: Player, params: AttackLevel, kind: 'smoke' | 'decoy' | 'trap', x: number, y: number, level: number): boolean {
  const area = effects.areas.acquire(); if (!area) return false;
  Object.assign(area, { x, y, ownerId: player.id, kind, radius: params.area ?? 40, shockRadius: params.splash,
    damage: player.stats.damage * params.damage, knockback: params.knockback, delay: 0, life: params.duration ?? 4,
    triggered: false, evolved: level === 6, status: params.status, statusDuration: params.statusDuration, tickTimer: 0, hp: kind === 'decoy' ? 60 : undefined, visual: undefined });
  return true;
}

export function queueImpact(effects: Effects, player: Player, x: number, y: number, radius: number, damage: number, delay = 0.08, visual?: string): boolean {
  const area = effects.areas.acquire(); if (!area) return false;
  Object.assign(area, { x, y, ownerId: player.id, kind: 'impact', radius, shockRadius: 0, damage, knockback: 10, delay, life: 0.3, triggered: false, evolved: true, status: undefined, statusDuration: undefined, tickTimer: 0, hp: undefined, visual }); return true;
}
