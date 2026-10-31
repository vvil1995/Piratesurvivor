# Syrup Village · primera versión funcional

Buggy ya no embarca automáticamente tras la victoria. Su Log Pose aparece al acabar la caída; caminar sobre él inicia la travesía a Syrup. Se conserva el mismo actor y su build, XP, HP, fruta, objeto, buffs, moneda y cooldowns. Morgan mantiene su transición existente.

Syrup usa los chunks y la composición conectada de los pueblos, con caminos de tierra, más césped, casas rurales, bosque, cercas, carros, mansiones ocasionales y rocas costeras decorativas. La mansión inicial sirve de referencia. Cofres candidatos cada3/24 chunks, mismas recompensas y apertura3s. No hay nuevo sistema de inventario ni de guardado.

Piratas del Gato Negro: básico85HP/20daño/88velocidad; urpas110HP/24daño/96velocidad, preparación0,6s y dos cortes; hipnotizador75HP/18daño/72velocidad, disparo preparado0,8s, proyectil165px/s, ralentización×0,72 durante1,8s. No se suma duración/intensidad por impactos; efecto limitado a2s y al menos65% de movilidad. Las cifras son provisionales y se ajustan en catálogo. Distribución básica/urpas/hipnosis:100/0/0% primer minuto,80/20/0% desde1min,65/25/10% desde2min,55/30/15% desde3min. Cap120, cadencia inicial0,95s y presión temporal acotada.

La ruta de Kuro sigue el sistema existente: cartas desde05:00 de tiempo en Syrup, con retraso aleatorio inicial y nuevos intentos. No exige nivel. La arena mantiene el zoom de exploración y cámara limitada; mansión, cercas y árboles reutilizan colisiones y navegación existentes.

Kuro:8500HP, velocidad260 con incremento moderado por fase, umbrales66/33%. Dos cortes cruzados en X; carga fijada; pasos fantasma sin daño; Shakushi de cinco pasadas, cada una avisada; combo de cuatro golpes con recuperaciones y urpes sorpresa tras reposicionamiento. No tiene invulnerabilidad especial. Se reutiliza PatternEncounter y su geometría única de aviso/impacto. Estelas limitadas a12 imágenes. Si se pierde, se vuelve a Syrup con25HP, misma build/mundo/cofres y posibilidad de otra carta.

La victoria concede el token de unión existente y abre su menú. No concede ataques. Con un solo ataque permite continuar. Al cerrar se conserva la build y aparece el Log Pose de Baratie. Baratie queda desbloqueado dentro de esa partida y ahora está implementado: al visitar el Log Pose, el viaje voluntario conserva la build y continúa al mundo4. Véase BARATIE.md.

Archivos principales: `content/worlds/syrup-village.ts`, `content/bosses/kuro.ts`, `content/catalog.ts`, `game/bosses/kuro.ts`, `game/systems/enemy-melee.ts`, ampliaciones de Run/transiciones y del renderer/arena existentes. La revisión posterior del HUD y presión final se describe a continuación; las arenas y ataques de Morgan/Buggy se conservan.

Pendiente: sprites y animaciones definitivas, equilibrado con sesiones completas de los cinco personajes y comprobación en teléfonos reales. No se añaden red, monetización ni entrenamiento permanente nuevo.

## Revisión: seis patrones y presión final compartida
Kuro tiene ahora8500PV, exactamente1,25× los6800PV de Buggy. La X son dos cortes independientes (preparación inicial0,5s); embestida0,8s y recuperación1s; ráfaga cuatro cortes con preparación0,7s, dirección fijada y recuperación1,2s; pasos fantasma sin daño con posiciones seguras; urpes sorpresa reposiciona primero y avisa0,5s antes del arco, recuperando0,8s. Shakushi realiza cinco pasadas avisadas (1s cada una antes del ajuste de fase), con recorrido recortado por colisiones. Un choque interrumpe la cadena y aturde. Tras las cinco pasadas queda agotado2s completos y vulnerable; cooldown14s.

`game/bosses/pressure.ts` centraliza el inicio de fase3 al33%, avisos×0,7 con mínimo0,35s, movimiento×1,15 y pausa entre movimientos×0,85. Los avisos se fijan al preparar cada ataque; bajar de fase a mitad del aviso no lo acorta retrospectivamente. Las duraciones de impacto, daño y agotamiento no se escalan. Las fases1/2 de Morgan y Buggy conservan sus tiempos. La bomba adicional de Buggy tiene su propio aviso ajustado y los retrasos escalonados siguen la misma proporción.

Los tres bosses muestran únicamente nombre y barra fina rojiza bajo el cronómetro; no se muestran fase, patrón, retrato ni cifras secundarias. HUD del jugador, arenas de Morgan/Buggy y progresión/recompensas permanecen intactos. Los jardines añaden banderas del Gat Negre y estatuas decorativas fuera del espacio central de combate, sin nuevas colisiones.
