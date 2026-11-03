// Compatibility exports; the shared curve now covers all five exploration worlds.
import {CAMPAIGN_BALANCE,CAMPAIGN_RULES,campaignBalance} from './campaign-balance.ts';
export const EARLY_BALANCE=CAMPAIGN_BALANCE;
export const earlyBalance=campaignBalance;
export function densityTarget(zone:string,localSeconds:number,previous:number):number{
 const b=campaignBalance(zone);return b?Math.min(CAMPAIGN_RULES.enemyCap,Math.max(previous,b.start+(b.end-b.start)*Math.min(1,Math.max(0,localSeconds)/300))):previous;
}
