import type { AbilityDefinition, AttackBehavior, AttackLevel } from './types.ts';
// Contenido de ensayo de East Blue. Adaptaciones se etiquetan expresamente.
function skill(id: string, name: string, behavior: AttackBehavior, description: string, evolution: string,
  base: Partial<AttackLevel> & { cooldownStep?: number }, plus: Partial<AttackLevel>, adaptation = false, eraNote?: string): AbilityDefinition {
  const defaults: AttackLevel = { damage: 1, range: 1, cooldown: 3, width: 15, arc: 0.6, hits: 1, shots: 1, interval: 0.12, knockback: 10, splash: 0 };
  const { cooldownStep = 0.025, ...stats } = base;
  const b = { ...defaults, ...stats };
  return { id, name, shortName: name, behavior, description, evolution, adaptation, eraNote,
    levels: Array.from({ length: 6 }, (_, i) => ({ ...b, damage: b.damage * (1 + i * 0.13), range: b.range * (1 + i * 0.025),
      cooldown: b.cooldown * (1 - i * cooldownStep), projectileSpeed: b.projectileSpeed ? b.projectileSpeed * (1 + i * 0.04) : undefined,
      ...(i === 5 ? plus : {}) })) };
}
const all: AbilityDefinition[] = [
  skill('oni-giri', 'Oni Giri', 'dash', 'Carga corta con triple corte.', 'La carga atraviesa y corta a varios enemigos.', { damage: 1.5, cooldown: 1.2, cooldownStep: 0.06, range: 1.4, dash: 55, hits: 1 }, { dash: 85, hits: 150 }),
  skill('tora-gari', 'Tora Gari', 'cone', 'Corte frontal amplio y contundente.', 'Rompe la guardia: los afectados reciben más daño por un tiempo.', { damage: 1.8, cooldown: 4, arc: 0.9, hits: 150 }, { arc: 1.25, status: 'exposed', statusDuration: 3 }),
  skill('sanzen-sekai', 'Sanzen Sekai', 'focus', 'Impacto concentrado de gran daño.', 'Cuatro cortes sucesivos sobre el mismo objetivo.', { damage: 4.2, cooldown: 10, range: 0.85 }, { damage: 2.1, shots: 4, interval: 0.12 }),
  skill('double-sword', 'Doble espada', 'alternating', 'Dos cortes alternados a ambos lados.', 'Cuatro cortes alternos con mayor amplitud.', { damage: 0.8, cooldown: 2.7, shots: 2, arc: 1.0, hits: 150 }, { shots: 4, arc: 1.3 }, true),
  skill('sword-guard', 'Guardia triple', 'guard', 'Bloquea un impacto y contraataca una vez durante la guardia.', 'El contraataque abarca un círculo completo.', { damage: 0, cooldown: 8, duration: 1.6, guard: 0.22, counterDamage: 1.2, counterArc: 0.9 }, { counterArc: Math.PI, counterDamage: 1.7, duration: 2 }, true),
  skill('santoryu-sweep', 'Barrido Santoryu', 'sweep', 'Giro ofensivo con las tres espadas.', 'Aumenta el radio y empuja con fuerza.', { damage: 1.05, cooldown: 3.2, arc: Math.PI, hits: 150, range: 0.75 }, { range: 1.25, knockback: 45 }, true),
  skill('staff-hit', 'Golpe de bastón', 'cone', 'Golpe frontal preciso con el bastón.', 'Dos impactos consecutivos.', { damage: 1.1, cooldown: 0.9, cooldownStep: 0.06, hits: 1, arc: 0.45 }, { shots: 2, interval: 0.12 }),
  skill('staff-spin', 'Bastón giratorio', 'sweep', 'Barrido circular que mantiene distancia.', 'Desvía proyectiles durante un breve instante.', { damage: 0.8, cooldown: 3.5, range: 0.75, arc: Math.PI, hits: 150 }, { deflect: true, duration: 0.8, range: 1.05 }),
  skill('rope-bind', 'Lazo de cuerda', 'line', 'Inmoviliza brevemente a un enemigo cercano.', 'Atrapa hasta tres objetivos en la trayectoria.', { damage: 0.3, cooldown: 3.8, range: 1.2, status: 'root', statusDuration: 1.3 }, { hits: 3, width: 28, statusDuration: 1.8 }, true),
  skill('quick-theft', 'Robo rápido', 'cone', 'Ataca y obtiene una berry extra por enemigo, una sola vez.', 'Puede robar a varios enemigos.', { damage: 0.7, cooldown: 2.8, hits: 1, steal: 1 }, { hits: 3, arc: 1.0 }, true),
  skill('thief-decoy', 'Distracción', 'decoy', 'Deja un señuelo que atrae enemigos durante un tiempo.', 'El señuelo explota al desaparecer.', { damage: 0, cooldown: 7, duration: 4, area: 25 }, { damage: 1.3, splash: 90 }, true),
  skill('smart-escape', 'Escapada astuta', 'evade', 'Esquiva una amenaza próxima y contraataca.', 'Deja una trampa al escapar.', { damage: 1.1, cooldown: 7, dash: 48, arc: 0.8 }, { splash: 48, status: 'root', statusDuration: 1.2 }, true),
  skill('namari-boshi', 'Namari Boshi', 'projectile', 'Disparo de plomo preciso.', 'El proyectil perfora varios enemigos.', { damage: 1.2, cooldown: 0.9, cooldownStep: 0.06, range: 1.5, projectileSpeed: 300 }, { hits: 4 }),
  skill('kayaku-boshi', 'Kayaku Boshi', 'projectile', 'Munición explosiva con impacto de área.', 'Detona hasta dos explosiones secundarias sin cadena infinita.', { damage: 1.2, cooldown: 6, projectileSpeed: 230, splash: 45 }, { splash: 65, chain: 2 }),
  skill('smoke-shot', 'Munición de humo', 'projectile', 'Humo casero que desorienta en una zona.', 'Nube más grande y persistente.', { damage: 0.15, cooldown: 5, projectileSpeed: 220, duration: 3, area: 55, status: 'confuse', statusDuration: 0.4 }, { duration: 4.5, area: 85 }, true, 'Adaptación de recursos caseros; no se afirma fecha canónica de Kemuri Boshi.'),
  skill('irritant-shot', 'Munición irritante', 'projectile', 'Carga irritante que interrumpe un enemigo.', 'Interrumpe enemigos en una zona.', { damage: 0.4, cooldown: 4, projectileSpeed: 250, status: 'stun', statusDuration: 0.6 }, { splash: 60, statusDuration: 0.9 }, true, 'Adaptación jugable; no se atribuye Tabasco Boshi a esta etapa sin verificar.'),
  skill('multi-shot', 'Tiro múltiple', 'projectile', 'Tres proyectiles en abanico.', 'Cinco proyectiles que pueden rebotar entre objetivos.', { damage: 0.6, cooldown: 3.5, projectileSpeed: 280, projectiles: 3, fan: 0.7 }, { projectiles: 5, fan: 1.0, bounces: 2, hits: 3 }, true),
  skill('usopp-hammer', 'Martillo de Usopp', 'cone', 'Golpe cercano que aleja amenazas.', 'Impacto amplio con aturdimiento.', { damage: 1.6, cooldown: 4.5, range: 0.65, knockback: 45, hits: 150 }, { arc: 1.2, status: 'stun', statusDuration: 1.0 }),
  skill('collier', 'Collier', 'cone', 'Patada alta rápida contra un objetivo.', 'Golpea a varios enemigos en arco.', { damage: 1, cooldown: 0.8, cooldownStep: 0.06, arc: 0.35 }, { hits: 150, arc: 1.0 }),
  skill('epaule', 'Épaule', 'slam', 'Patada descendente potente sobre una zona.', 'Onda de impacto alrededor de la patada.', { damage: 1.8, cooldown: 4, delay: 0.2, area: 38 }, { splash: 85, area: 55 }),
  skill('cotelette', 'Côtelette', 'focus', 'Tres patadas cortas sobre un mismo objetivo.', 'Combo de seis impactos rápidos.', { damage: 0.6, cooldown: 3, shots: 3, interval: 0.12 }, { shots: 6, interval: 0.08 }),
  skill('selle', 'Selle', 'sweep', 'Patada giratoria que empuja un flanco.', 'Giro completo de360°.', { damage: 1.05, cooldown: 3, arc: 1.9, hits: 150, knockback: 28 }, { arc: Math.PI, range: 1.15, knockback: 42 }),
  skill('mouton-shot', 'Mouton Shot', 'focus', 'Combo concentrado de gran potencia.', 'La última patada añade una rematada de área.', { damage: 1.2, cooldown: 9, shots: 3, interval: 0.15 }, { shots: 4, finisher: 85, damage: 1.7 }),
  skill('combat-cooking', 'Cocina de combate', 'heal', 'Prepara un alimento curativo que debes recoger.', 'Más curación y regeneración temporal al comer.', { damage: 0, cooldown: 10, heal: 12, duration: 8 }, { heal: 24, regeneration: 0.3 }, true),
];
all.forEach((a, i) => { a.visual = i < 6 ? 'slash' : i < 12 ? 'staff' : i < 18 ? 'projectile' : i === 23 ? 'heal' : 'kick'; });
export const CREW_ABILITIES = Object.fromEntries(all.map(a => [a.id, a]));
