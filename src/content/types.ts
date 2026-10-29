export interface Stats {
  maxHp: number; speed: number; damage: number; cooldown: number;
  range: number; magnet: number;
}
export interface CharacterDefinition {
  id: string; name: string; title: string; stats: Stats;
  initialAbility: string; visual: string;
}
export interface EnemyDefinition {
  id: string; hp: number; damage: number; speed: number;
  xp: number; radius: number; visual: string;
}
export interface AbilityDefinition {
  id: string; name: string; behavior: 'melee'; arc: number;
}
export interface EvolutionDefinition {
  id: string; from: string; to: string;
  requires: Record<string, number>;
}
export interface UpgradeDefinition {
  id: string; name: string; description: string; symbol: string;
  stat: keyof Stats; mode: 'add' | 'multiply'; value: number; max: number;
}
