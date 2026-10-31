# Cómo probar la beta0.15

## Abrir el juego

En ordenador, descomprime el paquete y abre `One-Piece-Survivor.html`: funciona sin herramientas, internet ni cuenta. `index.html` es la variante para servidor estático y necesita su carpeta `assets/`; no abrir esa variante por doble clic. En móvil, usar la URL HTTPS de Netlify: algunos gestores de archivos solo previsualizan el HTML sin ejecutarlo. Sin Firebase, Supabase ni backend.

Los dominios de previews y producción guardan progreso por separado, igual que `file://`. Para transferirlo usa **? → Exportar progreso** e importar después en la otra URL. Importar sustituye el progreso actual. No se sincroniza entre dispositivos y una batalla en curso no se recupera al cerrar. Borrar datos del navegador elimina el guardado local.

## Controles

| Acción | Ordenador | Móvil |
| --- | --- | --- |
| Mover | WASD/flechas | Arrastrar en zona izquierda |
| Ataque seleccionado | Automático | Automático |
| Cambiar ranura | Clic o1–4 | Tocar cuadrado inferior |
| Elegir mejora | Clic/Tab/Enter | Tocar carta |
| Pausa | Esc/P/botónⅡ | BotónⅡ |
| Uniones/detalles | Icono de enlaces | Mismo icono |

La batalla móvil se juega en horizontal. Girar, cambiar de pestaña o aplicación pausa la partida, incluida una travesía; reanudar requiere una acción explícita. En iPhone puede no permitirse bloquear el giro automáticamente: gira físicamente y desactiva el bloqueo de orientación. Pantalla completa solo cuando el navegador ofrece esa API.

## Ataques, cartas y uniones

Cada técnica tiene icono propio. Solo ataca la ranura seleccionada. Aprender otra no la combina ni activa automáticamente. Cada técnica llega a6 y evoluciona a+; máximo dos buffs distintos aprendidos. Un buff individual alterna actividad/descanso; combinado aporta efecto constante menor cuando su grupo está seleccionado.

Mientras haya una ranura vacía, las cartas pueden ofrecer habilidades nuevas o mejoras de las aprendidas, además de pasivas. **Con las cuatro ocupadas solo aparecen pasivas**, incluso aunque los ataques no estén al máximo. No aparece una quinta habilidad ni concede unión gratuita. Vida temporal:+20HP y cura20; regeneración moderada, ambas sin límite de elecciones, con topes globales del efecto. Las demás pasivas tienen límites.

Vencer a Morgan otorga un **objeto de unión de ataques** (nombre provisional); los siguientes jefes también. No ocupa el espacio de equipo. Su cantidad se ve en el icono de enlaces. Toca el icono, elige primera carta y luego segunda: consume uno y agrupa sus componentes, conservando niveles y cooldowns. Máximo cuatro componentes por ranura. Cancelar antes de elegir la pareja no gasta el objeto. La unión puede dejar un hueco y vuelven a ofrecerse habilidades mientras ese hueco exista. No se guarda entre partidas.

## Entrenamiento permanente

En el puerto elige personaje y pulsa **ENTRENAR**. Panel de estadísticas con icono, efecto por nivel, segmentos, nivel/máximo y coste siguiente. Las compras son independientes por personaje y gastan berries. El nivel permanente mostrado es1 más la suma de niveles comprados, no una barra de XP permanente. Es la única vía de mejora permanente del poder. Se conservan también berries y récords.

Coste de cada estadística: redondeo al siguiente múltiplo de5 de `base × crecimiento^nivelActual`. Datos modificables en `content/training.ts`; precios provisionales. Primeros costes: Vitalidad30, Fuerza35, Imán25; los siguientes crecen. Regeneración:+0,04HP/s por nivel, deliberadamente moderada. Límites combinados: defensa60%, reducción de cooldown50%, velocidad+75%; regeneración≤0,5%HP máximo/s y≤3HP/s. Las compras no ignoran esos límites.

