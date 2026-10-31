# Diez objetos especiales · beta 0.18

Implementados con los diez PNG recortados del original facilitado por el usuario. Una única plaza temporal, independiente de ataques y fruta. Cada objeto tiene tres niveles; tablas en `src/content/items.ts`.

| Objeto | Efectos de niveles 1 / 2 / 3 |
| --- | --- |
| Barret de palla | −8 / 14 / 20% daño recibido |
| Haramaki | +15 / 30 / 45% HP máximo, cura el incremento al equipar/mejorar |
| Mandarines | +2 / 4 / 6 HP cada 5 s |
| Tirador | +15 / 30 / 45% alcance efectivo |
| Pedra | +8 / 16 / 24% daño |
| Bossa | +20 / 35 / 50% berries recogidos |
| Mapa | +10 / 20 / 30% XP recogida |
| Pólvora | 5 / 10 / 15% de explosión |
| Pèndol | 4 / 7 / 10% de aturdir |
| Daga | 2 / 4 / 6% robo de vida del daño efectivo |

Los barriles/cofres pequeños conservan suministros, sin objetos especiales. Los grandes requieren tres segundos de proximidad, conservan progreso al alejarse y se consumen antes de abrir el modal: exactamente un objeto aleatorio (10% cada uno), sin fruta, cartas ni botín adicional. No depende de que quede espacio en el pool de pickups. El historial existente impide reabrirlo al descargar y volver al chunk.

El modal pausa el combate y compara el actual con el hallazgo. Equipar, mantener, mejorar el mismo hasta3 o cambiar perdiendo el anterior. A nivel3 solo se puede mantener; el cofre queda consumido. No hay inventario. Icono original y nivel en el indicador existente, junto a los ataques. Se conserva al viajar y no se escribe en el guardado permanente; una nueva partida empieza sin objeto.

Ajustes iniciales configurables en `ITEM_RULES`:
- Explosión: 35% del daño realmente causado, radio72, descanso0,8s. Colisión circular y cobertura del mundo; máximo4 eventos pendientes, visual en pool existente. Daño secundario sin críticos, otros procs de objeto ni explosión de fruta al matar: sin cadenas.
- Aturdimiento: 0,4s a enemigos comunes; bosses resisten con0,1s de interrupción del movimiento de aproximación, descanso global4s. No cancela sus avisos, cargas ni golpes ya iniciados, manteniendo sincronización y colisiones.
- Robo de vida: máximo4HP por ventana de un segundo de simulación; áreas al25%. Solo daño efectivo, sin sobrecuración, sin overkill ni curación por golpear cofres. Los proyectiles directos mantienen eficacia completa. No hay daño periódico ofensivo implementado actualmente; su futuro ejecutor deberá marcar el impacto como área/periódico para aplicar la reducción.

Las fuentes se recalculan, no se multiplican repetidamente. Se mantienen los límites globales existentes de defensa y daño. Los timers se pausan junto al combate y se reinician al cambiar/mejorar objeto. El Haramaki escala también con futuros incrementos de vida temporal, pero solo su equipamiento/mejora concede la curación adicional del objeto.

Pruebas: ver `VALIDACION.md`. Equilibrio y rendimiento en teléfonos físicos siguen pendientes de sesiones reales.
