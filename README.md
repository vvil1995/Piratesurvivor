# One Piece Survivor · prototipo 0.1

Fangame no oficial de supervivencia para navegador. Gratis, sin anuncios, compras, cuentas ni backend. Lógica y gráficos provisionales originales. No reutiliza código ni recursos de PokéSurvivor.

## Probar sin instalar herramientas

Descarga y descomprime `one-piece-survivor-browser-v0.1.0.zip` y abre **One-Piece-Survivor.html** con un navegador moderno. El archivo incluye motor, estilos, gráficos y avisos MIT. No necesita conexión ni un servidor.

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

- Luffy, plaza provisional inspirada en Marineford y marines perseguidores.
- WASD/flechas, joystick táctil, ataque automático y daño por contacto.
- Vida, regeneración lenta, experiencia, niveles y tres opciones por nivel.
- Derrota, victoria a los diez minutos, pausa y reinicio.
- Monedas ganadas jugando y cinco niveles de entrenamiento permanente (+5 de vida inicial por nivel).
- Guardado local versionado, copia de seguridad y exportación/importación.
- Pools limitados, rejilla espacial, simulación de paso fijo y culling de enemigos.
- Interfaz adaptable, navegación de menús por teclado y opción de reducir movimiento.

## Alcance pendiente

Jefes, nuevos personajes, ataques combinados, evoluciones, sprites finales y audio corresponden a fases posteriores. El catálogo contempla personajes y recetas, pero no hay evoluciones jugables en esta versión. El escenario es abierto; hielo y muralla son decoración, con límites de arena. No se recupera una batalla al cerrar o refrescar.

## GitHub privado

Se incluye un repositorio Git local, etiqueta `v0.1.0`, CI y plantilla de incidencias. **No se ha creado un remoto de GitHub:** la autenticación disponible en el entorno no era válida. Sigue [GITHUB.md](docs/GITHUB.md) para conectarlo a tu cuenta; nunca conviertas el repositorio en público para habilitar una demo.

## Documentación

- [Probar el juego](docs/PROBAR.md)
- [Arquitectura y ampliaciones](docs/architecture.md)
- [GitHub y Codex](docs/GITHUB.md)
- [Recursos y licencias](docs/asset-register.md)
- [Presupuesto de rendimiento](docs/performance-budget.md)
- [Validación y pruebas pendientes](docs/VALIDACION.md)

One Piece y sus personajes pertenecen a sus respectivos titulares. La gratuidad, este aviso y los dibujos originales no conceden autorización sobre la franquicia. El código nuevo se mantiene privado sin una licencia pública de redistribución elegida todavía; las dependencias conservan sus propias licencias.
