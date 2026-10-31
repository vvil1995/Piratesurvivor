import Phaser from 'phaser';
import type { Vector } from '../core/types.ts';
import type { View } from '../systems/spawner.ts';
import { cellKey, CHUNK_SIZE, hash, roadTile, type Chunk } from '../world/generator.ts';
import type { ProceduralWorld } from '../world/world.ts';

interface Slot { ground: Phaser.GameObjects.Image; texture: Phaser.Textures.CanvasTexture; decorations: Phaser.GameObjects.Image[]; chunk?: Chunk }
export class WorldRenderer {
  private active = new Map<string, Slot>();
  private free: Slot[] = [];
  private world?: ProceduralWorld;
  private serial = 0;
  private scene: Phaser.Scene;
  constructor(scene: Phaser.Scene) { this.scene = scene; }
  get activeChunks(): number { return this.active.size; }
  get allocatedChunks(): number { return this.serial; }
  private createSlot(): Slot {
    const key = `shells-chunk-${this.serial++}`;
    const texture = this.scene.textures.createCanvas(key, 256, 256)!;
    return { texture, ground: this.scene.add.image(0, 0, key).setOrigin(0).setScale(2).setDepth(-2000), decorations: [] };
  }
  private paint(slot: Slot, chunk: Chunk): void {
    const ctx = slot.texture.context;
    ctx.imageSmoothingEnabled = false;
    const ground = Object.fromEntries(['stone','earth','grass','water'].map(name => [name, ctx.createPattern(this.scene.textures.get(`ground-${name}`).getSourceImage() as HTMLCanvasElement, 'repeat')!]));
    const orange = this.world?.theme === 'orange', coastal = this.world?.theme !== 'syrup';
    const orchard = chunk.district === 'orchard' || chunk.district === 'garden', circus = chunk.district === 'circus';
    const grass = chunk.district === 'garden' ? ['#719063', '#759568', '#6e8c60'] : ['#b9b39a', '#b5b096', '#bdb79d'];
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
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
    if (chunk.district === 'garden') {
      ctx.fillStyle = '#b0ac85';
      for (const q of [24, 168]) { ctx.fillRect(q, 58, 64, 5); ctx.fillRect(q, 194, 64, 5); }
      for (let i = 0; i < 22; i++) {
        const h = hash(chunk.variation, i, 925), x = 8 + h % 240, y = 8 + (h >>> 8) % 240;
        if (roadTile(Math.floor(x / 16), Math.floor(y / 16))) continue;
        ctx.fillStyle = ['#e1bd70', '#d9d8bd', '#b68892'][h % 3]; ctx.fillRect(x, y, 2, 2);
      }
    }
    if (chunk.district === 'plaza') {
      ctx.strokeStyle = '#9eaa9d'; ctx.lineWidth = 2;
      ctx.strokeRect(96, 96, 64, 64); ctx.strokeRect(103, 103, 50, 50);
      ctx.fillStyle = '#8a9f9b';
      for (const [x, y] of [[125, 110], [110, 125], [140, 125], [125, 140]]) ctx.fillRect(x, y, 5, 5);
    }
    slot.texture.refresh(); slot.chunk = chunk;
    for (let i = 0; i < chunk.obstacles.length; i++) {
      const obstacle = chunk.obstacles[i];
      if (!slot.decorations[i]) slot.decorations.push(this.scene.add.image(0, 0, 'tree').setOrigin(0.5, 1));
      const sprite = slot.decorations[i];
      if (obstacle.kind === 'water') { sprite.setVisible(false); continue; }
      const own = orange && ['house', 'tree', 'tent', 'stall', 'ruin'].includes(obstacle.kind);
      sprite.setTexture(obstacle.kind === 'ship' ? 'naval-ship' : obstacle.kind === 'lamp' ? 'coastal-lamp' : obstacle.kind === 'fence' ? 'coastal-fence' : obstacle.kind === 'crate' && coastal ? 'coastal-crates' : obstacle.kind === 'wall' && coastal ? 'coastal-wall' : obstacle.kind === 'dock' ? 'wooden-dock' : obstacle.kind === 'quay' ? 'stone-quay' : !orange && coastal && obstacle.kind === 'house' ? obstacle.variant === 3 ? 'shells-base' : 'shells-house' : obstacle.kind === 'tree' && coastal && (obstacle.variant === 1 || !orange) ? obstacle.variant === 1 && orange ? 'coastal-palm' : 'coastal-tree' : obstacle.kind === 'pennant' ? 'orange-flags' : own ? obstacle.kind === 'house' ? `orange-house-${obstacle.variant % 2}` : `orange-${obstacle.kind}` : obstacle.kind === 'house' ? `house-${obstacle.variant}` : obstacle.kind);
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
      sprite.setVisible(true);
    }
    for (let i = chunk.obstacles.length; i < slot.decorations.length; i++) slot.decorations[i].setVisible(false);
  }
  update(world: ProceduralWorld, view: View, origin: Vector): void {
    if (this.world !== world) { for (const slot of this.active.values()) this.release(slot); this.active.clear(); this.world = world; }
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
      const obstacles = slot.chunk!.obstacles;
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
