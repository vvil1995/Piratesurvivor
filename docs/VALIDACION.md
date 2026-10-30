# Validación del prototipo 0.1

## Comprobaciones realizadas en el entorno de desarrollo

- TypeScript estricto sin errores (`npm run check`).
- Ocho pruebas de núcleo/persistencia: movimiento diagonal y límites, pausa, aparición fuera de cámara, capacidad del pool, combate/XP, cartas y límites, derrota/victoria, simulación completa de diez minutos, premios sin duplicar, entrenamiento, recarga y recuperación de guardado corrupto. Algunos casos agrupan varias comprobaciones.
- Chromium de escritorio y emulación móvil con Playwright: siete pruebas aprobadas y una omitida intencionalmente (arrastre táctil en el proyecto de escritorio).
- Entrada por teclado, pausa que congela el reloj, combate automático, selección única de mejora, derrota/reinicio, victoria, entrenamiento y recarga verificados mediante la interfaz. Los resultados y la subida de nivel se aceleran con fixtures solo disponibles en desarrollo.
- Joystick probado con eventos táctiles nativos de Chromium por CDP: arrastre, cancelación y cambio a orientación horizontal.
- HTML autónomo verificado en Chromium, en escritorio y perfil móvil, servido desde HTTP local. Tras cargar el único documento se deshabilita la red: inicio, combate y pausa siguen funcionando. No se solicitan recursos adicionales ni hay errores JavaScript. Se comprueba que no expone el hook de QA.
- Capturas de inicio y batalla revisadas en escritorio y móvil emulado. La apertura de créditos incluye los avisos; no se necesitan fuentes externas.
- Licencias comprobadas y avisos conservados para los 19 paquetes instalados, incluidas dependencias transitivas y herramientas. Los binarios de esbuild/Rollup que omiten su texto usan el aviso de su paquete principal de la misma versión.

La simulación de diez minutos utiliza vida aumentada como fixture para validar tiempo, pools y estados; **no demuestra que el equilibrio de dificultad esté validado**. Las pruebas de interfaz aceleran victoria/derrota y no sustituyen una partida humana de diez minutos.

## Límites de la verificación

- El Chromium administrado bloquea `file://` por política (`ERR_BLOCKED_BY_ADMINISTRATOR`). El artefacto es un HTML con estilos y JavaScript embebidos, sin módulos externos, pero su apertura por doble clic debe comprobarse en un navegador personal. La compilación comprueba la sintaxis del script ya insertado.
- Emular un iPhone en Chromium no equivale a ejecutar Safari. No se ha probado Safari/WebKit ni teléfonos Android o iOS físicos.
- No se han medido FPS, consumo de batería ni memoria en un móvil real. El objetivo de 30–60 FPS sigue pendiente de medición.
- GitHub respondió HTTP 401 a la consulta autenticada. No hay remoto creado ni código subido. El workflow está preparado, pero no ejecutado en GitHub.
- El uso simultáneo en varias pestañas no tiene resolución de conflictos; usar una sola pestaña por perfil durante el prototipo.

## Próxima prueba con jugadores

1. Abrir el HTML autónomo en un ordenador personal.
2. Probar una URL estática privada en Chrome Android y Safari iOS, vertical y horizontal.
3. Jugar diez minutos con estadísticas normales, valorar dificultad, recogida de XP, alcance y frecuencia de mejoras.
4. Interrumpir con otra aplicación, volver, cancelar un toque y cambiar orientación.
5. Perder, entrenar, cerrar y volver a abrir; exportar/importar entre dispositivos.
6. Repetir tres partidas y medir calentamiento, tirones y memoria. Registrar dispositivo y navegador.

## Reproducir

```bash
npm ci
npm run check
npm test
npm run licenses
npm run build
npm run test:browser
node scripts/check-portable.mjs
```

El último comando usa `file://` de forma predeterminada. En un navegador administrado que lo bloquee, establecer `PORTABLE_HTTP=1` permite la comprobación autónoma mediante un servidor local temporal que el script cierra al terminar. `CHROMIUM_EXECUTABLE` permite indicar un Chromium existente. Los scripts de prueba no modifican datos de jugadores reales.

## Actualización 0.2: arte y orientación móvil

