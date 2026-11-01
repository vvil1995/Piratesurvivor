import { bossPhase, pressuredAttack, movementScale, cadenceScale } from './pressure.ts';
import { isInvulnerable } from '../systems/guards.ts';
import type { Enemy, Player, Vector } from '../core/types.ts';
import type { CollisionWorld } from '../world/world.ts';
import { receivedDamage } from '../systems/stats.ts';
import { inDanger, warningStage, zoneFor, type BossAttack, type DangerZone, type Telegraph } from './telegraphs.ts';
export type BossState = 'approach' | 'preparing' | 'impact' | 'recovering' | 'stunned' | 'dead';
export interface BossProfile {
  id: string; name: string; visual: string; weapon: string; entityId: number;
  hp: number; radius: number; speed: number; engageRange: number; phaseThresholds: readonly number[];
  pursuitSprint: number; sprintAfter: number; rangedWait: number; patterns: readonly (readonly string[])[];
  stunSeconds: number; reinforcementCap: number; reinforcementCount: number; reinforcementEnemy: string; phaseCadence: readonly number[];
}
export class PatternEncounter {
  readonly body: Enemy;
  readonly profile: BossProfile; readonly attacks: readonly BossAttack[];
  constructor(profile: BossProfile, attacks: readonly BossAttack[]) {
    this.profile = profile; this.attacks = attacks;
    this.body = { active: true, id: profile.entityId, kind: 'boss', x: 384, y: 112, hp: profile.hp, maxHp: profile.hp,
      speed: profile.speed, damage: 0, xp: 0, radius: profile.radius, flash: 0 };
  }
  extraWarnings: DangerZone[] = []; extraImpacts: DangerZone[] = [];
  state: BossState = 'approach'; phase = 1; telegraph?: Telegraph; impactZone?: DangerZone;
  elapsed = 0; angle = Math.PI / 2;
  private attack?: BossAttack;
  private next = 0; private lastPhase = 1;
  private ready = new Map<string, number>();
  private hit = new Set<string>();
  private travel = 0; private travelled = 0; private blocked = false;
  private pursuit = 0;
  protected encounterPhase():number{return bossPhase(this.body.hp,this.body.maxHp,this.profile.phaseThresholds[0]);}
  get stage() { return this.telegraph ? warningStage(this.telegraph) : undefined; }
  get moveName(): string { return this.state === 'dead' ? 'VICTORIA · EMBARCANDO' : this.state === 'stunned' ? 'ATURDIT · CONTRAATACA' : this.state === 'recovering' ? 'EXPOSAT · CONTRAATACA' : this.attack?.name ?? 'APROXIMACIÓ'; }
  cancel(): void { this.telegraph = undefined; this.impactZone = undefined; this.hit.clear(); this.attack = undefined; this.fixedZone = undefined; this.extraWarnings = []; this.extraImpacts = []; }
  defeated(): void { this.body.active = false; this.state = 'dead'; this.elapsed = 0; this.cancel(); }
  // Gancho determinista para secuenciación del controlador; también permite probar cada patrón.
  prepare(attack: BossAttack, target: Vector, world: CollisionWorld): void {
    this.phase = this.encounterPhase();
    attack = pressuredAttack(attack,this.phase);
    this.attack = attack; this.elapsed = 0; this.state = 'preparing'; this.impactZone = undefined; this.hit.clear();
    const zone = zoneFor(attack, attack.targeted ? target : this.body, target);
    if (attack.animation === 'split' && (!world.canOccupy(zone.x, zone.y, this.body.radius) || !world.segmentClear(this.body.x, this.body.y, zone.x, zone.y, this.body.radius))) { zone.x = this.body.x; zone.y = this.body.y; }
    this.extraWarnings = (attack.offsets ?? []).map(offset => ({ ...zone, x: zone.x + offset.x, y: zone.y + offset.y })); this.extraImpacts = []; this.angle = zone.angle; this.travelled = 0; this.blocked = false;
    if (attack.animation === 'charge' || attack.animation === 'wave') {
      const clearance = attack.animation === 'charge' ? this.body.radius : attack.width / 2;
      const max = attack.length - (attack.animation === 'charge' ? this.body.radius : 0);
      this.travel = 0;
      for (let d = 4; d <= max; d += 4) {
        if (!world.canOccupy(zone.x + Math.cos(zone.angle) * d, zone.y + Math.sin(zone.angle) * d, clearance)) { this.blocked = true; break; }
        this.travel = d;
      }
      zone.length = this.travel + (attack.animation === 'charge' ? this.body.radius : 0);
    }
    this.telegraph = { zone, elapsed: 0, attack };
  }
  private hurt(player: Player, zone: DangerZone, world: CollisionWorld): void {
    if (this.hit.has(player.id) || !inDanger(zone, player) || this.attack?.cover && !world.segmentClear(zone.x, zone.y, player.x, player.y, 2)) return;
    this.hit.add(player.id);
    if (player.hurtTimer > 0 || isInvulnerable(player)) return;
    player.hp = Math.max(0, player.hp - receivedDamage(this.attack!.damage, player.stats.armor)); player.hurtTimer = 0.65; player.lastHit = this.attack!.name; player.damageNoticeFor = 1.2;
  }
  tick(dt: number, player: Player, world: CollisionWorld, direction: (from: Vector) => Vector, reinforce: () => void): void {
    if (player.hp <= 0) { this.cancel(); return; }
    if (!this.body.active || this.body.hp <= 0) { if (this.state !== 'dead') this.defeated(); this.elapsed += dt; return; }
    this.phase = this.encounterPhase();
    this.body.flash = Math.max(0, this.body.flash - dt);
    for (const [id, seconds] of this.ready) this.ready.set(id, Math.max(0, seconds - dt));
    this.elapsed += dt;
    if (this.state === 'approach') {
      const distance = Math.hypot(player.x - this.body.x, player.y - this.body.y);
      this.pursuit += dt;
      if (distance > this.profile.engageRange && (this.phase === 1 || this.pursuit < this.profile.rangedWait)) {
        const d = direction(this.body); this.angle = Math.atan2(d.y, d.x);
        const speed = this.pursuit > this.profile.sprintAfter ? this.profile.pursuitSprint : this.profile.speed;
        world.moveCircle(this.body, d.x * speed * movementScale(this.phase) * dt, d.y * speed * movementScale(this.phase) * dt, this.body.radius); return;
      }
      if (this.lastPhase !== this.phase) { this.next = 0; this.lastPhase = this.phase; }
      const patterns = this.profile.patterns[this.phase - 1];
      const attackId = patterns[this.next++ % patterns.length];
      let attack = this.attacks.find(a => a.id === attackId)!;
      if (attack.phase > this.phase || (this.ready.get(attack.id) ?? 0) > 0) attack = this.attacks[0];
      this.prepare(attack, player, world); return;
    }
    if (this.state === 'recovering' || this.state === 'stunned') {
      const recovery = this.state === 'stunned' ? this.profile.stunSeconds : this.attack!.recovery * (this.attack!.fixedRecovery ? 1 : this.profile.phaseCadence[this.phase - 1] * cadenceScale(this.phase));
      if (this.elapsed >= recovery) { this.state = 'approach'; this.elapsed = 0; this.pursuit = 0; this.body.statuses = undefined; this.attack = undefined; }
      return;
    }
    const attack = this.attack!, warning = this.telegraph;
    if (this.state === 'preparing') {
      warning!.elapsed = this.elapsed;
      if (this.elapsed + 1e-8 < attack.preparation) return;
      this.elapsed = 0; this.state = 'impact'; this.ready.set(attack.id, attack.cooldown);
      if (attack.animation === 'order') reinforce();
      else if (attack.animation !== 'charge' && attack.animation !== 'wave') {
        if (attack.animation === 'split') { this.body.x = warning!.zone.x; this.body.y = warning!.zone.y; }
        this.impactZone = { ...warning!.zone }; this.extraImpacts = this.extraWarnings.map(z => ({ ...z }));
        for (const zone of [this.impactZone, ...this.extraImpacts]) this.hurt(player, zone, world);
      }
      // El aviso desaparece al comenzar el impacto, conservando la geometría fijada.
      this.fixedZone = { ...warning!.zone }; this.telegraph = undefined; this.extraWarnings = [];
      return;
    }
    const zone = this.fixedZone!;
    if (attack.animation === 'charge' || attack.animation === 'wave') {
      const previous = this.travelled;
      this.travelled = Math.min(this.travel, this.travelled + (attack.speed ?? 400) * dt);
      const start = attack.animation === 'charge' ? Math.max(0, previous - this.body.radius) : previous;
      const end = Math.min(zone.length, this.travelled + (attack.animation === 'charge' ? this.body.radius : 16));
      this.impactZone = { ...zone, x: zone.x + Math.cos(zone.angle) * start, y: zone.y + Math.sin(zone.angle) * start, length: end - start };
      if (attack.animation === 'charge') {
        const destination = { x: zone.x + Math.cos(zone.angle) * this.travelled, y: zone.y + Math.sin(zone.angle) * this.travelled };
        world.moveCircle(this.body, destination.x - this.body.x, destination.y - this.body.y, this.body.radius);
      }
      this.hurt(player, this.impactZone, world);
      if (this.travelled < this.travel && this.elapsed < attack.impact) return;
    } else if (this.elapsed < attack.impact) return;
    this.state = attack.animation === 'charge' && this.blocked ? 'stunned' : 'recovering';
    this.elapsed = 0; this.impactZone = undefined; this.extraImpacts = []; this.body.statuses = { exposed: this.state === 'stunned' ? this.profile.stunSeconds : attack.recovery };
  }
  private fixedZone?: DangerZone;
}
