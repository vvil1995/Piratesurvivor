import { TRAINING, trainingCost, trainingLevel } from '../content/training.ts';
import { CHARACTERS } from '../content/catalog.ts';
import { ABILITIES } from '../content/attacks.ts';
import { trainingIcon } from './training-art.ts';
import type { SaveStore } from '../platform/persistence/save.ts';
const node = (id: string) => document.getElementById(id)!;
export function renderTraining(store: SaveStore, characterId: string, refresh: () => void): void {
  const p = store.getTraining(characterId), character = CHARACTERS[characterId];
  node('training-title').textContent = `${character.shortName} · NIVEL ${trainingLevel(p)}`;
  node('training-wallet').textContent = `${store.progress.coins} berries`;
  const grid = node('training-grid'); grid.replaceChildren();
  for (const [id, rule] of Object.entries(TRAINING)) {
    const level = p.levels[id] ?? 0, card = document.createElement('article'); card.className = 'training-card'; card.dataset.training = id;
    const icon = trainingIcon(id, rule.name), content = document.createElement('div'), title = document.createElement('b'), text = document.createElement('p'), progress = document.createElement('div'), buy = document.createElement('button');
    title.textContent = `${rule.name} · ${level}/${rule.max}`; text.textContent = `${rule.effect} por nivel`;
    progress.className = 'training-segments'; progress.setAttribute('aria-label', `${level} de ${rule.max}`);
    for (let i = 0; i < rule.max; i++) { const segment = document.createElement('i'); segment.classList.toggle('bought', i < level); progress.append(segment); }
    content.append(title, text, progress); const cost = trainingCost(id, level); buy.className = 'training-buy'; buy.dataset.buyTraining = id;
    buy.textContent = level >= rule.max ? 'MÁX.' : `${cost} ฿`; buy.disabled = level >= rule.max || store.progress.coins < cost;
    buy.setAttribute('aria-label', `Comprar ${rule.name} por ${cost} berries`); buy.onclick = () => { if (store.buyTraining(characterId, id)) refresh(); };
    card.append(icon, content, buy); grid.append(card);
  }
  const choices = node('training-config'); choices.replaceChildren();
  const starter = p.starter ?? character.initialAbility;
  const configure = (first: string, second: string | undefined, bans = p.bans) => {
    const validBans = bans.filter(id => id !== first && id !== second);
    if (store.configureTraining(characterId, first, second, validBans)) refresh();
  };
  for (const kind of ['starter', 'second'] as const) {
    const label = document.createElement('label'), select = document.createElement('select'); select.id = `training-${kind}`;
    label.textContent = kind === 'starter' ? 'ATAQUE INICIAL' : 'SEGUNDO ATAQUE';
    if (kind === 'second') { const option = document.createElement('option'); option.value = ''; option.textContent = 'Sin segundo ataque'; select.append(option); }
    for (const id of character.abilities) {
      if (p.bans.includes(id) || kind === 'second' && id === starter) continue;
      const option = document.createElement('option'); option.value = id; option.textContent = ABILITIES[id].name; select.append(option);
    }
    select.disabled = !(kind === 'starter' ? p.levels.starter : p.levels.repertoire); select.value = kind === 'starter' ? starter : p.second ?? '';
    select.onchange = () => configure(kind === 'starter' ? select.value : starter, kind === 'second' ? select.value || undefined : p.second === select.value ? undefined : p.second);
    label.append(select); choices.append(label);
  }
  const heading = document.createElement('p'); heading.textContent = `HABILIDADES VETADAS · ${p.bans.length}/${p.levels.bans ?? 0} · no aparecerán en cartas`; choices.append(heading);
  for (const id of character.abilities) {
    const label = document.createElement('label'), input = document.createElement('input'); input.type = 'checkbox'; input.checked = p.bans.includes(id); input.dataset.ban = id;
    input.disabled = id === starter || id === p.second || !input.checked && p.bans.length >= (p.levels.bans ?? 0);
    input.onchange = () => configure(starter, p.second, input.checked ? [...p.bans, id] : p.bans.filter(a => a !== id));
    label.className = 'training-ban'; label.append(input, document.createTextNode(ABILITIES[id].shortName)); choices.append(label);
  }
}
