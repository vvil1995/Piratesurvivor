# Ataques del equipo: revisión visual

## Inventario real

Luffy utiliza ilustraciones propias, golpes elásticos (`elastic-effects.ts`), hacha y BalloonRig. Se conservan. Los otros cuatro personajes compartían principalmente arcos, líneas y círculos de Graphics; los proyectiles eran bolitas, el señuelo una figura de palitos y la pierna de Sanji una forma rectangular. La comida ya tenía un sprite adecuado y se conserva.

El catálogo actual no contiene técnicas meteorológicas de Nami ni Diable Jambe de Sanji. Esta revisión respeta las técnicas implementadas: no añade rayos, tormentas ni mecánicas de fuego a ataques que no las tienen. Quedan pendientes si se decide ampliar sus repertorios.

## Cambios por técnica

| Personaje | Técnica | Presentación nueva |
|---|---|---|
| Zoro | Oni Giri | Entrada con hojas metálicas y estela orgánica orientada al desplazamiento. |
| Zoro | Tora Gari | Corte frontal de espadas con apertura, impacto y disipación. |
| Zoro | Sanzen Sekai | Secuencia de cortes cruzados sobre el objetivo; mantiene los impactos de la evolución. |
| Zoro | Double Sword | Dos hojas alternas, con desplazamientos separados. |
| Zoro | Sword Guard | Guardia con tres espadas visibles en activación y defensa; conserva el contragolpe y los destellos de daño existentes. |
| Zoro | Santoryu Sweep | Barrido de hojas siguiendo la rotación; vuelta completa en la evolución. |
| Sanji | Collier | Pierna con pantalón y zapato, arco de velocidad y destello de impacto. |
| Sanji | Épaule | Puntada descendente con preparación e impacto en el momento de la zona real. |
| Sanji | Côtelette | Combo con puntadas y golpes en el objetivo. |
| Sanji | Selle | Puntada giratoria con arco rotativo, incluida la evolución de 360°. |
| Sanji | Mouton Shot | Combo y remate visual de gran impacto para la evolución. |
| Sanji | Combat Cooking | Conserva la comida y la presentación existente; no necesita sustitución. |
| Nami | Staff Hit | Bastón físico con estela e impacto; respeta el segundo golpe evolucionado. |
| Nami | Staff Spin | Giro de bastón orientado al barrido, sin cambiar el desvío de proyectiles. |
| Nami | Rope Bind | Lazo de cuerda sobre el objetivo, sin modificar la inmovilización. |
| Nami | Quick Theft | Golpe de bastón y bolsa con monedas en el punto de contacto. |
| Nami | Thief Decoy | Señuelo de paja, peluca y camisa; explosión animada de la evolución. |
| Nami | Smart Escape | Humo de salida, contragolpe orientado al objetivo y cuerda para la trampa evolucionada. |
| Usopp | Namari Boshi | Munición metálica orientada a su velocidad. |
| Usopp | Kayaku Boshi | Bomba física con mecha; expansión y disipación de la explosión. |
| Usopp | Smoke Shot | Bomba y humo con volumen en cuatro estados, conservando la confusión. |
| Usopp | Irritant Shot | Cápsula física de irritante y nube de polvo en el impacto. |
| Usopp | Multi Shot | Munición con estela, orientación individual y rebotes existentes. |
| Usopp | Usopp Hammer | Martillo de madera con mango y arco de golpe. |

## Assets e integración

`src/assets/effects/crew-vfx.png`: 24 celdas transparentes de128px (espadas, puntadas, bastón, cuatro municiones, explosión, humo). Cada familia animada tiene cuatro estados. Cinco props separados: martillo, cuerda, señuelo, bolsa y polvo irritante. Fuentes generadas originales; procedencia y extracción en asset-register y manifiestos.

`CrewEffects` reutiliza hasta160 imágenes; como máximo32 impactos cosméticos simultáneos. No crea entidades de combate. El identificador de habilidad en los golpes y el serial visual de proyectiles del pool permiten elegir el sprite y no repetir impactos al reutilizar una entidad. Se mantienen los sistemas originales de daño, área, alcance, cadencia, hitboxes, críticos, estados y número de proyectiles. Las fusiones usan los mismos eventos individuales, sin sustituirlos por otro ejecutor.

Las técnicas comparten familias de fotogramas, combinadas según barrido, combo, desplazamiento, objetivo y temporización existente. No son24 animaciones de personaje dibujadas desde cero. Las animaciones corporales base tampoco se sustituyen.

## Comprobaciones

Consultar `VALIDACION.md` para los resultados ejecutados. La prueba de navegador recorre las24 técnicas en niveles1 y6, en escritorio y móvil horizontal emulado, y guarda capturas. La inspección visual se realiza sobre esas capturas y secuencias del juego. La emulación no acredita FPS de un teléfono real ni compatibilidad con Safari.

## Archivos modificados

- `src/game/scenes/crew-effects.ts`: nuevo renderizador de sprites y pool cosmético.
- `src/game/scenes/battle.ts`: carga, composición y sustitución de las primitivas anteriores para estas técnicas.
- `src/game/core/types.ts`, `src/game/systems/{combat,advanced-skills,effects}.ts`: metadatos visuales de eventos/proyectiles/zonas; sin modificar sus cálculos de combate.
- `src/main.ts`: diagnóstico de efectos en el hook QA de desarrollo.
- `src/assets/effects/*`: atlas, cinco props y dos manifiestos.
- `tests/browser/game.spec.ts`: recorrido base/evolución y efectos diferidos de Nami.
- `docs/{CREW-VFX,VALIDACION,asset-register}.md`: inventario, resultados y procedencia.
