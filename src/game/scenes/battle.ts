import Phaser from 'phaser';
import { MARINEFORD } from '../../content/catalog.ts';
import type { Run } from '../core/run.ts';
import type { Vector } from '../core/types.ts';
import { createTextures } from './textures.ts';
import atlasUrl from '../../assets/pixel-atlas-v2.png';

export interface BattleBridge {
  run: () => Run | undefined; axis: () => Vector; tick: () => void;
  ready: () => void; reducedMotion: () => boolean;
}
export class BattleScene extends Phaser.Scene {
  private bridge: BattleBridge;
  private captain!: Phaser.GameObjects.Image;
  private captainShadow!: Phaser.GameObjects.Image;
  private enemies: Phaser.GameObjects.Image[] = [];
  private shadows: Phaser.GameObjects.Image[] = [];
  private crystals: Phaser.GameObjects.Image[] = [];
  private effects!: Phaser.GameObjects.Graphics;
  private fists: Phaser.GameObjects.Image[] = [];
  private accumulator = 0;
  private previousRun?: Run;
  constructor(bridge: BattleBridge) { super('battle'); this.bridge = bridge; }
  preload(): void { this.load.image('source-atlas', atlasUrl); }
  create(): void {
    createTextures(this);
    this.add.tileSprite(0, 0, MARINEFORD.width, MARINEFORD.height, 'floor').setOrigin(0);
    this.drawEnvironment();
    for (let i = 0; i < MARINEFORD.pickupCap; i++) this.crystals.push(this.add.image(0, 0, 'xp').setVisible(false).setDepth(2));
    for (let i = 0; i < MARINEFORD.enemyCap; i++) {
      this.shadows.push(this.add.image(0, 0, 'shadow').setVisible(false).setDepth(3));
      this.enemies.push(this.add.image(0, 0, 'marine').setOrigin(0.5, 0.96).setScale(0.6).setVisible(false));
    }
    this.captainShadow = this.add.image(1200, 900, 'shadow').setDepth(3).setScale(1.2);
    this.captain = this.add.image(1200, 900, 'straw-hat').setOrigin(0.5, 0.96).setScale(0.65).setDepth(1000);
    this.effects = this.add.graphics().setDepth(4000);
    for (let i = 0; i < 12; i++) this.fists.push(this.add.image(0, 0, 'fist').setDisplaySize(27, 27).setDepth(4001).setVisible(false));
    this.cameras.main.setBounds(0, 0, MARINEFORD.width, MARINEFORD.height);
    this.resize();
    this.scale.on('resize', this.resize, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.resize, this));
    this.bridge.ready();
  }
  private resize(): void {
    this.cameras.main.setZoom(Math.max(0.6, Math.min(1.6, Math.min(this.scale.width, this.scale.height) / 520)));
  }
  private drawEnvironment(): void {
    const g = this.add.graphics();
    // Muralla y puerto abstractos: geometría propia, sin calcar el escenario original.
    g.fillStyle(0x324d5c); g.fillRect(0, 0, 2400, 125);
    g.fillStyle(0x74909a); g.fillRect(0, 100, 2400, 25);
    g.fillStyle(0xb6c7c3); g.fillRect(0, 99, 2400, 6);
    for (let x = 20; x < 2400; x += 120) {
      g.fillStyle(0x4d6978); g.fillRect(x, 0, 70, 105);
      g.fillStyle(0xa9c1c3); g.fillRect(x - 5, 82, 80, 12);
      g.fillStyle(0x213d4d); g.fillRect(x + 24, 32, 23, 36);
    }
    g.fillStyle(0x1f3e50); g.fillRect(1070, 0, 260, 102);
    g.fillStyle(0x94abb3); g.fillRect(1040, 78, 320, 24);
    g.fillStyle(0xd0dad0); g.fillRect(1040, 77, 320, 5);
    g.fillStyle(0x3e6577); g.fillRect(0, 1730, 2400, 70);
    g.fillStyle(0xaccbd0); g.fillRect(0, 1710, 2400, 20);
    for (let x = 0; x < 2400; x += 110) {
      g.fillStyle(0xc4dcd8, 0.75); g.fillRect(x, 1700 - x % 23, 85, 20 + x % 23);
      g.lineStyle(2, 0x80a6b7, 0.4); g.lineBetween(x, 1760, x + 50, 1760);
    }
    g.lineStyle(3, 0xd0d2b8, 0.12); g.strokeCircle(1200, 900, 220); g.strokeCircle(1200, 900, 230);
    g.lineStyle(2, 0x293f4b, 0.12); g.lineBetween(950, 900, 1450, 900); g.lineBetween(1200, 650, 1200, 1150);
    let seed = 18;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 32; i++) {
      const x = 80 + random() * 2240, y = 220 + random() * 1400;
      if (Math.hypot(x - 1200, y - 900) < 270) continue;
      this.add.image(x, y, 'ice').setAlpha(0.6).setScale(0.65 + random() * 0.9).setDepth(1).setFlipX(random() > 0.5);
    }
  }
  update(_time: number, delta: number): void {
    const run = this.bridge.run();
    if (run !== this.previousRun) { this.accumulator = 0; this.previousRun = run; }
    const camera = this.cameras.main;
    const player = run?.player;
    camera.centerOn(player?.x ?? 1200, player?.y ?? 900);
    if (run) {
      run.setView({ width: camera.width / camera.zoom, height: camera.height / camera.zoom,
        centerX: camera.scrollX + camera.width / 2, centerY: camera.scrollY + camera.height / 2 });
      // Phaser scrollX usa coordenadas prezoom. worldView sí representa el rectángulo real.
      const halfW = camera.width / camera.zoom / 2, halfH = camera.height / camera.zoom / 2;
      run.setView({ width: halfW * 2, height: halfH * 2,
        centerX: Phaser.Math.Clamp(player!.x, halfW, MARINEFORD.width - halfW),
        centerY: Phaser.Math.Clamp(player!.y, halfH, MARINEFORD.height - halfH) });
      if (run.status === 'playing') {
        this.accumulator = Math.min(this.accumulator + delta / 1000, 0.1);
        const axis = this.bridge.axis();
        while (this.accumulator >= 1 / 60 && run.status === 'playing') { run.update(1 / 60, axis); this.accumulator -= 1 / 60; }
      } else this.accumulator = 0;
    }
    const animate = run?.status === 'playing' && !this.bridge.reducedMotion();
    const movement = this.bridge.axis();
    const bob = animate && (movement.x || movement.y) ? Math.sin((run?.time ?? 0) * 17) * 1.5 : 0;
    const attacking = !!run?.strikes.length;
    const walk = Math.floor((run?.time ?? 0) * 8) % 2 + 1;
    this.captain.setTexture(attacking ? 'straw-hat-attack' : animate && (movement.x || movement.y) ? `straw-hat-walk${walk}` : 'straw-hat');
    this.captain.setPosition(player?.x ?? 1200, (player?.y ?? 900) + bob).setDepth((player?.y ?? 900) + 10).setFlipX(Math.cos(player?.facing ?? 0) < 0);
    this.captainShadow.setPosition(player?.x ?? 1200, (player?.y ?? 900) + 2);
    this.captain.setAlpha(player && player.hurtTimer > 0 && Math.floor(player.hurtTimer * 18) % 2 === 0 ? 0.5 : 1);
    for (let i = 0; i < this.enemies.length; i++) {
      const e = run?.enemies.items[i], sprite = this.enemies[i], shadow = this.shadows[i];
      const visible = !!e?.active && Math.abs(e.x - (player?.x ?? 1200)) < camera.width / camera.zoom / 2 + 160 && Math.abs(e.y - (player?.y ?? 900)) < camera.height / camera.zoom / 2 + 160;
      sprite.setVisible(visible); shadow.setVisible(visible);
      if (!visible || !e) continue;
      sprite.setTexture(animate ? `marine-walk${Math.floor(run!.time * 7 + e.id) % 2 + 1}` : 'marine');
      sprite.setPosition(e.x, e.y + (animate ? Math.sin((run!.time * 12) + e.id) : 0)).setDepth(e.y + 10).setFlipX((player?.x ?? 0) < e.x);
      sprite.setTint(e.flash > 0 ? 0xffb689 : 0xffffff); shadow.setPosition(e.x, e.y + 2);
    }
    for (let i = 0; i < this.crystals.length; i++) {
      const pickup = run?.pickups.items[i], sprite = this.crystals[i];
      sprite.setVisible(!!pickup?.active);
      if (pickup?.active) sprite.setPosition(pickup.x, pickup.y).setScale(pickup.value >= 20 ? 1.3 : 1);
    }
    this.effects.clear();
    for (const fist of this.fists) fist.setVisible(false);
    if (run) for (const [index, strike] of run.strikes.entries()) {
      const alpha = Math.min(1, strike.life / 0.08);
      const distance = Math.max(30, strike.reach), endX = strike.x + Math.cos(strike.angle) * distance, endY = strike.y + Math.sin(strike.angle) * distance;
      this.effects.lineStyle(9, 0x7c503b, alpha); this.effects.lineBetween(strike.x, strike.y - 19, endX, endY - 19);
      this.effects.lineStyle(5, 0xefc69a, alpha); this.effects.lineBetween(strike.x, strike.y - 21, endX, endY - 21);
      this.fists[index].setVisible(true).setPosition(endX, endY - 21).setAlpha(alpha).setRotation(strike.angle + Math.PI / 4);
      this.effects.lineStyle(2, 0xf6e5bc, alpha); this.effects.strokeCircle(endX, endY - 20, 19 - strike.life * 40);
    }
    this.bridge.tick();
  }
}
