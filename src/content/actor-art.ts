// Importación diferida: la compilación web no carga los cuatro atlas hasta elegirlos.
export const ACTOR_ART: Record<string, () => Promise<{ default: string }>> = {
  zoro: () => import('../assets/actors/zoro-atlas.png'), nami: () => import('../assets/actors/nami-atlas.png'),
  usopp: () => import('../assets/actors/usopp-atlas.png'), sanji: () => import('../assets/actors/sanji-atlas.png'),
};
