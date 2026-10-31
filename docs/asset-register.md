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

## Combate v2 —0.6

Burbujas defensivas, marcas de área, ondas, auras de buffs y proyectiles son Graphics originales reutilizados con presupuestos fijos. Se reutilizan iconos de puño/bota/coraza/reloj. No se descargan recursos ni se añaden dependencias. Marine con rifle usa el atlas existente con tinte provisional; su comportamiento de disparo sí está implementado. No se presenta esta visual provisional como un sprite final de arma.


### Beta0.7 — reutilización de los cinco atlas

Los atlas compactos ya registrados de Zoro, Nami, Usopp y Sanji se cargan bajo demanda en la compilación web. El HTML autónomo los incluye todos para funcionar sin red. Se generan retrato/miniatura desde esos mismos atlas, sin archivos duplicados. El movimiento conserva el rig de piernas y ocho orientaciones. Nuevos efectos de espada/bastón/patada/humo/señuelo y comida (bola de arroz) dibujados mediante Canvas/Phaser, originales del proyecto. Sin nuevas dependencias, descargas ni recursos de terceros. Se mantienen avisos y límites de derechos sobre los personajes.


### Correcciones0.7.1 — efectos y revisión de movimiento

Iconos de espadas/bastón/tirachinas en combat-icons.ts y efectos elásticos/sandalias/armas en elastic-effects.ts: dibujo original por código, sin descargas ni dependencias nuevas. El rig reutiliza los atlas con muslo/pantorrilla separados; cuatro imágenes preasignadas por actor frente a dos del rig anterior, sin nuevas texturas por paso. Medir coste en móvil real.

Candidato de cicle lateral de Luffy generado con image_gen el30-10-2026 usando el atlas original del proyecto como referencia; refinado para diferenciar contacto/paso. No incorporado a los recursos de ejecución ni considerado validado: falta revisar coherencia de proporciones con las otras direcciones a escala real. No se descargan recursos oficiales ni de terceros.


###0.7.2 — uniones de rodilla

No se añaden assets. Los atlas detallados se conservan; los recortes se articulan sobre puntos opacos de la propia pose y se solapan en la unión. Pose no separable y reposo conservan el sprite íntegro. Lectura de alpha una vez por textura, compartida entre actores.

### 0.9.0 — cofres

Cofre de madera con bandas y cerradura: geometría pixelada original en `textures.ts`,32×32. Candado y arco de apertura: primitivas propias en `battle.ts`. Sin descargas, dependencias, fuentes ni recursos de terceros adicionales. Retrato frontal de Luffy: reutiliza el recorte sur del atlas ya registrado; no se genera ni importa otra imagen.

### 0.10.0 — Morgan

Morgan provisional (64×80), brazo-destral (40×58), caja de cobertura y barco: geometría pixelada original en `textures.ts`, sin imágenes descargadas. No se ha usado ningún sprite, logotipo, audio ni recurso oficial. Morgan y One Piece siguen sujetos a los derechos de sus titulares; el dibujo propio no concede autorización sobre la franquicia. Las formas de aviso y señales de puertas son primitivas originales. Sin nuevas dependencias.

### 0.11.0 — botín y buffs

Carne con hueso y fruta de espirales: primitivas pixeladas originales18×18 en `textures.ts`; sustituyen el plato provisional y añaden la primera fruta funcional. Flechas de buff: líneas originales y caracteres del sistema; sin imágenes, fuentes ni paquetes externos. Orígenes de hombros calculados sobre el atlas normalizado existente; no se modifica la caminata ni se importan sprites nuevos.

### 0.12.0 — objetos y pose Balloon

Ocho iconos de objetos24×24 dibujados originalmente en `item-art.ts`, usados tanto en HUD como en pickups. Ninguna descarga ni dependencia nueva. Pose Balloon: composición de cabeza/pies recortados del atlas ya registrado y torso de geometría original en `balloon-rig.ts`; no se modifica el PNG fuente ni la caminata normal. Se mantienen los avisos de derechos de One Piece del registro anterior.

### Beta0.13 — navegación y primera facción de Orange Town

Carta náutica32×30 dibujada en `textures.ts` y barco/olas/isla CSS en `style.css`: gráficos provisionales originales del proyecto, sin descargas ni fuentes nuevas. Piratas provisionales: variante en memoria del atlas propio de marines aprobado, conservando alpha/contorno y piernas, con bandana roja y camiseta de rayas. Se generan16 poses una sola vez en `pirate-art.ts`; no se altera el archivo ni las poses existentes. No son sprites oficiales ni arte final de Buggy. Sin dependencias nuevas. Siguen vigentes los avisos de propiedad de One Piece.

