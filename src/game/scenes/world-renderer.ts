import { RogerArenaWorld } from '../world/roger-arena.ts';
import { arlongGround } from '../world/arlong.ts';
import { ArlongArenaWorld,ARLONG_ARENA } from '../world/arlong-arena.ts';
import { deckAt } from '../world/baratie.ts';
import type { Obstacle } from '../world/generator.ts';
import Phaser from 'phaser';
import { townGroundAt, townRoadAt } from '../world/town-ground.ts';
import { ArenaWorld } from '../world/arena.ts';
import type { Vector } from '../core/types.ts';
import type { View } from '../systems/spawner.ts';
import { cellKey, CHUNK_SIZE, hash, roadTile, type Chunk } from '../world/generator.ts';
import type { ProceduralWorld } from '../world/world.ts';

interface Slot { ground: Phaser.GameObjects.Image; texture: Phaser.Textures.CanvasTexture; decorations: Phaser.GameObjects.Image[]; chunk?: Chunk; props?:Obstacle[] }
export class WorldRenderer {
  private active = new Map<string, Slot>();
  private free: Slot[] = [];
  private world?: ProceduralWorld;
  private serial = 0;
  private revision=-1;
  private atmosphere:Phaser.GameObjects.Graphics;
  private waves:Phaser.GameObjects.Graphics;
  private scene: Phaser.Scene;
  constructor(scene: Phaser.Scene) { this.scene = scene;this.atmosphere=scene.add.graphics().setDepth(-1700);this.waves=scene.add.graphics().setDepth(-1900); }
  get activeChunks(): number { return this.active.size; }
  get allocatedChunks(): number { return this.serial; }
  private createSlot(): Slot {
    const key = `shells-chunk-${this.serial++}`;
    const texture = this.scene.textures.createCanvas(key, 256, 256)!;
    return { texture, ground: this.scene.add.image(0, 0, key).setOrigin(0).setScale(2).setDepth(-2000), decorations: [] };
  }
  private paint(slot: Slot, chunk: Chunk): void {
    slot.props=undefined;if(this.world?.theme==='arlong'){this.paintArlong(slot,chunk);return;}if(this.world?.theme==='baratie'){this.paintFleet(slot,chunk);return;}
    const naval = this.world instanceof ArenaWorld && this.world.theme === 'shells';
    const ctx = slot.texture.context;
    ctx.imageSmoothingEnabled = false;
    const ground = Object.fromEntries(['stone','earth','grass','water'].map(name => [name, ctx.createPattern(this.scene.textures.get(`ground-${name}`).getSourceImage() as HTMLCanvasElement, 'repeat')!]));
    const orange = this.world?.theme === 'orange', coastal = this.world?.theme !== 'syrup';
    const organic = !(this.world instanceof ArenaWorld) && (this.world?.theme === 'shells' || this.world?.theme==='syrup' || orange) && chunk.district !== 'harbor';
    const orchard = chunk.district === 'orchard' || chunk.district === 'garden', circus = chunk.district === 'circus';
    const grass = chunk.district === 'garden' ? ['#719063', '#759568', '#6e8c60'] : ['#b9b39a', '#b5b096', '#bdb79d'];
    if (organic) this.paintTownGround(ctx, chunk, ground, orange);
    else for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const h = hash(chunk.variation, x, y), road = roadTile(x, y) || chunk.district === 'plaza';
      ctx.fillStyle = road ? (this.world?.theme === 'orange' ? ['#d5bb9c', '#d9c3a5', '#cfb596'] : ['#c6c2ad', '#cbc7b4', '#c2bfac'])[h % 3] : grass[h % 3];
      ctx.fillRect(x * 16, y * 16, 16, 16);
      if (coastal) {
        // Calles adoquinadas estrechas, tierra de feria y huertos: otra trama,
        // no la cuadrícula naval recoloreada. Se rasteriza solo al cargar el chunk.
        ctx.fillStyle = road ? ['#cdb78e', '#d6c39d', '#cbb58c'][h % 3]
          : orchard ? ['#688952', '#718e57', '#78925c'][h % 3]
          : !orange ? ['#83a452', '#89a959', '#7e9e50'][h % 3] : circus ? ['#cbb17b', '#d2ba85', '#c8ad76'][h % 3] : ['#c9ae7b', '#d1b785', '#cdb17e'][h % 3];
        ctx.fillRect(x * 16, y * 16, 16, 16);
        if (road) for (let row = 0; row < 2; row++) {
          for (let col = 0; col < 3; col++) {
            const px = x * 16 + col * 6 - (row % 2 ? 3 : 0), py = y * 16 + row * 8;
            ctx.fillStyle = '#ab9776'; ctx.fillRect(Math.max(x * 16, px), py, Math.min(5, x * 16 + 16 - px), 7);
            ctx.fillStyle = ['#e1cda2', '#d8c39a', '#dcc69c'][(h + col + row) % 3];
            ctx.fillRect(Math.max(x * 16, px), py, Math.min(5, x * 16 + 16 - px), 5);
          }
        }
        if (chunk.district === 'harbor' && road) {
          ctx.fillStyle = ['#aa7945', '#b9844e', '#bc8b54'][h % 3]; ctx.fillRect(x * 16, y * 16, 16, 16);
          for (let row = 0; row < 4; row++) { ctx.fillStyle = '#765438'; ctx.fillRect(x * 16, y * 16 + row * 4, 16, 1); ctx.fillStyle = '#d6ab6e'; ctx.fillRect(x * 16 + 2, y * 16 + row * 4 + 1, 11, 1); }
        }
        else if (!road && h % 3 === 0) { ctx.fillStyle = orchard ? '#526e43' : '#8b795c'; ctx.fillRect(x * 16 + 5, y * 16 + 9, 3, 1); }
      } else if (road) {
        ctx.fillStyle = '#a5a58f'; ctx.fillRect(x * 16, y * 16, 16, 1); ctx.fillRect(x * 16, y * 16, 1, 16);
        ctx.fillStyle = '#dedbc6'; ctx.fillRect(x * 16 + 2, y * 16 + 2, 11, 1);
      } else if (h % 4 === 0) {
        ctx.fillStyle = chunk.district === 'garden' ? '#567e52' : '#969f7a';
        ctx.fillRect(x * 16 + 5, y * 16 + 8, 1, 3); ctx.fillRect(x * 16 + 7, y * 16 + 6, 1, 4);
      }
      if (coastal && !(chunk.district === 'harbor' && road)) {
        ctx.fillStyle = road ? ground.stone : !orange || orchard ? ground.grass : ground.earth;
        ctx.fillRect(x * 16, y * 16, 16, 16);
      }
      // Bordillos alineados con la trama de calles.
      ctx.fillStyle = orange ? '#8b775d' : '#9d9e86';
      if ((x === 5 || x === 10) && !roadTile(0, y)) ctx.fillRect(x * 16 + (x === 5 ? 14 : 0), y * 16, 2, 16);
      if ((y === 5 || y === 10) && !roadTile(x, 0)) ctx.fillRect(x * 16, y * 16 + (y === 5 ? 14 : 0), 16, 2);
    }
    for (const obstacle of chunk.obstacles) if (obstacle.kind === 'water') {
      const x = (obstacle.x - chunk.cx * CHUNK_SIZE) / 2, y = (obstacle.y - chunk.cy * CHUNK_SIZE) / 2;
      const w = obstacle.width / 2, h = obstacle.height / 2;
      ctx.fillStyle = ground.water; ctx.fillRect(x, y, w, h);
      // Espuma solo donde hay tierra/pasarela, nunca dibujar líneas sobre las
      // uniones de dos chunks de mar contiguos.
      const tx = Math.floor(obstacle.x / 32), ty = Math.floor(obstacle.y / 32), tw = obstacle.width / 32, th = obstacle.height / 32;
      ctx.fillStyle = '#c0e8de';
      for (let i = 0; i < tw; i++) {
        if (!this.world!.solidTile(tx + i, ty - 1)) ctx.fillRect(x + i * 16, y, 16, 1);
        if (!this.world!.solidTile(tx + i, ty + th)) ctx.fillRect(x + i * 16, y + h - 1, 16, 1);
      }
      for (let i = 0; i < th; i++) {
        if (!this.world!.solidTile(tx - 1, ty + i)) ctx.fillRect(x, y + i * 16, 1, 16);
        if (!this.world!.solidTile(tx + tw, ty + i)) ctx.fillRect(x + w - 1, y + i * 16, 1, 16);
      }
    }
    if (orange && (circus || chunk.district === 'plaza')) {
      // Pista de feria y banderines; los avisos de combate se dibujan por encima.
      ctx.strokeStyle = '#87564f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(128, 128, 27, 20, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#ebce91'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(128, 128, 23, 16, 0, 0, Math.PI * 2); ctx.stroke();
    }
    if (orange && (chunk.district === 'market' || circus)) {
      ctx.strokeStyle = '#665044'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(83, 85); ctx.quadraticCurveTo(128, 96, 173, 85); ctx.stroke();
      for (let i = 0; i < 9; i++) { const x = 87 + i * 10, y = 86 + Math.round(Math.sin(i / 8 * Math.PI) * 5); ctx.fillStyle = ['#a94c47', '#ead3a0', '#76618a'][i % 3]; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 7, y); ctx.lineTo(x + 4, y + 7); ctx.fill(); }
    }
    // Detalles decorativos sin colisión, pintados una sola vez por chunk.
    // Las sendas del jardín conectan con las avenidas; la plaza marca otro barrio.
    if (!organic && chunk.district === 'garden') {
      ctx.fillStyle = '#b0ac85';
      for (const q of [24, 168]) { ctx.fillRect(q, 58, 64, 5); ctx.fillRect(q, 194, 64, 5); }
      for (let i = 0; i < 22; i++) {
        const h = hash(chunk.variation, i, 925), x = 8 + h % 240, y = 8 + (h >>> 8) % 240;
        if (roadTile(Math.floor(x / 16), Math.floor(y / 16))) continue;
        ctx.fillStyle = ['#e1bd70', '#d9d8bd', '#b68892'][h % 3]; ctx.fillRect(x, y, 2, 2);
      }
    }
    if (!organic && chunk.district === 'plaza' && !(this.world instanceof ArenaWorld && orange)) {
      ctx.strokeStyle = '#9eaa9d'; ctx.lineWidth = 2;
      ctx.strokeRect(96, 96, 64, 64); ctx.strokeRect(103, 103, 50, 50);
      ctx.fillStyle = '#8a9f9b';
      for (const [x, y] of [[125, 110], [110, 125], [140, 125], [125, 140]]) ctx.fillRect(x, y, 5, 5);
    }
    if(this.world instanceof ArenaWorld && this.world.theme==='syrup')this.paintTownGround(ctx,chunk,ground,false);
    if (naval) {
      // Losas navales originales: material compartido, desgaste determinista.
      ctx.fillStyle = ctx.createPattern(this.scene.textures.get('naval-ground').getSourceImage() as HTMLCanvasElement, 'repeat')!; ctx.fillRect(0, 0, 256, 256);
      for (let y = 0; y < 256; y += 16) for (let x = 0; x < 256; x += 16) {
        const wx = chunk.cx * 512 + x * 2, wy = chunk.cy * 512 + y * 2;
        if (wx < 32 || wy < 32 || wx >= (this.world as ArenaWorld).arena.width - 32 || wy >= (this.world as ArenaWorld).arena.height - 32) { ctx.fillStyle=ground.water;ctx.fillRect(x,y,16,16); }
      }
      if (hash(71,chunk.cx,chunk.cy)%3 === 0) {
        ctx.fillStyle='#293742';ctx.fillRect(52,52,24,24);ctx.strokeStyle='#abb0ac';ctx.lineWidth=2;ctx.strokeRect(52,52,24,24);
        for(let x=56;x<75;x+=4){ctx.fillStyle='#78838b';ctx.fillRect(x,54,1,20);}
      }
    }
    if (this.world instanceof ArenaWorld && orange) {
      ctx.fillStyle = ctx.createPattern(this.scene.textures.get('buggy-ground').getSourceImage() as HTMLCanvasElement, 'repeat')!; ctx.fillRect(0,0,256,256);
      for (let y=0;y<256;y+=16) for (let x=0;x<256;x+=16) {
        const wx=chunk.cx*512+x*2,wy=chunk.cy*512+y*2;
        if(wx<64||wy<64||wx>=this.world.arena.width-64||wy>=this.world.arena.height-64){ctx.fillStyle=(Math.floor((wx+wy)/64)%2)?'#a94c47':'#d6bd87';ctx.fillRect(x,y,16,16);}
      }
    }
    slot.texture.refresh(); slot.chunk = chunk;
    for (let i = 0; i < chunk.obstacles.length; i++) {
      const obstacle = chunk.obstacles[i];
      if (!slot.decorations[i]) slot.decorations.push(this.scene.add.image(0, 0, 'tree').setOrigin(0.5, 1));
      const sprite = slot.decorations[i];
      if (obstacle.kind === 'water') { sprite.setVisible(false); continue; }
      const own = orange && ['house', 'tree', 'tent', 'stall', 'ruin'].includes(obstacle.kind);
      sprite.setTexture(this.world instanceof ArenaWorld && obstacle.art ? obstacle.art : naval ? obstacle.art ?? (obstacle.kind === 'wall' ? 'naval-wall' : 'naval-crates') : this.world instanceof ArenaWorld && this.world.theme==='syrup' ? obstacle.art??'coastal-fence' : organic && obstacle.art ? obstacle.art : obstacle.kind === 'ship' ? 'naval-ship' : obstacle.kind === 'lamp' ? 'coastal-lamp' : obstacle.kind === 'fence' ? 'coastal-fence' : obstacle.kind === 'crate' && coastal ? 'coastal-crates' : obstacle.kind === 'wall' && coastal ? 'coastal-wall' : obstacle.kind === 'dock' ? 'wooden-dock' : obstacle.kind === 'quay' ? 'stone-quay' : !orange && coastal && obstacle.kind === 'house' ? obstacle.variant === 3 ? 'shells-base' : 'shells-house' : obstacle.kind === 'tree' && coastal && (obstacle.variant === 1 || !orange) ? obstacle.variant === 1 && orange ? 'coastal-palm' : 'coastal-tree' : obstacle.kind === 'pennant' ? 'orange-flags' : own ? obstacle.kind === 'house' ? `orange-house-${obstacle.variant % 2}` : `orange-${obstacle.kind}` : obstacle.kind === 'house' ? `house-${obstacle.variant}` : obstacle.kind);
      if (obstacle.kind === 'ship') sprite.setDisplaySize(obstacle.width, obstacle.width * sprite.height / sprite.width);
      else if (obstacle.kind === 'lamp') sprite.setDisplaySize(28, 84);
      else if (obstacle.kind === 'fence') sprite.setDisplaySize(obstacle.width, 48);
      else if (obstacle.kind === 'dock') sprite.setDisplaySize(obstacle.width + 12, obstacle.height);
      else if (obstacle.kind === 'quay') sprite.setDisplaySize(obstacle.width, obstacle.height + 16);
      else if (obstacle.kind === 'house' || obstacle.kind === 'ruin') sprite.setDisplaySize(obstacle.width, obstacle.height + 32);
      else if (obstacle.kind === 'tent') sprite.setDisplaySize(obstacle.width, obstacle.height + 48);
      else if (obstacle.kind === 'stall') sprite.setDisplaySize(obstacle.width, obstacle.height + 24);
      else if (obstacle.kind === 'pennant') sprite.setDisplaySize(30, 80);
      else if (obstacle.kind === 'tree') sprite.setDisplaySize(76, 98);
      else if (obstacle.kind === 'rock') sprite.setDisplaySize(obstacle.width + 12, obstacle.height + 16);
      else sprite.setDisplaySize(obstacle.width, obstacle.height + 10);
      if (coastal && ['house', 'tent', 'stall', 'ruin', 'tree', 'crate', 'fence', 'lamp'].includes(obstacle.kind)) {
        const width = obstacle.kind === 'tent' ? obstacle.width + 32 : sprite.displayWidth;
        sprite.setDisplaySize(width, width * sprite.height / sprite.width);
      }
      if (organic && obstacle.art) {const w=obstacle.kind==='tree'?76:obstacle.width;sprite.setDisplaySize(w,w*sprite.height/sprite.width);}
      if (naval) { const w = obstacle.width; sprite.setDisplaySize(w, obstacle.art ? w * sprite.height / sprite.width : obstacle.kind === 'wall' ? obstacle.height + 24 : obstacle.height); }
      if (this.world instanceof ArenaWorld && this.world.theme!=='shells' && obstacle.art) sprite.setDisplaySize(obstacle.width, obstacle.width * sprite.height / sprite.width);
      sprite.setVisible(true);
    }
    for (let i = chunk.obstacles.length; i < slot.decorations.length; i++) slot.decorations[i].setVisible(false);
  }
  private fleetFloor(tx:number,ty:number):boolean{
    if(this.world instanceof ArenaWorld){const a=this.world.arena,inset=a.edgeInset??32;return tx*32>=inset&&ty*32>=inset&&tx*32<a.width-inset&&ty*32<a.height-inset;}
    return deckAt(this.world!.seed,tx,ty);
  }
  private paintFleet(slot:Slot,chunk:Chunk):void{
    const ctx=slot.texture.context;ctx.imageSmoothingEnabled=false;ctx.fillStyle='#126f9c';ctx.fillRect(0,0,256,256);
    for(let y=0;y<16;y++)for(let x=0;x<16;x++){
      const tx=chunk.cx*16+x,ty=chunk.cy*16+y,h=hash(this.world!.seed,tx,ty);
      if(!this.fleetFloor(tx,ty)){ctx.fillStyle=h%2?'#147ba4':'#12749d';ctx.fillRect(x*16,y*16,16,16);continue;}
      ctx.fillStyle=['#ad7948','#b7834f','#a87543'][h%3];ctx.fillRect(x*16,y*16,16,16);
      for(let j=0;j<4;j++){ctx.fillStyle='#69462e';ctx.fillRect(x*16,y*16+j*4,16,1);ctx.fillStyle='#d2a46c';ctx.fillRect(x*16,y*16+j*4+1,16,1);ctx.fillStyle='#775336';ctx.fillRect(x*16+(h+j*5)%15,y*16+j*4,1,4);}
      for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]])if(!this.fleetFloor(tx+dx,ty+dy)){
        ctx.fillStyle='#4b3025';ctx.fillRect(x*16+(dx===1?13:0),y*16+(dy===1?13:0),dx?3:16,dy?3:16);
        ctx.fillStyle='#e5bd7c';ctx.fillRect(x*16+(dx===1?14:0),y*16+(dy===1?14:0),dx?1:16,dy?1:16);
        ctx.fillStyle='#5e4027';ctx.fillRect(x*16+(dx===1?11:0),y*16+(dy===1?11:0),4,4);
      }
    }
    slot.texture.refresh();slot.chunk=chunk;slot.props=chunk.obstacles.filter(o=>o.kind!=='water'&&o.kind!=='wall');
    for(const [i,o]of slot.props.entries()){
      const sprite=slot.decorations[i]??(slot.decorations[i]=this.scene.add.image(0,0,'coastal-crates').setOrigin(.5,1));
      const width=o.art==='baratie-mast'?160:o.art==='krieg-flag'?Math.max(56,o.width):o.width;
      sprite.setTexture(o.art??'coastal-crates').setDisplaySize(width,width*sprite.height/sprite.width).setVisible(true);
    }
    for(let i=slot.props.length;i<slot.decorations.length;i++)slot.decorations[i].setVisible(false);
  }
  private paintArlong(slot:Slot,c:Chunk):void{
    const ctx=slot.texture.context,w=this.world!;ctx.imageSmoothingEnabled=false;
    const materials=Object.fromEntries(['stone','earth','grass','water'].map(name=>[name,ctx.createPattern(this.scene.textures.get(`ground-${name}`).getSourceImage() as HTMLCanvasElement,'repeat')!]));
    for(let y=0;y<32;y++)for(let x=0;x<32;x++){const tx=c.cx*16+(x+.5)/2,ty=c.cy*16+(y+.5)/2;ctx.fillStyle=materials[w instanceof ArlongArenaWorld?'stone':arlongGround(w.seed,tx,ty)];ctx.fillRect(x*8,y*8,8,8);}
    if(w instanceof RogerArenaWorld)this.paintLoguetown(ctx,c);
    for(const o of c.obstacles)if(o.kind==='water'){
      const x=(o.x-c.cx*512)/2,y=(o.y-c.cy*512)/2;ctx.fillStyle=materials.water;ctx.fillRect(x,y,o.width/2,o.height/2);ctx.strokeStyle='#73d8d0';ctx.lineWidth=1;ctx.strokeRect(x+1,y+1,o.width/2-2,o.height/2-2);
    }
    if(w instanceof ArlongArenaWorld&&w.transformed){ctx.strokeStyle='#665b52';ctx.lineWidth=2;for(const o of ARLONG_ARENA.covers.filter(o=>o.breakable)){const x=(o.x-c.cx*512)/2,y=(o.y-c.cy*512)/2;ctx.beginPath();ctx.moveTo(x-6,y+8);ctx.lineTo(x+12,y+19);ctx.lineTo(x+24,y+9);ctx.lineTo(x+39,y+24);ctx.stroke();}}
    slot.texture.refresh();slot.chunk=c;slot.props=c.obstacles.filter(o=>o.kind!=='water');
    for(const [i,o]of slot.props.entries()){
      const sprite=slot.decorations[i]??(slot.decorations[i]=this.scene.add.image(0,0,'coastal-crates').setOrigin(.5,1));
      const width=o.kind==='tree'?76:o.art==='arlong-flag'?56:o.width;
      sprite.setTexture(o.art??(o.kind==='wall'?'coastal-wall':o.kind==='fence'?'coastal-fence':o.kind==='lamp'?'coastal-lamp':o.kind==='tree'?'coastal-palm':'coastal-crates')).setDisplaySize(width,o.kind==='dock'?o.height:width*sprite.height/sprite.width).setVisible(true);
    }
    for(let i=slot.props.length;i<slot.decorations.length;i++)slot.decorations[i].setVisible(false);
  }
  private paintLoguetown(ctx:CanvasRenderingContext2D,c:Chunk):void{
    const shades=['#8e9498','#999d9f','#a0a2a1','#93999c','#a5a6a2','#969b9e'];
    ctx.fillStyle='#878d90';ctx.fillRect(0,0,256,256);
    const ox=c.cx*256,oy=c.cy*256;
    for(let row=Math.floor(oy/6);row<=Math.floor((oy+256)/6);row++){
      let gx=-32,index=0;while(gx<1600){const n=hash(719,row,index++),width=8+n%9,x=gx-ox,y=row*6-oy;gx+=width;
        if(x+width<0||x>256)continue;
        const wx=(x+ox)*2,wy=row*12,band=Math.abs(wx-1536)<48||Math.abs(wy-1216)<24;
        ctx.fillStyle=band?'#b1b1a8':shades[n%shades.length];ctx.fillRect(x,y,width-1,5);
        ctx.fillStyle='rgba(227,223,207,.16)';ctx.fillRect(x+1,y,width-3,1);
        ctx.fillStyle='rgba(62,72,79,.2)';ctx.fillRect(x+2+n%3,y+2,1,1);ctx.fillRect(x+width-3,y+4,2,1);
        if(n%17===0){ctx.fillStyle='#717b81';ctx.fillRect(x+3,y,1,3);ctx.fillRect(x+4,y+2,3,1);}
      }
    }
    const x=(1536-c.cx*512)/2,y=(1216-c.cy*512)/2;
    ctx.strokeStyle='#c4ba9c';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,160,0,Math.PI*2);ctx.stroke();ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,145,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#596a7a';ctx.beginPath();ctx.moveTo(x,y-60);ctx.lineTo(x+8,y);ctx.lineTo(x,y+60);ctx.lineTo(x-8,y);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.moveTo(x-60,y);ctx.lineTo(x,y-8);ctx.lineTo(x+60,y);ctx.lineTo(x,y+8);ctx.closePath();ctx.fill();
  }
  private paintTownGround(ctx: CanvasRenderingContext2D, chunk: Chunk, ground: Record<string, CanvasPattern>, orange: boolean): void {
    // Half-tile material boundaries are sampled in world space, never per-chunk rectangles.
    for (let y=0;y<32;y++) for(let x=0;x<32;x++) {
      const wx=chunk.cx*16+(x+.5)/2,wy=chunk.cy*16+(y+.5)/2;
      const material=this.world instanceof ArenaWorld && this.world.theme==='syrup' ? townRoadAt(this.world.seed,wx,wy)?'earth':'grass' : townGroundAt(this.world!.seed,wx,wy,this.world!.theme==='syrup'?'syrup':orange?'orange':'shells');
      ctx.fillStyle=ground[material];ctx.fillRect(x*8,y*8,8,8);
      const wear=hash(this.world!.seed^421,chunk.cx*32+x,chunk.cy*32+y);
      if(material==='stone'&&wear%11===0){
        ctx.fillStyle=wear%2?'rgba(93,105,72,.17)':'rgba(114,89,61,.14)';ctx.fillRect(x*8,y*8,8,8);
        ctx.fillStyle='rgba(70,66,57,.25)';ctx.fillRect(x*8+2,y*8+4,4,1);
      }
    }
  }
  update(world: ProceduralWorld, view: View, origin: Vector): void {
    this.atmosphere.clear().setVisible(world instanceof RogerArenaWorld);
    if(world instanceof RogerArenaWorld){
      const t=this.scene.time.now/1000,left=view.centerX-view.width/2,top=view.centerY-view.height/2;
      this.atmosphere.lineStyle(50,0x192940,.045);
      for(let i=0;i<3;i++){const y=top+30+i*100;this.atmosphere.lineBetween(left-origin.x,y-origin.y,left+view.width-origin.x,y+30-origin.y);}
      this.atmosphere.lineStyle(1,0xc3c5b8,.25);
      for(let i=0;i<14;i++){const x=left+(i*137+t*22)%view.width,y=top+(i*73+Math.sin(t+i)*8)%view.height;this.atmosphere.lineBetween(x-origin.x,y-origin.y,x+5-origin.x,y-2-origin.y);}
      if(t%19<.12){this.atmosphere.lineStyle(2,0xd5dbf7,.35);const x=left+view.width*.75-origin.x,y=top-origin.y;this.atmosphere.lineBetween(x,y,x-8,y+35);this.atmosphere.lineBetween(x-8,y+35,x+8,y+28);this.atmosphere.lineBetween(x+8,y+28,x-30,y+70);}
    }
    this.waves.clear().setVisible(world.theme==='baratie'||world.theme==='arlong');
    if(world.theme==='baratie'||world.theme==='arlong'){
      const phase=this.scene.time.now/900;this.waves.lineStyle(1,0x9fe3e3,.45);
      for(let y=Math.floor((view.centerY-view.height/2)/96)*96;y<view.centerY+view.height/2;y+=96)for(let x=Math.floor((view.centerX-view.width/2)/96)*96;x<view.centerX+view.width/2;x+=96){
        if(!world.isWater(x,y))continue;const sx=x-origin.x+Math.sin(phase+y)*5,sy=y-origin.y;this.waves.lineBetween(sx,sy,sx+16,sy);this.waves.lineBetween(sx+16,sy,sx+21,sy-2);
      }
    }
    if (this.world !== world||this.revision!==world.revision) {this.revision=world.revision; for (const slot of this.active.values()) this.release(slot); this.active.clear(); this.world = world; }
    const minX = Math.floor((view.centerX - view.width / 2) / CHUNK_SIZE) - 1;
    const maxX = Math.floor((view.centerX + view.width / 2) / CHUNK_SIZE) + 1;
    const minY = Math.floor((view.centerY - view.height / 2) / CHUNK_SIZE) - 1;
    const maxY = Math.floor((view.centerY + view.height / 2) / CHUNK_SIZE) + 1;
    for (const [key, slot] of this.active) {
      const chunk = slot.chunk!;
      if (chunk.cx < minX || chunk.cx > maxX || chunk.cy < minY || chunk.cy > maxY) { this.release(slot); this.active.delete(key); }
    }
    for (let cy = minY; cy <= maxY; cy++) for (let cx = minX; cx <= maxX; cx++) {
      const key = cellKey(cx, cy);
      let slot = this.active.get(key);
      if (!slot) { slot = this.free.pop() ?? this.createSlot(); this.paint(slot, world.getChunk(cx, cy)); this.active.set(key, slot); }
      slot.ground.setVisible(true).setPosition(cx * CHUNK_SIZE - origin.x, cy * CHUNK_SIZE - origin.y);
      const obstacles = slot.props??slot.chunk!.obstacles;
      for (let i = 0; i < obstacles.length; i++) {
        const obstacle = obstacles[i], y = obstacle.y + obstacle.height - origin.y;
        slot.decorations[i].setPosition(obstacle.x + obstacle.width / 2 - origin.x, y).setDepth(y + 1000);
      }
    }
  }
  private release(slot: Slot): void {
    slot.ground.setVisible(false); for (const decoration of slot.decorations) decoration.setVisible(false); this.free.push(slot);
  }
}
