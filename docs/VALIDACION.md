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

Resultado CI del motor/UI (commit374d3039, ejecución41140319189): **42 aprobadas y2 omisiones intencionales**, sin fallos. Morgan pasa entrada/cancelación, aviso, victoria, guardado y navegación tanto en escritorio como en móvil emulado. Capturas de rectángulo, semicírculo, carga, onda y puertas descargadas y revisadas: se ve el área marcada por encima de decoración y actores, sin tapar HP del jugador. Los patrones individuales se fuerzan en una fixture de renderizado (su fase visual puede seguir en1); no representan desbloqueo prematuro en la partida real.

Ajuste final tras revisión: subir25px el pequeño indicador sobre Morgan para que no tape su cara. Actualizados textos antiguos que afirmaban que no había jefes y generalizada la etiqueta de animación del contrato de avisos para futuros jefes. No cambian colisiones, tiempos ni patrones. Tipos,13 archivos de núcleo, build y empaquetado de esta revisión final repetidos y aprobados. El arte de Morgan sigue siendo provisional; queda equilibrar con jugadores humanos y probar Android/iOS físicos/Safari.

## 0.11.0 — cadencia, brazos, buffs y botín

Luffy: intervalos iniciales Pistol0,45s, Gatling2,4s, Bazooka1,6s, Whip1,1s, Balloon6s, Axe2,8s. Mantiene escalado por nivel y límite global/minimo; otros personajes conservan sus valores. Puños visuales anclados a hombros/manos en ocho direcciones y a la posición actual del actor, manteniendo independiente la zona de daño. Balloon no deforma el sprite ni dibuja la burbuja; mantiene protección/reflejo con arcos laterales. Buffs: flechas y etiquetas de color ATK/DEF/VEL/CAD; valores totales respetan topes y cartas explican estadística, porcentaje, duración y modo.

Cofres: un candidato pequeño por cada6 chunks y grande por cada24, independientes y deterministas; densidad esperada≈83% inferior, sin reaparición ni reseteo. Pequeños:2–4berries,2XP y25% de carne curativa15HP. Enemigos normales:10% carne12HP, además de moneda/XP existentes. Grandes:9–15berries y28XP en suelo,22% objeto nuevo directo (sin aumentar niveles de equipado) y3% fruta. Sin cartas propias de cofre ni mejoras directas de estadísticas. XP recogida sí puede provocar una subida de nivel normal. Inventario lleno: compensar intento de objeto con5berries.

Primera fruta funcional: Bomu Bomu, temporal, una activa, aceptación/rechazo y sustitución. Explosión al matar:45% daño,54px y2s de recarga interna para evitar cadenas ilimitadas. No ocupa ataque/objeto, no se guarda y se conserva solo durante la partida/transición. Resto del catálogo de frutas pendiente.

Pruebas de núcleo: densidad por270 chunks, recompensas y no duplicación, curación/topes y10drops en100muestras uniformes, apertura pausada, objeto directo sin mejorar equipado, fruta aceptar/rechazar/reset y explosión limitada, hombros en ocho direcciones y textos de buff. Comprobación final: tipos,14 archivos de núcleo, build y empaquetado aprobados con los iconos/efecto visual finales. Prueba de navegador local intentada pero no arranca servidor. Regresión de botín directo, indicadores, Balloon y decisión táctil de fruta preparada para CI. No se declaran dispositivos físicos/Safari ni equilibrio humano aprobados.

Resultado inicial CI0.11 (commit43cfd417, ejecución41145074701):43 aprobadas,2 omisiones y1 fallo. Los casos nuevos de botín/buffs/Balloon/fruta pasan en ambos formatos. La prueba conjunta de cuatro personajes agotó su presupuesto específico de60s durante el acceso a Gestionar habilidades en escritorio. Se aumenta solo ese escenario a90s, manteniendo aserciones, y se aíslan cofres/XP para que recompensas ajenas no interrumpan la fixture visual. Pendiente repetir CI; no se declara éxito completo.

Ajuste final de alimento: cada carne aporta1XP además de curar. Prueba específica comprueba subida normal si cruza el umbral; no son cartas de cofre. También se limpia CSS del modal antiguo, se actualiza el texto de Balloon y se fija la semilla del test de densidad. El ajuste comida/texto/CSS se comprobó localmente con tipos,14 archivos de pruebas, build y empaquetado antes de perder disponibilidad del entorno. La corrección posterior de fixture/semilla se verifica por CI. El entorno de ejecución dejó de estar disponible; la corrección se prepara a través del repositorio conectado sin afirmar revisión visual de capturas aún no descargadas.

Resultado final de repetición (commit3557e02a, ejecución41146838192): **44 pruebas de navegador aprobadas y2 omisiones intencionales**, sin fallos. Prueba de cuatro personajes:57,5s en escritorio y15,8s en móvil; mantienen sus aserciones. Botín directo/guardado y buffs/Balloon/decisión de fruta aprobados en ambos formatos. También correctos licencias, tipos,14 archivos de pruebas, build y empaquetado. Artefactos browser-qa y navegador disponibles en esa ejecución.

La revisión se integra sin cambios de juego posteriores a la versión probada. Capturas generadas porCI; la descarga/revisión visual manual no se pudo completar porque el entorno local dejó de estar disponible. Validar sensación de cadencia y unión de brazos en teléfonos reales, además del equilibrio del botín. No se afirma prueba física de Android/iOS ni Safari. Tras recuperar el entorno, comprobar sincronización del workspace con main antes de editar: las correcciones finales se aplicaron y validaron directamente en la rama de GitHub.

## 0.12.0 — Balloon, parejas y objeto único

Sincronizada la base con main validado0.11, preservando ajustes locales en ramas archive. No se rehace el proyecto ni el motor de Morgan.

Balloon compone una pose hinchada con torso redondo y cabeza/piernas del atlas existente, sin estirar cara/pies ni dibujar burbuja azul. Ventana inicial0,9s y evolución1,2s; cooldown6s con límites actuales, por lo que no puede mantener inmunidad continua. Durante la ventana ignora contacto, proyectiles y ataques de Morgan. Activación: daño base50% ATK (escala con nivel) y lanzamiento125px/155px evolucionado durante0,3s, colisionando con obstáculos. Morgan recibe daño pero no desplazamiento para no desajustar sus avisos. Inmunidad acaba al expirar o al desequipar la ranura.

Combinación: dos selecciones sobre cartas de ranuras/grupos y la quinta pendiente. Primera selección solo cambia UI; segunda valida capacidad≤4 y aplica de forma atómica. Con dos existentes agrupa y aprende la pendiente en espacio libre; con pendiente+grupo la equipa allí. Recompensa de jefe funciona con menos movimientos y se consume una vez. Conserva niveles, identidad y cooldowns; cancelar/volver no gasta la oportunidad. Detalles conservan consulta de efectos y separación a espacio libre.

Objetos: una ranura, icono propio junto a ataques y consulta al tocarlo. Los ocho objetos actuales tienen miniassets originales. Primer objeto entra directamente; otro aparece en suelo y permite conservar/sustituir. Sustituir elimina el efecto anterior, nunca acumula dos objetos. No se cambia moneda/entrenamiento permanente ni el límite independiente de fruta. Grandes: candidato1/96 chunks, cuatro veces más raro que0.11; apertura de3s y botín conservados.

Pruebas nuevas: inmunidad contacto/proyectiles/Morgan y fin de ventana, daño/lanzamiento respetando sólidos; parejas inválidas sin mutación, pendiente/grupos y recompensa consumida una vez; objeto único y sustitución sin efectos residuales. Pruebas de navegador adaptadas a dos toques y añadidos selección táctil con recompensa de jefe, icono/posición del objeto y conservar/sustituir. Captura de Balloon preparada con pose hinchada. Comprobación final: tipos,15 archivos de pruebas y build/empaquetado aprobados. Navegador local intentado, servidor no disponible en sandbox; CI y revisión de capturas pendientes. Teléfonos físicos/Safari y balance humano no comprobados.

Resultado final CI0.12 (commitd3db076c, ejecución41151748215): **46 pruebas de navegador aprobadas y2 omisiones intencionales**, sin fallos. Licencias, tipos,15 archivos de pruebas, build y empaquetado correctos. Pareja táctil con recompensa, elección de objeto/conservar/sustituir y Balloon pasan en escritorio y móvil emulado. Capturas descargadas y revisadas: pose redonda sin burbuja externa, segundo paso con solo las cartas restantes e icono de objeto junto a las cuatro ranuras, dentro del ancho móvil. Las fixtures fuerzan la pose y recompensas para comprobar integración; no acreditan equilibrio humano. Actualizada la guía para retirar instrucciones obsoletas de seis objetos y cartas de cofre. Teléfonos Android/iOS físicos, Safari y sensación final de inflación/empenta pendientes de prueba humana.

## 0.13.0 — carta de Morgan, travesía y reintentos

Decisión nueva del usuario: sustituir acceso por botón y embarque manual tras Morgan. Primera oportunidad desde300s con demora aleatoria0–45s; una carta activa, sobre suelo transitable y alcanzable, nunca sobre el actor. Recoger por proximidad inicia3s de barco sin reloj/combate ni entrada; pausar/interrumpir/rotar conserva la travesía. Carta ignorada90s o alejada>1200px programa otra; tras derrota se esperan45–90s. Datos en content/navigation.ts.