- Nuevas texturas generadas de Luffy y marines, retrato, iconos en las tarjetas y puño visual de combate. La simulación y el guardado v1 se conservan.
- La batalla móvil requiere horizontal. Vertical muestra aviso, pausa tiempo/enemigos y libera el joystick. Al girar se ofrece reanudar explícitamente; se puede volver al puerto desde el aviso.
- El botón de giro intenta fullscreen y Screen Orientation API. Si el navegador no lo permite, muestra instrucciones para girar físicamente. No se ha verificado bloqueo automático en un Android/iPhone real.
- Se amplió la suite a 10 casos: 8 aprobados y 2 omitidos intencionalmente en escritorio (solo móviles). Comprueba también las imágenes de tarjetas, entrada en vertical, regreso al puerto y giro durante el movimiento.
- La revisión de capturas detectó estiramiento del canvas tras pasar de vertical a horizontal. Se añadió ResizeObserver sobre el parent real y una comprobación de proporción del canvas en las pruebas.
- La plancha se genera una sola vez en texturas; no se vuelve a recortar por frame. Falta valorar en teléfonos reales la legibilidad de los sprites más finos y medir FPS/memoria.

## Actualización 0.3: fase 1A–1C

Se implementa exclusivamente Shells Town procedural, colisiones y navegación, sobre 0.2. El plan de producto aprobado y las nuevas decisiones están en PLAN_GENERAL.md. No se añaden otros personajes, cofres, inventario, drops de berries, jefes o online.

Comprobaciones realizadas:

- TypeScript estricto y compilación de navegador/HTML autónomo correctos.
- 18 casos de núcleo y mundo: seis de generación/colisiones/navegación y doce de simulación, combate, pools, atribución por actor y persistencia. Incluyen campos de ruta en recintos en U, direcciones actualizadas por intervalos, retroceso y golpes bloqueados por sólidos, reconstrucción tras descargar, coordenadas negativas, colisión de claves de la graella anterior y guardados con tiempos superiores a 600 segundos.
- El recorrido de datos recorre 800 posiciones de chunk, consulta vecindarios y vuelve al origen verificando la misma geometría y un máximo de 128 chunks en caché.
- La simulación de 60 segundos comprueba periódicamente que actores y enemigos no están dentro de sólidos. No equivale a una sesión humana larga.
- Suite de navegador: 10 pruebas aprobadas y 2 omitidas deliberadamente en escritorio (giro/joystick solo de móvil). Verifica además retirada de victoria automática, persistencia existente y 61 viajes a coordenadas lejanas con texturas recicladas (máximo 49 slots), caché acotada y geometría idéntica al regresar.
- HTML autónomo en escritorio y móvil emulado: carga, exploración, pausa y proporciones tras giro. Tras cargar el documento se desactiva la red: sin recursos de red adicionales, sin errores JavaScript y sin hook QA en producción. Revisión visual de capturas de Shells Town con casas, jardines y recintos.
- Inventario de licencias verificado: mismos 19 paquetes instalados, sin nuevas dependencias ni recursos externos.

Pendiente:

- Probar Chrome Android y Safari iOS en dispositivos físicos. No se han medido FPS, batería ni memoria de teléfonos reales. Emular un iPhone en Chromium no prueba Safari.
- Sesión humana de 20–30 minutos, retorno a lugares anteriores, giros, suspensión y tres reinicios para observar memoria y dificultad.
- El terreno usa un catálogo pequeño de parcelas deliberadamente conectado; seguirá habiendo repetición visual. Los edificios no son interiores visitables y los obstáculos son indestructibles en esta fase.
- Los enemigos y la XP abandonados lejos se reciclan; regresar no restaura esas entidades. Solo el terreno se reconstruye idéntico. Una partida activa no se guarda al cerrar.
- Economía, entrenamiento y récords v1 siguen siendo los del prototipo. La XP por isla, nuevos ataques, progresión de campaña, berries persistentes de enemigos y reclutamiento quedan para fases posteriores. No hay victoria de campaña todavía.
- El registro por actor y las pruebas de atribución no constituyen multijugador. Reparto de XP/botín, autoridad, sincronización y cámaras múltiples se diseñarán cuando se aborde online.
- Continúa sin haber remoto de GitHub configurado; las versiones se conservan localmente. El HTML file:// sigue pendiente de prueba fuera de la política del navegador administrado descrita arriba.

## Actualización: variedad y animación direccional

