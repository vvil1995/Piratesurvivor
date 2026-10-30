# Cómo probar el prototipo

## Sin herramientas de desarrollo

1. Descomprime el paquete de navegador.
2. Abre `One-Piece-Survivor.html` en Chrome, Edge, Firefox o Safari moderno.
3. Escoge Luffy, Zoro, Nami, Usopp o Sanji en el selector BETA (sin compras) y pulsa **Zarpar a Shells Town**. No hay que instalar nada ni crear una cuenta.

El HTML autónomo funciona sin internet y contiene todos los recursos de ejecución. `index.html` es la variante para un servidor estático y debe conservar su carpeta `assets/`. No abras ese `index.html` por doble clic: utiliza el archivo autónomo.

En móviles, los gestores de archivos de iOS y algunos de Android pueden previsualizar el HTML sin ejecutarlo. Para comprobar el juego en Safari iOS/Chrome Android, utiliza una URL HTTP(S) de la carpeta compilada desde un servidor estático privado. No se necesita Firebase, Supabase ni otro backend. En desarrollo, el móvil puede abrir la IP de tu ordenador en la misma Wi-Fi y el puerto que muestre `npm run dev`.

La apertura local `file://` y las direcciones HTTP(S) tienen almacenamientos independientes. En `file://`, el comportamiento de LocalStorage depende del navegador y la ruta del archivo. Para conservar progreso entre versiones, usa **? → Exportar progreso** y luego impórtalo en la nueva copia. La URL estable por HTTPS es la opción preferida para las pruebas habituales en móvil.

## Controles

| Acción | Ordenador | Móvil/tableta |
| --- | --- | --- |
| Moverse | WASD o flechas | Arrastrar en la zona izquierda, debajo del HUD |
| Atacar | Automático: solo ranura seleccionada | Automático: solo ranura seleccionada |
| Elegir ranura | Clic o teclas1–4 | Tocar el cuadrado inferior |
| Elegir mejora | Clic o Tab y Enter | Tocar una tarjeta |
| Pausar | Esc, P o botón Ⅱ | Botón Ⅱ |
| Reanudar | Botón Volver a la batalla | Mismo botón |

Al cambiar de aplicación o pestaña la batalla se pausa. Reanudar requiere una acción explícita. El puerto se puede consultar en vertical; la batalla móvil se juega en horizontal. Si arrancas en vertical, aparece el aviso de giro y se pausa el reloj. Pulsa el botón de pantalla completa y girar, o gira físicamente el dispositivo; al volver a horizontal, pulsa reanudar. En iPhone el navegador puede no permitir bloquear la orientación automáticamente. El botón de pantalla completa aparece solo cuando la API está disponible.

## Recorrido recomendado

1. Mueve a Luffy y confirma que no se desplaza más rápido en diagonal.
2. Acércate a los marines: el puño los golpea automáticamente.
3. Recoge los cristales turquesa y elige una de tres mejoras.
4. Pausa; comprueba que el reloj y los enemigos se detienen.
5. Cambia de aplicación y vuelve; comprueba pausa y liberación del joystick.
6. Pierde una partida: revisa tiempo, bajas, nivel y monedas. Reinicia.
7. Vuelve al puerto, entrena si tienes 30 monedas y recarga la página. Deben mantenerse monedas, récords y entrenamiento.
8. Recorre varias calles y gira en distintas direcciones. El mundo continúa: no hay victoria al llegar a diez minutos.
9. Intenta atravesar casas, árboles, rocas y muros. Rodea una casa y comprueba que los marines buscan otra ruta; los golpes tampoco deben atravesar edificios.
10. En móvil, gira durante movimiento y con las tarjetas abiertas. Deben seguir visibles y utilizables.
11. Exporta/importa el progreso desde **?**. Importar sustituye el progreso actual por el del archivo seleccionado.

El guardado no conserva una batalla en curso. Borrar datos del navegador elimina el progreso local. Si aparece un aviso de almacenamiento, exporta la partida antes de cerrar. No hay sincronización entre dispositivos; puedes usar la exportación para transferirlo manualmente.

## Datos útiles al comunicar un problema

Dispositivo, versión de Android/iOS, navegador y versión, orientación, minuto de partida, número de enemigos aproximado y pasos para reproducirlo. Para una pantalla negra, adjunta el error de consola si puedes acceder a él. No incluyas datos de cuentas ni credenciales.

## Alcance de 0.3

Solo Shells Town y la base del mundo infinito. No están disponibles Morgan, navegación a otras islas, Roger, otros personajes, taverna, nuevos drops de berries, cofres ni inventario. La economía visible conserva el comportamiento anterior del prototipo. Cada partida nueva reinicia nivel y mejoras; los récords y el entrenamiento existentes se conservan. Los cambios de semilla varían la distribución de barrios; volver a un fragmento en la misma partida lo reconstruye igual.

## Cuatro ataques de Luffy (fase 2A)

Luffy empieza con Pistol. Al subir de nivel pueden salir cartas para aprender Gatling, Bazooka o Whip, además de pasivas y mejoras de los ataques equipados. Hay cuatro espacios visibles. Cada técnica llega a seis niveles y se convierte automáticamente en + sin objetos; ya no se ofrece después. Pistol+ perfora una fila; Gatling+ hace seis golpes que perforan dos objetivos; Bazooka+ añade onda de impacto; Whip+ gira360°. Son habilidades automáticas independientes, no una cadena desbloqueada.

