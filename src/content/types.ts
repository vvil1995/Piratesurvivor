export interface Stats {
  maxHp: number; speed: number; damage: number; cooldown: number;
  range: number; magnet: number;
}
export interface CharacterDefinition {
  id: string; name: string; title: string; stats: Stats;
  initialAbility: string; abilities: readonly string[]; visual: string;
}
export interface EnemyDefinition {
  id: string; hp: number; damage: number; speed: number;
  xp: number; radius: number; visual: string;
}
export type AttackBehavior = 'line' | 'burst' | 'cone' | 'sweep';
export interface AttackLevel {
  damage: number; range: number; cooldown: number; width: number; arc: number;
  hits: number; shots: number; interval: number; knockback: number; splash: number;
}
export interface AbilityDefinition {
  id: string; name: string; shortName: string; behavior: AttackBehavior;
  description: string; evolution: string; levels: readonly AttackLevel[];
}
export interface AbilityChoice {
  kind: 'ability'; id: string; abilityId: string; name: string; description: string; symbol: string; max: number;
}
export type LevelChoice = UpgradeDefinition | AbilityChoice;
export interface UpgradeDefinition {
  id: string; name: string; description: string; symbol: string;
  stat: keyof Stats; mode: 'add' | 'multiply'; value: number; max: number;
}
