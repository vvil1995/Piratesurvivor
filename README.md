# One Piece Survivor · prototipo 0.3

Fangame no oficial de supervivencia para navegador. Gratis, sin anuncios, compras, cuentas ni backend. Lógica propia y nuevos sprites e iconos pixel art generados para el proyecto. No reutiliza código ni recursos de PokéSurvivor.

## Probar sin instalar herramientas

Descarga y descomprime `one-piece-survivor-browser-v0.3.0.zip` y abre **One-Piece-Survivor.html** con un navegador moderno. El archivo incluye motor, estilos, gráficos y avisos MIT. No necesita conexión ni un servidor.

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

- Luffy y marines en Shells Town procedural, sin límites globales ni victoria por tiempo.
- Chunks deterministas, calles conectadas, barrios residenciales, jardines y recintos.
- Edificios, árboles, rocas y muros sólidos; los enemigos encuentran rutas alrededor de los obstáculos.
- WASD/flechas, joystick táctil, ataque automático y daño por contacto.
- Batalla móvil en horizontal: aviso de giro, pausa en vertical y botón de rotación cuando la API lo permite.
- Luffy y marines con siluetas detalladas, poses de movimiento y ataque; iconos pixel art de mejoras.
- Vida, regeneración lenta, experiencia, niveles y tres opciones por nivel.
- Derrota, pausa y reinicio. El reloj mide la exploración; no termina la partida.
- Monedas ganadas jugando y cinco niveles de entrenamiento permanente (+5 de vida inicial por nivel).
- Guardado local versionado, copia de seguridad y exportación/importación.
- Pools limitados, caché de 128 chunks, texturas reciclables, graella sin alias, campo de navegación compartido y dibujo con origen local.
- Interfaz adaptable, navegación de menús por teclado y opción de reducir movimiento.

## Alcance pendiente

Jefes, cinco islas, Roger, reclutamiento, berries de enemigos, cofres, inventario, nuevos personajes, ataques combinados, evoluciones, sprites finales y audio corresponden a fases posteriores. Las nuevas decisiones están en [PLAN_GENERAL.md](docs/PLAN_GENERAL.md). El catálogo contempla personajes y recetas, pero no hay evoluciones jugables en esta versión. La entrega actual implementa exclusivamente las fases 1A–1C. El mundo es abierto; los obstáculos tienen colisión y los ataques no atraviesan paredes. No se recupera una batalla al cerrar o refrescar. Se conservan el guardado v1, las monedas y el entrenamiento antiguos; todavía no se implementa la nueva economía.

## GitHub privado

Se incluye un repositorio Git local, etiqueta `v0.3.0`, CI y plantilla de incidencias. **No se ha creado un remoto de GitHub:** la autenticación disponible en el entorno no era válida. Sigue [GITHUB.md](docs/GITHUB.md) para conectarlo a tu cuenta; nunca conviertas el repositorio en público para habilitar una demo.

## Documentación

- [Probar el juego](docs/PROBAR.md)
- [Arquitectura y ampliaciones](docs/architecture.md)
- [GitHub y Codex](docs/GITHUB.md)
- [Recursos y licencias](docs/asset-register.md)
- [Presupuesto de rendimiento](docs/performance-budget.md)
- [Validación y pruebas pendientes](docs/VALIDACION.md)

One Piece y sus personajes pertenecen a sus respectivos titulares. La gratuidad, este aviso y los dibujos originales no conceden autorización sobre la franquicia. El código nuevo se mantiene privado sin una licencia pública de redistribución elegida todavía; las dependencias conservan sus propias licencias.
