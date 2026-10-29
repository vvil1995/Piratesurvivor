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
    const grass = chunk.district === 'garden' ? ['#719063', '#759568', '#6e8c60'] : ['#b9b39a', '#b5b096', '#bdb79d'];
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const h = hash(chunk.variation, x, y), road = roadTile(x, y) || chunk.district === 'plaza';
      ctx.fillStyle = road ? ['#c6c2ad', '#cbc7b4', '#c2bfac'][h % 3] : grass[h % 3];
      ctx.fillRect(x * 16, y * 16, 16, 16);
      if (road) {
        ctx.fillStyle = '#a5a58f'; ctx.fillRect(x * 16, y * 16, 16, 1); ctx.fillRect(x * 16, y * 16, 1, 16);
        ctx.fillStyle = '#dedbc6'; ctx.fillRect(x * 16 + 2, y * 16 + 2, 11, 1);
      } else if (h % 4 === 0) {
        ctx.fillStyle = chunk.district === 'garden' ? '#567e52' : '#969f7a';
        ctx.fillRect(x * 16 + 5, y * 16 + 8, 1, 3); ctx.fillRect(x * 16 + 7, y * 16 + 6, 1, 4);
      }
      // Bordillos alineados con la trama de calles.
      ctx.fillStyle = '#9d9e86';
      if ((x === 5 || x === 10) && !roadTile(0, y)) ctx.fillRect(x * 16 + (x === 5 ? 14 : 0), y * 16, 2, 16);
      if ((y === 5 || y === 10) && !roadTile(x, 0)) ctx.fillRect(x * 16, y * 16 + (y === 5 ? 14 : 0), 16, 2);
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
      sprite.setTexture(obstacle.kind === 'house' ? `house-${obstacle.variant}` : obstacle.kind);
      if (obstacle.kind === 'house') sprite.setDisplaySize(obstacle.width, obstacle.height + 32);
      else if (obstacle.kind === 'tree') sprite.setDisplaySize(76, 98);
      else if (obstacle.kind === 'rock') sprite.setDisplaySize(obstacle.width + 12, obstacle.height + 16);
      else sprite.setDisplaySize(obstacle.width, obstacle.height + 10);
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
