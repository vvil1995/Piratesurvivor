import { ITEMS } from '../content/items.ts';
import { artUrl } from './pixel-art.ts';
export function itemCanvases(): Map<string, HTMLCanvasElement> {
  const result = new Map<string, HTMLCanvasElement>();
  for (const id of Object.keys(ITEMS)) {
    const c = document.createElement('canvas'); c.width = c.height = 24; const g = c.getContext('2d')!;
    const rect = (color: string, x: number, y: number, w: number, h: number) => { g.fillStyle = color; g.fillRect(x, y, w, h); };
    rect('#172a31', 1, 1, 22, 22);
    if (id === 'boots') { rect('#553c32', 6, 4, 8, 14); rect('#b47b46', 8, 5, 5, 12); rect('#734b36', 5, 16, 15, 5); rect('#e0bd83', 6, 20, 15, 2); }
    else if (id === 'whetstone') { rect('#6d818a', 4, 8, 16, 10); rect('#bad1cf', 5, 7, 13, 4); rect('#859b9e', 8, 12, 12, 5); rect('#e5e5c7', 7, 9, 8, 1); }
    else if (id === 'vest') { rect('#d9dec8', 4, 7, 16, 14); rect('#d9dec8', 5, 4, 5, 5); rect('#d9dec8', 15, 4, 4, 5); rect('#467488', 7, 9, 10, 10); rect('#e7ce86', 11, 10, 2, 8); }
    else if (id === 'medicine') { rect('#d2d6bd', 3, 7, 18, 14); rect('#929e91', 8, 3, 8, 4); rect('#dc6960', 10, 9, 4, 10); rect('#dc6960', 7, 12, 10, 4); }
    else if (id === 'watch') { rect('#d6ae56', 5, 6, 14, 15); rect('#f2e3b1', 7, 8, 10, 10); rect('#d6ae56', 10, 2, 4, 4); rect('#394f57', 11, 9, 2, 5); rect('#394f57', 12, 12, 4, 2); }
    else if (id === 'telescope') { rect('#6e5633', 3, 13, 16, 6); rect('#d1a85b', 5, 10, 13, 7); rect('#f0d08b', 8, 8, 11, 6); rect('#3c7082', 17, 6, 4, 9); rect('#91cad2', 18, 8, 2, 4); }
    else if (id === 'compass') { rect('#b18b4f', 4, 4, 16, 16); rect('#e9d79f', 6, 6, 12, 12); g.fillStyle = '#bd574f'; g.beginPath(); g.moveTo(12, 6); g.lineTo(15, 12); g.lineTo(9, 15); g.closePath(); g.fill(); rect('#3b6d7c', 10, 13, 3, 5); }
    else { rect('#ddbb68', 8, 3, 8, 3); rect('#9dd5ad', 7, 8, 10, 12); rect('#4b957b', 9, 9, 9, 10); rect('#d2b267', 5, 10, 2, 8); rect('#d2b267', 17, 10, 2, 8); rect('#ddf0c9', 8, 9, 3, 5); }
    result.set('item-' + id, c);
  }
  return result;
}
export function itemImage(id: string): HTMLImageElement {
  const image = document.createElement('img'); image.src = artUrl('item-' + id); image.alt = ''; image.className = 'pixel-icon'; image.width = image.height = 24; return image;
}
