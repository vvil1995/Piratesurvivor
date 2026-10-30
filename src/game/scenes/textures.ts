import Phaser from 'phaser';
import { createPackedDirectionalArt } from './directional-art.ts';
import { rasterizeArt } from '../../ui/pixel-art.ts';

// Recursos propios: atlas existente para actores y geometría pixelada para Shells Town.
export function createTextures(scene: Phaser.Scene): void {
  const art = rasterizeArt(scene.textures.get('source-atlas').getSourceImage() as HTMLImageElement);
  for (const [name, canvas] of art) scene.textures.addCanvas(name, canvas);
  createPackedDirectionalArt(scene, 'luffy-directions-source', 'straw-hat');
  createPackedDirectionalArt(scene, 'marine-directions-source', 'marine');
  // Las texturas normalizadas ya son independientes: liberar hojas grandes de GPU.
  for (const key of ['source-atlas', 'luffy-directions-source', 'marine-directions-source']) scene.textures.remove(key);
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.fillStyle(0x142a33, 0.25); g.fillEllipse(16, 7, 27, 12); g.generateTexture('shadow', 32, 14); g.clear();
  g.fillStyle(0x326b7c); g.fillPoints([{ x: 7, y: 0 }, { x: 14, y: 8 }, { x: 7, y: 17 }, { x: 0, y: 8 }], true);
  g.fillStyle(0x9ee1db); g.fillPoints([{ x: 7, y: 2 }, { x: 12, y: 8 }, { x: 7, y: 14 }, { x: 2, y: 8 }], true);
  g.fillStyle(0xdcf1dc); g.fillRect(6, 4, 2, 5); g.generateTexture('xp', 14, 18); g.clear();
  for (let variant = 0; variant < 3; variant++) {
    const roof = [0xa3523e, 0x3f677b, 0x786c56][variant];
    g.fillStyle(0x354a47, 0.2); g.fillRect(5, 150, 122, 10);
    g.fillStyle(0x6a7467); g.fillRect(3, 44, 122, 111);
    g.fillStyle(0xd8d4b9); g.fillRect(7, 49, 114, 101);
    g.fillStyle(0xb6baa0); g.fillRect(8, 105, 112, 6); g.fillRect(8, 144, 112, 7);
    g.fillStyle(0x8a846b); g.fillRect(51, 111, 28, 40);
    g.fillStyle(0x5a675f); g.fillRect(54, 114, 22, 37);
    g.fillStyle(0xd4b776); g.fillRect(69, 132, 3, 3);
    for (const x of [19, 86]) {
      g.fillStyle(0x657b78); g.fillRect(x - 3, 65, 27, 30);
      g.fillStyle(0x395c69); g.fillRect(x, 68, 21, 23);
      g.fillStyle(0x81b3b6); g.fillRect(x + 2, 70, 8, 10);
      g.fillStyle(0xe6ddbc); g.fillRect(x + 9, 68, 3, 23); g.fillRect(x, 78, 21, 3);
      g.fillRect(x - 3, 93, 27, 4);
    }
    g.fillStyle(0x424e47); g.fillRect(0, 44, 128, 8);
    g.fillStyle(roof); g.fillPoints([{ x: 0, y: 43 }, { x: 19, y: 10 }, { x: 108, y: 10 }, { x: 128, y: 43 }], true);
    g.lineStyle(2, 0x252e30, 0.3);
    for (let y = 18; y < 44; y += 8) { const inset = Math.floor((43 - y) * 0.58); g.lineBetween(inset, y, 127 - inset, y); }
    g.fillStyle(0xd6cba5, 0.4); g.fillRect(19, 10, 89, 3);
    g.generateTexture(`house-${variant}`, 128, 160); g.clear();
  }
  g.fillStyle(0x203f32, 0.22); g.fillEllipse(48, 103, 63, 16);
  g.fillStyle(0x4c4630); g.fillRect(40, 63, 16, 39); g.fillStyle(0x8e7551); g.fillRect(43, 65, 6, 36);
  g.fillStyle(0x355944); g.fillCircle(30, 47, 24); g.fillCircle(65, 43, 26); g.fillCircle(47, 26, 25); g.fillCircle(48, 59, 28);
  g.fillStyle(0x4f7952); g.fillCircle(28, 39, 21); g.fillCircle(63, 36, 21); g.fillCircle(45, 21, 22); g.fillCircle(50, 52, 23);
  g.fillStyle(0x749660); g.fillCircle(35, 23, 13); g.fillCircle(56, 17, 11); g.fillCircle(65, 43, 10);
  g.fillStyle(0x88a36b); g.fillRect(31, 18, 8, 3); g.fillRect(50, 12, 9, 3); g.fillRect(62, 37, 8, 3);
  g.generateTexture('tree', 96, 112); g.clear();
  g.fillStyle(0x364c46, 0.25); g.fillEllipse(30, 42, 59, 12);
  g.fillStyle(0x6d7a70); g.fillPoints([{ x: 3, y: 34 }, { x: 12, y: 13 }, { x: 34, y: 6 }, { x: 53, y: 20 }, { x: 59, y: 40 }, { x: 28, y: 46 }], true);
  g.fillStyle(0x9ca78d); g.fillPoints([{ x: 12, y: 13 }, { x: 34, y: 6 }, { x: 36, y: 28 }, { x: 19, y: 32 }], true);
  g.fillStyle(0xc0c6aa); g.fillRect(20, 13, 10, 3); g.generateTexture('rock', 64, 48); g.clear();
  g.fillStyle(0x65766a); g.fillRect(0, 6, 64, 58); g.fillStyle(0xa7b49c); g.fillRect(0, 0, 64, 8);
  g.lineStyle(2, 0x465e54, 0.5);
  for (let y = 12; y < 64; y += 16) { g.lineBetween(0, y, 64, y); const x = y % 32 ? 16 : 32; g.lineBetween(x, y, x, y + 16); }
  g.generateTexture('wall', 64, 64); g.destroy();
}
