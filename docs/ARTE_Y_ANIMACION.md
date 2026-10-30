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
