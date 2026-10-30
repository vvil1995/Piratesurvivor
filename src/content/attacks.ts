import { UNIVERSAL_BUFFS } from './buffs.ts';
import type { AbilityDefinition, AttackLevel } from './types.ts';

// Datos de equilibrio provisionales, todos los comportamientos se ejecutan por tipo.
function levels(base: AttackLevel, evolved: Partial<AttackLevel>): readonly AttackLevel[] {
  return Array.from({ length: 6 }, (_, i) => ({ ...base,
    damage: base.damage * (1 + i * 0.13), range: base.range * (1 + i * 0.025),
    cooldown: base.cooldown * (1 - i * 0.025),
    shots: base.shots > 1 ? base.shots + (i >= 2 ? 1 : 0) + (i >= 4 ? 1 : 0) : 1,
    ...(i >= 2 ? { width: base.width * 1.2 } : {}),
    ...(i === 5 ? evolved : {}),
  }));
}
export const ABILITIES: Record<string, AbilityDefinition> = {
  ...UNIVERSAL_BUFFS,
  'elastic-punch': {
    id: 'elastic-punch', name: 'Gomu Gomu no Pistol', shortName: 'Pistol', behavior: 'line',
    description: 'Puño preciso hacia el enemigo más cercano.', evolution: 'El puño atraviesa a todos los enemigos de la línea.',
    levels: levels({ damage: 1, range: 1, cooldown: 1.5, width: 15, arc: 0.15, hits: 1, shots: 1, interval: 0.12, knockback: 13, splash: 0 }, { hits: 150, width: 24 }),
  },
  gatling: {
    id: 'gatling', name: 'Gomu Gomu no Gatling', shortName: 'Gatling', behavior: 'burst',
    description: 'Tres puñetazos sucesivos que buscan objetivo de nuevo.', evolution: 'Ráfaga de ocho impactos con un cono frontal más amplio.',
    levels: levels({ damage: 0.46, range: 0.88, cooldown: 5, shape: 'cone', width: 13, arc: 0.55, hits: 150, shots: 3, interval: 0.12, knockback: 4, splash: 0 }, { shots: 8, arc: 0.95, interval: 0.08 }),
  },
  bazooka: {
    id: 'bazooka', name: 'Gomu Gomu no Bazooka', shortName: 'Bazooka', behavior: 'cone',
    description: 'Impacto frontal corto que empuja a varios enemigos.', evolution: 'El impacto provoca una onda adicional alrededor del objetivo.',
    levels: levels({ damage: 1.8, range: 0.7, cooldown: 2.7, width: 24, arc: 0.62, hits: 150, shots: 1, interval: 0.12, knockback: 48, splash: 0 }, { splash: 78, knockback: 65 }),
  },
  whip: {
    id: 'whip', name: 'Gomu Gomu no Whip', shortName: 'Whip', behavior: 'sweep',
    description: 'Barrido amplio con la pierna para despejar un flanco.', evolution: 'Giro completo de 360° que también alcanza a los perseguidores.',
    levels: levels({ damage: 0.85, range: 0.82, cooldown: 1.85, width: 20, arc: 1.9, hits: 150, shots: 1, interval: 0.12, knockback: 24, splash: 0 }, { arc: Math.PI, range: 1.12 }),
  },
  balloon: {
    id: 'balloon', name: 'Gomu Gomu no Balloon', shortName: 'Balloon', behavior: 'guard',
    description: 'Infla el cuerpo, reduce daño por un tiempo y repele enemigos cercanos.', evolution: 'La defensa también refleja proyectiles hostiles.',
    levels: levels({ damage: 0, range: 0.8, cooldown: 12, width: 0, arc: Math.PI, hits: 0, shots: 1, interval: 0, knockback: 45, splash: 0, duration: 2, guard: 0.22, inflate: 1.18 }, { duration: 3, guard: 0.28, knockback: 60 }),
  },
  axe: {
    id: 'axe', name: 'Gomu Gomu no Axe', shortName: 'Axe', behavior: 'slam',
    description: 'Marca una zona y descarga una patada vertical tras un breve aviso.', evolution: 'La patada genera una onda de choque alrededor de la zona de impacto.',
    levels: levels({ damage: 2.0, range: 1.3, cooldown: 4.5, width: 0, arc: Math.PI, hits: 150, shots: 1, interval: 0, knockback: 28, splash: 0, delay: 0.45, area: 45 }, { area: 65, splash: 105, knockback: 45 }),
  },
};
export const ATTACK_SLOTS = 4;
export const ATTACK_MAX_LEVEL = 6;
export const COMPONENTS_PER_SLOT = 4;
export const MAX_LEARNED_BUFFS = 2;
export const MAX_LEARNED_ABILITIES = 8;
