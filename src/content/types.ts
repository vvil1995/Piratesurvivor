export interface Stats {
  maxHp: number; speed: number; damage: number; cooldown: number;
  range: number; magnet: number; armor: number; regeneration: number; critChance: number;
}
export type StatModifiers = Partial<Record<keyof Stats, number>>;
export interface CharacterDefinition {
  id: string; name: string; shortName?: string; legacyTraining?: boolean; style?: string; title: string; stats: Stats;
  initialAbility: string; abilities: readonly string[]; visual: string;
}
export interface EnemyDefinition {
  id: string; hp: number; damage: number; speed: number;
  xp: number; radius: number; visual: string; ranged?: { interval: number; speed: number; range: number };
}
export type AttackBehavior = 'line' | 'burst' | 'cone' | 'sweep' | 'buff' | 'guard' | 'slam' | 'dash' | 'focus' | 'alternating' | 'projectile' | 'decoy' | 'evade' | 'heal';
export interface AttackLevel {
  damage: number; range: number; cooldown: number; width: number; arc: number;
  hits: number; shots: number; interval: number; knockback: number; splash: number;
  projectiles?: number; projectileSpeed?: number; fan?: number; bounces?: number; chain?: number;
  status?: StatusKind; statusDuration?: number; steal?: number; dash?: number; counterDamage?: number; counterArc?: number; reflect?: boolean; deflect?: boolean; finisher?: number; heal?: number; regeneration?: number;
  duration?: number; delay?: number; area?: number; guard?: number; inflate?: number; shape?: 'line' | 'cone';
}
export interface AbilityDefinition {
  id: string; name: string; shortName: string; behavior: AttackBehavior;
  visual?: 'punch' | 'slash' | 'kick' | 'staff' | 'projectile' | 'heal' | 'rubber-punch' | 'rubber-flurry' | 'rubber-double' | 'rubber-kick' | 'rubber-axe';
  adaptation?: boolean; eraNote?: string;
  category?: 'exclusive' | 'buff'; buff?: BuffDefinition;
  description: string; evolution: string; levels: readonly AttackLevel[];
}
export interface AbilityChoice {
  kind: 'ability'; id: string; abilityId: string; name: string; description: string; symbol: string; max: number;
}
export type LevelChoice = UpgradeDefinition | AbilityChoice;
export interface UpgradeDefinition {
  id: string; name: string; description: string; symbol: string;
  stat: keyof Stats; value: number; max: number;
}

export interface DifficultyDefinition {
  maxMinutes: number; hpPerMinute: number; damagePerMinute: number; speedPerMinute: number;
  spawnAcceleration: number; minInterval: number; batchEveryMinutes: number; maxBatch: number;
}

export interface BuffDefinition {
  stat: 'speed' | 'armor' | 'damage' | 'cooldown';
  temporary: readonly number[]; constant: readonly number[];
  duration: readonly number[]; cooldown: readonly number[];
}

export type StatusKind = 'root' | 'stun' | 'confuse' | 'exposed' | 'slow';
