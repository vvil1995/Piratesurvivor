/** Interruptor único para retirar el acceso público a las pruebas. */
export const BETA_TEST_ENABLED=true;
export const BETA_DESTINATIONS=[
 ['shells','Shells Town',1,3,1],['morgan','Morgan',12,4,2],
 ['orange','Orange Town',16,4,2],['buggy','Buggy',24,5,2],
 ['syrup','Syrup Village',28,5,3],['kuro','Kuro',35,6,3],
 ['baratie','Baratie',40,6,3],['krieg','Don Krieg',46,6,3],
 ['arlong','Arlong Park',50,6,4],['arlong-boss','Arlong',56,6,4],['roger','Roger',60,6,4],
] as const;
export type BetaDestination=typeof BETA_DESTINATIONS[number][0];
export interface BetaSettings{destination:BetaDestination;level:number;attacks:{id:string;level:number;slot:number}[]}
