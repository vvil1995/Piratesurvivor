import type Phaser from 'phaser';
import type { ActorAnimation } from './actor-animation.ts';
import { legPose } from './walk-pose.ts';

// Muslo y pantorrilla articulados: no se balancea el dibujo completo como una tabla.
// Imágenes preasignadas, recortes del mismo atlas detallado, sin texturas por paso.
export class WalkRig {
  private legs: { thigh: Phaser.GameObjects.Image; shin: Phaser.GameObjects.Image }[];
  constructor(scene: Phaser.Scene, texture: string) {
    this.legs = [-1, 1].map(sign => {
      const x = sign < 0 ? 0 : 48;
      return {
        thigh: scene.add.image(0, 0, texture).setOrigin(0.5, 62 / 96).setCrop(x, 62, 48, 16).setVisible(false),
        shin: scene.add.image(0, 0, texture).setOrigin(0.5, 77 / 96).setCrop(x, 77, 48, 19).setVisible(false),
      };
    });
  }
  get swing(): number { return this.legs[0].thigh.angle - this.legs[1].thigh.angle; }
  update(body: Phaser.GameObjects.Image, pose: ActorAnimation, scale: number): void {
    body.setCrop(0, 0, 96, 68);
    const hipY = body.y - (96 * body.originY - 62) * body.scaleY;
    this.legs.forEach(({ thigh, shin }, index) => {
      const leg = legPose(pose.direction, pose.gaitPhase, index ? 1 : -1, pose.frame > 0);
      const angle = body.angle + leg.thigh;
      const radians = angle * Math.PI / 180;
      const x = body.x + leg.offsetX * scale, y = hipY - leg.lift * scale;
      thigh.setTexture(body.texture.key).setVisible(body.visible).setPosition(x, y)
        .setScale(body.scaleX, body.scaleY).setDepth(body.depth - 0.1).setAngle(angle).setAlpha(body.alpha).setTint(body.tintTopLeft);
      shin.setTexture(body.texture.key).setVisible(body.visible)
        .setPosition(x - Math.sin(radians) * 15 * body.scaleY, y + Math.cos(radians) * 15 * body.scaleY)
        .setScale(body.scaleX, body.scaleY).setDepth(body.depth - 0.09).setAngle(angle + leg.knee).setAlpha(body.alpha).setTint(body.tintTopLeft);
    });
  }
  hide(): void { for (const leg of this.legs) { leg.thigh.setVisible(false); leg.shin.setVisible(false); } }
}
