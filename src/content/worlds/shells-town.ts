import type { DifficultyDefinition } from '../types.ts';
export interface WorldDefinition {
  id: string; name: string; subtitle: string; biome: 'naval-town';
  enemyId: string; enemyCap: number; pickupCap: number;
  difficulty?: DifficultyDefinition;
  spawnInterval: number; enemyScale: number; seedSalt: number;
}
export const SHELLS_TOWN: WorldDefinition = {
  id: 'shells-town', name: 'Shells Town', subtitle: 'Calles de la base naval', biome: 'naval-town',
  enemyId: 'marine', enemyCap: 150, pickupCap: 180,
  difficulty: { maxMinutes: 20, hpPerMinute: 0.12, damagePerMinute: 0.055, speedPerMinute: 0.012,
    spawnAcceleration: 0.23, minInterval: 0.22, batchEveryMinutes: 4, maxBatch: 3 },
  spawnInterval: 0.65, enemyScale: 1, seedSalt: 27183,
};
