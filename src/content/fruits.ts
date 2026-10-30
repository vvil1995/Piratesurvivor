// Primera fruta funcional del catálogo; no añade poderes permanentes.
export const FRUITS: Record<string, { name: string; description: string; radius: number; damage: number; cooldown: number }> = {
  bomu: { name: 'Bomu Bomu', description: 'Al derrotar un rival genera una explosión cercana. Daño:45% del ataque; radio54px; recarga2s. Una fruta activa, solo esta partida.', radius: 54, damage: 0.45, cooldown: 2 },
};
