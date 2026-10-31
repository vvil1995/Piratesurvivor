import { PatternEncounter } from './pattern-encounter.ts';
import { BUGGY, BUGGY_ATTACKS } from '../../content/bosses/buggy.ts';
export class BuggyEncounter extends PatternEncounter {
  constructor() { super(BUGGY, BUGGY_ATTACKS); }
}
