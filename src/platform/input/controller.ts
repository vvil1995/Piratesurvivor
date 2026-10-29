import type { Vector } from '../../game/core/types.ts';

export class Controller {
  private keys = new Set<string>();
  private touch: Vector = { x: 0, y: 0 };
  private pointerId: number | null = null;
  private origin = { x: 0, y: 0 };
  private abort = new AbortController();
  private stick: HTMLElement;
  private nub: HTMLElement;
  constructor(private isPlaying: () => boolean, private onPause: () => void) {
    // Algunos navegadores híbridos no declaran pointer:coarse aunque aceptan toque.
    document.body.classList.toggle('touch-device', navigator.maxTouchPoints > 0 || matchMedia('(pointer: coarse)').matches);
    this.stick = document.querySelector<HTMLElement>('#joystick')!;
    this.nub = document.querySelector<HTMLElement>('#joystick-nub')!;
    const signal = this.abort.signal;
    window.addEventListener('keydown', event => {
      if ((event.target as HTMLElement)?.matches('input, textarea, select, button')) return;
      const key = event.code.toLowerCase();
      if (['escape', 'keyp'].includes(key) && !event.repeat) { event.preventDefault(); this.onPause(); }
      if (this.isPlaying() && ['keyw', 'keya', 'keys', 'keyd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright', 'space'].includes(key)) {
        event.preventDefault(); this.keys.add(key);
      }
    }, { signal });
    window.addEventListener('keyup', event => this.keys.delete(event.code.toLowerCase()), { signal });
    window.addEventListener('blur', () => { this.reset(); this.onPause(); }, { signal });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { this.reset(); this.onPause(); } }, { signal });
    const zone = document.querySelector<HTMLElement>('#touch-zone')!;
    zone.addEventListener('pointerdown', event => {
      if (!this.isPlaying() || this.pointerId !== null || event.pointerType === 'mouse') return;
      event.preventDefault(); this.pointerId = event.pointerId; zone.setPointerCapture(event.pointerId);
      const rect = zone.getBoundingClientRect();
      this.origin = { x: Math.max(rect.left + 55, Math.min(rect.right - 55, event.clientX)), y: Math.max(rect.top + 55, Math.min(rect.bottom - 55, event.clientY)) };
      this.stick.style.left = `${this.origin.x - rect.left}px`;
      this.stick.style.top = `${this.origin.y - rect.top}px`;
      this.stick.classList.add('held'); this.move(event);
    }, { signal });
    zone.addEventListener('pointermove', event => { if (event.pointerId === this.pointerId) { event.preventDefault(); this.move(event); } }, { signal });
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) zone.addEventListener(name, event => {
      if (event.pointerId === this.pointerId) this.reset();
    }, { signal });
    window.addEventListener('resize', () => this.reset(), { signal });
  }
  private move(event: PointerEvent): void {
    const dx = event.clientX - this.origin.x, dy = event.clientY - this.origin.y;
    const length = Math.hypot(dx, dy), scale = Math.min(1, 45 / Math.max(1, length));
    this.touch = { x: dx * scale / 45, y: dy * scale / 45 };
    this.nub.style.transform = `translate(${dx * scale}px, ${dy * scale}px)`;
  }
  axis(): Vector {
    if (this.pointerId !== null) return this.touch;
    return { x: Number(this.keys.has('keyd') || this.keys.has('arrowright')) - Number(this.keys.has('keya') || this.keys.has('arrowleft')),
      y: Number(this.keys.has('keys') || this.keys.has('arrowdown')) - Number(this.keys.has('keyw') || this.keys.has('arrowup')) };
  }
  reset(): void {
    this.keys.clear(); this.pointerId = null; this.touch = { x: 0, y: 0 };
    this.stick?.classList.remove('held');
    if (this.nub) this.nub.style.transform = '';
  }
  destroy(): void { this.abort.abort(); this.reset(); }
}
