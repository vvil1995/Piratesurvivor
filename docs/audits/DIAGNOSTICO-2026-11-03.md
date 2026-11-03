# Diagnóstico y actuación de balance · 3 de noviembre de 2026

## Conclusión

Hay desigualdad ofensiva entre personajes y una curva de dificultad discontinua. Luffy domina el daño cercano y la limpieza de hordas. Zoro es el siguiente en estas pruebas; Sanji queda en medio. Nami tiene un déficit especialmente grande de limpieza y Usopp de daño concentrado cercano, aunque sus ventajas de control/distancia impiden convertir esa lista en una clasificación definitiva de supervivencia humana.

Antes de endurecer todo el juego para exigir entrenamiento casi máximo al llegar a Roger, hay que reparar las discontinuidades entre mundos y compensar las diferencias de personaje. Endurecerlo ahora penalizaría mucho más a Nami y Usopp.

**No se han cambiado parámetros de juego ni guardados.** Este informe prepara la intervención.

Código de juego evaluado: `e106de786b23a213c8ae5c18959ec48b9eae6a09`.

## Método y límites

Se ha inspeccionado el contenido real: cinco personajes, treinta técnicas, buffs comunes, entrenamiento, XP, drops/comida/frutas, cinco mundos, cinco bosses y Roger. Se ejecutaron:

1. **245 ventanas de daño de30s**, con los ejecutores reales de ataques, proyectiles, áreas, ráfagas, guardias y daño. Semilla412, paso1/60. Técnicas individuales NV1/3/6, grupos de cuatro y entrenamiento estadístico máximo como brazo separado. Sin frutas, objetos, buffs ni mejoras de cartas. Blanco único a60px; grupo de8 en cuadrícula4×2 sin solapamiento (x60/92/124/156,y±18). Se restituyen posiciones cada tick para neutralizar desplazamientos. Los blancos no atacan. Esto mide capacidad ofensiva bajo condiciones controladas, no una partida real ni DPS sostenido en una persecución.
2. **60 ventanas de encuentros reales**, de hasta30s: cinco personajes × cinco bosses y Roger × entrenamiento cero/máximo. `Run.update`, IA, navegación, colisiones y ataques reales. Cuatro habilidades NV6 elegidas por el banco de blanco único, nivel nominal35, sin cartas/buffs/objetos/frutas; la comida sí puede recogerse. Controlador que orbita según alcance, **sin leer avisos ni esquivar inteligentemente**. No es una build legal de inicio: cuatro técnicas enlazadas contra Morgan son una fixture de comparación tardía.
3. Inspección de fórmulas de dificultad/XP y comprobaciones de integridad: TypeScript,235pruebas y compilación Pages/portable aprobados.

Una sola semilla por experimento: no hay intervalos de confianza. No se ha realizado una campaña humana completa con los cinco personajes, ni medido FPS, ni probado dedos/joystick en dispositivos físicos durante esta auditoría. Los30s de Roger acaban antes de la primera invocación a40s: **no verifican balance de sus hordas/bosses simultáneos**.

Reproducción desde la raíz:

```
node --experimental-strip-types scripts/audit-balance.ts
node --experimental-strip-types scripts/audit-encounters.ts
```

Resultados completos en `balance-2026-11-03.json` y `encounters-2026-11-03.json`. El banco no escribe guardados ni modifica los catálogos. Los grupos se seleccionan por daño individual de cada técnica; no se ha buscado exhaustivamente la mejor sinergia de todas las combinaciones. Ataques curativos/defensivos no deben interpretarse como malos porque den0DPS sin presión enemiga.

## Comparativa de personajes

DPS medido, redondeado. Columna inicial: solo la habilidad inicial NV1. Columnas NV6: cuatro técnicas enlazadas seleccionadas para el escenario; **el DPS de8 enemigos es total, no por enemigo**, y puede usar otro grupo distinto al de blanco único.

| Personaje | Inicial, un blanco | NV6, un blanco | NV6,8 blancos | NV6, un blanco, entrenamiento máximo |
|---|---:|---:|---:|---:|
| Luffy |52,0|284,6|1788,5|596,0|
| Zoro |37,7|224,3|1211,5|454,4|
| Sanji |32,1|188,7|937,8|387,0|
| Nami |24,9|149,3|247,0|320,1|
| Usopp |27,6|109,5|367,5|225,3|

### Luffy · referencia ofensiva demasiado dominante

Pistol arranca con24de daño cada0,45s, frente al bastón de Nami (20×1,1 cada0,9s) o Namari de Usopp (20×1,2 cada0,9s). La ventaja no nace solo del daño base, sino de cadencias y cobertura. Pistol evolucionado, Gatling, Bazooka y Whip aportan varias fuentes de daño múltiple. En el grupo de8, el total es aproximadamente7,2veces el de Nami y4,9veces el de Usopp.

