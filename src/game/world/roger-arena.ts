import { ArlongArenaWorld } from './arlong-arena.ts';
import type { ArenaDefinition } from './arena.ts';
export const ROGER_ARENA:ArenaDefinition={width:3072,height:2176,playerSpawn:{x:1536,y:1216},bossSpawn:{x:1760,y:1216},
 gates:[{x:192,y:352},{x:2880,y:352},{x:192,y:1856},{x:2880,y:1856}],
 covers:[{x:960,y:1024,width:192,height:64,art:'loguetown-shop'},{x:1920,y:1024,width:192,height:64,art:'loguetown-hall'},{x:1152,y:256,width:768,height:320,art:'loguetown-scaffold'},{x:672,y:256,width:320,height:192,art:'loguetown-hall'},{x:2080,y:256,width:320,height:192,art:'loguetown-shop'},...[640,1024,1408,1792].flatMap(y=>[{x:-32,y,width:224,height:128,art:'loguetown-shop'},{x:2880,y,width:224,height:128,art:'loguetown-hall'}])],
 decorations:[{x:1120,y:1152,width:48,height:96,art:'naval-flag'},{x:1904,y:1152,width:48,height:96,art:'naval-flag'},
 ...[2176].map((y,i)=>({x:-32,y,width:224,height:128,art:i%2?'loguetown-shop':'loguetown-hall'})),
 ...[2176].map((y,i)=>({x:2880,y,width:224,height:128,art:i%2?'loguetown-hall':'loguetown-shop'})),
 ...[704,1280,1856].map(x=>({x,y:2112,width:512,height:64,art:'loguetown-arcade'})),
 ...[800,2208].flatMap(x=>[720,1424,1856].map(y=>({x,y,width:32,height:64,art:'coastal-lamp'}))),
 {x:1056,y:704,width:48,height:96,art:'naval-flag'},{x:1968,y:704,width:48,height:96,art:'naval-flag'},
 {x:704,y:1728,width:128,height:64,art:'orange-stall'},{x:2240,y:1728,width:128,height:64,art:'syrup-cart'},
 {x:704,y:576,width:96,height:64,art:'naval-cannon'},{x:2272,y:576,width:96,height:64,art:'coastal-crates'},
{x:1024,y:448,width:64,height:96,art:'buggy-flag'},{x:1984,y:448,width:64,height:96,art:'buggy-flag'},{x:576,y:1792,width:64,height:64,art:'coastal-crates'},{x:2432,y:1792,width:64,height:64,art:'coastal-crates'}]};
/** Arena fija; los chunks son solo contenedores de render. Piscinas laterales para Arlong. */
export class RogerArenaWorld extends ArlongArenaWorld{
 constructor(seed:number){super(seed);Object.assign(this.arena,ROGER_ARENA);}
 override breakObstacles():boolean{return false;}
}
