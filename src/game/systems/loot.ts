import { ITEMS, ITEM_SLOTS } from '../../content/items.ts';
import { equipItem } from './items.ts';
import type { Player } from '../core/types.ts';
import { LOOT } from '../../content/loot.ts';
import type { Enemy, Pickup, Vector } from '../core/types.ts';
import type { Pool } from '../core/pool.ts';
import { CHUNK_SIZE, hash } from '../world/generator.ts';
import type { ProceduralWorld } from '../world/world.ts';

// Adaptador de objetivo destructible: reutiliza impactos, proyectiles y áreas,
// pero no participa en persecución, bajas, robo ni empujes.
export class ChestField {
  readonly active: Enemy[] = [];
  private chunks = new Map<string, Enemy[]>();
  private center = '';
  sync(world: ProceduralWorld, player: Vector): void {
    const cx = Math.floor(player.x / CHUNK_SIZE), cy = Math.floor(player.y / CHUNK_SIZE), center = `${cx},${cy}`;
    if (center === this.center) return;
    this.center = center; this.active.length = 0;
    for (let y = cy - 1; y <= cy + 1; y++) for (let x = cx - 1; x <= cx + 1; x++) {
      const key = `${x},${y}`;
      let chests = this.chunks.get(key);
      if (!chests) {
        // Límite de memoria explícito; nunca borrar el historial y regenerar botín.
        if (this.chunks.size >= LOOT.maxRememberedChunks) continue;
        chests = [];
        const seed = hash(world.seed, x, y);
        for (let i = 0; i < 2; i++) {
          const roll = hash(seed, i, 773);
          if (roll % (i === 0 ? LOOT.smallChunkEvery : LOOT.largeChunkEvery) !== 0) continue;
          for (let attempt = 0; attempt < 12; attempt++) {
            const v = hash(seed, i, attempt), px = x * CHUNK_SIZE + 48 + v % 416, py = y * CHUNK_SIZE + 48 + (v >>> 12) % 416;
            if (Math.hypot(px - 256, py - 256) < 100 || !world.canOccupy(px, py, 18) || chests.some(c => Math.hypot(c.x - px, c.y - py) < 90)) continue;
            chests.push({ active: true, id: -(this.chunks.size * 2 + i + 1), kind: 'chest', large: i > 0, openProgress: 0,
              x: px, y: py, hp: LOOT.chestHp, maxHp: LOOT.chestHp, speed: 0, damage: 0, xp: 0, radius: 14, flash: 0 }); break;
          }
        }
        this.chunks.set(key, chests);
      }
      this.active.push(...chests);
    }
  }
}
export function dropLoot(pool: Pool<Pickup>, position: Vector, ownerId: string, kind: 'berry' | 'xp' | 'food', value: number): boolean {
  const pickup = pool.acquire();
  if (pickup) { Object.assign(pickup, { x: position.x, y: position.y, ownerId, kind, value, life: kind === 'food' ? 20 : undefined, abilityId: undefined, level: undefined, fruitId: undefined }); return true; }
  // Si se llena el pool, agrupar moneda/XP en otro pickup del mismo dueño.
  const existing = pool.items.find(p => p.active && p.ownerId === ownerId && p.kind === kind && Math.hypot(p.x - position.x, p.y - position.y) < 160);
  if (existing) { existing.value += value; return true; }
  return false;
}
export function chestReward(pool: Pool<Pickup>, chest: Enemy, owner: string, random: () => number): void {
  dropLoot(pool, { x: chest.x - 12, y: chest.y }, owner, 'berry', LOOT.chestBerryMin + Math.floor(random() * LOOT.chestBerryExtra));
  dropLoot(pool, { x: chest.x + 12, y: chest.y }, owner, 'xp', LOOT.chestXp);
  if (random() < LOOT.chestFoodChance) dropLoot(pool, { x: chest.x, y: chest.y + 16 }, owner, 'food', LOOT.chestHeal);
}
export function largeChestReward(pool: Pool<Pickup>, chest: Enemy, player: Player, random: () => number): string {
  dropLoot(pool, { x: chest.x - 18, y: chest.y }, player.id, 'berry', LOOT.largeBerries + Math.floor(random() * LOOT.largeBerryExtra));
  dropLoot(pool, { x: chest.x + 18, y: chest.y }, player.id, 'xp', LOOT.largeXp);
  let notice = 'Cofre: berries y experiencia en el suelo';
  if (random() < LOOT.largeItemChance) {
    const available = Object.keys(player.items).length < ITEM_SLOTS ? Object.keys(ITEMS).filter(id => !player.items[id]) : [];
    const id = available[Math.min(available.length - 1, Math.floor(random() * available.length))];
    if (id && equipItem(player, id)) notice += ` · ${ITEMS[id].name}`;
    else dropLoot(pool, chest, player.id, 'berry', 5);
  }
  if (random() < LOOT.largeFruitChance) {
    const fruit = pool.acquire();
    if (fruit) Object.assign(fruit, { x: chest.x, y: chest.y - 24, ownerId: player.id, kind: 'fruit', fruitId: 'bomu', value: 0, life: undefined, abilityId: undefined, level: undefined });
  }
  return notice;
}
