# Arquitectura

## Estado actual0.15

La descripción histórica de0.1 que sigue ya no limita el contenido: hoy hay cinco personajes de beta, mapa por chunks, ataques por comportamientos, Morgan/Buggy y navegación por cartas. `game/core` y `systems` siguen sin Phaser/DOM/storage.

`content/training.ts` define costes/límites/efectos del entrenamiento; `SaveStore` conserva perfiles independientes y valida/migra guardados v1. Run recibe el perfil como datos, calcula modificadores permanentes y configura ataques iniciales/vetos/cambios. UI de entrenamiento en HTML/CSS (`ui/training.ts`). XP y moneda aplican sus multiplicadores al recoger, guardando moneda entera por diferencia. No hay otra progresión permanente de poder.

`ui/ability-art.ts` compone miniassets originales y los comparte con la escena vía rasterizeArt; no se descargan recursos. Las poses aprobadas no cambian. Visuales ofensivos siguen al actor y no son hurtboxes. Uniones solo con recompensa de jefe; cartas llenas filtran a pasivas. PROBAR.md es la guía actual y VALIDACION.md contiene evidencias reales.


Flujo: puerto → partida → pausa / mejora / resultado → puerto o nueva partida.

`Run` contiene el estado de una sola batalla y recibe vectores de movimiento y pasos de tiempo. Es TypeScript sin Phaser ni DOM. El tiempo avanza solo en `playing`; el estado termina en `defeat` o `victory`. Un nivel pendiente se procesa después de elegir la mejora actual, sin perder XP acumulada.

`BattleScene` crea las texturas originales una sola vez, mantiene sprites preasignados y dibuja el estado de `Run`. Acumula pasos fijos de 1/60 s, con un máximo de 0,1 s de recuperación por frame. Al ocultar la pestaña, el controlador pausa y libera entrada; el juego no intenta recuperar minutos de simulación perdidos.

La UI HTML abre diálogos y envía acciones a `Run`. El HUD se actualiza aproximadamente diez veces por segundo. Los eventos de UI se conectan una vez; reiniciar crea una nueva simulación pero conserva la escena y sus pools visuales. Los diálogos usan foco contenido y controles nativos.

`SaveStore` guarda progreso agregado y ajustes, nunca entidades o escenas. Su formato tiene versión y se valida al leer/importar. Mantiene una copia anterior conocida y tolera fallos sin impedir jugar. El resultado de una batalla lleva un ID para evitar premiarlo dos veces durante el flujo normal. No es un sistema antitrampas ni sincronización concurrente entre pestañas.

## Añadir contenido

- **Personaje:** añadir definición con stats, habilidad inicial e identificador visual. Incorporar selección en UI cuando haya un segundo personaje y política de desbloqueo. La presentación actual está diseñada solo para Luffy.
- **Ataque:** declarar definición y ejecutor en systems/combat. El catálogo actual solo admite comportamiento melee. Extender el tipo y despachar por comportamiento para incorporar proyectiles/áreas; nunca por nombre del personaje.
- **Evolución:** registrar receta en EVOLUTIONS y añadir resolución de requisitos y tarjeta. El array está vacío deliberadamente: las evoluciones quedan para fase 6.
- **Enemigo:** definición en el catálogo y estrategia de comportamiento/generación. En esta versión el generador produce solo marines de persecución.
- **Mapa:** separar el catálogo de mapa y su constructor visual cuando se añada el segundo. Los límites y el generador actuales usan MARINEFORD; la sustitución requiere pasar la definición a Run y a la escena. No existe todavía un editor de mapas.
- **Sprites:** sustituir createTextures por carga de atlas y animaciones manteniendo claves visuales y ancla en los pies.

Las áreas de catálogo se mantienen en un archivo pequeño en 0.1; pueden dividirse en carpetas al crecer. Esta estructura ofrece puntos de extensión sin implementar anticipadamente un editor, ECS, red o sistema genérico de plugins.

## Separación de propiedad intelectual

Las estadísticas y los sistemas no consultan nombres de personajes. La ficha y los textos del HUD sí son contenido de Luffy y deberán moverse a sus definiciones cuando exista selección de personajes. Las claves de texturas enlazan el contenido con la vista; se pueden reemplazar por personajes propios. Sustituir arte o nombres no autoriza por sí mismo la distribución de elementos protegidos.

## Presentación 0.2

El atlas PNG original se carga embebido y `rasterizeArt` prepara texturas normalizadas compartidas por escena e interfaz. Los nombres de textura se mantienen separados de las estadísticas. El paso de caminar y la pose de ataque son visuales; no alteran el sistema de colisiones.

`MobileOrientation` controla el aviso de giro y solicita fullscreen/landscape solo tras un gesto de usuario. La pausa existente se utiliza al entrar en vertical. Un ResizeObserver fuerza a Phaser a medir el parent después del cambio real de dimensiones para evitar deformar la imagen. El puerto sigue siendo adaptable en vertical.

## Mundo procedural 0.3 (fase 1A–1C)

