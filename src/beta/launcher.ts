import { BETA_TEST_ENABLED,BETA_DESTINATIONS,type BetaSettings } from './config.ts';
import { CHARACTERS } from '../content/catalog.ts';
import { ABILITIES } from '../content/attacks.ts';
import { availableAbilities } from '../game/systems/loadout.ts';
export function installBetaLauncher(start:(settings:BetaSettings)=>Promise<void>):void{
 if(!BETA_TEST_ENABLED)return;
 const button=document.createElement('button');button.id='beta-test';button.className='secondary-button';button.textContent='BETA TEST · ELEGIR MUNDO / JEFE';document.querySelector('#start')!.after(button);
 const dialog=document.createElement('dialog');dialog.id='beta-test-dialog';dialog.style.cssText='background:#102631;color:#f1deb0;border:1px solid #bfa565;max-width:92vw;width:620px;max-height:88dvh;overflow:auto;padding:20px';
 dialog.innerHTML='<h2>Beta test</h2><p>Práctica visual. No guarda berries, victorias ni récords. Usa el personaje seleccionado en el menú.</p><label>Destino <select id="beta-destination"></select></label> <label>Nivel <input id="beta-level" type="number" min="1" max="100" style="width:65px"></label><p>Elige ataques, nivel y ranura. Los de la misma ranura se activan independientemente.</p><div id="beta-build"></div><p id="beta-error" role="status"></p><button id="beta-enter" class="primary-button">ENTRAR A PROBAR</button><button id="beta-close" class="secondary-button">Cerrar</button>';
 document.body.append(dialog);const dest=dialog.querySelector<HTMLSelectElement>('#beta-destination')!,level=dialog.querySelector<HTMLInputElement>('#beta-level')!,build=dialog.querySelector('#beta-build')!;
 for(const d of BETA_DESTINATIONS)dest.add(new Option(d[1],d[0]));
 const render=()=>{const preset=BETA_DESTINATIONS.find(d=>d[0]===dest.value)!,id=(document.querySelector('#beta-character') as HTMLSelectElement).value;level.value=String(preset[2]);build.replaceChildren();
  for(const [i,a]of availableAbilities({characterId:id} as Parameters<typeof availableAbilities>[0]).entries()){
   const row=document.createElement('label');row.style.cssText='display:flex;align-items:center;gap:10px;min-height:44px;flex-wrap:wrap';row.dataset.ability=a;
   const name=document.createElement('span');name.textContent=ABILITIES[a].shortName;name.style.cssText='flex:1;min-width:110px';
   const slot=document.createElement('select');slot.className='beta-slot';slot.add(new Option('No equipar','-1'));for(let n=0;n<4;n++)slot.add(new Option(`Ranura ${n+1}`,String(n)));
   const count=Math.min(CHARACTERS[id].abilities.length, preset[4]+2);slot.value=i<count?String(i<preset[4]?0:Math.min(3,i-preset[4]+1)):'-1';
   const rank=document.createElement('select');rank.className='beta-rank';for(let n=1;n<=6;n++)rank.add(new Option(`Nivel ${n}`,String(n)));rank.value=String(preset[3]);row.append(name,slot,rank);build.append(row);
  }
 };
 button.onclick=()=>{render();dialog.showModal();};dest.onchange=render;dialog.querySelector<HTMLButtonElement>('#beta-close')!.onclick=()=>dialog.close();
 dialog.querySelector<HTMLButtonElement>('#beta-enter')!.onclick=async()=>{const error=dialog.querySelector('#beta-error')!;error.textContent='';const attacks=[...build.querySelectorAll<HTMLElement>('[data-ability]')].map(row=>({id:row.dataset.ability!,level:Number(row.querySelector<HTMLSelectElement>('.beta-rank')!.value),slot:Number(row.querySelector<HTMLSelectElement>('.beta-slot')!.value)})).filter(a=>a.slot>=0);if(!attacks.length){error.textContent='Equipa al menos un ataque.';return;}try{await start({destination:dest.value as BetaSettings['destination'],level:Number(level.value),attacks});dialog.close();}catch{error.textContent='Revisa la build: máximo cuatro ataques por ranura y dos buffs.';}};
}
