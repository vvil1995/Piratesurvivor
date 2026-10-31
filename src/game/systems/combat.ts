import { activeMovements } from './loadout.ts';
import { ABILITIES } from '../../content/attacks.ts';
import { damageEnemy } from './hits.ts';
import { castArea, queueImpact } from './effects.ts';
import { castAdvanced, type SkillEffects } from './advanced-skills.ts';
import { applySkillHit } from './status.ts';
import { attackCooldown } from './stats.ts';
import type { Enemy, Player, Strike } from '../core/types.ts';
import type { CollisionWorld } from '../world/world.ts';
import type { SpatialGrid } from '../spatial/grid.ts';

export function attack(player: Player, grid: SpatialGrid, abilityId: string, onKill: (enemy: Enemy) => void, world: CollisionWorld, level = 1, random: () => number = Math.random, options?: { targetId?: number; angleOffset?: number }): Strike | undefined {
  const ability = ABILITIES[abilityId], params = ability.levels[level - 1];
  if (ability.category === 'buff' || ability.behavior === 'guard' || ability.behavior === 'slam' || ['projectile', 'decoy', 'evade', 'heal', 'dash'].includes(ability.behavior)) return;
  const range = player.stats.range * params.range;
  let target: Enemy | undefined, closest = range ** 2;
  grid.visit(player.x, player.y, range, enemy => {
    if (options?.targetId !== undefined && enemy.id !== options.targetId) return;
    const d = (player.x - enemy.x) ** 2 + (player.y - enemy.y) ** 2;
    if (d <= closest && world.segmentClear(player.x, player.y, enemy.x, enemy.y, 2, 'attack')) { closest = d; target = enemy; }
  });
  if (!target) return;
  const angle = Math.atan2(target.y - player.y, target.x - player.x) + (options?.angleOffset ?? 0), ax = Math.cos(angle), ay = Math.sin(angle);
  const impactX = target.x, impactY = target.y;
  player.facing = angle;
  const victims: Enemy[] = [];
  grid.visit(player.x, player.y, range + 15, enemy => {
    if (ability.behavior === 'focus' && enemy.id !== target!.id) return;
    const dx = enemy.x - player.x, dy = enemy.y - player.y, distance = Math.hypot(dx, dy);
    if (distance > range + enemy.radius || !world.segmentClear(player.x, player.y, enemy.x, enemy.y, 2, 'attack')) return;
    const projection = dx * ax + dy * ay;
    const line = ability.behavior === 'line' || ability.behavior === 'focus' || ability.behavior === 'burst' && params.shape !== 'cone';
    if (line ? projection < 0 || Math.abs(dx * ay - dy * ax) > params.width + enemy.radius :
      distance > 1 && projection / distance < Math.cos(params.arc)) return;
    victims.push(enemy);
  });
  victims.sort((a, b) => (a.x - player.x) ** 2 + (a.y - player.y) ** 2 - ((b.x - player.x) ** 2 + (b.y - player.y) ** 2));
  const hit = new Set<number>();
  const damage = (enemy: Enemy, multiplier = 1) => {
    if (!enemy.active || hit.has(enemy.id)) return;
    hit.add(enemy.id); applySkillHit(player, enemy, params);
    damageEnemy(player, enemy, player.stats.damage * params.damage * multiplier, params.knockback, player, world, onKill, random, !['line','focus','burst'].includes(ability.behavior)||params.shape==='cone'||params.splash>0);
  };
  for (const enemy of victims.slice(0, params.hits)) damage(enemy);
  if (params.splash) grid.visit(impactX, impactY, params.splash + 15, enemy => {
    if (Math.hypot(enemy.x - impactX, enemy.y - impactY) <= params.splash + enemy.radius &&
      world.segmentClear(impactX, impactY, enemy.x, enemy.y, 2, 'attack') && world.segmentClear(player.x, player.y, enemy.x, enemy.y, 2, 'attack')) damage(enemy, 0.75);
  });
  let reach = ability.behavior === 'sweep' || params.hits > 1 ? range : Math.sqrt(closest);
  if (ability.behavior === 'line' || ability.behavior === 'burst') {
    // El trazo perforante tampoco debe aparentar que atraviesa edificios.
    for (let step = 6; step <= reach; step += 6) if (!world.canOccupy(player.x + ax * step, player.y + ay * step, 2)) { reach = Math.max(0, step - 6); break; }
  }
  return { x: player.x, y: player.y, angle, reach,
    life: ability.visual === 'rubber-kick' ? 0.36 : ability.visual?.startsWith('rubber-') ? 0.24 : 0.18, ownerId: player.id, behavior: ability.behavior, evolved: level === 6, arc: params.arc, splash: params.splash, impact: { x: impactX, y: impactY }, targetId: target.id, visual: ability.visual ?? 'punch' };
}