Tampoco hay una fragilidad evidente que compense todo esto:100HP base y Balloon ofrece inmunidad temporal, expulsión y reflexión evolucionada. El grupo ofensivo del banco excluye Balloon: hay que medir también tres ataques más defensa antes de decidir un nerf.

### Zoro · fuerte y resistente, segundo candidato a referencia

Mayor daño base29,110HP,8% crítico y2% armadura. Buen daño de área mediante Doble espada y Tora Gari, más movilidad ofensiva de Oni Giri. Su daño NV6 de blanco único queda aproximadamente21% por debajo de Luffy. Guardia triple no está valorada por un banco sin ataques entrantes.

En el controlador contra Kuro sin entrenamiento, Zoro aguantó30s donde Luffy/Sanji/Nami murieron antes de10s. Es una señal de que supervivencia y DPS no ordenan igual a los personajes; **no demuestra que un humano sobreviva ese tiempo ni que Kuro sea imposible con los demás**.

### Sanji · intermedio ofensivamente, con potencial de sostenimiento

Buen movimiento210 y regeneración0,3HP/s. Collier gana muchísimo contra grupos al evolucionar; Côtelette concentra daño. Cocina y su comida no cuentan como DPS. Su valor depende de recoger comida durante el combate; falta medir builds con Cocina y daño entrante para no buffar un personaje ya resistente a largo plazo.

Su total NV6 de blanco único queda34% por debajo de Luffy; la limpieza queda alrededor del52% de la referencia. Revisar cadencias y remates antes que aplicar un aumento plano de todo el personaje.

### Nami · prioridad alta por falta de presión ofensiva

Velocidad215 y magnetismo120 favorecen posicionamiento/recogida, pero90HP y20de daño base. Staff Hit NV6 aporta118,6DPS de los149,3del grupo: dependencia de un solo ataque. El salto de la evolución de dos golpes es enorme, mientras otras técnicas siguen aportando poco daño. La limpieza de grupos queda muy por debajo de Luffy/Zoro.

Raíz, confusión, señuelo y evasión tienen utilidad contra normales. Los bosses resisten los controles normales y su IA principal apunta al jugador: esa utilidad no compensa automáticamente el menor daño en boss. Primero hay que darle ventanas ofensivas/valor útil contra bosses con el repertorio actual; no hace falta inventar nuevas técnicas meteorológicas para este parche.

### Usopp · daño cercano bajo, pero alcance y selección de build condicionan mucho

85HP y20de daño base; alcance220. A180px, su habilidad inicial sigue haciendo26,8DPS y las otras cuatro iniciales dan0 en esa fixture. **Esta ventaja existe y debe preservarse.**

El banco cercano elige Martillo como parte del grupo óptimo; el controlador mantiene a Usopp alrededor de200px, donde Martillo no aporta. Por ello sus malos resultados automáticos frente a Krieg/Arlong/Roger no sirven para afirmar que sea el peor personaje jugado correctamente. Necesita pruebas con cuatro técnicas a distancia y distintos márgenes de kiteo.

Sí hay señales claras de revisión: Kayaku tiene recarga6s de base y daño1,2; Bazooka de Luffy tiene1,6s y daño1,8, aunque su alcance/coste de acercarse sean distintos. Humo e irritante pierden buena parte del valor de control contra bosses. El abanico de Multi Shot tampoco equivale a que todos los proyectiles golpeen al mismo objetivo.

## Escalado temporal y entre mundos

Valores del **enemigo básico**, no promedio ponderado de variantes. A5min ya hay enemigos de tipos más peligrosos. La tabla incluye multiplicadores efectivos usados por `Run`.

| Mundo | HP entrada→5min | Daño entrada→5min | XP por básico entrada→5min | Objetivo de densidad entrada→5min |
|---|---:|---:|---:|---|
| Shells |32→51,2|10→12,8|10→13|8→22|
| Orange |87,8→140,4|20,4→26,0|28→36|20→35|
| Syrup |153→244,8|28→35,7|49→64|32→48|
| Baratie |105→168|23→29,3|74→96|sin objetivo de presión compartido; tope110|
| Arlong |135→216|27→34,4|106→137|sin objetivo de presión compartido; tope105|

**Dentro de un mundo sí suben HP, daño y velocidad** con el tiempo local: HP+12%/min, daño+5,5%/min, velocidad+1,2%/min. Se añaden tipos más complejos a1/2/3min. Pero el escalado de estadísticas se satura:20min en Shells/Orange y12min en Syrup/Baratie/Arlong.

