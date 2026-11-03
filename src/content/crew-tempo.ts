/** Cadence pass: secondaries retain40% of the old cooldown at every rank. */
export const CREW_SECONDARY_COOLDOWN_FACTOR=.4;
export const CREW_PRIMARY_ATTACKS=new Set(['oni-giri','collier','staff-hit','namari-boshi']);
export const crewCooldownFactor=(id:string)=>CREW_PRIMARY_ATTACKS.has(id)?1:CREW_SECONDARY_COOLDOWN_FACTOR;
