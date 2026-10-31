import type Phaser from 'phaser';
import { SHEET_DIRECTIONS } from './directional-art.ts';

// Variante provisional del atlas propio: conservar contorno, alpha y piernas.
// Bandana roja y camiseta de rayas; transformación una vez al cargar, nunca por frame.
export function createPirateArt(scene: Phaser.Scene): void {
  for (const direction of SHEET_DIRECTIONS) for (let phase = 0; phase < 2; phase++) {
    const source = scene.textures.get(`marine-${direction}-${phase}`).getSourceImage() as HTMLCanvasElement;
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 96;
    const context = canvas.getContext('2d')!; context.drawImage(source, 0, 0);
    const image = context.getImageData(0, 0, 96, 96), data = image.data;
    for (let y = 0; y < 96; y++) for (let x = 0; x < 96; x++) {
      const at = (x + y * 96) * 4, r = data[at], g = data[at + 1], b = data[at + 2];
      if (!data[at + 3] || Math.min(r, g, b) < 105 || Math.max(r, g, b) - Math.min(r, g, b) > 72) continue;
      if (y < 30) { data[at] = Math.min(220, r); data[at + 1] = Math.round(g * 0.35); data[at + 2] = Math.round(b * 0.4); }
      else if (y < 62 && Math.floor(y / 5) % 2) { data[at] = Math.round(r * 0.55); data[at + 1] = Math.round(g * 0.38); data[at + 2] = Math.round(b * 0.62); }
    }
    context.putImageData(image, 0, 0); scene.textures.addCanvas(`buggy-pirate-${direction}-${phase}`, canvas);
  }
}
