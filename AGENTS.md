# Instrucciones para Codex

- Idioma del proyecto y de la comunicación: español.
- Mantener privado el repositorio. No publicar, activar Pages ni cambiar visibilidad sin instrucción explícita.
- No añadir backend, telemetría, anuncios, compras ni recursos remotos.
- No copiar código, sprites, música o fuentes sin comprobar licencia y procedencia. Registrar cada incorporación en docs/asset-register.md y conservar avisos en licenses/.
- No reutilizar código de PokéSurvivor por defecto: este prototipo es una implementación propia.
- La simulación en src/game/core y systems no importa Phaser, DOM, almacenamiento ni UI.
- Catálogos de contenido en src/content; entrada en src/platform/input; persistencia en src/platform/persistence; Phaser solo en scenes; HTML/CSS en UI.
- Para añadir un tipo de habilidad, declarar su comportamiento y ejecutor; no añadir condiciones por nombre de personaje en el motor.
- Controlar el máximo de enemigos, pickups y efectos. Reutilizar los objetos de los pools.
- Las mejoras de partida no se escriben como entrenamiento permanente. No guardar por frame.
- El hook __OPS_QA__ solo existe en desarrollo/QA. No activarlo en artefactos de entrega.
- Antes de cerrar un cambio funcional: npm run check, npm test y npm run build. Ejecutar las pruebas de navegador para cambios de UI, entrada o integración.
- Cambios en dependencias: npm run licenses, revisar inventario y avisos; conservar package-lock.json.
- Actualizar docs/VALIDACION.md indicando qué se probó realmente y qué sigue sin comprobar.
- No afirmar compatibilidad o FPS medidos en dispositivos reales sin pruebas en esos dispositivos.
- Los ZIP y dist/ se generan, no se versionan. CI los conserva como artefactos del repositorio privado.
