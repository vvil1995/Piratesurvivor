# Syrup Village · primera versión funcional

Buggy ya no embarca automáticamente tras la victoria. Su Log Pose aparece al acabar la caída; caminar sobre él inicia la travesía a Syrup. Se conserva el mismo actor y su build, XP, HP, fruta, objeto, buffs, moneda y cooldowns. Morgan mantiene su transición existente.

Syrup usa los chunks y la composición conectada de los pueblos, con caminos de tierra, más césped, casas rurales, bosque, cercas, carros, mansiones ocasionales y rocas costeras decorativas. La mansión inicial sirve de referencia. Cofres candidatos cada3/24 chunks, mismas recompensas y apertura3s. No hay nuevo sistema de inventario ni de guardado.

Piratas del Gato Negro: básico85HP/20daño/88velocidad; urpas110HP/24daño/96velocidad, preparación0,6s y dos cortes; hipnotizador75HP/18daño/72velocidad, disparo preparado0,8s, proyectil165px/s, ralentización×0,72 durante1,8s. No se suma duración/intensidad por impactos; efecto limitado a2s y al menos65% de movilidad. Las cifras son provisionales y se ajustan en catálogo. Distribución básica/urpas/hipnosis:100/0/0% primer minuto,80/20/0% desde1min,65/25/10% desde2min,55/30/15% desde3min. Cap120, cadencia inicial0,95s y presión temporal acotada.

La ruta de Kuro sigue el sistema existente: cartas desde05:00 de tiempo en Syrup, con retraso aleatorio inicial y nuevos intentos. No exige nivel. La arena mantiene el zoom de exploración y cámara limitada; mansión, cercas y árboles reutilizan colisiones y navegación existentes.

Kuro:8200HP, velocidad260 con incremento moderado por fase, umbrales66/33%. Dos avisos cruzados en X; carga fijada; pasos fantasma sin daño; Shakushi de tres pasadas, cada una avisada; combo de cuatro golpes con recuperaciones. No tiene invulnerabilidad especial. Se reutiliza PatternEncounter y su geometría única de aviso/impacto. Estelas limitadas a12 imágenes. Si se pierde, se vuelve a Syrup con25HP, misma build/mundo/cofres y posibilidad de otra carta.

La victoria concede el token de unión existente y abre su menú. No concede ataques. Con un solo ataque permite continuar. Al cerrar se conserva la build y aparece el Log Pose de Baratie. Baratie queda desbloqueado dentro de esa partida, pero el viaje devuelve un aviso de contenido pendiente: no cambia de mapa ni consume el progreso. No se implementa el mundo4. El jugador puede revisar la build o salir por pausa al completar esta beta.

Archivos principales: `content/worlds/syrup-village.ts`, `content/bosses/kuro.ts`, `content/catalog.ts`, `game/bosses/kuro.ts`, `game/systems/enemy-melee.ts`, ampliaciones de Run/transiciones y del renderer/arena existentes. Los valores de Morgan, Buggy, Shells y Orange no se cambian.

Pendiente: sprites y animaciones definitivas, equilibrado con sesiones completas de los cinco personajes y comprobación en teléfonos reales. No se añaden red, monetización ni entrenamiento permanente nuevo.
