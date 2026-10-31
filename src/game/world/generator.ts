import { hash } from './seed.ts';
import { townRoadAt } from './town-ground.ts';
export const TILE = 32;
export const CHUNK_TILES = 16;
export const CHUNK_SIZE = TILE * CHUNK_TILES;
export type ObstacleKind = 'house' | 'tree' | 'rock' | 'wall' | 'crate' | 'tent' | 'stall' | 'ruin' | 'pennant' | 'water' | 'dock' | 'quay' | 'lamp' | 'fence' | 'ship';
export interface Obstacle { id: string; kind: ObstacleKind; x: number; y: number; width: number; height: number; variant: number; art?: string }
export interface Chunk {
  key: string; cx: number; cy: number; district: 'residential' | 'garden' | 'barracks' | 'plaza' | 'market' | 'circus' | 'orchard' | 'occupied' | 'harbor';
  solids: Uint8Array; obstacles: Obstacle[]; variation: number;
}
export const cellKey = (x: number, y: number): string => `${x},${y}`;
export { hash } from './seed.ts';
export const roadTile = (x: number, y: number): boolean => (x >= 6 && x <= 9) || (y >= 6 && y <= 9);
// Orange Town conserva las conexiones entre chunks, pero tiene parcelas y usos propios.
// La calle central y el perímetro garantizan rutas incluso con coordenadas negativas.
function generateLegacyOrangeChunk(seed: number, cx: number, cy: number): Chunk {
  const variation = hash(seed ^ 0x4f5247, cx, cy), key = cellKey(cx, cy);
  const district = (['market', 'circus', 'orchard', 'occupied'] as const)[variation % 4];
  const chunk: Chunk = { key, cx, cy, district, variation, solids: new Uint8Array(256), obstacles: [] };
  const add = (kind: ObstacleKind, x: number, y: number, w: number, h: number, variant = 0) => {
    chunk.obstacles.push({ id: `${key}/${chunk.obstacles.length}`, kind, x: (cx * 16 + x) * TILE, y: (cy * 16 + y) * TILE, width: w * TILE, height: h * TILE, variant });
    for (let ty = y; ty < y + h; ty++) for (let tx = x; tx < x + w; tx++) chunk.solids[tx + ty * 16] = 1;
  };
  for (const [i, [x, y]] of [[1, 1], [10, 1], [1, 10], [10, 10]].entries()) {
    const v = hash(variation, i, 31);
    if (district === 'circus') {
      if (i === variation % 4) add('tent', x, y, 4, 4);
      else { add('stall', x + 1, y + 1, 2, 1); add(v % 2 ? 'crate' : 'pennant', x + 3, y + 3, 1, 1); add('tree', x, y + 3, 1, 1, 1); }
    } else if (district === 'market') {
      if (i % 2) add('stall', x, y + 1, 3, 2);
      else add('house', x + 1, y, 3, 3, v % 2);
      add(v % 2 ? 'tree' : 'crate', x + 3, y + 3, 1, 1, 1);
      add('lamp', x, y + 3, 1, 1);
    } else if (district === 'orchard') {
      add('tree', x + 1, y + 1, 1, 1); add('tree', x + 3, y + 3, 1, 1);
      if (i === 0) add('stall', x + 2, y, 2, 1);
    } else {
      add(i % 2 ? 'ruin' : 'house', x, y, 3, 3, v % 2);
      add(v % 2 ? 'tree' : 'crate', x + 3, y + 3, 1, 1, 1);
      add('lamp', x, y + 3, 1, 1);
    }
  }
  return chunk;
}
export function generateLegacyChunk(seed: number, cx: number, cy: number): Chunk {
  const variation = hash(seed, cx, cy), key = cellKey(cx, cy);
  const coastalRow = ((cy % 8) + 8) % 8;
  const district = coastalRow === 3 || coastalRow === 4 ? 'harbor' : cx === 0 && cy === 0 ? 'barracks' : (['residential', 'garden', 'barracks', 'plaza'] as const)[variation % 4];
  const chunk: Chunk = { key, cx, cy, district, variation, solids: new Uint8Array(256), obstacles: [] };
  const add = (kind: ObstacleKind, tx: number, ty: number, w: number, h: number, variant: number) => {
    const obstacle: Obstacle = { id: `${key}/${chunk.obstacles.length}`, kind, x: cx * CHUNK_SIZE + tx * TILE, y: cy * CHUNK_SIZE + ty * TILE, width: w * TILE, height: h * TILE, variant };
    chunk.obstacles.push(obstacle);
    for (let y = ty; y < ty + h; y++) for (let x = tx; x < tx + w; x++) chunk.solids[x + y * 16] = 1;
  };
  if (district === 'harbor') {
    // Dársenas conectadas entre chunks: grandes superficies de mar alrededor
    // de pasarelas en cruz. Nunca se bloquean las conexiones centrales.
    for (const [x, y] of [[0, 0], [9, 0], [0, 9], [9, 9]]) add('water', x, y, 7, 7, 0);
    if ((variation >>> 3) % 3 === 0 || cx === 0) chunk.obstacles.push({ id: `${key}/ship`, kind: 'ship', x: cx * CHUNK_SIZE + 96, y: cy * CHUNK_SIZE + 64, width: 128, height: 160, variant: 0 });
    return chunk;
  }
  // Cuatro parcelas. Las avenidas centrales y el perímetro siempre quedan libres.
  // Todas las parcelas tienen acceso a esas avenidas, también entre chunks negativos.
  for (const [index, [qx, qy]] of [[1, 1], [10, 1], [1, 10], [10, 10]].entries()) {
    const v = hash(variation, index, 71), style = v % 4;
    if (district === 'residential' || (district === 'barracks' && index < 2)) {
      if (district === 'barracks' && index === 0) { add('house', qx, qy, 4, 3, 3); continue; }
      // Casas alternas, patios abiertos y pequeños almacenes; sin cerrar calles.
      if (style === 0) {
        add('house', qx + 1, qy, 2, 2, v % 3);
        add('rock', qx + 3, qy + 3, 1, 1, 0);
      } else {
        add('house', qx + (style === 1 ? 0 : 1), qy + (style === 3 ? 0 : 1), 3, 3, v % 3);
      }
      if (style > 1) add('tree', qx, qy + 3, 1, 1, v % 2);
    } else if (district === 'garden') {
      add('tree', qx + (style % 2 ? 3 : 1), qy + 1, 1, 1, v % 2);
      if (style !== 0) add('tree', qx + (style % 2 ? 1 : 3), qy + 3, 1, 1, (v + 1) % 2);
      if (style > 1) add('rock', qx + 1, qy + 3, 1, 1, 0);
      add('fence', qx + 1, qy + 4, 3, 1, 0);
    } else if (district === 'plaza') {
      if (index === (variation >>> 4) % 4) {
        // Dársena y muelle transitable. El agua es sólida; la pasarela de dos
        // celdas conecta con tierra por el extremo inferior, nunca encierra al jugador.
        add('water', qx, qy, 4, 4, 0);
        add('quay', qx, qy, 4, 1, 0);
        const dock = { id: `${key}/${chunk.obstacles.length}`, kind: 'dock' as const, x: (cx * 16 + qx + 1) * TILE, y: (cy * 16 + qy + 1) * TILE, width: 2 * TILE, height: 3 * TILE, variant: 0 };
        chunk.obstacles.push(dock);
        for (let y = qy + 1; y < qy + 4; y++) for (let x = qx + 1; x < qx + 3; x++) chunk.solids[x + y * 16] = 0;
        continue;
      }
      // Plaza amplia con parterres en sus esquinas; no añade callejones cerrados.
      if (style < 2) add('tree', qx + 2, qy + 2, 1, 1, v % 2);
      else if (style === 2) add('rock', qx + 2, qy + 2, 1, 1, 0);
      else add('lamp', qx + 2, qy + 2, 1, 1, 0);
    } else {
      // Recinto en U: la abertura mira a la calle. Sirve también para probar rutas.
      add('wall', qx + 1, qy + 1, 1, 3, 0);
      add('wall', qx + 2, qy + 1, 2, 1, 0);
      add('wall', qx + 3, qy + 2, 1, 2, 0);
    }
  }
  return chunk;
}