TypeScript, pruebas de simulación/mundo/animación y compilación pasan. Se verifican ocho direcciones, parada al dejar de moverse, reinicio al reciclar entidades, variedad de parcelas y avenidas libres. Suite completa con `CHROMIUM_EXECUTABLE=/usr/bin/chromium`: 12 pruebas aprobadas y 2 omitidas intencionalmente en escritorio. Se corrigió una alternancia a reposo entre renders sin paso de simulación; el reposo usa una tolerancia de 80 ms. La prueba contempla pasos axiales al soltar teclas sucesivas o deslizarse ante un obstáculo. Se revisó una captura de escritorio. No se han probado móviles físicos. `netlify.toml` configura Node 22.18.0, `npm run build` y `dist`; el despliegue automático depende de la configuración del sitio conectado en Netlify.


## Fase 0 y corrección gráfica direccional — 30-10-2026

Se revisó la base 5e198bf y se actualizó PLAN_GENERAL.md con el modo individual, entrenamiento por personaje, evolución automática al nivel 6 y fases pequeñas. AUDITORIA_FASE_0.md distingue contenido real, propuestas y riesgos. No se implementó economía, campaña ni nuevos personajes.

Se sustituyen los actores geométricos por hojas detalladas generadas de ocho direcciones y dos pasos para los cinco personajes y marine. Solo Luffy/marine entran en juego; el resto se prepara como recursos. Atlas compactos reproducibles, sin cargar personajes futuros ni hojas grandes innecesarias; liberación de texturas fuente de GPU. Se revisó visualmente la galería de los seis actores. Siguen pendientes ciclos más largos y poses de ataque por orientación, pruebas Android/iOS físicas y mediciones de FPS/memoria.

Comprobaciones finales de esta entrega: `npm run check`, `npm test` y `npm run build` aprobados. Suite completa Chromium: **14 aprobadas, 2 omitidas intencionalmente** (controles móviles en escritorio). Incluye equivalencia de píxeles de fuente/atlas compacto para los seis actores, 16 cuadros utilizables por actor, márgenes transparentes y frente/espalda distintos; movimiento, colisiones/caché, joystick, giro, XP, derrota, pausa y persistencia conservados. Capturas de galería y móvil emulado revisadas. `check-portable.mjs` con HTTP local valida escritorio y móvil emulado sin recursos de red adicionales ni hook QA. HTML autónomo 3,76 MiB sin comprimir (~2,03 MiB gzip); este peso incluye Phaser, interfaz, atlas de iconos y los dos actores actuales. No se afirma compatibilidad física ni un FPS medido.

## 0.4.0 — cuatro ataques de Luffy y evolución automática

Implementado el punto1 de ORDEN_DE_TRABAJO.md: Pistol/Gatling/Bazooka/Whip, cuatro espacios, cooldown independiente y ráfagas, seis niveles/+ sin objetos, cartas de aprendizaje/mejora y HUD. Se conservan mapa, controles, atlas detallados y perfil v1. Topes/pasivas definitivos y economía siguen pendientes de sus bloques.

Se añaden ocho casos de combate: equipamiento/máximos/reinicio; perforación; ráfagas temporizadas y retarget tras baja; barrido360/onda/empuje; cooldowns y pausa; colisiones/recompensa única; cartas válidas; trazo perforante detenido por pared. Las fixtures de atribución se actualizan a temporizadores por ataque, sin añadir multijugador. La prueba UI aprende tres ataques, evoluciona Pistol a6, comprueba exclusión del máximo y reinicio. Se revisó captura con cuatro espacios en móvil emulado.

La comprobación del reloj usa progreso ≥1s en vez de observar un segundo exacto. La animación direccional usa desplazamiento de simulación controlado para no encontrar un obstáculo de semilla aleatoria durante el polling; teclado y joystick conservan sus propias pruebas nativas. No se afirma equilibrio final de cuatro ataques, sesiones de campaña ni rendimiento de teléfonos físicos.

Resultado final de regresión 0.4.0: TypeScript, cuatro archivos de pruebas de núcleo (incluidos ocho casos nuevos de combate) y compilación correctos. Suite completa Chromium: **16 aprobadas y2 omitidas intencionalmente** (móvil en escritorio). HTML autónomo probado por HTTP local en escritorio/móvil emulado, sin red adicional ni QA de producción. Las pruebas aceleradas de aprendizaje/nivel6 no miden el ritmo real de progresión ni sustituyen partidas humanas. Se mantiene pendiente Chrome Android/Safari iOS físicos, equilibrio de cooldown/daño y resolver las estadísticas del punto2.

