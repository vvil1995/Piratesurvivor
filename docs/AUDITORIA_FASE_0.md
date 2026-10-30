# Auditoría fase 0

Base: 5e198bf, TypeScript 5.9.3 / Phaser 3.90.0 / Vite 6.4.1. Repositorio limpio al iniciar. No se rehace el proyecto. Cambio funcional autorizado durante la auditoría: crear atlas detallados para ocho direcciones de todos los personajes, integrando Luffy y marine; se conservan movimiento, navegación y variedad de mapa.

## Inventario comprobado por lectura de código

- Luffy, un marine y un ataque `elastic-punch`. No hay otros personajes, jefes, cuatro ataques, evoluciones jugables, frutas, cofres, inventario ni campaña.
- Mundo de chunks 512×512, hash por semilla/coordenadas, cuatro barrios y variantes, caché de hasta 128 chunks; regreso reconstruye geometría. Calles centrales conectadas. No es generación de costa/puerto/interiores ni una isla con puntos narrativos.
- Obstáculos sólidos, deslizamiento por ejes, pasos cortos contra túnel, línea de visión y retroceso. BFS local 81×81 compartido, seguimiento directo cuando la ruta está libre y separación local.
- Cámara, origen local para dibujo lejano, slots de suelo reutilizados (hasta 49), 150 enemigos, 180 pickups XP y 12 golpes visuales.
- Movimiento WASD/flechas y joystick normalizados; pausa por blur/ocultación; orientación horizontal móvil, giro con API cuando el navegador permite y fallback manual. Orientación lógica de ocho direcciones; se añaden atlas detallados de ocho vistas y dos pasos, con diagonal SW reflejada de SE para corregir la fuente.
- HUD ya contiene vida, nivel y barra XP superior de 4 px con transición CSS; es poco visible, no ausente. Muestra bajas y un único ataque fijo, no berries recogidos ni fruta ni niveles de ataque.
- Tres cartas de pasivas con pausa, límites actuales y curación de respaldo; no consideran ataques ni inventario. Regeneración actual fija 0,7 HP/s.
- Sin victoria a los diez minutos ni cambio de mapa por reloj. Estado `victory` y premio asociado siguen como contrato antiguo, sin disparador de campaña.
- LocalStorage v1 con validación, backup, exportación/importación, saldo, cinco entrenamientos de +5 HP, resultados idempotentes consecutivos y récord global. No guarda Run en curso. Monedas se calculan al morir, no caen ni se recogen.
- GitHub remoto privado configurado, CI y `netlify.toml`. No se verificó en esta auditoría el sitio publicado ni Safari físico. `package.json` sigue en 0.3.0 aunque hay commits posteriores: identificar versiones de prueba por SHA hasta la siguiente entrega.

## Reutilizar

Conservar input/orientación, separación core/scenes/UI, pools, graella, mundo y colisiones, navegación, modales, pausa, fixtures QA de desarrollo y pruebas existentes. Extender catálogos, no añadir casos por nombre de personaje al motor. Mantener registro de actores sin ampliarlo hacia cooperativo. No eliminarlo ni migrarlo sin beneficio funcional.

## Diferencias con el diseño y riesgos

