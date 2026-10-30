import type Phaser from 'phaser';
import type { ActorAnimation } from './actor-animation.ts';

// Articulación visual de las piernas conservando la textura detallada original.
// Dos recortes compartidos por actor, preasignados; no se crean imágenes por paso.
export class WalkRig {
  private left: Phaser.GameObjects.Image;
  private right: Phaser.GameObjects.Image;
  constructor(scene: Phaser.Scene, texture: string) {
    this.left = scene.add.image(0, 0, texture).setOrigin(0.5, 62 / 96).setCrop(0, 62, 48, 34).setVisible(false);
    this.right = scene.add.image(0, 0, texture).setOrigin(0.5, 62 / 96).setCrop(48, 62, 48, 34).setVisible(false);
  }
  get swing(): number { return this.left.angle - this.right.angle; }
  update(body: Phaser.GameObjects.Image, pose: ActorAnimation, scale: number): void {
    body.setCrop(0, 0, 96, 68);
    const swing = pose.legSwing;
    const hipY = body.y - (96 * body.originY - 62) * body.scaleY;
    this.place(this.left, -1, body, swing, hipY, scale);
    this.place(this.right, 1, body, swing, hipY, scale);
  }
  private place(leg: Phaser.GameObjects.Image, sign: number, body: Phaser.GameObjects.Image, swing: number, hipY: number, scale: number): void {
    leg.setTexture(body.texture.key).setVisible(body.visible).setPosition(body.x, hipY)
      .setScale(body.scaleX, body.scaleY).setDepth(body.depth - 0.1)
      .setAngle(body.angle + swing * sign).setAlpha(body.alpha).setTint(body.tintTopLeft);
    if (swing * sign > 0) leg.y -= Math.abs(swing) * scale * 0.12;
  }
  hide(): void { this.left.setVisible(false); this.right.setVisible(false); }
}
