import Phaser from 'phaser';
import type { BuggyEncounter } from '../bosses/buggy.ts';
import type { DangerZone } from '../bosses/telegraphs.ts';
import type { Vector } from '../core/types.ts';
import { ActorAnimation } from './actor-animation.ts';
import { BUGGY_RULES as R } from '../../content/bosses/buggy.ts';
type DrawDanger = (g: Phaser.GameObjects.Graphics, z: DangerZone, origin: Vector, color: number, alpha: number) => void;
/** Bounded render pools, with actual separate sprites rather than cropped transparency. */
export class BuggyRenderer {
    private body: Phaser.GameObjects.Image;
    private knives: Phaser.GameObjects.Image[];
    private bombs: Phaser.GameObjects.Image[];
    private parts: Phaser.GameObjects.Image[];
    private marks: Phaser.GameObjects.Graphics;
    private motion = new ActorAnimation();
    private idle = 0;
    get texture(): string { return this.body.texture.key; }
    constructor(scene: Phaser.Scene) {
        this.body = scene.add.image(0, 0, 'buggy-pose-4').setOrigin(.5, .94).setScale(.85).setVisible(false);
        const image = (texture: string) => scene.add.image(0, 0, texture).setVisible(false);
        this.knives = Array.from({ length: R.knifeCap }, () => image('buggy-knife'));
        this.bombs = Array.from({ length: R.hazardCap }, () => image('buggy-bomb'));
        this.parts = Array.from({ length: 3 }, () => image('buggy-head'));
        this.marks = scene.add.graphics().setDepth(9000);
    }
    hide(): void { this.body.setVisible(false); this.marks.clear(); for (const image of this.knives)
        image.setVisible(false); for (const image of this.bombs)
        image.setVisible(false); for (const image of this.parts)
        image.setVisible(false); }
    update(b: BuggyEncounter, origin: Vector, dt: number, animate: boolean, draw: DrawDanger): void {
        this.hide();
        if (animate)
            this.idle += Math.min(.1, dt);
        this.motion.update(b.body.id, b.body.x, b.body.y, animate, dt);
        let frame = this.motion.frame ? this.motion.frame - 1 : 4;
        if (b.state === 'preparing')
            frame = b.attackId === 'bomb' ? 6 : 5;
        if (b.state === 'impact' && b.elapsed < .25 && ['knives', 'ring', 'bomb', 'barrage'].includes(b.attackId ?? ''))
            frame = b.attackId === 'bomb' ? 6 : 5;
        if (b.body.flash > 0)
            frame = 7;
        if (b.state === 'stunned')
            frame = 8;
        if (b.parts.length)
            frame = 11;
        if (b.state === 'dead')
            frame = b.elapsed < .35 ? 9 : 10;
        const x = b.body.x - origin.x, y = b.body.y - origin.y;
        this.body.setVisible(true).setTexture(`buggy-pose-${frame}`).setPosition(x, y).setDepth(y + 1000).setAlpha(b.state === 'dead' ? Math.max(0, 1 - b.elapsed / 1.5) : 1)
            .setScale(.85, .85 * (frame === 4 ? 1 + Math.sin(this.idle * 2) * .006 : 1)).setTint(b.body.flash > 0 ? 0xffc9b8 : 0xffffff).setRotation(b.body.flash > 0 ? -.06 : 0);
        if (b.telegraph) {
            const alpha = b.stage === 'final' ? .46 + (Math.floor(b.elapsed * 12) % 2) * .12 : .22;
            for (const z of [b.telegraph.zone, ...b.extraWarnings])
                draw(this.marks, z, origin, 0xf13f46, alpha);
            if (b.attackId === 'bomb' || b.attackId === 'barrage') {
                for (const [i, z] of [b.telegraph.zone, ...b.extraWarnings].entries()) {
                    const image = this.bombs[i];
                    if (!image)
                        break;
                    const progress = Math.min(1, b.elapsed / Math.max(.1, b.telegraph.attack.preparation));
                    const bx = b.attackId === 'bomb' ? b.body.x + (z.x - b.body.x) * progress : z.x;
                    const by = b.attackId === 'bomb' ? b.body.y + (z.y - b.body.y) * progress - Math.sin(progress * Math.PI) * 70 : z.y - Math.min(90, Math.max(0, b.telegraph.attack.preparation - b.elapsed + i * R.bombStagger) * 70);
                    image.setTexture(b.attackId === 'bomb' ? 'buggy-bomb' : 'buggy-knife').setVisible(true).setPosition(bx - origin.x, by - origin.y - 14).setScale(b.attackId === 'bomb' ? .85 : .7).setRotation(b.attackId === 'bomb' ? 0 : 3.93).setDepth(9001);
                }
            }
        }
        for (const [i, k] of b.knives.entries()) {
            this.knives[i].setVisible(k.active).setPosition(k.x - origin.x, k.y - origin.y - 12).setRotation(k.angle + 2.3).setScale(.75).setTint(k.reflected?0x9ee9ed:0xffffff).setDepth(9001);
            this.marks.lineStyle(1, k.reflected?0x9ee9ed:0xffdfa3, .85);
            this.marks.lineBetween(k.x - origin.x - Math.cos(k.angle) * 14, k.y - origin.y - 12 - Math.sin(k.angle) * 14, k.x - origin.x, k.y - origin.y - 12);
        }
        for (const [i, h] of b.hazards.entries()) {
            draw(this.marks, h.zone, origin, h.exploded ? 0xffb457 : 0xf13f46, h.exploded ? .5 : h.remaining < .35 ? .58 : .3);
            if (!h.exploded) {
                const image = this.bombs[i];
                image.setTexture(h.kind === 'bomb' ? 'buggy-bomb' : 'buggy-knife').setVisible(true).setPosition(h.zone.x - origin.x, h.zone.y - origin.y - 14 - (h.kind === 'rain' ? Math.min(90, Math.max(0, h.remaining) * 70) : 0)).setScale(h.kind === 'bomb' ? .85 : .7).setRotation(h.kind === 'bomb' ? 0 : 3.93).setDepth(9001);
            }
        }
        for (const [i, part] of b.parts.entries()) {
            const px = part.x - origin.x, py = part.y - origin.y;
            this.parts[i].setTexture(part.kind === 'head' ? 'buggy-head' : part.kind === 'left' ? 'buggy-hand-left' : 'buggy-hand-right').setVisible(true).setPosition(px, py - (part.kind === 'head' ? 18 : 22)).setDepth(py + 1002).setScale(part.kind === 'head' ? .75 : .7).setRotation(b.state === 'stunned' ? Math.sin(this.idle * 10) * .12 : 0);
            if (b.state === 'impact' && part.kind !== 'head')
                draw(this.marks, { x: part.x, y: part.y, shape: 'circle', radius: 12, angle: 0, length: 0, width: 0, arc: 0, innerRadius: 0 }, origin, 0xf13f46, .38);
        }
        if (b.parts.length === 1)
            for (let i = 1; i < 3; i++)
                this.parts[i].setTexture(i === 1 ? 'buggy-hand-left' : 'buggy-hand-right').setVisible(true).setPosition(x + (i === 1 ? -27 : 27), y - 42).setScale(.5).setRotation(0).setDepth(y + 1002);
        if (b.impactZone)
            draw(this.marks, b.impactZone, origin, 0xffb457, .48);
        if (b.state === 'stunned') {
            this.marks.lineStyle(2, 0xf4d56f, .9);
            this.marks.strokeEllipse(x, y - 104, 36, 10);
            for (let i = 0; i < 3; i++) {
                const a = this.idle * 4 + i * Math.PI * 2 / 3;
                this.marks.fillStyle(0xffdc79);
                this.marks.fillRect(x + Math.cos(a) * 18 - 2, y - 105 + Math.sin(a) * 5, 4, 4);
            }
        }
    }
}
