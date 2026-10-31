import { FINAL_PHASE, bossPhase, pressuredAttack, warningSeconds, movementScale, cadenceScale } from './pressure.ts';
import { ABILITIES } from '../../content/attacks.ts';
import { PatternEncounter } from './pattern-encounter.ts';
import { BUGGY, BUGGY_ATTACKS, BUGGY_RULES as R } from '../../content/bosses/buggy.ts';
import { inDanger, zoneFor, type BossAttack, type DangerZone } from './telegraphs.ts';
import type { Player, Vector } from '../core/types.ts';
import type { CollisionWorld } from '../world/world.ts';
import { receivedDamage } from '../systems/stats.ts';
import { isInvulnerable } from '../systems/guards.ts';
export interface BuggyKnife extends Vector {
    angle: number;
    life: number;
    active: boolean;
    damage: number;
    speed: number;
    reflected: boolean;
}
export interface BuggyHazard {
    zone: DangerZone;
    remaining: number;
    exploded: boolean;
    life: number;
    kind: 'bomb' | 'rain';
    damage: number;
}
export interface BuggyPart extends Vector {
    kind: 'head' | 'left' | 'right';
}
const corridor = (from: Vector, to: Vector, width: number): DangerZone => ({ ...from, shape: 'line', angle: Math.atan2(to.y - from.y, to.x - from.x), length: Math.hypot(to.x - from.x, to.y - from.y), width, radius: 0, innerRadius: 0, arc: 0 });
export interface BuggyHooks {
    reflectHit?: (damage: number) => void;
    counter?: (origin: Vector) => boolean;
    absorb?: (position: Vector, damage: number) => boolean;
}
/** Own ranged controller; Morgan's scheduler/hitboxes remain untouched. */
export class BuggyEncounter extends PatternEncounter {
    readonly knives: BuggyKnife[] = [];
    readonly hazards: BuggyHazard[] = [];
    readonly parts: BuggyPart[] = [];
    private current?: BossAttack;
    private sequence = 0;
    private last = '';
    private cooldowns = new Map<string, number>();
    private chargeDistance = 0;
    private chargeLimit = 0;
    private chargeBlocked = false;
    private chargeZone?: DangerZone;
    private splitTime = 0;
    private returning = false;
    private hooks: BuggyHooks;
    constructor(hooks: BuggyHooks = {}) { super(BUGGY, BUGGY_ATTACKS); this.hooks = hooks; }
    get attackId(): string | undefined { return this.current?.id; }
    override get moveName(): string {
        return this.state === 'dead' ? 'VICTORIA · EMBARCANDO' : this.state === 'stunned' ? 'ATURDIT · CONTRAATACA' : this.state === 'recovering' ? 'EXPOSAT · CONTRAATACA' : this.current?.name ?? 'REPOSICIONAMENT';
    }
    override cancel(): void {
        super.cancel();
        this.knives.length = 0;
        this.hazards.length = 0;
        this.parts.length = 0;
        this.current = undefined;
        this.chargeZone = undefined;
        this.returning = false;
        if (this.state !== 'dead') {
            this.state = 'approach';
            this.elapsed = 0;
        }
    }
    override defeated(): void { super.defeated(); }
    private partOrigin(kind: BuggyPart['kind']): Vector { return { x: this.body.x + (kind === 'left' ? -30 : kind === 'right' ? 30 : 0), y: this.body.y + (kind === 'head' ? -60 : -4) }; }
    override prepare(attack: BossAttack, target: Vector, world: CollisionWorld): void {
        this.phase = bossPhase(this.body.hp,this.body.maxHp,BUGGY.phaseThresholds[0]);
        attack = pressuredAttack(attack,this.phase);
        this.current = attack;
        this.state = 'preparing';
        this.elapsed = 0;
        this.impactZone = undefined;
        this.extraImpacts = [];
        this.extraWarnings = [];
        this.returning = false;
        this.parts.length = 0;
        this.body.statuses = undefined;
        let zone = zoneFor(attack, attack.targeted ? target : this.body, target);
        this.angle = Math.atan2(target.y - this.body.y, target.x - this.body.x);
        if (attack.id === 'knives' || attack.id === 'ring') {
            const count = attack.id === 'knives' ? R.fanCount[this.phase - 1] : R.ringCount[this.phase - 1];
            const angles = Array.from({ length: count }, (_, i) => attack.id === 'knives' ? this.angle - R.fanArc / 2 + R.fanArc * i / (count - 1) : this.angle + (i + .5 + (this.phase === 3 ? .18 : 0)) * Math.PI * 2 / count);
            const zones = angles.map(angle => {
                const ray = { ...zone, angle };
                let length = 0;
                for (let d = 4; d <= ray.length; d += 4) {
                    if (!world.canOccupy(ray.x + Math.cos(angle) * d, ray.y + Math.sin(angle) * d, R.knifeRadius, 'attack'))
                        break;
                    length = d;
                }
                return { ...ray, length };
            });
            zone = zones[0];
            this.extraWarnings = zones.slice(1);
        }
        else if (attack.id === 'bomb' || attack.id === 'barrage') {
            const offsets = attack.id === 'bomb' ? Array.from({ length: R.bombCount[this.phase - 1] }, (_, i) => ({ x: i === 0 ? 0 : (i % 2 ? 1 : -1) * R.bombSpacing, y: i % 2 ? 50 : 0 })) :
                [{ x: 0, y: 0 }, { x: -150, y: -110 }, { x: 150, y: -110 }, { x: -150, y: 110 }, { x: 150, y: 110 }, { x: 0, y: -200 }, { x: 0, y: 200 }];
            const zones = offsets.map(o => ({ ...zone, x: target.x + o.x, y: target.y + o.y })).filter(z => world.canOccupy(z.x, z.y, z.radius));
            if (!zones.length)
                zones.push({ ...zone, x: this.body.x, y: this.body.y });
            zone = zones[0];
            this.extraWarnings = zones.slice(1);
        }
        else if (attack.id === 'split' || attack.id === 'charge') {
            for (const kind of (attack.id === 'split' ? ['head', 'left', 'right'] : ['head']) as BuggyPart['kind'][])
                this.parts.push({ ...this.partOrigin(kind), kind });
            if (attack.id === 'split') {
                const zones = this.parts.map(part => ({ ...zone, ...part }));
                zone = zones[0];
                this.extraWarnings = zones.slice(1);
            }
            else {
                zone = { ...zone, ...this.parts[0], angle: Math.atan2(target.y - this.parts[0].y, target.x - this.parts[0].x) };
                this.chargeLimit = 0;
                this.chargeDistance = 0;
                this.chargeBlocked = false;
                for (let d = 4; d <= attack.length; d += 4) {
                    if (!world.canOccupy(zone.x + Math.cos(zone.angle) * d, zone.y + Math.sin(zone.angle) * d, 14)) {
                        this.chargeBlocked = true;
                        break;
                    }
                    this.chargeLimit = d;
                }
                zone.length = this.chargeLimit;
                this.chargeZone = { ...zone };
            }
        }
        this.telegraph = { zone, elapsed: 0, attack };
    }
    private damageTarget(player: Player, damage: number, name: string): void {
        if (player.hp <= 0 || player.hurtTimer > 0 || isInvulnerable(player))
            return;
        player.hp = Math.max(0, player.hp - receivedDamage(damage, player.stats.armor));
        player.hurtTimer = .65;
        player.lastHit = name;
        player.damageNoticeFor = 1.2;
    }
    private queueHazards(zones: readonly DangerZone[], kind: 'bomb' | 'rain', damage: number, delay = 0): void {
        for (const [i, zone] of zones.entries())
            if (this.hazards.length < R.hazardCap)
                this.hazards.push({ zone: { ...zone }, kind, damage, remaining: delay + i * R.bombStagger * (this.phase===3?FINAL_PHASE.warningScale:1), exploded: false, life: .3 });
    }
    private tickHazards(dt: number, player: Player, world: CollisionWorld): void {
        const reflect = player.attacks.some(a => a.activeFor > 0 && ABILITIES[a.id].levels[a.level - 1].reflect);
        const deflect = player.attacks.some(a => a.activeFor > 0 && ABILITIES[a.id].levels[a.level - 1].deflect);
        for (const knife of this.knives) {
            if (!knife.active)
                continue;
            const step = Math.min(dt, knife.life);
            knife.life -= dt;
            if (step <= 0) {
                knife.active = false;
                continue;
            }
            const from = { x: knife.x, y: knife.y }, to = { x: knife.x + Math.cos(knife.angle) * knife.speed * step, y: knife.y + Math.sin(knife.angle) * knife.speed * step };
            if (!world.segmentClear(from.x, from.y, to.x, to.y, R.knifeRadius, 'attack')) {
                knife.active = false;
                continue;
            }
            if (knife.reflected) {
                if (Math.hypot(to.x-this.body.x,to.y-this.body.y) < this.body.radius + R.knifeRadius) { knife.active=false;this.hooks.reflectHit?.(knife.damage); }
            } else if (this.hooks.absorb?.(to,knife.damage)) { knife.active=false; }
            else if ((reflect || deflect) && Math.hypot(to.x-player.x,to.y-player.y) < 40 + R.knifeRadius) {
                if (deflect) knife.active=false;
                else { knife.reflected=true;knife.angle+=Math.PI; }
            }
            const zone = corridor(from, to, R.knifeRadius * 2); // Same swept corridor used by the renderer.
            if (knife.active && !knife.reflected && inDanger(zone, player)) {
                if (player.hurtTimer <= 0 && !isInvulnerable(player) && !this.hooks.counter?.(from)) this.damageTarget(player, knife.damage, 'Ganivet de Buggy');
                knife.active = false;
            }
            knife.x = to.x;
            knife.y = to.y;
            if (knife.life <= 0)
                knife.active = false;
        }
        for (let i = this.knives.length - 1; i >= 0; i--)
            if (!this.knives[i].active)
                this.knives.splice(i, 1);
        for (const h of this.hazards) {
            if (h.exploded) {
                h.life -= dt;
                continue;
            }
            h.remaining -= dt;
            if (h.remaining <= 0) {
                h.exploded = true;
                if (inDanger(h.zone, player) && world.segmentClear(h.zone.x, h.zone.y, player.x, player.y, 2, 'attack'))
                    this.damageTarget(player, h.damage, h.kind === 'bomb' ? 'Bomba Buggy' : 'Pluja de ganivets');
            }
        }
        for (let i = this.hazards.length - 1; i >= 0; i--)
            if (this.hazards[i].exploded && this.hazards[i].life <= 0)
                this.hazards.splice(i, 1);
    }
    private startImpact(player: Player, world: CollisionWorld): void {
        const attack = this.current!, zones = [this.telegraph!.zone, ...this.extraWarnings];
        this.telegraph = undefined;
        this.extraWarnings = [];
        this.state = 'impact';
        this.elapsed = 0;
        this.cooldowns.set(attack.id, attack.cooldown);
        if (attack.id === 'knives' || attack.id === 'ring') {
            for (const z of zones)
                if (this.knives.length < R.knifeCap)
                    this.knives.push({ x: z.x, y: z.y, angle: z.angle, speed: R.knifeSpeed * R.knifeSpeedScale[this.phase - 1], life: z.length / (R.knifeSpeed * R.knifeSpeedScale[this.phase - 1]), damage: attack.damage, active: true, reflected: false });
            // Una bomba compatible fuera del centro, con su propio aviso y la regla común de fase final.
            if (this.phase === 3 && attack.id === 'ring') {
                const z = { ...zoneFor(this.attacks.find(a => a.id === 'bomb')!, player, player), x: player.x + 150 };
                if (world.canOccupy(z.x, z.y, z.radius))
                    this.queueHazards([z], 'bomb', 40, warningSeconds(1.6,this.phase));
            }
        }
        else if (attack.id === 'bomb' || attack.id === 'barrage')
            this.queueHazards(zones, attack.id === 'bomb' ? 'bomb' : 'rain', attack.damage);
        else if (attack.id === 'split') {
            this.splitTime = 0;
            this.body.statuses = { exposed: R.splitSeconds };
        }
    }
    private recover(stunned = false): void {
        this.state = stunned ? 'stunned' : 'recovering';
        this.elapsed = 0;
        this.returning = this.parts.length > 0;
        this.body.statuses = { exposed: stunned ? BUGGY.stunSeconds : this.current!.recovery };
    }
    override tick(dt: number, player: Player, world: CollisionWorld, direction: (from: Vector) => Vector, _reinforce: () => void): void {
        if (player.hp <= 0) {
            this.cancel();
            return;
        }
        if (!this.body.active || this.body.hp <= 0) {
            if (this.state !== 'dead')
                this.defeated();
            this.elapsed += dt;
            return;
        }
        this.phase = bossPhase(this.body.hp,this.body.maxHp,BUGGY.phaseThresholds[0]);
        this.elapsed += dt;
        this.body.flash = Math.max(0, this.body.flash - dt);
        for (const [id, t] of this.cooldowns)
            this.cooldowns.set(id, Math.max(0, t - dt));
        this.tickHazards(dt, player, world);
        if(this.state==='dead')return;
        if (this.returning) {
            for (const part of this.parts) {
                const to = this.partOrigin(part.kind);
                part.x += (to.x - part.x) * Math.min(1, dt * 10);
                part.y += (to.y - part.y) * Math.min(1, dt * 10);
            }
            if (this.elapsed >= R.returnSeconds) {
                this.parts.length = 0;
                this.returning = false;
            }
        }
        if (this.state === 'approach') {
            if ((this.body.statuses?.stun ?? 0) > 0)
                return;
            const dx = player.x - this.body.x, dy = player.y - this.body.y, d = Math.max(1, Math.hypot(dx, dy));
            const guide = direction(this.body), sign = this.sequence % 2 ? 1 : -1;
            const base = guide.x || guide.y ? guide : { x: dx / d, y: dy / d };
            const drift = Math.max(-.25, Math.min(.25, (d - R.preferredDistance) / 80));
            const speed = d > 450 ? BUGGY.pursuitSprint : BUGGY.speed;
            const move = d < R.retreatDistance ? { x: -dx / d, y: -dy / d } : d > BUGGY.engageRange ? base : { x: -dy / d * sign * .5 + dx / d * drift, y: dx / d * sign * .5 + dy / d * drift };
            for (const [x, y] of [[move.x, move.y], [-move.y, move.x], [move.y, -move.x]]) {
                if (world.segmentClear(this.body.x, this.body.y, this.body.x + x * 32, this.body.y + y * 32, this.body.radius)) {
                    world.moveCircle(this.body, x * speed * movementScale(this.phase) * dt, y * speed * movementScale(this.phase) * dt, this.body.radius);
                    break;
                }
            }
            if (d > BUGGY.engageRange || this.elapsed < R.repositionSeconds * cadenceScale(this.phase))
                return;
            const ids = BUGGY.patterns[this.phase - 1];
            let chosen: BossAttack | undefined;
            for (let i = 0; i < ids.length; i++) {
                const id = ids[this.sequence++ % ids.length];
                if (id !== this.last && (this.cooldowns.get(id) ?? 0) <= 0) {
                    chosen = this.attacks.find(a => a.id === id);
                    break;
                }
            }
            if (chosen) {
                this.last = chosen.id;
                this.prepare(chosen, player, world);
            }
            return;
        }
        if (this.state === 'preparing') {
            this.telegraph!.elapsed = this.elapsed;
            if (this.elapsed + 1e-8 >= this.current!.preparation)
                this.startImpact(player, world);
            return;
        }
        if (this.state === 'stunned' || this.state === 'recovering') {
            if (this.elapsed >= (this.state === 'stunned' ? BUGGY.stunSeconds : this.current!.recovery * BUGGY.phaseCadence[this.phase - 1] * cadenceScale(this.phase))) {
                this.state = 'approach';
                this.elapsed = 0;
                this.current = undefined;
                this.body.statuses = undefined;
                this.parts.length = 0;
            }
            return;
        }
        if (this.current!.id === 'split') {
            this.splitTime += dt;
            for (const part of this.parts) {
                if (part.kind === 'head') {
                    part.x = this.body.x + Math.sin(this.splitTime * 2) * 65;
                    part.y = this.body.y - 70 + Math.cos(this.splitTime * 2) * 15;
                    continue;
                }
                const dx = player.x - part.x, dy = player.y - part.y, d = Math.max(1, Math.hypot(dx, dy));
                world.moveCircle(part, dx / d * R.handSpeed * dt, dy / d * R.handSpeed * dt, 12);
                if (d < 12)
                    this.damageTarget(player, R.handDamage, 'Mà separada de Buggy');
            }
            if (this.elapsed >= R.splitSeconds)
                this.recover();
            return;
        }
        if (this.current!.id === 'charge') {
            const head = this.parts[0], z = this.chargeZone!, previous = { x: head.x, y: head.y };
            this.chargeDistance = Math.min(this.chargeLimit, this.chargeDistance + (this.current!.speed ?? 520) * dt);
            head.x = z.x + Math.cos(z.angle) * this.chargeDistance;
            head.y = z.y + Math.sin(z.angle) * this.chargeDistance;
            this.impactZone = corridor(previous, head, z.width);
            if (inDanger(this.impactZone, player))
                this.damageTarget(player, this.current!.damage, this.current!.name);
            if (this.chargeDistance >= this.chargeLimit) {
                this.impactZone = undefined;
                this.recover(this.chargeBlocked);
            }
            return;
        }
        if (this.elapsed >= .6 + (this.current!.id === 'bomb' ? (R.bombCount[this.phase - 1] - 1) * R.bombStagger : this.current!.id === 'barrage' ? 6 * R.bombStagger : 0))
            this.recover();
    }
}