/** Compose existing buildings/vegetation inside a shared, always traversable street network. */
function composeTown(chunk:Chunk,seed:number,orange:boolean):Chunk{
 if(chunk.district==='harbor'||chunk.district==='plaza')return chunk; // Preserve working quays/docks.
 chunk.obstacles=[];chunk.solids.fill(0);
 const {cx,cy,key,variation}=chunk;
 const rebuild=()=>{chunk.solids.fill(0);for(const o of chunk.obstacles){const x=Math.round(o.x/TILE)-cx*16,y=Math.round(o.y/TILE)-cy*16;for(let j=y;j<y+o.height/TILE;j++)for(let i=x;i<x+o.width/TILE;i++)chunk.solids[i+j*16]=1;}};
 const add=(kind:ObstacleKind,x:number,y:number,w:number,h:number,variant=0,art?:string,guard=false):boolean=>{
  if(chunk.obstacles.length>=20||x<1||y<1||x+w>15||y+h>15)return false;
  for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++){
   if(roadTile(i,j)||townRoadAt(seed,cx*16+i+.5,cy*16+j+.5)||chunk.solids[i+j*16])return false;
  }
  if(!guard&&chunk.obstacles.some(o=>{
   const ax=o.x/TILE-cx*16,ay=o.y/TILE-cy*16;
   return x<ax+o.width/TILE+1&&x+w>ax-1&&y<ay+o.height/TILE+1&&y+h>ay-1;
  }))return false;
  chunk.obstacles.push({id:`${key}/town/${chunk.obstacles.length}`,kind,x:(cx*16+x)*TILE,y:(cy*16+y)*TILE,width:w*TILE,height:h*TILE,variant,art});rebuild();return true;
 };
 const plots=[[1,1],[10,1],[1,10],[10,10]];
 for(const [index,[qx,qy]]of plots.entries()){
  const v=hash(variation,index,1701),district=chunk.district;
  const place=(kind:ObstacleKind,w:number,h:number,variant=0,art?:string)=>{
   for(let t=0;t<12;t++){
    const r=hash(v,t,151);const x=qx+r%(6-w),y=qy+(r>>>8)%(6-h);
    if(add(kind,x,y,w,h,variant,art))return true;
   }return false;
  };
  if(!orange&&cx===0&&cy===0&&index===0){add('house',1,1,4,3,3);continue;}
  if(orange){
   if(district==='circus' && index===variation%4)place('tent',4,4);
   else if(district==='market' && index%2===variation%2)place('stall',2+(v%2),2);
   else if(district!=='orchard' && v%5!==0)place(district==='occupied'&&index%2?'ruin':'house',3,2+(v%2),v%2);
   else if(district==='orchard'&&v%4===0)place('stall',2,1);
   if(v%4===0)place('crate',1,1,0,'coastal-crates');
   if(district==='circus'&&v%3===0)place('pennant',1,1);
  }else{
   if(district==='barracks'&&index===2){
    // Keep the existing open guard alcove; no enclosing doorway is added.
    const first=chunk.obstacles.length;
    if(add('wall',qx+1,qy+1,1,3)){
     const top=add('wall',qx+2,qy+1,2,1,0,undefined,true),side=add('wall',qx+3,qy+2,1,2,0,undefined,true);
     if(!top||!side){chunk.obstacles.splice(first);rebuild();}
    }
   }else if(district==='barracks'&&index===0)place('house',4,3,3);
   else if((district!=='garden'&&!(district==='barracks'&&index===3)&&v%4!==0) || (district==='garden'&&v%5===0))place('house',3,2+(v%2),v%3);
   if(district==='garden'&&v%3===0)place('fence',2+(v%2),1);
   if(district==='barracks'&&index===3){
    const art=['naval-crates','naval-flag','naval-cannon','naval-tower'][v%4];
    place('crate',art==='naval-cannon'?2:art==='naval-tower'?2:1,art==='naval-tower'?2:1,0,art);
   }else if(v%7===0)place('crate',1,1,0,'coastal-crates');
  }
  // Vegetation forms little groups in open plots; density varies with district.
  const trees=district==='orchard'||district==='garden'?2+v%2:v%3===0?1:0;
  for(let n=0;n<trees;n++)place('tree',1,1,orange?(n===0&&v%3===0?1:0):v%2);
  if(v%6===0)place('lamp',1,1);
 }
 // A bounded local flood check prevents decorative groups from closing a pocket.
 for(let repair=0;repair<16;repair++){
  const seen=new Uint8Array(256),queue=[0];seen[0]=1;
  for(let q=0;q<queue.length;q++){const at=queue[q],x=at%16,y=Math.floor(at/16);for(const[dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,n=nx+ny*16;if(nx>=0&&ny>=0&&nx<16&&ny<16&&!seen[n]&&!chunk.solids[n]){seen[n]=1;queue.push(n);}}}
  const isolated=chunk.solids.findIndex((solid,i)=>!solid&&!seen[i]);if(isolated<0)break;
  const x=isolated%16,y=Math.floor(isolated/16);
  const remove=chunk.obstacles.findIndex(o=>{const ax=o.x/TILE-cx*16,ay=o.y/TILE-cy*16;return x>=ax-1&&x<=ax+o.width/TILE&&y>=ay-1&&y<=ay+o.height/TILE;});
  if(remove<0)break;chunk.obstacles.splice(remove,1);rebuild();
 }
 return chunk;
}
export function generateChunk(seed:number,cx:number,cy:number):Chunk{return composeTown(generateLegacyChunk(seed,cx,cy),seed,false);}
export function generateOrangeChunk(seed:number,cx:number,cy:number):Chunk{return composeTown(generateLegacyOrangeChunk(seed,cx,cy),seed,true);}

