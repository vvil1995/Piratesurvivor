import type Phaser from 'phaser';
import type { Direction } from './actor-animation.ts';

// Pixel art procedural original: se genera una vez, sin imágenes ni dependencias externas.
export function createActorTextures(scene: Phaser.Scene): void {
  const directions: Direction[] = ['s', 'se', 'e', 'ne', 'n', 'nw', 'w', 'sw'];
  for (const actor of ['straw-hat', 'marine']) for (const direction of directions) for (let frame = 0; frame <= 4; frame++) {
    const canvas = document.createElement('canvas'); canvas.width = 64; canvas.height = 96;
    const ctx = canvas.getContext('2d')!; ctx.imageSmoothingEnabled = false;
    const back = direction.includes('n'), side = direction === 'e' || direction === 'w';
    const diagonal = direction.length === 2, left = direction.includes('w');
    if (left) { ctx.translate(64, 0); ctx.scale(-1, 1); }
    const stride = frame ? [0, -3, 0, 3, 0][frame] : 0;
    const lift = frame === 2 || frame === 4 ? 1 : 0;
    ctx.translate(0, -lift);
    const ink = '#292738', skin = '#eaba83', shade = '#bd805e';
    const uniform = actor === 'marine', coat = uniform ? '#e6e9d7' : '#bd3348';
    const rect = (x: number, y: number, w: number, h: number, color: string) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };
    // Piernas: pasos opuestos, rodillas, sombras y sandalias/botas.
    for (const [x, phase] of [[22, stride], [35, -stride]]) {
      rect(x - 1, 65 + phase, 9, 22, ink); rect(x + 1, 65 + phase, 5, 18, uniform ? '#344960' : skin);
      rect(x + 1, 78 + phase, 2, 6, uniform ? '#233247' : shade);
      rect(x - 2, 85 + phase, 13, 4, ink);
      if (!uniform) rect(x, 85 + phase, 8, 1, skin);
    }
    // Brazos con balanceo, manos y contorno fino.
    for (const [x, phase] of [[15, -stride], [43, stride]]) {
      rect(x, 41 + phase, 8, 26, ink); rect(x + 1, 42 + phase, 6, 13, coat);
      rect(x + 1, 55 + phase, 6, 10, skin); rect(x + 4, 59 + phase, 2, 5, shade);
    }
    rect(21, 37, 24, 30, ink); rect(23, 39, 20, 25, coat);
    rect(23, 62, 20, 12, ink); rect(24, 64, 18, 8, uniform ? '#315779' : '#4267a4');
    rect(25, 65, 6, 2, uniform ? '#527e98' : '#6389bd');
    if (!uniform) { rect(24, 71, 7, 3, '#e5e2c5'); rect(35, 71, 7, 3, '#e5e2c5'); }
    if (!back && !uniform) { rect(28, 39, 9, 20, skin); rect(32, 46, 2, 10, shade); rect(24, 41, 2, 17, '#ec5961'); }
    if (back && uniform) { rect(27, 44, 12, 2, '#416b7c'); rect(30, 47, 6, 6, '#416b7c'); }
    rect(24, 60, 18, 3, uniform ? '#293e50' : '#e7b950');
    rect(28, 33, 10, 8, ink); rect(30, 33, 6, 7, skin);
    const offset = side ? 4 : diagonal ? 2 : 0;
    rect(22 + offset, 17, 22, 20, ink); rect(24 + offset, 19, 18, 16, back ? '#242638' : skin);
    if (!back) {
      rect(24 + offset, 19, 18, 5, '#272635'); rect(23 + offset, 22, 4, 7, '#272635');
      rect(35 + offset, 25, 5, 3, '#fff0d2'); rect(37 + offset, 25, 2, 3, ink);
      if (!side) { rect(28 + offset, 25, 3, 3, '#fff0d2'); rect(29 + offset, 25, 1, 3, ink); }
      rect(39 + offset, 29, 3, 2, shade); rect(34 + offset, 33, 5, 1, ink);
    } else { rect(25 + offset, 29, 4, 7, '#1e2231'); rect(37 + offset, 29, 3, 6, '#1e2231'); }
    // Sombrero de paja o gorra naval, reconocibles desde arriba y por detrás.
    rect(18, 15, 31, 7, ink); rect(20, 16, 27, 4, uniform ? '#f0eee0' : '#e6b65c');
    rect(24, 7, 19, 10, ink); rect(26, 8, 15, 8, uniform ? '#edf0df' : '#d9a54e');
    rect(28, 9, 10, 2, uniform ? '#ffffff' : '#f7d27c');
    rect(25, 13, 17, 3, uniform ? '#4c95a0' : '#a83240');
    if (uniform && !back) { rect(30, 9, 7, 2, '#3a7789'); rect(29, 18, 17, 2, '#315367'); }
    scene.textures.addCanvas(`${actor}-${direction}-${frame}`, canvas);
  }
}
