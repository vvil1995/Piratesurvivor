import type { Vector } from '../core/types.ts';
export type WarningShape = 'rectangle' | 'circle' | 'cone' | 'line' | 'arc';
export interface DangerZone extends Vector {
  shape: WarningShape; angle: number; length: number; width: number; radius: number; innerRadius: number; arc: number;
}
export interface BossAttack {
  id: string; name: string; phase: number; shape: WarningShape; length: number; width: number; radius: number; innerRadius: number; arc: number;
  preparation: number; finalWarning: number; impact: number; damage: number; cooldown: number; recovery: number;
  animation: string; speed?: number;
}
export interface Telegraph { zone: DangerZone; elapsed: number; attack: BossAttack }
export function warningStage(w: Telegraph): 'preparing' | 'final' | 'impact' {
  return w.elapsed >= w.attack.preparation ? 'impact' : w.elapsed >= w.attack.preparation - w.attack.finalWarning ? 'final' : 'preparing';
}
// El mismo contorno, sin margen invisible de impacto, se usa para dibujar y colisionar.
// Se evalúa la posición de los pies del objetivo al impactar, no al empezar el aviso.
export function inDanger(zone: DangerZone, point: Vector): boolean {
  const dx = point.x - zone.x, dy = point.y - zone.y;
  const x = dx * Math.cos(zone.angle) + dy * Math.sin(zone.angle), y = -dx * Math.sin(zone.angle) + dy * Math.cos(zone.angle);
  if (zone.shape === 'line' || zone.shape === 'rectangle') return x >= 0 && x <= zone.length && Math.abs(y) <= zone.width / 2;
  const distance = Math.hypot(x, y);
  if (zone.shape === 'circle') return distance <= zone.radius;
  return distance <= zone.radius && distance >= (zone.shape === 'arc' ? zone.innerRadius : 0) && Math.abs(Math.atan2(y, x)) <= zone.arc / 2;
}
export function zoneFor(attack: BossAttack, from: Vector, target: Vector): DangerZone {
  return { x: from.x, y: from.y, shape: attack.shape, angle: Math.atan2(target.y - from.y, target.x - from.x),
    length: attack.length, width: attack.width, radius: attack.radius, innerRadius: attack.innerRadius, arc: attack.arc };
}
