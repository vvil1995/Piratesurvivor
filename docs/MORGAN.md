# Morgan — primer combate de campaña

Desde05:00 de partida puede aparecer una carta náutica sobre suelo alcanzable en Shells Town (demora inicial0–45s). Caminar sobre ella inicia una travesía de3s hacia la arena. No existe acceso por botón ni desde el menú. Nivel20 orientativo, sin bloqueo. Puedes ignorar la carta: tras90s o al alejarte, se programa otra oportunidad. Esta decisión0.13 sustituye la navegación manual anterior.

## Arquitectura

- `content/bosses/morgan.ts`: HP, velocidades, secuencias, umbrales, dimensiones, daños, avisos, recuperaciones y refuerzos.
- `game/bosses/telegraphs.ts`: formas genéricas y colisión geométrica, preparación/aviso final/impacto, sin Phaser.
- `game/bosses/morgan.ts`: envoltorio del perfil original de Morgan. Desde0.14, `pattern-encounter.ts` comparte secuenciación, colisión y tiempos de simulación con Buggy; sin timers DOM.
- `game/world/arena.ts`: mundo de colisiones y chunks de piedra, muros y dos coberturas. Usa movimiento/segmentos existentes.
- `game/scenes/boss-renderer.ts`: formas a partir de la misma zona del motor y representación original provisional del jefe.
- `content/navigation.ts` y `game/systems/navigation-signal.ts`: ventanas aleatorias, una carta activa, recogida y reaparición; sin timers de navegador.
- `Run`: entrada, integración con impactos existentes, refuerzos, victoria y navegación. El jefe no es un marine con HP ampliado.

## Reglas

Morgan tiene4200HP provisionales. Fase1>65%,fase2>30%,fase3≤30%. Preparaciones1,2/1,4/1,5/2s; la cadencia de fase solo reduce recuperación, nunca recorta esos avisos. Cada advertencia fija origen, ángulo y dimensiones una vez. Se evalúan los pies del jugador al impactar, sin margen invisible adicional. Los avisos se dibujan sobre actores, decoración y efectos; la UI mantiene libre el centro.

La carga y la onda anuncian la trayectoria libre según cobertura. El movimiento/colisión efectivo sigue esa trayectoria y no reorienta. La onda se desplaza: solo daña donde se encuentra, una vez por jugador. El golpe y la escombrada no repiten daño cada frame. Cobertura protege de carga/onda; no garantiza bloquear un barrido cuerpo a cuerpo. Carga contra obstáculo:2s aturdido. En recuperación el jefe queda expuesto. Los estados de control no lo bloquean indefinidamente; Nami mantiene robo único.

Refuerzos: hasta4 por orden, máximo5 vivos; puertas marcadas y elección de entradas a≥110px del jugador. No hay oleadas del explorador dentro del combate. El campo de navegación del jefe utiliza su radio25px, no el radio14px de los marines/jugador, para evitar encallarlo en las cajas. Su persecución acelera si se alarga; la arena impide huida infinita.

## Victoria y navegación

Sin curación automática. Muerte de Morgan: cancelar avisos/onda, eliminar refuerzos y proyectiles, animación breve de caída, registrar victoria local una sola vez por partida y conceder una oportunidad de agrupación. No termina la campaña ni se registra como victoria completa de East Blue.

Después de1,3s de caída empieza automáticamente la travesía hacia Orange Town. El barco dura3s, pausa combate/reloj/cooldowns y admite pausa/reanudación o interrupción por giro/cambio de aplicación. La transición conserva HP actual, nivel/XP, habilidades/niveles, ranuras, cooldowns, buffs y objetos. Se limpian objetivos y peligros del escenario anterior. Nueva partida reinicia la victoria de campaña.

Orange Town tiene terreno procedural de paleta cálida y tres variantes provisionales de piratas de Buggy: básico, tirador y resistente, con datos de XP y dificultad propios. Su presión por tiempo comienza al llegar. Desde0.14 incluye a Buggy mediante su propia carta y arena; ver BUGGY.md. El resto de East Blue sigue pendiente y Syrup es solo llegada provisional.

Perder contra Morgan no termina la partida: cancela sus peligros, vuelve en barco al mismo Shells Town y deja25HP, con2,5s de gracia y build/berries conservados. El historial de cofres no se reinicia. La siguiente oportunidad se programa45–90s de juego después; otro intento crea un Morgan completo. Morir explorando sí termina la partida. No hay penalización ni recompensa de victoria por perder contra Morgan.

## Pendiente de equilibrio y arte

HP/daño/cadencia son configurables y requieren partidas humanas con los cinco personajes. Morgan, destral, barco y cajas son pixel art geométrico original provisional, no sprites oficiales. No se afirma acabado artístico definitivo ni FPS en dispositivos físicos. El control táctil y las distintas relaciones de pantalla se verifican mediante pruebas de navegador cuando el entorno lo permite; Safari real sigue pendiente.
