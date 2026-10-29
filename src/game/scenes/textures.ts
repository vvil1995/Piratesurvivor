import Phaser from 'phaser';

// Dibujos geométricos originales. Sustituibles por un atlas sin tocar la simulación.
export function createTextures(scene: Phaser.Scene): void {
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

  // Luffy: 32 × 40, paleta propia, sin sprites oficiales.
  g.fillStyle(0x453a32); g.fillRect(8, 32, 7, 7); g.fillRect(19, 32, 7, 7);
  g.fillStyle(0x253c4b); g.fillRect(8, 25, 18, 9); g.fillRect(15, 31, 4, 4);
  g.fillStyle(0xe6b485); g.fillRect(7, 15, 20, 13); g.fillRect(5, 22, 4, 9); g.fillRect(26, 22, 4, 9);
  g.fillStyle(0xc75d41); g.fillRect(8, 20, 7, 9); g.fillRect(20, 20, 6, 9);
  g.fillStyle(0x232f33); g.fillRect(9, 10, 17, 7);
  g.fillStyle(0xf0c398); g.fillRect(11, 13, 13, 9);
  g.fillStyle(0x30373a); g.fillRect(13, 16, 2, 2); g.fillRect(21, 16, 2, 2);
  g.fillStyle(0xd6ae61); g.fillRect(8, 2, 19, 9);
  g.fillStyle(0xb34d38); g.fillRect(8, 8, 19, 4);
  g.fillStyle(0xf0cb7c); g.fillRect(2, 11, 30, 5);
  g.fillStyle(0xedcf8a); g.fillRect(11, 3, 13, 2);
  g.generateTexture('straw-hat', 34, 40); g.clear();

  g.fillStyle(0x233c50); g.fillRect(8, 29, 6, 9); g.fillRect(20, 29, 6, 9);
  g.fillStyle(0x3988b1); g.fillRect(7, 23, 20, 10);
  g.fillStyle(0xd7e5df); g.fillRect(7, 16, 20, 12); g.fillRect(3, 18, 5, 10); g.fillRect(26, 18, 5, 10);
  g.fillStyle(0xd8b391); g.fillRect(11, 8, 13, 12); g.fillRect(3, 27, 5, 4); g.fillRect(26, 27, 5, 4);
  g.fillStyle(0x245270); g.fillRect(15, 18, 5, 12); g.fillRect(13, 13, 2, 2); g.fillRect(21, 13, 2, 2);
  g.fillStyle(0xe6eeea); g.fillRect(8, 3, 19, 8); g.fillRect(5, 9, 25, 3);
  g.fillStyle(0x3b7997); g.fillRect(13, 4, 9, 3);
  g.generateTexture('marine', 34, 40); g.clear();

  g.fillStyle(0x326b7c); g.fillPoints([{ x: 7, y: 0 }, { x: 14, y: 8 }, { x: 7, y: 17 }, { x: 0, y: 8 }], true);
  g.fillStyle(0x9ee1db); g.fillPoints([{ x: 7, y: 2 }, { x: 12, y: 8 }, { x: 7, y: 14 }, { x: 2, y: 8 }], true);
  g.fillStyle(0xdcf1dc); g.fillRect(6, 4, 2, 5); g.generateTexture('xp', 14, 18); g.clear();

  g.fillStyle(0xa0bec4, 0.75); g.fillPoints([{ x: 0, y: 26 }, { x: 12, y: 8 }, { x: 33, y: 0 }, { x: 56, y: 10 }, { x: 66, y: 35 }, { x: 38, y: 45 }, { x: 8, y: 40 }], true);
  g.fillStyle(0xd3e5df, 0.7); g.fillPoints([{ x: 12, y: 8 }, { x: 33, y: 0 }, { x: 39, y: 25 }, { x: 24, y: 31 }], true);
  g.lineStyle(2, 0x6b9aa9, 0.7); g.lineBetween(39, 25, 56, 10); g.lineBetween(39, 25, 38, 45);
  g.generateTexture('ice', 68, 48); g.destroy();
}
