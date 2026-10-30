import { armSocket } from './attack-anchor.ts';
import type { Direction } from './actor-animation.ts';
import type Phaser from 'phaser';
import type { Strike } from '../core/types.ts';
const TAU = Math.PI * 2;
function limb(g: Phaser.GameObjects.Graphics, x: number, y: number, ex: number, ey: number, alpha: number, width = 8): void {
  const mx = (x + ex) / 2, my = (y + ey) / 2 - 4;
  for (const [thickness, color, offset] of [[width + 4, 0x382a29, 0], [width, 0xd79861, 0], [2, 0xffdda1, -2]]) {
    g.lineStyle(thickness, color, alpha); g.beginPath(); g.moveTo(x, y + offset); g.lineTo(mx, my + offset); g.lineTo(ex, ey + offset); g.strokePath();
  }
}
function hand(g: Phaser.GameObjects.Graphics, x: number, y: number, alpha: number): void {
  g.fillStyle(0x382a29, alpha); g.fillRoundedRect(x - 11, y - 9, 23, 19, 5);
  g.fillStyle(0xf0bd80, alpha); g.fillRoundedRect(x - 9, y - 7, 19, 15, 4);
  g.lineStyle(1, 0x97603d, alpha); for (let i = -5; i <= 5; i += 5) g.lineBetween(x + i, y - 6, x + i, y - 1);
  g.fillStyle(0xffdba4, alpha); g.fillRect(x - 6, y - 6, 10, 2);
}
export function sandal(g: Phaser.GameObjects.Graphics, x: number, y: number, alpha: number, size = 1): void {
  g.fillStyle(0x302725, alpha); g.fillEllipse(x, y + 2 * size, 25 * size, 13 * size);
  g.fillStyle(0xb78048, alpha); g.fillEllipse(x, y + size, 22 * size, 9 * size);
  g.fillStyle(0xf0bd80, alpha); g.fillEllipse(x, y - size, 20 * size, 8 * size);
  g.lineStyle(2 * size, 0x8a4134, alpha); g.lineBetween(x - 6 * size, y - 4 * size, x + 2 * size, y + 2 * size); g.lineBetween(x + 2 * size, y + 2 * size, x + 6 * size, y - 4 * size);
}
// Presentación por familia visual, sin consultar nombres de personajes en el motor.
export function drawElasticStrike(g: Phaser.GameObjects.Graphics, strike: Strike, x: number, y: number, actor?: { direction: Direction; targetX: number; targetY: number }): boolean {
  if (!strike.visual?.startsWith('rubber-')) return false;
  const kick = strike.visual === 'rubber-kick', total = kick ? 0.36 : 0.24;
  const progress = Math.max(0, Math.min(1, 1 - strike.life / total)), alpha = Math.min(1, strike.life / 0.07);
  const extension = Math.min(1, progress / 0.22) * Math.min(1, (1 - progress) / 0.18);
  if (kick) {
    const angle = strike.angle - strike.arc + progress * strike.arc * 2;
    const length = Math.max(22, strike.reach * extension), ex = x + Math.cos(angle) * length, ey = y - 10 + Math.sin(angle) * length * 0.7;
    // Estelas parciales acompañan el pie, nunca un círculo completo sustituyendo la patada.
    for (let i = 1; i <= 3; i++) {
      const previous = angle - i * 0.16;
      g.lineStyle(2, 0xffefbd, alpha * (0.45 - i * 0.09));
      g.beginPath(); g.arc(x, y - 10, length * 0.86, previous - 0.24, previous); g.strokePath();
    }
    limb(g, x, y - 12, ex, ey, alpha, strike.evolved ? 11 : 8);
    g.fillStyle(0x315d9e, alpha); g.fillRect(x - 7, y - 19, 14, 9); // pantalón del arranque
    sandal(g, ex, ey, alpha, strike.evolved ? 1.25 : 1);
    return true;
  }
  const count = strike.visual === 'rubber-double' ? 2 : strike.visual === 'rubber-flurry' ? 3 : 1;
  for (let i = 0; i < count; i++) {
    const offset = (i - (count - 1) / 2), angle = strike.angle + (strike.visual === 'rubber-flurry' ? offset * 0.13 : 0);
    const side = strike.visual === 'rubber-double' ? offset * 15 : offset * 7;
    const socket = armSocket(actor?.direction ?? 's', count === 1 ? Math.cos(angle) < 0 ? -1 : 1 : i % 2 === 0 ? -1 : 1);
    const sx = x + socket.x, sy = y + socket.y;
    const length = Math.max(12, strike.reach * extension * (1 - Math.abs(offset) * 0.08));
    const ex = actor ? sx + (actor.targetX - sx - Math.sin(angle) * side) * extension : sx + Math.cos(angle) * length;
    const ey = actor ? sy + (actor.targetY - sy + Math.cos(angle) * side) * extension : sy + Math.sin(angle) * length;
    limb(g, sx, sy, ex, ey, alpha * (i === 1 || count === 1 ? 1 : 0.7), strike.evolved ? 10 : 7); hand(g, ex, ey, alpha);
    if (progress > 0.2 && progress < 0.7) {
      g.lineStyle(2, 0xffe5a0, alpha); for (let ray = 0; ray < 5; ray++) { const a = ray / 5 * TAU; g.lineBetween(ex + Math.cos(a) * 15, ey + Math.sin(a) * 15, ex + Math.cos(a) * 23, ey + Math.sin(a) * 23); }
    }
  }
  return true;
}
export function drawAxe(g: Phaser.GameObjects.Graphics, x: number, y: number, delay: number, life: number, radius: number): void {
  if (delay > 0) {
    g.lineStyle(2, 0xe5bd73, 0.35); g.strokeEllipse(x, y, radius * 2, radius); return;
  }
  const alpha = Math.max(0, life / 0.3), drop = Math.min(1, (0.3 - life) / 0.08);
  limb(g, x + 4, y - 105, x, y - 80 * (1 - drop), alpha, 12); sandal(g, x, y - 80 * (1 - drop), alpha, 1.5);
  g.lineStyle(3, 0x7b6652, alpha);
  for (let i = 0; i < 7; i++) { const a = i / 7 * TAU, r = radius * Math.min(1, (0.3 - life) * 7); g.lineBetween(x + Math.cos(a) * 12, y + Math.sin(a) * 7, x + Math.cos(a) * r, y + Math.sin(a) * r * 0.55); }
}

