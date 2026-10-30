import type Phaser from 'phaser';
import type { ActorAnimation } from './actor-animation.ts';
import { legPose } from './walk-pose.ts';
import { detectLegJoints, legTransform, type LegJoints } from './walk-joints.ts';

// Caché compartida: se leen los píxeles una vez por pose, nunca por enemigo/paso.
const jointsByTexture = new Map<string, LegJoints[] | undefined>();
export class WalkRig {
  private legs: { thigh: Phaser.GameObjects.Image; shin: Phaser.GameObjects.Image }[];
  constructor(scene: Phaser.Scene, texture: string) {
    this.legs = [0, 1].map(() => ({ thigh: scene.add.image(0, 0, texture).setVisible(false), shin: scene.add.image(0, 0, texture).setVisible(false) }));
  }
  get swing(): number { return this.legs[0].thigh.visible ? this.legs[0].thigh.angle - this.legs[1].thigh.angle : 0; }
  update(body: Phaser.GameObjects.Image, pose: ActorAnimation, _scale: number): void {
    const key = body.texture.key;
    if (!jointsByTexture.has(key)) {
      const source = body.texture.getSourceImage() as HTMLCanvasElement;
      const pixels = source.getContext?.('2d')?.getImageData(0, 0, 96, 96).data;
      jointsByTexture.set(key, pixels ? detectLegJoints(pixels) : undefined);
    }
    const joints = jointsByTexture.get(key);
    // Una pose que no permite separar ambas piernas conserva el sprite completo.
    // En reposo tampoco se corta el dibujo: evita costuras innecesarias.
    if (!joints || !pose.frame) { body.setCrop(); this.hide(); return; }
    body.setCrop(0, 0, 96, 70);
    this.legs.forEach(({ thigh, shin }, index) => {
      const joint = joints[index], leg = legPose(pose.direction, pose.gaitPhase, index ? 1 : -1, true);
      const transform = legTransform(body, joint, leg.thigh);
      const thighTop = Math.min(60, joint.hip.y - 4), shinTop = joint.knee.y - 4;
      // Nueve filas compartidas en la rodilla. Ambos segmentos giran en el mismo
      // punto opaco real, sin trasladar el muslo fuera de su unión con el cuerpo.
      thigh.setTexture(key).setOrigin(joint.hip.x / 96, joint.hip.y / 96)
        .setCrop(joint.left, thighTop, 48, joint.knee.y + 5 - thighTop)
        .setVisible(body.visible).setPosition(transform.root.x, transform.root.y)
        .setScale(body.scaleX, body.scaleY).setDepth(body.depth - 0.1).setAngle(transform.angle).setAlpha(body.alpha).setTint(body.tintTopLeft);
      shin.setTexture(key).setOrigin(joint.knee.x / 96, joint.knee.y / 96)
        .setCrop(joint.left, shinTop, 48, 96 - shinTop)
        .setVisible(body.visible).setPosition(transform.knee.x, transform.knee.y)
        .setScale(body.scaleX, body.scaleY).setDepth(body.depth - 0.09).setAngle(transform.angle + leg.knee).setAlpha(body.alpha).setTint(body.tintTopLeft);
    });
  }
  hide(): void { for (const leg of this.legs) { leg.thigh.setVisible(false); leg.shin.setVisible(false); } }
}
