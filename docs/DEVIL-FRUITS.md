# Frutas del Diablo

Se amplía el sistema previo (Bomu y su selector), sin sustituir ataques ni persistir poderes. Bomu conserva compatibilidad y no entra en la nueva tabla de drops.

| Fruta | Mecánica real |
|---|---|
| Mera | Proc limitado, quemadura no acumulable de3s con ticks cada0,5s; explosión local con recarga5s. |
| Goro | Descarga inicial y hasta3 saltos a objetivos distintos, con distancia y línea de visión. Daño secundario sin recursión. |
| Hie | Ralentización normal al60% de velocidad, posibilidad de congelación0,35s; bosses inmunes a estos controles. |
| Suna | Pulso cada7s: daño, pequeño empuje y ralentización de normales. Bosses reciben daño sin desplazamiento/control. |
| Moku | Humo y confusión2s cada7s; evasión distribuida del15% durante la ventana, con acumulador por impactos para no usar RNG global. No otorga inmunidad continua. |
| Nikyu | Onda cada7s, daño y empuje65px de normales; bosses reciben daño, sin expulsarlos. |

El primer pulso periódico ocurre tras1s. El proc de impacto tiene25% de probabilidad y recarga1,5s. Valores en `src/content/fruits.ts`. Efectos secundarios no vuelven a activar procs. Burn máximo24objetivos, cola4, visuales24 por actor/80sprites globales. Referencias de quemaduras/control verifican el ID del enemigo reciclado.

Drops:0,15% por normal y8% por boss, también invocados. La reserva1% para especiales está configurada, pero no se inventa una clasificación de especiales que el juego no tiene. Selección uniforme entre las seis. `landReward` busca tierra y se descarta la recompensa si no puede ocupar el punto. No se añaden cofres ni se cambian sus frecuencias/recompensas.

Primera fruta: activación por proximidad sin modal. Las siguientes pausan con Substituir/Conservar; la recogida ya se consume al abrir el selector, incluido el rechazo. Sustituir limpia colas, quemaduras, ventanas y controles propios. Los viajes conservan la fruta y limpian los efectos ligados al mapa anterior. La derrota final la elimina; volver de un boss fallido conserva la build según las reglas existentes. Nueva Run empieza sin fruta.

HUD: icono estable e interactivo, detalles en diálogo con pausa y aviso al adquirir. No usa ranuras de habilidades. Se conserva entrenamiento, objetos y buffs.

## Archivos

- `src/content/fruits.ts`: catálogo y parámetros.
- `src/game/systems/fruit-effects.ts`: procs, estados, pulsos, limpieza.
- `src/game/systems/{hits,stats,status,effects,enemy-melee}.ts`: integración de daño secundario y evasión.
- `src/game/core/{run,types}.ts`: drops, recogida, sustitución y ciclo de partida.
- `src/game/bosses/{pattern-encounter,buggy,krieg,arlong,roger}.ts`: pasan el jugador al cálculo común de daño para la evasión; mismos ataques/duración/daño base.
- `src/game/scenes/{battle,fruit-renderer}.ts`: sprites, flotación y pool visual.
- `src/ui/{fruit-art,view,hud.css}`, `index.html`: icono y diálogos.
- `src/assets/fruits/*.svg`: doce dibujos originales de baja resolución, seis frutas y seis efectos provisionales. No son spritesheets con múltiples fotogramas dibujados; se animan mediante posición, escala, giro y desvanecimiento.
- `scripts/portable.mjs`: soporte SVG embebido para el HTML autónomo.
- `tests/fruits.test.ts`, `tests/browser/game.spec.ts`: mecánicas y navegador.

## Verificación

234pruebas de lógica aprobadas. Nuevas pruebas ejercitan las seis frutas con los cinco personajes, daño, estados, límites, evasión, sustitución, seis drops accesibles, viaje Morgan→Orange y muerte. Dos casos Chromium (escritorio/móvil horizontal emulado) ejercitan recogida/sustitución, cargan los seis sprites, ejecutan efectos y abren/cierran detalles. Capturas del suelo y seis poderes inspeccionadas. Compilación Pages y HTML autónomo aprobados; smoke de producción bajo `/Piratesurvivor/` sin404/erroresJS.

No se ha jugado una campaña completa con cada combinación de fruta/personaje, ni medido FPS en un teléfono físico o en la carga máxima de Roger. Las pruebas de simulación históricas de mundos/bosses siguen aprobadas, pero no sustituyen ese ensayo de balance. Los efectos visuales son provisionales; su mecánica sí está implementada.

Los controles de fruta se almacenan separados de `statuses` de habilidades/objetos. El cálculo común toma el máximo; sustituir elimina solo la fuente de fruta. Una prueba específica verifica que Hie no borra controles independientes.
