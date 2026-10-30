import type { Stats, StatModifiers, LevelChoice, AttackBehavior } from '../../content/types.ts';
export type RunStatus = 'playing' | 'paused' | 'levelup' | 'defeat' | 'victory' | 'combining';
export interface Vector { x: number; y: number }
export interface Player extends Vector {
  id: string; characterId: string;
  taken: Record<string, number>; choices: LevelChoice[]; attacks: EquippedAttack[]; abilitySlots: string[][]; learnedBuffs: string[];
  hp: number; stats: Stats; baseStats: Stats;
  modifiers: { permanent: StatModifiers; temporary: StatModifiers; items: StatModifiers; fruit: StatModifiers; buffs: StatModifiers; skills: StatModifiers }; level: number; xp: number; xpNext: number;
  kills: number; hurtTimer: number; facing: number;
}
export interface EquippedAttack { id: string; level: number; cooldown: number; pending: number; burstTimer: number; activeFor: number; activationPending?: boolean }
export interface Enemy extends Vector {
  active: boolean; id: number; hp: number; maxHp: number;
  speed: number; damage: number; xp: number; radius: number; flash: number;
  ranged?: { interval: number; speed: number; range: number }; shotTimer?: number;
  targetId?: string; steeringTime?: number; steerX?: number; steerY?: number;
}
export interface Pickup extends Vector { active: boolean; value: number; ownerId?: string }
export interface Strike extends Vector { angle: number; reach: number; life: number; ownerId: string; behavior: AttackBehavior; evolved: boolean; arc: number; splash: number; impact: Vector }
export interface RunResult {
  id: string; outcome: 'defeat' | 'victory'; seconds: number; kills: number; level: number; coins: number;
}

export interface Projectile extends Vector {
  active: boolean; vx: number; vy: number; radius: number; life: number; damage: number;
  hostile: boolean; ownerId: string; reflected: boolean; remainingHits: number; hit: Set<number>;
}
export interface AreaEffect extends Vector {
  active: boolean; ownerId: string; radius: number; shockRadius: number; damage: number; knockback: number;
  delay: number; life: number; triggered: boolean; evolved: boolean;
}
