import type { DifficultyDefinition } from '../types.ts';
export interface WorldDefinition {
  id: string; name: string; subtitle: string; biome: 'naval-town';
  enemyId: string; enemyVariants?: readonly { id: string; weight: number; minSeconds: number }[]; enemyCap: number; pickupCap: number;
  difficulty?: DifficultyDefinition;
  spawnInterval: number; enemyScale: number; seedSalt: number;
  xpMultiplier?: number; xpThreatScaling?: number;
}
export const SHELLS_TOWN: WorldDefinition = {
  id: 'shells-town', name: 'Shells Town', subtitle: 'Calles de la base naval', biome: 'naval-town',
  enemyId: 'marine', enemyVariants: [{ id: 'marine', weight: 0.8, minSeconds: 0 }, { id: 'marine-rifle', weight: 0.2, minSeconds: 90 }], enemyCap: 150, pickupCap: 180,
  difficulty: { maxMinutes: 20, hpPerMinute: 0.12, damagePerMinute: 0.055, speedPerMinute: 0.012,
    spawnAcceleration: 0.18, minInterval: 0.22, batchEveryMinutes: 6, maxBatch: 3 },
  xpMultiplier: 2, xpThreatScaling: 0.5,
  spawnInterval: 0.95, enemyScale: 1, seedSalt: 27183,
};
