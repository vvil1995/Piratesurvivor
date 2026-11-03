import {KRIEG,KRIEG_RULES} from '../../content/bosses/krieg.ts';
import {CAMPAIGN_BOSS_HP} from '../../content/campaign-balance.ts';
import type {PatternEncounter} from './pattern-encounter.ts';
/** Absolute initialization, safe to repeat: main and summoned use one HP reference. */
export function configureCampaignBoss(boss:Pick<PatternEncounter,'profile'|'body'>,fraction=1):void{
 const hp=CAMPAIGN_BOSS_HP[boss.profile.id];if(!hp)return;
 boss.body.hp=boss.body.maxHp=hp*fraction;
 const armor=boss.body.defense?.armor;
 if(armor){const ratio=KRIEG_RULES.armor/KRIEG.hp;armor.remaining=armor.max=hp*fraction*ratio;}
}
