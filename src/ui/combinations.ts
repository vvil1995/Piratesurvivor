import type { Run } from '../game/core/run.ts';
import { ABILITIES } from '../content/attacks.ts';
import { hasFreeSlot } from '../game/systems/loadout.ts';
import { combined } from '../game/systems/buffs.ts';
import { attackCooldown } from '../game/systems/stats.ts';
import { abilityIcon } from './ability-icon.ts';
import { pixelIcon } from './pixel-art.ts';
interface Actions { move: (id: string, to: number) => boolean; merge: (from: number, to: number) => boolean; done: () => void; cancel: () => void }
const node = <T extends HTMLElement>(id: string) => document.getElementById(id)! as T;
export function renderCombinations(run: Run, actions: Actions): void {
  const player = run.player, message = node('combination-message');
  message.textContent = run.pendingAbility ? `Vas a aprender ${run.pendingAbility.name}. Agrupa movimientos para dejar una ranura libre.` : 'Mueve componentes o agrupa ranuras. Los cambios conservan niveles y recargas.';
  const slots = node('combination-slots'); slots.replaceChildren();
  player.abilitySlots.forEach((ids, index) => {
    const card = document.createElement('section'); card.className = 'combination-slot'; card.dataset.slot = String(index);
    const heading = document.createElement('h3'); heading.textContent = `Ranura ${index + 1} · ${ids.length}/4`; card.append(heading);
    if (!ids.length) { const p = document.createElement('p'); p.textContent = 'Libre'; card.append(p); }
    for (const id of ids) {
      const definition = ABILITIES[id], state = player.attacks.find(a => a.id === id)!, info = document.createElement('article'); info.className = 'component-detail';
      const title = document.createElement('h4'); title.append(pixelIcon(abilityIcon(definition)), document.createTextNode(`${definition.shortName}${state.level === 6 ? ' +' : ''} · NV. ${state.level}`));
      const description = document.createElement('p'); description.textContent = state.level === 6 ? definition.evolution : definition.description;
      const timing = document.createElement('p'); timing.className = 'component-timing';
      if (definition.buff) {
        const constant = combined(player, id), b = definition.buff, value = (constant ? b.constant : b.temporary)[state.level - 1];
        timing.textContent = `${constant ? 'CONSTANTE' : state.activeFor > 0 ? 'TEMPORAL · ACTIVO' : 'TEMPORAL · DESCANSO'} · ${value >= 0 ? '+' : ''}${Math.round(value * 100)}% · ${constant ? 'Sin ciclo' : `${b.duration[state.level - 1]}s activo / ${b.cooldown[state.level - 1]}s descanso`}`;
      } else timing.textContent = `Cooldown ${attackCooldown(definition.levels[0].cooldown, definition.levels[state.level - 1].cooldown, player).toFixed(2)}s · restante ${state.cooldown.toFixed(1)}s`;
      const controls = document.createElement('div'); controls.className = 'component-controls';
      const select = document.createElement('select'); select.setAttribute('aria-label', `Destino de ${definition.shortName}`);
      player.abilitySlots.forEach((slot, destination) => {
        if (destination === index || slot.length >= 4) return;
        const option = document.createElement('option'); option.value = String(destination); option.textContent = `Ranura ${destination + 1}`; select.append(option);
      });
      const move = document.createElement('button'); move.className = 'secondary-button'; move.textContent = 'Mover'; move.disabled = !select.options.length;
      move.onclick = () => { if (!actions.move(id, Number(select.value))) message.textContent = 'No se puede mover a esa ranura.'; };
      controls.append(select, move); info.append(title, description, timing, controls); card.append(info);
    }
    slots.append(card);
  });
  for (const key of ['merge-from', 'merge-to']) {
    const select = node<HTMLSelectElement>(key); select.replaceChildren();
    player.abilitySlots.forEach((ids, index) => { if (ids.length) { const option = document.createElement('option'); option.value = String(index); option.textContent = `Ranura ${index + 1} (${ids.length}/4)`; select.append(option); } });
  }
  node<HTMLSelectElement>('merge-to').selectedIndex = Math.min(1, node<HTMLSelectElement>('merge-to').options.length - 1);
  node('merge-apply').onclick = () => { if (!actions.merge(Number(node<HTMLSelectElement>('merge-from').value), Number(node<HTMLSelectElement>('merge-to').value))) message.textContent = 'Elige dos ranuras distintas que sumen como máximo cuatro movimientos.'; };
  const done = node<HTMLButtonElement>('combination-done'); done.disabled = !!run.pendingAbility && !hasFreeSlot(player);
  done.textContent = run.pendingAbility ? `Aprender ${ABILITIES[run.pendingAbility.abilityId].shortName}` : 'Continuar'; done.onclick = actions.done;
  node('combination-cancel').onclick = actions.cancel;
}
