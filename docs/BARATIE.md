# Baratie · mundo4 funcional

## Acceso y continuidad

Tras derrotar a Kuro, cerrar la recompensa de unión y caminar sobre su Log Pose se inicia la travesía voluntaria a Baratie. Se conserva el mismo actor con HP, XP, nivel, moneda, ataques y cooldowns, combinaciones, buffs, fruta, objeto y entrenamiento. La ruta a Don Krieg usa las cartas existentes: disponible desde05:00 de tiempo en Baratie, con demora inicial aleatoria de hasta45s y reintentos. No exige nivel ni cambia automáticamente de isla.

Perder contra Krieg devuelve al mismo mundo y campo de cofres con25HP, manteniendo la build y el mecanismo existente de nueva carta. Ganar cancela ataques y efectos, concede el objeto de unión y presenta su menú. Un solo ataque permite continuar sin combinar. El Log Pose de Arlong Park se puede visitar, pero muestra contenido pendiente: el mundo5 no existe y no se crea un mapa vacío.

## Flota procedural

`game/world/baratie.ts` genera cubiertas con proas y tamaños variables, plataformas secundarias y pasarelas de cuatro baldosas(128px). Cada arista deriva su puerto de la misma coordenada y semilla en ambos vecinos, incluso en negativos. Los caminos convergen al cruce central reservado; obstáculos de cubierta se colocan fuera de ese cruce. Se compactan las zonas de mar en rectángulos sólidos, con la separación existente entre colisión de movimiento y ataque: no se camina sobre el mar, pero los proyectiles compatibles lo atraviesan.

Se reutilizan la caché de128 chunks, descarga, campos de navegación, comprobación de espacio para spawns y cofres y pools existentes. El centrado suave de waypoints se activa únicamente en Baratie para resolver la oscilación al girar en las esquinas de las pasarelas. Se comprueba el radio real del pirata blindado antes de admitir su aparición. No hay pathfinding por enemigo y fotograma.

El renderer rasteriza cada chunk al cargarlo: tablas, bordes, postes y agua; una capa reutilizada anima pequeñas olas sobre el mar. Restaurante, mástiles, banderas y cañones son props independientes, no un fondo completo. Las cubiertas y el mar siguen siendo interactivos.

## Enemigos y valores iniciales

| Tipo | PV | Daño | Velocidad | Función |
|---|---:|---:|---:|---|
| Sabre |105|23|91|Corte preparado0,55s, alcance60px|
| Artillero |95|24|73|Preparación0,8s, ráfaga3, proyectil180px/s, recarga3,3s|
| Cuirassado |180|32|56|Golpe preparado0,9s, alcance75px, defensa frontal25%|

El blindado fija la guardia durante su preparación, permitiendo flanquearlo. No es un miniboss. Distribución sabre/artillero/blindado:100/0/0% primer minuto,75/25/0% desde1min,65/25/10% desde2min,55/30/15% desde3min. Cap110, intervalo inicial1s y escalado temporal acotado heredado de Syrup. Recompensas, XP y berries reutilizan los sistemas existentes; XP de zona×4,1. Valores provisionales en catálogo y `content/worlds/baratie.ts`.

Cofres candidatos cada3/24 chunks. Se mantiene la comprobación de superficie libre, apertura3s, recompensas y objeto único. Las superficies libres pertenecen a la red conectada de cubiertas.

## Don Krieg

Arena3072×2176, franja marítima de128px en los límites físicos, centro abierto, mástiles/cobertura, restaurante y banderas. Mismo zoom que exploración, cámara siguiendo al jugador y limitada por arena. Krieg aparece lateralmente para mejorar su visibilidad en móvil horizontal.

PV11475(1,35×Kuro), velocidad130/sprint175. Fases66/33%; se reutilizan HUD minimalista y reglas de presión final: avisos×0,7, mínimo0,35s, movimiento×1,15 y cadencia×0,85. MH5 conserva un mínimo propio de1,2s de aviso y su recuperación no se escala.

| Patrón | Preparación base | Funcionamiento |
|---|---:|---|
| Llança explosiva |0,8s|Cono240px y explosión70px en la punta,45daño como máximo una vez por ejecución|
| Metralladora |1,2s|Siete trayectorias fijas y proyectiles compartidos,32daño,230px/s,850px de recorrido|
| Bombardeig naval |1,6s|Cinco círculos/siete en fase3, radio75px,48daño; posiciones libres y separadas|
| Escut daurat |0,7s|Tres segundos de reducción frontal60%; laterales y espalda conservan daño normal salvo armadura|
| Bombes verinoses |1,5s|Tres explosiones24daño y nubes4s,12daño cada0,8s|
| MH5 |2,6s|Tres sectores separados560×240px, expansión visual y física,5s de gas,18daño cada0,8s; recuperación fija1,5s; cooldown20s|

Fase1: lanza, metralladora y bombardeo. Fase2 añade escudo y bombas. Fase3 añade MH5. Los sectores de gas dejan rutas seguras y la colisión utiliza la misma zona que se dibuja. No hay daño periódico por fotograma ni invulnerabilidad artificial.

Armadura: resistencia separada3000, reducción25% mientras queda resistencia. El daño bruto desgasta la resistencia, sin consumir ni añadir HP del boss. Estado intacto, agrietado por debajo del50% y roto al llegar a0, mediante tinte/grietas/fragmentos. La rotura es permanente para ese intento. Escudo y armadura se combinan multiplicativamente con tope70% de reducción; no hay segunda barra de HUD. Robavida y procs usan el daño real después de las defensas.

## Arte y límites de esta entrega

Cuatro actores y cuatro props nuevos, con procedencia en `asset-register.md` y manifiesto de recortes. Los perfiles direccionales comparten poses sin invertir las armas de mano. Se reutilizan poses de reposo, dos pasos y ataque para animaciones funcionales de caminar, preparar, disparar, defender, gas, daño y caída; no son once secuencias artísticas definitivas. Los acabados de las cubiertas y el equilibrio requieren partidas reales.

No se modifican los mapas ni datos de Morgan/Buggy/Kuro, el HUD general, controles, entrenamiento o tienda. No se añaden dependencias, red, inventarios ni sistemas de guardado nuevos.
