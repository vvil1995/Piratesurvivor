import type { DifficultyDefinition } from '../../content/types.ts';
export function difficultyAt(seconds: number, baseInterval: number, config?: DifficultyDefinition) {
  const minutes = config ? Math.min(config.maxMinutes, Math.max(0, seconds) / 60) : 0;
  return {
    hp: 1 + minutes * (config?.hpPerMinute ?? 0), damage: 1 + minutes * (config?.damagePerMinute ?? 0),
    speed: 1 + minutes * (config?.speedPerMinute ?? 0),
    interval: config ? Math.max(config.minInterval, baseInterval / (1 + minutes * config.spawnAcceleration)) : baseInterval,
    batch: config ? Math.min(config.maxBatch, 1 + Math.floor(minutes / config.batchEveryMinutes)) : 1,
  };
}
