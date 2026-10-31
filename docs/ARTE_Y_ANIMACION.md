# Dirección visual y criterio de acabado

Prioridad confirmada por el usuario: dedicar tiempo al acabado, no considerar terminada una habilidad por tener un área geométrica visible. Los cinco personajes son seleccionables en la beta; sus animaciones y efectos siguen provisionales.

## Orden de trabajo

1. Luffy: mantener la silueta detallada aprobada, resolver contacto/paso/recobro lateral y diagonal, después animaciones de las seis técnicas.
2. Zoro: peso de las espadas, anticipación del corte y recuperación; tres hojas legibles y guardia reconocible.
3. Nami: bastón como objeto físico, cuerda/anzuelo visual legible, señuelo distinguible; no sustituir todo por círculos.
4. Usopp: postura del tirachinas y salida de munición, explosiones/fumígenos pequeños y legibles.
5. Sanji: pivote del pie de apoyo, rodilla y remate de las patadas; comida reconocible como alimento.
6. Marines: ciclo coherente con la misma dirección artística, peso de las botas y posturas diferenciadas de rifle cuando se produzcan sus sprites.

## Aceptación de una animación

- Mantener proporciones, ropa, paleta, tamaño y orientación entre fotogramas. Ningún cambio a figuras geométricas ni cabeza de otra escala.
- Cuatro fases distinguibles: contacto, paso, contacto opuesto y recobro opuesto. No contar como cuatro poses dos imágenes casi repetidas.
- Pie de apoyo creíble, rodilla flexionada en recobro, brazos alternos; torso estable. Al parar, regresar a reposo sin deslizamiento.
- Revisar a tamaño real en juego, no solo en una hoja ampliada. Capturas estáticas no demuestran calidad del ciclo completo.
- Ocho direcciones coherentes; no aprobar una lateral nueva si desentona con las otras seis.
- No sustituir el atlas aprobado hasta revisar el candidato integrado en una rama de pruebas.

## Ataques de Luffy

| Técnica | Identidad visual requerida |
| --- | --- |
| Pistol | Anticipación corta, brazo elástico, puño y contracción; impacto en objetivo |
| Gatling | Puños alternos y ráfaga legible, sin ocultar los enemigos ni suponer Haki |
| Bazooka | Dos brazos/dos manos simultáneos, empuje y remate; onda secundaria en+ |
| Whip | Pierna elástica, sandalia y escombrada visible; círculo de alcance solo si es indicación auxiliar |
| Balloon | Inflado del cuerpo coherente con el sprite, retorno y respuesta visible a proyectiles |
| Axe | Elevación/caída de la pierna, sandalia e impacto en suelo; señal de área subordinada al gesto |

La primera pasada de efectos por código ayuda a distinguir la mecánica, pero no equivale al acabado de sprites/animaciones final. Las técnicas de los otros cuatro personajes requieren el mismo tratamiento.

## Recursos y rendimiento

Conservar originales y procedencia, normalizar a atlas compactos con transparencia, píxeles nítidos y ancla estable. Reutilizar texturas, cargar por personaje elegido y limitar efectos simultáneos. Medir en móvil real el coste del rig de muslo/pantorrilla antes de darlo por definitivo.

Candidato lateral de Luffy generado el30-10-2026: dos iteraciones revisadas; la segunda diferencia mejor las fases de paso. No incorporado a la compilación: pendiente comparar proporciones/estilo con el atlas aprobado y revisar el ciclo a escala real. No se presenta como trabajo ya terminado para los otros personajes.

## Dirección costera · beta0.17

Shells Town toma la referencia del puerto y base naval: edificio con cubierta azul, casas con toldos, árboles frondosos, vallas, mampostería y dársenas con barcos. Orange Town utiliza tierra cálida, carpa del payaso, toldos rojos, palmeras, puestos, banderines y casas reparadas. Los materiales son imágenes originales, no grandes rectángulos coloreados. Se conserva la proporción natural de los sprites, especialmente la carpa, evitando deformarla al tamaño del collider.

El mapa sigue siendo procedural: la referencia no se convierte en un fondo plano sin colisiones. Los caminos conectan chunks; el puerto estrecha sus pasarelas y mantiene agua no transitable. El agua permite línea de tiro; casas y barcos continúan dando cobertura. Las máscaras de ataque se cachean por chunk con WeakMap y desaparecen al descargarlo.

Los seis ataques de Luffy tienen ilustraciones específicas96×96, compartidas entre HUD y cartas. No son animaciones de combate nuevas: los efectos elásticos y las animaciones que ya funcionaban se mantienen. Las ilustraciones de los demás personajes continúan pendientes de una revisión equivalente. No se considera terminado el diseño de todas las sagas por esta primera pasada costera; Syrup sigue siendo provisional. El reparto de puntos de interés, repetición de parcelas y transiciones de terreno deben seguir puliéndose con partidas reales.
