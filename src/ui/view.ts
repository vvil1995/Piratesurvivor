import type { Run } from '../game/core/run.ts';
import type { RunResult } from '../game/core/types.ts';
import type { SaveStore } from '../platform/persistence/save.ts';
import { TRAINING_COST, TRAINING_MAX } from '../content/catalog.ts';
import { artUrl, pixelIcon, upgradeIcon } from './pixel-art.ts';
export const el = <T extends HTMLElement = HTMLElement>(id: string): T => {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Falta el elemento ${id}`);
  return node as T;
};
export const timeLabel = (seconds: number): string => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
export class View {
  private modal?: string;
  private lastFocus?: HTMLElement;
  constructor() {
    document.addEventListener('keydown', event => {
      if (!this.modal || event.key !== 'Tab') return;
      const items = [...el(this.modal).querySelectorAll<HTMLElement>('button:not([disabled]), input:not([hidden]), [tabindex="0"], a[href]')].filter(node => node.offsetParent !== null);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || !el(this.modal).contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
  }
  showModal(id?: string): void {
    if (id === this.modal) return;
    if (!this.modal && id) this.lastFocus = document.activeElement as HTMLElement;
    for (const name of ['help', 'credits', 'paused', 'levelup', 'result']) el(name).hidden = name !== id;
    this.modal = id;
    el('home').inert = !!id;
    el('topbar').inert = !!id;
    el('home-footer').inert = !!id;
    el('hud').inert = !!id;
    if (id) requestAnimationFrame(() => el(id).querySelector<HTMLElement>('button:not([disabled]), input')?.focus());
    else if (this.lastFocus?.isConnected && this.lastFocus.offsetParent !== null) this.lastFocus.focus();
  }
  get modalId(): string | undefined { return this.modal; }
  home(store: SaveStore): void {
    const p = store.progress;
    el('best-time').textContent = timeLabel(p.bestTime);
    el('run-count').textContent = p.runs.toString().padStart(2, '0');
    el('win-count').textContent = p.wins.toString().padStart(2, '0');
    el('coins').textContent = p.coins.toString();
    el('training-level').textContent = `${p.training}/5`;
    el('starting-hp').textContent = (100 + p.training * 5).toString();
    const train = el<HTMLButtonElement>('train');
    train.disabled = p.training >= TRAINING_MAX || p.coins < TRAINING_COST(p.training);
    train.replaceChildren(document.createTextNode(p.training >= TRAINING_MAX ? 'MÁXIMO' : `${TRAINING_COST(p.training)} `));
    if (artUrl('coin') && p.training < TRAINING_MAX) train.append(pixelIcon('coin'));
    train.setAttribute('aria-label', p.training >= TRAINING_MAX ? 'Entrenamiento al máximo' : `Entrenar por ${TRAINING_COST(p.training)} monedas`);
    el<HTMLInputElement>('reduced-motion').checked = p.reducedMotion;
    document.body.classList.toggle('reduced-motion', p.reducedMotion);
    this.warning(store.warning);
  }
  refreshArt(store: SaveStore): void {
    el<HTMLImageElement>('captain-portrait').src = artUrl('straw-hat');
    const avatar = document.createElement('img'); avatar.src = artUrl('straw-hat-face'); avatar.alt = '';
    el('captain-avatar').replaceChildren(avatar);
    el('ability-icon').replaceChildren(pixelIcon('fist'));
    el('coin-icon').replaceChildren(pixelIcon('coin'));
    this.home(store);
  }
  warning(message: string): void { el('storage-warning').hidden = !message; el('storage-warning').textContent = message; }
  setPlaying(playing: boolean): void {
    document.body.classList.toggle('in-run', playing);
    el('home').hidden = playing; el('topbar').hidden = playing; el('home-footer').hidden = playing;
    el('hud').hidden = !playing; el('touch-zone').hidden = !playing;
  }
  hud(run: Run): void {
    const p = run.player;
    el('clock').textContent = timeLabel(run.time);
    el('area-label').textContent = `${run.definition.name.toUpperCase()} · ${Math.floor(run.player.x)}, ${Math.floor(run.player.y)}`; el('level').textContent = `NV. ${p.level}`;
    el('kills').textContent = p.kills.toString();
    el('health-text').textContent = `${Math.ceil(p.hp)} / ${Math.round(p.stats.maxHp)}`;
    const ratio = Math.max(0, Math.min(100, p.hp / p.stats.maxHp * 100));
    el('health-fill').style.width = `${ratio}%`;
    const health = document.querySelector('.health-track')!;
    health.setAttribute('aria-valuemax', String(Math.round(p.stats.maxHp))); health.setAttribute('aria-valuenow', String(Math.ceil(p.hp)));
    const xp = Math.min(100, p.xp / p.xpNext * 100);
    el('xp-fill').style.width = `${xp}%`; document.querySelector('.xp-track')!.setAttribute('aria-valuenow', String(Math.floor(xp)));
  }
  upgrades(run: Run, choose: (id: string) => void): void {
    const holder = el('upgrade-choices'); holder.replaceChildren();
    for (const upgrade of run.choices) {
      const button = document.createElement('button'); button.className = 'upgrade-card';
      const symbol = document.createElement('span'); symbol.className = 'upgrade-symbol'; symbol.append(pixelIcon(upgradeIcon(upgrade.id)));
      const title = document.createElement('h3'); title.textContent = upgrade.name;
      const description = document.createElement('p'); description.textContent = upgrade.description;
      const tag = document.createElement('small'); tag.textContent = `ELEGIR MEJORA →  ·  NIVEL ${(run.taken[upgrade.id] || 0) + 1}`;
      button.append(symbol, title, description, tag); button.addEventListener('click', () => choose(upgrade.id)); holder.append(button);
    }
    this.showModal('levelup');
  }
  result(result: RunResult): void {
    const victory = result.outcome === 'victory';
    el('result-eyebrow').textContent = victory ? 'UNA NUEVA LEYENDA' : 'LA AVENTURA NO TERMINA AQUÍ';
    el('result-title').textContent = victory ? '¡ERES LEYENDA!' : 'HASTA LOS GRANDES CAEN.';
    el('result-copy').textContent = victory ? 'Una promesa cumplida. El mar te espera.' : 'Vuelve al puerto, entrena y regresa más fuerte.';
    el('result-time').textContent = timeLabel(result.seconds); el('result-kills').textContent = String(result.kills);
    el('result-level').textContent = String(result.level); el('result-coins').textContent = `+${result.coins} ◉`;
    this.showModal('result');
  }
}
