# One Piece Survivor · beta 0.8.0

Fangame no oficial de supervivencia para navegador. Gratis, sin anuncios, compras, cuentas ni backend. Lógica propia y nuevos sprites e iconos pixel art generados para el proyecto. No reutiliza código ni recursos de PokéSurvivor.

## Probar sin instalar herramientas

Descarga y descomprime `one-piece-survivor-browser-v0.8.0.zip` y abre **One-Piece-Survivor.html** con un navegador moderno. El archivo incluye motor, estilos, gráficos y avisos MIT. No necesita conexión ni un servidor.

En Android/iOS, la apertura de archivos HTML desde el gestor de archivos depende del sistema y puede mostrar solo una vista previa. Para esos dispositivos, sirve la carpeta `dist/` mediante un alojamiento estático HTTPS privado o desde un ordenador de tu red. No necesita backend. Lee [PROBAR.md](docs/PROBAR.md).

## Desarrollar con Codex

Requiere Node.js 22.18 o posterior y npm. Abre esta carpeta en Codex; [AGENTS.md](AGENTS.md) describe la arquitectura y las comprobaciones.

```bash
npm ci
npm run dev
```

Abre la dirección local que muestra Vite. Para un móvil en la misma red, utiliza la dirección de red del ordenador; permite el puerto de desarrollo en su firewall solo en tu red de confianza.

```bash
npm run check       # TypeScript
npm test            # simulación, estados y persistencia
npm run licenses    # inventario y copias de avisos de los paquetes instalados
npm run build       # dist/ y HTML autónomo
npm run preview     # servir dist/ localmente
npm run release     # pruebas + compilación + ZIP de navegador y fuente
```

Las licencias están registradas en el repositorio; si se cambian dependencias, vuelve a ejecutar `npm run licenses` y revisa el diff antes de compilar. La compilación usa solo dependencias locales, sin CDN.

Para pruebas de navegador:

```bash
npx playwright install chromium
npm run test:browser
```

Si Chromium ya está instalado, indica su ruta mediante `CHROMIUM_EXECUTABLE`. Para añadir WebKit: `npx playwright install webkit`, después ejecuta con `QA_WEBKIT=1`. Las variables se configuran según la sintaxis de tu sistema operativo.

## Qué incluye

- Selector beta gratuito: Luffy, Zoro, Nami, Usopp y Sanji en Shells Town procedural, sin límites globales ni victoria por tiempo. No compra ni desbloquea personajes del futuro sistema de reclutamiento.
- Chunks deterministas, calles conectadas, barrios residenciales, jardines y recintos.
- Edificios, árboles, rocas y muros sólidos; los enemigos encuentran rutas alrededor de los obstáculos.
- WASD/flechas y joystick táctil. Seis técnicas exclusivas por personaje y cuatro buffs compartidos (máximo dos aprendidos por partida). Cuatro ranuras con hasta cuatro componentes; cooldowns independientes, seis niveles y evolución + automática. Cartas de aprendizaje, mejora y pasivas; menú de agrupación táctil.
- Batalla móvil en horizontal: aviso de giro, pausa en vertical y botón de rotación cuando la API lo permite.
- Luffy y marines con siluetas detalladas, poses de movimiento y ataque; iconos pixel art de mejoras.
- Vida, regeneración lenta, experiencia, niveles y tres opciones por nivel.
- Derrota, pausa y reinicio. El reloj mide la exploración; no termina la partida.
- Monedas ganadas jugando y cinco niveles de entrenamiento permanente (+5 de vida inicial por nivel).
- Guardado local versionado, copia de seguridad y exportación/importación.
- Pools limitados, caché de 128 chunks, texturas reciclables, graella sin alias, campo de navegación compartido y dibujo con origen local.
- Interfaz adaptable, navegación de menús por teclado y opción de reducir movimiento.

## Alcance pendiente

