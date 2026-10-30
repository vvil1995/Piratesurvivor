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
        for (let i = 0; i < LOOT.chestsPerChunk + (seed % LOOT.largeChunkEvery === 0 ? 1 : 0); i++) {
          for (let attempt = 0; attempt < 12; attempt++) {
            const v = hash(seed, i, attempt), px = x * CHUNK_SIZE + 48 + v % 416, py = y * CHUNK_SIZE + 48 + (v >>> 12) % 416;
            if (!world.canOccupy(px, py, 18)) continue;
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
  if (pickup) { Object.assign(pickup, { x: position.x, y: position.y, ownerId, kind, value, life: kind === 'food' ? 20 : undefined, abilityId: undefined, level: undefined }); return true; }
  // Si se llena el pool, agrupar moneda/XP en otro pickup del mismo dueño.
  const existing = pool.items.find(p => p.active && p.ownerId === ownerId && p.kind === kind && Math.hypot(p.x - position.x, p.y - position.y) < 160);
  if (existing) { existing.value += value; return true; }
  return false;
}
export function chestReward(pool: Pool<Pickup>, chest: Enemy, owner: string, random: () => number): void {
  const roll = random();
  if (roll < 0.65) dropLoot(pool, chest, owner, 'berry', LOOT.chestBerryMin + Math.floor(random() * LOOT.chestBerryExtra));
  else if (roll < 0.85) dropLoot(pool, chest, owner, 'xp', LOOT.chestXp);
  else dropLoot(pool, chest, owner, 'food', LOOT.chestHeal);
}
