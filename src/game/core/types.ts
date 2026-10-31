import type { Stats, StatModifiers, LevelChoice, AttackBehavior, StatusKind, RangedEnemyAttack, EnemyDefinition } from '../../content/types.ts';
export type RunStatus = 'playing' | 'paused' | 'levelup' | 'defeat' | 'victory' | 'combining' | 'fruit' | 'item' | 'voyage';
export interface Vector { x: number; y: number }
export interface Player extends Vector {
  id: string; characterId: string;
  taken: Record<string, number>; choices: LevelChoice[]; attacks: EquippedAttack[]; abilitySlots: string[][]; selectedSlot: number; learnedBuffs: string[];
  slowFor?:number; slowMultiplier?:number;
  hp: number; stats: Stats; baseStats: Stats;
  modifiers: { permanent: StatModifiers; temporary: StatModifiers; items: StatModifiers; fruit: StatModifiers; buffs: StatModifiers; skills: StatModifiers }; level: number; xp: number; xpNext: number;
  xpMultiplier?: number; berryMultiplier?: number; rerolls?: number; banCharges?: number; bannedAbilities?: string[]; lastHit?: string; damageNoticeFor?: number;
  itemState?: {heal:number;leech:number;budget:number;explosion:number;stun:number;queue:{x:number;y:number;damage:number}[]};
  fruit?: string; items: Record<string, number>; collectedBerries: number; kills: number; hurtTimer: number; facing: number;
}
export interface EquippedAttack { id: string; level: number; cooldown: number; pending: number; burstTimer: number; activeFor: number; activationPending?: boolean; targetId?: number; counterUsed?: boolean }
export interface Enemy extends Vector {
  defense?:{angle:number;frontal:number;arc:number;armor?:{remaining:number;max:number;reduction:number}};
  active: boolean; id: number; visual?: string; kind?: 'chest' | 'boss'; large?: boolean; openProgress?: number; hp: number; maxHp: number;
  speed: number; damage: number; xp: number; radius: number; flash: number;
  launchTime?: number; launchX?: number; launchY?: number;
  statuses?: Partial<Record<StatusKind, number>>; stolen?: boolean; lureIndex?: number; decoyHitTimer?: number;
  melee?: EnemyDefinition['melee']; meleeTimer?:number; meleeWindup?:number; meleeHits?:number; meleeGap?:number; meleeAngle?:number;
  ranged?: RangedEnemyAttack; shotTimer?: number;
  shotWindup?: number; shotAngle?: number; shotRecovery?: number;
  targetId?: string; steeringTime?: number; steerX?: number; steerY?: number;
}
export interface Pickup extends Vector { active: boolean; value: number; ownerId?: string; kind?: 'xp' | 'food' | 'berry' | 'fruit' | 'item'; fruitId?: string; itemId?: string; life?: number; abilityId?: string; level?: number }
export interface Strike extends Vector { angle: number; reach: number; life: number; ownerId: string; behavior: AttackBehavior; evolved: boolean; arc: number; splash: number; impact: Vector; targetId?: number; visual?: string }
export interface RunResult {
  id: string; outcome: 'defeat' | 'victory'; seconds: number; kills: number; level: number; coins: number;
}

export interface Projectile extends Vector {
  active: boolean; vx: number; vy: number; radius: number; life: number; damage: number;
  slow?: {multiplier:number;duration:number};
  hostile: boolean; ownerId: string; reflected: boolean; remainingHits: number; hit: Set<number>; abilityId?: string; level?: number; bounces?: number;
}
export interface AreaEffect extends Vector {
  active: boolean; ownerId: string; radius: number; shockRadius: number; damage: number; knockback: number;
  delay: number; life: number; triggered: boolean; evolved: boolean; kind?: 'impact' | 'smoke' | 'decoy' | 'trap'; status?: StatusKind; statusDuration?: number; tickTimer?: number; hp?: number; visual?: string;
}