Jefes, cinco islas, Roger, reclutamiento, economía completa, cofres, inventario, pasivas exclusivas y entrenamiento/récords por personaje siguen pendientes. Esta beta conserva el perfil v1, las monedas y el entrenamiento de vida de Luffy; los demás personajes no consumen ni comparten sus mejoras compradas. El robo de Nami suma berries una sola vez por enemigo. No se recupera una batalla al cerrar o refrescar. Cooldowns, efectos y estadísticas son de ensayo; queda equilibrar partidas reales. Véase [COMBATE_V2.md](docs/COMBATE_V2.md).

## GitHub privado

Repositorio privado conectado: https://github.com/vvil1995/Piratesurvivor. CI verifica compilación y pruebas. Netlify usa `netlify.toml` para compilar `main` si los despliegues automáticos están habilitados. El remoto privado no requiere cambiar visibilidad.

## Documentación

- [Probar el juego](docs/PROBAR.md)
- [Arquitectura y ampliaciones](docs/architecture.md)
- [GitHub y Codex](docs/GITHUB.md)
- [Recursos y licencias](docs/asset-register.md)
- [Presupuesto de rendimiento](docs/performance-budget.md)
- [Validación y pruebas pendientes](docs/VALIDACION.md)

One Piece y sus personajes pertenecen a sus respectivos titulares. La gratuidad, este aviso y los dibujos originales no conceden autorización sobre la franquicia. El código nuevo se mantiene privado sin una licencia pública de redistribución elegida todavía; las dependencias conservan sus propias licencias.

## 0.5: estadísticas y HUD

Vida +20 y cura20 sin límite de elecciones; regeneración pequeña ilimitada en niveles pero limitada en efecto; armadura y críticos reales. Bonificaciones sumadas sobre la base con límites globales configurables. Barra XP superior con valor numérico y reset de nivel, estadísticas efectivas en pausa. El perfil v1 y el entrenamiento antiguo se conservan; berries recogibles, inventario y entrenamiento nuevo siguen pendientes.

## 0.6: seis técnicas y combinaciones

Luffy incorpora Balloon defensivo y Axe con impacto diferido. Seis exclusivas y hasta dos de cuatro buffs, cuatro ranuras de hasta cuatro componentes independientes. La quinta habilidad abre gestión antes de aprenderla. Agrupar no reinicia cooldowns ni crea una cadena. Buff solo temporal; agrupado constante menor. Perfil de intensidades/tiempos expresamente provisional. Las otras cuatro plantillas esperan la faseF y el acceso público sigue en Luffy.


## Correcciones0.7.1

Una carta aprende un solo movimiento, inicialmente en ranura propia. No se permite agrupar libremente desde el principio: al elegir otro con las cuatro ranuras llenas se habilita una agrupación (existentes entre sí o nuevo con existente). Cancelar restaura las ranuras. Integración de recompensas de jefes preparada pero sin jefes implementados. Capacidad estructural16 (4×4); catálogo actual6 exclusivas +máximo2 buffs aprendidos.

Shells Town: XP base×2, recompensa adicional por resistencia de enemigos tardíos; intervalo inicial0,95s y grupos dobles desde6min. Se mantienen la curva de XP necesaria, daño/vida por tiempo y el límite150. Ajustes provisionales que requieren partidas humanas.

Presentación: flexión de rodilla en el rig; Whip con pierna/sandalia, Bazooka con dos brazos, Pistol/Gatling con golpes y Axe descendente; barridos de espada/bastón/patada según familia. Iconos originales de espadas, bastón y tirachinas. No representan todavía el acabado gráfico definitivo de la tripulación.


## Regla vigente0.8.0 — elegir ataque

Las cuatro ranuras son opciones seleccionables: solo UNA dispara. Aprender Bazooka ocupa una ranura libre y mantiene la selección anterior; tocar el cuadrado o pulsar1–4 cambia de opción. Una combinación desbloqueada ejecuta los componentes de la ranura seleccionada, con relojes independientes. Las otras ranuras quedan en reserva. Cambiar no reinicia cooldowns ni conserva ráfagas pendientes.

