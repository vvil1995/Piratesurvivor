import {CAMPAIGN_DIFFICULTY,CAMPAIGN_RULES} from '../campaign-balance.ts';
import type { WorldDefinition } from './shells-town.ts';
// Primera llegada jugable: Buggy y la siguiente ruta aún no están implementados.
export const ORANGE_TOWN: WorldDefinition = {
  id: 'orange-town', name: 'Orange Town', subtitle: 'Piratas de Buggy', biome: 'naval-town',
  enemyId: 'buggy-pirate', enemyVariants: [
    { id: 'buggy-pirate', weight: 0.55, minSeconds: 0 },
    { id: 'buggy-gunner', weight: 0.25, minSeconds: 0 },
    { id: 'buggy-bruiser', weight: 0.20, minSeconds: 0 },
  ], enemyCap: 150, pickupCap: 180, spawnInterval: 0.85, enemyScale: 1, seedSalt: 4117,
  xpMultiplier: 2.4, xpThreatScaling: CAMPAIGN_RULES.xpThreatScaling,
  difficulty: { ...CAMPAIGN_DIFFICULTY,
    spawnAcceleration: 0.18, minInterval: 0.22, batchEveryMinutes: 6, maxBatch: 3 },
};
