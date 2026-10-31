import type Phaser from 'phaser';
// Composición de pose: cabeza y piernas conservan sus píxeles/escala originales.
// Solo el torso se representa hinchado; no hay una burbuja externa ni se estira la cara.
export class BalloonRig {
  private head: Phaser.GameObjects.Image;
  private feet: Phaser.GameObjects.Image;
  private body: Phaser.GameObjects.Graphics;
  visible = false;
  constructor(scene: Phaser.Scene) {
    this.head = scene.add.image(0, 0, 'straw-hat-s-0').setOrigin(0.5, 0.96).setScale(0.65).setCrop(0, 0, 96, 37).setVisible(false);
    this.feet = scene.add.image(0, 0, 'straw-hat-s-0').setOrigin(0.5, 0.96).setScale(0.65).setCrop(0, 68, 96, 28).setVisible(false);
    this.body = scene.add.graphics();
  }
  update(actor: Phaser.GameObjects.Image, texture: string, remaining: number, duration: number, inflation = 1.6): void {
    this.body.clear(); this.visible = remaining > 0;
    this.head.setVisible(this.visible); this.feet.setVisible(this.visible);
    if (!this.visible) return;
    const growth = Math.max(0, Math.min(1, (duration - remaining) / 0.12, remaining / 0.18));
    const w = 26 + 60 * (inflation - 1) * growth, h = 30 + 30 * (inflation - 1) * growth, x = actor.x, y = actor.y - 30;
    this.body.setDepth(actor.depth + 0.05).setAlpha(actor.alpha);
    this.body.fillStyle(0x4c3029); this.body.fillEllipse(x, y, w + 4, h + 4);
    this.body.fillStyle(0xd99e6c); this.body.fillEllipse(x, y, w, h);
    this.body.fillStyle(0xf2c48a); this.body.fillEllipse(x - w * 0.08, y - h * 0.06, w * 0.83, h * 0.82);
    this.body.lineStyle(5, 0xa32432); this.body.beginPath(); this.body.arc(x, y, w / 2 - 2, Math.PI * 0.65, Math.PI * 1.35); this.body.strokePath();
    this.body.beginPath(); this.body.arc(x, y, w / 2 - 2, -Math.PI * 0.35, Math.PI * 0.35); this.body.strokePath();
    this.body.fillStyle(0x976145); this.body.fillRect(x - 1, y + 5, 3, 2);
    this.body.fillStyle(0xf3c88c); this.body.fillCircle(x - w / 2 - 3, y, 4); this.body.fillCircle(x + w / 2 + 3, y, 4);
    this.head.setTexture(texture).setCrop(0, 0, 96, 37).setPosition(x, actor.y - growth * 12).setDepth(actor.depth + 0.2).setAlpha(actor.alpha);
    this.feet.setTexture(texture).setCrop(0, 68, 96, 28).setPosition(x, actor.y).setDepth(actor.depth - 0.1).setAlpha(actor.alpha);
    actor.setVisible(false);
  }
}
