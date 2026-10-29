import { CHARACTERS, MARINEFORD } from '../../content/catalog.ts';
import type { UpgradeDefinition } from '../../content/types.ts';
import { attack } from '../systems/combat.ts';
import { applyUpgrade, chooseUpgrades, xpForLevel } from '../systems/progression.ts';
import { spawnMarine, type View } from '../systems/spawner.ts';
import { SpatialGrid } from '../spatial/grid.ts';
import { Pool } from './pool.ts';
import type { Enemy, Pickup, Player, RunResult, RunStatus, Strike, Vector } from './types.ts';

export class Run {
  readonly id: string;
  readonly player: Player;
  readonly character;
  readonly enemies = new Pool<Enemy>(MARINEFORD.enemyCap, () => ({ active: false, id: 0, x: 0, y: 0, hp: 0, maxHp: 0, speed: 0, damage: 0, xp: 0, radius: 13, flash: 0 }));
  readonly pickups = new Pool<Pickup>(MARINEFORD.pickupCap, () => ({ active: false, x: 0, y: 0, value: 0 }));
  readonly grid = new SpatialGrid();
  readonly taken: Record<string, number> = {};
  readonly strikes: Strike[] = [];
  choices: UpgradeDefinition[] = [];
  status: RunStatus = 'playing';
  time = 0;
  private spawnTimer = 0;
  private enemyId = 0;
  private regenTimer = 0;
  private random: () => number;
  private view: View = { width: 920, height: 600, centerX: 1200, centerY: 900 };

