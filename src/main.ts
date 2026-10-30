import Phaser from 'phaser';
import './ui/style.css';
import { BattleScene } from './game/scenes/battle.ts';
import { CHARACTERS } from './content/catalog.ts';
import { Run } from './game/core/run.ts';
import { Controller } from './platform/input/controller.ts';
import { MobileOrientation } from './platform/input/orientation.ts';
import { SaveStore } from './platform/persistence/save.ts';
import { renderCombinations } from './ui/combinations.ts';
import { View, el } from './ui/view.ts';

const store = new SaveStore();
const view = new View();
let run: Run | undefined;
let selectedCharacter = 'luffy';
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
  else if (run.status === 'combining') {
    view.showModal('combinations');
    const refresh = () => { previousStatus = ''; sync(); };
    renderCombinations(run, {
      move: (id, to) => { const ok = run!.moveComponent(id, to); if (ok) refresh(); return ok; },
      merge: (from, to) => { const ok = run!.combine(from, to); if (ok) refresh(); return ok; },
      done: () => { if (!orientation.blocked && run!.finishCombinations()) { refresh(); if (run?.status === 'playing') (document.activeElement as HTMLElement)?.blur(); } },
      learnWith: to => { if (!orientation.blocked && run!.finishCombinations(to)) { refresh(); if (run?.status === 'playing') (document.activeElement as HTMLElement)?.blur(); } },
      cancel: () => { run!.cancelCombinations(); refresh(); if (run?.status === 'playing') (document.activeElement as HTMLElement)?.blur(); },
    });
  }
  else if (run.status === 'paused') view.showModal('paused');
  else if (run.status === 'defeat' || run.status === 'victory') {
    const result = run.result()!; store.record(result); view.result(result); view.warning(store.warning);
  } else view.showModal();
}
async function start(characterId = selectedCharacter): Promise<void> {
  if (!CHARACTERS[characterId]) return;
  controller.reset(); el('loading').hidden = false;
  try {
    await scene.ensureActorArt(CHARACTERS[characterId].visual);
    selectedCharacter = characterId;
    run = new Run(characterId, CHARACTERS[characterId].legacyTraining ? store.progress.training : 0); previousStatus = ''; hudAt = 0;
    view.refreshArt(store, selectedCharacter); view.showModal(); view.setPlaying(true);
    (document.activeElement as HTMLElement)?.blur(); sync(); orientation.sync();
  } catch {
    el('beta-load-status').textContent = 'No se pudo cargar el personaje. Vuelve a intentarlo.';
  } finally { el('loading').hidden = true; }
}
function home(): void {
  controller.reset(); run = undefined; previousStatus = ''; view.showModal(); view.setPlaying(false); view.home(store, selectedCharacter); orientation.sync(); el('start').focus();
}
el('start').addEventListener('click', () => { void start(); }); el('retry').addEventListener('click', () => { void start(); });
el('return-home').addEventListener('click', home); el('abandon').addEventListener('click', home);
el('rotate-home').addEventListener('click', home);
for (const id of ['manage-abilities', 'pause-build']) el(id).addEventListener('click', () => {
  if (orientation.blocked || !run?.openCombinations()) return; previousStatus = ''; sync();
});
el('pause').addEventListener('click', pause);
el('attack-slots').addEventListener('click', event => {
  const slot = (event.target as Element).closest<HTMLButtonElement>('button[data-slot]');
  if (slot && !orientation.blocked && run?.selectSlot(Number(slot.dataset.slot))) { view.hud(run); slot.blur(); }
});
document.addEventListener('keydown', event => {
  if (!event.ctrlKey && !event.metaKey && !event.altKey && /^[1-4]$/.test(event.key) && !event.repeat && !orientation.blocked && run?.selectSlot(Number(event.key) - 1)) view.hud(run);
});
el('resume').addEventListener('click', () => { if (orientation.blocked) return; run?.resume(); view.showModal(); (document.activeElement as HTMLElement)?.blur(); sync(); });
el('train').addEventListener('click', () => { if (!CHARACTERS[selectedCharacter].legacyTraining) return; store.train(); view.home(store, selectedCharacter); });
el<HTMLSelectElement>('beta-character').addEventListener('change', async event => {
  const id = (event.target as HTMLSelectElement).value; if (!CHARACTERS[id] || run) return;
  selectedCharacter = id; el<HTMLButtonElement>('start').disabled = true;
  el('beta-load-status').textContent = 'Preparando personaje…';
  try {
    await scene.ensureActorArt(CHARACTERS[id].visual);
    if (selectedCharacter === id) { view.refreshArt(store, id); el('beta-load-status').textContent = 'Acceso de prueba. No compra ni desbloquea personajes.'; }
  } catch {
    if (selectedCharacter === id) { selectedCharacter = 'luffy'; el<HTMLSelectElement>('beta-character').value = 'luffy'; view.refreshArt(store, 'luffy'); el('beta-load-status').textContent = 'No se pudo cargar. Prueba otra vez.'; }
  } finally { if (selectedCharacter === id || selectedCharacter === 'luffy') el<HTMLButtonElement>('start').disabled = false; }
});
el('help-open').addEventListener('click', () => view.showModal('help'));
el('credits-open').addEventListener('click', () => view.showModal('credits'));
document.querySelector('.brand')!.addEventListener('click', event => { event.preventDefault(); home(); });
document.querySelectorAll<HTMLElement>('[data-close]').forEach(button => button.addEventListener('click', () => view.showModal()));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && ['help', 'credits'].includes(view.modalId || '')) view.showModal();
});
el<HTMLInputElement>('reduced-motion').addEventListener('change', event => { store.progress.reducedMotion = (event.target as HTMLInputElement).checked; store.flush(); view.home(store, selectedCharacter); });
el('export-save').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([store.export()], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = 'one-piece-survivor-progreso.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
el<HTMLInputElement>('import-save').addEventListener('change', async event => {
  const input = event.target as HTMLInputElement, file = input.files?.[0];
  if (!file) return;
  const success = file.size < 20000 && store.import(await file.text());
  el('import-status').textContent = success ? 'Progreso importado.' : 'Archivo de progreso inválido. No se ha reemplazado tu progreso.';
  input.value = ''; view.home(store, selectedCharacter);
});
el('fullscreen').addEventListener('click', async () => {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
  catch { el('fullscreen').title = 'Este navegador no permite pantalla completa. Puedes usar el navegador normalmente.'; }
});
if (!document.documentElement.requestFullscreen) el('fullscreen').hidden = true;
window.addEventListener('pagehide', () => store.flush());
view.home(store, selectedCharacter);
const scene = new BattleScene({ run: () => run, axis: () => controller.axis(), tick: sync,
  ready: () => { view.refreshArt(store, selectedCharacter); el('loading').hidden = true; }, reducedMotion: () => store.progress.reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches });
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
declare global { interface Window { __OPS_QA__?: { getRun: () => Run | undefined; store: SaveStore; tick: () => void; draw: (deltaMs?: number) => void; start: (characterId?: string) => Promise<void>; metrics: () => { legSwing: number; footsteps: number; actorScaleY: number; actorAngle: number; actorTexture: string; actorDirection: string; actorFrame: number; renderedChunks: number; textureSlots: number } } } }
if (import.meta.env.DEV || import.meta.env.VITE_QA === 'true') window.__OPS_QA__ = { getRun: () => run, store, tick: sync, draw: (delta = 0) => scene.update(performance.now(), delta), start, metrics: () => scene.diagnostics };
