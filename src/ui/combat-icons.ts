// Miniassets originales dibujados a24px, sin imágenes o fuentes de terceros.
export type CombatIcon = 'swords' | 'staff' | 'slingshot' | 'boost-attack' | 'boost-defense' | 'boost-speed' | 'boost-cadence';
export function combatIcons(): Map<CombatIcon, HTMLCanvasElement> {
  const result = new Map<CombatIcon, HTMLCanvasElement>();
  for (const name of ['swords', 'staff', 'slingshot'] as const) {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 24;
    const g = canvas.getContext('2d')!;
    const line = (color: string, width: number, points: number[]) => { g.strokeStyle = color; g.lineWidth = width; g.beginPath(); g.moveTo(points[0], points[1]); for (let i = 2; i < points.length; i += 2) g.lineTo(points[i], points[i + 1]); g.stroke(); };
    if (name === 'swords') {
      for (const mirror of [false, true]) {
        g.save(); if (mirror) { g.translate(24, 0); g.scale(-1, 1); }
        line('#262832', 5, [5, 20, 19, 4]); line('#b7d7dc', 3, [8, 16, 19, 4]); line('#edf8e5', 1, [9, 15, 19, 4]);
        line('#d8b456', 3, [5, 13, 11, 19]); line('#675057', 3, [5, 20, 8, 17]); g.restore();
      }
    } else if (name === 'staff') {
      line('#302825', 6, [4, 20, 20, 4]); line('#a66d3f', 4, [4, 20, 20, 4]); line('#e2ba76', 1, [4, 19, 19, 4]);
      for (const [x, y] of [[5, 19], [18, 6]]) line('#f0d991', 3, [x - 1, y - 1, x + 1, y + 1]);
    } else {
      line('#322a29', 6, [12, 21, 12, 12, 5, 5]); line('#322a29', 6, [12, 12, 19, 5]);
      line('#b7844c', 3, [12, 21, 12, 12, 5, 5]); line('#b7844c', 3, [12, 12, 19, 5]);
      line('#e1c06e', 1, [5, 5, 12, 8, 19, 5]); g.fillStyle = '#596067'; g.fillRect(10, 6, 4, 4);
    }
    result.set(name, canvas);
  }
  for (const [name, color] of [['boost-attack', '#f0aa73'], ['boost-defense', '#92c8ed'], ['boost-speed', '#83dfc8'], ['boost-cadence', '#c0a1e8']] as const) {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 24;
    const g = canvas.getContext('2d')!;
    g.fillStyle = '#172b32'; g.fillRect(1, 1, 22, 22); g.fillStyle = color;
    for (const dx of [0, 8]) { g.fillRect(5 + dx, 10, 3, 10); g.beginPath(); g.moveTo(2 + dx, 11); g.lineTo(6 + dx, 4); g.lineTo(11 + dx, 11); g.closePath(); g.fill(); }
    g.fillStyle = '#f4edd5'; g.fillRect(5, 11, 1, 5); g.fillRect(13, 11, 1, 5);
    result.set(name, canvas);
  }
  return result;
}