`content/worlds/shells-town.ts` define identidad, población, semilla y presupuestos. `Run` recibe una definición y semilla opcionales; no importa reglas de Marineford ni finaliza por cronómetro. Se conserva el catálogo de personaje/ataque existente.

`generator.ts`: chunks de 16×16 tiles de 32 unidades (512×512). Un hash de semilla/coordenadas decide distrito y variantes; calles centrales de 128 unidades y perímetros libres conectan parcelas y chunks. Los edificios son sólidos por su planta, no por el tejado; las copas de árboles pueden ocultar actores que pasan detrás del tronco. Las habitaciones en U tienen entrada. No se almacenan chunks visitados en el guardado.

`ProceduralWorld`: caché máxima de 128 chunks con expulsión y regeneración determinista. Colisiones de círculos contra celdas sólidas; movimiento por ejes en pasos de hasta 6 unidades y línea de visión con margen. El combate y el retroceso consultan el mismo mundo. El suelo no cambia con el reloj.

`FlowField`: campo BFS local de 81×81 celdas por objetivo, actualizado como máximo unas 3 veces por segundo mientras el objetivo cambia de celda; puede actualizarse antes si se desplaza bruscamente. Los marines recalculan dirección por turnos aproximadamente cada 0,13–0,20 segundos. Persecución directa con línea libre; ruta compartida si hay obstáculos. La separación local nunca mueve directamente a un vecino a través de sólidos. Enemigos alejados se reciclan sin recompensas.

`WorldRenderer`: imágenes del suelo basadas en canvases de 256×256, reutilizadas al descargar chunks, más sprites reutilizables de obstáculos. Dibuja área visible y un anillo de margen. El zoom limita el lado visible a 1800 unidades; como máximo 49 slots para cualquier relación de pantalla. El render resta un origen local múltiplo de 512, evitando pérdida de precisión de GPU en viajes largos. Coordenadas lógicas no se acotan.

`Run.players`: registro por ID. Entrada por actor, mejoras pertenecientes al actor y golpes/XP con atribución explícita. El acceso `player` es una comodidad para la UI del actor local. No existe implementación online; aparición por múltiples cámaras, propiedad de red, reparto de XP y pausa de grupo siguen pendientes.

El guardado v1 admite ahora tiempos superiores a 600 segundos. Se mantiene el formato, copia anterior, exportación y datos antiguos; no se migra a la economía futura ni se borra progreso. Los resultados aún usan el botín antiguo del prototipo. Los contratos y decisiones de producto están en PLAN_GENERAL.md.

## Combate 0.4 — primer bloque pendiente del plan

`content/attacks.ts` contiene cuatro técnicas de Luffy con seis configuraciones por técnica. El estado equipado (`id`, nivel, cooldown y ráfaga pendiente) pertenece a Run; el perfil local no guarda ataques. `systems/loadout.ts` valida catálogo por personaje, máximo cuatro espacios y máximo seis niveles. El nivel6 deriva la evolución + de los datos: no hay recetas ni objetos requeridos.

`tickAttacks` avanza temporizadores por técnica y emite eventos visuales limitados por el presupuesto existente de12. Gatling programa impactos separados y vuelve a elegir objetivo; no simula tres golpes simultáneos ni representa una cadena de habilidades. `attack` calcula línea/perforación, cono, barrido y onda secundaria con colisiones/línea de visión y atribución de bajas. El daño no depende del nombre del personaje.

Las cartas añaden aprendizaje/mejora a las pasivas existentes y filtran espacios/máximos. El HUD mantiene cuatro nodos, reconstruidos solo al cambiar Run/build; no se recrea por frame. Los efectos usan Graphics e iconos propios existentes, sin nuevas imágenes ni dependencias. Pistol+ perfora fila, Gatling+ combina seis disparos y dos impactos por disparo, Bazooka+ onda secundaria, Whip+ giro completo. La ráfaga gana golpes también en niveles3 y5.

No se altera el formato v1, entrenamiento antiguo ni economía en este bloque; resolver de estadísticas con topes y reglas temporales nuevas es el punto2 del orden acordado. Tampoco se añaden enlaces, objetos, frutas, jefes o selección de personajes.

## Estadísticas0.5

`content/stat-rules.ts` concentra topes y multiplicador crítico. `systems/stats.ts` resuelve base+fuentes y aplica protecciones al recibir daño, regenerar y calcular intervalos por técnica. `Player.stats` es el resultado efectivo; `baseStats` conserva la base y `modifiers` las contribuciones. Recalcular no suma dos veces ni cura implícitamente. Cambiar/reemplazar una fuente elimina su efecto anterior; los contenedores de objetos/fruta están vacíos hasta sus fases.

`applyUpgrade` suma un modificador temporal y recompone. Solo la carta de vida cura20. Defensa y críticos tienen efecto real en combate; el RNG procede de Run y es inyectable para pruebas. El mínimo de intervalo se aplica sobre el ataque base, de modo que nivel6 no permite saltar el tope50%. Regeneración limitada por vida y máximo absoluto, pero sus elecciones permanecen ilimitadas. Cartas finitas al tope no se ofrecen. No se serializa esta build en el perfilv1.
