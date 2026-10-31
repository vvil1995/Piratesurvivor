import { createPirateArt } from './pirate-art.ts';
import Phaser from 'phaser';
import { createPackedDirectionalArt } from './directional-art.ts';
import { itemCanvases } from '../../ui/item-art.ts';
import { registerArt } from '../../ui/pixel-art.ts';
import { rasterizeArt } from '../../ui/pixel-art.ts';

// Recursos propios: atlas existente para actores y geometría pixelada para Shells Town.
export function createTextures(scene: Phaser.Scene): void {
  const art = rasterizeArt(scene.textures.get('source-atlas').getSourceImage() as HTMLImageElement);
  for (const [name, canvas] of art) scene.textures.addCanvas(name, canvas);
  for (const [name, canvas] of itemCanvases()) { scene.textures.addCanvas(name, canvas); registerArt(name, canvas); }
  createPackedDirectionalArt(scene, 'luffy-directions-source', 'straw-hat');
  createPackedDirectionalArt(scene, 'marine-directions-source', 'marine');
  createPirateArt(scene);
  // Las texturas normalizadas ya son independientes: liberar hojas grandes de GPU.
  for (const key of ['source-atlas', 'luffy-directions-source', 'marine-directions-source']) scene.textures.remove(key);
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.fillStyle(0x241e20); g.fillRect(0, 5, 32, 23);
  g.fillStyle(0x865230); g.fillRect(2, 7, 28, 19);
  g.fillStyle(0xb77c42); g.fillRect(2, 7, 28, 7);
  g.fillStyle(0x5d3828); g.fillRect(2, 16, 28, 2); g.fillRect(2, 24, 28, 2);
  g.fillStyle(0xd8b861); g.fillRect(6, 7, 3, 19); g.fillRect(23, 7, 3, 19); g.fillRect(13, 13, 7, 7);
  g.fillStyle(0x493724); g.fillRect(16, 16, 2, 3);
  g.generateTexture('small-chest', 32, 32); g.clear();
  // Barril original, distinto del cofre grande dorado.
  g.fillStyle(0x2e2421); g.fillRoundedRect(4, 1, 24, 32, 7); g.fillStyle(0x8d5a35); g.fillRoundedRect(6, 3, 20, 28, 6);
  g.fillStyle(0xc59052); g.fillRect(10, 5, 4, 24); g.fillStyle(0xb27b45); g.fillRect(17, 4, 4, 25);
  g.fillStyle(0x493529); g.fillRect(15, 5, 2, 25); g.fillStyle(0x48555b); g.fillRect(5, 9, 22, 4); g.fillRect(5, 23, 22, 4);
  g.fillStyle(0xb2aaa0); g.fillRect(7, 9, 17, 1); g.fillRect(7, 23, 17, 1); g.generateTexture('barrel', 32, 36); g.clear();
  g.fillStyle(0x274e67, 0.5); g.fillEllipse(26, 32, 52, 12);
  g.fillStyle(0x4e342b); g.fillPoints([{x:3,y:22},{x:48,y:22},{x:39,y:35},{x:14,y:35}],true);
  g.fillStyle(0xb8834b); g.fillRect(7, 23, 37, 3); g.fillStyle(0x724a32); g.fillRect(13, 29, 26, 4);
  g.fillStyle(0x493c32); g.fillRect(24, 1, 3, 24); g.fillStyle(0xece1bf); g.fillTriangle(28, 2, 28, 21, 44, 21);
  g.fillStyle(0xc2a364); g.fillRect(26, 2, 2, 20); g.generateTexture('departure-boat', 52, 40); g.clear();
  // Carta náutica original: pergamino, ruta punteada y destino naval.
  g.fillStyle(0x5c4534); g.fillRect(1, 2, 30, 25); g.fillStyle(0xe5cb8d); g.fillRect(3, 3, 26, 22);
  g.fillStyle(0xf8e1a5); g.fillRect(3, 3, 26, 3); g.fillStyle(0x77a7a1); g.fillRect(6, 9, 8, 5); g.fillRect(18, 17, 8, 5);
  g.fillStyle(0xb45d49); for (let i = 0; i < 4; i++) g.fillRect(10 + i * 3, 19 - i * 3, 2, 2);
  g.fillStyle(0x42545c); g.fillRect(21, 6, 3, 7); g.fillRect(18, 9, 9, 2); g.generateTexture('navigation-chart', 32, 30); g.clear();
  // Buggy provisional original: sombrero naranja, pelo azul, nariz roja y camiseta a rayas.
  g.fillStyle(0x242637); g.fillRect(17, 55, 12, 19); g.fillRect(35, 55, 12, 19); g.fillRect(13, 71, 18, 6); g.fillRect(34, 71, 18, 6);
  g.fillStyle(0x426f8c); g.fillRect(18, 56, 9, 14); g.fillRect(37, 56, 9, 14);
  g.fillStyle(0xab3e43); g.fillRoundedRect(10, 24, 44, 34, 7); g.fillStyle(0xf1d6a5); g.fillRect(19, 28, 26, 28);
  g.fillStyle(0x97699a); for (let y = 29; y < 53; y += 8) g.fillRect(19, y, 26, 4);
  g.fillStyle(0xe4af73); g.fillCircle(11, 43, 5); g.fillCircle(54, 43, 5);
  g.fillStyle(0x276084); g.fillCircle(20, 16, 10); g.fillCircle(44, 16, 10); g.fillStyle(0xf0cc9c); g.fillEllipse(32, 15, 24, 25);
  g.fillStyle(0xece9d0); g.fillRect(23, 11, 18, 11); g.fillStyle(0x273749); g.fillRect(25, 11, 3, 3); g.fillRect(36, 11, 3, 3);
  g.fillStyle(0xb43d48); g.fillCircle(32, 16, 4); g.fillRect(27, 22, 11, 2);
  g.fillStyle(0x8a4a36); g.fillRoundedRect(8, 1, 48, 8, 4); g.fillStyle(0xe79d4a); g.fillRect(15, 0, 34, 6); g.fillStyle(0xf2d791); g.fillRect(17, 4, 30, 2);
  g.generateTexture('buggy', 64, 80); g.clear();
  g.fillStyle(0xd7ae7c); g.fillCircle(17, 26, 8); g.fillStyle(0x784a35); g.fillRect(12, 29, 11, 7);
  for (const x of [5, 16, 27]) { g.fillStyle(0x314956); g.fillRect(x - 1, 7, 6, 18); g.fillStyle(0xd6e9dd); g.fillTriangle(x, 22, x + 4, 22, x + 2, 0); }
  g.generateTexture('buggy-knives', 36, 42); g.clear();
  // Pixel art provisional original de Morgan: abrigo, mandíbula metálica y brazo-destral.
  g.fillStyle(0x18222f); g.fillRect(16, 53, 13, 17); g.fillRect(33, 53, 13, 17);
  g.fillStyle(0x38455e); g.fillRect(18, 54, 7, 13); g.fillRect(35, 54, 7, 13);
  g.fillStyle(0x111b28); g.fillRect(13, 67, 16, 6); g.fillRect(33, 67, 17, 6);
  g.fillStyle(0x697780); g.fillRect(14, 72, 14, 2); g.fillRect(34, 72, 15, 2);
  g.fillStyle(0x30394c); g.fillRect(11, 23, 42, 35);
  g.fillStyle(0xe3decb); g.fillRect(9, 24, 12, 33); g.fillRect(43, 24, 12, 33); g.fillRect(12, 21, 40, 5);
  g.fillStyle(0xaaa998); g.fillRect(10, 29, 4, 27); g.fillRect(48, 29, 5, 27);
  g.fillStyle(0xf5edd9); g.fillRect(14, 25, 5, 29); g.fillRect(44, 25, 4, 29);
  g.fillStyle(0x687ba4); g.fillRect(22, 27, 20, 25); g.fillStyle(0x93a0bb); g.fillRect(24, 29, 7, 19);
  g.fillStyle(0xcfa35d); g.fillRect(9, 23, 13, 5); g.fillRect(42, 23, 13, 5); g.fillRect(21, 50, 22, 5);
  g.fillStyle(0xedd095); for (let y = 30; y < 48; y += 6) { g.fillRect(31, y, 2, 2); g.fillRect(36, y, 2, 2); }
  g.fillStyle(0xa66e53); g.fillRect(23, 5, 20, 18); g.fillStyle(0xe4b58a); g.fillRect(25, 6, 15, 12);
  g.fillStyle(0xf0ca9b); g.fillRect(26, 7, 7, 6); g.fillStyle(0xc1a263); g.fillRect(21, 2, 24, 6);
  g.fillStyle(0xe6d69d); g.fillRect(23, 1, 20, 4); g.fillStyle(0x283040); g.fillRect(26, 10, 5, 2); g.fillRect(36, 10, 4, 2);
  g.fillStyle(0x566774); g.fillRect(22, 16, 22, 7); g.fillStyle(0xc0cbd0); g.fillRect(24, 17, 18, 3);
  g.fillStyle(0xf0e9cd); g.fillRect(25, 18, 3, 1); g.fillRect(37, 18, 3, 1);
  g.generateTexture('morgan', 64, 80); g.clear();
  g.fillStyle(0x293c48); g.fillRect(5, 16, 8, 37); g.fillStyle(0x80959e); g.fillRect(6, 17, 5, 35);
  g.fillStyle(0xc1cdd0); g.fillRect(7, 17, 2, 31); g.fillStyle(0x455d69); g.fillRect(0, 4, 12, 23);
  g.fillStyle(0x9fbdc3); g.fillPoints([{x:9,y:7},{x:26,y:0},{x:35,y:5},{x:35,y:25},{x:25,y:32},{x:9,y:23}],true);
  g.fillStyle(0xe6eeee); g.fillRect(31, 6, 4, 18); g.fillStyle(0x617b88); g.fillRect(11, 10, 16, 12);
  g.fillStyle(0xd7d8b4); g.fillRect(4, 45, 10, 7); g.generateTexture('morgan-axe', 40, 58); g.clear();
  g.fillStyle(0x4b3328); g.fillRect(0, 0, 64, 64); g.fillStyle(0x976740); g.fillRect(3, 3, 58, 58);
  g.lineStyle(3, 0xd1a367); g.strokeRect(5, 5, 54, 54); g.lineBetween(7, 7, 57, 57); g.lineBetween(57, 7, 7, 57);
  g.generateTexture('crate', 64, 64); g.clear();
  // Muslo de ave pixelado original: carne redonda y hueso expuesto.
  g.fillStyle(0xe6d8b5); g.fillRect(12, 14, 10, 5); g.fillCircle(22, 14, 4); g.fillCircle(23, 20, 4);
  g.fillStyle(0x603128); g.fillEllipse(10, 10, 19, 19); g.fillStyle(0xac5835); g.fillEllipse(10, 9, 16, 16);
  g.fillStyle(0xd88748); g.fillEllipse(8, 7, 10, 8); g.fillStyle(0xf2bc6e); g.fillRect(5, 4, 6, 2);
  g.fillStyle(0x7c3d2b); g.fillRect(8, 13, 6, 2); g.fillStyle(0xffe6ac); g.fillRect(20, 13, 3, 2);
  g.generateTexture('food', 28, 26); g.clear();
  g.fillStyle(0x61376e); g.fillCircle(9, 11, 7); g.fillStyle(0xbe6ac1); g.fillCircle(8, 10, 6);
  g.lineStyle(1, 0xeab8d4); g.strokeCircle(8, 10, 3); g.lineBetween(8, 7, 10, 10);
  g.fillStyle(0x90b864); g.fillRect(8, 0, 2, 5); g.fillTriangle(10, 2, 17, 0, 13, 5);
  g.generateTexture('devil-fruit', 18, 18); g.clear();

  g.fillStyle(0xded1ac, 0.65); g.fillRect(1, 2, 2, 1); g.fillRect(5, 0, 1, 2); g.fillRect(7, 3, 2, 1);
  g.generateTexture('foot-dust', 10, 5); g.clear();
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
