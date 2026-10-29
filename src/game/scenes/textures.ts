import Phaser from 'phaser';
import { rasterizeArt } from '../../ui/pixel-art.ts';

// Dibujos geométricos originales. Sustituibles por un atlas sin tocar la simulación.
export function createTextures(scene: Phaser.Scene): void {
  const art = rasterizeArt(scene.textures.get('source-atlas').getSourceImage() as HTMLImageElement);
  for (const [name, canvas] of art) scene.textures.addCanvas(name, canvas);
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.fillStyle(0x607780); g.fillRect(0, 0, 128, 128);
  const shades = [0x657d85, 0x6a8087, 0x637a82, 0x6b8188];
  for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
    const x = col * 32, y = row * 32;
    g.fillStyle(shades[(row + col) % 4]); g.fillRect(x + 1, y + 1, 30, 30);
    g.lineStyle(1, 0x93a3a4, 0.18); g.lineBetween(x + 3, y + 2, x + 28, y + 2);
  }
  g.lineStyle(1, 0x334f5c, 0.3); g.lineBetween(48, 70, 56, 79); g.lineBetween(56, 79, 53, 94);
  g.generateTexture('floor', 128, 128); g.clear();

  g.fillStyle(0x142a33, 0.25); g.fillEllipse(16, 7, 27, 12); g.generateTexture('shadow', 32, 14); g.clear();

  g.fillStyle(0x326b7c); g.fillPoints([{ x: 7, y: 0 }, { x: 14, y: 8 }, { x: 7, y: 17 }, { x: 0, y: 8 }], true);
  g.fillStyle(0x9ee1db); g.fillPoints([{ x: 7, y: 2 }, { x: 12, y: 8 }, { x: 7, y: 14 }, { x: 2, y: 8 }], true);
  g.fillStyle(0xdcf1dc); g.fillRect(6, 4, 2, 5); g.generateTexture('xp', 14, 18); g.clear();

  g.fillStyle(0xa0bec4, 0.75); g.fillPoints([{ x: 0, y: 26 }, { x: 12, y: 8 }, { x: 33, y: 0 }, { x: 56, y: 10 }, { x: 66, y: 35 }, { x: 38, y: 45 }, { x: 8, y: 40 }], true);
  g.fillStyle(0xd3e5df, 0.7); g.fillPoints([{ x: 12, y: 8 }, { x: 33, y: 0 }, { x: 39, y: 25 }, { x: 24, y: 31 }], true);
  g.lineStyle(2, 0x6b9aa9, 0.7); g.lineBetween(39, 25, 56, 10); g.lineBetween(39, 25, 38, 45);
  g.generateTexture('ice', 68, 48); g.destroy();
}
