# Presupuesto de rendimiento

Objetivos de diseño, pendientes de medición en teléfonos reales:

- Aspiración de 60 FPS; mínimo objetivo de 30 FPS sostenidos en un móvil de gama media que se seleccione para la validación.
- Máximo 150 enemigos, 180 objetos de XP y 12 golpes visuales activos.
- Pools preasignados para enemigos y XP; los sprites se crean una sola vez. XP adicional se fusiona si el pool está lleno.
- Rejilla de celdas de 96 unidades para consultas locales. No hay colisión física global ni comparaciones de todos contra todos.
- Actualización a 60 pasos por segundo y máximo seis pasos por frame; no recuperar tiempo de pestañas suspendidas.
- HUD aproximadamente a 10 Hz; guardado en resultados, ajustes y entrenamiento, nunca por frame.
- Canvas a resolución CSS (sin multiplicar por DPR); pixel art y zoom adaptado al lado corto. Evita cuadruplicar píxeles en pantallas Retina.
- Texturas generadas localmente una vez; sin descargas de recursos, fuentes, audio o servicios de terceros.
- Culling de enemigos fuera del área de cámara ampliada; enemigos a más de 1300 unidades se reciclan. Las monedas/XP no dependen del render.

La separación de vecinos y el combate aún usan pequeños callbacks; si el perfil en móvil muestra presión de GC, convertirlos a recorridos reutilizables. La optimización no debe basarse exclusivamente en resultados de Chromium de escritorio o emulación táctil.

Medir sesiones de 10 minutos en Chrome Android y Safari iOS: tiempos de frame mediano y p95, memoria antes/después, calentamiento, consumo de batería cualitativo, giro, retorno desde otra app, nivel alto y límite de enemigos. Comparar tres reinicios sin crecimiento persistente de memoria. Desactivar grabación de pantalla para la medición base.

## Presupuestos adicionales 0.3

- Caché de datos: máximo 128 chunks; reconstrucción determinista, sin historial de chunks visitados.
- Terreno visible más anillo: máximo 49 texturas/canvases de 256×256, reutilizados. 12 obstáculos como máximo por fragmento; sus imágenes también se reutilizan.
- Lado máximo visible de 1800 unidades para limitar población y coste en pantallas grandes/ultrapanorámicas.
- Campo BFS 81×81 por objetivo; dirección escalonada por enemigo y controles geométricos compartidos. No A* por enemigo y frame.
- Graella de enemigos se vacía cada tick reciclando contenedores; no conserva celdas por las que pasó el jugador.
- Enemigos a más de 1400 unidades y XP abandonada a más de 1700 se reciclan. No se conceden recompensas por desaparición.
- Origen local del render: coordenadas cercanas al jugador aunque la posición lógica esté a cientos de miles de unidades.

Estos límites se verifican con pruebas. No son una medición de FPS/memoria de Safari iOS o Android físicos; esa comprobación sigue pendiente.