Problemas concretos:

- Shells→Orange→Syrup conservan un máximo de presión acumulada y reponen hasta2enemigos cada0,45s mientras falten plazas. El objetivo crece hasta5min y se estanca en22/35/48. **No equivale a que siempre haya ese número:** el jugador los mata y el spawn puede fallar por espacio/navegación.
- Baratie/Arlong salen de ese sistema y vuelven al reloj local: al entrar, un candidato cada1s, aunque el mundo anterior repusiese hasta4,44/s. Además se limpia el campo al viajar. Los topes110/105 no garantizan densidad: son límites de rendimiento, no objetivos de aparición.
- Baratie pierde el multiplicador1,8 de Syrup. El básico pasa de244,8HP/35,7daño al final de5min a105HP/23daño al entrar: aproximadamente−57%HP y−36%daño. El patrón de ataques cambia, pero la bajada estadística es real.
- Baratie5min→Arlong entrada vuelve a bajar de168HP/29,3daño a135HP/27daño. Agua, ataques a distancia y combos añaden dificultad, pero no corrigen por sí solos la discontinuidad.
- En los tres primeros mundos el intervalo0,45 fijo de `Run` ignora la aceleración/ráfagas de aparición de `difficultyAt`: esas opciones del catálogo no controlan realmente la cadencia allí.

Roger sí añade presión temporal: mundos de horda cada30s, tandas de bosses cada40s, crecimiento de1a5por tanda y tope8; hordas hasta70, mayor cadencia y avisos más cortos desde4min. La tasa de horda también tiene suelo0,24s: no crece indefinidamente. El banco de30s no cubre esas fases.

## Bosses: regresión de HP y dos fuentes de verdad

| Boss | HP efectivo de campaña |
|---|---:|
| Morgan |6300|
| Buggy |17000|
| Kuro |25500|
| Krieg |11475|
| Arlong |12393|

Los multiplicadores1,5/2,5/3 se aplican al iniciar los tres primeros bosses. Krieg/Arlong se construyen a partir de los perfiles originales sin esos aumentos. Krieg queda en45% de la vida efectiva de Kuro. Su armadura aumenta resistencia efectiva, pero no justifica dar por continua la curva sin medirla.

Roger invoca al60% del **perfil base**, no de la vida efectiva de campaña. Eso deja a Morgan en40% de su versión de campaña, Buggy24% y Kuro20%; Krieg/Arlong sí quedan en60%. Hay que unificar la fuente o documentar y balancear deliberadamente esta diferencia.

El controlador mató a Morgan con Luffy/Zoro sin entrenamiento en23,2/29,2s usando cuatro técnicas NV6. **No es el TTK real de Morgan con build de primer mundo**. Sí confirma que HP fijo no basta para compensar una build muy desarrollada. Contra Krieg/Arlong con máximo entrenamiento, Luffy terminó en21,1/24,7s en esta fixture. No extrapolar a una campaña humana: faltan cartas, buffs, elecciones y esquivas.

## Experiencia y entrenamiento

La XP necesaria crece como `round(12 + 7*n + 2*n^1.35)`, sin límite arbitrario. Total para alcanzar NV20/40/60/80/100:2473/10734/25687/47943/77989XP. La XP por muerte crece por mundo: multiplicadores2/2,8/3,5/4,1/4,8, además de amenaza y variantes. La comida también aporta1XP y cura12HP con10% de drop por normal.

Esto explica que limpiar hordas pueda producir niveles muy altos. A modo de techo aritmético,64XP×4,44bajas/s≈284XP/s en Syrup permitirían llenar los1314XP del siguiente nivel aNV80 en unos4,6s. **No es una tasa observada:** presupone spawn válido, recogida y muerte inmediata de todos los básicos; no incluye pausas, variantes o límites reales. El mismo supuesto extremo deja unos2,8min si se busca alcanzarNV80 desde cero con esa tasa constante.

El número de nivel **no aumenta automáticamente el daño base**: lo hacen las cartas, ataques, entrenamiento, buffs y objetos elegidos. Subir el nivel de la Beta sin asignar esas mejoras no reproduce una build natural del mismo nivel. NV62en Buggy/NV80en Kuro son señales para revisar economía de XP, no una prueba aislada de daño descompensado.

Máximo entrenamiento estadístico prácticamente duplica el DPS de los grupos analizados (aprox.2,0–2,14×) y aumenta vida/mitigación. El brazo entrenado no usa ventajas de elección inicial, segundos ataques o multiplicador de experiencia; solo los modificadores de estadísticas. El juego no tiene un requisito que haga necesario ese entrenamiento para entrar a Roger: llegar depende de la curva y del jugador.

