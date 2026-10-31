import type { Vector } from '../core/types.ts';
// Coordenadas globales: cambiar de chunk no introduce saltos en la cámara.
export function arenaCamera(previous: Vector, target: Vector, width: number, height: number, arena: {width:number;height:number}, dt: number): Vector {
  const blend = 1 - Math.exp(-10 * Math.max(0, Math.min(dt, .1)));
  const clamp = (value: number, size: number, view: number) => Math.max(view / 2, Math.min(size - view / 2, value));
  return { x: clamp(previous.x + (target.x - previous.x) * blend, arena.width, width), y: clamp(previous.y + (target.y - previous.y) * blend, arena.height, height) };
}
