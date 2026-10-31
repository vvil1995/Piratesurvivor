import { ITEMS } from '../../content/items.ts';
import { replaceItem } from '../systems/items.ts';
import { MorganEncounter } from '../bosses/morgan.ts';
import { ArenaWorld, MORGAN_ARENA } from '../world/arena.ts';
import { MORGAN } from '../../content/bosses/morgan.ts';
import { ENEMIES } from '../../content/catalog.ts';
import { FRUITS } from '../../content/fruits.ts';
import { LOOT } from '../../content/loot.ts';
import { ChestField, chestReward, dropLoot, largeChestReward } from '../systems/loot.ts';
import { CHARACTERS } from '../../content/catalog.ts';
import { SHELLS_TOWN, type WorldDefinition } from '../../content/worlds/shells-town.ts';
import type { AbilityChoice, CharacterDefinition } from '../../content/types.ts';
import { receivedDamage, regenerationRate, resolveStats } from '../systems/stats.ts';
import { difficultyAt } from '../systems/difficulty.ts';
import { tickStatus } from '../systems/status.ts';
import { counterGuard, tickGuards, isInvulnerable } from '../systems/guards.ts';
import { AREA_CAP, PROJECTILE_CAP, queueImpact, spawnProjectile, tickEffects } from '../systems/effects.ts';
import { tickBuffs, updateBuffModifiers } from '../systems/buffs.ts';
import { tickAttacks } from '../systems/combat.ts';
import { applyUpgrade, chooseUpgrades, xpForLevel } from '../systems/progression.ts';
import { spawnEnemy, type View } from '../systems/spawner.ts';
import { SpatialGrid } from '../spatial/grid.ts';
import { ProceduralWorld } from '../world/world.ts';
import { FlowField } from '../navigation/flow-field.ts';
import { Pool } from './pool.ts';
import { canImproveAttack, hasFreeSlot, improveAttack, mergeSlots, moveAbility, newAttack, selectSlot } from '../systems/loadout.ts';
import type { AreaEffect, Projectile, Enemy, Pickup, Player, RunResult, RunStatus, Strike, Vector } from './types.ts';

