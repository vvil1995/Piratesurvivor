# One Piece Survivor · beta 0.7.1

Fangame no oficial de supervivencia para navegador. Gratis, sin anuncios, compras, cuentas ni backend. Lógica propia y nuevos sprites e iconos pixel art generados para el proyecto. No reutiliza código ni recursos de PokéSurvivor.

## Probar sin instalar herramientas

Descarga y descomprime `one-piece-survivor-browser-v0.7.1.zip` y abre **One-Piece-Survivor.html** con un navegador moderno. El archivo incluye motor, estilos, gráficos y avisos MIT. No necesita conexión ni un servidor.

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
