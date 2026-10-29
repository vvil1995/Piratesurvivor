import { CHARACTERS } from '../../content/catalog.ts';
import { SHELLS_TOWN, type WorldDefinition } from '../../content/worlds/shells-town.ts';
import type { CharacterDefinition } from '../../content/types.ts';
import { attack } from '../systems/combat.ts';
import { applyUpgrade, chooseUpgrades, xpForLevel } from '../systems/progression.ts';
import { spawnEnemy, type View } from '../systems/spawner.ts';
import { SpatialGrid } from '../spatial/grid.ts';
import { ProceduralWorld } from '../world/world.ts';
import { FlowField } from '../navigation/flow-field.ts';
import { Pool } from './pool.ts';
import type { Enemy, Pickup, Player, RunResult, RunStatus, Strike, Vector } from './types.ts';

export interface RunOptions { world?: WorldDefinition; seed?: number }
export class Run {
  readonly id: string;
  readonly localPlayerId = 'player-1';
  readonly players = new Map<string, Player>();
  readonly character: CharacterDefinition;
  readonly definition: WorldDefinition;
  readonly world: ProceduralWorld;
  readonly enemies: Pool<Enemy>;
  readonly pickups: Pool<Pickup>;
  readonly grid = new SpatialGrid();
  readonly strikes: Strike[] = [];
  private fields = new Map<string, FlowField>();
  private choicePlayerId = this.localPlayerId;
  status: RunStatus = 'playing';
  time = 0;
  private spawnTimer = 0;
  private enemyId = 0;
  private maintenance = 0;
  private random: () => number;
  private view: View = { width: 920, height: 600, centerX: 256, centerY: 256 };

