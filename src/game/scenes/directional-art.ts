import type Phaser from 'phaser';
import { artUrl, registerArt } from '../../ui/pixel-art.ts';
import type { Direction } from './actor-animation.ts';

export const SHEET_DIRECTIONS: readonly Direction[] = ['s', 'se', 'e', 'ne', 'n', 'nw', 'w', 'sw'];

// Recortes de atlas, no dibujos geométricos. Normalizar una sola vez mantiene
// tamaño y pies alineados sin escalar texturas por enemigo ni por frame.
export function createDirectionalArt(scene: Phaser.Scene, sourceKey: string, actor: string): void {
  const source = scene.textures.get(sourceKey).getSourceImage() as HTMLImageElement;
  const sheet = document.createElement('canvas'); sheet.width = source.width; sheet.height = source.height;
  const ctx = sheet.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(source, 0, 0);
  const pixels = ctx.getImageData(0, 0, sheet.width, sheet.height).data;
  const columns = new Uint32Array(sheet.width), rows = new Uint32Array(sheet.height);
  for (let y = 0; y < sheet.height; y++) for (let x = 0; x < sheet.width; x++) if (pixels[(x + y * sheet.width) * 4 + 3] > 32) { columns[x]++; rows[y]++; }
  const cuts = (counts: Uint32Array) => {
    const result = [0], cell = counts.length / 4;
    for (let i = 1; i < 4; i++) {
      let best = Math.round(cell * i), score = Infinity;
      for (let at = Math.floor(cell * (i - 0.12)); at <= Math.ceil(cell * (i + 0.12)); at++) {
        const value = counts[at] * 1000 + Math.abs(at - cell * i);
        if (value < score) { score = value; best = at; }
      }
      result.push(best);
    }
    result.push(counts.length); return result;
  };
  const xs = cuts(columns), ys = cuts(rows);
  const bounds: { x: number; y: number; w: number; h: number }[] = [];
  for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
    let left = xs[col + 1], right = xs[col], top = ys[row + 1], bottom = ys[row];
    for (let y = ys[row]; y < ys[row + 1]; y++) for (let x = xs[col]; x < xs[col + 1]; x++) {
      if (pixels[(x + y * sheet.width) * 4 + 3] <= 32) continue;
      left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
    if (right < left || bottom < top) throw new Error(`Celda de sprite vacía: ${actor}/${row}/${col}`);
    bounds.push({ x: left, y: top, w: right - left + 1, h: bottom - top + 1 });
  }
  const scale = 88 / Math.max(...bounds.map(b => Math.max(b.w, b.h)));
  for (let phase = 0; phase < 2; phase++) for (let i = 0; i < 8; i++) {
    // La pose SW de la generación no respeta siempre el rumbo. Usar la SE
    // reflejada conserva perspectiva y calidad sin enseñar un personaje mirando al este.
    const mirrored = SHEET_DIRECTIONS[i] === 'sw';
    const b = bounds[(mirrored ? 1 : i) + phase * 8];
    const canvas = document.createElement('canvas'); canvas.width = 96; canvas.height = 96;
    const target = canvas.getContext('2d')!; target.imageSmoothingEnabled = false;
    const w = Math.round(b.w * scale), h = Math.round(b.h * scale);
    if (mirrored) { target.translate(96, 0); target.scale(-1, 1); }
    target.drawImage(source, b.x, b.y, b.w, b.h, Math.floor((96 - w) / 2), 92 - h, w, h);
    scene.textures.addCanvas(`${actor}-${SHEET_DIRECTIONS[i]}-${phase}`, canvas);
  }
}

// Atlas listo para ejecución: 768×192, 8 columnas de 96 px y dos pasos.
// La extracción de fuentes grandes solo se utiliza al preparar/verificar recursos.
export function createPackedDirectionalArt(scene: Phaser.Scene, sourceKey: string, actor: string, poses = 2): void {
  const source = scene.textures.get(sourceKey).getSourceImage() as HTMLImageElement;
  if (source.width !== 768 || source.height !== poses * 96) throw new Error(`Dimensiones de atlas incorrectas: ${actor}`);
  for (let phase = 0; phase < poses; phase++) for (let i = 0; i < 8; i++) {
    const canvas = document.createElement('canvas'); canvas.width = 96; canvas.height = 96;
    const ctx = canvas.getContext('2d')!; ctx.imageSmoothingEnabled = false;
    ctx.drawImage(source, i * 96, phase * 96, 96, 96, 0, 0, 96, 96);
    scene.textures.addCanvas(`${actor}-${SHEET_DIRECTIONS[i]}-${phase}`, canvas);
    if (phase === 0 && i === 0) {
      registerArt(`${actor}-portrait`, canvas);
      if (!artUrl(`${actor}-face`)) {
        const face = document.createElement('canvas'); face.width = 48; face.height = 48;
        face.getContext('2d')!.drawImage(canvas, 24, 3, 48, 42, 0, 3, 48, 42); registerArt(`${actor}-face`, face);
      }
    }
  }
}
