# Atlas direccionales

Recursos generados específicamente para este proyecto a partir del atlas v2 original como referencia estética. No son sprites descargados. Luffy, Zoro, Nami, Usopp, Sanji y marine: 16 poses por hoja, ocho orientaciones con dos pasos.

Orden fuente: cuatro columnas, cuatro filas. Filas 1–2: S, SE, E, NE / N, NW, W, SW. Filas 3–4: mismas direcciones, paso opuesto. `directional-art.ts` busca separaciones transparentes, centra siluetas y alinea pies en texturas compartidas de 96×96. La diagonal SW se obtiene reflejando SE para corregir inconsistencias de orientación del generador. No se dibujan actores geométricos.

Solo Luffy y marine se importan y cargan en el juego. Los otros cuatro son recursos preparados: todavía no hay selección, desbloqueos ni habilidades de esos personajes. Las poses quietas reutilizan un paso congelado; no hay ciclos de ataque específicos para cada dirección todavía. El atlas v2 se conserva para retrato/iconos y poses de referencia.

La herramienta de generación no garantiza fidelidad anatómica perfecta ni interpolaciones exactas: revisar secuencia en juego además de comprobar recortes. Derechos sobre One Piece no concedidos por generar imágenes nuevas. Procedencia y hashes en docs/asset-register.md y manifest.json.

Los archivos `*-directions.png` son fuentes originales; `*-atlas.png` son versiones compactas de 768×192 listas para el motor. Reproducir con `CHROMIUM_EXECUTABLE=/usr/bin/chromium node scripts/prepare-actor-atlases.mjs` (adaptar ruta de Chromium). No requiere paquetes nuevos. El juego solo carga luffy-atlas y marine-atlas; se liberan las hojas fuente de GPU tras crear texturas compartidas. La prueba de navegador compara píxel a píxel las fases extraídas de la fuente y del atlas compacto.
