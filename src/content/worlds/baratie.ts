import { SYRUP_VILLAGE } from './syrup-village.ts';
import type { WorldDefinition } from './shells-town.ts';
export const BARATIE:WorldDefinition={...SYRUP_VILLAGE,id:'baratie',name:'Baratie',subtitle:'Flota de los Piratas de Krieg',biome:'pirate-fleet',seedSalt:41993,enemyId:'krieg-saber',enemyCap:110,xpMultiplier:4.1,spawnInterval:1,
 distributions:[{at:0,weights:[{id:'krieg-saber',weight:1}]},{at:60,weights:[{id:'krieg-saber',weight:.75},{id:'krieg-gunner',weight:.25}]},{at:120,weights:[{id:'krieg-saber',weight:.65},{id:'krieg-gunner',weight:.25},{id:'krieg-armored',weight:.1}]},{at:180,weights:[{id:'krieg-saber',weight:.55},{id:'krieg-gunner',weight:.3},{id:'krieg-armored',weight:.15}]}]};