  // Alias del actor local para la UI; los sistemas trabajan con actores por ID.
  get player(): Player { return this.players.get(this.localPlayerId)!; }
  get taken(): Record<string, number> { return this.player.taken; }
  get choices() { return this.players.get(this.choicePlayerId)!.choices; }
  constructor(characterId = 'luffy', training = 0, random: () => number = Math.random, options: RunOptions = {}) {
    this.random = random; this.character = CHARACTERS[characterId];
    if (!this.character) throw new Error('Personaje desconocido');
    this.id = globalThis.crypto?.randomUUID?.() || `run-${Date.now()}-${random()}`;
    this.definition = options.world ?? SHELLS_TOWN;
    this.world = new ProceduralWorld((options.seed ?? Math.floor(random() * 2147483647)) ^ this.definition.seedSalt);
    this.enemies = new Pool<Enemy>(this.definition.enemyCap, () => ({ active: false, id: 0, x: 0, y: 0, hp: 0, maxHp: 0, speed: 0, damage: 0, xp: 0, radius: 13, flash: 0 }));
    this.pickups = new Pool<Pickup>(this.definition.pickupCap, () => ({ active: false, x: 0, y: 0, value: 0 }));
    const stats = { ...this.character.stats, maxHp: this.character.stats.maxHp + Math.min(5, Math.max(0, training)) * 5 };
    this.players.set(this.localPlayerId, { id: this.localPlayerId, characterId, taken: {}, choices: [], x: 256, y: 256,
      hp: stats.maxHp, stats, level: 1, xp: 0, xpNext: xpForLevel(1), kills: 0, hurtTimer: 0, attackTimer: 0, facing: 0 });
    this.fieldFor(this.player).update(this.player, 1);
  }
  private fieldFor(actor: Player): FlowField {
    let field = this.fields.get(actor.id);
    if (!field) { field = new FlowField(this.world); this.fields.set(actor.id, field); }
    return field;
  }
  setView(view: View): void { this.view = view; }
  pause(): void { if (this.status === 'playing') this.status = 'paused'; }
  resume(): void { if (this.status === 'paused') this.status = 'playing'; }
  selectUpgrade(id: string, playerId = this.choicePlayerId): boolean {
    if (this.status !== 'levelup' || playerId !== this.choicePlayerId) return false;
    const actor = this.players.get(playerId)!;
    const upgrade = actor.choices.find(choice => choice.id === id);
    if (!upgrade) return false;
    applyUpgrade(actor, upgrade); actor.taken[id] = (actor.taken[id] || 0) + 1;
    actor.choices = []; this.status = 'playing'; this.checkLevel(); return true;
  }
  private checkLevel(): void {
    if (this.status !== 'playing') return;
    for (const actor of this.players.values()) {
      if (actor.hp <= 0 || actor.xp < actor.xpNext) continue;
      actor.xp -= actor.xpNext; actor.level++; actor.xpNext = xpForLevel(actor.level);
      actor.choices = chooseUpgrades(actor.taken, this.random); this.choicePlayerId = actor.id;
      this.status = 'levelup'; return;
    }
  }
  private dropXp(enemy: Enemy, ownerId: string): void {
    const pickup = this.pickups.acquire();
    if (pickup) { Object.assign(pickup, { x: enemy.x, y: enemy.y, value: enemy.xp, ownerId }); return; }
    let nearest: Pickup | undefined, best = Infinity;
    for (const item of this.pickups.items) {
      if (item.ownerId !== ownerId) continue;
      const d = (item.x - enemy.x) ** 2 + (item.y - enemy.y) ** 2;
      if (d < best) { best = d; nearest = item; }
    }
    if (nearest) nearest.value += enemy.xp;
  }
  update(dt: number, movement: Vector | ReadonlyMap<string, Vector>): void {
    if (this.status !== 'playing') return;
    dt = Math.min(1 / 30, Math.max(0, dt)); this.time += dt;
    const living = [...this.players.values()].filter(actor => actor.hp > 0);
    for (const actor of living) {
      const axis = 'x' in movement ? actor.id === this.localPlayerId ? movement : { x: 0, y: 0 } : movement.get(actor.id) ?? { x: 0, y: 0 };
      const length = Math.max(1, Math.hypot(axis.x, axis.y));
      this.world.moveCircle(actor, axis.x / length * actor.stats.speed * dt, axis.y / length * actor.stats.speed * dt, 14);
      actor.hurtTimer = Math.max(0, actor.hurtTimer - dt); actor.attackTimer = Math.max(0, actor.attackTimer - dt);
      actor.hp = Math.min(actor.stats.maxHp, actor.hp + 0.7 * dt);
      this.fieldFor(actor).update(actor, dt);
    }
    if (!living.length) { this.status = 'defeat'; return; }
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      spawnEnemy(this.enemies, living, this.view, this.world, this.fieldFor(this.player), this.definition, this.random, ++this.enemyId);
      this.spawnTimer = this.definition.spawnInterval;
    }
    this.grid.rebuild(this.enemies.items);
    for (const enemy of this.enemies.items) {
      if (!enemy.active) continue;
      let target = living[0], nearest = Infinity;
      for (const actor of living) { const d = Math.hypot(actor.x - enemy.x, actor.y - enemy.y); if (d < nearest) { nearest = d; target = actor; } }
      if (nearest > 1400) { enemy.active = false; continue; }
      enemy.flash = Math.max(0, enemy.flash - dt);
      enemy.steeringTime = (enemy.steeringTime ?? 0) - dt;
      if (enemy.steeringTime <= 0 || enemy.targetId !== target.id) {
        const direction = this.fieldFor(target).direction(enemy, target, enemy.radius);
        enemy.steerX = direction.x; enemy.steerY = direction.y; enemy.targetId = target.id;
        enemy.steeringTime = 0.13 + enemy.id % 5 * 0.017;
      }
      let sx = 0, sy = 0;
      this.grid.visit(enemy.x, enemy.y, 27, other => {
        if (enemy.id === other.id) return;
        const ox = enemy.x - other.x, oy = enemy.y - other.y, dd = ox * ox + oy * oy;
        if (dd > 0 && dd < 24 * 24) { const d = Math.sqrt(dd), factor = (24 - d) / d * 0.5; sx += ox * factor; sy += oy * factor; }
      });
      this.world.moveCircle(enemy, (enemy.steerX ?? 0) * enemy.speed * dt + sx * dt * 5, (enemy.steerY ?? 0) * enemy.speed * dt + sy * dt * 5, enemy.radius);
      if (Math.hypot(target.x - enemy.x, target.y - enemy.y) < enemy.radius + 14 && target.hurtTimer <= 0) {
        target.hp = Math.max(0, target.hp - enemy.damage); target.hurtTimer = 0.65;
      }
    }
    if (![...this.players.values()].some(actor => actor.hp > 0)) { this.status = 'defeat'; return; }
    this.grid.rebuild(this.enemies.items);
    for (const actor of living) {
      if (actor.hp <= 0 || actor.attackTimer > 0) continue;
      const strike = attack(actor, this.grid, CHARACTERS[actor.characterId].initialAbility, enemy => this.dropXp(enemy, actor.id), this.world);
      if (strike) { if (this.strikes.length >= 12) this.strikes.shift(); this.strikes.push(strike); }
    }
    for (let i = this.strikes.length - 1; i >= 0; i--) { this.strikes[i].life -= dt; if (this.strikes[i].life <= 0) this.strikes.splice(i, 1); }
    for (const pickup of this.pickups.items) {
      if (!pickup.active) continue;
      const actor = this.players.get(pickup.ownerId ?? this.localPlayerId);
      if (!actor || actor.hp <= 0 || Math.hypot(actor.x - pickup.x, actor.y - pickup.y) > 1700) { pickup.active = false; continue; }
      const dx = actor.x - pickup.x, dy = actor.y - pickup.y, d = Math.hypot(dx, dy);
      if (d < 20) { actor.xp += pickup.value; pickup.active = false; }
      else if (d < actor.stats.magnet && this.world.segmentClear(pickup.x, pickup.y, actor.x, actor.y, 2)) {
        const step = Math.min(d, dt * 350); pickup.x += dx / d * step; pickup.y += dy / d * step;
      }
    }
    this.checkLevel(); this.maintenance += dt;
    if (this.maintenance >= 0.5) { this.world.prune(living); this.maintenance = 0; }
  }
  result(): RunResult | undefined {
    if (this.status !== 'defeat' && this.status !== 'victory') return;
    return { id: this.id, outcome: this.status, seconds: Math.floor(this.time), kills: this.player.kills, level: this.player.level,
      coins: Math.floor(this.player.kills / 3 + this.time / 15) + (this.status === 'victory' ? 50 : 0) };
  }
}