Perder en Morgan cancela avisos/refuerzos/proyectiles y devuelve al mismo Shells Town con25HP y2,5s de gracia. No hay resultado de derrota ni reinicio de build/moneda/cofres. Nuevo encuentro recupera toda la vida de Morgan. Muerte normal explorando sigue terminando la partida. Victoria: caída1,3s, recompensa única de combinación y barco automático a Orange Town conservando vida/build. Orange Town recibe catálogo propio de piratas básicos/tiradores/resistentes, XP propia y presión temporal local a la isla; no se implementa aún Buggy.

Nuevas pruebas de núcleo: límite05:00, demoras, alcance/solidez/recogida y reaparición de carta, pausa de travesía, conservación de build/HP, derrota con25HP y reintento, victoria automática, enemigos de Orange y derrota normal. Tipos y16 archivos de pruebas pasan. Navegador local intentado: servidor Vite no disponible en sandbox. Suite adaptada a cartas y añadidos viaje pausable/derrota/reintento en escritorio y móvil emulado; CI, revisión de capturas y build final pendientes. No se afirman pruebas físicas de Android/iOS, Safari ni equilibrio humano.

Compilación y empaquetado finales0.13 completados: HTML autónomo4,65MiB, sin recursos remotos nuevos. Tipos y16 archivos de pruebas repetidos correctamente sobre los assets finales. Pendientes los resultados de CI de navegador y su revisión visual.

Resultado final CI0.13 (commit5e32594f, ejecución41158539588): **48 pruebas de navegador aprobadas y2 omisiones intencionales**, sin fallos. Licencias, tipos,16 archivos de pruebas, build y empaquetado correctos. Pasan carta/viaje/pausa/derrota/reintento y victoria automática tanto en escritorio como en móvil emulado. Capturas descargadas y revisadas: carta visible en suelo, travesía dentro del viewport horizontal y llegada cálida a Orange; en escritorio se observan los piratas con variante de color/rayas sin modificar las piernas del atlas. La captura móvil de llegada se tomó antes de que los enemigos alcanzasen el encuadre; su generación está comprobada por las aserciones. Se acelera el reloj de la fixture para probar05:00, no se acredita una sesión humana de cinco minutos ni equilibrio. Dispositivos físicos Android/iOS, Safari y sensación de dificultad siguen pendientes.

## 0.14.0 — Buggy y segundo tramo de campaña

Extraído `PatternEncounter` del controlador de Morgan, que mantiene su envoltorio/API y datos. Perfiles con nombre/arte/radio/patrones/refuerzos configurables. Buggy añade zonas sobre objetivo fijo, multi-zona sin multigolpe, cobertura para explosiones y recomposición en destino transitable con trayecto libre. Arena propia con coberturas laterales, seis movimientos y fases65/30. Cuchillas usan corredor móvil y la misma geometría anunciada.

Ruta independiente desde300s de Orange, conservando cartas/travesía/pausa anteriores. Derrota vuelve al mismo Orange con25HP y build intacta; victoria da combinación/registro local único y navega a Syrup provisional sin curar. Cofres separados por isla, con historial conservado al reintentar. Syrup aporta dos enemigos provisionales; Kuro no implementado. Guardado v1 compatible con campos opcionales de Buggy. Sin cambios de caminata, monetización ni backend.

Tipos y17 archivos de pruebas de núcleo aprobados. Pruebas nuevas: bomba fijada/esquiva/cobertura, recorrido de cuchillas, recomposición sin atravesar cajas, tres zonas reales/impacto único/limpieza, derrota-reintento/victoria sin curar, conservación de mundo/cofres/build y simulación de150s con seis patrones/3fases/refuerzos limitados. Registro de Buggy idempotente/restaurado. Prueba de navegador local intentada; servidor no disponible en sandbox. Dos escenarios nuevos por formato para carta/patrones/victoria/guardado y derrota/reintento. CI, capturas y compilación final pendientes. No se afirman dispositivos físicos/Safari ni equilibrio humano aprobados.

Compilación y empaquetado finales completados con los gráficos definitivos de esta beta: HTML autónomo4,66MiB (2719KiB gzip), sin CDN. Tipos y17 archivos de pruebas repetidos correctamente. Pendientes resultados de navegadorCI y revisión visual.

Resultado final CI0.14 (commitc93d5ea4, ejecución41172763737): **52 pruebas de navegador aprobadas y2 omisiones intencionales**, sin fallos. Licencias, tipos,17 archivos de pruebas, build y empaquetado correctos. Pasan los casos nuevos de Buggy/carta/avisos/victoria/guardado y derrota con retorno a Orange en escritorio y móvil emulado, además de la regresión de Morgan y sistemas previos.

Capturas de cuchillas, bomba, recomposición y bombardeo descargadas/revisadas: zonas visibles dentro de la arena, tres círculos anunciados y HUD de Buggy/fase sin ocultar la vida del jugador. La fixture salta cinco minutos de reloj local en dos pasos: su aviso textual previo de Morgan permanece temporalmente sobre el torso del jefe en la captura; en juego normal caduca a los8s de Orange antes de los300s requeridos para su carta. No se afirma una sesión humana de campaña ni arte final: Buggy es provisional y requiere polimento visual/equilibrio. Teléfonos físicos Android/iOS y Safari pendientes.

## 0.15.0 — calidad, uniones y entrenamiento

Nueva decisión: con cuatro ranuras ocupadas, cartas solo de pasivas; se rechaza quinta habilidad y no concede unión. Unir exige objeto temporal de jefe, contado en HUD; no ocupa objeto de equipo. Pareja conserva cooldowns/niveles y consume uno. El motor de16 componentes se conserva a bajo nivel, sin ofrecer aprendizajes ilegales. Cards/fixtures anteriores se migran a esta regla, sin omitir comprobaciones de carga/evolución.

34 iconos individuales propios y buffs en marco común; puños/puntadas se dibujan desde posición actual, con hombro afectado por pose; Whip pierde rectángulo azul. Axe queda unido al actor en su impacto. Zapato negro en patadas físicas. Proyectiles hostiles destacados y aviso de daño solo si baja HP. Hurtbox sigue en cuerpo/pies14px, nunca en extremidades extendidas. Radio105/Nami120, comida atraída con segmento libre, muslo de ave, barriles1/3 y grandes1/32 sin regenerar historial.

Entrenamiento por personaje/estadística en datos separados, única vía permanente de poder. Nivel visible suma compras+1, costes progresivos/máximos, starter/repertorio/vetos/cambios de cartas. Migración de niveles antiguos de Luffy a Vitalidad(+8HP), monedas/récords conservados. Sin acceso activo al antiguo+5HP. Boni XP/berries al recoger; monedas fraccionarias se acumulan en partida y guardan enteras sin duplicación. Persistencia valida perfiles/niveles/opciones; efectos sujetos a topes existentes. Costes iniciales25–100 por estadística; elecciones iniciales150 y repertorio400, provisionales.

Tipos y18 archivos de pruebas de núcleo aprobados. Pruebas específicas: migración/restauración/compras por personaje/coste/límite, rechazar perfil inválido, configuración inicial/veto/cambios, XP/berries sin duplicado, inmunidad de extremidad ofensiva y daño real contacto/proyectil, atracción de comida, uniones solo por recompensa y cartas llenas pasivas. Navegador local intentado, servidor no disponible en sandbox. Añadidas pruebas de entrenamiento/configuración/recarga y galería34 iconos/botín; adaptadas las de reglas antiguas. Compilación final, CI y capturas pendientes. No se afirman teléfonos físicos/Safari ni equilibrio humano.

Compilación y empaquetado finales0.15 aprobados con los assets finales: HTML autónomo4,68MiB (2723KiB gzip), sin CDN. Tipos y18 archivos de pruebas repetidos correctamente. Pendientes los resultados de navegadorCI y la revisión visual de capturas antes de integrar.

Primera regresiónCI0.15 (commit4e76ee51, ejecución41175446584):56 pruebas de navegador aprobadas y2 omisiones intencionales, licencias/tipos/18 archivos/build correctos. Se corrigió antes la fixture visual para que la pausa no tapara los assets. Capturas descargadas y revisadas: barril/cofre/muslo/proyectil y34 iconos visibles. Revisión del entrenamiento detecta segmentos demasiado próximos al botón en móvil y Volver ocupando una fila completa. Se corrige a columnas fijas/contenido flexible y segmentos contenidos, con comprobación geométrica nueva y captura vertical. También se diferencian más las cinco puntadas de Sanji y su icono de cocina. Tipos/18 archivos/build locales repetidos correctamente; pendiente repetir navegador y revisar estas capturas finales. No se integra todavía la revisión sin esa comprobación.

Resultado final de repetición0.15 (commite2659c3b, ejecución41177139814): **56 pruebas de navegador aprobadas y2 omisiones intencionales**, sin fallos. Licencias, tipos,18 archivos de pruebas, build y empaquetado correctos. Pasan las comprobaciones geométricas de segmentos/botón y de icono/título de cartas, además del entrenamiento/configuración/recarga, cuatro ranuras solo pasivas, objetos de unión y regresión de Morgan/Buggy.

