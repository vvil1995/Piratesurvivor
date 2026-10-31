import { PatternEncounter } from './pattern-encounter.ts';
import { MORGAN, MORGAN_ATTACKS } from '../../content/bosses/morgan.ts';
export type { BossState } from './pattern-encounter.ts';
export class MorganEncounter extends PatternEncounter {
  constructor() { super(MORGAN, MORGAN_ATTACKS); }
}
