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
  'elastic-punch': {
    id: 'elastic-punch', name: 'Gomu Gomu no Pistol', shortName: 'Pistol', behavior: 'line',
    description: 'Puño preciso hacia el enemigo más cercano.', evolution: 'El puño atraviesa a todos los enemigos de la línea.',
    levels: levels({ damage: 1, range: 1, cooldown: 0.72, width: 15, arc: 0.15, hits: 1, shots: 1, interval: 0.12, knockback: 13, splash: 0 }, { hits: 150, width: 24 }),
  },
  gatling: {
    id: 'gatling', name: 'Gomu Gomu no Gatling', shortName: 'Gatling', behavior: 'burst',
    description: 'Tres puñetazos sucesivos que buscan objetivo de nuevo.', evolution: 'Seis golpes rápidos; cada golpe puede perforar dos enemigos.',
    levels: levels({ damage: 0.46, range: 0.88, cooldown: 2.0, width: 13, arc: 0.15, hits: 1, shots: 3, interval: 0.12, knockback: 4, splash: 0 }, { shots: 6, hits: 2, interval: 0.08 }),
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
};
export const ATTACK_SLOTS = 4;
export const ATTACK_MAX_LEVEL = 6;
