# Plan maestro — modo individual

Actualizado con las últimas decisiones del usuario. Sustituye el plan anterior de 1.000 berries, evoluciones por recetas y preparación específica de cooperativo. Estado auditado: commit 5e198bf; nuevos atlas direccionales posteriores documentados en AUDITORIA_FASE_0.md.

## Reglas de producto

- Trabajar sobre TypeScript, Phaser 3 y Vite existentes. Solo modo individual; no añadir red, servidores, salas ni arquitectura anticipada de cooperativo. No retirar el registro de actores existente por motivos cosméticos.
- Cinco personajes: Luffy gratuito; Zoro, Nami, Usopp y Sanji reclutables sin duplicados, mismo precio. Estadísticas, pasiva, entrenamiento y récords por personaje. Técnicas propias hasta Arlong Park; no Gears, Clima-Tact ni Diable Jambe.
- Catálogo objetivo de diez ataques por personaje, cuatro equipados. Seis niveles por ataque: 2–5 modifican su comportamiento, 6 evoluciona automáticamente a «+», sin objetos ni recetas. Los máximos no vuelven a ofrecerse. No implementar los 50 a la vez.
- Cadenas ordenadas de hasta cuatro ataques, con retardos, independientes de los espacios equipados. Se obtienen en encuentros opcionales y llegan después de equilibrar el combate básico.
- Tres cartas por nivel con pausa: nuevo ataque si hay espacio, mejora de equipado o pasiva temporal. Vida: +20 HP máximos y cura 20, sin límite de elecciones; regeneración: elecciones ilimitadas con incrementos pequeños. Otras pasivas con límites configurables.
- Cuatro ataques, seis objetos (tres niveles por objeto) y una fruta son sistemas independientes. Se pierden con el nivel, XP y pasivas temporales al terminar la partida.
- Única mejora permanente de poder: entrenamiento de estadísticas comprado con berries, individual por personaje. Perfil conserva también berries, reclutas, ajustes y récords. Sin talentos ni frutas permanentes.
- Exploración procedural infinita por isla; capitanes en arenas delimitadas con cobertura, señales de ataques y rutas sin bloqueos explotables. El jugador elige cuándo entrar al combate.
- East Blue: Shells Town/Morgan → Orange Town/Buggy → Syrup/Kuro → Baratie/Don Krieg → Arlong Park/Arlong. Tras vencer, navegación voluntaria. Sin nivel mínimo, reloj obligatorio ni curación al viajar; conservar vida, build y nivel. Objetivo de dominio: 30–45 minutos hasta Roger, sujeto a pruebas.
- Roger inmortal en arena delimitada, agresivo y con presión creciente e invocaciones. Puntuar daño y supervivencia por separado, guardar build/personaje/caps derrotados. Sin muerte automática por tiempo. Cuatro minutos deben ser excepcionales. Sin acceso directo desde menú: repetir East Blue en cada intento.
- Frutas temporales adicionales incluso para Luffy: una activa, aceptar/sustituir/ignorar, sin compras, niveles permanentes ni espacios de ataque/objeto. La excepción narrativa es deliberada. Catálogo y probabilidades pendientes de validación, no contenido ya existente.
- Mantener estética detallada del atlas v2 aprobado. Nuevos atlas derivados como referencia visual: ocho orientaciones y dos pasos para los cinco personajes previstos y un marine. No sustituirlos por sprites geométricos. Solo Luffy/marine se cargan y son actores actuales; preparar gráficos no implementa personajes.
- Sin backend, telemetría, anuncios, monetización ni sagas adicionales.

## Estado y fases verificables

La fase 1 ya está implementada parcialmente; no se reconstruye por cambiar la numeración.