Comprobación adicional de render: dos pruebas dirigidas aprobadas (escritorio y móvil emulado) crean enemigos cercanos y ejecutan simultáneamente los cuatro ataques evolucionados. Verifican eventos de línea/ráfaga/cono/barrido y ausencia de errores de Phaser, con captura revisada. Se congela la simulación como fixture para observar efectos; no es una medición de rendimiento.

## 0.4.1 — marcha y presión por tiempo

Se mantienen sprites detallados; se añaden articulación de piernas, peso, recortes preasignados y polvo de paso por desplazamiento. Se elimina el desfase de un tick entre cámara/dibujo y simulación. Sin marcha al estar bloqueado, pausado o con movimiento reducido. La valoración de si la marcha deja de parecer flotante requiere prueba humana; una captura fija no lo demuestra.

TypeScript, núcleo y build aprobados. Tres casos nuevos verifican curva/topes, estadísticas de enemigos nacidos tarde independientes de HP del jugador y más enemigos reales en10s avanzados, conservando pool y colisiones. Animación verifica contacto por distancia y ausencia de oscilación al parar. La suite de navegador conserva19 casos aprobados y2 omisiones; se ajusta la espera a reposo del caso de pasos para respetar sus80ms de tolerancia, repetición dirigida aprobada en escritorio y móvil emulado. HTML autónomo también aprobado en ambos perfiles sin red adicional.

No se han medido FPS/memoria en dispositivos físicos. El rig añade dos imágenes por actor (preasignadas, sin texturas nuevas por enemigo); medir su impacto con150 enemigos. La presión a20min está acotada, no es un balance definitivo de campaña.

## 0.5.0 — bloque2

Se añaden vida/regen ilimitadas en elecciones, armadura/críticos reales, resolver de estadísticas y topes combinados configurables. Se mejora XP superior y se muestran estadísticas efectivas en pausa. El entrenamientov1 mantiene +5HP por nivel; no se introducen otras compras permanentes. Se mantienen articulación y presión temporal0.4.1.

Ocho casos nuevos verifican cura exacta20 y repetición, suma sobre base sin exponencial, topes de fuentes y de cooldown por ataque evolucionado, idempotencia/reemplazo de fuente, regeneración almacenada al subir vida y máximo absoluto3HP/s, filtrado de cartas, defensa/regen reales y ausencia de resurrección, daño crítico×1,5 con RNG controlado. Los contenedores probados de objetos/fruta no equivalen a inventario/frutas implementados.

Las fixtures de resistencia elevan también baseStats para que recalcular estadísticas no borre su aumento artificial de vida. La nueva prueba de UI elige vida/armadura/regen/crítico, verifica pausa y XP y reinicio de la build. No demuestra equilibrio ni compatibilidad física. Pendientes: sesiones humanas y FPS/memoria en Android/iOS reales; valoración de las piernas por el usuario.

Resultado final0.5: `npm run check`, `npm test` (seis archivos, incluidos ocho casos de estadísticas) y `npm run build` correctos. Suite completa de navegador: **22 aprobadas,2 omitidas intencionalmente**. HTML autónomo por HTTP local en escritorio y móvil emulado: aprobado sin red adicional ni hookQA. Captura de pausa/estadísticas revisada. El balance numérico permanece provisional y no se ha validado un teléfono físico.

## 0.6 — combate v2, fasesA–E

Auditoría y migración incremental: estados aprendidos separados de cuatro ranuras; hasta cuatro componentes por ranura, máximo dos buffs aprendidos, niveles independientes1–6, sin reiniciar recargas/ráfagas. Buffs temporales/constantes calculados una sola vez y limitados por stats globales. Datos de ensayo, no valores definitivos.

Nuevos tests de agrupación/cancelación/transacción, límites de buffs, alternancia/constancia, Balloon/reflectores, Axe diferido, pausa/limpieza, cap de96 proyectiles y colisiones, rifle real. Núcleo/tipos/build aprobados. Navegador:24 aprobadas,2 omisiones intencionales de móvil en escritorio. Se prueba UI de ocho movimientos con gestión táctil y modo constante. Falta equilibrio de sesiones largas y medición física de FPS/consumo con proyectiles/áreas/rifles. FaseF de otros personajes todavía no implementada en esta fita.

