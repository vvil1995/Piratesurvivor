export class Pool<T extends { active: boolean }> {
  readonly items: T[];
  private cursor = 0;
  constructor(capacity: number, factory: () => T) {
    this.items = Array.from({ length: capacity }, factory);
  }
  acquire(): T | undefined {
    for (let n = 0; n < this.items.length; n++) {
      const item = this.items[this.cursor];
      this.cursor = (this.cursor + 1) % this.items.length;
      if (!item.active) { item.active = true; return item; }
    }
    return undefined;
  }
  clear(): void { for (const item of this.items) item.active = false; this.cursor = 0; }
  get count(): number { let n = 0; for (const item of this.items) if (item.active) n++; return n; }
}
