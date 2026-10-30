# Registro de recursos y licencias

Estado inicial: 29-10-2026. Ningún recurso de PokéSurvivor ha sido copiado. La investigación anterior no se convirtió en importación de código, datos o archivos.

| Recurso | Procedencia | Uso / derechos |
| --- | --- | --- |
| Simulación, interfaz, scripts y tests nuevos | Creados en este proyecto | Privados; no se ha elegido licencia pública para el código nuevo |
| Dibujo grande del capitán | SVG original en index.html | Provisional, geometría propia; representa un personaje de terceros |
| Personajes pequeños, cristales, suelo, hielo | Primitivas dibujadas en src/game/scenes/textures.ts | Originales de este prototipo; personajes sujetos a derechos de franquicia |
| Escenario | Geometría original en BattleScene | Plaza genérica inspirada en Marineford; sin mapa o imagen copiados |
| Tipografía | Arial/Helvetica/monospace del sistema | No se distribuyen archivos de fuente |
| Iconos | Caracteres Unicode renderizados por el sistema | No se incorporan paquetes de iconos ni fuentes |
| Música, voces y efectos sonoros | Ninguno | Motor configurado sin audio |
| Phaser 3.90.0 | npm, paquete phaser | MIT, licencia leída y conservada en licenses/dependencies/phaser |
| EventEmitter3 5.0.4 | Dependencia de Phaser | MIT, licencia leída y conservada en licenses/dependencies/eventemitter3 |
| Vite 6.4.1 / esbuild 0.25.12 | npm, herramientas de compilación | MIT; avisos conservados |
| TypeScript 5.9.3 / Playwright 1.56.1 | npm, desarrollo y pruebas | Apache-2.0; avisos conservados |

`licenses/inventory.json` recoge versiones, SPDX, clasificación de ejecución y rutas de avisos de todos los paquetes instalados, incluidas dependencias transitivas. Los paquetes opcionales de otras plataformas figuran en package-lock.json; `npm run licenses` recoge y valida los que estén instalados en la plataforma de compilación. Un SPDX fuera de la lista permitida o un paquete sin texto de licencia detiene ese script y requiere revisión.

La versión autónoma conserva dentro del HTML los textos completos MIT de Phaser y EventEmitter3. La compilación normal y los ZIP incluyen también el directorio de licencias. El motor precompilado conserva comentarios legales de su bundle, incluidos componentes internos.

No debe atribuirse una licencia MIT a todo el fangame por contener Phaser. MIT no concede permisos sobre One Piece, personajes, nombres, escenarios, marcas o logotipos. El repositorio privado y la ausencia de monetización no sustituyen la autorización correspondiente.

Para cada recurso nuevo: guardar autor, URL de origen, fecha, versión/hash, licencia comprobada, permisos adicionales, modificaciones y aviso que deba acompañarlo. No ejecutar descargadores de sprites ni incorporar recursos encontrados en buscadores sin esa revisión.

## Actualización visual 0.2 · 29-10-2026

- Fuente: `src/assets/pixel-atlas-v2.png`, PNG RGBA 1254×1254, generado con la herramienta de imágenes de esta sesión específicamente para el proyecto. No es un sprite descargado de otro juego.
- SHA-256: `61c026194561623747487786739097c36f3b1aa2b0ecf8937922f9b4642f0b31`.
- La imagen aportada por el usuario se utilizó como dirección estética (proporciones naturales, sombreado y contorno fino); no se incorporó ni recortó como recurso del juego.
- Contiene Luffy y un soldado naval sin logotipos, con poses de reposo, desplazamiento y ataque; puño, corazón, bota, coraza, reloj, imán, brazo y moneda.
- `src/ui/pixel-art.ts` define regiones del atlas, normaliza las poses en canvas de 96×96 y los iconos en 48×48 una sola vez durante la carga, sin suavizado. Se conserva el PNG fuente intacto. El retrato y los iconos comparten esas mismas texturas.
- Coraza está preparada como recurso; esta actualización no incorpora una estadística de defensa ni una nueva mejora de armadura.
- El atlas se incrusta en ambas compilaciones. No hay CDN ni descargas de recursos al jugar.
- Los personajes generados continúan sujetos a los derechos de la franquicia. No se afirma exclusividad del contenido generado ni autorización de One Piece.

