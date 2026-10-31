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

## HUD compacto · tarea5

Se reutilizan sin cambios retratos, ilustraciones de habilidades e iconos de objetos existentes. Las estrellas de nivel son un SVG original de contorno escalonado definido en `src/ui/view.ts`, coloreado en plata/oro mediante CSS; no son emojis, fuentes ni sprites descargados. No se añaden imágenes ni dependencias.

## Buggy animado y plaza pirata · tarea6

Arte original generado para este proyecto usando la referencia del usuario solo como dirección artística, sin recortar personajes ni fondos de dicha referencia. Fuente de poses/partes: `/workspace/generated_images/exec-9a4358c3-df0a-4708-b4bc-ed09416228d6.png`; suelo: `exec-36221517-7531-4883-a27f-337931358182.png`; bandera: `exec-4e177941-bdf3-4c4d-aee7-e65b1db64a36.png`.

`src/assets/bosses/buggy-motion.png`: atlas512×512, doce poses128×128. Partes independientes `buggy-head`, `buggy-hand-left/right` (64×64), cuchillo/bomba32×32; suelo128×128 y bandera96×160. Recorte por celda, pies alineados, limpieza de halo/fragmentos alfa, vecino más cercano y PNG indexado hasta256 colores con transparencia. No son sprites oficiales ni material MIT. Se conservan los derechos de la franquicia de sus titulares; generar arte no los concede. SHA-256 originales/finales y dimensiones en `buggy-manifest.json`. No se descargó código, música ni sprites de terceros. Reutilizados los props ya registrados de Orange Town; la referencia no se usa como fondo completo.

## Entrenamiento permanente ·13 PNG suministrados

Fuente del usuario: `13_sprites_entrenament_ben_retallats.zip`. Copiados sin modificar bytes, dimensiones512×512 ni transparencia RGBA a `src/assets/training/`. Se conserva `README.source.txt`; SHA-256 y dimensiones en `manifest.json`. Correspondencia por nombre/número del ZIP para las catorce mejoras; Ataque inicial y Repertorio comparten el13, sin duplicar el recurso. No hay redibujo, recorte, emojis ni sustituciones geométricas.

`src/ui/training-art.ts` carga los PNG originales al abrir el menú; la versión web usa chunks diferidos y la versión portátil los integra. Autorización de uso proporcionada explícitamente por el usuario; no se ha aportado una licencia redistribuible independiente ni se consideran MIT. Aviso en `licenses/user-training-art.md`.

## Corrección de retalles de piratas ·2026-10-31

Se conservan los tres diseños y fuentes originales de la sección de animaciones:3cb64a56 (espadachín),1129340d (fusilero),189cf55e (pesado). Sin generación nueva. La preparación anterior suponía8×5 en las tres fuentes; el pesado es realmente8×4 y las otras fuentes no respetan perfectamente divisiones uniformes. Reextracción por componentes de figura, excluyendo fragmentos vecinos y conservando borde alfa. Atlas1024×640, celdas128 y pies en120; escala común por actor, PNG transparente indexado256 colores. Pesado:caminar0/1/2/1, ataque3, sin inventar un cuarto dibujo. `pirate-crops.json` registra cajas originales, escala y correspondencia; `manifest.json` actualiza hashes. Ninguna modificación de Morgan ni Buggy.

## Marines de Shells Town (2026-10-31)

`src/assets/motion/marine-{sword,rifle,veteran}.png`: tres diseños generados para esta tarea con ImageGen, usando el marine existente como referencia de estilo. Fuentes: `exec-a82e10c3-5dfa-4a96-be0c-d1a1edc9db89.png` (armas/acciones) y `exec-3246dad7-dd4a-49c9-8e30-03503c45f12b.png` (marcha), conservadas en generated_images del espacio de trabajo. No se sustituyen los diseños de Orange Town ni los bosses.

Extracción por componentes alpha para no tomar fragmentos vecinos. Normalización de altura corporal, muestreo nearest y alternancia de piernas sin mover el torso/arma; sin interpolación suavizada. Atlas PNG indexados con transparencia real:1024×1024, celdas128, pies120,8 poses (reposo,4 pasos,preparación,ataque,caída). Las diagonales comparten perfiles y el oeste usa poses reflejadas; no son ocho animaciones dibujadas independientemente. Reacción al daño mediante inclinación/flash breve del renderer. Hashes/tamaños en manifest.json; cajas fuente y reglas en marine-crops.json. Mismos derechos de franquicia que el resto de los personajes del proyecto.

### Corrección de marcha de marines (2026-10-31)

Se editó la fuente de marcha con ImageGen (`exec-e0273981-02f5-4b31-b9d3-642574d92fb7.png`) conservando los tres diseños/armas. Se eliminó la reflexión parcial de piernas de los pasos3–4 que torcía rodillas. Se extraen figuras completas, con escala común por orientación, eje horizontal del casco centrado y pies120. El reposo toma la pose de apoyo de su propia orientación. Solo se reemplazan filas0–4; filas5–7 de preparación/ataque/caída son idénticas píxel a píxel al atlas anterior. PNG RGBA para conservar esos píxeles y alpha sin otra cuantización. Manifest y cajas fuente actualizados.

### Composición urbana procedural (2026-10-31)

No se incorporan ni modifican PNGs: se reutilizan casas, árboles, palmeras, mercado, suelo de piedra/tierra/césped, cajas y recursos navales existentes. Cañón, bandera y torre ya registrados se usan también en puntos ocasionales de Shells Town. Variaciones de distribución y desgaste de suelo deterministas; sin recursos externos ni nuevas dependencias.

## Syrup Village y Kuro: recursos provisionales (2026-10-31)

Se incorporan4 atlas de actores (`blackcat-pirate`, `blackcat-claw`, `blackcat-hypnotist`, `kuro`) y4 props (`syrup-house`, `syrup-mansion`, `syrup-cart`, `syrup-cliff`). Generados con ImageGen para esta tarea, no extraídos de otros juegos. Fuentes conservadas en generated_images: `exec-bf05da5f-46b8-4f13-84a7-209723183022.png` y `exec-963cf782-1556-449c-bde7-d71c5e2e0bee.png`. Mismos derechos de franquicia que el resto del fan game.

Extracción por componentes alpha para no mezclar figuras; escala común por actor, pies120, celdas128 y muestreo nearest. Atlas1024×640, cinco poses de ejecución (reposo/pasos/ataque) con perfil compartido y reflejo completo para el lado opuesto. Son sprites de beta, sin ocho orientaciones dibujadas independientemente ni animaciones finales. Props pequeños128/256/96/128px y transparencia real. Cajas fuente, tamaños y hashes en `src/assets/motion/syrup-manifest.json`. Se reutilizan vegetación, cercas, cajas y texturas existentes. Sin nuevas dependencias ni fondos completos.

## Jardines de Kaya: complementos provisionales
- `src/assets/worlds/blackcat-banner.svg` y `kaya-cat-statue.svg`: dibujos vectoriales originales creados para este proyecto, sin recursos externos. Formas alineadas a píxeles y transparencia.
- PNG homónimos (48×96 y64×96): exportación a escala1 mediante Chromium, sin interpolar ni modificar los sprites existentes. Solo se usan en la arena de Kuro.
- Se reutiliza íntegro `motion/kuro.png`; las poses de preparación, golpe, desplazamiento, daño, agotamiento y caída se distinguen mediante el renderizador existente. No son nueve secuencias dibujadas nuevas.