| Fase | Entrega pequeña | Criterio antes de avanzar |
|---|---|---|
| 0 — auditoría actual | Inventario real, contradicciones y plan de migración; corrección visual solicitada | Check, núcleo y build; navegador para corrección visual; distinguir pruebas físicas pendientes |
| 1A — consolidar mundo existente | Congelar semillas de regresión, revisar colisiones, navegación y variedad | Recorrer ida/vuelta, sin huecos aislados ni actores en sólidos |
| 1B — móvil y duración | Medir sesión 20–30 min, rotación y reinicios en Android/iOS reales | Sin crecimiento sostenido; objetivo 30 FPS sostenidos en dispositivo definido, no afirmado sin medir |
| 1C — presentación | Mantener atlas aprobado; corregir oclusión/legibilidad y continuidad al cruzar chunks | Capturas y revisión humana; no regresión a arte geométrico |
| 2A — ataques y HUD | Cuatro espacios; Pistol, Gatling, Bazooka y Whip primero; datos de niveles 1–6 | Equipamiento, cooldown por ataque, límites, pausa, efectos y XP existentes conservados |
| 2B — cartas y estadísticas | Mezclar ataques/pasivas, resolver bonificaciones y topes; mejorar barra XP existente | Tres opciones válidas, nivel 6 desaparece, vida cura exactamente 20, reinicio limpia build |
| 2C — equilibrio Luffy | Evoluciones + reconocibles y efectos diferenciados; sesiones de builds | Shells Town resulta jugable antes de crear los otros personajes |
| 3A — berries | Drops recogibles, reglas por isla, guardado y migración v1 | No premio por esperar; recogida contabilizada una sola vez; guardado tolerante a errores |
| 3B — cofres/objetos | Cofres pequeños destructibles; grandes con apertura pausada de 3s; seis objetos | No reaparecen al descargar chunks; tres opciones válidas o compensación explícita |
| 3C — entrenamiento | Estadísticas comprables de Luffy, costes, límites y UI | Migración conserva progreso y no cobra dos veces |
| 4A — Morgan | Arena con cobertura y patrones propios, entrada voluntaria, resultados | Posible vencer y morir sin bloqueo; ataques anunciados |
| 4B — salida y transición | Vaixell voluntario y contrato de transición | Conservar HP/build; no mostrar una isla futura ficticia como contenido completo |
| 5 — personajes/taverna | Incorporar uno por uno y validar sin duplicados | Todos viables en Shells Town y progreso independiente |
| 6 — East Blue | Una isla completa por entrega, después la siguiente | Enemigos, XP, jefe, transición y regresiones de las anteriores |
| 7 — frutas/encuentros | Primera fruta, después catálogo; cartas y enlaces después | Sin efectos acumulados de fruta sustituida ni enlaces gratuitos al equipar |
| 8 — Roger | Arena, inmortalidad, invocaciones y récords | Acceso solo tras campaña actual, daño atribuido y supervivencia sin fin artificial |
| 9 — pulido | 50 ataques progresivamente, costes, audio autorizado, rendimiento y posible reanudación | Sesiones completas en equipos físicos, todos los personajes |

Se espera validación al terminar fases importantes según la última orden. No comenzar ahora fase 2 ni sistemas económicos: esta entrega es fase 0. Se permiten arreglos rutinarios y pruebas dentro de lo autorizado sin consultas por archivo.

## Propuesta económica inicial — no implementada ni validada

Ingresos de referencia del usuario: primeras partidas ~20, intermedias cientos, avanzadas ~2.000. Son objetivos, no datos observados. La economía actual paga bajas/3 + segundos/15 al terminar; debe sustituirse, no añadirse encima de los futuros drops.

Propuesta de reclutamiento: **1.000 berries por personaje**, revisable antes de fase 5. A 20 por intento equivale a 50 intentos ahorrando todo; a 250 equivale a 4; a 2.000 equivale a medio intento avanzado. 5.000 exige 250 intentos iniciales o 20 intermedios, antes de entrenar: demasiado como punto de partida. Incluso 1.000 exige que entrenamiento inicial barato acelere ingresos; revisar sesiones hasta el primer recluta. No garantizar estos ritmos hasta medir. No cambiar el precio tras compras sin definir compensación.

Entrenamiento propuesto por estadística: siguiente nivel n (1-indexado) cuesta `round5(base × 1.45^(n−1))`, redondeo al múltiplo de 5 más próximo; mismo catálogo de costes por personaje, saldo compartido. Para base 10: **10, 15, 20, 30, 45, 65, 95, 135, 195, 285** (895 total). Para base 20: **20, 30, 40, 60, 90, 130, 185, 270, 390, 565** (1.780 total). Faltan pruebas de retención y ritmo; no son cifras copiadas de PokéSurvivor.