## Plan de actuación propuesto

| Prioridad | Intervención concreta | Criterio de aceptación |
|---|---|---|
| P0 | Unificar estadísticas efectivas de los cinco bosses y sus invocados; separar perfil original, multiplicador de campaña y multiplicador de invocación. | Ninguna multiplicación accidental doble;60% de la referencia elegida consistente y testeado para los cinco. |
| P0 | Extender aBaratie/Arlong el objetivo de presión con transición progresiva, conservando navegación acuática y límites móviles. Separar eventos locales de presión de partida. | No reinicio a1candidato/s ni bajada de presión al viajar; barrido de semillas con candidatos fuera del jugador y accesibles. |
| P1 | Corregir la caída efectiva de HP/daño entre Syrup/Baratie/Arlong. Ajustar primero las referencias, después los números. | Comparar el final de un mundo con la entrada del siguiente; eliminar descensos accidentales sin disparar todas las estadísticas a la vez. |
| P1 | Pase específico de Nami y Usopp antes de endurecer globalmente. | Medir boss, horda, utilidad, alcance y curación con grupos adecuados; reducir dependencia del básico de Nami y del Namari de Usopp. |
| P1 | Revisar daño múltiple/cadencia de Luffy, conservando identidad. Usar Zoro/Sanji como referencias adicionales. | Disminuir la brecha de limpieza sin exigir igual DPS a soporte, tanque y tirador. No basar un nerf solo en la fixture estática. |
| P2 | Economía de XP y cartas: comparar adquisición por minuto y poder ofensivo/defensivo adquirido. | Partidas trazadas con mismas semillas y política de cartas; separar XP ganada, recogida, elecciones y tiempo en menús. Sin límite de nivel artificial. |
| P2 | Afinar entrenamiento y exigencia de acceso aRoger después del pase de personajes. | Entrenamiento alto aporta una ventaja sustancial; llegar aRoger sigue siendo difícil, sin bloquearlo con un requisito oculto ni hacer inviable a un personaje. |
| P3 | Roger completo y móvil real. | Pruebas más allá de8min, hasta8bosses vivos, frutas/objetos/fusiones y medidas físicas de FPS/memoria. |

### Experimentos para la primera intervención numérica

No aplicar todos a la vez. Registrar antes/después con la misma versión del banco:

- **Luffy:** ensayar recortes pequeños de10–15% en una fuente dominante o caída de daño por objetivos atravesados. No bajar simultáneamente todo el kit, HP y defensas.
- **Nami:** aumentar la contribución de dos técnicas secundarias y la cobertura de horda; revisar el valor de su utilidad durante bosses resistentes. Un simple+20% plano no resuelve una diferencia de7,2×en limpieza.
- **Usopp:** banco específico a140/200/280px con cuatro técnicas a distancia, sin Martillo. Ensayar mayor frecuencia/impacto de Kayaku (p.ej.6→4,5s como candidato) y observar DPS efectivo, fallos y seguridad, sin asumir que los cinco proyectiles del abanico impactan al mismo boss.
- **Sanji:** comparar cuatro ofensivas con tres+Cocina y medir comida generada/recogida, curación efectiva y daño recibido. Evitar buffs generales antes de valorar sostenimiento.
- **Zoro:** mantenerlo inicialmente como referencia; comprobar Doble espada, ventanas de guardia y accesibilidad de Oni Giri en enemigos móviles.
- **XP:** probar un único cambio moderado, como menor escalado de recompensa por amenaza o menor salto del multiplicador entre mundos. No reducir XP y aumentar coste de nivel simultáneamente.

### Matriz de validación siguiente

Primero tres semillas como filtro técnico; después al menos diez por candidato y pruebas humanas comparables. Cinco personajes, entrenamiento cero/medio/alto, build progresada mediante cartas reales, un grupo de daño y uno de utilidad por personaje. Separar intentos PC y móvil. Registrar: bajas/min, densidad visible/total, fracasos de spawn, daño por habilidad, porcentaje de impactos, daño recibido por patrón, curación, tiempo por fase, XP/min, cartas adquiridas y progreso conservado al viajar.

Después añadir las seis frutas y objetos por separado, para detectar procs dominantes sin mezclar todas las variables. El historial actual de pruebas de frutas protege mecánicas; no demuestra igualdad de poder entre ellas ni entre sus combinaciones.

La primera entrega de cambios debería resolver P0 y la discontinuidad estadística, acompañada de un pase acotado de Nami/Usopp. La segunda puede afinar Luffy, XP y duraciones de bosses con esos resultados. Roger y la exigencia de entrenamiento se ajustan al final: endurecerlo antes escondería los desequilibrios en lugar de resolverlos.
