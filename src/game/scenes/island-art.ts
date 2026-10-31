import syrup_house from '../../assets/worlds/syrup-house.png';
import syrup_mansion from '../../assets/worlds/syrup-mansion.png';
import syrup_cart from '../../assets/worlds/syrup-cart.png';
import syrup_cliff from '../../assets/worlds/syrup-cliff.png';
import blackcat_pirate from '../../assets/motion/blackcat-pirate.png';
import blackcat_claw from '../../assets/motion/blackcat-claw.png';
import blackcat_hypnotist from '../../assets/motion/blackcat-hypnotist.png';
import kuro from '../../assets/motion/kuro.png';
import buggyFlag from '../../assets/bosses/buggy-flag.png';
import buggyGround from '../../assets/bosses/buggy-ground.png';
import buggyMotion from '../../assets/bosses/buggy-motion.png';
import buggyHead from '../../assets/bosses/buggy-head.png';
import buggyLeft from '../../assets/bosses/buggy-hand-left.png';
import buggyRight from '../../assets/bosses/buggy-hand-right.png';
import buggyKnife from '../../assets/bosses/buggy-knife.png';
import buggyBomb from '../../assets/bosses/buggy-bomb.png';
import morganMotion from '../../assets/motion/morgan.png';
import navalground from '../../assets/arena/ground.png';
import navalgate from '../../assets/arena/gate.png';
import navaltower from '../../assets/arena/tower.png';
import navalcannon from '../../assets/arena/cannon.png';
import navalflag from '../../assets/arena/flag.png';
import navalcrates from '../../assets/arena/crates.png';
import navalwall from '../../assets/arena/wall.png';
import ship from '../../assets/worlds/naval-ship.png';
import groundstone from '../../assets/worlds/ground-stone.png';
import groundearth from '../../assets/worlds/ground-earth.png';
import groundgrass from '../../assets/worlds/ground-grass.png';
import groundwater from '../../assets/worlds/ground-water.png';
import lamp from '../../assets/worlds/coastal-lamp.png';
import crates from '../../assets/worlds/coastal-crates.png';
import wall from '../../assets/worlds/coastal-wall.png';
import fence from '../../assets/worlds/coastal-fence.png';
import { registerArt } from '../../ui/pixel-art.ts';
import shellsBase from '../../assets/worlds/shells-base.png';
import shellsHouse from '../../assets/worlds/shells-house.png';
import coastalTree from '../../assets/worlds/coastal-tree.png';
import coastalPalm from '../../assets/worlds/coastal-palm.png';
import stoneQuay from '../../assets/worlds/stone-quay.png';
import woodenDock from '../../assets/worlds/wooden-dock.png';
import food from '../../assets/worlds/food.png';
import pistolArt from '../../assets/abilities/elastic-punch.png';
import gatlingArt from '../../assets/abilities/gatling.png';
import bazookaArt from '../../assets/abilities/bazooka.png';
import whipArt from '../../assets/abilities/whip.png';
import balloonArt from '../../assets/abilities/balloon.png';
import axeArt from '../../assets/abilities/axe.png';
import buggy from '../../assets/bosses/buggy.png';
import knives from '../../assets/bosses/buggy-knives.png';
import type Phaser from 'phaser';
import morgan from '../../assets/bosses/morgan.png';
import axe from '../../assets/bosses/morgan-axe.png';
import marineSword from '../../assets/motion/marine-sword.png';
import marineRifle from '../../assets/motion/marine-rifle.png';
import marineVeteran from '../../assets/motion/marine-veteran.png';
import pirate from '../../assets/motion/buggy-pirate.png';
import gunner from '../../assets/motion/buggy-gunner.png';
import bruiser from '../../assets/motion/buggy-bruiser.png';
import house from '../../assets/worlds/orange-house-0.png';

import tent from '../../assets/worlds/orange-tent.png';
import stall from '../../assets/worlds/orange-stall.png';
import tree from '../../assets/worlds/orange-tree.png';
import ruin from '../../assets/worlds/orange-ruin.png';
import flags from '../../assets/worlds/orange-flags.png';
import compass from '../../assets/worlds/navigation-chart.png';
import { createPackedDirectionalArt } from './directional-art.ts';

