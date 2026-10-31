import { ABILITIES } from '../content/attacks.ts';
import { CHARACTERS } from '../content/catalog.ts';
// Miniilustraciones propias a48px: una composición por técnica, sin letras ni recursos remotos.
export function abilityCanvases(base: Map<string, HTMLCanvasElement>): Map<string, HTMLCanvasElement> {
  const result = new Map<string, HTMLCanvasElement>();
  for (const ability of Object.values(ABILITIES)) {
    const c = document.createElement('canvas'); c.width = c.height = 48; const g = c.getContext('2d')!; g.imageSmoothingEnabled = false;
    const rect = (color: string, x: number, y: number, w: number, h: number) => { g.fillStyle = color; g.fillRect(x, y, w, h); };
    const stroke = (color: string, width: number, points: number[]) => { g.strokeStyle = color; g.lineWidth = width; g.beginPath(); g.moveTo(points[0], points[1]); for (let i = 2; i < points.length; i += 2) g.lineTo(points[i], points[i + 1]); g.stroke(); };
    const image = (key: string, x = 5, y = 5, size = 36) => { const source = base.get(key); if (source) g.drawImage(source, x, y, size, size); };
    rect('#101e2a', 1, 1, 46, 46); rect('#263d49', 3, 3, 42, 42); rect('#182b35', 5, 5, 38, 38);
    stroke('#967953', 2, [2, 13, 2, 2, 13, 2]); stroke('#d6ba79', 2, [35, 46, 46, 46, 46, 35]);
    const character = Object.values(CHARACTERS).find(ch => ch.abilities.includes(ability.id)), index = character?.abilities.indexOf(ability.id) ?? 0;
    const accent = ability.buff ? ({ damage: '#eda175', armor: '#91bfd6', speed: '#89d6b6', cooldown: '#c0a4e0' })[ability.buff.stat] : ({ luffy: '#df7e65', zoro: '#99bca0', nami: '#e1b76a', usopp: '#a6bf79', sanji: '#b1c5e0' } as Record<string, string>)[character?.id ?? 'luffy'];
    if (ability.buff) {
      image(({ damage: 'fist', armor: 'armor', speed: 'boot', cooldown: 'clock' })[ability.buff.stat], 5, 8, 29);
      for (const x of [33, 39]) { stroke('#0e1c26', 5, [x, 31, x, 15]); stroke(accent, 3, [x - 3, 18, x, 13, x + 3, 18]); stroke(accent, 3, [x, 15, x, 31]); }
    } else if (character?.id === 'luffy') {
      if (index === 4) { g.fillStyle = '#392822'; g.beginPath(); g.ellipse(24, 25, 16, 17, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#efc28d'; g.beginPath(); g.ellipse(24, 25, 13, 14, 0, 0, Math.PI * 2); g.fill(); stroke('#ad3543', 4, [14, 15, 11, 26, 16, 36]); stroke('#ad3543', 4, [34, 15, 37, 26, 32, 36]); rect('#e6be62', 15, 7, 18, 4); rect('#c64a45', 19, 5, 10, 3); }
      else if (index === 1) { image('fist', 3, 19, 25); image('fist', 14, 5, 25); image('fist', 22, 22, 22); }
      else if (index === 2) { image('fist', 2, 12, 28); image('fist', 20, 12, 28); stroke('#f4d094', 2, [8, 38, 24, 43, 40, 38]); }
      else if (index === 3 || index === 5) { stroke('#402b28', 9, index === 3 ? [8, 14, 15, 23, 35, 25] : [24, 8, 24, 30]); stroke('#efbb83', 5, index === 3 ? [8, 14, 15, 23, 35, 25] : [24, 8, 24, 30]); rect('#4f2d28', index === 3 ? 28 : 15, index === 3 ? 23 : 30, 17, 8); rect('#dfb474', index === 3 ? 29 : 16, index === 3 ? 25 : 32, 15, 3); stroke('#f0d69e', 2, index === 3 ? [9, 34, 21, 39, 36, 35] : [9, 41, 15, 36, 24, 43, 36, 37]); }
      else { stroke('#e9b37c', 7, [8, 36, 25, 20]); image('fist', 14, 3, 31); }
    } else if (character?.id === 'sanji') {
      const shoe = (x: number, y: number, scale: number, angle: number) => {
        g.save(); g.translate(x, y); g.rotate(angle); g.scale(scale, scale);
        rect('#09141e', -7, -16, 11, 24); rect('#243b48', -5, -15, 7, 22); rect('#66808d', -4, -14, 2, 18);
        g.fillStyle = '#09141e'; g.beginPath(); g.moveTo(-7, 2); g.lineTo(3, 1); g.lineTo(7, 5); g.lineTo(16, 7); g.lineTo(18, 12); g.lineTo(-7, 12); g.closePath(); g.fill();
        rect('#36505c', 0, 5, 7, 3); rect('#4c6570', 8, 8, 6, 2); rect('#b6c4bc', -6, 12, 23, 2); rect('#182e3b', -6, 10, 22, 2);
        stroke('#829592', 1, [2, 5, 4, 8]); g.restore();
      };
      if (index === 0) { shoe(23, 25, 1, -.75); stroke(accent, 2, [9, 36, 18, 39, 37, 22]); }
      if (index === 1) { shoe(20, 18, .9, .5); stroke('#f0d4a2', 2, [9, 39, 14, 34, 23, 42, 30, 35, 40, 39]); }
      if (index === 2) { shoe(12, 15, .58, -.4); shoe(23, 24, .68, -.35); shoe(32, 33, .65, -.3); stroke(accent, 1, [5, 28, 10, 32]); stroke(accent, 1, [15, 38, 22, 41]); }
      if (index === 3) { g.strokeStyle = accent; g.lineWidth = 2; g.beginPath(); g.arc(24, 24, 18, .2, 5.7); g.stroke(); shoe(24, 23, .9, Math.PI / 2); }
      if (index === 4) { shoe(21, 26, 1.12, -.55); for (const [x, y] of [[33, 7],[40, 14],[36, 23],[26, 5]]) stroke('#f5d48d', 2, [x, y, x + 3, y - 3]); }
      if (index === 5) {
        g.fillStyle = '#4a6570'; g.beginPath(); g.ellipse(24, 34, 18, 6, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#e9d9ac'; g.beginPath(); g.ellipse(24, 32, 16, 4, 0, 0, Math.PI * 2); g.fill();
        rect('#e3d5b2', 26, 22, 12, 4); g.fillStyle = '#eee0b9'; g.beginPath(); g.arc(37, 21, 3, 0, Math.PI * 2); g.arc(38, 27, 3, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#633528'; g.beginPath(); g.ellipse(20, 21, 10, 11, -.4, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#c87940'; g.beginPath(); g.ellipse(19, 20, 8, 9, -.4, 0, Math.PI * 2); g.fill(); rect('#f0ba74', 14, 14, 8, 3);
        stroke('#c5d8cb', 1, [19, 7, 17, 4]); stroke('#c5d8cb', 1, [26, 8, 24, 4]);
      }
    } else if (character?.id === 'zoro') { g.save(); g.translate(24, 24); g.rotate(index * .16); g.translate(-24, -24); image(index === 4 ? 'armor' : 'swords', 7, 6, 34); for (let i = 0; i <= index % 3; i++) stroke(accent, 2, [7, 37 - i * 6, 23, 23 - i * 3, 40, 13 + i * 4]); g.restore(); if (index === 5) { g.strokeStyle = accent; g.lineWidth = 2; g.beginPath(); g.arc(24, 24, 17, .3, 5.8); g.stroke(); } }
    else if (character?.id === 'nami') {
      image(index === 3 ? 'coin' : index === 5 ? 'boot' : 'staff', 7, 7, 32);
      if (index === 1) { g.strokeStyle = accent; g.lineWidth = 2; g.beginPath(); g.arc(24, 24, 17, 0, Math.PI * 1.7); g.stroke(); }
      if (index === 2) { g.strokeStyle = '#dab984'; g.lineWidth = 3; g.beginPath(); g.ellipse(25, 24, 13, 9, -.5, 0, Math.PI * 2); g.stroke(); }
      if (index === 4) { rect('#b18d61', 21, 15, 6, 24); rect('#c39e6d', 9, 21, 29, 4); rect('#e6bb7b', 16, 9, 15, 6); }
    } else { // Usopp: munición, humo, pólvora, irritante, abanico o martillo.
      if (index === 5) { stroke('#704b32', 6, [13, 40, 30, 15]); rect('#332d31', 18, 7, 24, 13); rect('#ad7a4e', 20, 9, 20, 9); }
      else { image('slingshot', 5, 14, 27); const color = ['#c7d4cd', '#efb260', '#b4bfcc', '#d07c64', '#d9d8ba'][index];
        const count = index === 4 ? 3 : 1; for (let i = 0; i < count; i++) { g.fillStyle = color; g.beginPath(); g.arc(31 + i * 3, 12 + i * 8, index === 2 ? 8 : 4, 0, Math.PI * 2); g.fill(); }
        if (index === 1) for (const [x, y] of [[27, 4], [41, 9], [38, 23]]) rect('#f1d99a', x, y, 3, 4);
      }
    }
    // Marcas discretas específicas: no ocupan el centro de la ilustración.
    if (!ability.buff) for (let i = 0; i <= index; i++) rect(accent, 7 + i * 6, 43, 3, 1);
    result.set(`ability-${ability.id}`, c);
  }
  const c = document.createElement('canvas'); c.width = c.height = 48; const g = c.getContext('2d')!;
  g.fillStyle = '#162b36'; g.fillRect(2, 2, 44, 44); g.strokeStyle = '#e9c785'; g.lineWidth = 5;
  for (const [x, y] of [[18, 18], [30, 30]]) { g.beginPath(); g.ellipse(x, y, 12, 8, -.7, 0, Math.PI * 2); g.stroke(); }
  result.set('union', c); return result;
}
