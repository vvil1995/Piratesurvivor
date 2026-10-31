import { ActorAnimation } from './actor-animation.ts';
import Phaser from 'phaser';
import type { PatternEncounter } from '../bosses/pattern-encounter.ts';
import type { DangerZone } from '../bosses/telegraphs.ts';
import type { Vector } from '../core/types.ts';
import { MORGAN_ARENA, type ArenaDefinition } from '../world/arena.ts';

// Un único renderizador de formas: el motor usa exactamente esos parámetros.
export function drawDanger(g: Phaser.GameObjects.Graphics, zone: DangerZone, origin: Vector, color: number, alpha: number): void {
  g.fillStyle(color, alpha); g.lineStyle(3, 0xffd7cc, Math.min(1, alpha * 2.5));
  if (zone.shape === 'circle') { g.fillCircle(zone.x - origin.x, zone.y - origin.y, zone.radius); g.strokeCircle(zone.x - origin.x, zone.y - origin.y, zone.radius); return; }
  const transform = (x: number, y: number) => ({ x: zone.x - origin.x + Math.cos(zone.angle) * x - Math.sin(zone.angle) * y, y: zone.y - origin.y + Math.sin(zone.angle) * x + Math.cos(zone.angle) * y });
  const points: Vector[] = [];
  if (zone.shape === 'rectangle' || zone.shape === 'line') {
    points.push(transform(0, -zone.width / 2), transform(zone.length, -zone.width / 2), transform(zone.length, zone.width / 2), transform(0, zone.width / 2));
  } else {
    for (let i = 0; i <= 40; i++) { const a = -zone.arc / 2 + zone.arc * i / 40; points.push(transform(Math.cos(a) * zone.radius, Math.sin(a) * zone.radius)); }
    const inner = zone.shape === 'arc' ? zone.innerRadius : 0;
    if (inner) for (let i = 40; i >= 0; i--) { const a = -zone.arc / 2 + zone.arc * i / 40; points.push(transform(Math.cos(a) * inner, Math.sin(a) * inner)); }
    else points.push(transform(0, 0));
  }
  g.fillPoints(points, true); g.strokePoints(points, true);
}
export class BossRenderer {
  private motion = new ActorAnimation();
  private idleTime=0;
  private body: Phaser.GameObjects.Image;
  private head: Phaser.GameObjects.Image;
  private arm: Phaser.GameObjects.Image;
  private warnings: Phaser.GameObjects.Graphics;
  private details: Phaser.GameObjects.Graphics;
  get texture(): string { return this.body.texture.key; }
  constructor(scene: Phaser.Scene) {
    this.body = scene.add.image(0, 0, 'morgan').setOrigin(0.5, 0.94).setScale(1.1).setVisible(false);
    this.head = scene.add.image(0, 0, 'morgan').setOrigin(0.5, 0.94).setScale(1.1).setVisible(false);
    this.arm = scene.add.image(0, 0, 'morgan-axe').setOrigin(0.22, 0.88).setScale(1.1).setVisible(false);
    // Por encima de decoración, actores y todos los efectos de combate.
    this.warnings = scene.add.graphics().setDepth(9000);
    this.details = scene.add.graphics().setDepth(-950);
  }
  update(boss: PatternEncounter | undefined, origin: Vector, arena: ArenaDefinition = MORGAN_ARENA, dt=1/60, animate=true): void {
    this.warnings.clear(); this.details.clear();
    this.body.setVisible(!!boss); this.arm.setVisible(!!boss); this.head.setVisible(false);
    if (!boss) return;
    for (const gate of arena.gates) {
      const x = gate.x - origin.x, y = gate.y - origin.y;
      this.details.lineStyle(3, 0x7ca6b4, 0.7); this.details.strokeRect(x - 22, y - 14, 44, 28);
      this.details.fillStyle(0x284b64, 0.55); this.details.fillTriangle(x - 10, y - 8, x + 10, y - 8, x, y + 9);
    }
    this.body.setTexture(boss.profile.visual).setCrop().setScale(boss.profile.id === 'morgan' ? 1 : 1.1); this.arm.setTexture(boss.profile.weapon);
    const dead = boss.state === 'dead', alpha = dead ? Math.max(0, 1 - boss.elapsed / 1.5) : 1;
    const x = boss.body.x - origin.x, y = boss.body.y - origin.y;
    this.body.setPosition(x, y).setDepth(y + 1000).setAlpha(alpha).setRotation(dead ? Math.min(Math.PI / 2, boss.elapsed * 2) : 0)
      .setTint(boss.body.flash > 0 ? 0xffd1bd : boss.phase === 3 ? 0xffd0c2 : 0xffffff);
    const preparing = boss.state === 'preparing', kind = boss.telegraph?.attack.animation;
    const lift = preparing ? Math.min(1, boss.elapsed / 0.45) : 0;
    this.arm.setOrigin(boss.profile.id === 'morgan' ? 0.82 : 0.22, 0.88).setScale(boss.profile.id === 'morgan' ? 0.8 : 1.1).setPosition(x + (boss.profile.id === 'morgan' ? -22 : 21), y - 42 - lift * 12).setDepth(y + 1001).setAlpha(alpha)
      .setRotation(dead ? Math.PI / 2 : preparing ? -0.85 - lift * 0.7 : boss.state === 'impact' ? 1.1 : 0.1);
    if (boss.profile.id === 'morgan') {
      this.motion.update(boss.body.id, boss.body.x, boss.body.y, animate, dt);
      if (animate) this.idleTime += Math.min(dt,.1);
      const action = boss.attacks.find(a=>a.name===boss.moveName)?.animation ?? kind;
      const walking = this.motion.frame>0;
      const step = walking ? this.motion.frame-1 : 0;
      const left = ['w','nw','sw'].includes(this.motion.direction);
      let frame = walking ? step + (left?4:0) : 8;
      if (preparing) frame=9;
      if (boss.state==='impact') frame=action==='charge' ? (boss.elapsed<.12?12:step+(left?4:0)) : boss.impactZone?.shape==='arc'?11:10;
      if (boss.body.flash>0 && !dead) frame=13;
      if (dead) frame=boss.elapsed<.35?14:15;
      this.body.setTexture(`morgan-pose-${frame}`).setRotation(boss.state==='impact'&&action==='charge'?(left?-.14:.14):0);
      if (!walking && !preparing && !dead) this.body.setScale(1,1+Math.sin(this.idleTime*2)*.008);
      if (boss.body.flash>0) this.body.setAngle(-6*boss.body.flash/.15);
      if (frame>=4 && frame<=7) this.arm.setOrigin(.18,.88).setPosition(x+22,y-42);
      if (dead) this.arm.setVisible(boss.elapsed<.35);
      else if (walking && !preparing) this.arm.setRotation(.1+Math.sin(this.motion.gaitPhase)*.16);
      else if (boss.state==='impact' && boss.impactZone?.shape==='arc') this.arm.setRotation(-1.4+Math.min(1,boss.elapsed/.2)*3.8);
    }
    if (preparing && kind === 'split') {
      this.body.setCrop(0, 25, 64, 55);
      this.head.setTexture(boss.profile.visual).setCrop(0, 0, 64, 25).setVisible(true).setPosition(x + Math.sin(boss.elapsed * 7) * 18, y - 13).setDepth(y + 1002).setAlpha(alpha);
      this.arm.setPosition(x + 40 + Math.sin(boss.elapsed * 9) * 12, y - 48).setRotation(-boss.elapsed * 5);
    }
    if (boss.profile.visual === 'buggy' && boss.impactZone?.shape === 'line') {
      const z = boss.impactZone;
      this.arm.setPosition(z.x - origin.x + Math.cos(z.angle) * z.length, z.y - origin.y + Math.sin(z.angle) * z.length - 18).setRotation(z.angle + Math.PI / 2).setDepth(9001);
    }
    if (boss.telegraph) {
      const warning = boss.telegraph, final = boss.stage === 'final';
      const intensity = final ? 0.48 + (Math.floor(boss.elapsed * 12) % 2) * 0.16 : 0.32;
      if (kind !== 'order') for (const zone of [warning.zone, ...boss.extraWarnings]) drawDanger(this.warnings, zone, origin, 0xf23f46, intensity);
      else for (const gate of arena.gates) { this.warnings.lineStyle(final ? 4 : 2, 0xffb26a, 0.85); this.warnings.strokeCircle(gate.x - origin.x, gate.y - origin.y, 28); }
      if (kind === 'bomb') for (const zone of [warning.zone, ...boss.extraWarnings]) {
        const bx = zone.x - origin.x, by = zone.y - origin.y;
        this.warnings.fillStyle(0x252a36); this.warnings.fillCircle(bx, by - 9, 9);
        this.warnings.fillStyle(0x576477); this.warnings.fillRect(bx - 5, by - 14, 5, 4);
        this.warnings.lineStyle(2, 0xcda360); this.warnings.lineBetween(bx + 2, by - 17, bx + 7, by - 22);
        this.warnings.fillStyle(final ? 0xffd98a : 0xe49053); this.warnings.fillRect(bx + 5, by - 24, 4, 4);
      }
      this.warnings.lineStyle(final ? 4 : 2, 0xffdad0, final ? 0.95 : 0.5);
      this.warnings.strokeCircle(x, y - 105, final ? 9 : 6);
    }
    if (boss.impactZone) for (const zone of [boss.impactZone, ...boss.extraImpacts]) drawDanger(this.warnings, zone, origin, 0xffa66a, 0.55);
    if (boss.state === 'stunned') {
      this.warnings.lineStyle(2, 0xffe4a3, 0.9); this.warnings.strokeEllipse(x, y - 83, 40, 12);
      for (let i = 0; i < 3; i++) { const a = boss.elapsed * 4 + i * Math.PI * 2 / 3; this.warnings.fillStyle(0xffde7d); this.warnings.fillRect(x + Math.cos(a) * 18 - 2, y - 84 + Math.sin(a) * 5, 4, 4); }
    }
  }
}
