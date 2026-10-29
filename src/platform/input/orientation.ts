interface LockableOrientation { lock?: (orientation: string) => Promise<void> }
export class MobileOrientation {
  blocked = false;
  private overlay = document.getElementById('rotate-screen')!;
  constructor(private active: () => boolean, private onBlock: () => void) {
    const update = () => this.sync();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    window.visualViewport?.addEventListener('resize', update);
    screen.orientation?.addEventListener('change', update);
    document.getElementById('rotate-action')!.addEventListener('click', () => { void this.requestLandscape(); });
  }
  sync(): void {
    const touch = navigator.maxTouchPoints > 0 || matchMedia('(pointer: coarse)').matches;
    const blocked = touch && this.active() && innerHeight > innerWidth;
    this.overlay.hidden = !blocked;
    for (const name of ['paused', 'levelup', 'hud', 'touch-zone']) document.getElementById(name)!.inert = blocked;
    if (blocked && !this.blocked) {
      this.blocked = true; this.onBlock();
      requestAnimationFrame(() => document.getElementById('rotate-action')!.focus());
    }
    this.blocked = blocked;
    if (!blocked && this.active() && document.getElementById('paused')!.hidden === false) document.getElementById('resume')!.focus();
  }
  async requestLandscape(): Promise<void> {
    const tip = document.getElementById('rotate-tip')!;
    try {
      // Android suele exigir fullscreen iniciado por un gesto antes de permitir lock().
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      const orientation = screen.orientation as unknown as LockableOrientation;
      if (!orientation?.lock) throw new Error('Rotación no disponible');
      await orientation.lock('landscape');
      this.sync();
    } catch {
      tip.textContent = 'Gira el dispositivo físicamente. Si no cambia, desactiva el bloqueo de orientación en los ajustes rápidos. En iPhone el giro automático puede no estar disponible.';
    }
  }
}
