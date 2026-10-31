import { ABILITIES } from '../../content/attacks.ts';
import type { Enemy, EquippedAttack, Pickup, Player, Strike, Vector } from '../core/types.ts';
import type { Pool } from '../core/pool.ts';
import type { CollisionWorld } from '../world/world.ts';
import type { SpatialGrid } from '../spatial/grid.ts';
import { nearestTarget, spawnProjectile, spawnZone, type Effects } from './effects.ts';
import { damageEnemy } from './hits.ts';
import { applySkillHit } from './status.ts';
export interface SkillEffects extends Effects { pickups?: Pool<Pickup> }
const event = (p: Player, state: EquippedAttack, from: Vector, angle: number, reach: number): Strike => ({ ...from, angle, reach, life: 0.2, ownerId: p.id,
  behavior: ABILITIES[state.id].behavior, visual: ABILITIES[state.id].visual, evolved: state.level === 6, arc: 0.8, splash: 0, impact: { x: p.x, y: p.y } });
export function castAdvanced(player: Player, state: EquippedAttack, effects: SkillEffects, grid: SpatialGrid, world: CollisionWorld,
  onKill: (e: Enemy) => void, emit: (s: Strike) => void, random: () => number): boolean | undefined {
  const ability = ABILITIES[state.id], params = ability.levels[state.level - 1];
  if (ability.behavior === 'projectile') {
    const target = nearestTarget(player, grid, world, player.stats.range * params.range); if (!target) return false;
    const angle = Math.atan2(target.y - player.y, target.x - player.x), count = params.projectiles ?? 1;
    let fired = false;
    for (let i = 0; i < count; i++) {
      const aim = angle + (count === 1 ? 0 : (i / (count - 1) - 0.5) * (params.fan ?? 0.6));
      if (!spawnProjectile(effects, player.x, player.y, player.x + Math.cos(aim) * 200, player.y + Math.sin(aim) * 200,
        player.stats.damage * params.damage, params.projectileSpeed ?? 260, player.id, false, params.hits, { abilityId: state.id, level: state.level, bounces: params.bounces ?? 0 })) continue;
      fired = true;
    }
    return fired;
  }
  if (ability.behavior === 'decoy') {
    let x = player.x + Math.cos(player.facing) * 45, y = player.y + Math.sin(player.facing) * 45;
    if (!world.canOccupy(x, y, 10)) { x = player.x; y = player.y; }
    return spawnZone(effects, player, params, 'decoy', x, y, state.level);
  }
  if (ability.behavior === 'heal') {
    const food = effects.pickups?.acquire(); if (!food) return false;
    let x = player.x + Math.cos(player.facing) * 38, y = player.y + Math.sin(player.facing) * 38;
    if (!world.canOccupy(x, y, 5)) { x = player.x; y = player.y; }
    Object.assign(food, { x, y, value: params.heal ?? 12, ownerId: player.id, kind: 'food', life: params.duration ?? 8, abilityId: state.id, level: state.level }); return true;
  }
  if (ability.behavior !== 'dash' && ability.behavior !== 'evade') return;
  const dashRange = Math.min(player.stats.range * params.range, (params.dash ?? 50) + 28);
  const target = nearestTarget(player, grid, world, ability.behavior === 'dash' ? dashRange : player.stats.range * params.range, ability.behavior === 'dash' ? 14 : 2, ability.behavior === 'dash' ? 'movement' : 'attack');
  const hazard = effects.projectiles.items.find(p => p.active && p.hostile && Math.hypot(p.x - player.x, p.y - player.y) < 90);
  if (ability.behavior === 'dash' && !target) return false;
  if (!target && !hazard || ability.behavior === 'evade' && !hazard && target && Math.hypot(target.x - player.x, target.y - player.y) > 70) return false;
  const aim = target ?? hazard!, from = { x: player.x, y: player.y };
  const aimPosition = { x: aim.x, y: aim.y };
  let angle = Math.atan2(aim.y - player.y, aim.x - player.x);
  if (ability.behavior === 'evade') angle += Math.PI;
  const destination = { ...from };
  const travel = ability.behavior === 'dash' ? Math.min(params.dash ?? 50, Math.max(0, Math.hypot(aim.x - from.x, aim.y - from.y) - 24)) : params.dash ?? 50;
  world.moveCircle(destination, Math.cos(angle) * travel, Math.sin(angle) * travel, 14);
  if (ability.behavior === 'evade') {
    Object.assign(player, destination); player.hurtTimer = Math.max(player.hurtTimer, 0.25); player.facing = angle;
    if (params.splash) spawnZone(effects, player, { ...params, area: params.splash, duration: 4 }, 'trap', from.x, from.y, state.level);
    const counter = nearestTarget(player, grid, world, player.stats.range);
    if (counter) { applySkillHit(player, counter, params); damageEnemy(player, counter, player.stats.damage * params.damage, params.knockback, player, world, onKill, random); }
  } else {
    const length = Math.hypot(destination.x - from.x, destination.y - from.y), candidates: Enemy[] = [];
    grid.visit((from.x + destination.x) / 2, (from.y + destination.y) / 2, length / 2 + 30, enemy => {
      const dx = destination.x - from.x, dy = destination.y - from.y, denominator = dx * dx + dy * dy;
      const t = denominator ? Math.max(0, Math.min(1, ((enemy.x - from.x) * dx + (enemy.y - from.y) * dy) / denominator)) : 0;
      if (Math.hypot(enemy.x - from.x - t * dx, enemy.y - from.y - t * dy) <= 16 + enemy.radius && world.segmentClear(from.x, from.y, enemy.x, enemy.y, 2)) candidates.push(enemy);
    });
    if (!target || !candidates.includes(target)) return false;
    Object.assign(player, destination); player.hurtTimer = Math.max(player.hurtTimer, 0.12); player.facing = angle;
    candidates.sort((a, b) => a === target ? -1 : b === target ? 1 : Math.hypot(a.x - from.x, a.y - from.y) - Math.hypot(b.x - from.x, b.y - from.y));
    for (const enemy of candidates.slice(0, params.hits)) { applySkillHit(player, enemy, params); damageEnemy(player, enemy, player.stats.damage * params.damage, params.knockback, from, world, onKill, random); }
  }
  const strike = event(player, state, from, angle, Math.max(30, Math.hypot(aimPosition.x - from.x, aimPosition.y - from.y)));
  strike.impact = aimPosition; strike.targetId = target?.id; emit(strike); return true;
}
