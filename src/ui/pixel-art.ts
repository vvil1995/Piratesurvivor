// Atlas original generado para el proyecto. Recortes lógicos: el PNG fuente no se modifica.
export type IconName = 'fist' | 'heart' | 'boot' | 'armor' | 'clock' | 'magnet' | 'arm' | 'coin';
export const ICONS: IconName[] = ['fist', 'heart', 'boot', 'armor', 'clock', 'magnet', 'arm', 'coin'];
const urls = new Map<string, string>();
type Region = readonly [number, number, number, number];
const characters: Record<string, Region> = {
  'straw-hat-face': [76, 0, 150, 135],
  'straw-hat': [38, 0, 220, 348],
  'straw-hat-walk1': [347, 0, 243, 348],
  'straw-hat-walk2': [670, 0, 238, 348],
  'straw-hat-attack': [943, 0, 311, 348],
  marine: [50, 352, 196, 342],
  'marine-walk1': [347, 352, 236, 342],
  'marine-walk2': [664, 352, 237, 342],
  'marine-attack': [950, 352, 304, 342],
};
const items: Record<IconName, Region> = {
  fist: [45, 716, 235, 232], heart: [345, 720, 250, 230],
  boot: [647, 717, 270, 234], armor: [963, 713, 278, 239],
  clock: [38, 954, 251, 287], magnet: [345, 962, 260, 278],
  arm: [650, 956, 266, 284], coin: [967, 970, 269, 270],
};
export function rasterizeArt(source: CanvasImageSource): Map<string, HTMLCanvasElement> {
  const result = new Map<string, HTMLCanvasElement>();
  for (const [name, region] of Object.entries({ ...characters, ...items })) {
    const character = name in characters, size = character ? 96 : 48;
    const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d')!; ctx.imageSmoothingEnabled = false;
    const [x, y, width, height] = region;
    const scale = (size - (character ? 8 : 4)) / Math.max(width, height);
    const w = Math.round(width * scale), h = Math.round(height * scale);
    ctx.drawImage(source, x, y, width, height, Math.floor((size - w) / 2), character ? size - h - 4 : Math.floor((size - h) / 2), w, h);
    urls.set(name, canvas.toDataURL('image/png')); result.set(name, canvas);
  }
  return result;
}
export const artUrl = (name: string): string => urls.get(name) || '';
export function pixelIcon(name: IconName): HTMLImageElement {
  const image = document.createElement('img'); image.className = 'pixel-icon';
  image.src = artUrl(name); image.alt = ''; image.setAttribute('aria-hidden', 'true');
  image.width = 48; image.height = 48; image.draggable = false; return image;
}
export const upgradeIcon = (id: string): IconName => ({ power: 'fist', tempo: 'clock', heart: 'heart', feet: 'boot', reach: 'arm', magnet: 'magnet' }[id] as IconName) || 'heart';
