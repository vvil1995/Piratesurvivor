# Integración pendiente de los diez objetos

Estado auditado: ocho objetos antiguos; equipamiento de una plaza y tres niveles, ventana de sustitución, modificadores centralizados y cofres procedurales con historial. El cofre grande todavía concede suministros y puede no conceder objeto; además equipa automáticamente el primer objeto. Hay que sustituir ese flujo por una única elección aleatoria y modal obligatorio.

Integraciones necesarias:
- `content/items.ts`: catálogo de diez y tablas por nivel, sin porcentajes lineales implícitos.
- `systems/items.ts`: equipar/mejorar/reemplazar, recalcular una única fuente y curar solo el incremento positivo real de HP máximo.
- `systems/loot.ts` y `core/run.ts`: cofre grande consumido una sola vez, exactamente un objeto y pausa; pequeños conservan XP/berries/comida.
- `systems/hits.ts`: daño efectivo limitado a HP restante para robo de vida; distinguir impactos directos, áreas y daño periódico. Explosión secundaria sin recursión y con cooldown. Aturdimiento resistente en bosses.
- Temporizadores y presupuestos de curación en el estado temporal del jugador; reiniciar al sustituir objeto. No guardar estos campos en entrenamiento permanente.
- Recompensas de XP/berries: aplicar multiplicador del objeto además del permanente una sola vez al recoger.
- `main.ts` y ventana existente: comparación de nivel/efecto actual y siguiente, mejorar solo hasta3, mantener/cambiar sin inventario. Icono y nivel en indicador existente.

Datos solicitados (niveles1/2/3): barret reducción8/14/20%; haramaki vida15/30/45%; mandarines2/4/6HP cada5s; tirador alcance15/30/45%; piedra daño8/16/24%; bolsa berries20/35/50%; mapa XP10/20/30%; pólvora probabilidad5/10/15%; péndulo4/7/10%; daga robo2/4/6%.

Las animaciones pendientes de la tarea3 están sin publicar y no deben mezclarse con esta implementación. No se han incorporado sprites generados como sustitutos de los originales suministrados: la extracción exacta requiere el archivo original descargable. La vista previa del chat no permite comprobar sus bytes o transparencia originales.