1. Entrenamiento único de vida y moneda por tiempo contradicen la economía nueva. Migrar v1 a perfil por personaje, conservar saldo y vitalidad comprada, retirar premio antiguo al activar drops para evitar doble pago y farming por espera.
2. Mejoras actuales multiplican daño por 1,2 hasta doce veces (~8,9×), alcance hasta ~2,31× y reducen cooldown sin resolver límites entre fuentes. Vida cura 30 y tiene máximo 12, distinto de +20/curar20 ilimitados. Regeneración no configurable. Resolver estadísticas antes de introducir objetos/frutas.
3. `AbilityDefinition` solo admite melee/arco; un temporizador por jugador. Requiere estado por ataque y ejecutores diferenciados antes de cuatro habilidades y niveles 1–6. Catálogo EVOLUTIONS de recetas está vacío: sustituir contrato futuro por evolución automática, no activar recetas.
4. La vista/captura de coordenadas de BattleScene precede al avance de simulación: revisar desfase de un frame de cámara/actor durante transiciones de chunk. No es un fallo demostrado de colisión.
5. El rendimiento está acotado por objetos, pero las líneas de visión muestrean trayectos por enemigo. Medir BFS/consultas y GC con 150 actores en teléfono antes de añadir efectos persistentes. No prometer FPS por pruebas de escritorio.
6. Enemigos/XP alejados se reciclan. No reutilizar esta política con cofres consumidos: produciría duplicación de recompensas. Registro infinito de cofres abiertos también crecería indefinidamente; pendiente política de oportunidades limitadas.
7. Tres opciones al agotar contenido necesitan compensaciones claras. La curación actual de respaldo no sustituye las reglas nuevas de cartas/objetos.
8. El atlas v2 aprobado solo tenía poses laterales. Por petición expresa se añaden seis hojas direccionales detalladas. Queda pendiente mejorar ciclos más largos y poses de ataque por orientación; no equivale a personajes adicionales jugables.
9. No hay audio, animación propia de bosses ni equilibrio de sesiones 30–45 min. No confundir prototipo estable con campaña lista.
10. Cambiar de Sites a Netlify cambia origen de LocalStorage: exportar/importar progreso, no asumir sincronización. Múltiples pestañas tampoco tienen transacciones compartidas; conservar una sesión por perfil hasta resolverlo.
11. Documentos históricos contienen referencias obsoletas a remoto ausente, cooperativo y secuencia anterior; PLAN_GENERAL.md es la referencia actual y sustituye esas decisiones.

## Próxima fase recomendada

Cerrar fase 1 de forma incremental, aprovechando lo construido: semillas de regresión y trayecto largo; perfil móvil y oclusión; orientación/retorno desde otras apps; medición y correcciones si aparecen problemas. No regenerar el motor ni iniciar todavía cinco islas.

Después, fase 2A: cuatro ataques de Luffy (Pistol/Gatling/Bazooka/Whip), slots y temporizadores, HUD basado en datos. Verificar antes de añadir niveles 1–6 y pasivas en 2B. La primera gran meta sigue siendo Shells Town + Luffy + Morgan + salida; no abrir una transición ficticia a Orange Town como si fuera contenido terminado.

## Archivos previstos, no modificados funcionalmente en esta auditoría

- Mundo: `src/game/world/generator.ts`, `world.ts`, `src/game/navigation/flow-field.ts`, `src/game/scenes/world-renderer.ts`, `battle.ts`; `tests/world.test.ts` y navegador.
- Combate posterior: `src/content/types.ts`, `catalog.ts` (dividir en catálogos cuando crezca), `src/game/core/types.ts`, `run.ts`, `src/game/systems/combat.ts`, `progression.ts`; futuro resolver puro `stats.ts`.
- Interfaz posterior: `index.html`, `src/ui/view.ts`, `style.css`, `responsive.css`; mantener orientación e input.
- Economía posterior: `src/platform/persistence/save.ts`, catálogo `training.ts`, sistemas de botín/cofres y estado de puntos de interés; migración probada con guardados v1 reales anonimizados.
- Corrección visual actual: `battle.ts`, `textures.ts`, diagnósticos QA `main.ts` y prueba de navegador; retirar generador geométrico de actores y añadir directional-art.ts más seis PNG generados con registro de procedencia. Atlas v2 sin modificar.

## Primera prueba en móvil

1. Confirmar que Netlify publica el SHA probado de `main`; abrir la URL HTTPS y recargar. No hace falta repositorio público.
2. Exportar progreso antes de cambiar de dominio; probar importación sin sobrescribir la única copia.
3. Chrome Android y Safari iOS físicos, modelo/versión registrados; horizontal y menú vertical.
4. Mover en ocho direcciones, soltar/cancelar toque, chocar y deslizarse, rodear casa/muro; verificar arte detallado y marines legibles.
5. Recorrer 20–30 min, volver por el camino, subir varios niveles, pausar, cambiar de app y girar con cartas abiertas. Nada de saltos de tiempo o toque atascado.
6. Morir, entrenar, reiniciar tres veces y recargar; comprobar saldo/vida/ajustes y ausencia de crecimiento sostenido. No esperar reanudar una Run cerrada.
7. Medir tiempo de frame y memoria sin grabación en la prueba base; registrar mediana/p95, tirones y calentamiento. Comparar con 150 enemigos. Emulación no sustituye estas mediciones.

Sin cambiar mecánicas en esta fase. Economía y topes del plan son propuestas pendientes de validación; el catálogo de 50 ataques y frutas se concretará después de esta auditoría, antes de sus fases, sin inventar técnicas canónicas o datos de PokéSurvivor.