Capturas finales descargadas y revisadas: entrenamiento horizontal y vertical dentro del viewport, encabezado compacto y segmentos contenidos; cartas de buff legibles sin solapar imagen/texto;34 iconos distintos, incluidas cinco puntadas de Sanji y cocina revisadas. Barril/cofre/muslo/proyectil y Whip sin punto azul revisados en la primera regresión, con lógica idéntica en la entrega final. Los fondos/saldos/niveles de las fixtures se fuerzan para comprobar interfaz, no demuestran equilibrio ni una sesión humana. Pendiente probar sensación de golpes/lectura de trets en teléfono físico y Safari, además de ajustar costes/densidades con partidas reales. Se integra el mismo código validado, sin nuevos cambios funcionales posteriores.

## Beta0.16 · Identidad visual y distribución de Orange Town

Cambios: arte original de Morgan/brazo, Buggy/cuchillos, navegación con esfera, tres atlas propios de piratas y recursos de Orange Town. Generador específico con cuatro barrios, sin modificar el generador de Shells Town. Misma simulación, daños, tiempos, navegación, progreso y guardado.

TypeScript y18 archivos de pruebas de núcleo aprobados. Nuevas comprobaciones de Orange Town:81 chunks en coordenadas positivas/negativas con celdas caminables conectadas, obstáculos sólidos, cuatro barrios y tipos de recurso propios, calles que cruzan límites, caché acotada y regeneración determinista. Adaptada la comprobación antigua que exigía el mismo visual para todos los piratas; ahora exige tres visuales distintos. Navegador local no disponible por restricciones del servidor/Chromium del entorno; pendientes CI, capturas y revisión visual antes de integrar.

## Beta0.17 · Referencia del jugador, cartas y comida

Regla corregida: cuatro ranuras impiden nuevos aprendizajes, pero permiten mejorar ataques conocidos hasta nivel6/+; cartas máximas excluidas y quinta habilidad rechazada también al seleccionar. Se mantiene la unión por recompensa de jefe.

Escenarios: recursos costeros originales, materiales de adoquín/tierra/hierba/mar, base naval en el inicio de Shells Town, puertos deterministas con agua sólida y pasarelas estrechas, barcos decorativos, ferias/mercados de Orange Town, proporciones de sprites conservadas. Ilustraciones específicas de los seis ataques de Luffy en HUD/cartas. Carne con hueso blanco visible. Máscaras separadas para caminar y línea de tiro sobre agua, manteniendo cobertura de edificios/barcos y la restricción de cargas/desplazamientos físicos.

Tipos y120 pruebas de núcleo aprobadas; incluyen acceso al muelle, agua sólida, conexión de pasarelas en coordenadas negativas, tiro sobre agua y cobertura. La conectividad usa la primera celda caminable como origen de búsqueda porque el mar puede ocupar la esquina del chunk. Licencias de19 paquetes y compilación verificadas. El entorno ya permite Chromium local: primera comprobación de cartas en escritorio/móvil emulado2/2; capturas de referencia y Orange Town4/4. Se detectaron cuadrícula del suelo, proporciones de carpa y falta de contraste; revisados antes de la regresión completa. Capturas finales revisadas: edificios detallados, carpa sin estirar, ilustraciones y hueso blanco legibles. Pendiente registrar la regresión completa final. No se afirman pruebas de teléfonos físicos, Safari, FPS reales o equilibrio humano.

Resultado de regresión completa0.17: GitHub Actions41184557882, job124488687858, commit040130b126954710cda05958e5492e7d27340c25: **120 pruebas de núcleo y60 de navegador aprobadas,2 omisiones intencionales**, licencias/tipos/build/paquete correctos. La primera ejecución local encontró dos expectativas antiguas de «solo pasivas»; se corrigieron para exigir mejoras de ataques aprendidos, sin quinta habilidad y excluyendo técnicas ya evolucionadas. La repetición completaCI con esa corrección terminó sin fallos.

Último ajuste de legibilidad: mayor opacidad de preparación/aviso final y contorno de los telegraphs sobre el suelo texturizado, sin cambiar geometría, tiempos o daño. Tras ese ajuste, tipos/120 pruebas/build repetidos localmente y **6/6 pruebas de navegador** en escritorio/móvil emulado: cuatro ataques/evolución/reinicio, los cinco patrones de Morgan y capturas costeras/ilustraciones/comida. Captura de Morgan revisada: rectángulo rojo y contorno destacados por encima del escenario. HTML autónomo5,08MiB, sin CDN. Se integra esta revisión final; el workflow de main repetirá sus comprobaciones automáticamente. Safari y móviles físicos, FPS y equilibrio de partidas reales siguen pendientes.

## Arena naval de Morgan

Arena ampliada2560×1792, conservando el zoom de exploración, seguimiento exponencial en coordenadas globales y cámara limitada a sus bordes. Buggy conserva su arena original768×512 y su cámara anterior explícitamente. HUD, datos de ataques, fases, daño y recompensas sin cambios. Piezas navales originales, coberturas físicas y elementos ornamentales sin colisión. Spawn de refuerzos separado de las torres.

Primera verificación: tipos y120 pruebas anteriores aprobados; nueva prueba pura de seguimiento/límites y pruebas de navegador para igualdad exacta de zoom, desplazamiento suave, límites, coberturas y capturas de centro/puerta/esquina. Los cinco patrones de Morgan y la cámara pasan en escritorio y móvil emulado4/4. La revisión visual detectó suelo demasiado geométrico y puerta recortada: se corrigen antes de entregar. No se han probado teléfonos físicos ni Safari.

Entrega beta0.18: tipos,122 pruebas de núcleo y compilación aprobados. Regresión relevante8/8 en Chromium escritorio/móvil emulado: viaje a Morgan/victoria, los cinco patrones, nueva cámara naval y combate/transición de Buggy sin cambios. Incluye prueba de conectividad de todas las celdas transitables del patio. Capturas de centro, puerta y esquina revisadas; material gris original sustituye la cuadrícula provisional. Se añade comprobación explícita de que la arena supera el viewport a su zoom de exploración. No se han medido FPS ni probado Safari/teléfonos físicos. HUD y contenido de Orange Town sin cambios.

## Recompensa de unión tras Morgan

Causa: la victoria entregaba un token, pero el bloque de derrota iniciaba el viaje automático sin abrir el menú. Ahora, tras la animación de derrota, Morgan abre el menú existente como recompensa y espera la unión o Continuar. Finalizar/cancelar esta pantalla inicia el viaje; no vuelve a ofrecerse al reanudar. Una sola habilidad permite continuar conservándola. No cambia la arena, mapas, cámara, patrones ni recompensas económicas.

125 pruebas de núcleo aprobadas: unión Pistol/Gatling con nivel6/4, cooldowns conservados, viaje sin perder build, mejora posterior, buff Frenesí constante y ausencia de duplicados, reinicio y caso de una habilidad. Se excluye del snapshot el identificador del objetivo muerto, que se limpia correctamente al viajar. Compilación aprobada. Prueba de navegador añadida para la selección en dos pasos y HUD combinado tras viajar; adaptada la regresión antigua que esperaba el viaje sin pantalla de recompensa.

Resultado navegador:4/4 casos aprobados en Chromium escritorio/móvil emulado (60s): flujo de victoria y pantalla de recompensa, unión real en dos pasos, niveles conservados, viaje y dos componentes visibles en el HUD. Tipos y compilación finales aprobados. Sin cambios en arena, mapas o cámara. Pendiente solo la validación en dispositivos físicos/Safari.

## Animación de enemigos · beta0.18

Reutilizado ActorAnimation por entidad: cuatro pasos reales por desplazamiento, no bobbing como sustituto. Piratas con ocho orientaciones y pose de ataque diferenciada por arma; ataque orientado al blanco, respiración en reposo y reacción a daño. Muerte mediante32 efectos visuales reciclados independientes de las entidades físicas, con caída/desvanecimiento; cola limitada a32 y limpiada en transiciones. No retrasa botín ni reutilización de enemigos.

Morgan usa cuatro pasos en dos orientaciones, poses de preparación/impacto/escombrada/carga/daño y dos etapas de derrota antes de la recompensa existente. Selección visual basada en estado y reloj del encuentro, sin modificar IA, avisos, hitboxes, daño, velocidades o duración de fases. Los sprites no se invierten horizontalmente; el brazo se ancla al hombro correspondiente al cambiar de orientación. No se cambian arena/cámara/habilidades/cofres/progresión.

125 pruebas de núcleo y compilación aprobadas. Regresión navegador6/6: cinco patrones de Morgan, Orange Town y unión de recompensa/viaje, en escritorio y móvil emulado. Prueba adicional2/2 verifica cuatro claves de textura distintas durante desplazamiento y poses de daño/rodillas/caída de Morgan. Captura de caída revisada. No se afirman mediciones de FPS ni pruebas en móviles físicos/Safari. Morgan todavía no tiene ciclos completos en ocho orientaciones; son dos ciclos oblicuos, sin reflejar el sprite. Las muertes de piratas usan pose de acción con caída/desvanecimiento visual, sin una hoja de muerte adicional.

