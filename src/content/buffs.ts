import type { AbilityDefinition, BuffDefinition } from './types.ts';
// Perfil de ensayo, NO balance definitivo. Todos los números son reemplazables aquí.
export const BUFF_BALANCE_STATUS = 'provisional';
const progression = (start: number, step: number) => Array.from({ length: 6 }, (_, i) => start + i * step);
function buff(id: string, name: string, stat: BuffDefinition['stat'], sign = 1): AbilityDefinition {
  return { id, name, shortName: name, category: 'buff', behavior: 'buff',
    description: `${({ speed: 'Velocidad +12%', armor: 'Reducción de daño +12 puntos porcentuales', damage: 'Daño +12%', cooldown: 'Cooldown −12%' })[stat]}. Solo:3s activo y12s de descanso. En combinación:6% constante. Valores sujetos a los límites globales.`,
    evolution: 'Flechas de color y bonificación superior con mayor duración; mantiene su modo individual o constante.',
    buff: { stat, temporary: progression(0.12 * sign, 0.015 * sign), constant: progression(0.06 * sign, 0.008 * sign),
      duration: [3, 3.3, 3.6, 3.9, 4.2, 5.5], cooldown: [12, 12, 12, 12, 12, 12] },
    levels: Array.from({ length: 6 }, () => ({ damage: 0, range: 0, cooldown: 12, width: 0, arc: 0, hits: 0, shots: 1, interval: 0, knockback: 0, splash: 0 })),
  };
}
export const UNIVERSAL_BUFFS: Record<string, AbilityDefinition> = {
  impulse: buff('impulse', 'Impulso', 'speed'), fortress: buff('fortress', 'Fortaleza', 'armor'),
  fury: buff('fury', 'Furia', 'damage'), frenzy: buff('frenzy', 'Frenesí', 'cooldown', -1),
};
