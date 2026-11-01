# Selector Beta test

Botón en el menú principal, al lado de Zarpar. Usa el personaje seleccionado. Permite entrar en los cinco mundos, sus cinco bosses y Roger sin completar la campaña. Presets orientativos (no objetivos definitivos de balance): Morgan12, Buggy24, Kuro35, Krieg46, Arlong56 y Roger60. Editables antes de entrar. Los niveles de ataques también se pueden elegir de1 a6 y cada ataque se asigna a una de cuatro ranuras o se deja sin equipar. Máximo cuatro componentes por ranura y dos buffs; se usa la validación y ejecución reales del juego.

La build de Kuro comienza con tres ataques en la primera ranura. Las otras habilidades quedan separadas y se pueden cambiar sus agrupaciones. Se conceden ocho oportunidades de reorganización mediante el botón de enlaces existente. Cada componente conserva su nivel y cooldown independiente. Los presets no simulan todas las elecciones de estadísticas de una campaña; cargan habilidades avanzadas y el entrenamiento del personaje.

Las partidas de prueba llevan `Run.practice=true`: no guardan berries, victorias ni récords, ni al volver al menú, morir o cerrar la pestaña. No modifican compras ni entrenamiento. Se reutilizan transiciones, mapas y controladores reales, sin versiones simplificadas.

Para ocultarlo: `BETA_TEST_ENABLED=false` en `src/beta/config.ts`. Todo el selector y la preparación viven en `src/beta/`; para retirarlo definitivamente se eliminan sus imports/instalación y el argumento opcional beta de `start`. La protección de persistencia queda explícita en `main.ts`.

Incluye el trabajo inicial de balance pendiente: densidad conservada y escalado de enemigos/bosses en mundos1–3. Ataques y XP aún pendientes. No presenta el balance global como terminado.