Artefacto0.6 autónomo también aprobado por HTTP local en escritorio/móvil emulado, sin red adicional ni QA en producción. Captura de ocho movimientos/gestión táctil revisada. La ejecución de26 casos de navegador fue24 aprobados y2 omitidos; pruebas aceleradas no equivalen a una partida humana completa.

## Beta0.7 — tripulación de pruebas

Acceso de prueba autorizado a Luffy/Zoro/Nami/Usopp/Sanji mediante selector, sin compras, sin desbloqueos persistentes y sin cambios del perfil al seleccionar/abandonar. Catálogos34 habilidades:30 exclusivas +4 universales, seis niveles cada una. Datos configurables y ejecutores compartidos; adaptaciones señaladas en el detalle.

Check, nueve archivos de pruebas de núcleo y compilación aprobados. El nuevo archivo crew.test.ts contiene ocho casos:60 activaciones (30 técnicas×niveles1/6), catálogos, robo único, estados/caducidad, objetivo enfocado y contraataque, atracción/explosión del señuelo y comida/regeneración, perforación/rebotes/humo/explosiones limitadas, desvío y limpieza al morir. Fixtures controladas, no prueba de equilibrio de sesiones humanas.

El HTML autónomo incluye los cinco atlas y ocupa4,59MiB (aprox.2698KiB gzip). La web carga bajo demanda los otros cuatro atlas; el inicial sigue conteniendo Luffy/marine y recursos comunes. Sin nuevas dependencias ni recursos externos. Entrenamiento comprado individual, pasivas exclusivas, récords por personaje y taverna pendientes; se conserva el perfil y entrenamiento de Luffy anteriores. Pendiente medir FPS, calor y consumo en Android/iOS físicos y comprobar Safari.

Suite completa de navegador de beta0.7:28 aprobadas y2 omisiones intencionales (controles móviles en proyecto escritorio). Se verifican selector real de los cinco, nombre/sprite/vida inicial, ausencia de compras/cambios del perfil al abandonar y efectos evolucionados de la tripulación con HUD y gestión. Capturas de puerto móvil y combate de Zoro revisadas; ajuste de truncado de nombres largos en HUD. HTML autónomo por HTTP local: escritorio y móvil emulado aprobados con red deshabilitada, inicio de los cinco, sin peticiones externas adicionales ni hookQA. No se verificó publicación de Netlify ni dispositivos físicos.

Tras el ajuste final del HUD y extraer el cooldown mínimo a configuración (0,2s, sin cambiar el valor), se repiten check/núcleo/build y las cuatro pruebas de selector/tripulación en escritorio/móvil:4 aprobadas. Se comprueba que los nombres quedan dentro de su ranura; capturas finales de Zoro y Nami revisadas. Paquete de navegador y fuente0.7.0 generados en release/ (ignorados por Git); CI conserva el ZIP como artefacto.


##0.7.1 — agrupación condicionada, movimiento, presentación y experiencia

Check, nueve archivos de pruebas de núcleo y build aprobados localmente. Se prueba aprendizaje único, unión bloqueada antes del quinto, una oportunidad por aprendizaje, cancelación con rollback, concesión futura de jefe consumible y capacidad16 con un catálogo ficticio exclusivo del test. Rodilla/apoyo/recobro y reposo se comprueban en ocho direcciones en la función de pose; esto no valida por sí mismo la calidad estética.

XP: marine inicial10 frente a5, marine de10min16; recompensa no depende de HP del jugador. Mismos cristales/bajas producen nivel2 antes; la pausa de subida funciona. Ritmo de aparición por segundo inferior en0/2/4/8min; se mantienen HP/daño por tiempo, pools y colisiones. Fórmula de recompensa y cadencias configurables. No se ha medido un equilibrio definitivo.

Las pruebas de navegador nuevas y regresión están preparadas. El entorno actual deniega listen/setsockopt (EPERM) al servidor y a Chromium; intentos con permisos adicionales interrumpidos, no ejecutados. Por tanto, no se heredan como aprobados para0.7.1 los resultados de0.7.0. Verificar mediante CI y posteriormente en teléfonos reales. Se genera el HTML compilado; el candidato nuevo de cicle lateral no se carga en él.


