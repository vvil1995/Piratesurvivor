# Gol D. Roger · desafío final

## Entrada, arena y conservación

Después de Arlong, el Log Pose dorado permite viajar voluntariamente a Loguetown. Se conserva el actor completo con HP, nivel, XP, berries, ataques/evoluciones/cooldowns, combinaciones, buffs, fruta y objeto. El viaje no se activa por tiempo ni reinicia la partida.

`RogerArenaWorld` reutiliza los contenedores de render de las arenas: su disposición es fija, sin generación de pueblos o cofres. Plaza 3072×2176, plataforma de ejecución y edificios al norte, decoraciones periféricas y centro abierto. Cámara y escala iguales a exploración. Piscinas laterales compatibles con Arlong, sólidas para jugadores y enemigos terrestres. Las transformaciones de los Arlong invocados conservan su acción de furia y señal visual sin destruir estructuras o colisiones de la arena compartida.

## Daño e inmortalidad

La condición `Enemy.immortal` evita explícitamente la pérdida de HP y la muerte, sin simular una reserva enorme de vida. `damageEnemy` calcula críticos, exposición, defensas y daño real, incrementa `damageTaken` y conserva los procs y límites de curación. La condición solo se activa en Roger. Su HP de control permanece en 1 y no se representa en el HUD. El daño a otros enemigos no modifica el marcador.

Roger conserva cinco patrones ofensivos y la acción de invocación independiente cada 40 s: corte frontal, Kamusari de trayectoria fija, anillo expansivo, secuencia de 4/6 ondas y sectores de Voluntad del Rey. El anillo tiene interior libre; los sectores dejan pasos entre franjas. Cada impacto usa la geometría advertida. La invocación muestra gesto/Haki y siluetas durante dos segundos mientras Roger y las hordas continúan actuando.

Desbloqueos: corte/Kamusari al inicio, anillo desde60 s, tormenta desde120 s, voluntad desde180 s. Desde240 s aplica la presión compartida: mayor movilidad/cadencia y avisos ×0,7 respetando mínimos. No aumenta artificialmente el daño.

## Bosses invocados

`RogerChallenge` crea instancias de las clases originales Morgan/Buggy/Kuro/Krieg/Arlong. No contiene copias ni versiones recortadas de sus ataques. IDs únicos permiten repetir el mismo tipo en tandas diferentes. Cada instancia conserva vida/fases, cooldowns, partes, proyectiles, combos, defensa, armadura y estado propios. Las balas de Krieg/Arlong se identifican por propietario para que una muerte no limpie ataques ajenos. Buggy conserva reflexión, señuelos y contraataques. Morgan conserva sus llamadas de refuerzos.

Valores configurables en `content/bosses/roger.ts`: 60% de HP original, ritmo de simulación 1,2× para movimiento y acciones, mismo daño por impacto, aviso mínimo real de0,35 s o el mínimo propio superior. La materialización dura2 s reales. Se conservan los2 s de agotamiento de Kuro y los3 s del escudo de Krieg.

Tandas cada40 s: 1 hasta120 s, 2 desde160 s, 3 desde240 s, 4 desde360 s y5 desde480 s. A partir de480 s la selección completa contiene los cinco tipos. Máximo8 vivos, contando las siluetas reservadas y excluyendo a Roger. Se descartan plazas sobrantes; no hay cola. No se repite tipo dentro de la tanda y se priorizan tipos distintos a la tanda anterior. Las posiciones son transitables, separadas entre sí y al menos380 px del jugador. Solo desaparecen al morir; su representación de caída se retira después de1,3 s.

Los campos de navegación se comparten por tamaño y capacidad de nadar. Renderizadores y efectos son reutilizados, con pools existentes y número de instancias limitado. Los movimientos rápidos usan las colisiones continuas originales. No se transforma el mapa principal al entrar en una fase de una invocación.

## Hordas y recompensas

Se incorporan los mundos1–5 a0/30/60/90/120 s; desde150 s queda disponible la variedad completa. Se reutilizan catálogos, pesos, IA y recompensas originales. Intervalo de entrada0,9 s que se reduce progresivamente hasta0,24 s; dos intentos por tanda desde180 s. Cap configurable70 enemigos normales, independiente del límite de bosses. Se respetan navegación, distancias de aparición y capacidad de nadar.

Los bosses derrotados suman exactamente una eliminación y dan una recompensa inicial configurable en la integración (80 XP y10 berries), sin pantallas de victoria, combinación, viaje ni cambios en flags de los mundos. Los enemigos normales conservan sus recompensas; no se generan cofres de chunks en esta arena.

## Final y persistencia

La muerte termina el desafío y congela sus contadores. Cancela bosses, invocaciones, balas y áreas; no devuelve al jugador a una isla. El flujo existente muestra personaje, nivel, daño, supervivencia, bosses y berries, con botones de menú/reintento.

`SaveStore` añade un campo opcional a la versión1 existente: máximos independientes de daño/tiempo/bosses, globales y por personaje. Los guardados anteriores siguen válidos y no se reinicia el entrenamiento. La actualización se realiza al registrar el resultado, no por fotograma; un resultado inferior no reduce un récord. El HUD muestra tiempo, daño y bosses sin barra de vida de Roger.

## Límites conocidos

Arte y animaciones provisionales; perfil compartido entre direcciones, sin ocho orientaciones nuevas. El final requiere equilibrio mediante partidas reales, especialmente la superposición de varios bosses. Las pruebas con Chromium y móvil emulado no equivalen a medir FPS o controles en un teléfono físico/Safari. La furia de invocados no destruye la arena principal. Los cambios de balance de mundos1–3 y la incidencia táctil previa no forman parte de esta implementación.