### Beta0.14 — Buggy y llegada a Syrup

Buggy64×80 y mano/cuchillas36×42 dibujados con gráficos propios en `textures.ts`: sombrero naranja, pelo azul, nariz roja y rayas. Bomba/fusible en `boss-renderer.ts`; separación visual de cabeza/mano usando esos mismos recortes. Arte provisional sin material descargado ni sprites oficiales. Gato Negro:16 variantes de color en memoria del mismo atlas propio, alpha y piernas intactos; no aumenta los archivos fuente. Sin dependencias, música ni fuentes nuevas. Derechos sobre One Piece siguen perteneciendo a sus titulares.

### Beta0.15 — técnicas, buffs y botín

34 miniilustraciones48×48 independientes, compuestas en `ui/ability-art.ts` con dibujos propios y recortes del atlas original aprobado del proyecto. Marco/paleta coherentes; puños/brazos, sandalia, cuerpo inflado, espadas, bastón/cuerda/señuelo/moneda, munición/humo/martillo y zapatos negros de Sanji. Buffs: emblema de estadística con flechas discretas; icono de enlaces para unión. No se copian píxeles de las capturas de PokéSurvivor ni recursos ajenos. Las capturas solo orientan el funcionamiento del entrenamiento.

Barril32×36 y muslo de ave28×26 propios en textures.ts; el cofre dorado existente se conserva. Trayectoria hostil con contorno/centro de alta visibilidad. No se descargan imágenes, música, fuentes ni librerías; no cambia la licencia/procedencia de los recursos anteriores.

## Identidad de Morgan y Orange Town · beta0.16 · 31-10-2026

Recursos originales generados con la herramienta de imágenes de esta sesión, sin descargas ni reutilización de sprites oficiales. Autoría/procedencia: generación asistida para este proyecto; no se atribuyen a un artista externo ni a PokéSurvivor. Los derechos sobre One Piece y sus personajes siguen perteneciendo a sus titulares; estos recursos no conceden permiso de explotación de la franquicia ni se presentan como MIT.

- Morgan: cuerpo y brazo-destral independientes, fuente generada `exec-491fb619-1839-4470-9913-ad4732d312e7.png`, a partir de la primera propuesta original `exec-137303ef-1b4c-488c-bf23-ca7e78f09015.png`.
- Buggy y cuchillos: fuente propia `exec-28ff320c-238c-463a-9ca5-cd8ed2505941.png`. Se conserva el formato64×80 para la separación de cabeza/cuerpo del renderizador.
- Espadachín, tirador y pesado: tres hojas propias,16 poses cada una, fuentes `exec-a70a6c8e-d9e6-4755-804b-5575ffb1b561.png`, `exec-8e03d9b2-3725-4711-b23c-c9e5197b7f13.png`, `exec-5b4aceca-8ef6-4602-89ad-9f4d90dd5054.png`. No son variantes cromáticas de los marines. Atlas normalizados768×192; ocho orientaciones y dos pasos. No se aplica el recorte articulado de piernas del marine a estos cuerpos nuevos.
- Escenario: casas comerciales, toldo, carpa, naranjo, ruina, banderines y brújula con esfera de vidrio. Fuente `exec-406a3647-3716-4bd9-a8a0-f68b3f9858ee.png`, revisión de transparencia `exec-f04eeb32-bc35-4f84-871b-42750759e92c.png`.
- Preparación: recortes transparentes, ajuste al tamaño de ejecución con vecino más cercano y PNG indexado256 colores. No se descargaron herramientas ni dependencias de ejecución nuevas. Las fuentes de generación permanecen en `/workspace/generated_images`; los recortes finales y sus SHA-256/tamaños se conservan en `src/assets/visual-manifest.json`.
- La brújula adopta deliberadamente la apariencia de un Log Pose por petición visual del jugador. El sistema sigue siendo la carta/punto de viaje existente; no pretende afirmar que East Blue requiera un Log Pose ni añade mecánicas de Grand Line.

## Referencia costera e ilustraciones de Luffy · beta0.17 · 31-10-2026

Las capturas aportadas por el usuario se utilizan como referencia estética. Los recursos de esta entrega se han generado expresamente para el proyecto; no se ha extraído ni descargado ningún sprite de ellas, de un juego comercial o de PokéSurvivor. No se añaden bibliotecas ni recursos remotos. Los derechos de One Piece siguen reservados a sus titulares; no se atribuye licencia MIT a estas representaciones.

