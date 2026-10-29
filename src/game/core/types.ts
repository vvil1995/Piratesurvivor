import type { Stats, UpgradeDefinition } from '../../content/types.ts';
export type RunStatus = 'playing' | 'paused' | 'levelup' | 'defeat' | 'victory';
export interface Vector { x: number; y: number }
export interface Player extends Vector {
  id: string; characterId: string;
  taken: Record<string, number>; choices: UpgradeDefinition[];
  hp: number; stats: Stats; level: number; xp: number; xpNext: number;
  kills: number; hurtTimer: number; attackTimer: number; facing: number;
}
export interface Enemy extends Vector {
  active: boolean; id: number; hp: number; maxHp: number;
  speed: number; damage: number; xp: number; radius: number; flash: number;
  targetId?: string; steeringTime?: number; steerX?: number; steerY?: number;
}
export interface Pickup extends Vector { active: boolean; value: number; ownerId?: string }
export interface Strike extends Vector { angle: number; reach: number; life: number; ownerId: string }
export interface RunResult {
  id: string; outcome: 'defeat' | 'victory'; seconds: number; kills: number; level: number; coins: number;
}