export function drawWeaponSweep(g: Phaser.GameObjects.Graphics, strike: Strike, x: number, y: number): boolean {
  if (strike.behavior !== 'sweep' || !['slash', 'staff', 'kick'].includes(strike.visual ?? '')) return false;
  const progress = Math.max(0, Math.min(1, 1 - strike.life / 0.18)), angle = strike.angle - strike.arc + progress * strike.arc * 2;
  const alpha = Math.min(1, strike.life / 0.06), radius = strike.reach;
  for (let i = 1; i <= 3; i++) {
    g.lineStyle(2, 0xf1eed0, alpha * (0.4 - i * 0.08)); g.beginPath(); g.arc(x, y - 19, radius * 0.85, angle - i * 0.2 - 0.35, angle - i * 0.2); g.strokePath();
  }
  if (strike.visual === 'staff') {
    const dx = Math.cos(angle) * radius * 0.65, dy = Math.sin(angle) * radius * 0.65;
    g.lineStyle(8, 0x352927, alpha); g.lineBetween(x - dx, y - 19 - dy, x + dx, y - 19 + dy);
    g.lineStyle(5, 0xc29559, alpha); g.lineBetween(x - dx, y - 19 - dy, x + dx, y - 19 + dy); return true;
  }
  const ex = x + Math.cos(angle) * radius, ey = y - 19 + Math.sin(angle) * radius;
  if (strike.visual === 'kick') {
    g.lineStyle(10, 0x252d36, alpha); g.lineBetween(x, y - 10, ex, ey);
    g.lineStyle(3, 0x6c7781, alpha); g.lineBetween(x, y - 12, ex, ey - 2);
    g.fillStyle(0x18212b, alpha); g.fillRoundedRect(ex - 13, ey - 5, 27, 13, 4);
    g.lineStyle(2, 0xb7b6a4, alpha); g.lineBetween(ex - 10, ey + 7, ex + 12, ey + 7); return true;
  }
  for (const offset of [-0.13, 0, 0.13]) {
    const a = angle + offset;
    g.lineStyle(6, 0x303740, alpha); g.lineBetween(x, y - 19, x + Math.cos(a) * radius, y - 19 + Math.sin(a) * radius);
    g.lineStyle(3, 0xe7efdf, alpha); g.lineBetween(x + Math.cos(a) * 17, y - 19 + Math.sin(a) * 17, x + Math.cos(a) * radius, y - 19 + Math.sin(a) * radius);
  }
  return true;
}
