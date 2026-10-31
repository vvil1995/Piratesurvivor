import { MORGAN_ROUTE } from '../content/navigation.ts';
import { itemImage } from './item-art.ts';
import { isInvulnerable } from '../game/systems/guards.ts';
import { FRUITS } from '../content/fruits.ts';
import { BUFF_LOOK, buffEffect } from './buff-info.ts';
import { ITEMS } from '../content/items.ts';
import type { Run } from '../game/core/run.ts';
import type { RunResult } from '../game/core/types.ts';
import type { SaveStore } from '../platform/persistence/save.ts';
import { CHARACTERS, TRAINING_COST, TRAINING_MAX } from '../content/catalog.ts';
import { artUrl, pixelIcon, upgradeIcon } from './pixel-art.ts';
import { abilityIcon } from './ability-icon.ts';
import { combined } from '../game/systems/buffs.ts';
import { ABILITIES, ATTACK_SLOTS } from '../content/attacks.ts';
export const el = <T extends HTMLElement = HTMLElement>(id: string): T => {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Falta el elemento ${id}`);
  return node as T;
};
export const timeLabel = (seconds: number): string => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
export class View {
  private modal?: string;
  private attackSignature = '';
  private itemSignature = '';
  private xpLevel = 0;
  private xpRunId = '';
  private lastFocus?: HTMLElement;
  constructor() {
    document.addEventListener('keydown', event => {
      if (!this.modal || event.key !== 'Tab') return;
      const items = [...el(this.modal).querySelectorAll<HTMLElement>('button:not([disabled]), input:not([hidden]), select, [tabindex="0"], a[href]')].filter(node => node.offsetParent !== null);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || !el(this.modal).contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
  }
  showModal(id?: string): void {
    if (id === this.modal) return;
    if (!this.modal && id) this.lastFocus = document.activeElement as HTMLElement;
    for (const name of ['help', 'credits', 'paused', 'levelup', 'result', 'combinations', 'fruit-found', 'item-found', 'item-info', 'voyage']) el(name).hidden = name !== id;
    this.modal = id;
    el('home').inert = !!id;
    el('topbar').inert = !!id;
    el('home-footer').inert = !!id;
    el('hud').inert = !!id;
    if (id) requestAnimationFrame(() => el(id).querySelector<HTMLElement>('button:not([disabled]), input')?.focus());
    else if (this.lastFocus?.isConnected && this.lastFocus.offsetParent !== null) this.lastFocus.focus();
  }
  get modalId(): string | undefined { return this.modal; }
  home(store: SaveStore, characterId = 'luffy'): void {
    const character = CHARACTERS[characterId], trained = !!character.legacyTraining;
    el('character-title').textContent = character.name.toUpperCase(); el('character-tagline').textContent = character.title;
    el('character-style').textContent = character.style ?? 'SUPERVIVENCIA'; el('character-initial').textContent = ABILITIES[character.initialAbility].shortName.toUpperCase();
    el('portrait-index').textContent = String(Object.keys(CHARACTERS).indexOf(characterId) + 1).padStart(2, '0');
    const p = store.progress;
    el('best-time').textContent = timeLabel(p.bestTime);
    el('run-count').textContent = p.runs.toString().padStart(2, '0');
    el('win-count').textContent = p.wins.toString().padStart(2, '0');
    el('coins').textContent = p.coins.toString();
    el('training-level').textContent = trained ? `${p.training}/5` : '—';
    el('starting-hp').textContent = (character.stats.maxHp + (trained ? p.training * 5 : 0)).toString();
    const train = el<HTMLButtonElement>('train');
    train.disabled = !trained || p.training >= TRAINING_MAX || p.coins < TRAINING_COST(p.training);
    train.replaceChildren(document.createTextNode(!trained ? 'BETA' : p.training >= TRAINING_MAX ? 'MÁXIMO' : `${TRAINING_COST(p.training)} `));
    el('training-description').textContent = trained ? '+5 de vida inicial por nivel' : 'Acceso de prueba sin entrenamiento comprado';
    if (trained && artUrl('coin') && p.training < TRAINING_MAX) train.append(pixelIcon('coin'));
    train.setAttribute('aria-label', p.training >= TRAINING_MAX ? 'Entrenamiento al máximo' : `Entrenar por ${TRAINING_COST(p.training)} monedas`);
    el<HTMLInputElement>('reduced-motion').checked = p.reducedMotion;
    document.body.classList.toggle('reduced-motion', p.reducedMotion);
    this.warning(store.warning);
  }
  refreshArt(store: SaveStore, characterId = 'luffy'): void {
    const visual = CHARACTERS[characterId].visual;
    el<HTMLImageElement>('captain-portrait').src = artUrl(`${visual}-portrait`) || artUrl(visual);
    const avatar = document.createElement('img'); avatar.src = artUrl(`${visual}-face`); avatar.alt = '';
    el('captain-avatar').replaceChildren(avatar);
    el('coin-icon').replaceChildren(pixelIcon('coin'));
    this.home(store, characterId);
  }
  warning(message: string): void { el('storage-warning').hidden = !message; el('storage-warning').textContent = message; }
  setPlaying(playing: boolean): void {
    document.body.classList.toggle('in-run', playing);
    el('home').hidden = playing; el('topbar').hidden = playing; el('home-footer').hidden = playing;
    el('hud').hidden = !playing; el('touch-zone').hidden = !playing;
  }
  hud(run: Run): void {
    const p = run.player;
    const badges = p.attacks.filter(a => ABILITIES[a.id].buff && (combined(p, a.id) ? p.abilitySlots[p.selectedSlot].includes(a.id) : a.activeFor > 0)).map(a => {
      const buff = ABILITIES[a.id].buff!, look = BUFF_LOOK[buff.stat], badge = document.createElement('span'); badge.style.color = look.color;
      const effective = buff.stat === 'armor' ? `${Math.round(p.stats.armor * 100)}%` : buff.stat === 'cooldown' ? `−${Math.round((1 - p.stats.cooldown / p.baseStats.cooldown) * 100)}% CD` : `×${(p.stats[buff.stat] / p.baseStats[buff.stat]).toFixed(2)}`;
      badge.textContent = `↑${look.label} ${effective}`; badge.title = `${ABILITIES[a.id].name}: ${buffEffect(buff, a.level, combined(p, a.id))}. Total mostrado con los límites combinados.`; return badge;
    });
    for (const a of p.attacks) if (ABILITIES[a.id].behavior === 'guard' && a.activeFor > 0) {
      const badge = document.createElement('span'); badge.style.color = BUFF_LOOK.armor.color;
      badge.textContent = isInvulnerable(p) ? 'BALLOON · IMMUNE' : `↑DEF ${Math.round(p.stats.armor * 100)}%`; badge.title = isInvulnerable(p) ? 'Inmunidad solo durante la inflada; termina al desinflarse.' : `${ABILITIES[a.id].shortName}: reducción de daño activa, sujeta al límite global60%.`; badges.push(badge);
    }
    el('buff-strip').replaceChildren(...badges);
    el('fruit-active').textContent = p.fruit ? `FRUTA: ${FRUITS[p.fruit].name}` : '';
    el('loot-notice').textContent = run.lootNoticeFor > 0 ? run.lootNotice : '';
    const boss = run.encounter;
    el('hud').classList.toggle('boss-active', !!boss);
    el('boss-panel').hidden = !boss;
    if (boss) {
      const percentage = Math.max(0, boss.body.hp / boss.body.maxHp * 100);
      el('boss-phase').textContent = boss.state === 'dead' ? 'VICTORIA' : `FASE ${boss.phase}/3`;
      el('boss-panel').dataset.phase = String(boss.phase);
      el('boss-health-fill').style.width = `${percentage}%`;
      el('boss-panel').querySelector('[role="progressbar"]')!.setAttribute('aria-valuenow', String(Math.round(percentage)));
      el('boss-pattern').textContent = boss.moveName;
    }
    const signal = run.route.signal;
    el('navigation-hint').textContent = run.zone !== 'shells-town' ? '' : signal ? `CARTA NÁUTICA · ${Math.round(Math.hypot(signal.x - p.x, signal.y - p.y))}m · camina sobre ella` : run.time < MORGAN_ROUTE.availableAt ? 'Ruta de Morgan: cartas a partir de05:00' : 'Explora: puede aparecer una carta hacia Morgan';
    if (run.voyage) {
      const destination = run.voyage.destination;
      el('voyage-title').textContent = destination === 'morgan' ? 'RUMBO A MORGAN' : destination === 'orange' ? 'MORGAN DERROTADO · ORANGE TOWN' : 'REGRESO A SHELLS TOWN';
      el('voyage-description').textContent = destination === 'shells' ? 'Regresas con25HP y tu build. Otra carta náutica permitirá reintentarlo.' : destination === 'orange' ? 'Conservas vida y build. Te esperan los piratas de Buggy; su jefe llegará en otra actualización.' : 'Desembarcando en la base naval. Esquiva las marcas rojas de Morgan.';
      const progress = Math.min(1, run.voyage.elapsed / MORGAN_ROUTE.voyageSeconds);
      el('voyage').style.setProperty('--progress', String(progress));
      el('voyage-progress').style.width = `${progress * 100}%`;
    }
    el('area-label').textContent = run.zone === 'morgan-arena' ? 'BASE NAVAL · ARENA DE MORGAN' : run.zone === 'orange-town' ? 'ORANGE TOWN · PIRATAS DE BUGGY' : 'SHELLS TOWN · BASE NAVAL';
    el('character-name').textContent = (run.character.shortName ?? run.character.name).toUpperCase();
    el('run-items').textContent = `OBJETO ${Object.keys(p.items).length}/1`;
    el('run-items').title = Object.entries(p.items).map(([id, level]) => `${ITEMS[id].name} ${level}/3`).join(' · ') || 'Sin objeto';
    const equipped = Object.keys(p.items)[0], itemSignature = run.id + ':' + equipped + ':' + p.items[equipped];
    if (this.itemSignature !== itemSignature) {
      this.itemSignature = itemSignature; const slot = el<HTMLButtonElement>('equipped-item'); slot.disabled = !equipped; slot.replaceChildren();
      if (equipped) { slot.append(itemImage(equipped)); const label = document.createElement('span'); label.textContent = ITEMS[equipped].name; const level = document.createElement('small'); level.textContent = `NV. ${p.items[equipped]}/3`; slot.append(label, level); slot.setAttribute('aria-label', `Objeto: ${ITEMS[equipped].name}. Ver efecto`); }
      else { slot.textContent = '+ OBJETO'; slot.setAttribute('aria-label', 'Espacio de objeto vacío'); }
    }
    el('inventory-list').textContent = Object.entries(p.items).map(([id, level]) => `${ITEMS[id].name} ${level}/3`).join(' · ') || 'Sin objeto';
    el('run-berries').textContent = p.collectedBerries.toString();
    const signature = run.id + ':' + p.selectedSlot + ':' + p.abilitySlots.map(slot => slot.join(',')).join('|') + p.attacks.map(a => `${a.id}:${a.level}:${a.activeFor > 0}`).join('|');
    if (signature !== this.attackSignature) {
      this.attackSignature = signature;
      const slots = el('attack-slots'); slots.replaceChildren();
      for (let i = 0; i < ATTACK_SLOTS; i++) {
        const ids = p.abilitySlots[i], card = document.createElement('button'); card.type = 'button'; card.className = 'attack-slot'; card.dataset.slot = String(i);
        card.classList.toggle('selected', i === p.selectedSlot); card.setAttribute('aria-pressed', String(i === p.selectedSlot)); card.disabled = !ids.length;
        card.setAttribute('aria-label', `Seleccionar ranura ${i + 1}: ${ids.map(id => ABILITIES[id].shortName).join(' + ') || 'vacía'}`);
        card.classList.toggle('grouped', ids.length > 1);
        if (!ids.length) { card.classList.add('empty'); card.textContent = '+'; card.setAttribute('aria-label', `Espacio ${i + 1} libre`); }
        for (const id of ids) {
          const state = p.attacks.find(a => a.id === id)!, definition = ABILITIES[id], plus = state.level === 6;
          const component = document.createElement('div'); component.className = 'ability-component'; component.dataset.ability = id;
          component.classList.toggle('evolved', plus);
          component.append(pixelIcon(abilityIcon(definition)));
          const text = document.createElement('span'); text.className = 'component-name'; text.textContent = definition.shortName + (plus ? ' +' : '');
          const level = document.createElement('small');
          const mode = definition.buff ? combined(p, id) ? i === p.selectedSlot ? 'CONST' : 'RESERVA' : state.activeFor > 0 ? 'ACTIVO' : i === p.selectedSlot ? 'DESCANSO' : 'RESERVA' : '';
          level.textContent = mode ? `NV. ${state.level} · ${mode}` : plus ? 'NV. 6 · EVOLUCIÓN' : `NV. ${state.level} / 6`;
          component.classList.toggle('buff-constant', mode === 'CONST'); component.classList.toggle('buff-active', mode === 'ACTIVO'); component.classList.toggle('buff-rest', mode === 'DESCANSO');
          const detail = document.createElement('span'); detail.append(text, level); component.append(detail);
          component.title = `${definition.name}: ${plus ? definition.evolution : definition.description}`;
          component.setAttribute('aria-label', `${definition.name}, nivel ${state.level}${plus ? ', evolucionado' : ''} ${mode}`);
          card.append(component);
        }
        slots.append(card);
      }
    }
    el('attack-selection-label').textContent = 'ACTIVA: ' + p.abilitySlots[p.selectedSlot].map(id => ABILITIES[id].shortName).join(' + ') + ' · TOCA PARA CAMBIAR';
    el('clock').textContent = timeLabel(run.time);
    el('level').textContent = `NV. ${p.level}`;
    el('kills').textContent = p.kills.toString();
    el('health-text').textContent = `${Math.ceil(p.hp)} / ${Math.round(p.stats.maxHp)}`;
    const ratio = Math.max(0, Math.min(100, p.hp / p.stats.maxHp * 100));
    el('health-fill').style.width = `${ratio}%`;
    const health = document.querySelector('.health-track')!;
    health.setAttribute('aria-valuemax', String(Math.round(p.stats.maxHp))); health.setAttribute('aria-valuenow', String(Math.ceil(p.hp)));
    const xp = Math.min(100, p.xp / p.xpNext * 100), fill = el('xp-fill');
    if (this.xpLevel !== p.level || this.xpRunId !== run.id) {
      fill.style.transition = 'none'; this.xpLevel = p.level; this.xpRunId = run.id;
      requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.transition = ''; }));
    }
    fill.style.width = `${xp}%`;
    const track = document.querySelector('.xp-track')!;
    track.setAttribute('aria-valuenow', String(Math.floor(xp))); track.setAttribute('aria-valuetext', `${Math.floor(p.xp)} de ${p.xpNext}`);
    el('xp-text').textContent = `XP ${Math.floor(p.xp)} / ${p.xpNext}`;
    if (run.status === 'paused') {
      el('stat-damage').textContent = p.stats.damage.toFixed(1);
      el('stat-armor').textContent = `${Math.round(p.stats.armor * 100)}%`;
      el('stat-critical').textContent = `${Math.round(p.stats.critChance * 100)}% ×1,5`;
      el('stat-regen').textContent = `${p.stats.regeneration.toFixed(2)} HP/s`;
      el('stat-speed').textContent = `${Math.round(p.stats.speed)}`;
      el('stat-cooldown').textContent = `−${Math.round((1 - p.stats.cooldown / p.baseStats.cooldown) * 100)}%`;
    }
  }
  upgrades(run: Run, choose: (id: string) => void): void {
    const holder = el('upgrade-choices'); holder.replaceChildren();
    for (const upgrade of run.choices) {
      const button = document.createElement('button'); button.className = 'upgrade-card';
      const symbol = document.createElement('span'); symbol.className = 'upgrade-symbol'; symbol.append(pixelIcon('kind' in upgrade ? abilityIcon(ABILITIES[upgrade.abilityId]) : upgradeIcon(upgrade.id)));
      const title = document.createElement('h3'); title.textContent = upgrade.name;
      const description = document.createElement('p'); description.textContent = upgrade.description;
      const tag = document.createElement('small'); tag.textContent = 'kind' in upgrade ? ABILITIES[upgrade.abilityId].buff ? 'ELEGIR BUFF →' : 'ELEGIR HABILIDAD →' : `ELEGIR MEJORA →  ·  NIVEL ${(run.taken[upgrade.id] || 0) + 1}`;
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