/** Syrup shares the working connected plot composer, with its own rural props/materials. */
export function generateSyrupChunk(seed:number,cx:number,cy:number):Chunk{
 const c=generateOrangeChunk(seed,cx,cy);c.district=c.district==='orchard'||c.district==='circus'?'garden':'residential';
 for(const o of c.obstacles){
  if(o.kind==='house'||o.kind==='tent'){o.kind='house';o.art='syrup-house';}
  else if(o.kind==='ruin'){o.kind='rock';o.art='syrup-cliff';}
  else if(o.kind==='stall'){o.kind='crate';o.art='syrup-cart';}
  else if(o.kind==='pennant'){o.kind='fence';o.art='coastal-fence';}
  else if(o.kind==='tree')o.art='coastal-tree';
 }
 if(cx===0&&cy===0 || c.variation%19===0){
  // Mansion stays in a corner lot, away from guaranteed avenues/spawn.
  c.obstacles=c.obstacles.filter(o=>o.x>=cx*512+192||o.y>=cy*512+192);
  c.obstacles.push({id:`${c.key}/mansion`,kind:'house',x:cx*512+32,y:cy*512+32,width:128,height:96,variant:0,art:'syrup-mansion'});
  c.solids.fill(0);for(const o of c.obstacles){const x=o.x/32-cx*16,y=o.y/32-cy*16;for(let j=y;j<y+o.height/32;j++)for(let i=x;i<x+o.width/32;i++)c.solids[i+j*16]=1;}
 }
 return c;
}
