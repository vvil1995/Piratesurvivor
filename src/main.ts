import Phaser from 'phaser';
import './ui/style.css';
import { BattleScene } from './game/scenes/battle.ts';
import { Run } from './game/core/run.ts';
import { Controller } from './platform/input/controller.ts';
import { MobileOrientation } from './platform/input/orientation.ts';
import { SaveStore } from './platform/persistence/save.ts';
import { View, el } from './ui/view.ts';

const store = new SaveStore();
const view = new View();
let run: Run | undefined;
let previousStatus = '';
let hudAt = 0;
const pause = () => {
  if (run?.status === 'playing') { run.pause(); controller.reset(); sync(); }
  else if (run?.status === 'paused' && document.hasFocus() && view.modalId === 'paused') { /* reanudar solo mediante acción explícita */ }
};
const controller = new Controller(() => run?.status === 'playing', pause);
const orientation = new MobileOrientation(() => !!run && !['defeat', 'victory'].includes(run.status), pause);
function sync(): void {
  if (!run) return;
  const now = performance.now();
  if (now - hudAt > 100 || run.status !== previousStatus) { view.hud(run); hudAt = now; }
  if (run.status === previousStatus) return;
  previousStatus = run.status;
  if (run.status !== 'playing') controller.reset();
  if (run.status === 'levelup') view.upgrades(run, id => {
    if (!run) return;
    if (run.selectUpgrade(id)) { previousStatus = ''; view.showModal(); (document.activeElement as HTMLElement)?.blur(); sync(); }
  });
  else if (run.status === 'paused') view.showModal('paused');
  else if (run.status === 'defeat' || run.status === 'victory') {
    const result = run.result()!; store.record(result); view.result(result); view.warning(store.warning);
  } else view.showModal();
}
function start(): void {
  controller.reset(); run = new Run('luffy', store.progress.training); previousStatus = ''; hudAt = 0;
  view.showModal(); view.setPlaying(true); (document.activeElement as HTMLElement)?.blur(); sync(); orientation.sync();
}
function home(): void {
  controller.reset(); run = undefined; previousStatus = ''; view.showModal(); view.setPlaying(false); view.home(store); orientation.sync(); el('start').focus();
}
el('start').addEventListener('click', start); el('retry').addEventListener('click', start);
el('return-home').addEventListener('click', home); el('abandon').addEventListener('click', home);
el('rotate-home').addEventListener('click', home);
el('pause').addEventListener('click', pause);
el('resume').addEventListener('click', () => { if (orientation.blocked) return; run?.resume(); view.showModal(); (document.activeElement as HTMLElement)?.blur(); sync(); });
el('train').addEventListener('click', () => { store.train(); view.home(store); });
el('help-open').addEventListener('click', () => view.showModal('help'));
el('credits-open').addEventListener('click', () => view.showModal('credits'));
document.querySelector('.brand')!.addEventListener('click', event => { event.preventDefault(); home(); });
document.querySelectorAll<HTMLElement>('[data-close]').forEach(button => button.addEventListener('click', () => view.showModal()));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && ['help', 'credits'].includes(view.modalId || '')) view.showModal();
});
el<HTMLInputElement>('reduced-motion').addEventListener('change', event => { store.progress.reducedMotion = (event.target as HTMLInputElement).checked; store.flush(); view.home(store); });
el('export-save').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([store.export()], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = 'one-piece-survivor-progreso.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
el<HTMLInputElement>('import-save').addEventListener('change', async event => {
  const input = event.target as HTMLInputElement, file = input.files?.[0];
  if (!file) return;
  const success = file.size < 20000 && store.import(await file.text());
  el('import-status').textContent = success ? 'Progreso importado.' : 'Archivo de progreso inválido. No se ha reemplazado tu progreso.';
  input.value = ''; view.home(store);
});
el('fullscreen').addEventListener('click', async () => {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
  catch { el('fullscreen').title = 'Este navegador no permite pantalla completa. Puedes usar el navegador normalmente.'; }
});
if (!document.documentElement.requestFullscreen) el('fullscreen').hidden = true;
window.addEventListener('pagehide', () => store.flush());
view.home(store);
const scene = new BattleScene({ run: () => run, axis: () => controller.axis(), tick: sync,
  ready: () => { view.refreshArt(store); el('loading').hidden = true; }, reducedMotion: () => store.progress.reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches });
const game = new Phaser.Game({
  type: Phaser.AUTO, parent: 'game', backgroundColor: '#607780',
  width: window.innerWidth, height: window.innerHeight,
  pixelArt: true, roundPixels: true, antialias: false,
  scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { keyboard: false, mouse: false, touch: false },
  audio: { noAudio: true }, banner: false, scene: [scene],
  fps: { target: 60, smoothStep: false },
});
// El parent es fijo. Al girar, la medida CSS puede cambiar después del evento inicial.
// Observar su tamaño real evita estirar un canvas que conserva las medidas verticales.
const resizeCanvas = () => {
  if (!game.isBooted) return;
  const parent = el('game');
  const width = parent.clientWidth, height = parent.clientHeight;
  if (width && height && (game.scale.gameSize.width !== width || game.scale.gameSize.height !== height)) game.scale.resize(width, height);
};
new ResizeObserver(resizeCanvas).observe(el('game'));
window.addEventListener('resize', () => requestAnimationFrame(resizeCanvas));
window.addEventListener('orientationchange', () => requestAnimationFrame(resizeCanvas));
window.visualViewport?.addEventListener('resize', () => requestAnimationFrame(resizeCanvas));

// Solo en desarrollo o en compilación de QA explícita. No se incluye en producción.
declare global { interface Window { __OPS_QA__?: { getRun: () => Run | undefined; store: SaveStore; tick: () => void; start: () => void; metrics: () => { actorTexture: string; renderedChunks: number; textureSlots: number } } } }
if (import.meta.env.DEV || import.meta.env.VITE_QA === 'true') window.__OPS_QA__ = { getRun: () => run, store, tick: sync, start, metrics: () => scene.diagnostics };
