import type { WorldDefinition } from './shells-town.ts';
import { ORANGE_TOWN } from './orange-town.ts';
export const SYRUP_VILLAGE:WorldDefinition={...ORANGE_TOWN,id:'syrup-village',biome:'rural-village',name:'Syrup Village',subtitle:'Piratas del Gato Negro',enemyId:'blackcat-pirate',enemyVariants:undefined,
 distributions:[{at:0,weights:[{id:'blackcat-pirate',weight:1}]},{at:60,weights:[{id:'blackcat-pirate',weight:.8},{id:'blackcat-claw',weight:.2}]},{at:120,weights:[{id:'blackcat-pirate',weight:.65},{id:'blackcat-claw',weight:.25},{id:'blackcat-hypnotist',weight:.1}]},{at:180,weights:[{id:'blackcat-pirate',weight:.55},{id:'blackcat-claw',weight:.3},{id:'blackcat-hypnotist',weight:.15}]}],
 enemyCap:120,xpMultiplier:3.5,spawnInterval:.95,seedSalt:1931,difficulty:{...ORANGE_TOWN.difficulty!,maxMinutes:12,spawnAcceleration:.12,minInterval:.4,maxBatch:2,batchEveryMinutes:8}};
