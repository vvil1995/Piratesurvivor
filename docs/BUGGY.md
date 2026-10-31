# Buggy · combate completo (tarea6, beta0.18)

Segundo boss: carta de Orange Town según el temporizador/progreso existente, después de Morgan en la misma partida. No hay acceso nuevo desde el menú. Se conserva la travesía, el retorno con25HP al perder y la build; la victoria concede la unión existente, registra el récord de victoria y lleva a Syrup sin curar. **Syrup sigue siendo una llegada provisional: Kuro no forma parte de esta tarea.**

## Controlador y reglas

`BuggyEncounter` mantiene el contrato de `PatternEncounter`, pero tiene un controlador de combate a distancia propio. Reutiliza `DangerZone`, `inDanger`, `CollisionWorld`, estadísticas/guardias y el flujo de derrota/recompensa. Morgan conserva sus cinco patrones. Datos en `src/content/bosses/buggy.ts`; números iniciales para pruebas, no equilibrio definitivo.

| Patrón | Preparación | Funcionamiento |
| --- | --- | --- |
| Ganivets en ventall | 1,05s | 5/7/9 cuchillos; trayectorias fijadas, huecos y daño28 al llegar |
| Cercle de ganivets | 1,3s | 12/14/16 rayos con huecos; pequeño desfase angular en fase3 |
| Bomba Buggy | 1,6s | 1/2/3 posiciones fijadas; radio62, daño45; explosiones escalonadas0,28s |
| Bara Bara | 1,3s | Cabeza y dos manos reales; manos persiguen3s con contacto22; cuerpo expuesto |
| Càrrega del cap | 1,5s | Solo se desplaza la cabeza; corredor28, daño40, velocidad520; obstáculos provocan aturdimiento1,7s |
| Pluja de ganivets | 1,8s | Hasta siete círculos separados de radio32, daño42, impactos escalonados y zonas libres |

Fases exactas:100–66%,66–33%,33–0%. HP6800. Recuperaciones más breves y cuchillos moderadamente más rápidos con la fase (280/302,4/324,8). La tercera fase puede combinar círculo de cuchillos con una única bomba lateral, con su propio aviso completo de1,6s. No se superponen olas infinitas.

La IA se retira si está demasiado cerca, busca distancia media, se desplaza lateralmente y comprueba alternativas antes de avanzar contra una pared. Reposicionamiento y pausas entre patrones; secuencia determinista sin repeticiones inmediatas. Durante el aviso quedan fijadas las trayectorias/posiciones. Las rayas se recortan en coberturas físicas, con la misma velocidad/recorrido para el proyectil real. Bombas y lluvia afectan únicamente en su impacto y respetan cobertura.

Pools acotados:64 cuchillos,12 peligros y3 partes. No hay temporizadores de navegador: pausa, cartas, muerte, victoria y viaje detienen/limpian el estado de simulación. Cada parte conserva su sprite; regreso interpolado sin daño. El torso permanece atacable y recibe el modificador existente de exposición.

Los cuchillos respetan Balloon+ (reflexión), desvíos de proyectiles, bloqueo/contraataque y esquers. Los impactos reflejados regresan por el sistema normal de daño/recompensas: no conceden una segunda victoria ni saltan la limpieza. Bombas, manos y cargas usan invulnerabilidad/armadura existentes; no se han cambiado habilidades del jugador.

## Arena y representación

Plaza2816×2048, cámara suave con el mismo zoom que la exploración y límites físicos. Suelo propio de arena/piedra, carpa, puestos, tejados naranjas, ruinas, cajas y nuevas banderas de calavera con nariz roja/cabello azul. Sin edificios navales como decorado principal. Centro transitable con coberturas laterales; no es una imagen completa de fondo. Se reutilizan props originales de Orange y se añaden únicamente sprites/materiales modulares.

Atlas512×512 con12 poses128×128: cuatro pasos, idle, cuchillo, bomba, daño, aturdimiento y dos derrotas, más torso desmontado. Cabeza/manos/cuchillo/bomba en PNG separados; bandera y suelo propios. PNG indexado, transparencia real, vecino más cercano. Manifiesto de procedencia/hashes en `src/assets/bosses/buggy-manifest.json` y registro legal en `asset-register.md`.

HUD compacto existente con nombre BUGGY, retrato, HP restantes y fase. Los avisos y proyectiles se dibujan por encima del entorno y efectos. El zoom ya no se reduce para mostrar toda el arena.

## Ajuste adicional de Morgan solicitado

Campo3072×2176 (antes2560×1792), misma estética/zoom/patrones. Entradas adicionales, seis marines por llamada y máximo12 simultáneos; primera oleada a6s y reposición ambiental cada14s. Las órdenes conservan su aviso y respetan el mismo límite. Los soldados de una arena delimitada no se descartan por la distancia de exploración de1400 unidades: así llegan desde sus entradas en el campo ampliado. Comprobada su llegada al jugador, no solo su aparición.

Pruebas y límites de validación en `VALIDACION.md`. Faltan sesiones humanas de equilibrio y dispositivos Android/iOS físicos.
