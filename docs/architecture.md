# Arquitectura

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
