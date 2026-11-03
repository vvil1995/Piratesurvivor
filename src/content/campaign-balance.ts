/** Same fixed curve for all heroes/profiles. Never gates travel on training. */
export const CAMPAIGN_RULES={enemyCap:70,spawnBatch:2,xpExponent:1.45,xpThreatScaling:.2} as const;
export const CAMPAIGN_DIFFICULTY={maxMinutes:40,hpPerMinute:.08,damagePerMinute:.03,speedPerMinute:.006} as const;
export const CAMPAIGN_BOSS_HP:Readonly<Record<string,number>>={morgan:6300,buggy:18500,kuro:32000,krieg:52000,arlong:78000};
export const CAMPAIGN_BALANCE={
 'shells-town':{start:8,end:22,hp:1,damage:1,interval:.45},
 'orange-town':{start:22,end:35,hp:1.35,damage:1.2,interval:.45},
 'syrup-village':{start:35,end:48,hp:1.8,damage:1.4,interval:.45},
 'baratie':{start:48,end:60,hp:2.5,damage:1.5,interval:.42},
 'arlong-park':{start:60,end:70,hp:3.4,damage:1.7,interval:.4},
} as const;
export function campaignBalance(zone:string){return CAMPAIGN_BALANCE[zone as keyof typeof CAMPAIGN_BALANCE];}
