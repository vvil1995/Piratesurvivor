import Phaser from 'phaser';
import { ActorAnimation } from './actor-animation.ts';
import { SHELLS_TOWN } from '../../content/worlds/shells-town.ts';
import { ProceduralWorld } from '../world/world.ts';
import { CHUNK_SIZE } from '../world/generator.ts';
import { WorldRenderer } from './world-renderer.ts';
import type { Run } from '../core/run.ts';
import type { Vector } from '../core/types.ts';
import { createTextures } from './textures.ts';
import atlasUrl from '../../assets/pixel-atlas-v2.png';
import luffyDirectionsUrl from '../../assets/actors/luffy-atlas.png';
import marineDirectionsUrl from '../../assets/actors/marine-atlas.png';

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
  private captainAnimation = new ActorAnimation();
  private enemyAnimations = Array.from({ length: SHELLS_TOWN.enemyCap }, () => new ActorAnimation());
  private accumulator = 0;
  private previousRun?: Run;
  private worldRenderer!: WorldRenderer;
  private previewWorld = new ProceduralWorld(4190);
  constructor(bridge: BattleBridge) { super('battle'); this.bridge = bridge; }
  get diagnostics() { return { actorTexture: this.captain?.texture.key ?? '', actorDirection: this.captainAnimation.direction, actorFrame: this.captainAnimation.frame, renderedChunks: this.worldRenderer?.activeChunks ?? 0, textureSlots: this.worldRenderer?.allocatedChunks ?? 0 }; }
  preload(): void {
    this.load.image('source-atlas', atlasUrl);
    this.load.image('luffy-directions-source', luffyDirectionsUrl);
    this.load.image('marine-directions-source', marineDirectionsUrl);
  }
  create(): void {
    createTextures(this);
    this.worldRenderer = new WorldRenderer(this);
    for (let i = 0; i < SHELLS_TOWN.pickupCap; i++) this.crystals.push(this.add.image(0, 0, 'xp').setVisible(false).setDepth(2));
    for (let i = 0; i < SHELLS_TOWN.enemyCap; i++) {
      this.shadows.push(this.add.image(0, 0, 'shadow').setVisible(false).setDepth(-1000));
      this.enemies.push(this.add.image(0, 0, 'marine').setOrigin(0.5, 0.96).setScale(0.6).setVisible(false));
    }
    this.captainShadow = this.add.image(256, 256, 'shadow').setDepth(-1000).setScale(1.2);
    this.captain = this.add.image(256, 256, 'straw-hat').setOrigin(0.5, 0.96).setScale(0.65).setDepth(1000);
    this.effects = this.add.graphics().setDepth(4000);
    for (let i = 0; i < 12; i++) this.fists.push(this.add.image(0, 0, 'fist').setDisplaySize(27, 27).setDepth(4001).setVisible(false));
    this.resize();
    this.scale.on('resize', this.resize, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.resize, this));
    this.bridge.ready();
  }
  private resize(): void {
    this.cameras.main.setZoom(Math.max(0.6, Math.min(1.6, Math.min(this.scale.width, this.scale.height) / 520), Math.max(this.scale.width, this.scale.height) / 1800));
  }
  update(_time: number, delta: number): void {
    const run = this.bridge.run();
    if (run !== this.previousRun) { this.accumulator = 0; this.previousRun = run; }
    const camera = this.cameras.main;
    const player = run?.player;
    const worldX = player?.x ?? 256, worldY = player?.y ?? 256;
    // Posiciones lógicas globales; solo el dibujo usa origen local por chunk.
    const origin = { x: Math.floor(worldX / CHUNK_SIZE) * CHUNK_SIZE, y: Math.floor(worldY / CHUNK_SIZE) * CHUNK_SIZE };
    camera.centerOn(worldX - origin.x, worldY - origin.y);
    const worldView = { width: camera.width / camera.zoom, height: camera.height / camera.zoom, centerX: worldX, centerY: worldY };
    if (run) {
      run.setView(worldView);
      if (run.status === 'playing') {
        this.accumulator = Math.min(this.accumulator + delta / 1000, 0.1);
        const axis = this.bridge.axis();
        while (this.accumulator >= 1 / 60 && run.status === 'playing') { run.update(1 / 60, axis); this.accumulator -= 1 / 60; }
      } else this.accumulator = 0;
    }
    this.worldRenderer.update(run?.world ?? this.previewWorld, worldView, origin);
    const animate = run?.status === 'playing' && !this.bridge.reducedMotion();
    this.captainAnimation.update(player ? `${run!.id}/${player.id}` : 'preview', worldX, worldY, !!animate, delta / 1000);
    const pose = this.captainAnimation;
    const phase = pose.frame ? (pose.frame - 1) % 2 : 0;
    this.captain.setTexture(`straw-hat-${pose.direction}-${phase}`).setFlipX(false);
    this.captain.setPosition(worldX - origin.x, worldY - origin.y).setDepth(worldY - origin.y + 1000);
    this.captainShadow.setPosition(worldX - origin.x, worldY - origin.y + 2);
    this.captain.setAlpha(player && player.hurtTimer > 0 && Math.floor(player.hurtTimer * 18) % 2 === 0 ? 0.5 : 1);
    for (let i = 0; i < this.enemies.length; i++) {
      const e = run?.enemies.items[i], sprite = this.enemies[i], shadow = this.shadows[i];
      const visible = !!e?.active && Math.abs(e.x - worldX) < camera.width / camera.zoom / 2 + 160 && Math.abs(e.y - worldY) < camera.height / camera.zoom / 2 + 160;
      sprite.setVisible(visible); shadow.setVisible(visible);
      if (!visible || !e) continue;
      const animation = this.enemyAnimations[i];
      animation.update(`${run!.id}/${e.id}`, e.x, e.y, !!animate, delta / 1000);
      sprite.setTexture(`marine-${animation.direction}-${animation.frame ? (animation.frame - 1) % 2 : 0}`).setFlipX(false);
      sprite.setPosition(e.x - origin.x, e.y - origin.y).setDepth(e.y - origin.y + 1000);
      sprite.setTint(e.flash > 0 ? 0xffb689 : 0xffffff); shadow.setPosition(e.x - origin.x, e.y - origin.y + 2);
    }
    for (let i = 0; i < this.crystals.length; i++) {
      const pickup = run?.pickups.items[i], sprite = this.crystals[i];
      sprite.setVisible(!!pickup?.active);
      if (pickup?.active) sprite.setPosition(pickup.x - origin.x, pickup.y - origin.y).setScale(pickup.value >= 20 ? 1.3 : 1);
    }
    this.effects.clear();
    for (const fist of this.fists) fist.setVisible(false);
    if (run) for (const [index, strike] of run.strikes.entries()) {
      const alpha = Math.min(1, strike.life / 0.08);
      const x = strike.x - origin.x, y = strike.y - origin.y;
      const distance = Math.max(30, strike.reach), endX = x + Math.cos(strike.angle) * distance, endY = y + Math.sin(strike.angle) * distance;
      this.effects.lineStyle(9, 0x7c503b, alpha); this.effects.lineBetween(x, y - 19, endX, endY - 19);
      this.effects.lineStyle(5, 0xefc69a, alpha); this.effects.lineBetween(x, y - 21, endX, endY - 21);
      this.fists[index].setVisible(true).setPosition(endX, endY - 21).setAlpha(alpha).setRotation(strike.angle + Math.PI / 4);
      this.effects.lineStyle(2, 0xf6e5bc, alpha); this.effects.strokeCircle(endX, endY - 20, 19 - strike.life * 40);
    }
    this.bridge.tick();
  }
}
