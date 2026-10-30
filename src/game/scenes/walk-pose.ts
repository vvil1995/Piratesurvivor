import type { Direction } from './actor-animation.ts';
// Coordenadas locales en píxeles del atlas. Las piernas alternan apoyo/recobro.
export function legPose(direction: Direction, phase: number, sign: number, walking: boolean) {
  if (!walking) return { thigh: 0, knee: 0 };
  const stride = Math.sin(phase) * sign, recovery = Math.max(0, -stride);
  const lateral = direction.includes('e') ? 1 : direction.includes('w') ? -1 : 0;
  return { thigh: stride * (lateral ? 22 : 12), knee: recovery * (lateral ? -lateral * 32 : sign * 16) };
}