export function tickAttacks(player: Player, grid: SpatialGrid, world: CollisionWorld, dt: number,
  onKill: (enemy: Enemy) => void, emit: (strike: Strike) => void, random: () => number = Math.random, effects?: SkillEffects): void {
  const active = activeMovements(player);
  for (const state of player.attacks) {
    if (ABILITIES[state.id].category === 'buff') continue;
    const params = ABILITIES[state.id].levels[state.level - 1];
    if (!active.includes(state.id)) {
      if (ABILITIES[state.id].behavior !== 'guard') state.cooldown = Math.max(0, state.cooldown - dt);
      state.pending = 0; if (ABILITIES[state.id].behavior !== 'heal') state.activeFor = 0; state.activationPending = false; continue;
    }
    if (ABILITIES[state.id].behavior === 'guard') {
      if (state.activationPending) {
        state.activationPending = false;
        const radius = player.stats.range * params.range;
        grid.visit(player.x, player.y, radius + 15, enemy => {
          const dx = enemy.x - player.x, dy = enemy.y - player.y, d = Math.max(1, Math.hypot(dx, dy));
          if (d > radius + enemy.radius || !world.segmentClear(player.x, player.y, enemy.x, enemy.y, 2, 'attack')) return;
          if (params.damage > 0) damageEnemy(player, enemy, player.stats.damage * params.damage, 0, player, world, onKill, random, true);
          if (!enemy.active || enemy.kind) return;
          if (params.launch) {
            const ux = d > 1 ? dx / d : Math.cos(player.facing), uy = d > 1 ? dy / d : Math.sin(player.facing);
            enemy.launchTime = 0.3; enemy.launchX = ux * params.knockback / 0.3; enemy.launchY = uy * params.knockback / 0.3;
          } else world.moveCircle(enemy, dx / d * params.knockback, dy / d * params.knockback, enemy.radius);
        });
        emit({ x: player.x, y: player.y, angle: 0, reach: radius, life: 0.25, ownerId: player.id, behavior: 'guard', evolved: state.level === 6, arc: Math.PI, splash: 0, impact: { x: player.x, y: player.y } });
      }
      continue;
    }
    state.cooldown = Math.max(0, state.cooldown - dt);
    state.burstTimer = Math.max(0, state.burstTimer - dt);
    const kind = ABILITIES[state.id].behavior;
    if (['projectile', 'decoy', 'evade', 'heal', 'dash'].includes(kind)) {
      if (state.cooldown <= 0 && effects && castAdvanced(player, state, effects, grid, world, onKill, emit, random)) state.cooldown = attackCooldown(ABILITIES[state.id].levels[0].cooldown, params.cooldown, player);
      continue;
    }
    if (ABILITIES[state.id].behavior === 'slam') {
      if (state.cooldown <= 0 && effects && castArea(player, params, state.level, effects, grid, world, ABILITIES[state.id].visual)) state.cooldown = attackCooldown(ABILITIES[state.id].levels[0].cooldown, params.cooldown, player);
      continue;
    }
    if (state.pending > 0) {
      if (state.burstTimer > 0) continue;
      const strike = attack(player, grid, state.id, onKill, world, state.level, random, { targetId: kind === 'focus' ? state.targetId : undefined, angleOffset: kind === 'alternating' ? state.pending % 2 ? -0.65 : 0.65 : 0 });
      if (strike) {
        emit(strike);
        if (state.pending === 1 && params.finisher && effects) queueImpact(effects, player, strike.impact.x, strike.impact.y, params.finisher, player.stats.damage * params.damage * 0.8);
      }
      state.pending = strike ? state.pending - 1 : 0; state.burstTimer = params.interval;
    } else if (state.cooldown <= 0) {
      const strike = attack(player, grid, state.id, onKill, world, state.level, random, { angleOffset: kind === 'alternating' ? 0.65 : 0 });
      if (!strike) continue;
      emit(strike); state.targetId = strike.targetId; state.activeFor = params.deflect ? params.duration ?? 0.8 : state.activeFor; state.pending = params.shots - 1; state.burstTimer = params.interval;
      state.cooldown = attackCooldown(ABILITIES[state.id].levels[0].cooldown, params.cooldown, player);
    }
  }
}
