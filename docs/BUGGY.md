# Buggy — Orange Town (beta0.14)

Segundo jefe de campaña, solo tras Morgan en la misma partida. Carta aleatoria desde300s en Orange; travesía3s. Arena768×512, dos coberturas laterales y espacio central abierto. Datos provisionales:6800HP, fases65%/30%; daños32–55 y avisos1,2–2s. No se declaran equilibrados sin sesiones humanas.

`PatternEncounter` extrae el controlador probado de Morgan y acepta perfiles/ataques configurables; `MorganEncounter` mantiene la API y valores anteriores. `BuggyEncounter` aporta su propio catálogo. Mecánicas reutilizables nuevas: zona fijada sobre el objetivo, varias zonas simultáneas compartiendo un solo impacto por actor, explosión bloqueada por cobertura y recomposición en destino anunciado/alcanzable. Ninguna preparación hace daño; no hay seguimiento oculto del blanco.

Seis patrones: mano separada con cuchillas en corredor móvil; bomba circular; barrido; recomposición (adaptación jugable del cuerpo separable); refuerzos piratas; bombardeo triple en fase3. La cabeza/mano se separan visualmente durante la preparación. Las adaptaciones no se presentan como nombres oficiales de técnicas.

Perder: limpiar peligros, volver al mismo Orange con25HP y2,5s de gracia, sin resultado de derrota ni reinicio de build/cofres/berries. Otro intento restaura HP del jefe. Ganar: caída breve, una combinación, registro local idempotente y barco a Syrup conservando HP/build. Campos de guardado nuevos opcionales, compatibles con v1. No hay acceso directo desde menú ni desbloqueo permanente de rutas.

Syrup es solo llegada provisional con piratas básicos/rápidos y variantes de color del atlas propio. No se implementa Kuro ni se afirma campaña completa. Arte de Buggy/armas/bombas propio y provisional; no se modifica la caminata aprobada.
