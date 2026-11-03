# Curva de campaña y acceso a Roger ·2026-11-03

## Resultado implementado

Se corrigen las caídas de presión/estadísticas entre los cinco mundos y las dos referencias distintas de vida de bosses. Se endurece el tramo final y se reduce la aceleración de XP para que el entrenamiento conserve valor. No hay un bloqueo por porcentaje de entrenamiento ni una dificultad que aumente porque el jugador tenga una buena build. La misma curva fija se aplica a los cinco personajes. Se conservan los cooldowns secundarios reducidos, las habilidades, controles, mapas, cofres, recompensas de boss y progreso permanente.

### Presión continua y reloj de exploración

| Mundo | Objetivo entrada→5min locales | Multiplicador HP | Multiplicador daño | Reposición máxima |
|---|---:|---:|---:|---:|
| Shells |8→22|1|1|2cada0,45s|
| Orange |22→35|1,35|1,2|2cada0,45s|
| Syrup |35→48|1,8|1,4|2cada0,45s|
| Baratie |48→60|2,5|1,5|2cada0,42s|
| Arlong |60→70|3,4|1,7|2cada0,4s|

Los objetivos mantienen el máximo alcanzado previamente. Son techos/objetivos de población, no una horda creada de golpe: se repone gradualmente, si faltan enemigos y hay posiciones válidas. Puede haber menos enemigos por bajas o falta de puntos de aparición. El máximo compartido es70.

Las estadísticas usan `campaignSeconds`: tiempo acumulado de exploración de todos los mundos, que no se reinicia al navegar. No cuenta pausas, menús, travesías ni tiempo dentro de bosses; así un boss lento no endurece además la isla siguiente. HP+8%/min de exploración, daño+3%/min y velocidad+0,6%/min, con tope40min. Solo se calculan al generar enemigos, sin incrementar estadísticas de enemigos existentes por frame. Las distribuciones de tipos y los eventos mantienen su reloj LOCAL: no aparecen todos los tipos avanzados al llegar a una isla nueva.

Ejemplo con5min de exploración por isla, básico de cada mundo:

| Mundo | HP entrada→salida | Daño entrada→salida |
|---|---:|---:|
| Shells |32→44,8|10→11,5|
| Orange |122,9→158|23,5→26,5|
| Syrup |275,4→336,6|36,4→40,6|
| Baratie |577,5→682,5|50→55,2|
| Arlong |1193,4→1377|73,4→80,3|

No es la media de todas las variantes. Se mantienen diferencias entre rápidos, tiradores y resistentes, navegación de flota/agua y controles normales. Los límites de70 y aparición exterior siguen vigentes; no se ha modificado la geometría del mapa. Beta usa una referencia de5min por isla para mostrar la presión aproximada que corresponde al destino.

### Bosses e invocados

| Boss | Antes en campaña | Ahora | Invocado60% |
|---|---:|---:|---:|
| Morgan |6300|6300|3780|
| Buggy |17000|18500|11100|
| Kuro |25500|32000|19200|
| Krieg |11475|52000|31200|
| Arlong |12393|78000|46800|

La gran subida de Krieg/Arlong elimina una regresión previa: derivaban de perfiles sin los multiplicadores de campaña y tenían menos de la mitad de HP de Kuro. Hay una única tabla de HP efectivo y una inicialización absoluta común. No se multiplican de nuevo al reintentar. Los perfiles originales conservan los patrones, daño, fases, tiempos de aviso y animaciones. La armadura destructible de Krieg mantiene su resistencia proporcional al HP, también al invocarlo; sus reducciones y escudo no aumentan.

Roger mantiene inmortalidad, puntuación y programación de invocaciones. Sus cinco variantes invocadas usan ahora60% de la misma referencia de campaña, en vez de20–60% según el boss. Esto también endurece el desafío final; no modifica las condiciones de acceso, recompensas o límites de8bosses/70normales.

### XP y valor del entrenamiento

Sin límite de nivel. Fórmula: `round(12 + 7*n + 2*n^1.45)`, frente a exponente1,35. El primer umbral sigue siendo21XP. A NV20/40/60/80, siguiente nivel:306/713/1189/1722XP, antes266/583/935/1314.

