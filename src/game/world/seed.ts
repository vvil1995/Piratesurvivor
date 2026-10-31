export function hash(seed: number, x: number, y: number): number {
  let h = Math.imul(x | 0, 0x45d9f3b) ^ Math.imul(y | 0, 0x27d4eb2d) ^ seed;
  h = Math.imul(h ^ h >>> 16, 0x85ebca6b); h = Math.imul(h ^ h >>> 13, 0xc2b2ae35);
  return (h ^ h >>> 16) >>> 0;
}