| Recursos de ejecución | Fuente generada en esta sesión |
| --- | --- |
| Base naval, casa con toldo azul, casa pirata, carpa del payaso, árbol, palmera, muelle de piedra y embarcadero | `exec-b80e7116-b46d-4085-8556-ce665341f6d5.png` |
| Seis ilustraciones96×96 de Pistol, Gatling, Bazooka, Whip, Balloon y Axe | `exec-4d92acee-3059-425c-8ff4-21301e591c7f.png` |
| Carne con hueso blanco32×28, mostrada a30×27 | `exec-61d68e66-0409-4738-ad9e-dfc86a0c6ef2.png` |
| Puesto de mercado, casa reparada, farola, cajas, muro y valla | `exec-7a64ac7d-302a-43db-92e0-9295ace14fdd.png` |
| Materiales de suelo64×64: adoquín irregular, tierra, hierba y mar | `exec-fb4dd41d-3da3-4afb-a599-58b02d48ec2d.png` |
| Barco naval decorativo con emblema de ave original | `exec-14b0e406-5bef-4776-91f8-2a05bfd543ba.png` |

Preparación: recorte, normalización por vecino más cercano y PNG indexado256 colores. Se conserva la relación de aspecto de edificios/vegetación; las ilustraciones sustituyen los iconos procedurales de Luffy en cartas y HUD. Los originales permanecen en `/workspace/generated_images`. El manifiesto `src/assets/visual-manifest.json` recoge SHA-256 y tamaño de cada recorte final. Se elimina la casa morada sin uso; la variante con toldo azul comparte el mismo recurso de ejecución, sin duplicar la imagen.

## Arena naval de Morgan

Piezas originales generadas para el proyecto, fuente `exec-cfe16a78-d27c-422e-bad5-f37e0f77f5b3.png`: puerta, torre, cañón, bandera, cajas/barril y muralla. Preparación: recortes transparentes, vecino más cercano y PNG indexado. Se usan como piezas independientes, no como fondo completo. Referencia del usuario únicamente artística; no se han descargado assets oficiales. Los derechos de One Piece siguen reservados a sus titulares. Solo el escenario de Morgan utiliza estas piezas.

Suelo naval original: `exec-942d9d6c-6518-4bdb-9496-cb84803aeb96.png`, reducido a128×128 y PNG indexado. Hashes y tamaños de las siete piezas en `src/assets/arena/manifest.json`. Material reutilizable con grates/desgaste deterministas, sin cargar un fondo gigante.

## Animaciones de Morgan y piratas · beta0.18

Recursos originales generados a partir de los sprites propios existentes, sin descargas externas. Fuentes en `/workspace/generated_images`: espadachín `exec-3cb64a56-b603-40d8-83e6-28d12f3771ec.png`, tirador `exec-1129340d-9bf7-4e73-b7e9-3aff2fbddc2a.png`, pesado `exec-189cf55e-3700-4a54-9889-a50e863efc63.png`, Morgan `exec-d45b275f-7d1a-4795-ae89-9615cea28ee7.png`.

Atlas de piratas768×480: ocho direcciones, cuatro pasos y una pose de ataque por dirección. Morgan512×512: dos orientaciones de cuatro pasos y ocho poses de reposo/acción/daño/derrota. Arma independiente conservada. Preparación: recorte por celda, escala común por actor, pies alineados, vecino más cercano y PNG indexado. SHA-256/tamaños en `src/assets/motion/manifest.json`. Sin inversión horizontal en ejecución. Los derechos de One Piece no se conceden por generar estas imágenes; no se presentan como recursos oficiales ni MIT.

## Objetos especiales proporcionados por el usuario · beta0.18

Fuente: `one_piece_survivor_assets.zip`, PNG `one_piece_survivor_10_items.png`,1983×793 RGBA. SHA-256 original: `6c5eb23b79b06f87e2e8336fe0aa3084ba6f4106cbb7e8767a2bb611630dc5f6`. Transparencia alfa real: no se ha eliminado un fondo negro ni regenerado/redibujado el arte.

Diez recortes PNG RGBA96×96 en `src/assets/items/`, centrados con márgenes transparentes y silueta máxima88×88 mediante vecino más cercano, sin suavizado ni recoloración. Orden: barret, haramaki, mandarines, tirador, piedra, bolsa, mapa, pólvora, péndulo, daga. `manifest.json` registra celda, rectángulo de origen y SHA-256 de cada archivo. Se usan tanto en ventanas HTML como en texturas de Phaser; no hay emojis ni descargas remotas.

Uso solicitado expresamente por el usuario para este proyecto. No se ha proporcionado una licencia redistribuible ni autoría independiente; estos recursos no se declaran MIT ni assets oficiales. Los derechos de One Piece siguen reservados a sus titulares. Mantenerlos separados del código facilita su sustitución si se necesita acreditar una licencia de distribución.
