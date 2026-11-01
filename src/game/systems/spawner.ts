import { difficultyAt } from './difficulty.ts';
import { ENEMIES } from '../../content/catalog.ts';
import type { WorldDefinition } from '../../content/worlds/shells-town.ts';
import type { Pool } from '../core/pool.ts';
import type { Enemy, Player } from '../core/types.ts';
import type { CollisionWorld,ProceduralWorld } from '../world/world.ts';
import type { FlowField } from '../navigation/flow-field.ts';
export interface View { width: number; height: number; centerX: number; centerY: number }
export function spawnEnemy(pool: Pool<Enemy>, actors: readonly Player[], view: View, world: ProceduralWorld, field: FlowField, definition: WorldDefinition, random: () => number, id: number, seconds = 0, mobility?:CollisionWorld): void {
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
    if (!(mobility??world).canOccupy(x, y, 14) || !field.reachable({ x, y })) continue;
    found = true; break;
  }
  if (!found) return;
  const enemy = pool.acquire(); if (!enemy) return;
  const type = chooseEnemyType(definition, seconds, random);
  const def = ENEMIES[type], scale = definition.enemyScale;
  if((definition.biome==='pirate-fleet'||mobility)&&!(mobility??world).canOccupy(x,y,def.radius)){enemy.active=false;return;}
  const threat = difficultyAt(seconds, definition.spawnInterval, definition.difficulty);
  Object.assign(enemy, { x, y, id, visual: def.visual, kind: undefined, hp: def.hp * scale * threat.hp, maxHp: def.hp * scale * threat.hp,
    speed: def.speed * threat.speed, damage: def.damage * threat.damage,
    xp: Math.max(1, Math.round(def.xp * (definition.xpMultiplier ?? 1) * (1 + (threat.hp - 1) * (definition.xpThreatScaling ?? 0)))), radius: def.radius, flash: 0,
    swimming:def.swimming,defense:def.frontalReduction?{angle:0,frontal:def.frontalReduction,arc:Math.PI*.8}:undefined,launchTime: 0, launchX: 0, launchY: 0, stolen: false, statuses: undefined, lureIndex: undefined, decoyHitTimer: 0, melee:def.melee,meleeTimer:.8,meleeWindup:0,meleeHits:0,meleeGap:0,meleeAngle:0, ranged: def.ranged, shotWindup: 0, shotAngle: 0, shotRecovery: 0, shotTimer: 1 + id % 5 * 0.2, targetId: undefined, steeringTime: 0, steerX: 0, steerY: 0 });
}

/** Only chooses a type; never acquires an extra entity or changes spawn cadence. */
export function chooseEnemyType(definition: WorldDefinition, seconds: number, random: () => number): string {
  const stage = definition.distributions?.filter(s => seconds >= s.at).slice(-1)[0];
  const variants = stage?.weights ?? definition.enemyVariants?.filter(v => seconds >= v.minSeconds);
  if (!variants?.length) return definition.enemyId;
  let roll = random() * variants.reduce((total, v) => total + v.weight, 0);
  for (const v of variants) { roll -= v.weight; if (v.weight > 0 && roll < 0) return v.id; }
  return variants.filter(v => v.weight > 0).slice(-1)[0]?.id ?? definition.enemyId;
}