## Preparación de GitHub Pages

Vite acepta PAGES_BASE_PATH y conserva la base relativa fuera de Pages. Workflow de main con instalación, tipos, pruebas, licencias, build, comprobación de distribución bajo /Piratesurvivor/ y publicación exclusiva de dist mediante OIDC. Netlify intacto, sin activar Pages ni cambiar visibilidad del repositorio. Pasos manuales y limitaciones de planes en docs/GITHUB_PAGES.md.

Compilación con la base real y prueba de producción bajo subdirectorio aprobadas: escritorio y móvil horizontal, cinco personajes/atlas diferidos, inicio y pausa, sin errores404/JS ni hook QA expuesto. No hay audio en el proyecto. Tipos y125 pruebas de núcleo aprobados. Animaciones pendientes recuperadas y verificadas:6/6 pruebas de navegador para patrones de Morgan, recompensa/unión/viaje y cuatro pasos reales/poses de daño y caída, en ambos perfiles. No se cambian reglas de juego ni diseño en la configuración de Pages; se incluyen los cambios visuales anteriores ya autorizados.

Revisión de credenciales:690 blobs de texto históricos,0 coincidencias de patrones de alta confianza,0 objetos históricos pendientes. No hay .env versionados. Publicación efectiva de Pages pendiente de configuración manual y disponibilidad en el plan GitHub; no se afirma que la URL pública esté activa. Safari/móviles físicos no probados.

Comprobación remota final: GitHub informa private=false, default_branch=main y has_pages=false. El repositorio ya figuraba público; no se ha cambiado su visibilidad ni activado Pages. La revisión final posterior a preparar los commits examinó707 blobs de texto, sin coincidencias de credenciales de alta confianza.

## Beta0.18 · diez objetos de cofres con PNG original (2026-10-31)

Sustituye los estados históricos de ocho objetos y botín automático. Extraído el PNG RGBA original del ZIP suministrado; transparencia real, diez recortes96×96 con vecino más cercano, sin redibujo. Galería inspeccionada y hashes comprobados automáticamente.

- `npm run check`: correcto.
- `npm test`:133/133. Añadidos casos para magnitudes, máximo3, reemplazo sin acumulación, HP incremental, curación cada5s, multiplicadores efectivos de recogida, explosión con cooldown/sin cadenas/daño efectivo, resistencia de boss, robo de vida sin overkill y con presupuesto/penalización de área. Viaje real tras Morgan conserva objeto; nueva partida lo elimina. Cofre grande3s pausa y entrega exactamente un objeto; pequeños siguen sin especiales y el historial impide reabrir.
- Navegador Chromium, escritorio y móvil emulado horizontal: galerías de los diez sprites, cofre real, modal, equipar/mejorar/máximo/conservar/cambiar, indicador junto a ataques y combinación en dos toques. Prueba de regresión de Morgan/viaje ejecutada también. En una ejecución conjunta la entrada móvil al boss no mostró su panel a tiempo; la repetición aislada pasó. No se alteraron arena, cámara ni animaciones para ocultar esa incidencia.
- Build de producción con `PAGES_BASE_PATH=/Piratesurvivor/` y smoke de Pages: correcto en escritorio/móvil, imports de cinco personajes, inicio/pausa, sin404, errores JS ni hook QA.
- `npm run licenses`:19 paquetes verificados. Recursos suministrados registrados por separado, sin atribuirles licencia MIT.

Pendiente: equilibrio durante partidas largas y validación en Android/iOS físicos (no se han medido FPS ni probado Safari real). El bundle principal conserva el aviso de tamaño de Vite; esta tarea no cambia la estrategia de carga ni el motor. El aturdimiento resistente del objeto solo interrumpe aproximación del boss, sin cancelar patrones ya anunciados. No hay ejecutor ofensivo de daño periódico todavía; al incorporarlo deberá utilizar el indicador de área/periódico para reducir el robo de vida.

Repetición final conjunta sin modificar fuentes durante la ejecución:8/8 pruebas de navegador seleccionadas, incluidos Morgan y cofres tanto en escritorio como en móvil emulado.

Ajuste final del modal en horizontal: composición compacta con dos columnas para sprite/descripción y botones de44px, reinicio del desplazamiento al abrir. Prueba específica repetida:2/2, comprobando además que la ventana cabe dentro del viewport. Fixture corregida para crear un cofre de prueba cuando la semilla aleatoria de inicio no contiene ninguno; no se aumenta la densidad del juego. Compilación/smoke repetidos después del ajuste.

## Beta0.18 · tarea5, HUD compacto (2026-10-31)

Cambio exclusivamente de presentación: `index.html`, importación en `src/main.ts`, `src/ui/view.ts` y nueva hoja aislada `src/ui/hud.css`. No se modifica ningún archivo de simulación, habilidades, enemigos, colisiones, mapas, recompensas ni persistencia.

Retrato/nombre/nivel/HP/berries/XP agrupados; reloj MM:SS sin caja ni texto permanente; pausa44×44 independiente; ruta previa a Morgan oculta mientras no hay carta (la carta contextual sigue visible). Cuatro ranuras con arte existente, selección original, nombres/niveles accesibles pero sin etiquetas visibles; estrellas SVG plateadas1–5 y una dorada al6. Combinaciones conservan icono y estrellas de cada componente, hasta cuatro por ranura. Indicador de objeto con icono y nivel solo si está equipado. Menús y sus eventos no se cambian.

Pruebas de la tarea:
- Tipos y133 pruebas de lógica: correctos.
- Prueba específica del HUD: tamaños1440,1024,844,667 y568px; exploración, Morgan, niveles1/5/6, cuatro componentes en una ranura, objeto, selección y pausa. Verifica límites, objetivo táctil44px, separación entre reloj/barra del boss, controles y joystick; capturas inspeccionadas. También se cubre568×320 en la comprobación final.
- Regresiones de navegador seleccionadas: joystick, selección de ranura, cartas/evolución, HP/XP, buffs/fruta, objetos y unión de habilidades. Resultados finales registrados al completar la ejecución.
- Compilación de producción y carga bajo `/Piratesurvivor/`: comprobadas con el smoke existente; no se cambian rutas ni recursos.

Pendiente: Safari/iOS y Android físicos, notch real y preferencias de ampliación del sistema. Se simulan viewport y entrada táctil con Chromium; no equivale a una medición de rendimiento en un teléfono. En pantallas estrechas la barra del boss pasa debajo de la información superior, manteniendo libre el centro; las cuatro habilidades agrupadas usan iconos más pequeños que las ranuras individuales. Las ayudas de nombre/efecto siguen disponibles en gestión de habilidades y accesibilidad.

Resultado final de navegador:17 pruebas superadas y1 omitida (joystick táctil en el proyecto de escritorio, por diseño); cero fallos. Incluye las cinco proporciones del HUD y568×320. `npm run build` y smoke de producción: correctos; se conserva el aviso previo de tamaño del bundle. Capturas de exploración844px y arena de Morgan1440/844/568px revisadas. No se han medido FPS ni probado dispositivos físicos.

## Beta0.18 · tarea6: Buggy completo y refuerzos de Morgan (2026-10-31)

Se sustituye el Buggy provisional de corredores/barrido/teletransporte por seis patrones propios, partes independientes, cuchillos/bombas/lluvia y tres fases66/33. Controlador/renderizador separados; se conservan interfaces, guardias, colisión, transición, progresión y HUD. Arena2816×2048, cámara de seguimiento sin zoom extra y arte modular; sin edificios navales. Morgan:3072×2176, seis refuerzos por llamada, límite12 y entrada ambiental desde primera fase; patrones intactos.

- `npm run check` y `npm test`:142/142 correctas. Incluyen daño solo al llegar/explotar, destino fijado, cobertura, cantidades/velocidades por fase, cuerpo sin teletransporte, cabeza aturdida por pared, limpieza, pausa, geometría sólida, refuerzos que llegan al jugador y límites. Compatibilidad de Balloon+ reflejando un cuchillo hasta derrotar a Buggy con recompensa normal; esquers absorbiendo y guardia/contraataque existente.
- Navegador Chromium en PC/móvil emulado: pasada conjunta de10 casos (Morgan, HUD, entrada/victoria/derrota de Buggy y los seis patrones), seguida de6 casos tras integrar defensas; sin fallos. Capturas de los avisos/impactos, poses, partes y arena inspeccionadas. Comprobación de zoom igual al de exploración y animación con al menos tres poses distintas al caminar. Sprite/atlas final indexado y568×320 se vuelven a comprobar al cerrar la tarea.
- Se conserva Syrup provisional, la derrota con25HP/build intacta, el guardado idempotente de victoria y la recompensa de unión existente. No se inventan recompensas nuevas ni se desarrolla Kuro.

Pendiente: equilibrio mediante partidas humanas (HP/daño/cadencia configurables), Android/iOS y Safari físicos, notch real y medición de FPS. Las pruebas emuladas no certifican rendimiento en teléfonos reales. No se ha cambiado ninguna habilidad, objeto, entrenamiento ni economía permanente.