const marineActors = { 'marine-sword': marineSword, 'marine-rifle': marineRifle, 'marine-veteran': marineVeteran };
const actors = { 'blackcat-pirate':blackcat_pirate,'blackcat-claw':blackcat_claw,'blackcat-hypnotist':blackcat_hypnotist,kuro, 'buggy-pirate': pirate, 'buggy-gunner': gunner, 'buggy-bruiser': bruiser };
const props = { 'syrup-house':syrup_house,'syrup-mansion':syrup_mansion,'syrup-cart':syrup_cart,'syrup-cliff':syrup_cliff, 'buggy-flag':buggyFlag, 'buggy-ground': buggyGround, 'buggy-motion-sheet': buggyMotion, 'buggy-head':buggyHead, 'buggy-hand-left':buggyLeft, 'buggy-hand-right':buggyRight, 'buggy-knife':buggyKnife, 'buggy-bomb':buggyBomb, 'morgan-motion-sheet': morganMotion, 'naval-ground': navalground, 'naval-gate': navalgate, 'naval-tower': navaltower, 'naval-cannon': navalcannon, 'naval-flag': navalflag, 'naval-crates': navalcrates, 'naval-wall': navalwall, 'naval-ship': ship, 'ground-stone': groundstone, 'ground-earth': groundearth, 'ground-grass': groundgrass, 'ground-water': groundwater, 'coastal-lamp': lamp, 'coastal-crates': crates, 'coastal-wall': wall, 'coastal-fence': fence, 'shells-base': shellsBase, 'shells-house': shellsHouse, 'coastal-tree': coastalTree, 'coastal-palm': coastalPalm, 'stone-quay': stoneQuay, 'wooden-dock': woodenDock, food,
  'ability-elastic-punch': pistolArt, 'ability-gatling': gatlingArt, 'ability-bazooka': bazookaArt, 'ability-whip': whipArt, 'ability-balloon': balloonArt, 'ability-axe': axeArt, buggy, 'buggy-knives': knives, morgan, 'morgan-axe': axe, 'orange-house-0': house, 'orange-house-1': shellsHouse,
  'orange-tent': tent, 'orange-stall': stall, 'orange-tree': tree, 'orange-ruin': ruin,
  'orange-flags': flags, 'navigation-chart': compass };
export function preloadIslandArt(scene: Phaser.Scene): void {
  for (const [key, url] of Object.entries(props)) scene.load.image(`island-source-${key}`, url);
  for (const [key, url] of Object.entries({ ...actors, ...marineActors })) scene.load.image(`island-source-${key}`, url);
}
// Normalización única. Las fuentes GPU se liberan tras crear texturas independientes.
export function createIslandArt(scene: Phaser.Scene): void {
  for (const key of Object.keys(props)) {
    const source = scene.textures.get(`island-source-${key}`).getSourceImage() as HTMLImageElement;
    const canvas = document.createElement('canvas'); canvas.width = source.width; canvas.height = source.height;
    canvas.getContext('2d')!.drawImage(source, 0, 0);
    if (scene.textures.exists(key)) scene.textures.remove(key);
    scene.textures.addCanvas(key, canvas); if (key.startsWith('ability-') || key==='buggy-head') registerArt(key, canvas); scene.textures.remove(`island-source-${key}`);
  }
  const buggySheet = scene.textures.get('buggy-motion-sheet').getSourceImage() as HTMLCanvasElement;
  for(let i=0;i<12;i++){const c=document.createElement('canvas');c.width=c.height=128;c.getContext('2d')!.drawImage(buggySheet,i%4*128,Math.floor(i/4)*128,128,128,0,0,128,128);scene.textures.addCanvas(`buggy-pose-${i}`,c);}
  scene.textures.remove('buggy-motion-sheet');
  const sheet = scene.textures.get('morgan-motion-sheet').getSourceImage() as HTMLCanvasElement;
  for (let i=0;i<16;i++) {const c=document.createElement('canvas');c.width=c.height=128;c.getContext('2d')!.drawImage(sheet,i%4*128,Math.floor(i/4)*128,128,128,0,0,128,128);scene.textures.addCanvas(`morgan-pose-${i}`,c);}
  scene.textures.remove('morgan-motion-sheet');
  for (const key of Object.keys(marineActors)) {
    createPackedDirectionalArt(scene, `island-source-${key}`, key, 8, 128); scene.textures.remove(`island-source-${key}`);
  }
  for (const key of Object.keys(actors)) {
    for (const direction of ['s', 'se', 'e', 'ne', 'n', 'nw', 'w', 'sw']) for (let phase = 0; phase < 5; phase++) {
      if (scene.textures.exists(`${key}-${direction}-${phase}`)) scene.textures.remove(`${key}-${direction}-${phase}`);
    }
    createPackedDirectionalArt(scene, `island-source-${key}`, key, 5, 128); scene.textures.remove(`island-source-${key}`);
  }
}