| Estadística permanente | Máximo | Efecto propuesto por nivel | Base coste |
|---|---:|---|---:|
| Vitalidad | 10 | +5 HP | 10 |
| Fuerza | 10 | +3% daño base | 10 |
| Velocidad | 8 | +2% | 20 |
| Cooldown | 8 | −2% al intervalo base | 20 |
| Defensa | 8 | +2 puntos de mitigación | 20 |
| Regeneración | 5 | +0,05 HP/s | 20 |
| Recogida | 6 | +5% radio | 10 |
| XP | 8 | +3% | 20 |
| Berries | 8 | +4% | 20 |
| Crítico | 10 | +1 punto porcentual | 20 |
| Cambios de opciones | 5 | +1 uso por partida | 20 |
| Vetos | 3 | +1 uso por partida | 20 |

Cambios y vetos no se venden hasta que sus acciones estén implementadas. No ofrecer compras sin efecto. El antiguo entrenamiento de cinco niveles requiere migración a vitalidad de Luffy conservando sus +5 HP por compra y saldo; mantener exportación v1 legible. Rango, duración de efecto, empuje y área pertenecen al resolver configurable, sin compras permanentes adicionales no acordadas.

Bonificaciones propuestas: sumar aportes porcentuales por categoría sobre la base y calcular estadísticas efectivas desde fuentes originales, no multiplicar reiteradamente valores ya modificados. Defensa total ≤60%; reducción total de cooldown ≤50% e intervalo mínimo por ataque; velocidad ≤175% de la base; crítico ≤50%, multiplicador inicial 1,5; regeneración efectiva ≤0,5% HP máximos/s. Elegir regeneración sigue permitido tras ese techo; la UI debe avisar si el beneficio efectivo está limitado. HP no tiene techo de elecciones. Ataque temporal +8% (10); defensa +3 puntos (10); cooldown −3% (10); movimiento +4% (8); crítico +2 puntos (10); regeneración +0,02 HP/s sin límite. Estos topes necesitan validación: no equivalen a equilibrio demostrado.

XP propuesta: conservar primero la curva actual y añadir multiplicadores de recompensa por enemigo/isla y una atenuación suave `1 / (1 + (max(0, nivel−nivelReferencia)/5)^2)` por zona. Nunca recompensa cero ni barrera de nivel. Medir ritmo completo 1–80 antes de fijar multiplicadores.

## Integración futura de cofres y guardado

Generar puntos de interés con ID estable `isla/semilla/chunk/slot`, en celdas accesibles y fuera de sólidos. Separar decoración determinista de estado mutable de partida. Descargar un chunk no elimina HP de cofre dañado, apertura parcial ni marca de recompensa consumida. No guardar cofres en el perfil permanente.

El mapa infinito y un registro ilimitado de cofres abiertos son incompatibles con memoria estrictamente acotada. Resolverlo antes de implementar: propuesta de oportunidades finitas por isla/partida (presupuesto configurable, radio de generación de cofres distinto del terreno infinito), con estados compactos. El terreno sigue siendo infinito; no habría cofres ilimitados para farmear. Es una decisión de diseño pendiente, no una limitación oculta.

Recompensa de cofre consumida exactamente una vez aunque se pause con cartas abiertas o se descargue su chunk. Con seis objetos, solo opciones de objetos equipados no máximos. Si quedan menos de tres opciones distintas, usar recompensas de berries/XP/curación explícitas; nunca forzar un séptimo objeto ni ofrecer mejoras máximas.

Separar perfil v2 (berries, reclutas, entrenamiento por personaje, récords, ajustes) de Run (isla, ataques, inventario, fruta, cofres y RNG). Guardar berries recogidos mediante transacciones con ID/contador, no cada frame ni esperar exclusivamente a morir. La reanudación de Run es fase 9; migrar perfil no implica recuperar una partida activa.
