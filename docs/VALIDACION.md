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