Un buff temporal ya activado conserva su duración al cambiar, sin reactivarse en reserva; los buffs constantes de combinaciones solo se aplican al seleccionar su grupo. La comida ya preparada conserva curación/regeneración al recogerla.

Cooldowns básicos de ensayo: Pistol0,8s, Oni Giri1,2s, bastón0,9s, Namari0,9s y Collier0,8s. Sus niveles reducen6% de intervalo por escalón, hasta30% al6, respetando topes globales. Oni Giri exige objetivo alcanzable y contacto con el recorrido planeado; no gasta cooldown ni se mueve si no puede golpear.

Beta0.9.0: retrato frontal uniforme, drops de berries, cofres pequeños destructibles y grandes con candado/círculo de3s por proximidad. Elección de tres recompensas, seis espacios de objetos de hasta tres niveles. Guardado incremental de moneda recogida; desaparece la antigua recompensa automática por tiempo/bajas. Contenido y valores de botín en `src/content/loot.ts` y objetos en `src/content/items.ts`. Sin nuevos recursos externos.

Beta0.10.0: Morgan como primer jefe opcional de Shells Town, arena con cobertura y colisiones, cinco patrones/avisos y tres fases. Sistema de telegraphs separado del controlador. Recompensa de agrupación, victoria local y salida voluntaria a una llegada provisional de Orange Town, conservando HP/build. Ver `docs/MORGAN.md`. No incluye todavía Buggy ni el contenido completo de la segunda isla.

Beta0.11.0: Luffy más rápido, puños conectados al actor en movimiento, Balloon sin deformación, buffs con flechas/valores y cofres mucho más escasos. Botín directo de los grandes, carne curativa de pequeños/enemigos y primera fruta temporal Bomu Bomu (rara, con elección de consumo). No añade nuevos poderes permanentes ni modifica el movimiento aceptado.

Beta0.12.0: Balloon hincha el torso, da inmunidad breve y lanza/daña enemigos; combinación en dos selecciones; un único objeto con icono junto a ataques y sustitución opcional. Grandes aún más raros. Estas decisiones sustituyen el inventario de seis espacios y la presentación de Balloon de versiones anteriores. Ver docs/PROBAR.md.

Beta0.13.0: la ruta de Morgan se obtiene recogiendo una carta náutica aleatoria desde05:00. Travesía3s pausable. Perder en su arena devuelve al mismo Shells Town con25HP y build conservada; otra carta permite reintentar. Ganar lleva automáticamente a Orange Town, ahora con tres variantes provisionales de piratas de Buggy. Buggy y el resto de la campaña siguen pendientes. Esta regla sustituye el acceso por botón y la navegación manual posteriores a Morgan.

Beta0.14.0: Buggy en Orange Town, seis patrones con avisos y tres fases, arena con coberturas y ruta propia por carta desde cinco minutos en la isla. Victoria local y transición automática a Syrup provisional; derrota devuelve a Orange con25HP/build intacta. Motor de patrones compartido con Morgan conservando sus datos. Ver docs/BUGGY.md y docs/PROBAR.md. Kuro y el resto de campaña pendientes.

Beta0.15.0: bloque de calidad/progresión.34 iconos propios, golpes anclados al actor, sin punto azul del Whip, proyectiles hostiles destacados e indicador de origen del daño. Radio de recogida aumentado incluyendo comida; barriles sustituyen cofres pequeños y botín más frecuente. Cuatro ranuras llenas ofrecen solo pasivas; unir exige objeto temporal obtenido de un jefe. Entrenamiento completo por estadística/personaje con coste progresivo, segmentos, ataques iniciales, vetos y cambios de cartas; nivel permanente derivado solo de estas compras. Migración del entrenamiento anterior de Luffy sin perder berries/récords. Ver docs/PROBAR.md. Esta regla sustituye las uniones por quinta habilidad y el entrenamiento+5HP antiguos.
