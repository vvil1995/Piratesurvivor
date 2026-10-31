import type { StatModifiers } from './types.ts';
export const ITEM_SLOTS=1, ITEM_MAX_LEVEL=3;
export const ITEM_RULES={ explosionCooldown:.8, explosionRadius:72, explosionDamage:.35, stunDuration:.4, bossStunDuration:.1, bossStunCooldown:4, lifestealPerSecond:4, areaLifestealFactor:.25 };
export const ITEMS: Record<string,{name:string;description:string;modifiers:StatModifiers;values:readonly number[];effect:string}>={
 vest:{name:'Barret de palla',description:'−8% / −14% / −20% de daño recibido',modifiers:{},values:[.08,.14,.20],effect:'armor'},
 haramaki:{name:'Haramaki de Zoro',description:'+15% / +30% / +45% de vida máxima',modifiers:{},values:[.15,.30,.45],effect:'maxHp'},
 medicine:{name:'Mandarines de Nami',description:'+2 / +4 / +6 PV cada 5 segundos',modifiers:{},values:[2,4,6],effect:'heal'},
 telescope:{name:'Tirador d’Usopp',description:'+15% / +30% / +45% de alcance',modifiers:{},values:[.15,.30,.45],effect:'range'},
 whetstone:{name:'Pedra d’esmolar',description:'+8% / +16% / +24% de daño',modifiers:{},values:[.08,.16,.24],effect:'damage'},
 berries:{name:'Bossa de berries',description:'+20% / +35% / +50% de berries',modifiers:{},values:[.20,.35,.50],effect:'berries'},
 treasure:{name:'Mapa del tresor',description:'+10% / +20% / +30% de XP',modifiers:{},values:[.10,.20,.30],effect:'xp'},
 powder:{name:'Pólvora de Buggy',description:'5% / 10% / 15%: explosión de área (35% del impacto, radio72, descanso0,8s; sin cadenas)',modifiers:{},values:[.05,.10,.15],effect:'explosion'},
 pendulum:{name:'Pèndol de Jango',description:'4% / 7% / 10%: aturde0,4s; bosses0,1s solo movimiento, descanso4s',modifiers:{},values:[.04,.07,.10],effect:'stun'},
 dagger:{name:'Daga de Mihawk',description:'Roba2% / 4% / 6% del daño real. Máximo4PV/s; áreas y daño periódico al25%',modifiers:{},values:[.02,.04,.06],effect:'lifesteal'},
};
export const itemValue=(items:Record<string,number>,id:string):number=>ITEMS[id]?.values[(items[id]??0)-1]??0;
export function itemDescription(id: string, level: number): string {
  const data = ITEMS[id], value = data.values[Math.max(0, Math.min(2, level - 1))];
  const percent = Math.round(value * 100);
  const labels: Record<string, string> = { armor: 'daño recibido', maxHp: 'vida máxima', range: 'alcance', damage: 'daño', berries: 'berries recogidos', xp: 'experiencia recogida' };
  if (data.effect === 'heal') return `+${value} PV cada 5 s`;
  if (labels[data.effect]) return `${data.effect === 'armor' ? '−' : '+'}${percent}% ${labels[data.effect]}`;
  if (data.effect === 'explosion') return `${percent}% de explosión: 35% del daño real en radio 72; descanso 0,8 s, sin cadenas.`;
  if (data.effect === 'stun') return `${percent}% de aturdir 0,4 s; bosses: movimiento detenido 0,1 s, descanso 4 s.`;
  return `${percent}% del daño real cura vida; máximo 4 PV/s. Áreas y daño periódico: efectividad del 25%.`;
}