Multiplicadores de recompensa por mundo:2/2,4/2,8/3/3,2, antes2/2,8/3,5/4,1/4,8. Bonificación de XP por amenaza pasa de0,5a0,2. No cambia el valor de comida/cofres/berries ni los precios del entrenamiento. La experiencia permanente conserva su bonificación: el personaje entrenado aprende más rápido, además de tener mejores HP, daño, defensa, crítico y movilidad.

Se frena que niveles y cartas de partida sustituyan tan pronto a todas las ventajas permanentes. Entrenamiento alto mejora el margen de error, pero no es inmunidad ni victoria automática. Jugar muy bien, elegir una buena build o dedicar más tiempo a mejorar la partida siguen siendo vías válidas; no se añade un requisito oculto de entrenamiento.

## Calibración y límites de las conclusiones

`node --experimental-strip-types scripts/calibrate-campaign.ts` ejecuta100combates aislados, de hasta180s: cinco personajes × cinco bosses × entrenamiento cero/90% × dos controladores. Usa `Run.update`, IA, colisiones, daño, fases y progresión de cartas reales. Builds de niveles10/20/30/40/50, habilidades NV3/4/5/6/6 y grupos1/2/3/4/4; el resto del presupuesto de cartas se reparte entre daño, HP, armadura y cooldown. No usa objetos, frutas ni buffs comunes; puede recoger comida. Una semilla9001.

Resultados en `audits/campaign-calibration-2026-11-03.json`. Victorias de casos aislados:

| Boss | Sin entrenamiento, de10casos | Entrenamiento90%, de10casos |
|---|---:|---:|
| Morgan |0|4|
| Buggy |0|4|
| Kuro |0|3|
| Krieg |3|4|
| Arlong |0|3|

Son3/50frente a18/50: demuestran una ventaja mecánica del entrenamiento en estas fixtures, **no probabilidades humanas de llegar a Roger**. Son encuentros independientes con HP inicial completo, no una campaña continua. El controlador que consulta zonas de aviso es ingenuo y en varios casos juega peor que el que orbita; no representa a un jugador experto. Las elecciones, niveles y ausencia de objetos/frutas también condicionan los resultados. Nami/Usopp siguen necesitando seguimiento específico; no se puede asegurar un umbral humano exacto de «muy bueno/casi máximo» con estos datos. El objetivo queda implementado como curva de dificultad y ventaja permanente, pendiente de afinar con partidas humanas reales.

## Comprobaciones ejecutadas

-244pruebas de lógica aprobadas, incluido reloj persistente/pausa, HP creciente e idempotente,60% común, entrenamiento sin bloqueo de acceso y aparición real en Baratie/Arlong con tres semillas cada uno. Se verifica que los nuevos enemigos siguen siendo del primer tipo local aunque el reloj de campaña sea avanzado, y que solo los acuáticos pueden usar el agua.
- Seis pruebas de navegador aprobadas: Baratie→Krieg→Arlong, Arlong→Roger, cinco invocados y récords, en escritorio y móvil horizontal emulado. Dos pruebas adicionales de Beta aprobadas comprueban el preset de presión y protección de guardados.
- TypeScript, compilación con `/Piratesurvivor/` y HTML autónomo aprobados.
- No se han medido FPS físicos ni jugado campañas humanas completas con los cinco personajes. No se presenta la simulación como una validación de dificultad humana final.

## Archivos

`src/content/campaign-balance.ts` centraliza parámetros; `early-balance.ts` conserva la interfaz anterior y extiende la presión. Definiciones de los cinco mundos y `systems/progression.ts` ajustan amenaza/XP. `systems/spawner.ts` separa reloj de tipos y de estadísticas. `core/run.ts` conserva el reloj, aplica presión y configura bosses. `bosses/campaign.ts` y `challenges/roger.ts` unifican vida/armadura. `beta/prepare.ts` aproxima presión de llegada. Pruebas: `campaign-balance`, `difficulty`, `navigation`, `roger`, `beta`. Script y JSON de calibración conservan método/datos. No se añaden dependencias ni assets.
