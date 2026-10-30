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
