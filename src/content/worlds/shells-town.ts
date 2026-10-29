export interface WorldDefinition {
  id: string; name: string; subtitle: string; biome: 'naval-town';
  enemyId: string; enemyCap: number; pickupCap: number;
  spawnInterval: number; enemyScale: number; seedSalt: number;
}
export const SHELLS_TOWN: WorldDefinition = {
  id: 'shells-town', name: 'Shells Town', subtitle: 'Calles de la base naval', biome: 'naval-town',
  enemyId: 'marine', enemyCap: 150, pickupCap: 180,
  spawnInterval: 0.65, enemyScale: 1, seedSalt: 27183,
};
