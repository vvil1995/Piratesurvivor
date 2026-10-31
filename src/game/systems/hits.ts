import { itemHit } from './item-effects.ts';
import { STAT_LIMITS } from '../../content/stat-rules.ts';
import type { Enemy, Player, Vector } from '../core/types.ts';
import type { CollisionWorld } from '../world/world.ts';
export function damageEnemy(player: Player, enemy: Enemy, amount: number, knockback: number, origin: Vector,
  world: CollisionWorld, onKill: (enemy: Enemy) => void, random: () => number, area=false, secondary=false): void {
  if (!enemy.active) return;
  const critical = !secondary && player.stats.critChance > 0 && random() < Math.min(STAT_LIMITS.critChance, player.stats.critChance);
  const beforeHp=Math.max(0,enemy.hp);
  let reduction=1;
  if(enemy.defense){
    const d=enemy.defense,angle=Math.atan2(origin.y-enemy.y,origin.x-enemy.x),difference=Math.atan2(Math.sin(angle-d.angle),Math.cos(angle-d.angle));
    const armor=d.armor&&d.armor.remaining>0?d.armor.reduction:0;
    reduction=(1-armor)*(Math.abs(difference)<=d.arc/2?1-d.frontal:1);
    // Tope de defensa combinado: nunca por encima del70%.
    reduction=Math.max(.3,reduction);
    if(d.armor)d.armor.remaining=Math.max(0,d.armor.remaining-amount);
  }
  enemy.hp -= amount * reduction * ((enemy.statuses?.exposed ?? 0) > 0 ? 1.2 : 1) * (critical ? STAT_LIMITS.critMultiplier : 1); enemy.flash = 0.15;
  if(!secondary)itemHit(player,enemy,Math.max(0,Math.min(beforeHp,beforeHp-enemy.hp)),area,random);
  const dx = enemy.x - origin.x, dy = enemy.y - origin.y, distance = Math.max(1, Math.hypot(dx, dy));
  if (!enemy.kind) world.moveCircle(enemy, dx / distance * knockback, dy / distance * knockback, enemy.radius);
  if (enemy.hp <= 0) { enemy.active = false; if (!enemy.kind) player.kills++; onKill(enemy); }
}
