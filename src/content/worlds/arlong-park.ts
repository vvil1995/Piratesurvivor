import { BARATIE } from './baratie.ts';
import type { WorldDefinition } from './shells-town.ts';
export const ARLONG_PARK:WorldDefinition={...BARATIE,id:'arlong-park',name:'Arlong Park',subtitle:'Piratas de Arlong',biome:'fishman-park',seedSalt:52739,enemyId:'fishman-fighter',enemyCap:105,xpMultiplier:4.8,spawnInterval:1,
 distributions:[{at:0,weights:[{id:'fishman-fighter',weight:1}]},{at:60,weights:[{id:'fishman-fighter',weight:.75},{id:'fishman-spitter',weight:.25}]},{at:120,weights:[{id:'fishman-fighter',weight:.65},{id:'fishman-spitter',weight:.25},{id:'fishman-karate',weight:.1}]},{at:180,weights:[{id:'fishman-fighter',weight:.55},{id:'fishman-spitter',weight:.3},{id:'fishman-karate',weight:.15}]}]};
