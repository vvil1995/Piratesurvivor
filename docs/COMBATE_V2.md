# Combate v2 — referencia vigente

Este documento aplica la nueva instrucción: seis exclusivas y cuatro buffs por personaje; máximo seis exclusivas + dos buffs aprendidos, cuatro ranuras con hasta cuatro componentes. Sustituye catálogo de diez exclusivas y agrupaciones como cadenas por defecto. Agrupar conserva movimientos independientes; futuras recompensas de caps no están fijadas.

## Fase A: auditoría de0.5

Reutilizar Run, RNG inyectable, cooldown por estado, niveles1–6, filtros de cartas, stats centralizados, pools, geometría y atlas. Limitaciones: ataques y espacios eran la misma lista; solo cuatro estados; sin aprendizaje pendiente ni buffs; sin proyectiles/efectos persistentes compartidos. No reescribir movimiento, mundo o persistencia. No confundir repetir el patrón de un ataque con implementar treinta habilidades.

## Reglas nuevas

- Estados de habilidad planos por ID, asignación separada a cuatro ranuras. Ningún componente duplicado. Reagrupar mueve referencias de IDs sin recrear estados ni reiniciar reloj/ráfaga/nivel.
- Máximo dos buffs distintos aprendidos durante toda la Run, aunque se agrupen. Cada uno mejora individualmente hasta6 y deja de ofrecerse al máximo.
- Buff solo: duración y descanso, activación automática. Agrupado con otro componente: aporte constante menor. Modificadores recalculados en una fuente única, con topes globales existentes.
- Perfil de buffs expresamente **provisional**, no números definitivos: intensidad temporal inicial12%, constante6%, escalado por nivel; duración3–5,5s y descanso12s. Parametrizado en content/buffs.ts para reemplazar sin cambiar motor. Frenesí actúa sobre ataques, no genera un bucle acelerando su propia recarga.
- Aprender con ranuras llenas abre gestión antes de consumir la carta. Solo confirmar con sitio válido. Cancelar vuelve a las cartas. Pausar congela timers. La interfaz no inventa premios de caps ni consume berries.
- Niveles/+ pertenecen a cada componente. Las estadísticas permanentes siguen separadas del combate. Buffs, ranuras y niveles se reinician por Run.

## Validación incremental

B: tipos/estados, límites y buffs. Compilar y probar objetos conservados, temporizadores, dos buffs, estados constantes sin acumulación.
C: transacción de aprendizaje y gestión táctil. Probar quinta habilidad, cancelación, límite4 por ranura, separación y ausencia de reloj mientras se gestiona.
D: seis técnicas de Luffy y geometría de Gatling en cono. Balloon defensivo y Axe diferido necesitan ejecutores de defensa y áreas, no nombres pintados sin efecto.
E: HUD por ranura y detalle de componentes, modo temporal/constante y niveles. Pruebas Chromium de escritorio/móvil y artefacto autónomo.
F: contenidos de los demás personajes sobre ejecutores compartidos, marcando adaptaciones. Hasta decidir acceso de pruebas, conservar Luffy como único personaje del menú sin saltarse reclutamiento futuro.
G: números de ensayo, pruebas de sesiones y rendimiento. No llamar definitivos a cooldowns/intensidades ni afirmar FPS físicos sin medición.

## Fita0.6 — A–E verificadas

Motor/ranuras/buffs y transacción pendientes probados con tests de núcleo; TypeScript y build correctos por fase. Suite completa de interfaz:24 aprobadas y2 omisiones de controles móviles en escritorio. Prueba de ocho movimientos, límite de dos buffs, modo constante, agrupación táctil y pausa del reloj. La quinta carta no se pierde; cancelar devuelve las opciones.

Luffy tiene Balloon (mitigación temporal/repulsión; +refleja proyectiles) y Axe (marca/retardo; +onda), y Gatling es ahora cono. Pistol1,5s, Gatling5s y Balloon12s son valores de ensayo de la referencia del usuario, no balance final. Resto de datos siguen configurables. Proyectiles limitados a96 y áreas a24; muerte limpia ambos. Variante de marine con rifle disponible por datos tras90s (peso20%) permite probar defensa real; no constituye catálogo completo de facciones.