Primera ejecuciónCI0.7.1:29 aprobadas,2 omisiones y3 fallidas en escritorio. Dos agotaron el límite30s en escenarios largos; se amplía solo ese presupuesto a90s, manteniendo las aserciones. La fixture de ocho direcciones podía recorrer más allá del espacio libre mientras esperaba una captura; se limita el desplazamiento por RAF a24px y se conserva la comprobación de pose. Teclado y colisiones siguen cubiertos por sus propias pruebas. Se guardan capturas/trazas como artefacto browser-qa incluso si falla la suite. Pendiente repetirCI; no se declara éxito de esta ejecución.

Resultado de la repeticiónCI (commit aeded263, ejecución41082562805): **32 aprobadas y2 omisiones intencionales**, sin fallos. También correctos instalación, licencias, tipos, núcleo, build y empaquetado; artefactos browser-qa y navegador conservados. Capturas móviles de paso lateral y Whip descargadas y revisadas: se mantiene el sprite detallado y el efecto de Whip representa pierna/sandalia. Es una primera pasada; no demuestra un ciclo final convincente ni el acabado artístico de toda la tripulación. El nuevo candidato lateral sigue sin integrarse. Safari/dispositivos físicos y equilibrio de sesiones humanas pendientes.


## 0.7.2 — regresión de uniones de piernas

La captura del usuario muestra huecos en las rodillas de todos los personajes. Causa: pivote central del lienzo en lugar de rodilla anatómica y traslación del maluc. Se detectan puntos opacos en cada pose, se fija el maluc al cuerpo y se comparte el mismo punto de rodilla entre segmentos, con nueve filas de solapamiento. Una pose no separable o en reposo usa el sprite completo. Caché de articulaciones por textura, sin lecturas por enemigo/frame ni nuevas imágenes.

Tests de núcleo comprueban pivotes alejados de x48, unión de segmentos y raíz inmóvil con giro/escalado, y fallback seguro. Test de navegador preparado sobre los seis atlas, ocho orientaciones, dos fotogramas y extremos de paso: exige opacidad en las rodillas y genera hoja de revisión. Pendiente ejecuciónCI y revisión visual, además del dispositivo real. En CI se amplía el presupuesto de cada escenario a90s por los timeouts intermitentes de renderizado de escritorio; las aserciones mantienen sus límites.


La revisión de alpha también detecta poses de Zoro donde espada o brazo daban un falso punto de maluc. Se exige un camino opaco hasta la rodilla dentro del recorte; de no existir se usa el sprite entero. La nueva prueba de núcleo cubre puntos opacos separados por transparencia. Esta protección se aplica por pose, sin cambiar assets.


CI32013954:32 pruebas aprobadas,2 omisiones y2 fallos en fixtures de animación de escritorio. La regresión nueva de uniones pasa en escritorio y móvil; capturas de los seis actores revisadas sin los cortes de la captura del usuario. La pose se consulta ahora tras actualización explícita de escena mediante un método solo de QA, evitando leer fotogramas antiguos o perder el instante breve de polvo en render por software. Teclado/joystick siguen en sus pruebas independientes. Pendiente repetir la suite; no se declara éxito completo de esta ejecución.


Resultado final CIafcf7136, ejecución41093839441: **34 pruebas aprobadas,2 omisiones intencionales**. Tipos,10 archivos de núcleo, licencias, compilación y empaquetado correctos. Regresión de los seis atlas aprobada en escritorio y móvil, con capturas revisadas: no se observan los cortes de rodilla de la captura del usuario. Alpha real:89 poses articulables y7 protegidas con sprite íntegro (5 de Zoro y2 de Nami). Se mantienen los atlas aprobados; las nuevas ilustraciones experimentales no se cargan. Safari y la comprobación en el teléfono del usuario siguen pendientes.


## 0.8.0 — selección de ranura y básicos