Cierre de tarea6:142/142 pruebas de lógica; repetición final2/2 de los seis patrones en navegador tras optimizar PNG y ajustar persecución. Regresiones anteriores10/10 y6/6 (PC/móvil). El boss cierra distancia antes de disparar en vez de permanecer atacando fuera de alcance. Comprobados viewport568×320, transparencia/paleta, cuerpo/cabeza/manos y banderas. `npm run build`, licencias19 paquetes y smoke `/Piratesurvivor/`: correctos. Nuevos PNG aproximadamente96KiB en disco. El bundle conserva el aviso previo de tamaño; sin medición de FPS en teléfonos físicos.

## Rediseño del entrenamiento permanente (2026-10-31)

Cambios de representación en `src/ui/training.ts`, nuevo catálogo visual `training-art.ts` y hoja aislada `training.css`, importada desde main. Trece PNG originales del ZIP, sin alterar bytes/alfa, y catorce tarjetas; Starter/Repertorio comparten imagen. Ranuras vacías gris oscuro/contorno metálico y compradas doradas, con igual altura/separación y sin reglas por estadística. Tarjetas azul marino, contorno dorado, iconos proporcionados y compra44px. No se cambian catálogo de precios/bonificaciones, límites, métodos de compra, almacenamiento ni configuración de ataques/veto.

Validación realizada:
- `npm run check`, `npm test`:142/142 y compilación correctos.
- Chromium PC/móvil:4/4 pruebas de entrenamiento. Verificados14 iconos,13 fuentes únicas512px, recurso compartido,10 segmentos dorados al máximo, colores uniformes y geometría sin solapamiento en1440/844/390/320px. Capturas inspeccionadas.
- Compra real de Vitalidad3→4 por95 berries, saldo1000→905 y conservación tras recargar. Regresión de configuración inicial/Gatling+Whip, veto y mejoras independientes por personaje correcta.
- Smoke de producción bajo `/Piratesurvivor/`:las14 tarjetas cargan los13 PNG y los cinco personajes; sin404 ni errores JS. Capturas de producción1440/844px guardadas durante la validación. QA ausente de producción.
- Registro de procedencia/licencias actualizado; sin dependencias nuevas.

Pendiente: validación en Safari/Android físicos. Esta tarea no modifica el renderizador ni resuelve por sí sola la incidencia visual del mapa reportada previamente, aún pendiente de reproducir con el navegador/URL afectados.

## Ajuste parcial de cofres24 (2026-10-31)

Candidato grande cada24 chunks; pequeño cada3. Sin cambios en ubicación libre, recompensas ni apertura3s. En `battle.ts` el cofre accesible por distancia/segmento libre se eleva sobre decoración colgante y restaura explícitamente opacidad/crop; el resto conserva profundidad por pies. Esto aborda ocultación por capas, sin acreditar que explique todos los casos reportados de transparencia.

Tipos,142 pruebas de lógica y build correctos. Pruebas de navegador de cofres/objetos ejecutadas en escritorio y móvil emulado; no se afirma reproducción exacta del caso transparente del usuario. Pendientes: animación de apertura, revisión de atlas de piratas y tres marines diferenciados. No se han publicado estos cambios parciales.

## Piratas: retalles y alineación (2026-10-31)

Confirmado visualmente en atlas anteriores:fragmentos vecinos en espadachín/fusilero; pesado de4 filas procesado como5, cortando figuras y mezclando ataques con pasos. Se reconstruyen los tres PNG desde sus originales, sin sustituir diseños; celdas128 con margen, pies120, escala común. Cargador parametrizado por celda para estos tres actores; los demás conservan96. Origen de pies actualizado en representación y muerte. No cambian IA, estadísticas ni ataques.

142 pruebas de lógica y comprobación de tipos correctas. Navegador:movimiento de los tres piratas en ocho direcciones, cuatro pasos, reposo, pose de ataque, reacción de daño y caída. Capturas de PC/móvil emulado; no se afirma prueba en teléfonos físicos. Compilación y smoke de Pages se ejecutan al cerrar. Los cambios previos de cofres24 y elevación al estar accesibles se conservan; los nuevos marines siguen pendientes.

Cierre de piratas:2/2 pruebas de navegador superadas con capturas de movimiento/ataque/daño/reposo/caída. Atlas revisados visualmente y margen mínimo4px tras corregir el pesado. Build y smoke bajo `/Piratesurvivor/` correctos, sin404 ni errores JS. Se publica junto al ajuste de cofres24 ya comprobado en4 pruebas de navegador; no se presenta el conjunto de marines nuevos como terminado.

## Tres marines diferenciados y veterano progresivo (2026-10-31)

Se sustituye la duplicación por tinte de los marines normales de Shells Town por tres atlas de armas/siluetas propias. Espadachín conserva contacto y muestra preparación/tajo; fusilero mantiene215px aproximadamente, prepara0,55s y dispara una bala; veterano busca135px aproximadamente, prepara0,9s con rumbo fijado y dispara cinco perdigones en0,7rad. El ventall tiene vida1,3s a175px/s; todos usan las colisiones y pool de96 proyectiles existentes. Aturdimiento, confusión, lanzamiento o pérdida de línea de tiro cancelan la preparación. Se limpia el estado al reciclar entidades, incluidos refuerzos.

Vida base normal32, veterano44,8 (×1,4); ambos reciben el escalado temporal existente. Distribución de nuevos enemigos: veteranos0% antes60s,5% desde60s,10% desde120s,15% desde180s,20% desde240s. El resto se reparte60:40 entre espada/fusil: a partir240s,48%/32%/20%. No cambian cadencia, cap150, oleadas ni estadísticas de Morgan. Las recompensas existentes de espada/fusil y las de Orange Town no cambian. El veterano nuevo tiene XP9 configurado en catálogo.

Comprobaciones:147 tests de lógica pasan, incluido disparo del veterano en Run, espera sin proyectiles, rumbo fijo, cancelación, cinco perdigones, límite de pool y probabilidades exactas por tramos. La prueba de dificultad fija la elección del tipo para comparar el mismo marine a distintas edades, sin mezclar diferencias de arquetipo con el escalado.

Navegador:8/8 pruebas (PC y móvil emulado) para Morgan5 patrones, Buggy6 patrones, piratas de Orange y nuevos marines. Tras pulir los píxeles/escala de los marines,2/2 pruebas visuales adicionales de sus cuatro pasos, preparación, ataque, daño y caída. Revisados atlas y capturas reales;192 celdas comprobadas con alpha/margen y sin celdas vacías. El primer pase de Buggy en escritorio agotó30s durante una captura mientras compilaba en paralelo; repetido aisladamente con límite60s, pasa sin cambiar el boss. Las diagonales comparten orientación lateral y las poses de ataque son frontales/perfil; no se acredita dibujo independiente de todas las direcciones.

Pendiente de la validación del usuario: sensación de las animaciones y dificultad en teléfono físico. No se han medido FPS en hardware móvil ni probado Safari real. El guardado permanente, HUD, mapas y habilidades no se modifican.

Cierre: comprobación de tipos,147 tests y build de producción correctos. Smoke de producción bajo `/Piratesurvivor/` en escritorio/móvil emulado sin404, errores JS ni hook QA. Repetición final2/2 con marcha continua real a66px/s y registro de las texturas renderizadas durante todo el ciclo (el muestreo puntual entre capturas podía saltarse una pose). Inspeccionadas capturas de esta marcha y de preparación; PNG nuevos con transparencia y márgenes comprobados. Se conserva el aviso preexistente de Vite por tamaño del bundle; no se han añadido dependencias.

## Marcha de marines: rodillas y orientación (2026-10-31)

Causas: los pasos3–4 reflejaban únicamente el segmento inferior de las piernas, rompiendo su continuidad anatómica. Además, todas las direcciones compartían un reposo frontal, y la selección instantánea de rumbo oscilaba cerca de diagonales al corregir la trayectoria.

Corrección: fotogramas completos de marcha sin transformaciones de extremidades; reposo en el mismo perfil del paso de apoyo; eje corporal centrado por casco; escala fija sin estirar/inclinar el cuerpo al caminar. Solo para marines se usa orientación cardinal con margen angular y confirmación de giro durante0,1s/3px, evitando micro inversiones. El desplazamiento real sigue admitiendo ocho direcciones y no se cambia IA, daño, spawn, vida ni recompensas. Jugadores y piratas conservan su selector de animación anterior. Se conservaron los píxeles de las tres filas de acciones/muerte de cada atlas.

Tipos y148 pruebas unitarias correctos, incluida retención de rumbo ante diagonales/micro retrocesos, giro sostenido y reposo. Navegador4/4: nuevos marines y piratas de Orange, en PC y móvil emulado. Se capturan marcha continua, reposo hacia este/oeste/norte/sur, preparación, ataque, daño y caída. Las192 celdas tienen contenido y margen; el reposo coincide con el paso de apoyo de su propia dirección. Atlas y capturas inspeccionados visualmente. No se acredita prueba en teléfono físico.

Se detectó además un fallo de la CI anterior en la prueba visual de cuatro ataques evolucionados: Pistol conservaba un cooldown del bucle real y la fixture avanzaba solo un tick. Se inicializa explícitamente el estado de esos ataques al comienzo de la fixture; no cambia el combate del juego. Se repite esa prueba en ambos formatos antes de cerrar.

