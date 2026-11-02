export const FRUIT_RULES={normalDrop:.0015,specialDrop:.01,bossDrop:.08,procChance:.25,procCooldown:1.5,burnDuration:3,burnTick:.5,burnDamage:.12,explosionCooldown:5,chainTargets:3,chainRadius:100,period:7,radius:90,damage:.6,controlDuration:1.2,smokeDuration:2,evasion:.15};
export const FRUITS: Record<string,{name:string;description:string;radius:number;damage:number;cooldown:number}>={
 bomu:{name:'Bomu Bomu',description:'Explosión al derrotar enemigos.',radius:54,damage:.45,cooldown:2},
 mera:{name:'Mera Mera no Mi',description:'Quemaduras limitadas y explosiones de fuego.',radius:60,damage:.6,cooldown:5},
 goro:{name:'Goro Goro no Mi',description:'Descargas que saltan hasta tres enemigos próximos.',radius:100,damage:.5,cooldown:1.5},
 hie:{name:'Hie Hie no Mi',description:'Ralentiza y congela brevemente a enemigos normales.',radius:80,damage:0,cooldown:1.5},
 suna:{name:'Suna Suna no Mi',description:'Remolino periódico que daña y frena la aproximación.',radius:90,damage:.6,cooldown:7},
 moku:{name:'Moku Moku no Mi',description:'Cortina de humo, confusión y evasión breve.',radius:90,damage:0,cooldown:7},
 nikyu:{name:'Nikyu Nikyu no Mi',description:'Onda periódica de repulsión y daño.',radius:110,damage:.8,cooldown:7},
};
export const FRUIT_DROPS=['mera','goro','hie','suna','moku','nikyu'];
