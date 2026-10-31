import { ITEM_IMAGES } from '../../ui/item-art.ts';
import { EnemyDeaths } from './enemy-motion.ts';
import { arenaCamera } from './arena-camera.ts';
import { preloadIslandArt } from './island-art.ts';
import { BalloonRig } from './balloon-rig.ts';
import { BUFF_LOOK } from '../../ui/buff-info.ts';
import { BossRenderer } from './boss-renderer.ts';
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
  private enemyIdle=0;
  private enemyDeaths!: EnemyDeaths;
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
  private arenaCameraPosition?: Vector;
  private cameraWorld?: ProceduralWorld;
  private worldRenderer!: WorldRenderer;
  private actorLoads = new Map<string, Promise<void>>();
  private previewWorld = new ProceduralWorld(4190);
  constructor(bridge: BattleBridge) { super('battle'); this.bridge = bridge; }
  get diagnostics() { return { enemyTextures: this.enemies.filter(e=>e.visible).map(e=>e.texture.key), bossTexture: this.bossRenderer?.texture, cameraZoom: this.cameras.main.zoom, cameraX: this.arenaCameraPosition?.x, cameraY: this.arenaCameraPosition?.y, legSwing: this.captainRig?.swing ?? 0, footsteps: this.dust.filter(p => p.sprite.visible).length, actorScaleY: this.captain?.scaleY ?? 0.65, actorAngle: this.captain?.angle ?? 0, actorTexture: this.captain?.texture.key ?? '', actorDirection: this.captainAnimation.direction, actorFrame: this.captainAnimation.frame, inflating: this.balloonRig?.visible ?? false, renderedChunks: this.worldRenderer?.activeChunks ?? 0, textureSlots: this.worldRenderer?.allocatedChunks ?? 0 }; }
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
    preloadIslandArt(this);
    for(const [id,url] of Object.entries(ITEM_IMAGES))this.load.image('item-source-'+id,url);
    this.load.image('source-atlas', atlasUrl);
    this.load.image('luffy-directions-source', luffyDirectionsUrl);
    this.load.image('marine-directions-source', marineDirectionsUrl);
  }
  create(): void {
    createTextures(this);
    this.worldRenderer = new WorldRenderer(this);
    for (let i = 0; i < 18; i++) this.chestSprites.push(this.add.image(0, 0, 'barrel').setOrigin(0.5, 0.8).setVisible(false));
    for (let i = 0; i < 12; i++) this.dust.push({ sprite: this.add.image(0, 0, 'foot-dust').setDepth(-999).setVisible(false), x: 0, y: 0, life: 0 });
    for (let i = 0; i < SHELLS_TOWN.pickupCap; i++) this.crystals.push(this.add.image(0, 0, 'xp').setVisible(false).setDepth(2));
    for (let i = 0; i < SHELLS_TOWN.enemyCap; i++) {
      this.shadows.push(this.add.image(0, 0, 'shadow').setVisible(false).setDepth(-1000));
      this.enemies.push(this.add.image(0, 0, 'marine').setOrigin(0.5, 0.96).setScale(0.6).setVisible(false));
      this.enemyRigs.push(new WalkRig(this, 'marine'));
    }
    this.captainShadow = this.add.image(256, 256, 'shadow').setDepth(-1000).setScale(1.2);
    this.captain = this.add.image(256, 256, 'straw-hat').setOrigin(0.5, 0.96).setScale(0.65).setDepth(1000);
    this.enemyDeaths = new EnemyDeaths(this);
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
    this.resize();
    const player = run?.player;
    let worldX = player?.x ?? 256, worldY = player?.y ?? 256;
    const worldView = { width: camera.width / camera.zoom, height: camera.height / camera.zoom, centerX: worldX, centerY: worldY };
    if (run) {
      if (run.inArena && this.cameraWorld === run.world && this.arenaCameraPosition) { worldView.centerX = this.arenaCameraPosition.x; worldView.centerY = this.arenaCameraPosition.y; }
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
    if (run?.inArena) {
      if (this.cameraWorld !== run.world) this.arenaCameraPosition = { x: worldX, y: worldY };
      this.arenaCameraPosition = arenaCamera(this.arenaCameraPosition!, {x:worldX,y:worldY}, worldView.width, worldView.height, run.arena, delta / 1000);
      worldView.centerX = this.arenaCameraPosition.x; worldView.centerY = this.arenaCameraPosition.y;
      camera.centerOn(worldView.centerX - origin.x, worldView.centerY - origin.y);
    } else camera.centerOn(worldX - origin.x, worldY - origin.y);
    this.cameraWorld = run?.world;
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
    if (animate) this.enemyIdle += Math.min(delta/1000,.1);
    for (let i = 0; i < this.enemies.length; i++) {
      const e = run?.enemies.items[i], sprite = this.enemies[i], shadow = this.shadows[i];
      const visible = !!e?.active && Math.abs(e.x - (run?.zone === 'morgan-arena' ? worldView.centerX : worldX)) < camera.width / camera.zoom / 2 + 160 && Math.abs(e.y - (run?.zone === 'morgan-arena' ? worldView.centerY : worldY)) < camera.height / camera.zoom / 2 + 160;
      sprite.setVisible(visible); shadow.setVisible(visible);
      if (!visible || !e) { this.enemyRigs[i].hide(); continue; }
      const animation = this.enemyAnimations[i];
      animation.update(`${run!.id}/${e.id}`, e.x, e.y, !!animate && !(e.launchTime && e.launchTime > 0), delta / 1000);
      const pirate = e.visual?.startsWith('buggy-');
      const marine = e.visual?.startsWith('marine-');
      const attacking = pirate && (e.ranged ? (e.shotTimer ?? 0) > e.ranged.interval - .18 : Math.hypot(e.x-worldX,e.y-worldY)<e.radius+22);
      let frame = attacking ? 4 : animation.frame ? pirate ? animation.frame - 1 : (animation.frame - 1) % 2 : 0;
      if (marine) frame = (e.shotWindup ?? 0) > 0 ? 5 : (e.shotRecovery ?? 0) > 0 ? e.ranged && e.shotRecovery! < .18 ? 0 : 6 : !e.ranged && Math.hypot(e.x-worldX,e.y-worldY)<e.radius+45 ? 5 : animation.frame;
      const facing = marine && ((e.shotWindup ?? 0)>0 || (e.shotRecovery ?? 0)>0) ? movementDirection(e.ranged ? Math.cos(e.shotAngle ?? 0) : worldX-e.x, e.ranged ? Math.sin(e.shotAngle ?? 0) : worldY-e.y) : attacking ? movementDirection(worldX-e.x,worldY-e.y) : animation.direction;
      sprite.setOrigin(.5, pirate || marine ? 120/128 : .96).setTexture(`${e.visual ?? 'marine'}-${facing}-${frame}`).setFlipX(false).setScale(0.6 * (1 + animation.weight / 2), 0.6 * (1 - animation.weight)).setAngle(animation.lean);
      const lift = (e.launchTime ?? 0) > 0 ? Math.sin(Math.PI * (1 - e.launchTime! / 0.3)) * 16 : 0;
      sprite.setPosition(e.x - origin.x, e.y - origin.y - lift).setDepth(e.y - origin.y + 1000);
      sprite.setTint(e.flash > 0 ? 0xffb689 : (e.statuses?.root ?? 0) > 0 ? 0x9cc9eb : (e.statuses?.confuse ?? 0) > 0 ? 0xc2a5dd : (e.statuses?.stun ?? 0) > 0 ? 0xf3e3a8 : e.ranged && e.visual === 'marine' ? 0xb6d9f2 : 0xffffff); shadow.setPosition(e.x - origin.x, e.y - origin.y + 2);
      if ((pirate || marine) && !animation.frame && !attacking && !(e.shotWindup! > 0) && !(e.shotRecovery! > 0)) sprite.setScale(.6,.6*(1+Math.sin(this.enemyIdle*2+e.id)*.01));
      if ((pirate || marine) && e.flash > 0) sprite.setAngle(-9 * e.flash/.15);
      if (pirate || marine) { sprite.setCrop(); this.enemyRigs[i].hide(); }
      else this.enemyRigs[i].update(sprite, animation, 0.6);
    }
    for (let i = 0; i < this.chestSprites.length; i++) {
      const chest = run?.visibleChests[i], sprite = this.chestSprites[i];
      sprite.setVisible(!!chest?.active);
      if (chest?.active) {
        const reachable = !!player && Math.hypot(chest.x-player.x,chest.y-player.y) <= LOOT.largeOpenRadius && run!.world.segmentClear(chest.x,chest.y,player.x,player.y,2);
        // Nearby interactable loot must remain visible above overhanging scenery.
        sprite.setTexture(chest.large ? 'small-chest' : 'barrel').setCrop().setAlpha(1)
          .setPosition(chest.x-origin.x,chest.y-origin.y).setScale(chest.large ? 1.35 : 1)
          .setTint(reachable ? 0xffefb0 : chest.large ? 0xffdc8a : 0xffffff)
          .setDepth(reachable ? 8990 : chest.y-origin.y+1001);
      }
    }
    for (let i = 0; i < this.crystals.length; i++) {
      const pickup = run?.pickups.items[i], sprite = this.crystals[i];
      sprite.setVisible(!!pickup?.active);
      if (pickup?.active) {
        const kind = pickup.kind ?? 'xp', factor = kind === 'xp' && pickup.value >= 20 ? 1.3 : 1;
        sprite.setTexture(kind === 'food' ? 'food' : kind === 'berry' ? 'coin' : kind === 'fruit' ? 'devil-fruit' : kind === 'item' ? 'item-' + pickup.itemId : 'xp').setPosition(pickup.x - origin.x, pickup.y - origin.y).setDisplaySize((kind === 'xp' ? 14 : kind === 'food' ? 30 : 18) * factor, (kind === 'food' ? 27 : 18) * factor);
      }
    }
    this.effects.clear();
    for (const e of run?.enemies.items ?? []) {
      if (!e.active || !e.ranged?.preparation || !(e.shotWindup! > 0)) continue;
      const x=e.x-origin.x, y=e.y-origin.y, angle=e.shotAngle ?? 0, arc=e.ranged.spread ?? .035;
      this.effects.lineStyle(1.5, 0xffc47b, .65);
      for (const a of [angle-arc/2, angle+arc/2]) this.effects.lineBetween(x,y,x+Math.cos(a)*e.ranged.range,y+Math.sin(a)*e.ranged.range);
      this.effects.lineStyle(2, 0xff725c, .9); this.effects.strokeCircle(x,y-42,5+3*(1-e.shotWindup!/e.ranged.preparation));
    }
    this.enemyDeaths.update(run, origin, delta/1000);
    this.bossRenderer.update(run?.encounter, origin, run?.arena, delta/1000, !!animate);
    const signal = run && ['shells-town', 'orange-town'].includes(run.zone) ? run.navigationRoute.signal : undefined;
    this.navigationSignal.setVisible(!!signal);
    if (signal) {
      const bob = this.bridge.reducedMotion() ? 0 : Math.sin((run?.time ?? 0) * 4) * 3;
      this.navigationSignal.setPosition(signal.x - origin.x, signal.y - origin.y - 12 + bob);
      this.effects.lineStyle(2, 0xf5d784, 0.85); this.effects.strokeCircle(signal.x - origin.x, signal.y - origin.y, 24);
    }
    if (run) {
      for (const chest of run.visibleChests) if (chest.active && chest.large && ((chest.openProgress ?? 0) > 0 || Math.hypot(chest.x - worldX, chest.y - worldY) < 110)) {
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
        if (area.visual === 'bomu-explosion' || area.visual === 'item-explosion') {
          const alpha = Math.max(0, area.life / 0.3), radius = area.radius * (area.triggered ? Math.min(1, 0.4 + (0.3 - area.life) * 5) : 0.2);
          this.effects.fillStyle(0xe28a48, alpha * 0.35); this.effects.fillCircle(x, y, radius);
          this.effects.lineStyle(3, 0xffd89b, alpha);
          for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; this.effects.lineBetween(x + Math.cos(a) * radius * 0.4, y + Math.sin(a) * radius * 0.4, x + Math.cos(a) * radius, y + Math.sin(a) * radius); }
          continue;
        }
        if (area.visual === 'rubber-axe') { const actor = run.players.get(area.ownerId); drawAxe(this.effects, x, y, area.delay, area.life, area.radius, actor ? { x: actor.x - origin.x, y: actor.y - origin.y } : undefined); continue; }
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
        if (bullet.hostile) {
          this.effects.lineStyle(7, 0x3b151f, .95); this.effects.lineBetween(x, y, x - bullet.vx * .07, y - bullet.vy * .07);
          this.effects.lineStyle(3, 0xff735f, 1); this.effects.lineBetween(x, y, x - bullet.vx * .07, y - bullet.vy * .07);
          this.effects.fillStyle(0x401c27); this.effects.fillCircle(x, y, 7); this.effects.fillStyle(0xffdf9d); this.effects.fillCircle(x, y, 4); continue;
        }
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
      const actor = run.players.get(strike.ownerId);
      const x = (actor?.x ?? strike.x) - origin.x, y = (actor?.y ?? strike.y) - origin.y;
      const color = strike.evolved ? 0xf8d76c : strike.behavior === 'sweep' ? 0x9bd8d5 : 0xf1d1ab;
      const owner = run.players.get(strike.ownerId), attached = strike.visual?.startsWith('rubber-') && owner;
      if (drawElasticStrike(this.effects, strike, attached ? owner.x - origin.x : x, attached ? owner.y - origin.y : y, attached ? { direction: owner.id === player?.id ? pose.direction : movementDirection(Math.cos(owner.facing), Math.sin(owner.facing)), targetX: x + Math.cos(strike.angle) * strike.reach, targetY: y - 26 + Math.sin(strike.angle) * strike.reach, angle: this.captain.angle, scaleX: this.captain.scaleX, scaleY: this.captain.scaleY } : undefined)) continue;
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
      if (strike.visual === 'kick') {
        this.effects.lineStyle(9, 0x28313b, alpha); this.effects.lineBetween(x, y - 13, endX, endY - 19);
        this.effects.lineStyle(2, 0x6c7781, alpha); this.effects.lineBetween(x - 2, y - 13, endX - 2, endY - 21);
        this.effects.fillStyle(0x101923, alpha); this.effects.fillRoundedRect(endX - 11, endY - 24, 26, 12, 3);
        this.effects.lineStyle(2, 0xb9b8a6, alpha); this.effects.lineBetween(endX - 10, endY - 11, endX + 13, endY - 11); continue;
      }
      this.effects.lineStyle(9, 0x7c503b, alpha); this.effects.lineBetween(x, y - 19, endX, endY - 19);
      this.effects.lineStyle(5, 0xefc69a, alpha); this.effects.lineBetween(x, y - 21, endX, endY - 21);
      this.fists[index].setTexture('fist').setDisplaySize(strike.evolved ? 36 : 27, strike.evolved ? 36 : 27).setTint(color).setVisible(true).setPosition(endX, endY - 21).setAlpha(alpha).setRotation(strike.angle + Math.PI / 4);
      this.effects.lineStyle(2, 0xf6e5bc, alpha); this.effects.strokeCircle(endX, endY - 20, 19 - strike.life * 40);
    }
    this.bridge.tick();
  }
}