La prueba de efectos evolucionados pasa4/4 (dos repeticiones por formato) tras inicializar correctamente la fixture. Las habilidades del juego no se han modificado.

Cierre: build correcto y smoke de producción bajo `/Piratesurvivor/` en ambos formatos sin404 ni errores JS. Se mantiene el aviso preexistente de tamaño del bundle. No hay cambios en dependencias ni persistencia.

## Composición procedural de Shells Town y Orange Town (2026-10-31)

Auditoría: la cruz de4 celdas y cuatro parcelas fijas se repetían por chunk; el terreno se elegía por distrito, marcando rectángulos y fronteras. Se conservan assets y motor de chunks. Se añade terreno continuo por coordenadas globales (ruido suave compartido), calles de piedra con pequeños desvíos/anchos variables, cruces abiertos ocasionales y ramales interiores opcionales. Césped y tierra se mezclan en contornos de media celda; desgaste sobre el pavimento existente, pintado solo al cargar el chunk.

Las viviendas/puestos varían en posición, huella y presencia, dejando claros; huertos/jardines agrupan árboles. En barracones se reutilizan cajas, banderas, cañones y torres existentes, con un único punto militar por composición, sin llenar el pueblo. Se conservan las dársenas/puertos funcionales. Las cuatro celdas centrales y el perímetro se mantienen libres para tránsito; las composiciones respetan las calles visibles y separación entre obstáculos. Una comprobación local de conectividad retira obstáculos que pudiesen cerrar huecos. Límite explícito de20 obstáculos por composición. IDs y propietarios únicos dentro de su chunk.

El hash original se traslada sin cambios a seed.ts y se reexporta desde generator.ts para compatibilidad; terreno/composición no dependen de la UI. Syrup sigue usando la generación anterior y las arenas no usan el pintado nuevo. No se modifican HUD, personajes, habilidades, combatientes, recompensas, progresión ni probabilidades/apertura de cofres.

Tipos y151 pruebas de lógica correctos. Nuevas pruebas: continuidad de material/calle a ambos lados de bordes positivos/negativos;250 chunks de ambos pueblos con cinco semillas, espacios libres conectados, avenidas libres, IDs y caché; navegación mediante campo de flujo, cofres con espacio18px y conservación del generador provisional de Syrup. Navegador2/2 en escritorio y móvil emulado: tres semillas por pueblo, coordenadas negativas, capturas de composición, reutilización acotada de texturas y renderizado de las dos arenas. Se espera a completar los renders de cámara antes de capturar y se comprueban píxeles visibles de Luffy para no dar por válido un terreno sin personaje. Capturas inspeccionadas visualmente; no se acredita FPS en teléfono físico ni Safari.

Regresiones de navegador:4/4 pruebas de cofres pequeños/grandes, berries guardadas y navegación/piratas de Orange en ambos formatos. Las probabilidades y recompensas no cambian.

Cierre:151/151 tests, comprobación de tipos y build correctos; smoke de producción bajo `/Piratesurvivor/` en PC y móvil emulado, sin404, errores JS ni hook QA. Se conserva el aviso preexistente de tamaño del bundle. No se han añadido dependencias ni assets.

Publicación ee0f6f2 verificada en la URL real de Pages en844×390 y1440×900: bundle con el pintado/composición nuevos, tres atlas de marines preservados, inicio/pausa funcionales y ninguna respuesta404/error JS. La CI general anterior falló en una fixture de selección de personajes porque el combate real recogió2 berries legítimas mientras comprobaba el perfil: se congela únicamente la simulación de esa fixture, sin tocar economía o guardado. Repetida4/4 (dos por formato), correcta. La CI completa se volverá a ejecutar; no se presenta como completada en esta validación local.

## Mundo3: Syrup Village y Capitán Kuro (2026-10-31)

Auditoría: Syrup era un punto de llegada provisional, con dos definiciones de enemigos y generador naval heredado; Buggy embarcaba automáticamente. Se amplía la estructura existente: bioma rural con la composición/noise de chunks ya probados, catálogo de tres enemigos, arena propia y KuroEncounter sobre PatternEncounter. Morgan y sus datos, ataques de Buggy, tiendas y entrenamiento no se reescriben.

Buggy ahora deja un Log Pose voluntario tras la caída. Conserva al mismo actor/build al navegar. La ruta de Kuro aparece desde05:00 de tiempo de Syrup, con las ventanas/reintentos existentes. Se reutilizan cofres3/24, objeto único, frutas, experiencia y guardado. Kuro tiene X doble, carga fijada, traslado sin daño con estela, tres pasadas Shakushi y ráfaga de cuatro golpes; cada subataque tiene aviso/recuperación. Tres fases66/33%, geometría única para dibujar/dañar, navegación y límites de arena existentes. Estelas limitadas a12. La victoria cancela peligros, concede unión y abre el menú; un solo ataque permite continuar. Log Pose de Baratie desbloqueado pero informa de contenido pendiente, sin cargar un mundo4 ficticio. Perder ante Kuro devuelve a Syrup con25HP y la misma build, mundo y cofres.

Enemigos: básico más rápido que marine; urpas con preparación y dos cortes, respetando guardias/invulnerabilidad; hipnotizador usa pool/colisiones de proyectiles existentes, con disco visible y slow temporal acotado que no se suma. El pool limpia el tag al reciclar. Presión gradual de tipos en minutos0/1/2/3, cap120 y cadencia moderada. Datos en catálogo/world/boss separados del motor. Detalles y decisiones de beta en SYRUP-VILLAGE.md.

166/166 pruebas de lógica correctas: tres tipos por ventanas, determinismo/conectividad rural en75 chunks, los cinco patrones y fases de Kuro, colisiones de carga, ausencia de daño durante preparación/traslado, secuencias3/4, cleanup, hipnosis real desde IA y pool sin efectos heredados, objetos/HP/XP/buffs/ataques conservados con los cinco personajes, retry con cofres preservados y Baratie sin viaje falso. Compilación/tipos correctos. Smoke de producción bajo `/Piratesurvivor/`, PC/móvil emulado sin404/JS ni QA expuesto; se mantiene el aviso preexistente por tamaño del bundle.

Navegador: recorrido controlado Buggy→Syrup→Kuro, tres sprites en mapa, avisos/impactos de cinco patrones, mismo zoom, unión tras victoria y Log Pose bloqueado de Baratie, en escritorio/móvil emulado. Se inspeccionan capturas reales del mapa/arena/actores/ataques; se evita aplicar la antigua composición visual de separación de Buggy al traslado de Kuro. Se actualizan las expectativas de dos pruebas antiguas porque la transición de Buggy ahora es voluntaria y Syrup deja de ser el generador provisional.

No se ha completado una campaña manual de30–45 minutos ni medido FPS en un teléfono físico. Gráficos, animaciones y balance de Syrup son provisionales; no se afirma validación final de equilibrio para las cinco builds. No hay acceso a Baratie todavía ni nuevos sistemas permanentes.

Cierre de regresiones:8/8 pruebas finales de navegador (PC y móvil emulado) de cofres, ruta/victoria de Morgan, ambos pueblos y recorrido completo de Syrup. Además4/4 del pase Buggy→Syrup/Kuro y2/2 de revisión específica de sprites/telegráficos tras corregir el traslado. Total de lógica166/166. Se ha inspeccionado renderizado real, no solo compilación.

## 2026-10-31 · HUD de bosses, presión final y Kuro completo

Auditoría: Kuro ya estaba integrado con cinco patrones, tres pasadas de Shakushi y HP8200. Se amplía el controlador existente: seis patrones, cinco pasadas, dos cortes sucesivos para la X, dirección fijada en la ráfaga, reposicionamiento seguro, HP8500 y agotamiento vulnerable de2s sin escalado. No se cambian mapas de Shells/Orange, sus arenas, habilidades, cofres, entrenamiento ni transiciones/recompensas. El único ajuste de datos de Morgan es el umbral final30→33%; sus cinco ataques se mantienen. Buggy conserva sus seis ataques y partes independientes.

Archivos de implementación: `index.html`, `src/ui/view.ts`, `src/ui/hud.css`; `src/game/bosses/{pressure,pattern-encounter,telegraphs,buggy,kuro}.ts`; `src/content/bosses/{morgan,kuro}.ts`; `src/game/scenes/{boss-renderer,island-art}.ts`; `src/game/world/arena.ts`. Cuatro archivos originales de arte: `src/assets/worlds/{blackcat-banner,kaya-cat-statue}.{svg,png}`. Pruebas: `tests/boss-pressure.test.ts`, `tests/buggy.test.ts`, `tests/syrup.test.ts`, `tests/browser/game.spec.ts`. Documentación: este registro, `SYRUP-VILLAGE.md` y `asset-register.md`.

