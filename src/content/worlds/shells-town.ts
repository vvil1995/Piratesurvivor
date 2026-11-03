import {CAMPAIGN_DIFFICULTY,CAMPAIGN_RULES} from '../campaign-balance.ts';
import type { DifficultyDefinition } from '../types.ts';
export interface WorldDefinition {
  id: string; name: string; subtitle: string; biome: 'naval-town' | 'rural-village' | 'pirate-fleet' | 'fishman-park';
  enemyId: string; enemyVariants?: readonly { id: string; weight: number; minSeconds: number }[]; enemyCap: number; pickupCap: number;
  difficulty?: DifficultyDefinition;
  distributions?: readonly { at: number; weights: readonly { id: string; weight: number }[] }[];
  spawnInterval: number; enemyScale: number; seedSalt: number;
  enemyDamageScale?:number;
  xpMultiplier?: number; xpThreatScaling?: number;
}
export const SHELLS_TOWN: WorldDefinition = {
  id: 'shells-town', name: 'Shells Town', subtitle: 'Calles de la base naval', biome: 'naval-town',
  enemyId: 'marine', enemyCap: 150, pickupCap: 180,
  distributions: [0, .05, .10, .15, .20].map((veteran, minute) => ({
    at: minute * 60,
    weights: [{ id: 'marine', weight: (1-veteran)*.6 }, { id: 'marine-rifle', weight: (1-veteran)*.4 }, { id: 'marine-veteran', weight: veteran }],
  })),
  difficulty: { ...CAMPAIGN_DIFFICULTY,
    spawnAcceleration: 0.18, minInterval: 0.22, batchEveryMinutes: 6, maxBatch: 3 },
  xpMultiplier: 2, xpThreatScaling: CAMPAIGN_RULES.xpThreatScaling,
  spawnInterval: 0.95, enemyScale: 1, seedSalt: 27183,
};
