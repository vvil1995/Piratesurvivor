import { combined } from '../game/systems/buffs.ts';
import { buffEffect } from './buff-info.ts';
import type { Run } from '../game/core/run.ts';
import { ABILITIES } from '../content/attacks.ts';
import { attackCooldown } from '../game/systems/stats.ts';
import { abilityIcon } from './ability-icon.ts';
import { pixelIcon } from './pixel-art.ts';
export interface CombinationActions { pair: (first: number | 'pending', second: number | 'pending') => boolean; move: (id: string, to: number) => boolean; done: () => void; cancel: () => void }
const node = <T extends HTMLElement>(id: string) => document.getElementById(id)! as T;
export function renderCombinations(run: Run, actions: CombinationActions): void {
  const p = run.player;
  type Card = { key: number | 'pending'; ids: string[] };
  const cards: Card[] = p.abilitySlots.map((ids, key) => ({ key, ids })).filter(c => c.ids.length);
  if (run.pendingAbility) cards.push({ key: 'pending', ids: [run.pendingAbility.abilityId] });
  const joinable = cards.some(a => cards.some(b => a !== b && a.ids.length + b.ids.length <= 4));
  let first: Card | undefined;
  const draw = () => {
    node('combination-message').textContent = run.bossCombinationReward && !joinable ? `${run.zone==='arlong-arena'?'Arlong':run.zone==='krieg-arena'?'Don Krieg':run.zone==='kuro-arena'?'Kuro':run.zone==='buggy-arena'?'Buggy':'Morgan'} derrotado · No hay dos grupos compatibles. Puedes continuar sin combinar.` : (!run.canJoinMovements || !joinable) ? 'Necesitas un objeto de unión obtenido al vencer a Morgan u otro jefe. No se consigue aprendiendo un quinto movimiento.' : first ? '2/2 · ¿Con qué habilidad quieres juntarla?' : `${run.bossCombinationReward ? `${run.zone==='arlong-arena'?'Arlong':run.zone==='krieg-arena'?'Don Krieg':run.zone==='kuro-arena'?'Kuro':run.zone==='buggy-arena'?'Buggy':'Morgan'} derrotado · Recompensa · ` : ''}Objeto de unión ×${run.unionTokens} · 1/2 · Selecciona la primera habilidad.`;
    const slots = node('combination-slots'); slots.replaceChildren();
    for (const card of cards) {
      if (card === first) continue;
      const button = document.createElement('button'); button.className = 'combination-card'; button.dataset.join = String(card.key);
      button.disabled = !run.canJoinMovements || !cards.some(other => other !== card && other.ids.length + card.ids.length <= 4) || !!first && first.ids.length + card.ids.length > 4;
      for (const id of card.ids) {
        const definition = ABILITIES[id], row = document.createElement('span'), level = p.attacks.find(a => a.id === id)?.level ?? 1;
        row.append(pixelIcon(abilityIcon(definition)), document.createTextNode(`${definition.shortName}${level === 6 ? ' +' : ''} · Nv.${level}`)); button.append(row);
      }
      const label = document.createElement('small'); label.textContent = card.key === 'pending' ? 'NUEVA · PENDIENTE' : card.ids.length > 1 ? `Grupo de${card.ids.length} · conserva todos sus componentes` : 'Individual'; button.append(label);
      button.onclick = () => { if (!first) { first = card; draw(); } else if (!actions.pair(first.key, card.key)) node('combination-message').textContent = 'No se pueden juntar esos movimientos.'; };
      slots.append(button);
    }
    const chosen = node('combination-chosen'); chosen.textContent = first ? `Primera: ${first.ids.map(id => ABILITIES[id].shortName).join(' + ')}` : '';
    node('combination-cancel').textContent = first ? '← Elegir otra primera' : 'Volver';
    node('combination-cancel').onclick = () => { if (first) { first = undefined; draw(); } else actions.cancel(); };
  };
  const details = node('combination-details'); details.replaceChildren();
  const empty = p.abilitySlots.findIndex(s => !s.length);
  for (const state of p.attacks) {
    const ability = ABILITIES[state.id], row = document.createElement('p');
    row.textContent = `${ability.shortName}${state.level === 6 ? ' +' : ''} · Nv.${state.level} · ${attackCooldown(ability.levels[0].cooldown, ability.levels[state.level - 1].cooldown, p).toFixed(2)}s · ${state.level === 6 ? ability.evolution : ability.description}`;
    if (ability.buff) { const constant = combined(p, state.id); row.textContent = `${ability.shortName} · Nv.${state.level} · ${buffEffect(ability.buff, state.level, constant)} · ${constant ? 'Constante en el grupo seleccionado' : `${ability.buff.duration[state.level - 1]}s activo / ${ability.buff.cooldown[state.level - 1]}s descanso`}`; }
    const source = p.abilitySlots.find(s => s.includes(state.id))!;
    if (source.length > 1 && empty >= 0) { const split = document.createElement('button'); split.className = 'secondary-button'; split.textContent = 'Separar a una ranura libre'; split.onclick = () => actions.move(state.id, empty); row.append(split); }
    details.append(row);
  }
  node<HTMLButtonElement>('combination-done').hidden = !!run.pendingAbility;
  node('combination-done').textContent = run.bossCombinationReward ? run.zone!=='morgan-arena'?'Continuar':'Continuar a Orange Town' : 'Continuar';
  node('combination-done').onclick = actions.done;
  draw();
}
