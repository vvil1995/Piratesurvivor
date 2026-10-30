import { TRAINING_COST, TRAINING_MAX } from '../../content/catalog.ts';
import type { RunResult } from '../../game/core/types.ts';

export const SAVE_KEY = 'ops.progress.v1';
export interface Progress {
  version: 1; coins: number; training: number; runs: number; wins: number;
  totalKills: number; bestTime: number; bestLevel: number;
  morganVictories?: number; lastMorganRunId?: string; berryRunId?: string; berryRunAmount?: number; lastRunId: string; reducedMotion: boolean;
}
export interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void }
export const freshProgress = (): Progress => ({ version: 1, coins: 0, training: 0, runs: 0, wins: 0, totalKills: 0, bestTime: 0, bestLevel: 1, lastRunId: '', reducedMotion: false });
function valid(value: unknown): value is Progress {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return v.version === 1 && ['coins', 'training', 'runs', 'wins', 'totalKills', 'bestTime', 'bestLevel'].every(key =>
    typeof v[key] === 'number' && Number.isSafeInteger(v[key]) && (v[key] as number) >= 0 && (v[key] as number) <= 1e9) &&
    (v.training as number) <= TRAINING_MAX && typeof v.lastRunId === 'string' &&
    v.lastRunId.length < 150 && (v.berryRunId === undefined || typeof v.berryRunId === 'string' && v.berryRunId.length < 150) &&
    (v.berryRunAmount === undefined || Number.isSafeInteger(v.berryRunAmount) && (v.berryRunAmount as number) >= 0 && (v.berryRunAmount as number) <= 1e9) && typeof v.reducedMotion === 'boolean' &&
    (v.morganVictories === undefined || Number.isSafeInteger(v.morganVictories) && (v.morganVictories as number) >= 0 && (v.morganVictories as number) <= 1e9) &&
    (v.lastMorganRunId === undefined || typeof v.lastMorganRunId === 'string' && v.lastMorganRunId.length < 150);
}
export class SaveStore {
  progress = freshProgress();
  warning = '';
  private storage?: StorageLike;
  private goodRaw: string | null = null;
  constructor(storage?: StorageLike) {
    try {
      this.storage = storage ?? globalThis.localStorage;
      const raw = this.storage?.getItem(SAVE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (!valid(parsed)) throw new Error('Formato inválido');
        this.progress = parsed; this.goodRaw = raw;
      }
    } catch {
      try {
        const backup = this.storage?.getItem(`${SAVE_KEY}.backup`);
        const parsed: unknown = backup ? JSON.parse(backup) : null;
        if (valid(parsed)) { this.progress = parsed; this.goodRaw = backup ?? null; this.warning = 'Se recuperó una copia anterior del progreso.'; }
        else this.warning = 'No se pudo leer el guardado. Puedes jugar, pero comprueba el almacenamiento del navegador.';
      } catch { this.warning = 'El almacenamiento no está disponible. El progreso durará mientras esta página siga abierta.'; }
    }
    this.flush();
  }
  flush(): boolean {
    try {
      if (!this.storage) throw new Error('No disponible');
      if (this.goodRaw) this.storage.setItem(`${SAVE_KEY}.backup`, this.goodRaw);
      const raw = JSON.stringify(this.progress);
      this.storage.setItem(SAVE_KEY, raw); this.goodRaw = raw;
      return true;
    } catch { this.warning = 'No se puede guardar en este navegador. El progreso actual solo está en memoria.'; return false; }
  }
  bank(runId: string, collected: number): boolean {
    if (!Number.isSafeInteger(collected) || collected < 0 || collected > 1e9 || runId.length >= 150) return false;
    const p = this.progress, previous = p.berryRunId === runId ? p.berryRunAmount ?? 0 : 0;
    if (collected <= previous) return false;
    p.coins = Math.min(1e9, p.coins + collected - previous); p.berryRunId = runId; p.berryRunAmount = collected;
    return this.flush();
  }
  record(result: RunResult): boolean {
    if (result.id === this.progress.lastRunId) return false;
    const p = this.progress;
    this.bank(result.id, result.coins);
    p.lastRunId = result.id; p.runs++;
    p.wins += result.outcome === 'victory' ? 1 : 0;
    p.totalKills += result.kills; p.bestTime = Math.max(p.bestTime, result.seconds);
    p.bestLevel = Math.max(p.bestLevel, result.level); this.flush(); return true;
  }
  recordMorganVictory(runId: string): boolean {
    if (!runId || runId.length >= 150 || this.progress.lastMorganRunId === runId) return false;
    this.progress.lastMorganRunId = runId; this.progress.morganVictories = Math.min(1e9, (this.progress.morganVictories ?? 0) + 1);
    this.flush(); return true;
  }
  train(): boolean {
    const p = this.progress, cost = TRAINING_COST(p.training);
    if (p.training >= TRAINING_MAX || p.coins < cost) return false;
    p.coins -= cost; p.training++; this.flush(); return true;
  }
  export(): string { return JSON.stringify(this.progress, null, 2); }
  import(raw: string): boolean {
    try {
      const value: unknown = JSON.parse(raw);
      if (!valid(value)) return false;
      this.progress = value; this.flush(); return true;
    } catch { return false; }
  }
}