Entrenamiento permite comprar cambios de cartas por partida, capacidad de vetos, elección del ataque inicial y repertorio para empezar con dos distintos. Configura ataques/vetos en la parte inferior. No se puede vetar un ataque inicial ni repetir ambos. Los cambios de cartas se reponen al comenzar otra partida. Los vetos configurados no aparecen en las cartas. Los personajes siguen disponibles para beta sin taverna.

Guardados anteriores: los niveles de entrenamiento antiguos de Luffy se convierten en niveles de Vitalidad, sin volver a cobrar; el nuevo efecto es+8HP por nivel. Se mantienen berries y récords. Los otros personajes empiezan sin compras. No existe además el antiguo botón de+5HP.

## Botín y daño

- Barriles de madera: se rompen atacándolos, dan berries, poca XP y posible muslo de ave curativo. Su densidad candidata es1/3chunks, el doble que antes.
- Cofres grandes dorados: mismo candado/círculo de3s; alejarse pausa, volver continúa. Densidad candidata1/32chunks, triple que antes. Botín directo: más berries/XP, posible objeto y fruta rara. No dan cartas propias; la XP sí puede provocar la subida normal.
- Un solo objeto equipado junto a los ataques: tocar para consultar. Otro objeto permite conservar o sustituir, quitando el efecto anterior.
- Comida: muslo con hueso, cura y da1XP base. Aproximadamente10% de enemigos pueden dejarlo.
- Radio base:105px (Nami120), también atrae comida. La atracción no atraviesa paredes. Boni de Imán/objeto se suman con topes.
- Proyectiles hostiles: estela roja con centro claro/contorno oscuro. Un aviso breve distingue CONTACTO, PROYECTIL o el patrón del jefe cuando realmente baja la vida. La pierna/brazo extendido no forma parte de la hurtbox.

Cofres/barriles tienen identidad e historial por isla: alejarse, volver o reintentar un jefe no regenera recompensas. Hay límites de pools e historial. Berries solo se guardan al recogerlas. Fortuna acumula fracciones durante la partida, guardando unidades enteras sin duplicarlas al terminar.

## Morgan, Orange y Buggy

Sobrevive hasta05:00 en Shells. Entre05:00 y05:45 puede aparecer una carta náutica cercana sobre terreno alcanzable. Camina encima para viajar3s en barco a Morgan; se pausa reloj/combate/cooldowns. Puedes ignorarla: se programará otra. Nivel20 orientativo, sin requisito. Aprende rectángulo, barrido, carga, refuerzos y onda; usa cobertura y esquiva las zonas rojas.

Perder en Morgan devuelve al mismo Shells con25HP,2,5s de gracia y build conservada; otra carta45–90s después permite reintentar. Vencer concede objeto de unión, registra victoria y lleva automáticamente a Orange sin curar. En Orange hay piratas básicos, tiradores y resistentes; desde cinco minutos en esa isla puede aparecer la carta de Buggy.

Buggy: cuchillas por corredor, bomba fijada al suelo, barrido, cuerpo desmontable hacia círculo anunciado, refuerzos y bombardeo triple. Fases65%/30%. Perder devuelve a Orange con25HP/build; ganar concede unión y viaja a Syrup sin curar. Syrup es llegada provisional con enemigos: Kuro, Baratie, Arlong y Roger siguen pendientes. Morir explorando sí termina la partida y reinicia nivel/build, conservando solo progreso permanente.

## Qué comunicar al probar

Dispositivo, Android/iOS, navegador/versión, orientación, versión visible de la beta, minuto y pasos para reproducir. Revisar especialmente origen de golpes al desplazarse, lectura de proyectiles, compra/recarga de entrenamiento y cartas al llenar cuatro ranuras. No se han medido FPS ni confirmado Safari/teléfonos físicos desde el entorno de desarrollo.
