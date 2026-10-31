import buggy from '../../assets/bosses/buggy.png';
import knives from '../../assets/bosses/buggy-knives.png';
import type Phaser from 'phaser';
import morgan from '../../assets/bosses/morgan.png';
import axe from '../../assets/bosses/morgan-axe.png';
import pirate from '../../assets/actors/buggy-pirate-atlas.png';
import gunner from '../../assets/actors/buggy-gunner-atlas.png';
import bruiser from '../../assets/actors/buggy-bruiser-atlas.png';
import house from '../../assets/worlds/orange-house-0.png';
import occupied from '../../assets/worlds/orange-house-1.png';
import tent from '../../assets/worlds/orange-tent.png';
import stall from '../../assets/worlds/orange-stall.png';
import tree from '../../assets/worlds/orange-tree.png';
import ruin from '../../assets/worlds/orange-ruin.png';
import flags from '../../assets/worlds/orange-flags.png';
import compass from '../../assets/worlds/navigation-chart.png';
import { createPackedDirectionalArt } from './directional-art.ts';

const actors = { 'buggy-pirate': pirate, 'buggy-gunner': gunner, 'buggy-bruiser': bruiser };
const props = { buggy, 'buggy-knives': knives, morgan, 'morgan-axe': axe, 'orange-house-0': house, 'orange-house-1': occupied,
  'orange-tent': tent, 'orange-stall': stall, 'orange-tree': tree, 'orange-ruin': ruin,
  'orange-flags': flags, 'navigation-chart': compass };
export function preloadIslandArt(scene: Phaser.Scene): void {
  for (const [key, url] of Object.entries(props)) scene.load.image(`island-source-${key}`, url);
  for (const [key, url] of Object.entries(actors)) scene.load.image(`island-source-${key}`, url);
}
// Normalización única. Las fuentes GPU se liberan tras crear texturas independientes.
export function createIslandArt(scene: Phaser.Scene): void {
  for (const key of Object.keys(props)) {
    const source = scene.textures.get(`island-source-${key}`).getSourceImage() as HTMLImageElement;
    const canvas = document.createElement('canvas'); canvas.width = source.width; canvas.height = source.height;
    canvas.getContext('2d')!.drawImage(source, 0, 0);
    if (scene.textures.exists(key)) scene.textures.remove(key);
    scene.textures.addCanvas(key, canvas); scene.textures.remove(`island-source-${key}`);
  }
  for (const key of Object.keys(actors)) {
    for (const direction of ['s', 'se', 'e', 'ne', 'n', 'nw', 'w', 'sw']) for (let phase = 0; phase < 2; phase++) {
      if (scene.textures.exists(`${key}-${direction}-${phase}`)) scene.textures.remove(`${key}-${direction}-${phase}`);
    }
    createPackedDirectionalArt(scene, `island-source-${key}`, key); scene.textures.remove(`island-source-${key}`);
  }
}