La fila inicial sobre el SVG geométrico del capitán describe 0.1; ha sido sustituido en 0.2 por el nuevo retrato pixel art. El terreno y el hielo siguen usando geometría original.

## Shells Town 0.3

Se reutiliza sin modificar el atlas pixel-atlas-v2.png y sus recortes. Suelo, bordillos, edificios de tres tejados, árboles, rocas y muros se dibujan con código original en textures.ts y world-renderer.ts. No hay archivos descargados, fuentes nuevas ni dependencias adicionales. Se retiran las texturas de suelo/hielo de Marineford de la carga actual. El nuevo terreno provisional no calca mapas de la franquicia. Se mantienen los avisos y límites de uso de personajes descritos anteriormente.

## Animación direccional y variedad de Shells Town

`actor-textures.ts` genera texturas procedurales originales mediante Canvas para Luffy y marines: ocho orientaciones y cuatro fases de paso más reposo. Se generan al cargar y se reutilizan. El atlas anterior permanece para retrato e iconos. Plazas, jardines y nuevas parcelas usan código original, sin recursos externos ni dependencias nuevas.


## Atlas detallados de ocho direcciones — 30-10-2026

Se retira de la carga y del código el generador geométrico `actor-textures.ts`, rechazado visualmente por el usuario. No se eliminan movimiento ni direcciones lógicas.

Se generan específicamente para el proyecto seis hojas PNG transparentes: Luffy, Zoro, Nami, Usopp, Sanji y marine. Herramienta de generación de imágenes de esta sesión, tomando el atlas v2 propio como referencia estética; no se descargan sprites ajenos. Cada fuente tiene ocho perspectivas y dos pasos, con frente, espalda, laterales y diagonales. Se corrige SW mediante reflejo de SE al empaquetar. No son ocho técnicas de combate ni ciclos de ataque por orientación; el reposo congela un paso.

Fuentes y atlas compactos: `src/assets/actors/`. `manifest.json` registra dimensiones, bytes y SHA-256 de cada archivo. `scripts/prepare-actor-atlases.mjs` normaliza con recortes transparentes y genera 768×192; conserva originales. Los seis compactos suman aproximadamente 912 KiB; Luffy+marine, los únicos cargados, unos 308 KiB. Retrato e iconos siguen usando el atlas v2, cuyo peso es adicional. Los cuatro futuros personajes no son jugables por disponer de sus imágenes.

Código de empaquetado y retales original. Sin nuevas dependencias, fuentes, música ni recursos remotos. No atribuir licencia MIT a imágenes o franquicia; la generación no concede derechos de explotación de One Piece. Se conservan los avisos legales existentes.

## Efectos y HUD de ataques (fase2A)

Se reutilizan sin modificación los iconos generados de puño y bota. Barridos, cono y onda de choque se dibujan con código original en Graphics de Phaser; las versiones + cambian color/tamaño y patrón. No hay sprites descargados, imágenes nuevas ni dependencias adicionales.

## Marcha articulada 0.4.1

Se conservan los atlas detallados aprobados. `walk-rig.ts` divide el dibujo en torso y dos recortes de piernas para animar ángulos opuestos con fase por distancia; tres imágenes compartiendo textura por actor, preasignadas. El personaje completo no sube y baja; el pie de retorno tiene elevación pequeña. Polvo de paso original de10×5 px, pool de12. No se incorporan nuevos archivos gráficos: se descartaron ensayos de generación cuyos ciclos repetían piernas o cambiaban de orientación.

## Bloque2 — reutilización

Armadura usa el icono de coraza original del atlasv2; regeneración usa corazón y críticos puño. Sin nuevos recursos gráficos o de sonido ni dependencias. Las hojas ensayadas para más pasos no se incorporaron: la marcha actual es articulación en motor sobre el arte ya registrado.