export interface RunOptions { world?: WorldDefinition; seed?: number }
export class Run {
  readonly id: string;
  readonly localPlayerId = 'player-1';
  readonly players = new Map<string, Player>();
  readonly character: CharacterDefinition;
  readonly definition: WorldDefinition;
  world: ProceduralWorld;
  private shellsWorld: ProceduralWorld;
  private returnPosition: Vector = { x: 256, y: 256 };
  zone: 'shells-town' | 'morgan-arena' | 'orange-town' = 'shells-town';
  encounter?: MorganEncounter;
  morganDefeated = false;
  readonly enemies: Pool<Enemy>;
  readonly pickups: Pool<Pickup>;
  readonly projectiles = new Pool<Projectile>(PROJECTILE_CAP, () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, radius: 3, life: 0, damage: 0, hostile: false, ownerId: '', reflected: false, remainingHits: 1, hit: new Set<number>() }));
  readonly areas = new Pool<AreaEffect>(AREA_CAP, () => ({ active: false, x: 0, y: 0, ownerId: '', radius: 0, shockRadius: 0, damage: 0, knockback: 0, delay: 0, life: 0, triggered: false, evolved: false }));
  readonly chests = new ChestField();
  readonly grid = new SpatialGrid();
  readonly strikes: Strike[] = [];
  private bossField?: FlowField;
  private fields = new Map<string, FlowField>();
  private choicePlayerId = this.localPlayerId;
  status: RunStatus = 'playing';
  pendingAbility?: AbilityChoice;
  private combinationRewards = 0;
  private pendingCombinationUsed = false;
  private slotsBeforeLearning?: string[][];
  private selectedBeforeLearning = 0;
  get canJoinMovements(): boolean { return !!this.pendingAbility && !this.pendingCombinationUsed || this.combinationRewards > 0; }
  // Punto de integración futuro: solo una recompensa real de jefe debe llamar aquí.
  grantCombinationReward(): void { this.combinationRewards++; }
  private combinationOrigin: 'playing' | 'paused' | 'levelup' = 'playing';
  pendingItem?: string;
  pendingFruit?: string;
  lootNotice = ''; lootNoticeFor = 0;
  private fruitCooldown = 0;
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
    this.shellsWorld = this.world;
    this.enemies = new Pool<Enemy>(this.definition.enemyCap, () => ({ active: false, id: 0, x: 0, y: 0, hp: 0, maxHp: 0, speed: 0, damage: 0, xp: 0, radius: 13, flash: 0 }));
    this.pickups = new Pool<Pickup>(this.definition.pickupCap, () => ({ active: false, x: 0, y: 0, value: 0, kind: 'xp' }));
    const baseStats = { ...this.character.stats };
    const modifiers = { permanent: { maxHp: Math.min(5, Math.max(0, training)) * 5 }, temporary: {}, items: {}, fruit: {}, buffs: {}, skills: {} };
    const stats = resolveStats(baseStats, Object.values(modifiers));
    this.players.set(this.localPlayerId, { id: this.localPlayerId, characterId, taken: {}, choices: [], attacks: [newAttack(this.character.initialAbility)], abilitySlots: [[this.character.initialAbility], [], [], []], selectedSlot: 0, learnedBuffs: [], x: 256, y: 256,
      items: {}, collectedBerries: 0, hp: stats.maxHp, stats, baseStats, modifiers, level: 1, xp: 0, xpNext: xpForLevel(1), kills: 0, hurtTimer: 0, facing: 0 });
    this.chests.sync(this.world, this.player);
    this.fieldFor(this.player).update(this.player, 1);
  }
  private fieldFor(actor: Player): FlowField {
    let field = this.fields.get(actor.id);
    if (!field) { field = new FlowField(this.world); this.fields.set(actor.id, field); }
    return field;
  }
  get navigationPoint(): Vector { return this.zone === 'morgan-arena' ? MORGAN_ARENA.gates[3] : this.returnPosition; }
  private clearBattlefield(): void {
    this.enemies.clear(); this.pickups.clear(); this.projectiles.clear(); this.areas.clear(); this.strikes.length = 0;
    this.fields.clear(); this.bossField = undefined;
    for (const state of this.player.attacks) { state.pending = 0; state.targetId = undefined; }
  }
  beginMorgan(): boolean {
    if (!['playing', 'paused'].includes(this.status) || this.zone !== 'shells-town' || this.morganDefeated) return false;
    this.returnPosition = { x: this.player.x, y: this.player.y }; this.clearBattlefield();
    this.world = new ArenaWorld(this.world.seed); this.zone = 'morgan-arena'; this.bossField = new FlowField(this.world, MORGAN.radius);
    Object.assign(this.player, MORGAN_ARENA.playerSpawn); this.encounter = new MorganEncounter();
    this.status = 'playing'; this.fieldFor(this.player).update(this.player, 1); return true;
  }
  returnToShells(): boolean {
    if (!this.morganDefeated || this.zone !== 'morgan-arena' || !['playing', 'paused'].includes(this.status)) return false;
    this.clearBattlefield(); this.encounter = undefined; this.world = this.shellsWorld; this.zone = 'shells-town';
    Object.assign(this.player, this.returnPosition); this.status = 'playing'; this.fieldFor(this.player).update(this.player, 1); return true;
  }
  boardToOrangeTown(): boolean {
    if (!this.morganDefeated || this.zone === 'orange-town' || !['playing', 'paused'].includes(this.status)) return false;
    this.clearBattlefield(); this.encounter = undefined; this.zone = 'orange-town';
    this.world = new ProceduralWorld(this.shellsWorld.seed ^ 0x42756767, 'orange');
    Object.assign(this.player, { x: 256, y: 256 }); this.status = 'playing'; this.fieldFor(this.player).update(this.player, 1); return true;
  }
  private defeatMorgan(): void {
    if (this.morganDefeated) return;
    this.morganDefeated = true; this.encounter!.defeated(); this.enemies.clear(); this.projectiles.clear(); this.areas.clear(); this.strikes.length = 0;
    this.grantCombinationReward();
  }
  private callReinforcements(): void {
    let remaining = Math.min(MORGAN.reinforcementCount, MORGAN.reinforcementCap - this.enemies.count);
    const gates = [...MORGAN_ARENA.gates].sort((a, b) => Math.hypot(b.x - this.player.x, b.y - this.player.y) - Math.hypot(a.x - this.player.x, a.y - this.player.y));
    for (const gate of gates) {
      if (remaining <= 0) break;
      if (Math.hypot(gate.x - this.player.x, gate.y - this.player.y) < 110 || !this.world.canOccupy(gate.x, gate.y, 13)) continue;
      const enemy = this.enemies.acquire(); if (!enemy) break;
      const def = ENEMIES.marine;
      Object.assign(enemy, { ...def, active: true, id: ++this.enemyId, ...gate, hp: def.hp * 1.5, maxHp: def.hp * 1.5, kind: undefined, flash: 0,
        statuses: undefined, launchTime: 0, launchX: 0, launchY: 0, stolen: false, lureIndex: undefined, decoyHitTimer: 0, ranged: undefined, shotTimer: 0, targetId: undefined, steeringTime: 0, steerX: 0, steerY: 0 });
      remaining--;
    }
  }
  setView(view: View): void { this.view = view; }
  pause(): void { if (this.status === 'playing') this.status = 'paused'; }
  resume(): void { if (this.status === 'paused') this.status = 'playing'; }
  selectItem(replace: boolean): boolean {
    if (this.status !== 'item' || !this.pendingItem || !ITEMS[this.pendingItem]) return false;
    if (replace && !replaceItem(this.player, this.pendingItem)) return false;
    this.pendingItem = undefined; this.status = 'playing'; this.checkLevel(); return true;
  }
  selectFruit(replace: boolean): boolean {
    if (this.status !== 'fruit' || !this.pendingFruit || !FRUITS[this.pendingFruit]) return false;
    if (replace) { if (this.player.fruit !== this.pendingFruit) this.fruitCooldown = 0; this.player.fruit = this.pendingFruit; }
    this.pendingFruit = undefined; this.status = 'playing'; this.checkLevel(); return true;
  }
  selectSlot(slot: number): boolean {
    if (this.status !== 'playing' || !selectSlot(this.player, slot)) return false;
    for (let i = this.strikes.length - 1; i >= 0; i--) if (this.strikes[i].ownerId === this.player.id) this.strikes.splice(i, 1);
    tickBuffs(this.player, 0); tickGuards(this.player, 0); return true;
  }
  selectUpgrade(id: string, playerId = this.choicePlayerId): boolean {
    if (this.status !== 'levelup' || playerId !== this.choicePlayerId) return false;
    const actor = this.players.get(playerId)!;
    const upgrade = actor.choices.find(choice => choice.id === id);
    if (!upgrade || 'kind' in upgrade && !canImproveAttack(actor, upgrade.abilityId)) return false;
    if ('kind' in upgrade && !actor.attacks.some(a => a.id === upgrade.abilityId) && !hasFreeSlot(actor)) {
      this.slotsBeforeLearning = actor.abilitySlots.map(slot => [...slot]); this.selectedBeforeLearning = actor.selectedSlot; this.pendingCombinationUsed = false;
      this.pendingAbility = upgrade; this.combinationOrigin = 'levelup'; this.status = 'combining'; return true;
    }
    applyUpgrade(actor, upgrade); actor.taken[id] = (actor.taken[id] || 0) + 1;
    actor.choices = []; this.status = 'playing'; this.checkLevel(); return true;
  }
  openCombinations(): boolean {
    if (this.status !== 'playing' && this.status !== 'paused') return false;
    this.combinationOrigin = this.status; this.pendingAbility = undefined; this.status = 'combining'; return true;
  }
  joinPair(first: number | 'pending', second: number | 'pending'): boolean {
    if (this.status !== 'combining' || !this.canJoinMovements || first === second) return false;
    const p = this.player;
    if (first === 'pending' || second === 'pending') {
      const target = first === 'pending' ? second : first;
      if (target === 'pending' || !Number.isInteger(target) || !this.pendingAbility || !p.abilitySlots[target]?.length || p.abilitySlots[target].length >= 4) return false;
      return this.finishCombinations(target);
    }
    if (!Number.isInteger(first) || !Number.isInteger(second) || !p.abilitySlots[first]?.length || !p.abilitySlots[second]?.length || p.abilitySlots[first].length + p.abilitySlots[second].length > 4) return false;
    if (!this.combine(first, second)) return false;
    return this.finishCombinations();
  }
  combine(from: number, to: number): boolean {
    if (this.status !== 'combining' || !this.canJoinMovements) return false;
    const actor = this.players.get(this.choicePlayerId)!;
    const changed = mergeSlots(actor, from, to); if (changed) { this.consumeCombination(); updateBuffModifiers(actor); } return changed;
  }
  moveComponent(id: string, to: number): boolean {
    if (this.status !== 'combining') return false;
    const actor = this.players.get(this.choicePlayerId)!;
    const joining = (actor.abilitySlots[to]?.length ?? 0) > 0;
    if (joining && !this.canJoinMovements) return false;
    const changed = moveAbility(actor, id, to); if (changed) { if (joining) this.consumeCombination(); updateBuffModifiers(actor); } return changed;
  }
  private consumeCombination(): void {
    if (this.pendingAbility && !this.pendingCombinationUsed) this.pendingCombinationUsed = true;
    else this.combinationRewards = Math.max(0, this.combinationRewards - 1);
  }
  finishCombinations(joinSlot?: number): boolean {
    if (this.status !== 'combining') return false;
    const actor = this.players.get(this.choicePlayerId)!;
    if (this.pendingAbility) {
      if (joinSlot !== undefined && (!this.canJoinMovements || !actor.abilitySlots[joinSlot]?.length)) return false;
      if (!improveAttack(actor, this.pendingAbility.abilityId, joinSlot)) return false;
      if (joinSlot !== undefined) this.consumeCombination();
      actor.taken[this.pendingAbility.id] = (actor.taken[this.pendingAbility.id] ?? 0) + 1;
      this.pendingAbility = undefined; this.slotsBeforeLearning = undefined; actor.choices = []; this.status = 'playing';
    } else this.status = this.combinationOrigin === 'paused' ? 'paused' : 'playing';
    updateBuffModifiers(actor); this.checkLevel(); return true;
  }
  cancelCombinations(): void {
    if (this.status !== 'combining') return;
    if (this.pendingAbility && this.slotsBeforeLearning) {
      const actor = this.players.get(this.choicePlayerId)!;
      actor.abilitySlots = this.slotsBeforeLearning; actor.selectedSlot = this.selectedBeforeLearning; updateBuffModifiers(actor);
    }
    this.slotsBeforeLearning = undefined; this.pendingCombinationUsed = false;
    this.pendingAbility = undefined; this.status = this.combinationOrigin;
  }
  private checkLevel(): void {
    if (this.status !== 'playing') return;
    for (const actor of this.players.values()) {
      if (actor.hp <= 0 || actor.xp < actor.xpNext) continue;
      actor.xp -= actor.xpNext; actor.level++; actor.xpNext = xpForLevel(actor.level);
      actor.choices = chooseUpgrades(actor.taken, this.random, actor); this.choicePlayerId = actor.id;
      this.status = 'levelup'; return;
    }
  }
  private dropXp(enemy: Enemy, ownerId: string): void {
    if (enemy.kind === 'boss') { this.defeatMorgan(); return; }
    if (enemy.kind === 'chest') { chestReward(this.pickups, enemy, ownerId, this.random); return; }
    const owner = this.players.get(ownerId), fruit = owner?.fruit ? FRUITS[owner.fruit] : undefined;
    if (owner && fruit && this.fruitCooldown <= 0) { this.fruitCooldown = fruit.cooldown; queueImpact(this, owner, enemy.x, enemy.y, fruit.radius, owner.stats.damage * fruit.damage, 0.12, 'bomu-explosion'); }
    if (this.random() < LOOT.enemyFoodChance) dropLoot(this.pickups, { x: enemy.x, y: enemy.y + 16 }, ownerId, 'food', LOOT.enemyFoodHeal);
    if (this.random() < LOOT.enemyBerryChance) dropLoot(this.pickups, enemy, ownerId, 'berry', LOOT.enemyBerries);
    const pickup = this.pickups.acquire();
    if (pickup) { Object.assign(pickup, { x: enemy.x, y: enemy.y, value: enemy.xp, ownerId, kind: 'xp', abilityId: undefined, life: undefined, level: undefined, fruitId: undefined, itemId: undefined }); return; }
    let nearest: Pickup | undefined, best = Infinity;
    for (const item of this.pickups.items) {
      if (item.ownerId !== ownerId || item.kind && item.kind !== 'xp') continue;
      const d = (item.x - enemy.x) ** 2 + (item.y - enemy.y) ** 2;
      if (d < best) { best = d; nearest = item; }
    }
    if (nearest) nearest.value += enemy.xp;
  }
  update(dt: number, movement: Vector | ReadonlyMap<string, Vector>): void {
    if (this.status !== 'playing') return;
    dt = Math.min(1 / 30, Math.max(0, dt)); this.time += dt;
    this.fruitCooldown = Math.max(0, this.fruitCooldown - dt); this.lootNoticeFor = Math.max(0, this.lootNoticeFor - dt);
    const living = [...this.players.values()].filter(actor => actor.hp > 0);
    for (const actor of living) {
      tickBuffs(actor, dt); tickGuards(actor, dt);
      const axis = 'x' in movement ? actor.id === this.localPlayerId ? movement : { x: 0, y: 0 } : movement.get(actor.id) ?? { x: 0, y: 0 };
      const length = Math.max(1, Math.hypot(axis.x, axis.y));
      this.world.moveCircle(actor, axis.x / length * actor.stats.speed * dt, axis.y / length * actor.stats.speed * dt, 14);
      actor.hurtTimer = Math.max(0, actor.hurtTimer - dt);
      actor.hp = Math.min(actor.stats.maxHp, actor.hp + regenerationRate(actor.stats) * dt);
      this.fieldFor(actor).update(actor, dt);
    }
    if (!living.length) { this.defeat(); return; }
    this.spawnTimer -= dt;
    if (this.zone === 'shells-town' && this.spawnTimer <= 0) {
      const threat = difficultyAt(this.time, this.definition.spawnInterval, this.definition.difficulty);
      for (let i = 0; i < threat.batch; i++) spawnEnemy(this.enemies, living, this.view, this.world, this.fieldFor(this.player), this.definition, this.random, ++this.enemyId, this.time);
      this.spawnTimer = threat.interval;
    }
    if (this.encounter && !this.morganDefeated) {
      this.bossField!.update(this.player, dt);
      this.encounter.tick(dt, this.player, this.world, from => this.bossField!.direction(from, this.player, MORGAN.radius), () => this.callReinforcements());
      if (this.player.hp <= 0) { this.defeat(); return; }
    } else if (this.encounter) this.encounter.tick(dt, this.player, this.world, () => ({ x: 0, y: 0 }), () => {});
    this.grid.rebuild(this.enemies.items);
    for (const enemy of this.enemies.items) {
      if (!enemy.active) continue;
      let target = living[0], nearest = Infinity;
      for (const actor of living) { const d = Math.hypot(actor.x - enemy.x, actor.y - enemy.y); if (d < nearest) { nearest = d; target = actor; } }
      if (nearest > 1400) { enemy.active = false; continue; }
      tickStatus(enemy, dt);
      enemy.flash = Math.max(0, enemy.flash - dt);
      enemy.steeringTime = (enemy.steeringTime ?? 0) - dt;
      if (enemy.steeringTime <= 0 || enemy.targetId !== target.id) {
        const direction = this.fieldFor(target).direction(enemy, target, enemy.radius);
        enemy.lureIndex = undefined;
        if (nearest > 80) {
          let best = Math.min(240, nearest + 40);
          for (let index = 0; index < this.areas.items.length; index++) {
            const lure = this.areas.items[index], d = Math.hypot(lure.x - enemy.x, lure.y - enemy.y);
            if (lure.active && lure.kind === 'decoy' && d < best && this.world.segmentClear(enemy.x, enemy.y, lure.x, lure.y, enemy.radius)) {
              best = d; enemy.lureIndex = index; const length = Math.max(1, d); direction.x = (lure.x - enemy.x) / length; direction.y = (lure.y - enemy.y) / length;
            }
          }
        }
        enemy.steerX = direction.x; enemy.steerY = direction.y; enemy.targetId = target.id;
        enemy.steeringTime = 0.13 + enemy.id % 5 * 0.017;
      }
      let sx = 0, sy = 0;
      this.grid.visit(enemy.x, enemy.y, 27, other => {
        if (enemy.id === other.id) return;
        const ox = enemy.x - other.x, oy = enemy.y - other.y, dd = ox * ox + oy * oy;
        if (dd > 0 && dd < 24 * 24) { const d = Math.sqrt(dd), factor = (24 - d) / d * 0.5; sx += ox * factor; sy += oy * factor; }
      });
      const frozen = (enemy.statuses?.root ?? 0) > 0 || (enemy.statuses?.stun ?? 0) > 0;
      const lure = enemy.lureIndex !== undefined ? this.areas.items[enemy.lureIndex] : undefined;
      const aim = lure?.active && lure.kind === 'decoy' ? lure : target;
      const aimDistance = Math.hypot(aim.x - enemy.x, aim.y - enemy.y);
      const firing = (enemy.statuses?.stun ?? 0) <= 0 && (enemy.statuses?.confuse ?? 0) <= 0 && enemy.ranged && aimDistance < enemy.ranged.range && this.world.segmentClear(enemy.x, enemy.y, aim.x, aim.y, 3);
      const chase = firing ? nearest < 110 ? -1 : 0 : 1;
      let steerX = enemy.steerX ?? 0, steerY = enemy.steerY ?? 0;
      if ((enemy.statuses?.confuse ?? 0) > 0) { const turn = Math.sin(this.time * 3 + enemy.id) * 1.5, c = Math.cos(turn), s = Math.sin(turn); [steerX, steerY] = [steerX * c - steerY * s, steerX * s + steerY * c]; }
      const speed = enemy.speed * ((enemy.statuses?.slow ?? 0) > 0 ? 0.6 : 1);
      const launched = (enemy.launchTime ?? 0) > 0;
      if (launched) { this.world.moveCircle(enemy, (enemy.launchX ?? 0) * dt, (enemy.launchY ?? 0) * dt, enemy.radius); enemy.launchTime = Math.max(0, enemy.launchTime! - dt); }
      else this.world.moveCircle(enemy, frozen ? 0 : steerX * speed * dt * chase + sx * dt * 5, frozen ? 0 : steerY * speed * dt * chase + sy * dt * 5, enemy.radius);
      enemy.decoyHitTimer = Math.max(0, (enemy.decoyHitTimer ?? 0) - dt);
      if (aim !== target && aimDistance < enemy.radius + (lure?.radius ?? 0) && enemy.decoyHitTimer <= 0) { lure!.hp = (lure!.hp ?? 0) - enemy.damage; enemy.decoyHitTimer = 0.8; }
      if (enemy.ranged) {
        enemy.shotTimer = Math.max(0, (enemy.shotTimer ?? 0) - dt);
        if (!launched && firing && enemy.shotTimer <= 0 && spawnProjectile(this, enemy.x, enemy.y, aim.x, aim.y, enemy.damage, enemy.ranged.speed, '', true)) enemy.shotTimer = enemy.ranged.interval;
      }
      if (!launched && !isInvulnerable(target) && (enemy.statuses?.stun ?? 0) <= 0 && Math.hypot(target.x - enemy.x, target.y - enemy.y) < enemy.radius + 14 && target.hurtTimer <= 0) {
        if (!counterGuard(target, enemy, this.grid, this.world, e => this.dropXp(e, target.id), this.random)) target.hp = Math.max(0, target.hp - receivedDamage(enemy.damage, target.stats.armor)); target.hurtTimer = 0.65;
      }
    }
    if (![...this.players.values()].some(actor => actor.hp > 0)) { this.defeat(); return; }
    if (this.zone === 'shells-town') this.chests.sync(this.world, this.player);
    this.grid.rebuild([...this.enemies.items, ...(this.zone === 'shells-town' ? this.chests.active.filter(c => !c.large) : []), ...(this.encounter?.body.active ? [this.encounter.body] : [])]);
    for (const actor of living) {
      if (actor.hp <= 0) continue;
      tickAttacks(actor, this.grid, this.world, dt, enemy => this.dropXp(enemy, actor.id), strike => {
        if (this.strikes.length >= 12) this.strikes.shift(); this.strikes.push(strike);
      }, this.random, this);
    }
    tickEffects(this, this.players, this.grid, this.world, dt, (enemy, owner) => this.dropXp(enemy, owner), this.random);
    if (![...this.players.values()].some(actor => actor.hp > 0)) { this.defeat(); return; }
    for (let i = this.strikes.length - 1; i >= 0; i--) { this.strikes[i].life -= dt; if (this.strikes[i].life <= 0) this.strikes.splice(i, 1); }
    for (const pickup of this.pickups.items) {
      if (!pickup.active) continue;
      if (pickup.kind === 'food') { pickup.life = (pickup.life ?? 8) - dt; if (pickup.life <= 0) { pickup.active = false; continue; } }
      const actor = this.players.get(pickup.ownerId ?? this.localPlayerId);
      if (!actor || actor.hp <= 0 || Math.hypot(actor.x - pickup.x, actor.y - pickup.y) > 1700) { pickup.active = false; continue; }
      const dx = actor.x - pickup.x, dy = actor.y - pickup.y, d = Math.hypot(dx, dy);
      if (d < 20) {
        if (pickup.kind === 'item' && pickup.itemId && ITEMS[pickup.itemId]) { this.pendingItem = pickup.itemId; this.status = 'item'; }
        else if (pickup.kind === 'fruit' && pickup.fruitId && FRUITS[pickup.fruitId]) { this.pendingFruit = pickup.fruitId; this.status = 'fruit'; }
        else if (pickup.kind === 'food') { actor.xp += LOOT.foodXp; actor.hp = Math.min(actor.stats.maxHp, actor.hp + pickup.value); if (pickup.level === 6) { const cook = actor.attacks.find(a => a.id === pickup.abilityId); if (cook) cook.activeFor = 4; } }
        else if (pickup.kind === 'berry') actor.collectedBerries += pickup.value;
        else actor.xp += pickup.value;
        pickup.active = false;
        if (this.status === 'fruit' || this.status === 'item') break;
      }
      else if (pickup.kind !== 'food' && d < actor.stats.magnet && this.world.segmentClear(pickup.x, pickup.y, actor.x, actor.y, 2)) {
        const step = Math.min(d, dt * 350); pickup.x += dx / d * step; pickup.y += dy / d * step;
      }
    }
    // Solo un cofre grande progresa a la vez; alejarse conserva su progreso.
    const large = this.status === 'playing' && this.zone === 'shells-town' && this.chests.active.find(c => c.active && c.large && Math.hypot(c.x - this.player.x, c.y - this.player.y) <= LOOT.largeOpenRadius && this.world.segmentClear(c.x, c.y, this.player.x, this.player.y, 2));
    if (large) {
      large.openProgress = Math.min(LOOT.largeOpenSeconds, (large.openProgress ?? 0) + dt);
      if (large.openProgress >= LOOT.largeOpenSeconds) { large.active = false; this.lootNotice = largeChestReward(this.pickups, large, this.player, this.random); this.lootNoticeFor = 4; }
    }
    this.checkLevel(); this.maintenance += dt;
    if (this.maintenance >= 0.5) { this.world.prune(living); this.maintenance = 0; }
  }
  private defeat(): void {
    this.status = 'defeat'; this.encounter?.cancel(); this.strikes.length = 0;
    for (const p of this.projectiles.items) { p.active = false; p.hit.clear(); }
    for (const a of this.areas.items) a.active = false;
    for (const p of this.pickups.items) if (p.kind === 'food') p.active = false;
    for (const actor of this.players.values()) for (const state of actor.attacks) { state.pending = 0; state.activeFor = 0; state.activationPending = false; }
  }
  result(): RunResult | undefined {
    if (this.status !== 'defeat' && this.status !== 'victory') return;
    return { id: this.id, outcome: this.status, seconds: Math.floor(this.time), kills: this.player.kills, level: this.player.level,
      coins: this.player.collectedBerries };
  }
}
