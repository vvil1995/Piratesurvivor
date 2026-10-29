import { ENEMIES } from '../../content/catalog.ts';
import type { WorldDefinition } from '../../content/worlds/shells-town.ts';
import type { Pool } from '../core/pool.ts';
import type { Enemy, Player } from '../core/types.ts';
import type { ProceduralWorld } from '../world/world.ts';
import type { FlowField } from '../navigation/flow-field.ts';
export interface View { width: number; height: number; centerX: number; centerY: number }
export function spawnEnemy(pool: Pool<Enemy>, actors: readonly Player[], view: View, world: ProceduralWorld, field: FlowField, definition: WorldDefinition, random: () => number, id: number): void {
  if (pool.count >= definition.enemyCap || !actors.length) return;
  let x = 0, y = 0, found = false;
  for (let tries = 0; tries < 24; tries++) {
    const side = Math.floor(random() * 4), pad = 64;
    if (side < 2) {
      x = view.centerX + (side === 0 ? -1 : 1) * (view.width / 2 + pad);
      y = view.centerY + (random() - 0.5) * (view.height + pad * 2);
    } else {
      x = view.centerX + (random() - 0.5) * (view.width + pad * 2);
      y = view.centerY + (side === 2 ? -1 : 1) * (view.height / 2 + pad);
    }
    if (actors.some(p => Math.hypot(x - p.x, y - p.y) < 200)) continue;
    if (!world.canOccupy(x, y, 14) || !field.reachable({ x, y })) continue;
    found = true; break;
  }
  if (!found) return;
  const enemy = pool.acquire(); if (!enemy) return;
  const def = ENEMIES[definition.enemyId], scale = definition.enemyScale;
  Object.assign(enemy, { x, y, id, hp: def.hp * scale, maxHp: def.hp * scale,
    speed: def.speed, damage: def.damage, xp: def.xp, radius: def.radius, flash: 0,
    targetId: undefined, steeringTime: 0, steerX: 0, steerY: 0 });
}
