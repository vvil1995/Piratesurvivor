# Cómo probar el prototipo

## Sin herramientas de desarrollo

1. Descomprime el paquete de navegador.
2. Abre `One-Piece-Survivor.html` en Chrome, Edge, Firefox o Safari moderno.
3. Pulsa **Zarpar a Shells Town**. No hay que instalar nada ni crear una cuenta.

El HTML autónomo funciona sin internet y contiene todos los recursos de ejecución. `index.html` es la variante para un servidor estático y debe conservar su carpeta `assets/`. No abras ese `index.html` por doble clic: utiliza el archivo autónomo.

En móviles, los gestores de archivos de iOS y algunos de Android pueden previsualizar el HTML sin ejecutarlo. Para comprobar el juego en Safari iOS/Chrome Android, utiliza una URL HTTP(S) de la carpeta compilada desde un servidor estático privado. No se necesita Firebase, Supabase ni otro backend. En desarrollo, el móvil puede abrir la IP de tu ordenador en la misma Wi-Fi y el puerto que muestre `npm run dev`.

La apertura local `file://` y las direcciones HTTP(S) tienen almacenamientos independientes. En `file://`, el comportamiento de LocalStorage depende del navegador y la ruta del archivo. Para conservar progreso entre versiones, usa **? → Exportar progreso** y luego impórtalo en la nueva copia. La URL estable por HTTPS es la opción preferida para las pruebas habituales en móvil.

## Controles

| Acción | Ordenador | Móvil/tableta |
| --- | --- | --- |
| Moverse | WASD o flechas | Arrastrar en la zona izquierda, debajo del HUD |
| Atacar | Automático dentro del alcance | Automático |
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