Comprobaciones realizadas:
- `npm run check` correcto; `npm test`:172/172.
- Casos de avisos al70% en todos los ataques de los tres bosses, mínimo0,35s configurable, daño y geometría no escalados, fases1/2 intactas y aviso ya iniciado conservado al cambiar de fase. Bombas escalonadas y bomba secundaria de Buggy incluidas.
- Kuro ejecuta seis ataques/tres fases; cinco pasadas separadas; X con dos impactos no simultáneos; ráfaga no gira persiguiendo al jugador; reposicionamiento no solapa al actor; colisiones de carga; limpieza al morir/cancelar; agotamiento2s; victoria con unión y Baratie bloqueado sin mapa vacío. Persistencia de la build y regreso tras derrota cubiertos por pruebas existentes.
- Chromium real con vista1440×1000 y móvil emulado844×390:10/10 pruebas de rutas, victorias, seis patrones de Kuro, agotamiento y HUD. Además4/4 de animaciones de Morgan y combate completo de Buggy. Se inspeccionaron capturas reales de la barra sin panel, avisos y agotamiento. Revisión de tamaños568,667,740,844,1024,1440: sin solapamiento con jugador/cronómetro. Se corrigió un solapamiento inicial de1px detectado por la prueba móvil.
- `PAGES_BASE_PATH=/Piratesurvivor/ npm run build` correcto, incluido HTML autónomo. Sigue el aviso previo de tamaño del bundle, sin dependencias nuevas.
- `scripts/check-pages.mjs`: producción bajo `/Piratesurvivor/` correcta en PC/móvil emulado, cinco personajes,13sprites/14tarjetas, inicio/pausa, sin404 ni errores JS ni hookQA.
- PNG decorativos verificados con transparencia real(alpha0–255); fuentes SVG originales conservadas.

Límites: no se han medido FPS en teléfono físico, Safari ni realizado una campaña manual completa de los cinco personajes. Las animaciones de Kuro reutilizan sus poses y transformaciones funcionales; no se entregan nueve secuencias artísticas nuevas. Se requiere equilibrado mediante partidas reales. Baratie sigue pendiente intencionadamente.

## 2026-10-31 · Baratie y Don Krieg

Implementación sobre los sistemas de mundos/bosses existentes. Nuevo bioma marítimo determinista, tres piratas diferenciados, Don Krieg con seis patrones, tres fases, armadura independiente y escudo temporal. Se conserva el HUD minimalista. Kuro→Baratie es un viaje voluntario; Krieg→Arlong muestra el contenido pendiente sin crear un mundo vacío. No se cambian datos de Morgan, Buggy o Kuro ni mapas de los mundos anteriores. La ampliación de `shells-town.ts` solo incorpora el literal del nuevo bioma al tipo compartido.

Comprobaciones realizadas:
- `npm run check` y `npm test`:189/189. `tests/baratie.test.ts` añade17 casos con243 chunks deterministas de tres semillas, continuidad de puertos, conectividad de todas las superficies, navegación en ocho semillas y48 simulaciones reales de steering con los tres enemigos a30/60Hz. Esto valida simulación, no mide FPS de un teléfono.
- Se detectó y corrigió una oscilación al centrar enemigos en las esquinas de los puentes. El centrado se activa solo en Baratie. Los enemigos blindados comprueban su radio real al aparecer; no se permite caminar sobre agua.
- Cofres candidatos3/24, posiciones libres y alcanzables, persistencia del registro tras descarga. Spawns válidos, tipos por minuto, melee preparado, ráfagas y recarga; guardia frontal del blindado fijada durante su preparación, permitiendo flanquearlo.
- Los cinco personajes conservan estado completo al viajar voluntariamente desde Kuro y entrar en la arena de Krieg: HP, XP, nivel, moneda, habilidades evolucionadas, cooldowns, combinaciones, buffs, objeto y fruta. La derrota conserva mundo/build/cofres y devuelve25HP. Se verifican carta desde05:00, victoria, unión y salida pendiente a Arlong.
- Scheduler real de Krieg: seis patrones/tres fases, cancelación de hazards y proyectiles. Siete disparos fijos; bombardeo5/7; lanza sin daño duplicado. Armadura3000 independiente, rotura permanente por intento, escudo3s y reducción combinada máxima70%. MH5 con expansión compartida entre render y colisión, daño cada0,8s, salida navegable en más de60 posiciones de prueba y recuperación1,5s sin escalado. Avisos de fase3 al70%, mínimo global0,35s/MH51,2s.
- Chromium:12/12 pruebas de integración/regresión en escritorio y móvil horizontal emulado, incluyendo Morgan, Buggy, pueblos anteriores, Syrup/Kuro, HUD y Baratie/Krieg. Repetición final de Baratie:2/2 tras colocar el boss lateralmente para hacerlo visible al entrar en móvil y capturar el borde con mar/restaurante. Se inspeccionaron imágenes reales de exploración, enemigos, arena, gas y degradación de armadura.
- `PAGES_BASE_PATH=/Piratesurvivor/ npm run build`: correcto, HTML autónomo10,34MiB. Permanece el aviso previo de tamaño del bundle.
- `scripts/check-pages.mjs`: producción bajo `/Piratesurvivor/`, PC/móvil emulado, cinco personajes, entrenamiento y arranque/pausa, sin404, errores JS ni hookQA.
- Nuevos assets originales y su procedencia/recortes constan en `asset-register.md` y `motion/baratie-manifest.json`. No se añaden dependencias ni servicios externos.

Archivos principales: `content/{worlds/baratie,bosses/krieg,catalog,types}.ts`; `game/world/{baratie,world,arena}.ts`; `game/bosses/krieg.ts`; `game/core/{run,types}.ts`; `game/navigation/flow-field.ts`; `game/systems/{hits,spawner}.ts`; `game/scenes/{battle,boss-renderer,island-art,world-renderer}.ts`; textos de viaje/recompensa en `ui/{view,combinations}.ts`; ocho PNG, manifiesto y pruebas de Baratie/regresión. Detalle de cifras y reglas en `BARATIE.md`.

Pendiente de validación manual: campaña completa sin fixtures con los cinco personajes, equilibrio económico/de combate, controles y FPS en teléfonos físicos/Safari. Los sprites, animaciones y acabados de cubierta son provisionales; no se presentan como arte definitivo ni se afirma haber completado una sesión manual de toda la campaña.

## 2026-11-01 · Arlong Park y Arlong

Quinto mundo implementado sobre los generadores, navegación y controlador de patrones existentes. Krieg→Arlong es voluntario; se conserva la partida y Arlong→Roger queda como destino pendiente, sin cargar mapas vacíos. No se cambian datos de los cuatro bosses anteriores ni el balance de los mundos 1–3.

Comprobaciones de simulación:
- `npm run check` y `npm test`: 206/206. Se añaden 17 casos en `tests/arlong.test.ts`.
- 243 chunks de tres semillas y coordenadas negativas: generación determinista, canales coincidentes, tres regiones, puentes y superficies terrestres conectadas. Cofres candidatos 3/24, fuera del agua y alcanzables.
- Movilidad explícita: jugador bloqueado por agua, hombres-pez cruzan canales y conservan colisiones de edificios. IA real de luchador, escupidor y karateka; proyectiles de agua y combos separados. Recompensas de bajas acuáticas colocadas en tierra.
- Los cinco personajes conservan una instantánea completa de build al viajar desde Krieg y entrar en la arena: nivel, XP, HP, berries, niveles/evoluciones/cooldowns, combinaciones, buffs, objeto y fruta.
- Los seis patrones, tres fases y presión final de Arlong pasan simulación natural y casos dirigidos. Mordida sin daño temprano; tres cortes; dentadura de ida/vuelta con control por tramo; inmersión vulnerable, salida advertida y retorno a tierra; tres cargas con detección continua incluso a pasos de 0,4 s.
- Furia una sola vez al 33%: cuatro coberturas se sustituyen por escombros, se abren colisiones y se reconstruye la navegación mediante revisión del mundo. No se destruyen límites ni piscinas.
- Victoria con caída, limpieza, combinación y Log Pose de Roger pendiente; derrota con retorno al mismo mundo/cofres y 25 HP.

Detalle de arquitectura, cifras y límites en `ARLONG-PARK.md`; procedencia de diez PNG y manifiesto en `asset-register.md`. Sin nuevas dependencias. Los sprites y las animaciones son provisionales y comparten perfiles direccionales; no son secuencias artísticas definitivas.

No se ha realizado una campaña manual completa con los cinco personajes ni medido FPS/controles en un teléfono físico o Safari. El equilibrio necesita partidas reales. Roger, el balance solicitado de mundos 1–3 y la incidencia táctil de selección de habilidades siguen pendientes.

## 2026-11-01 · desafío de Roger y cierre de Arlong Park

El mundo 5 pendiente se conserva e integra con el nuevo final. Roger reutiliza el punto común de daño con inmortalidad explícita; no hay reserva enorme de vida ni barra de HP. Su arena fija reutiliza las clases originales de los cinco bosses y piscinas compatibles con Arlong. Los controladores y ataques originales no se copian. Los cambios al controlador compartido se limitan al método de selección de fase para permitir progresión temporal de Roger.

