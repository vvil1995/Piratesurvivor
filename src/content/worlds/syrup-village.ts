import type { WorldDefinition } from './shells-town.ts';
import { ORANGE_TOWN } from './orange-town.ts';
// Solo punto de llegada jugable: Kuro y el contenido completo se desarrollarán después.
export const SYRUP_VILLAGE: WorldDefinition = { ...ORANGE_TOWN, id: 'syrup-village', name: 'Syrup Village', subtitle: 'Piratas del Gato Negro',
  enemyId: 'blackcat-pirate', enemyVariants: [{ id: 'blackcat-pirate', weight: 0.7, minSeconds: 0 }, { id: 'blackcat-raider', weight: 0.3, minSeconds: 0 }],
  xpMultiplier: 3.5, spawnInterval: 0.8, seedSalt: 1931 };
