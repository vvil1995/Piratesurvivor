import { BalloonRig } from './balloon-rig.ts';
import { BUFF_LOOK } from '../../ui/buff-info.ts';
import { BossRenderer } from './boss-renderer.ts';
import { MORGAN_ARENA } from '../world/arena.ts';
import { LOOT } from '../../content/loot.ts';
import Phaser from 'phaser';
import { WalkRig } from './walk-rig.ts';
import { drawElasticStrike, drawAxe, drawWeaponSweep } from './elastic-effects.ts';
import { ActorAnimation, movementDirection } from './actor-animation.ts';
import { ACTOR_ART } from '../../content/actor-art.ts';
import { createPackedDirectionalArt } from './directional-art.ts';
import { ABILITIES } from '../../content/attacks.ts';
import { activeMovements } from '../systems/loadout.ts';
import { combined } from '../systems/buffs.ts';
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
  private navigationSignal!: Phaser.GameObjects.Image;
  private bossRenderer!: BossRenderer;
  private bridge: BattleBridge;
  private captain!: Phaser.GameObjects.Image;
  private balloonRig!: BalloonRig;
  private captainRig!: WalkRig;
  private enemyRigs: WalkRig[] = [];
  private captainShadow!: Phaser.GameObjects.Image;
  private enemies: Phaser.GameObjects.Image[] = [];
  private shadows: Phaser.GameObjects.Image[] = [];
  private chestSprites: Phaser.GameObjects.Image[] = [];
  private crystals: Phaser.GameObjects.Image[] = [];
  private effects!: Phaser.GameObjects.Graphics;
  private fists: Phaser.GameObjects.Image[] = [];
  private captainAnimation = new ActorAnimation();
  private enemyAnimations = Array.from({ length: SHELLS_TOWN.enemyCap }, () => new ActorAnimation());
  private dust: { sprite: Phaser.GameObjects.Image; x: number; y: number; life: number }[] = [];
  private dustIndex = 0;
  private accumulator = 0;
  private previousRun?: Run;
  private worldRenderer!: WorldRenderer;
  private actorLoads = new Map<string, Promise<void>>();
  private previewWorld = new ProceduralWorld(4190);
  constructor(bridge: BattleBridge) { super('battle'); this.bridge = bridge; }
  get diagnostics() { return { legSwing: this.captainRig?.swing ?? 0, footsteps: this.dust.filter(p => p.sprite.visible).length, actorScaleY: this.captain?.scaleY ?? 0.65, actorAngle: this.captain?.angle ?? 0, actorTexture: this.captain?.texture.key ?? '', actorDirection: this.captainAnimation.direction, actorFrame: this.captainAnimation.frame, inflating: this.balloonRig?.visible ?? false, renderedChunks: this.worldRenderer?.activeChunks ?? 0, textureSlots: this.worldRenderer?.allocatedChunks ?? 0 }; }
  async ensureActorArt(visual: string): Promise<void> {
    if (this.textures.exists(`${visual}-s-0`)) return;
    const known = this.actorLoads.get(visual); if (known) return known;
    const load = ACTOR_ART[visual]; if (!load) throw new Error('Atlas no disponible');
    const promise = (async () => {
      const { default: url } = await load();
      const image = new Image(); image.src = url; await image.decode();
      const key = `source-${visual}`; this.textures.addImage(key, image);
      createPackedDirectionalArt(this, key, visual); this.textures.remove(key);
    })();
    this.actorLoads.set(visual, promise);
    try { await promise; } catch (error) { this.actorLoads.delete(visual); throw error; }
  }
  preload(): void {
    this.load.image('source-atlas', atlasUrl);
    this.load.image('luffy-directions-source', luffyDirectionsUrl);
    this.load.image('marine-directions-source', marineDirectionsUrl);
  }
  create(): void {
    createTextures(this);
    this.worldRenderer = new WorldRenderer(this);
    for (let i = 0; i < 18; i++) this.chestSprites.push(this.add.image(0, 0, 'small-chest').setOrigin(0.5, 0.8).setVisible(false));
    for (let i = 0; i < 12; i++) this.dust.push({ sprite: this.add.image(0, 0, 'foot-dust').setDepth(-999).setVisible(false), x: 0, y: 0, life: 0 });
    for (let i = 0; i < SHELLS_TOWN.pickupCap; i++) this.crystals.push(this.add.image(0, 0, 'xp').setVisible(false).setDepth(2));
    for (let i = 0; i < SHELLS_TOWN.enemyCap; i++) {
      this.shadows.push(this.add.image(0, 0, 'shadow').setVisible(false).setDepth(-1000));
      this.enemies.push(this.add.image(0, 0, 'marine').setOrigin(0.5, 0.96).setScale(0.6).setVisible(false));
      this.enemyRigs.push(new WalkRig(this, 'marine'));
    }
    this.captainShadow = this.add.image(256, 256, 'shadow').setDepth(-1000).setScale(1.2);
    this.captain = this.add.image(256, 256, 'straw-hat').setOrigin(0.5, 0.96).setScale(0.65).setDepth(1000);
    this.captainRig = new WalkRig(this, 'straw-hat'); this.balloonRig = new BalloonRig(this);
    this.bossRenderer = new BossRenderer(this);
    this.navigationSignal = this.add.image(0, 0, 'navigation-chart').setVisible(false).setScale(1.3).setDepth(5000);
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
    if (run !== this.previousRun) { this.accumulator = 0; this.previousRun = run; for (const p of this.dust) p.life = 0; }
    const camera = this.cameras.main;
    if (run?.zone === 'morgan-arena') camera.setZoom(Math.max(0.3, Math.min(1.4, camera.width / (MORGAN_ARENA.width + 48), (camera.height - 120) / (MORGAN_ARENA.height + 32))));
    else this.resize();
    const player = run?.player;
    let worldX = player?.x ?? 256, worldY = player?.y ?? 256;
    const worldView = { width: camera.width / camera.zoom, height: camera.height / camera.zoom, centerX: worldX, centerY: worldY };
    if (run) {
      run.setView(worldView);
      if (run.status === 'playing' || run.status === 'voyage') {
        this.accumulator = Math.min(this.accumulator + delta / 1000, 0.1);
        const axis = this.bridge.axis();
        while (this.accumulator >= 1 / 60 && (run.status === 'playing' || run.status === 'voyage')) { run.update(1 / 60, axis); this.accumulator -= 1 / 60; }
      } else this.accumulator = 0;
    }
    // Dibujar todas las entidades y la cámara tras el mismo paso de simulación.
    worldX = player?.x ?? 256; worldY = player?.y ?? 256;
    worldView.centerX = worldX; worldView.centerY = worldY;
    // Posiciones lógicas globales; solo el dibujo usa origen local por chunk.
    const origin = { x: Math.floor(worldX / CHUNK_SIZE) * CHUNK_SIZE, y: Math.floor(worldY / CHUNK_SIZE) * CHUNK_SIZE };
    if (run?.zone === 'morgan-arena') camera.centerOn(MORGAN_ARENA.width / 2 - origin.x, MORGAN_ARENA.height / 2 - origin.y);
    else camera.centerOn(worldX - origin.x, worldY - origin.y);
    if (run?.zone === 'morgan-arena') { worldView.centerX = MORGAN_ARENA.width / 2; worldView.centerY = MORGAN_ARENA.height / 2; }
    this.worldRenderer.update(run?.world ?? this.previewWorld, worldView, origin);
    const animate = run?.status === 'playing' && !this.bridge.reducedMotion();
    this.captainAnimation.update(player ? `${run!.id}/${player.id}` : 'preview', worldX, worldY, !!animate, delta / 1000);
    const pose = this.captainAnimation;
    // En reposo mirar al blanco del golpe. Al caminar manda la dirección de movimiento.
    const aimedStrike = run?.strikes.find(s => s.ownerId === player?.id && s.targetId !== undefined);
    if (!pose.frame && aimedStrike) pose.direction = movementDirection(Math.cos(aimedStrike.angle), Math.sin(aimedStrike.angle));
    const phase = pose.frame ? (pose.frame - 1) % 2 : 0;
    this.captain.setVisible(true).setTexture(`${run?.character.visual ?? 'straw-hat'}-${pose.direction}-${phase}`).setFlipX(false)
      .setScale(0.65 * (1 + pose.weight / 2) , 0.65 * (1 - pose.weight)).setAngle(pose.lean);
    this.captain.setPosition(worldX - origin.x, worldY - origin.y).setDepth(worldY - origin.y + 1000);
    this.captainShadow.setPosition(worldX - origin.x, worldY - origin.y + 2).setScale(1.2 + pose.weight);
    if (animate && pose.footfall) {
      const dust = this.dust[this.dustIndex++ % this.dust.length];
      dust.x = worldX; dust.y = worldY + 1; dust.life = 0.22;
    }
    for (const dust of this.dust) {
      if (run?.status === 'playing') dust.life = Math.max(0, dust.life - delta / 1000);
      dust.sprite.setVisible(!!animate && dust.life > 0).setPosition(dust.x - origin.x, dust.y - origin.y)
        .setAlpha(dust.life / 0.22 * 0.7);
    }
    this.captain.setAlpha(player && player.hurtTimer > 0 && Math.floor(player.hurtTimer * 18) % 2 === 0 ? 0.5 : 1);
    this.captainRig.update(this.captain, pose, 0.65);
    const balloon = player?.attacks.find(a => a.activeFor > 0 && ABILITIES[a.id].levels[a.level - 1].invulnerable);
    this.balloonRig.update(this.captain, `${run?.character.visual ?? 'straw-hat'}-s-0`, balloon?.activeFor ?? 0, balloon ? ABILITIES[balloon.id].levels[balloon.level - 1].duration ?? 1 : 1, balloon ? ABILITIES[balloon.id].levels[balloon.level - 1].inflate ?? 1.6 : 1);
    if (balloon) this.captainRig.hide();
    for (let i = 0; i < this.enemies.length; i++) {
      const e = run?.enemies.items[i], sprite = this.enemies[i], shadow = this.shadows[i];
      const visible = !!e?.active && Math.abs(e.x - worldX) < camera.width / camera.zoom / 2 + 160 && Math.abs(e.y - worldY) < camera.height / camera.zoom / 2 + 160;
      sprite.setVisible(visible); shadow.setVisible(visible);
      if (!visible || !e) { this.enemyRigs[i].hide(); continue; }
      const animation = this.enemyAnimations[i];
      animation.update(`${run!.id}/${e.id}`, e.x, e.y, !!animate && !(e.launchTime && e.launchTime > 0), delta / 1000);
      sprite.setTexture(`${e.visual ?? 'marine'}-${animation.direction}-${animation.frame ? (animation.frame - 1) % 2 : 0}`).setFlipX(false).setScale(0.6 * (1 + animation.weight / 2), 0.6 * (1 - animation.weight)).setAngle(animation.lean);
      const lift = (e.launchTime ?? 0) > 0 ? Math.sin(Math.PI * (1 - e.launchTime! / 0.3)) * 16 : 0;
      sprite.setPosition(e.x - origin.x, e.y - origin.y - lift).setDepth(e.y - origin.y + 1000);
      sprite.setTint(e.flash > 0 ? 0xffb689 : (e.statuses?.root ?? 0) > 0 ? 0x9cc9eb : (e.statuses?.confuse ?? 0) > 0 ? 0xc2a5dd : (e.statuses?.stun ?? 0) > 0 ? 0xf3e3a8 : e.ranged ? 0xb6d9f2 : 0xffffff); shadow.setPosition(e.x - origin.x, e.y - origin.y + 2);
      this.enemyRigs[i].update(sprite, animation, 0.6);
    }
    for (let i = 0; i < this.chestSprites.length; i++) {
      const chest = run?.zone === 'shells-town' ? run.chests.active[i] : undefined, sprite = this.chestSprites[i];
      sprite.setVisible(!!chest?.active);
      if (chest?.active) sprite.setPosition(chest.x - origin.x, chest.y - origin.y).setScale(chest.large ? 1.35 : 1).setTint(chest.large ? 0xffdc8a : 0xffffff).setDepth(chest.y - origin.y + 1000);
    }
    for (let i = 0; i < this.crystals.length; i++) {
      const pickup = run?.pickups.items[i], sprite = this.crystals[i];
      sprite.setVisible(!!pickup?.active);
      if (pickup?.active) {
        const kind = pickup.kind ?? 'xp', factor = kind === 'xp' && pickup.value >= 20 ? 1.3 : 1;
        sprite.setTexture(kind === 'food' ? 'food' : kind === 'berry' ? 'coin' : kind === 'fruit' ? 'devil-fruit' : kind === 'item' ? 'item-' + pickup.itemId : 'xp').setPosition(pickup.x - origin.x, pickup.y - origin.y).setDisplaySize((kind === 'xp' ? 14 : 18) * factor, 18 * factor);
      }
    }
    this.effects.clear();
    this.bossRenderer.update(run?.encounter, origin);
    const signal = run?.zone === 'shells-town' ? run.route.signal : undefined;
    this.navigationSignal.setVisible(!!signal);
    if (signal) {
      const bob = this.bridge.reducedMotion() ? 0 : Math.sin((run?.time ?? 0) * 4) * 3;
      this.navigationSignal.setPosition(signal.x - origin.x, signal.y - origin.y - 12 + bob);
      this.effects.lineStyle(2, 0xf5d784, 0.85); this.effects.strokeCircle(signal.x - origin.x, signal.y - origin.y, 24);
    }
    if (run) {
      for (const chest of run.zone === 'shells-town' ? run.chests.active : []) if (chest.active && chest.large && ((chest.openProgress ?? 0) > 0 || Math.hypot(chest.x - worldX, chest.y - worldY) < 110)) {
        const x = chest.x - origin.x, y = chest.y - origin.y - 48;
        this.effects.fillStyle(0x14252e, 0.9); this.effects.fillCircle(x, y, 16);
        this.effects.lineStyle(3, 0x64757a); this.effects.strokeCircle(x, y, 14);
        this.effects.lineStyle(3, 0xf4d075); this.effects.beginPath();
        this.effects.arc(x, y, 14, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (chest.openProgress ?? 0) / LOOT.largeOpenSeconds, false); this.effects.strokePath();
        this.effects.lineStyle(2, 0xf4d075); this.effects.strokeRoundedRect(x - 4, y - 7, 8, 9, 4);
        this.effects.fillStyle(0xf4d075); this.effects.fillRect(x - 6, y - 2, 12, 10);
        this.effects.fillStyle(0x14252e); this.effects.fillRect(x - 1, y + 1, 2, 4);
      }
      for (const area of run.areas.items) if (area.active) {
        const x = area.x - origin.x, y = area.y - origin.y;
        if (area.visual === 'bomu-explosion') {
          const alpha = Math.max(0, area.life / 0.3), radius = area.radius * (area.triggered ? Math.min(1, 0.4 + (0.3 - area.life) * 5) : 0.2);
          this.effects.fillStyle(0xe28a48, alpha * 0.35); this.effects.fillCircle(x, y, radius);
          this.effects.lineStyle(3, 0xffd89b, alpha);
          for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; this.effects.lineBetween(x + Math.cos(a) * radius * 0.4, y + Math.sin(a) * radius * 0.4, x + Math.cos(a) * radius, y + Math.sin(a) * radius); }
          continue;
        }
        if (area.visual === 'rubber-axe') { drawAxe(this.effects, x, y, area.delay, area.life, area.radius); continue; }
        this.effects.fillStyle(area.kind === 'smoke' ? 0xa2adba : area.kind === 'decoy' ? 0xc3936c : area.triggered ? 0x8ae0ce : 0xedbd67, area.triggered ? area.life * 0.6 : 0.12);
        this.effects.fillCircle(x, y, area.radius); this.effects.lineStyle(2, area.triggered ? 0xd1fff0 : 0xedbd67, 0.8); this.effects.strokeCircle(x, y, area.radius);
        if (area.kind === 'decoy') {
          this.effects.lineStyle(4, 0xc59b6c, 0.95); this.effects.lineBetween(x, y - 22, x, y + 6); this.effects.lineBetween(x - 12, y - 12, x + 12, y - 12);
          this.effects.fillStyle(0xd9bd8c, 0.95); this.effects.fillCircle(x, y - 27, 6);
        }
        if (area.triggered) {
          this.effects.lineStyle(5, 0xf3ce81, area.life / 0.3); this.effects.lineBetween(x, y - 70, x, y);
          if (area.shockRadius) this.effects.strokeCircle(x, y, area.shockRadius * (1 - area.life / 0.4));
        }
      }
      for (const bullet of run.projectiles.items) if (bullet.active) {
        const x = bullet.x - origin.x, y = bullet.y - origin.y - 18;
        const ammo = bullet.abilityId ? ABILITIES[bullet.abilityId].levels[(bullet.level ?? 1) - 1] : undefined;
        const color = bullet.hostile ? 0xffa0a0 : bullet.reflected ? 0xf9dc79 : ammo?.status === 'confuse' ? 0xadb6c7 : ammo?.splash ? 0xf1ad68 : ammo?.status ? 0xb0d991 : 0xc3e7ef;
        this.effects.lineStyle(2, color, 0.8); this.effects.lineBetween(x, y, x - bullet.vx * 0.035, y - bullet.vy * 0.035);
        this.effects.fillStyle(color); this.effects.fillCircle(x, y, bullet.radius);
      }
      if (player) for (const state of player.attacks) {
        const ability = ABILITIES[state.id], x = player.x - origin.x, y = player.y - origin.y - 22;
        if (ability.behavior === 'guard' && state.activeFor > 0 && !ability.levels[state.level - 1].invulnerable) {
          this.effects.fillStyle(0x92dce1, 0.08);
          this.effects.lineStyle(state.level === 6 ? 3 : 2, state.level === 6 ? 0xf3d477 : 0x92dce1, 0.85); if (ability.visual === 'slash') { for (const offset of [-9, 0, 9]) this.effects.lineBetween(x - 24, y - 18 + offset, x + 24, y + 18 + offset); } else { for (const side of [-1, 1]) { this.effects.beginPath(); this.effects.arc(x, y + 3, 28, side < 0 ? Math.PI * 0.65 : -Math.PI * 0.35, side < 0 ? Math.PI * 1.35 : Math.PI * 0.35); this.effects.strokePath(); } }
        }
        if (ability.buff && (combined(player, state.id) && activeMovements(player).includes(state.id) || state.activeFor > 0)) {
          const color = BUFF_LOOK[ability.buff.stat].tint;
          for (const side of [-1, 1]) { const ax = x + side * 23, ay = y - 8 - (run.time % 0.8) * 10; this.effects.lineStyle(3, color, 0.8); this.effects.lineBetween(ax - 4, ay + 4, ax, ay); this.effects.lineBetween(ax, ay, ax + 4, ay + 4); this.effects.lineBetween(ax, ay, ax, ay + 10); }
        }
      }
    }
    for (const fist of this.fists) fist.setVisible(false);
    if (run) for (const [index, strike] of run.strikes.entries()) {
      const alpha = Math.min(1, strike.life / 0.08);
      const x = strike.x - origin.x, y = strike.y - origin.y;
      const color = strike.evolved ? 0xf8d76c : strike.behavior === 'sweep' ? 0x9bd8d5 : 0xf1d1ab;
      const owner = run.players.get(strike.ownerId), attached = strike.visual?.startsWith('rubber-') && strike.visual !== 'rubber-kick' && owner;
      if (drawElasticStrike(this.effects, strike, attached ? owner.x - origin.x : x, attached ? owner.y - origin.y : y, attached ? { direction: owner.id === player?.id ? pose.direction : movementDirection(Math.cos(owner.facing), Math.sin(owner.facing)), targetX: x + Math.cos(strike.angle) * strike.reach, targetY: y - 26 + Math.sin(strike.angle) * strike.reach } : undefined)) continue;
      if (drawWeaponSweep(this.effects, strike, x, y)) continue;
      if (strike.behavior === 'guard') {
        this.effects.lineStyle(3, 0x92c8ed, alpha); for (const side of [-1, 1]) { this.effects.lineBetween(x + side * 24, y - 36, x + side * 24, y - 12); this.effects.lineBetween(x + side * 24, y - 36, x + side * 16, y - 36); } continue;
      }
      if (strike.behavior === 'sweep') {
        this.effects.lineStyle(strike.evolved ? 9 : 6, color, alpha * 0.8);
        this.effects.beginPath(); this.effects.arc(x, y - 18, strike.reach, strike.angle - strike.arc, strike.angle + strike.arc); this.effects.strokePath();
        this.effects.lineStyle(2, 0xffffff, alpha * 0.65);
        this.effects.beginPath(); this.effects.arc(x, y - 18, strike.reach - 6, strike.angle - strike.arc, strike.angle + strike.arc); this.effects.strokePath();
        continue;
      }
      if (strike.behavior === 'cone' || strike.behavior === 'burst') {
        this.effects.lineStyle(4, color, alpha * 0.7);
        this.effects.beginPath(); this.effects.moveTo(x, y - 20);
        this.effects.arc(x, y - 20, strike.reach, strike.angle - strike.arc, strike.angle + strike.arc);
        this.effects.closePath(); this.effects.strokePath();
        if (strike.splash) this.effects.strokeCircle(strike.impact.x - origin.x, strike.impact.y - origin.y - 20, strike.splash * (1 - strike.life / 0.22));
      }
      const distance = Math.max(30, strike.reach), endX = x + Math.cos(strike.angle) * distance, endY = y + Math.sin(strike.angle) * distance;
      if (strike.visual === 'slash') {
        this.effects.lineStyle(strike.evolved ? 5 : 3, 0xd5f1ed, alpha);
        for (const offset of [-5, 0, 5]) this.effects.lineBetween(x, y - 19 + offset, endX, endY - 19 + offset);
        continue;
      }
      if (strike.visual === 'staff') { this.effects.lineStyle(5, 0xc19b69, alpha); this.effects.lineBetween(x, y - 19, endX, endY - 19); this.effects.fillStyle(0xe8cca1, alpha); this.effects.fillCircle(endX, endY - 19, 5); continue; }
      if (strike.visual === 'kick') { this.effects.lineStyle(3, 0xe1e4c4, alpha); this.effects.lineBetween(x, y - 19, endX, endY - 19); this.fists[index].setTexture('boot').setDisplaySize(26, 26).setTint(color).setVisible(true).setPosition(endX, endY - 19).setAlpha(alpha).setRotation(strike.angle); continue; }
      this.effects.lineStyle(9, 0x7c503b, alpha); this.effects.lineBetween(x, y - 19, endX, endY - 19);
      this.effects.lineStyle(5, 0xefc69a, alpha); this.effects.lineBetween(x, y - 21, endX, endY - 21);
      this.fists[index].setTexture('fist').setDisplaySize(strike.evolved ? 36 : 27, strike.evolved ? 36 : 27).setTint(color).setVisible(true).setPosition(endX, endY - 21).setAlpha(alpha).setRotation(strike.angle + Math.PI / 4);
      this.effects.lineStyle(2, 0xf6e5bc, alpha); this.effects.strokeCircle(endX, endY - 20, 19 - strike.life * 40);
    }
    this.bridge.tick();
  }
}