- `npm run check` correcto. `npm test`:222/222, incluyendo16 casos nuevos de Roger además de los17 de Arlong.
- Acceso voluntario y estado completo de los cinco personajes, arena sin cofres, inmortalidad con críticos/área/daño secundario, marcador independiente de otros objetivos.
- Calendario40/80/120/160/200/240/280/320/360/400/440/480/520s; tandas1/1/1/2/2/3/3/3/4/4/4/5/5. Plazas reservadas durante materialización, máximo8 vivos, descarte de sobrantes, tipos únicos por tanda, duplicados entre tandas con IDs independientes y bajas contadas una sola vez.
- Instancias reales de Morgan/Buggy/Kuro/Krieg/Arlong, HP60%, aceleración configurable1,2× y mínimos de aviso en tiempo real. Materialización2s. Pools, campos de navegación compartidos por tamaño/capacidad y limpieza por propietario.
- Desbloqueos temporales de Roger, anillo expansivo, trayectorias fijas y sectores con rutas libres. Hordas activas aun con8bosses. Pausa detiene relojes. La muerte termina definitivamente el desafío, limpia ataques y congela resultados.
- Récords independientes globales/personaje, datos inferiores no sobrescriben superiores, persistencia tras recarga y entrenamiento previo conservado. El resultado se registra una sola vez.

Archivos principales de Roger: `content/bosses/roger.ts`, `game/{bosses/roger,challenges/roger,world/roger-arena,core/run,core/types,systems/hits}.ts`, método de fase en `bosses/pattern-encounter.ts`, integración visual en `scenes/{island-art,boss-renderer,battle}.ts`, `platform/persistence/save.ts`, `ui/{view.ts,hud.css}`, `index.html`, tres PNG y su manifiesto, `tests/roger.test.ts` y pruebas de navegador. Arlong añade los archivos indicados en `ARLONG-PARK.md`; detalles del desafío en `ROGER.md`.

Límites: no se ha completado manualmente una campaña de seis mundos con cada personaje; no hay medición de FPS ni prueba de controles en un teléfono físico/Safari. Los assets son provisionales y reutilizan perfiles. El balance de una supervivencia larga con superposición de ocho bosses necesita partidas reales. La furia de Arlong invocado no destruye estructuras de la arena principal. El balance de mundos1–3 y la incidencia táctil previa siguen pendientes, sin presentarlos como corregidos.

Comprobaciones finales de integración:
- Chromium real:14/14 en escritorio1440×1000 y móvil horizontal emulado844×390, con Morgan, Buggy, Kuro, Krieg, Arlong y Roger, transiciones y HUD. Repetición final de Roger tras secuenciar Voluntad del Rey y ajustar resultados:2/2. Sin errores JS ni404.
- Se revisaron capturas de cinco invocados con sprites originales, avisos/impactos, marcador y pantalla final. Se corrigió el recorte del título provocado por el foco en los botones del resultado en móvil; la prueba comprueba su posición visible. Persistencia confirmada tras recargar la página.
- Simulación dirigida adicional de30s con ocho invocados activos: pico70 enemigos normales y56 proyectiles en el pool compartido, sin superar límites y Roger vivo. Esto comprueba topes y estabilidad de simulación, no mide FPS del render ni de un teléfono.
- `PAGES_BASE_PATH=/Piratesurvivor/ npm run build` correcto, HTML autónomo11,11MiB. Permanece el aviso previo de tamaño del bundle.
- `scripts/check-pages.mjs`: producción bajo `/Piratesurvivor/` en PC/móvil emulado, cinco personajes,13sprites/14tarjetas de entrenamiento, arranque y pausa; sin404, errores JS ni hookQA. Sin dependencias nuevas y sin modificaciones a la configuración de Netlify.
- Ajuste final: Roger aumenta su cadencia desde60s y las recompensas de invocados usan pickups normales en tierra, incluidos los bosses derrotados dentro de piscinas. Así conservan los multiplicadores de objetos. Repetidos check,222/222 pruebas, build y smoke de producción después del ajuste.

- Se comprueba el alcance original de las balas de Krieg y agua de Arlong invocados, su limpieza por propietario y el avance de la animación de caída antes de retirar un boss derrotado. No se limpian los proyectiles de otras instancias.

- Caso adicional: si el jugador entra en una silueta antes de los2s, la invocación se recoloca lejos y repite el aviso completo. No se materializa encima del jugador. Check,222/222 pruebas, build y smoke correctos; repetición de Roger en Chromium:2/2.

## Publicación: fusión de Buggy y contacto táctil del HUD

Buggy quedaba excluido de la condición que abre la combinación tras una victoria. Se incluye en el flujo existente, conservando el cierre voluntario antes del viaje y la protección de apertura única mediante exitSignal. El texto de recompensa ahora identifica correctamente a Buggy. Prueba nueva: consumir una unión anterior, derrotar a Buggy, obtener y usar otra unión, no reabrirla y viajar a Syrup.

La selección táctil responde desde pointerdown, antes de que una actualización del HUD pueda sustituir el botón entre pulsación y click. Se mantiene click para ratón/teclado y se ignora el click táctil posterior para no duplicar la selección. No se modifican movimiento ni ataque.

Verificación: check,223/223 pruebas de lógica, compilación bajo /Piratesurvivor/ y smoke de producción correctos. Chromium:6/6 pruebas de Buggy/viaje, Syrup/Kuro y selección inmediata, tanto en escritorio como en móvil horizontal emulado. Doce selecciones consecutivas y selección desde el inicio del contacto. No se ha probado teléfono físico. Las fixtures anteriores se actualizan para cerrar la recompensa antes de viajar.

Esta publicación contiene estas dos correcciones. La densidad, estadísticas, resistencia/patrones y XP solicitados para el balance de los tres primeros mundos siguen pendientes; no se presentan como implementados.

## Balance inicial de mundos1–3 · trabajo local pendiente

Configuración nueva `content/early-balance.ts`: objetivos de densidad8→22/20→35/32→48, presión máxima conservada entre mundos, entrada de hasta dos enemigos cada0,45s hasta el objetivo, respetando el spawner y sus comprobaciones de acceso. Vida/dano normal por mundo1/1,35/1,8 y1/1,2/1,4. Vida de bosses principales ×1,5/2,5/3 aplicada en Run al entrar, conservando las estadísticas originales utilizadas por Krieg/Arlong y las invocaciones de Roger.

Check y223/223 pruebas existentes correctos. Estos cambios aún no están publicados ni validados visualmente; faltan pruebas específicas de los objetivos, revisión de XP y ajustes de ataques. No constituyen la tarea completa de balance.

## Selector público Beta test

`src/beta/{config,prepare,launcher}.ts`, flag practice en Run y protección de persistencia en main. Selector de mundo/boss, niveles y ranuras editables con presets orientativos. Retirable mediante un único flag. Usa mapas/controladores y validación de habilidades reales.

Check y225/225 pruebas de lógica:55 entradas (11 destinos ×5 personajes), builds válidas, nivel/HP, sin berries, rechazo de duplicados/build vacía. Chromium2/2: escritorio y móvil horizontal emulado, acceso a Kuro nivel35 con tres ataques enlazados; se comprueba que incrementar moneda y flags de victoria en práctica no modifica las berries persistidas, ni al abandonar. Captura real inspeccionada. No se ha probado teléfono físico.

El primer bloque local de balance descrito arriba se incorpora con esta versión; la revisión de ataques/XP y el balance completo siguen pendientes.

## Loguetown · composición visual del escenario de Roger

Cambios limitados a `game/world/roger-arena.ts`, `game/scenes/{world-renderer,island-art}.ts`, cuatro PNG modulares y manifiesto. Se sustituyen el cadafal y los edificios genéricos por arquitectura propia de piedra clara/tejados rojizos, tiendas y arcadas. Fachadas perimetrales sólidas y dos referencias urbanas en las esquinas superiores del campo central; centro amplio. Cadafal768px con escaleras y soportes. Piscinas, canales, límites, spawns y escala conservados. No se cambian controladores de Roger, ataques, invocaciones, contadores, recompensas ni personajes.

El pavimento de Roger tiene cursos de longitud variable en coordenadas globales, tonos próximos, desgaste, grietas, franjas claras e incrustación central. Rasterizado por chunk y reutilizado mediante los slots existentes. Atmósfera bajo personajes/avisos: sombras muy leves,14 trazos de polvo/viento y relámpago lineal ocasional, sin flash a pantalla completa. No se añaden timers de simulación ni efectos físicos.

Check y227/227 pruebas de lógica correctos: se añaden pruebas de cadafal sólido/centro libre/piscinas y rutas para radio28 junto a ambas piscinas. Chromium4/4 en escritorio y móvil horizontal emulado: recorrido de capturas plaza/cadafal/fachadas/arcadas y regresión completa de Roger (patrones, invocados, daño, final y récords). Capturas reales inspeccionadas; se ajustaron juntas/variación del suelo tras la primera revisión y se repitió la comprobación. Sin errores JS. Procedencia y acceso a referencias en asset-register.md.

Límites: no se ha medido FPS en teléfono físico/Safari ni se garantiza rendimiento de todos los dispositivos. La composición visual se ha inspeccionado en Chromium; no se afirma una campaña manual completa. Se conservan los efectos existentes de Haki; el nuevo desgaste del pavimento es decorativo y no destruye colisiones.
Compilación con `PAGES_BASE_PATH=/Piratesurvivor/` correcta (HTML autónomo13,01MiB; permanece el aviso de tamaño del bundle). Smoke de producción en PC y móvil emulado correcto bajo ese prefijo, sin404 ni errores JS y sin hookQA.
