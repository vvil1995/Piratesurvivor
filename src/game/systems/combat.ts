import { ABILITIES } from '../../content/attacks.ts';
import { CHARACTERS } from '../../content/catalog.ts';
import type { Enemy, Player, Strike } from '../core/types.ts';
import type { CollisionWorld } from '../world/world.ts';
import type { SpatialGrid } from '../spatial/grid.ts';

export function attack(player: Player, grid: SpatialGrid, abilityId: string, onKill: (enemy: Enemy) => void, world: CollisionWorld, level = 1): Strike | undefined {
  const ability = ABILITIES[abilityId], params = ability.levels[level - 1];
  const range = player.stats.range * params.range;
  let target: Enemy | undefined, closest = range ** 2;
  grid.visit(player.x, player.y, range, enemy => {
    const d = (player.x - enemy.x) ** 2 + (player.y - enemy.y) ** 2;
    if (d <= closest && world.segmentClear(player.x, player.y, enemy.x, enemy.y, 2)) { closest = d; target = enemy; }
  });
  if (!target) return;
  const angle = Math.atan2(target.y - player.y, target.x - player.x), ax = Math.cos(angle), ay = Math.sin(angle);
  const impactX = target.x, impactY = target.y;
  player.facing = angle;
  const victims: Enemy[] = [];
  grid.visit(player.x, player.y, range + 15, enemy => {
    const dx = enemy.x - player.x, dy = enemy.y - player.y, distance = Math.hypot(dx, dy);
    if (distance > range + enemy.radius || !world.segmentClear(player.x, player.y, enemy.x, enemy.y, 2)) return;
    const projection = dx * ax + dy * ay;
    const line = ability.behavior === 'line' || ability.behavior === 'burst';
    if (line ? projection < 0 || Math.abs(dx * ay - dy * ax) > params.width + enemy.radius :
      distance > 1 && projection / distance < Math.cos(params.arc)) return;
    victims.push(enemy);
  });
  victims.sort((a, b) => (a.x - player.x) ** 2 + (a.y - player.y) ** 2 - ((b.x - player.x) ** 2 + (b.y - player.y) ** 2));
  const hit = new Set<number>();
  const damage = (enemy: Enemy, multiplier = 1) => {
    if (!enemy.active || hit.has(enemy.id)) return;
    hit.add(enemy.id); enemy.hp -= player.stats.damage * params.damage * multiplier; enemy.flash = 0.15;
    const dx = enemy.x - player.x, dy = enemy.y - player.y, distance = Math.max(1, Math.hypot(dx, dy));
    world.moveCircle(enemy, dx / distance * params.knockback, dy / distance * params.knockback, enemy.radius);
    if (enemy.hp <= 0) { enemy.active = false; player.kills++; onKill(enemy); }
  };
  for (const enemy of victims.slice(0, params.hits)) damage(enemy);
  if (params.splash) grid.visit(impactX, impactY, params.splash + 15, enemy => {
    if (Math.hypot(enemy.x - impactX, enemy.y - impactY) <= params.splash + enemy.radius &&
      world.segmentClear(impactX, impactY, enemy.x, enemy.y, 2) && world.segmentClear(player.x, player.y, enemy.x, enemy.y, 2)) damage(enemy, 0.75);
  });
  let reach = ability.behavior === 'sweep' || params.hits > 1 ? range : Math.sqrt(closest);
  if (ability.behavior === 'line' || ability.behavior === 'burst') {
    // El trazo perforante tampoco debe aparentar que atraviesa edificios.
    for (let step = 6; step <= reach; step += 6) if (!world.canOccupy(player.x + ax * step, player.y + ay * step, 2)) { reach = Math.max(0, step - 6); break; }
  }
  return { x: player.x, y: player.y, angle, reach,
    life: 0.18, ownerId: player.id, behavior: ability.behavior, evolved: level === 6, arc: params.arc, splash: params.splash, impact: { x: impactX, y: impactY } };
}

export function tickAttacks(player: Player, grid: SpatialGrid, world: CollisionWorld, dt: number,
  onKill: (enemy: Enemy) => void, emit: (strike: Strike) => void): void {
  for (const state of player.attacks) {
    const params = ABILITIES[state.id].levels[state.level - 1];
    state.cooldown = Math.max(0, state.cooldown - dt);
    state.burstTimer = Math.max(0, state.burstTimer - dt);
    if (state.pending > 0) {
      if (state.burstTimer > 0) continue;
      const strike = attack(player, grid, state.id, onKill, world, state.level);
      if (strike) emit(strike);
      state.pending = strike ? state.pending - 1 : 0; state.burstTimer = params.interval;
    } else if (state.cooldown <= 0) {
      const strike = attack(player, grid, state.id, onKill, world, state.level);
      if (!strike) continue;
      emit(strike); state.pending = params.shots - 1; state.burstTimer = params.interval;
      state.cooldown = Math.max(0.2, params.cooldown * player.stats.cooldown / CHARACTERS[player.characterId].stats.cooldown);
    }
  }
}
