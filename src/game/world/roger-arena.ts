import { ArlongArenaWorld } from './arlong-arena.ts';
import type { ArenaDefinition } from './arena.ts';
export const ROGER_ARENA:ArenaDefinition={width:3072,height:2176,playerSpawn:{x:1536,y:1216},bossSpawn:{x:1760,y:1216},
 gates:[{x:192,y:352},{x:2880,y:352},{x:192,y:1856},{x:2880,y:1856}],
 covers:[{x:1248,y:256,width:576,height:256,art:'roger-scaffold'},{x:672,y:256,width:320,height:192,art:'loguetown-houses'},{x:2080,y:256,width:320,height:192,art:'loguetown-houses'}],
 decorations:[{x:1024,y:448,width:64,height:96,art:'buggy-flag'},{x:1984,y:448,width:64,height:96,art:'buggy-flag'},{x:576,y:1792,width:64,height:64,art:'coastal-crates'},{x:2432,y:1792,width:64,height:64,art:'coastal-crates'}]};
/** Arena fija; los chunks son solo contenedores de render. Piscinas laterales para Arlong. */
export class RogerArenaWorld extends ArlongArenaWorld{
 constructor(seed:number){super(seed);Object.assign(this.arena,ROGER_ARENA);}
 override breakObstacles():boolean{return false;}
}
