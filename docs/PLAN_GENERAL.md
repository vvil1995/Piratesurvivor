# Plan general y decisiones aprobadas

## Alcance de esta entrega (0.3, fase 1A–1C)

Evolucionar 0.2 sin rehacerlo: definición de Shells Town, mundo infinito por chunks, obstáculos sólidos, colisiones, generación válida y navegación compartida de enemigos. Conservar Luffy, ataque, XP, selección de mejoras, controles y guardado existentes. Eliminar victoria automática por tiempo de este modo de exploración. No implementar personajes nuevos, reclutamiento, cofres, inventario, berries de enemigos, caps, navegación entre islas ni multijugador en esta fase.

## Decisiones de producto

- Cinco personajes iniciales previstos: Luffy (gratuito), Zoro, Nami, Usopp y Sanji. La taverna costará 1.000 berries por reclutamiento aleatorio entre personajes pendientes, sin duplicados. Con toda la plantilla obtenida no se cobrará otro reclutamiento. No hay compras con dinero real.
- Los enemigos dejarán berries persistentes. Nivel, ataques y objetos de la build se reinician por partida. La economía antigua del prototipo se conserva por compatibilidad en 0.3; no equivale aún al futuro sistema de berries.
- Cofres pequeños destructibles con recompensas modestas. Grandes: permanecer cerca unos tres segundos y obtener objetos especiales, preferentemente eligiendo entre tres opciones.
- Inventario de seis objetos independiente de hasta cuatro ataques. Objetos con hasta tres niveles y modificadores de velocidad, daño, defensa, regeneración, cooldown, alcance y crítico. Límites y orden de aplicación se equilibrarán en la fase correspondiente.
- Cooperativo futuro de 1–4 jugadores: DPS, tanque, soporte y control. Identidad de actores, entrada y atribución de daño explícitas; nada de red, salas o sincronización en esta entrega. Reparto de XP/botín y pausa cooperativa pendientes de diseño.
- East Blue: Shells Town/Morgan → Orange Town/Buggy → Syrup/Kuro → Baratie/Don Krieg → Arlong Park/Arlong. Sin requisitos de nivel ni transición por cronómetro; abandonar la isla es voluntario tras derrotar su jefe.
- Roger inmortal tras completar esas cinco islas en la misma partida. El intento termina al morir. Sin acceso directo ni desbloqueo permanente que omita el recorrido. Récords por personaje, recorrido y versión de reglas; daño y supervivencia separados.
- Encuentros opcionales mediante cartas náuticas, ignorables y reaparecibles. Catálogo finito de jefes y escenarios, con retorno y recompensas definidos.

## Secuencia posterior

1. Base: mundo, colisiones y navegación (entrega actual).
2. Combate: XP escalada por isla; Pistol, Gatling, Bazooka y Whip; pasivas; diferencia explícita entre habilidades equipadas, cadenas y evoluciones.
3. Campaña: Morgan y primera transición; luego cada isla y facción, verificadas individualmente.
4. Exploración/recompensas: encuentros, cofres, inventario, berries y reclutamiento. La economía persistente debe quedar validada antes de habilitar la taverna.
5. Roger: arena, daño acumulado, invocaciones, dificultad creciente, resultados y récords.
6. Pulido y equilibrio continuo: arte, animación, carga, accesibilidad, memoria, FPS y partidas reales completas.

Cada fase produce versión jugable, pruebas automatizadas y una lista explícita de validación en dispositivos. Arabasta, Skypiea y cooperativo quedan para ampliaciones. No se introducen anuncios, monetización ni backend.

## Contratos de ampliación

La definición de mundo aporta identidad, generación, población y presupuestos. La simulación registra actores por ID; `player` solo identifica al actor controlado localmente para la UI. Sistemas de ataque y navegación reciben actor/objetivo/mundo explícitos. Los eventos visuales identifican su autor. Las mejoras pertenecen al actor. Esto prepara integración futura, sin afirmar que exista cooperativo ni simular reglas de reparto todavía.

El futuro esquema de guardado separará perfil (berries, personajes, ajustes, récords) del estado de partida (actores, build, inventario, islas y encuentros). No se crean slots vacíos ni botones ficticios en 0.3. Se preservarán las partidas guardadas v1 al introducir esa migración.