  constructor(characterId = 'luffy', training = 0, random: () => number = Math.random) {
    this.random = random;
    this.character = CHARACTERS[characterId];
    if (!this.character) throw new Error('Personaje desconocido');
    this.id = globalThis.crypto?.randomUUID?.() || `run-${Date.now()}-${random()}`;
    const stats = { ...this.character.stats, maxHp: this.character.stats.maxHp + Math.min(5, Math.max(0, training)) * 5 };
    this.player = { x: 1200, y: 900, hp: stats.maxHp, stats, level: 1, xp: 0, xpNext: xpForLevel(1), kills: 0, hurtTimer: 0, attackTimer: 0, facing: 0 };
  }
  setView(view: View): void { this.view = view; }
  pause(): void { if (this.status === 'playing') this.status = 'paused'; }
  resume(): void { if (this.status === 'paused') this.status = 'playing'; }
  selectUpgrade(id: string): boolean {
    if (this.status !== 'levelup') return false;
    const upgrade = this.choices.find(choice => choice.id === id);
    if (!upgrade) return false;
    applyUpgrade(this.player, upgrade);
    this.taken[id] = (this.taken[id] || 0) + 1;
    this.choices = [];
    this.status = 'playing';
    this.checkLevel();
    return true;
  }
  private checkLevel(): void {
    const p = this.player;
    if (this.status !== 'playing' || p.xp < p.xpNext) return;
    p.xp -= p.xpNext; p.level++; p.xpNext = xpForLevel(p.level);
    this.choices = chooseUpgrades(this.taken, this.random);
    this.status = 'levelup';
  }
  private dropXp(enemy: Enemy): void {
    const pickup = this.pickups.acquire();
    if (pickup) { pickup.x = enemy.x; pickup.y = enemy.y; pickup.value = enemy.xp; return; }
    // El pool lleno fusiona valor, en vez de perder XP o crear más objetos.
    let nearest = this.pickups.items[0], best = Infinity;
    for (const item of this.pickups.items) {
      const d = (item.x - enemy.x) ** 2 + (item.y - enemy.y) ** 2;
      if (d < best) { best = d; nearest = item; }
    }
    nearest.value += enemy.xp;
  }
  update(dt: number, movement: Vector): void {
    if (this.status !== 'playing') return;
    // El llamador usa pasos fijos. Limitar dt evita saltos por suspensión del navegador.
    dt = Math.min(1 / 30, Math.max(0, dt));
    this.time = Math.min(MARINEFORD.duration, this.time + dt);
    const p = this.player;
    if (this.time >= MARINEFORD.duration - 0.00001) { this.time = MARINEFORD.duration; this.status = 'victory'; return; }
    const length = Math.max(1, Math.hypot(movement.x, movement.y));
    p.x = Math.max(45, Math.min(MARINEFORD.width - 45, p.x + movement.x / length * p.stats.speed * dt));
    p.y = Math.max(150, Math.min(MARINEFORD.height - 75, p.y + movement.y / length * p.stats.speed * dt));
    p.hurtTimer = Math.max(0, p.hurtTimer - dt);
    p.attackTimer = Math.max(0, p.attackTimer - dt);
    this.regenTimer += dt;
    if (this.regenTimer >= 1) { p.hp = Math.min(p.stats.maxHp, p.hp + 0.7); this.regenTimer -= 1; }
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      spawnMarine(this.enemies, p, this.time, this.view, this.random, ++this.enemyId);
      this.spawnTimer = Math.max(0.12, 0.85 - this.time / 800);
    }
    this.grid.rebuild(this.enemies.items);
    for (const enemy of this.enemies.items) {
      if (!enemy.active) continue;
      enemy.flash = Math.max(0, enemy.flash - dt);
      const dx = p.x - enemy.x, dy = p.y - enemy.y, d = Math.hypot(dx, dy);
      // Solo separación local; sin colisiones enemigo-enemigo cuadráticas.
      let sx = 0, sy = 0;
      this.grid.visit(enemy.x, enemy.y, 27, other => {
        if (enemy.id >= other.id) return;
        const ox = enemy.x - other.x, oy = enemy.y - other.y, dd = ox * ox + oy * oy;
        if (dd > 0 && dd < 24 * 24) { const factor = (24 - Math.sqrt(dd)) / Math.sqrt(dd) * 0.5; sx += ox * factor; sy += oy * factor; other.x -= ox * factor * 0.15; other.y -= oy * factor * 0.15; }
      });
      enemy.x = Math.max(35, Math.min(MARINEFORD.width - 35, enemy.x + dx / Math.max(d, 1) * enemy.speed * dt + sx * 0.15));
      enemy.y = Math.max(135, Math.min(MARINEFORD.height - 65, enemy.y + dy / Math.max(d, 1) * enemy.speed * dt + sy * 0.15));
      if (d < enemy.radius + 14 && p.hurtTimer <= 0) { p.hp = Math.max(0, p.hp - enemy.damage); p.hurtTimer = 0.65; }
      if (Math.hypot(dx, dy) > 1300) enemy.active = false;
    }
    if (p.hp <= 0) { this.status = 'defeat'; return; }
    this.grid.rebuild(this.enemies.items);
    if (p.attackTimer <= 0) {
      const strike = attack(p, this.grid, this.character.initialAbility, enemy => this.dropXp(enemy));
      if (strike) { if (this.strikes.length >= 12) this.strikes.shift(); this.strikes.push(strike); }
    }
    for (let i = this.strikes.length - 1; i >= 0; i--) { this.strikes[i].life -= dt; if (this.strikes[i].life <= 0) this.strikes.splice(i, 1); }
    for (const pickup of this.pickups.items) {
      if (!pickup.active) continue;
      const dx = p.x - pickup.x, dy = p.y - pickup.y, d = Math.hypot(dx, dy);
      if (d < 20) { p.xp += pickup.value; pickup.active = false; }
      else if (d < p.stats.magnet) { const step = Math.min(d, dt * 350); pickup.x += dx / d * step; pickup.y += dy / d * step; }
    }
    this.checkLevel();
  }
  result(): RunResult | undefined {
    if (this.status !== 'defeat' && this.status !== 'victory') return;
    return { id: this.id, outcome: this.status, seconds: Math.floor(this.time), kills: this.player.kills, level: this.player.level,
      coins: Math.floor(this.player.kills / 3 + this.time / 15) + (this.status === 'victory' ? 50 : 0) };
  }
}
