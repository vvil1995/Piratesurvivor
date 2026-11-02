import type { AttackLevel, StatusKind } from '../../content/types.ts';
import type { Enemy, Player } from '../core/types.ts';
export function applyStatus(enemy: Enemy, kind: StatusKind, seconds: number): void {
  if (enemy.kind) return;
  const states = enemy.statuses ??= {};
  states[kind] = Math.max(states[kind] ?? 0, Math.min(5, seconds));
  if (kind === 'stun') enemy.shotTimer = Math.max(enemy.shotTimer ?? 0, seconds);
}
export function statusValue(enemy:Enemy,key:StatusKind):number {const f=enemy.fruitControl;return Math.max(enemy.statuses?.[key]??0,f?.id===enemy.id&&key in f?(f as unknown as Partial<Record<StatusKind,number>>)[key]??0:0);}
export function tickStatus(enemy: Enemy, dt: number): void {
  if(enemy.fruitControl){if(enemy.fruitControl.id!==enemy.id)enemy.fruitControl=undefined;else for(const k of ['slow','stun','confuse'] as const)enemy.fruitControl[k]=Math.max(0,(enemy.fruitControl[k]??0)-dt);}
  if (!enemy.statuses) return;
  for (const key of Object.keys(enemy.statuses) as StatusKind[]) enemy.statuses[key] = Math.max(0, (enemy.statuses[key] ?? 0) - dt);
}
export function applySkillHit(player: Player, enemy: Enemy, params: AttackLevel): void {
  if (params.status) applyStatus(enemy, params.status, params.statusDuration ?? 0.5);
  if (enemy.kind !== 'chest' && params.steal && !enemy.stolen) { enemy.stolen = true; player.collectedBerries += params.steal; }
}
