import Phaser from 'phaser';
import type { MorganEncounter } from '../bosses/morgan.ts';
import type { DangerZone } from '../bosses/telegraphs.ts';
import type { Vector } from '../core/types.ts';
import { MORGAN_ARENA } from '../world/arena.ts';

// Un único renderizador de formas: el motor usa exactamente esos parámetros.
export function drawDanger(g: Phaser.GameObjects.Graphics, zone: DangerZone, origin: Vector, color: number, alpha: number): void {
  g.fillStyle(color, alpha); g.lineStyle(2, 0xffd7cc, Math.min(1, alpha * 2));
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
  private body: Phaser.GameObjects.Image;
  private arm: Phaser.GameObjects.Image;
  private warnings: Phaser.GameObjects.Graphics;
  private details: Phaser.GameObjects.Graphics;
  constructor(scene: Phaser.Scene) {
    this.body = scene.add.image(0, 0, 'morgan').setOrigin(0.5, 0.94).setScale(1.1).setVisible(false);
    this.arm = scene.add.image(0, 0, 'morgan-axe').setOrigin(0.22, 0.88).setScale(1.1).setVisible(false);
    // Por encima de decoración, actores y todos los efectos de combate.
    this.warnings = scene.add.graphics().setDepth(9000);
    this.details = scene.add.graphics().setDepth(-950);
  }
  update(boss: MorganEncounter | undefined, origin: Vector): void {
    this.warnings.clear(); this.details.clear();
    this.body.setVisible(!!boss); this.arm.setVisible(!!boss);
    if (!boss) return;
    for (const gate of MORGAN_ARENA.gates) {
      const x = gate.x - origin.x, y = gate.y - origin.y;
      this.details.lineStyle(3, 0x7ca6b4, 0.7); this.details.strokeRect(x - 22, y - 14, 44, 28);
      this.details.fillStyle(0x284b64, 0.55); this.details.fillTriangle(x - 10, y - 8, x + 10, y - 8, x, y + 9);
    }
    const dead = boss.state === 'dead', alpha = dead ? Math.max(0, 1 - boss.elapsed / 1.5) : 1;
    const x = boss.body.x - origin.x, y = boss.body.y - origin.y;
    this.body.setPosition(x, y).setDepth(y + 1000).setAlpha(alpha).setRotation(dead ? Math.min(Math.PI / 2, boss.elapsed * 2) : 0)
      .setTint(boss.body.flash > 0 ? 0xffd1bd : boss.phase === 3 ? 0xffd0c2 : 0xffffff);
    const preparing = boss.state === 'preparing', kind = boss.telegraph?.attack.animation;
    const lift = preparing ? Math.min(1, boss.elapsed / 0.45) : 0;
    this.arm.setPosition(x + 21, y - 42 - lift * 12).setDepth(y + 1001).setAlpha(alpha)
      .setRotation(dead ? Math.PI / 2 : preparing ? -0.85 - lift * 0.7 : boss.state === 'impact' ? 1.1 : 0.1);
    if (boss.telegraph) {
      const warning = boss.telegraph, final = boss.stage === 'final';
      const intensity = final ? 0.34 + (Math.floor(boss.elapsed * 12) % 2) * 0.16 : 0.19;
      if (kind !== 'order') drawDanger(this.warnings, warning.zone, origin, 0xf23f46, intensity);
      else for (const gate of MORGAN_ARENA.gates) { this.warnings.lineStyle(final ? 4 : 2, 0xffb26a, 0.85); this.warnings.strokeCircle(gate.x - origin.x, gate.y - origin.y, 28); }
      this.warnings.lineStyle(final ? 4 : 2, 0xffdad0, final ? 0.95 : 0.5);
      this.warnings.strokeCircle(x, y - 80, final ? 9 : 6);
    }
    if (boss.impactZone) drawDanger(this.warnings, boss.impactZone, origin, 0xffa66a, 0.55);
    if (boss.state === 'stunned') {
      this.warnings.lineStyle(2, 0xffe4a3, 0.9); this.warnings.strokeEllipse(x, y - 83, 40, 12);
      for (let i = 0; i < 3; i++) { const a = boss.elapsed * 4 + i * Math.PI * 2 / 3; this.warnings.fillStyle(0xffde7d); this.warnings.fillRect(x + Math.cos(a) * 18 - 2, y - 84 + Math.sin(a) * 5, 4, 4); }
    }
  }
}
