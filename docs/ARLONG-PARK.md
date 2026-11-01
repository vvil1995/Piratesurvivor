# Arlong Park · mundo 5 funcional

## Acceso y estado de partida

El Log Pose de Don Krieg inicia voluntariamente el viaje a Arlong Park. Se conserva el mismo jugador: personaje, nivel, XP, HP, berries, ataques/niveles/evoluciones/cooldowns, combinaciones, buffs, fruta y objeto. No se escribe este estado temporal en el entrenamiento permanente. La ruta al boss reutiliza las cartas existentes, disponibles desde 05:00 de tiempo local con su demora y reintentos habituales.

La victoria cancela los ataques y proyectiles, reproduce la caída y abre la recompensa de combinación una vez. Después queda un Log Pose especial hacia Roger. El destino conecta ahora con el desafío final de Roger, descrito en `ROGER.md`. Perder contra Arlong devuelve al mismo mapa y registro de cofres con 25 HP, conservando la build.

## Generación y agua

`game/world/arlong.ts` reutiliza la composición urbana y los caminos globales existentes. Un ruido de coordenadas globales mezcla pueblo, selva y territorio de Arlong; reutiliza vegetación y añade casa tradicional, pagoda, banderas y ruinas. Canales de 64 px conectan las aristas horizontales de los chunks; cada sector reserva un puente central de 128 px. Las piscinas opcionales quedan fuera del cruce principal. Una reparación acotada retira obstáculos decorativos si separan superficies terrestres.

El agua bloquea a todos los personajes jugables. `AquaticWorld` es una capacidad explícita de los hombres-pez: permite atravesar agua, conservando muros, edificios y límites. Se reutilizan los campos de navegación, con un campo terrestre y otro acuático por objetivo, sin pathfinding por enemigo en cada fotograma. El movimiento se subdivide en pasos de hasta 6 px. Las recompensas de bajas acuáticas se acercan a una orilla transitable, sin modificar sus cantidades.

Se conservan los candidatos de cofres cada 3/24 chunks, sus comprobaciones de espacio y accesibilidad, apertura de 3 s y recompensas. No aparecen en el agua.

## Enemigos

| Tipo | PV base | Daño base | Velocidad | Comportamiento |
|---|---:|---:|---:|---|
| Luchador |135|27|92|Golpe preparado 0,55 s, alcance 65 px|
| Escupidor |110|27|77|Preparación 0,8 s, tres proyectiles de agua, velocidad 195 px/s, alcance 360 px|
| Karateka |210|29|83|Preparación 0,85 s, combo de tres golpes separados 0,42 s|

Los tres nadan. Pesos luchador/escupidor/karateka: 100/0/0% inicialmente, 75/25/0% desde un minuto, 65/25/10% desde dos y 55/30/15% desde tres. Límite 105 enemigos, intervalo inicial 1 s y presión temporal acotada heredada. XP de zona ×4,8. Son cifras iniciales pendientes de balance mediante partidas reales.

## Arlong y arena

Arena de 3072×2176 px con pagoda, piscinas laterales, canales inferiores y paso central amplio. Mismo zoom y cámara limitada que los mundos anteriores. Arlong tiene 12393 PV (1,08×Krieg), velocidad 220/sprint 290 y ninguna armadura ni invulnerabilidad artificial.

| Ataque | Aviso base | Funcionamiento |
|---|---:|---|
| Mossegada de tauró |0,7 s|Cono fijo, embestida corta de 140 px, un impacto de 52 de daño|
| Kiribachi |0,8 s inicial|Tres cortes separados y advertidos, 42 de daño por impacto permitido|
| Dards d’aigua |1,1 s|Cinco/siete proyectiles en abanico fijo, 220 px/s, 34 de daño|
| Shark on Tooth |1,2 s|Dentadura independiente, ida/vuelta a 330 px/s, control de un impacto por recorrido|
| Immersió |1,2 s; mínimo propio 0,65 s|Viaje a piscina, inmersión 0,65 s, salida terrestre advertida, carga fija y retorno a tierra si hace falta|
| Shark on Darts |1,2 s por pasada; mínimo 0,65 s|Tres cargas a 1000 px/s, cada una advertida y fijada; recuperación final fija 1,6 s|

Fase 1: mordida, espada y agua. Fase 2 añade dentadura e inmersión. Fase 3 añade cargas encadenadas y la furia. Se reutiliza la presión compartida: avisos ×0,7 con mínimo global 0,35 s, movimiento ×1,15 y cadencia ×0,85, además de la cadencia propia por fase. No aumenta el daño por cambio de fase.

La furia ocurre una sola vez por intento, cancela el ataque anterior y rompe cuatro obstáculos seleccionados. Sustituye columnas/muros por escombros y abre sus colisiones. La revisión del mundo invalida campos de navegación y chunks renderizados; no afecta a la pagoda, piscinas ni límites. No crea nuevas barreras.

La inmersión mantiene a Arlong vulnerable. No hay daño durante el traslado o sumergido; la salida tiene trayectoria visible y posición separada del jugador. Las cargas reutilizan colisiones continuas del controlador y microdesplazamientos, y pueden terminar contra obstáculos.

## Arte y límites

Cuatro atlas y seis props originales, transparentes y modulares, registrados en `asset-register.md` y `motion/arlong-manifest.json`. Las direcciones comparten poses sin invertir armas; pasos, preparación, daño, furia y caída son animaciones funcionales provisionales. No se entrega arte definitivo ni se utilizan las referencias como fondos.

El HUD sigue mostrando solo nombre y barra fina. No se modifican datos de los cuatro bosses anteriores, controles, habilidades, tienda o entrenamiento. El balance solicitado para los mundos 1–3 y la corrección táctil de selección de habilidades son tareas pendientes separadas.
