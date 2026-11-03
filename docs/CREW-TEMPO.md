# Cadencia de secundarios ·2026-11-03

Aplicado el recorte solicitado: los veinte secundarios de Zoro, Sanji, Nami y Usopp conservan40% de su cooldown anterior (reducción60%) en los seis niveles. Constante ajustable en `src/content/crew-tempo.ts`. Se mantienen Oni Giri, Collier, Staff Hit y Namari Boshi. Luffy y buffs universales no cambian.

| Ataque | Antes NV1 | Ahora NV1 |
|---|---:|---:|
|tora-gari|4s|1.6s|
|sanzen-sekai|10s|4s|
|double-sword|2.7s|1.08s|
|sword-guard|8s|3.2s|
|santoryu-sweep|3.2s|1.28s|
|epaule|4s|1.6s|
|cotelette|3s|1.2s|
|selle|3s|1.2s|
|mouton-shot|9s|3.6s|
|combat-cooking|10s|4s|
|staff-spin|3.5s|1.4s|
|rope-bind|3.8s|1.52s|
|quick-theft|2.8s|1.12s|
|thief-decoy|7s|2.8s|
|smart-escape|7s|2.8s|
|kayaku-boshi|6s|2.4s|
|smoke-shot|5s|2s|
|irritant-shot|4s|1.6s|
|multi-shot|3.5s|1.4s|
|usopp-hammer|4.5s|1.8s|

El intervalo entre golpes de una ráfaga se conserva; solo se acorta la espera entre activaciones. No cambian daño, alcance, proyectiles, estados, duración de guardias/nubes/señuelos ni evoluciones. Por ello algunas defensas y controles tendrán mayor presencia: es un pase de cadencia solicitado, no el balance definitivo de supervivencia. El límite global mínimo de recarga sigue activo.

Irritante: poco daño, aturdimiento0,6s de normales; evolucionado0,9s y radio60px. Los bosses son resistentes a ese control; el ataque mantiene su daño. Descripciones actualizadas.

Sanji: límite visual de pierna60px lógicos, más cerca del cuerpo; se elimina la segunda pierna superpuesta de los combos. Épaule y el remate también usan el límite. No es un rediseño definitivo: se conservan los PNG provisionales hasta rehacer los assets según la petición posterior. No se han generado ni añadido imágenes nuevas.

Archivos: `crew-tempo.ts`, `crew-abilities.ts`, `crew-effects.ts`, `tests/crew-tempo.test.ts` y documentación. Los datos de `audits/*2026-11-03*` corresponden al diagnóstico anterior (`e106de7`); no se han sobrescrito con las nuevas cadencias.
