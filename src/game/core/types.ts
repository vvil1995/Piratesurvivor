import type { Stats } from '../../content/types.ts';
export type RunStatus = 'playing' | 'paused' | 'levelup' | 'defeat' | 'victory';
export interface Vector { x: number; y: number }
export interface Player extends Vector {
  hp: number; stats: Stats; level: number; xp: number; xpNext: number;
  kills: number; hurtTimer: number; attackTimer: number; facing: number;
}
export interface Enemy extends Vector {
  active: boolean; id: number; hp: number; maxHp: number;
  speed: number; damage: number; xp: number; radius: number; flash: number;
}
export interface Pickup extends Vector { active: boolean; value: number }
export interface Strike extends Vector { angle: number; reach: number; life: number }
export interface RunResult {
  id: string; outcome: 'defeat' | 'victory'; seconds: number; kills: number; level: number; coins: number;
}
