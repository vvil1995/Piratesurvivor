import { trainingModifiers, type CharacterTraining } from '../../content/training.ts';
import { BuggyEncounter } from '../bosses/buggy.ts';
import type { PatternEncounter } from '../bosses/pattern-encounter.ts';
import { SYRUP_VILLAGE } from '../../content/worlds/syrup-village.ts';
import { MORGAN_ROUTE } from '../../content/navigation.ts';
import { NavigationRoute } from '../systems/navigation-signal.ts';
import { ORANGE_TOWN } from '../../content/worlds/orange-town.ts';
import { ITEMS } from '../../content/items.ts';
import { replaceItem } from '../systems/items.ts';
import { MorganEncounter } from '../bosses/morgan.ts';
import { ArenaWorld, MORGAN_ARENA, BUGGY_ARENA } from '../world/arena.ts';
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
  definition: WorldDefinition;
  private readonly shellsDefinition: WorldDefinition;
  readonly route = new NavigationRoute();
  readonly buggyRoute = new NavigationRoute();
  get navigationRoute(): NavigationRoute { return this.zone === 'orange-town' ? this.buggyRoute : this.route; }
  get navigationSeconds(): number { return this.zone === 'orange-town' ? this.zoneTime : this.time; }
  get inArena(): boolean { return this.zone === 'morgan-arena' || this.zone === 'buggy-arena'; }
  get arena() { return this.world instanceof ArenaWorld ? this.world.arena : MORGAN_ARENA; }
  voyage?: { destination: 'morgan' | 'shells' | 'orange' | 'buggy' | 'orange-return' | 'syrup'; elapsed: number };
  private zoneTime = 0;
  world: ProceduralWorld;
  private shellsWorld: ProceduralWorld;
  private orangeWorld?: ProceduralWorld;
  zone: 'shells-town' | 'morgan-arena' | 'orange-town' | 'buggy-arena' | 'syrup-village' = 'shells-town';
  encounter?: PatternEncounter;
  morganDefeated = false; buggyDefeated = false;
  readonly enemies: Pool<Enemy>;
  readonly pickups: Pool<Pickup>;
  readonly projectiles = new Pool<Projectile>(PROJECTILE_CAP, () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, radius: 3, life: 0, damage: 0, hostile: false, ownerId: '', reflected: false, remainingHits: 1, hit: new Set<number>() }));
  readonly areas = new Pool<AreaEffect>(AREA_CAP, () => ({ active: false, x: 0, y: 0, ownerId: '', radius: 0, shockRadius: 0, damage: 0, knockback: 0, delay: 0, life: 0, triggered: false, evolved: false }));
  readonly chests = new ChestField();
  private chestFields = new Map<string, ChestField>([['shells-town', this.chests]]);
  get explorationChests(): ChestField | undefined {
    if (this.inArena) return;
    let field = this.chestFields.get(this.zone);
    if (!field) { field = new ChestField(); this.chestFields.set(this.zone, field); }
    return field;
  }
  get visibleChests(): readonly Enemy[] { return this.explorationChests?.active ?? []; }
  readonly grid = new SpatialGrid();
  readonly strikes: Strike[] = [];
  private bossField?: FlowField;
  private fields = new Map<string, FlowField>();
  private choicePlayerId = this.localPlayerId;
  status: RunStatus = 'playing';
  pendingAbility?: AbilityChoice;
  private combinationRewards = 0;
  private slotsBeforeLearning?: string[][];
  private selectedBeforeLearning = 0;
  get canJoinMovements(): boolean { return this.combinationRewards > 0; }
  get unionTokens(): number { return this.combinationRewards; }
  // Punto de integración futuro: solo una recompensa real de jefe debe llamar aquí.
  grantCombinationReward(): void { this.combinationRewards++; }
  bossCombinationReward = false;
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
  constructor(characterId = 'luffy', training: number | CharacterTraining = 0, random: () => number = Math.random, options: RunOptions = {}) {
    this.random = random; this.character = CHARACTERS[characterId];
    if (!this.character) throw new Error('Personaje desconocido');
    this.id = globalThis.crypto?.randomUUID?.() || `run-${Date.now()}-${random()}`;
    this.definition = options.world ?? SHELLS_TOWN; this.shellsDefinition = this.definition;
    this.world = new ProceduralWorld((options.seed ?? Math.floor(random() * 2147483647)) ^ this.definition.seedSalt);
    this.shellsWorld = this.world;
    this.enemies = new Pool<Enemy>(this.definition.enemyCap, () => ({ active: false, id: 0, x: 0, y: 0, hp: 0, maxHp: 0, speed: 0, damage: 0, xp: 0, radius: 13, flash: 0 }));
    this.pickups = new Pool<Pickup>(this.definition.pickupCap, () => ({ active: false, x: 0, y: 0, value: 0, kind: 'xp' }));
    const baseStats = { ...this.character.stats };
    const profile = typeof training === 'number' ? undefined : training;
    const modifiers = { permanent: profile ? trainingModifiers(profile) : { maxHp: Math.min(5, Math.max(0, training as number)) * 5 }, temporary: {}, items: {}, fruit: {}, buffs: {}, skills: {} };
    const stats = resolveStats(baseStats, Object.values(modifiers));
    this.players.set(this.localPlayerId, { id: this.localPlayerId, characterId, taken: {}, choices: [], attacks: [newAttack(profile?.levels.starter && profile.starter || this.character.initialAbility)], abilitySlots: [[profile?.levels.starter && profile.starter || this.character.initialAbility], [], [], []], selectedSlot: 0, learnedBuffs: [], x: 256, y: 256,
      items: {}, collectedBerries: 0, hp: stats.maxHp, stats, baseStats, modifiers, level: 1, xp: 0, xpNext: xpForLevel(1), kills: 0, hurtTimer: 0, facing: 0 });
    this.player.xpMultiplier = 1 + (profile?.levels.experience ?? 0) * .05;
    this.player.berryMultiplier = 1 + (profile?.levels.fortune ?? 0) * .08;
    this.player.rerolls = profile?.levels.rerolls ?? 0; this.player.bannedAbilities = [...(profile?.bans ?? [])];
    if (profile?.levels.repertoire && profile.second && profile.second !== this.player.attacks[0].id) improveAttack(this.player, profile.second);
    this.chests.sync(this.world, this.player);
    this.fieldFor(this.player).update(this.player, 1);
  }
  private fieldFor(actor: Player): FlowField {
    let field = this.fields.get(actor.id);
    if (!field) { field = new FlowField(this.world); this.fields.set(actor.id, field); }
    return field;
  }
  private clearBattlefield(): void {
    this.visualDeaths.length=0;
    this.enemies.clear(); this.pickups.clear(); this.projectiles.clear(); this.areas.clear(); this.strikes.length = 0;
    this.fields.clear(); this.bossField = undefined;
    for (const state of this.player.attacks) { state.pending = 0; state.targetId = undefined; }
  }
  beginMorgan(): boolean {
    if (!['playing', 'paused', 'voyage'].includes(this.status) || this.zone !== 'shells-town' || this.morganDefeated) return false;
    this.route.consume(); this.clearBattlefield();
    this.world = new ArenaWorld(this.world.seed); this.zone = 'morgan-arena'; this.bossField = new FlowField(this.world, MORGAN.radius);
    Object.assign(this.player, MORGAN_ARENA.playerSpawn); this.encounter = new MorganEncounter(); Object.assign(this.encounter.body, MORGAN_ARENA.bossSpawn);
    this.status = 'playing'; this.voyage = undefined; this.fieldFor(this.player).update(this.player, 1); return true;
  }
  beginBuggy(): boolean {
    if (!['playing', 'paused', 'voyage'].includes(this.status) || this.zone !== 'orange-town' || !this.morganDefeated || this.buggyDefeated) return false;
    this.buggyRoute.consume(); this.clearBattlefield(); this.orangeWorld = this.world;
    this.encounter = new BuggyEncounter(); this.world = new ArenaWorld(this.world.seed, BUGGY_ARENA, 'orange'); this.zone = 'buggy-arena';
    this.bossField = new FlowField(this.world, this.encounter.body.radius); Object.assign(this.player, BUGGY_ARENA.playerSpawn);
    this.status = 'playing'; this.voyage = undefined; this.fieldFor(this.player).update(this.player, 1); return true;
  }
  boardToOrangeTown(): boolean {
    if (!this.morganDefeated || this.zone === 'orange-town' || !['playing', 'paused', 'voyage'].includes(this.status)) return false;
    this.clearBattlefield(); this.encounter = undefined; this.zone = 'orange-town';
    this.lootNotice = 'Morgan derrotado · objeto de unión ganado. Toca el icono de enlaces para juntar dos ataques.'; this.lootNoticeFor = 8;
    this.definition = ORANGE_TOWN; this.zoneTime = 0; this.spawnTimer = 0; this.voyage = undefined;
    this.world = new ProceduralWorld(this.shellsWorld.seed ^ 0x42756767, 'orange'); this.orangeWorld = this.world;
    Object.assign(this.player, { x: 256, y: 256 }); this.status = 'playing'; this.fieldFor(this.player).update(this.player, 1); return true;
  }
  private startVoyage(destination: 'morgan' | 'shells' | 'orange' | 'buggy' | 'orange-return' | 'syrup'): void {
    this.encounter?.cancel(); this.clearBattlefield();
    this.voyage = { destination, elapsed: 0 }; this.status = 'voyage';
  }
  private finishVoyage(): void {
    const destination = this.voyage!.destination;
    if (destination === 'morgan') { this.beginMorgan(); return; }
    if (destination === 'buggy') { this.beginBuggy(); return; }
    if (destination === 'syrup') {
      this.clearBattlefield(); this.encounter = undefined; this.zone = 'syrup-village'; this.definition = SYRUP_VILLAGE;
      this.world = new ProceduralWorld(this.shellsWorld.seed ^ 0x4b75726f, 'syrup'); this.zoneTime = 0; this.spawnTimer = 0; this.voyage = undefined;
      Object.assign(this.player, { x: 256, y: 256 }); this.status = 'playing'; this.fieldFor(this.player).update(this.player, 1);
      this.lootNotice = 'Buggy derrotado · objeto de unión ganado. Syrup: llegada provisional; Kuro pendiente.'; this.lootNoticeFor = 8; return;
    }
    if (destination === 'orange-return') {
      this.clearBattlefield(); this.encounter = undefined; this.world = this.orangeWorld!; this.definition = ORANGE_TOWN; this.zone = 'orange-town';
      Object.assign(this.player, { x: 256, y: 256, hp: MORGAN_ROUTE.recoveryHp, hurtTimer: MORGAN_ROUTE.recoveryGrace });
      this.spawnTimer = 1; this.buggyRoute.retry(this.zoneTime, this.random); this.voyage = undefined; this.status = 'playing'; this.fieldFor(this.player).update(this.player, 1);
      this.lootNotice = 'Regresas a Orange Town con25HP y tu build. Otra carta permitirá reintentar Buggy.'; this.lootNoticeFor = 8; return;
    }
    if (destination === 'orange') { this.boardToOrangeTown(); return; }
    this.clearBattlefield(); this.encounter = undefined; this.world = this.shellsWorld;
    this.definition = this.shellsDefinition; this.zone = 'shells-town';
    Object.assign(this.player, { x: 256, y: 256, hp: MORGAN_ROUTE.recoveryHp, hurtTimer: MORGAN_ROUTE.recoveryGrace });
    this.spawnTimer = 1; this.route.retry(this.time, this.random); this.voyage = undefined;
    this.status = 'playing'; this.fieldFor(this.player).update(this.player, 1);
    this.lootNotice = 'De vuelta con25HP. Conservas tu build. Busca otra carta náutica para reintentar Morgan.'; this.lootNoticeFor = 8;
  }
  private defeatBoss(): void {
    if (this.encounter?.state === 'dead') return;
    if (this.zone === 'buggy-arena') this.buggyDefeated = true; else this.morganDefeated = true; this.encounter!.defeated(); this.enemies.clear(); this.projectiles.clear(); this.areas.clear(); this.strikes.length = 0;
    this.grantCombinationReward();
  }
  private callReinforcements(): void {
    const profile = this.encounter!.profile;
    let remaining = Math.min(profile.reinforcementCount, profile.reinforcementCap - this.enemies.count);
    const gates = [...this.arena.gates].sort((a, b) => Math.hypot(b.x - this.player.x, b.y - this.player.y) - Math.hypot(a.x - this.player.x, a.y - this.player.y));
    for (const gate of gates) {
      if (remaining <= 0) break;
      if (Math.hypot(gate.x - this.player.x, gate.y - this.player.y) < 110 || !this.world.canOccupy(gate.x, gate.y, 13)) continue;
      const enemy = this.enemies.acquire(); if (!enemy) break;
      const def = ENEMIES[profile.reinforcementEnemy];
      Object.assign(enemy, { ...def, active: true, id: ++this.enemyId, ...gate, hp: def.hp * 1.5, maxHp: def.hp * 1.5, kind: undefined, flash: 0,
        statuses: undefined, launchTime: 0, launchX: 0, launchY: 0, stolen: false, lureIndex: undefined, decoyHitTimer: 0, ranged: undefined, shotTimer: 0, targetId: undefined, steeringTime: 0, steerX: 0, steerY: 0 });
      remaining--;
    }
  }
  setView(view: View): void { this.view = view; }
  pause(): void { if (this.status === 'playing' || this.status === 'voyage') this.status = 'paused'; }
  resume(): void { if (this.status === 'paused') this.status = this.voyage ? 'voyage' : 'playing'; }
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
  rerollChoices(): boolean {
    if (this.status !== 'levelup' || (this.player.rerolls ?? 0) <= 0) return false;
    this.player.rerolls!--; this.player.choices = chooseUpgrades(this.player.taken, this.random, this.player); return true;
  }
  selectUpgrade(id: string, playerId = this.choicePlayerId): boolean {
    if (this.status !== 'levelup' || playerId !== this.choicePlayerId) return false;
    const actor = this.players.get(playerId)!;
    const upgrade = actor.choices.find(choice => choice.id === id);
    if (!upgrade || 'kind' in upgrade && !canImproveAttack(actor, upgrade.abilityId)) return false;
    if ('kind' in upgrade && !actor.attacks.some(a => a.id === upgrade.abilityId) && !hasFreeSlot(actor)) return false;
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
  private consumeCombination(): void { this.combinationRewards = Math.max(0, this.combinationRewards - 1); }
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
    updateBuffModifiers(actor);
    if (this.bossCombinationReward) { this.bossCombinationReward = false; this.startVoyage('orange'); return true; }
    this.checkLevel(); return true;
  }
  cancelCombinations(): void {
    if (this.status !== 'combining') return;
    if (this.bossCombinationReward) { this.finishCombinations(); return; }
    if (this.pendingAbility && this.slotsBeforeLearning) {
      const actor = this.players.get(this.choicePlayerId)!;
      actor.abilitySlots = this.slotsBeforeLearning; actor.selectedSlot = this.selectedBeforeLearning; updateBuffModifiers(actor);
    }
    this.slotsBeforeLearning = undefined;
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
  readonly visualDeaths: { x:number;y:number;visual:string }[] = [];
  private dropXp(enemy: Enemy, ownerId: string): void {
    if (enemy.visual?.startsWith('buggy-') && this.visualDeaths.length < 32) this.visualDeaths.push({x:enemy.x,y:enemy.y,visual:enemy.visual});
    if (enemy.kind === 'boss') { this.defeatBoss(); return; }
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
    dt = Math.min(1 / 30, Math.max(0, dt));
    if (this.status === 'voyage' && this.voyage) {
      this.voyage.elapsed += dt;
      if (this.voyage.elapsed + 1e-8 >= MORGAN_ROUTE.voyageSeconds) this.finishVoyage();
      return;
    }
    if (this.status !== 'playing') return;
    this.time += dt; this.zoneTime += dt;
    this.fruitCooldown = Math.max(0, this.fruitCooldown - dt); this.lootNoticeFor = Math.max(0, this.lootNoticeFor - dt);
    const living = [...this.players.values()].filter(actor => actor.hp > 0);
    for (const actor of living) {
      actor.damageNoticeFor = Math.max(0, (actor.damageNoticeFor ?? 0) - dt);
      tickBuffs(actor, dt); tickGuards(actor, dt);
      const axis = 'x' in movement ? actor.id === this.localPlayerId ? movement : { x: 0, y: 0 } : movement.get(actor.id) ?? { x: 0, y: 0 };
      const length = Math.max(1, Math.hypot(axis.x, axis.y));
      this.world.moveCircle(actor, axis.x / length * actor.stats.speed * dt, axis.y / length * actor.stats.speed * dt, 14);
      actor.hurtTimer = Math.max(0, actor.hurtTimer - dt);
      actor.hp = Math.min(actor.stats.maxHp, actor.hp + regenerationRate(actor.stats) * dt);
      this.fieldFor(actor).update(actor, dt);
    }
    if (!living.length) { this.defeat(); return; }
    if (this.zone === 'shells-town' && !this.morganDefeated && this.route.tick(this.time, this.player, this.world, this.random, p => this.fieldFor(this.player).reachable(p))) {
      this.startVoyage('morgan'); return;
    }
    if (this.zone === 'orange-town' && !this.buggyDefeated && this.buggyRoute.tick(this.zoneTime, this.player, this.world, this.random, p => this.fieldFor(this.player).reachable(p))) { this.startVoyage('buggy'); return; }
    const threatTime = this.zone === 'shells-town' ? this.time : this.zoneTime;
    this.spawnTimer -= dt;
    if (!this.inArena && this.spawnTimer <= 0) {
      const threat = difficultyAt(threatTime, this.definition.spawnInterval, this.definition.difficulty);
      for (let i = 0; i < threat.batch; i++) spawnEnemy(this.enemies, living, this.view, this.world, this.fieldFor(this.player), this.definition, this.random, ++this.enemyId, threatTime);
      this.spawnTimer = threat.interval;
    }
    if (this.encounter && this.encounter.state !== 'dead') {
      this.bossField!.update(this.player, dt);
      this.encounter.tick(dt, this.player, this.world, from => this.bossField!.direction(from, this.player, this.encounter!.body.radius), () => this.callReinforcements());
      if (this.player.hp <= 0) { this.defeat(); return; }
    } else if (this.encounter) {
      this.encounter.tick(dt, this.player, this.world, () => ({ x: 0, y: 0 }), () => {});
      if (this.encounter.elapsed >= 1.3) {
        if (this.zone === 'morgan-arena') { this.openCombinations(); this.bossCombinationReward = true; return; }
        this.startVoyage(this.zone === 'buggy-arena' ? 'syrup' : 'orange'); return; }
    }
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
      const firing = (enemy.statuses?.stun ?? 0) <= 0 && (enemy.statuses?.confuse ?? 0) <= 0 && enemy.ranged && aimDistance < enemy.ranged.range && this.world.segmentClear(enemy.x, enemy.y, aim.x, aim.y, 3, 'attack');
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
        if (!counterGuard(target, enemy, this.grid, this.world, e => this.dropXp(e, target.id), this.random)) { const before = target.hp; target.hp = Math.max(0, target.hp - receivedDamage(enemy.damage, target.stats.armor)); if (target.hp < before) { target.lastHit = 'CONTACTO'; target.damageNoticeFor = 1.2; } } target.hurtTimer = 0.65;
      }
    }
    if (![...this.players.values()].some(actor => actor.hp > 0)) { this.defeat(); return; }
    this.explorationChests?.sync(this.world, this.player);
    this.grid.rebuild([...this.enemies.items, ...this.visibleChests.filter(c => !c.large), ...(this.encounter?.body.active ? [this.encounter.body] : [])]);
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
        else if (pickup.kind === 'food') { actor.xp += LOOT.foodXp * (actor.xpMultiplier ?? 1); actor.hp = Math.min(actor.stats.maxHp, actor.hp + pickup.value); if (pickup.level === 6) { const cook = actor.attacks.find(a => a.id === pickup.abilityId); if (cook) cook.activeFor = 4; } }
        else if (pickup.kind === 'berry') { actor.collectedBerries += pickup.value * (actor.berryMultiplier ?? 1); actor.collectedBerries = Math.round(actor.collectedBerries * 1000) / 1000; }
        else actor.xp += pickup.value * (actor.xpMultiplier ?? 1);
        pickup.active = false;
        if (this.status === 'fruit' || this.status === 'item') break;
      }
      else if (d < actor.stats.magnet && this.world.segmentClear(pickup.x, pickup.y, actor.x, actor.y, 2)) {
        const step = Math.min(d, dt * 350); pickup.x += dx / d * step; pickup.y += dy / d * step;
      }
    }
    // Solo un cofre grande progresa a la vez; alejarse conserva su progreso.
    const large = this.status === 'playing' && this.visibleChests.find(c => c.active && c.large && Math.hypot(c.x - this.player.x, c.y - this.player.y) <= LOOT.largeOpenRadius && this.world.segmentClear(c.x, c.y, this.player.x, this.player.y, 2));
    if (large) {
      large.openProgress = Math.min(LOOT.largeOpenSeconds, (large.openProgress ?? 0) + dt);
      if (large.openProgress >= LOOT.largeOpenSeconds) { large.active = false; this.lootNotice = largeChestReward(this.pickups, large, this.player, this.random); this.lootNoticeFor = 4; }
    }
    this.checkLevel(); this.maintenance += dt;
    if (this.maintenance >= 0.5) { this.world.prune(living); this.maintenance = 0; }
  }
  private defeat(): void {
    if (this.inArena && this.encounter?.state !== 'dead') { this.startVoyage(this.zone === 'buggy-arena' ? 'orange-return' : 'shells'); return; }
    this.status = 'defeat'; this.encounter?.cancel(); this.strikes.length = 0;
    for (const p of this.projectiles.items) { p.active = false; p.hit.clear(); }
    for (const a of this.areas.items) a.active = false;
    for (const p of this.pickups.items) if (p.kind === 'food') p.active = false;
    for (const actor of this.players.values()) for (const state of actor.attacks) { state.pending = 0; state.activeFor = 0; state.activationPending = false; }
  }
  result(): RunResult | undefined {
    if (this.status !== 'defeat' && this.status !== 'victory') return;
    return { id: this.id, outcome: this.status, seconds: Math.floor(this.time), kills: this.player.kills, level: this.player.level,
      coins: Math.floor(this.player.collectedBerries) };
  }
}
