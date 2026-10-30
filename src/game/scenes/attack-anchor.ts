import type { Direction } from './actor-animation.ts';
// Coordenadas de hombros/manos en el actor normalizado de96px a escala0,65.
// Separa el origen visual de la geometría de impacto del motor.
export function armSocket(direction: Direction, hand: -1 | 1): { x: number; y: number } {
  const side = direction.includes('e') ? 1 : direction.includes('w') ? -1 : 0;
  const back = direction.includes('n');
  return { x: side ? side * (hand === side ? 12 : 4) : hand * 11, y: back ? -34 : -30 };
}