Probar tres partidas con elecciones diferentes; comprobar movimiento/joystick mientras se activan varios ataques, golpes detenidos por edificios, pausa durante ráfagas, cartas de nivel6 y reinicio que devuelve solo Pistol1. No se añaden berries recogibles ni personajes nuevos en esta entrega; la economía y pasivas antiguas permanecen pendientes de sus fases. Los números del combate son provisionales, no equilibrio final de campaña.

## 0.5 — pasivas y estadísticas

En las cartas probar vida (+20máximo y cura20), regeneración, armadura y crítico. Pausar para ver los efectos efectivos, que ya respetan topes. La XP se ve arriba con valor numérico y barra; al subir de nivel se reinicia el progreso. Vida/regen no tienen máximo de elecciones; las demás sí. Reiniciar debe borrar estas pasivas y conservar solo el perfil anterior.

El equilibrio cambió: regeneración inicial0,2HP/s; daño/velocidad/cooldown temporales ahora se suman sobre la base, no se multiplican repetidamente. Los números son provisionales y necesitan partidas humanas con y sin mejoras. El enemigo recibe más estadísticas y más frecuencia por tiempo, hasta los topes de0.4.1. No hay viajes automáticos ni victoria por reloj.


## Beta de los cinco personajes

Prueba una partida con cada uno. Aprender una quinta habilidad abre el menú de agrupación: une dos ranuras para dejar una libre y confirma. Cada técnica conserva su nivel y reloj; máximo dos buffs distintos por partida. Mejora una técnica hasta6 para comprobar su +. Revisa especialmente la carga de Zoro cerca de muros, el señuelo/robo de Nami, humo/proyectiles de Usopp y recogida de comida de Sanji. Abandonar no cobra ni suma recompensas. La taverna y el entrenamiento individual nuevo todavía no están disponibles.


En0.7.1, antes de la quinta habilidad el menú solo permite consultar/separar, no unir libremente. Al elegir una nueva con cuatro ranuras ocupadas puedes juntar dos existentes y confirmar, o usar «Juntar el nuevo y aprender». Cancelar devuelve la elección. Prueba especialmente si el doble de XP inicial y el crecimiento de recompensa por enemigo resistente permiten montar la build antes de la acumulación.


## Beta0.8.0: tocar para elegir

Aprende Bazooka: Pistol sigue seleccionado y solo Pistol ataca. Toca Bazooka en el HUD y comprueba borde dorado/etiqueta ACTIVA; vuelve a Pistol tocándolo. En PC también1–4. Antes del quinto movimiento no puedes unirlos. Al desbloquear una combinación, elige su ranura para que funcionen juntos sus componentes; seleccionar otra deja ese grupo en reserva. Cambiar no reinicia cooldowns. Prueba especialmente el ataque inicial de Zoro contra marines cercanos, lejanos y detrás de muros.

## Beta0.9.0: tesoros

Luffy debe mirar de frente en el selector. Busca pequeños cofres de madera: el ataque seleccionado los apunta y rompe; recoge el botín. Los grandes son dorados y más grandes: acércate y espera a que el círculo del candado complete3s. Al alejarte se pausa; volver continúa. Escoge una de tres recompensas con ratón o tacto. Pausa para consultar los objetos equipados (seis espacios, nivel máximo3). Las berries se guardan al recogerlas y se conservan al abandonar/recargar; la build desaparece. Verifica que regresar a una zona no haga reaparecer cofres consumidos. Guardados de Netlify preview y producción están separados por dominio.

## Beta0.10.0: Morgan

Pulsa BASE DE MORGAN durante la exploración y confirma. Nivel20 recomendado, sin requisito. Aprende rectángulo de destral y arco; en fases2/3 aparecen carga, refuerzos y onda. Rojo tenue: preparación; contorno intenso: último aviso; naranja: impacto efectivo. Sal de la zona antes del golpe y usa cajas contra cargas/ondas. Comprueba que Morgan no las atraviesa y puede rodearlas. Mira tu vida y las tres fases de la barra del jefe.

Al vencer, espera la caída. Se guarda la victoria y se concede una agrupación en Gestionar habilidades. Escoge explorar o embarcar; no hay cambio automático ni curación. Orange Town es llegada provisional, sin Buggy. Prueba la entrada, esquiva y navegación en móvil horizontal y PC. Si el teléfono interrumpe la aplicación, verifica pausa y reanudación; no se permite escapar del jefe mediante los botones de navegación antes de vencer.

## Beta0.11.0

Probar cadencia de los seis movimientos de Luffy, en particular Pistol y Gatling. Moverse mientras se dispara y comprobar que brazos/puños salen del actor. Balloon mantiene su función defensiva sin hinchar el sprite. Buffs muestran flechas de color y pequeños totales efectivos; consultar las cartas para magnitud y duración.

Buscar cofres más separados. Pequeños: moneda, poca XP y posible carne; grandes: círculo/candado de3s y botín directo, sin selección de mejoras. Recoger moneda/XP. Una subida de nivel por esa XP sigue abriendo cartas normales. Objeto ocasional entra directamente en un hueco libre; no aumenta un objeto equipado. Fruta rara Bomu Bomu: recogerla, aceptar o conservar build, probar explosiones al derrotar enemigos. Se pierde al reiniciar. Comprobar que comer cura sin superar HP máximo y que enemigos dejan carne ocasionalmente.