Cambio solicitado: una sola ranura activa, alternativas seleccionables mediante botones/tacto y teclas1–4, grupos con componentes independientes únicamente al seleccionarlos. Tests de núcleo comprueban aprendizaje de Bazooka sin activación simultánea, cambio sin reset de cooldown, cancelación de ráfagas, buffs temporales/constantes, comida persistente y Zoro sin carga al aire ni contra bloqueos. Datos básicos y reducción por nivel verificados. Once archivos de núcleo, tipos y build final aprobados. CI de UI pendiente: ejecución41101703694 en cola sin runner asignado (30/10/2026,17:56UTC); no se declara aprobada la suite de navegador. Netlify confirma deploy-preview-3 publicado. Prueba manual en móvil real y Safari pendiente. Las fixtures antiguas que asumían cuatro ranuras simultáneas ahora equipan explícitamente un grupo o eligen su ranura. No se cambian las piernas ni el guardado.

## 0.9.0 — retrato, berries, cofres y objetos

Luffy usa el recorte frontal del mismo atlas direccional que la tripulación. No se modifican sprites ni movimiento.

Monedas recogibles de algunos enemigos (12%,1 berry), cofres pequeños destructibles con recompensas modestas y grandes por proximidad: candado/círculo de3s, progreso pausado al alejarse y elección de tres objetos. Primer catálogo de8 objetos con seis espacios y tres niveles; límites globales existentes. Cuando no quedan tres mejoras válidas, completar con suministros. No se añaden aún ancla, bolsa de berries, jefes ni entrenamiento nuevo.

Chunks con identidad y posiciones deterministas, sin regeneración de recompensas ni HP al volver; hasta18 cofres en zona activa. Historial ligero de hasta32768 chunks por partida; al agotarlo se dejan de crear cofres nuevos, sin borrar consumidos. La memoria de cofres queda acotada. No son obstáculos sólidos para no cerrar rutas.

Guardado incremental al recoger berries, sin duplicarlas en resultado y compatible con guardados v1 anteriores. Se elimina la antigua recompensa sintética de bajas/tiempo: solo se conservan las berries realmente obtenidas. Se mantienen monedas/entrenamiento previos y la beta de cinco personajes.

Comprobación final: tipos,12 archivos de núcleo (incluido drops) y compilación/empaquetado aprobados. Nuevas pruebas cubren determinismo, descarga/retorno, impactos, apertura/pausa, selección única, límites de objetos, guardado incremental/restauración y drops. Navegador local intentado: servidor Vite denegado con EPERM en5173. Suite preparada para CI, incluyendo retrato frontal, destrucción, apertura/elección táctil y recarga del guardado. No se declara aprobado navegador ni móvil físico/Safari.

Entrega beta: ejecución CI41106931785 iniciada, todavía sin resultado a18:35UTC. No se declara aprobada la suite de navegador. Netlify confirma deploy-preview-4 publicado. Último ajuste: tarjeta del cofre con altura máxima y scroll para móvil horizontal; tipos,12 archivos de núcleo y build repetidos correctamente. Validar círculo/candado y elección en dispositivo físico. UI de moneda/objetos provisional y economía aún sin equilibrar mediante sesiones humanas.

## 0.10.0 — Morgan y telegraphs

Auditoría: no había motor de jefes/arenas/transiciones; se reutilizan movimiento por círculos, colisiones por tiles, FlowField, grid espacial, pools e impactos de las habilidades. Añadido campo de navegación con radio configurable para que Morgan rodee cajas con su tamaño real. No se cambia la caminata ni la selección de ataques.

Pruebas nuevas de núcleo: cinco formas (rectángulo/círculo/cono/línea/arco con hueco), ausencia de daño durante preparación, aviso final, dirección fijada, esquiva antes del impacto, daño único, carga contra cobertura con2s de aturdimiento, avance/colisión de onda, fases y refuerzos limitados, paredes, limpieza al morir, recompensa única, transición sin curar ni reiniciar build, idempotencia del registro y navegación real alrededor de cajas. Simulación de180s recorre las tres fases y los cinco patrones, con máximo5 marines y sin atravesar sólidos; no demuestra equilibrio humano.

Comprobación final: tipos,13 archivos de núcleo y build/empaquetado aprobados. Intento local `npm run test:browser -- --grep Morgan`: servidor de Playwright no puede iniciarse en este entorno; no se declara aprobado. Pruebas de navegador preparadas en escritorio/móvil: entrada/cancelación, barra/fases, capturas de los cinco avisos, victoria registrada y navegación sin curación. CI y revisión de capturas pendientes. Safari y teléfonos físicos pendientes.
