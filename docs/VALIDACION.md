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
