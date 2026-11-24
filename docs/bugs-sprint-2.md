# Bugs del sprint 2 (propuesta)

Versión para valtrigo-sembrado-sprint-2.vercel.app (rama `valtrigo-sembrado-sprint-2`).

**Estado: sembrado el 2026-11-24.** Las fichas completas (pasos, por qué no bloquea y qué test lo detecta) están en docs/bugs.md, en la sección "Versión del sprint 2".

## Planteamiento

- **Base:** la rama parte de `main`, el juego limpio con los bugs reales ya corregidos.
- **Alumnos:** 18. Para que cada alumno pueda reportar al menos uno, esta versión tiene 27 bugs, y 13 de ellos son fáciles.
- **Reparto por sprints** (decisión del autor):
  - Esta versión lleva los bugs del sprint 2 y regresiones del sprint 1.
  - El sprint 3 tendrá su propia versión (rama `valtrigo-sembrado-sprint-3`), con 15 bugs nuevos y los 5 heredados de ese sprint: B-08, B-14, B-16, B-22 y B-23.
- **Tres tipos de bug:**
  - **Heredados (7):** los 6 bugs del sprint 2 que todavía no ha encontrado nadie y B-10, del sprint 1, que tampoco ha aparecido.
  - **Nuevos (15):** de B-33 a B-47, todos en historias del sprint 2.
  - **Regresiones (5):** de B-48 a B-52, en historias del sprint 1, que ya se probaron y funcionaban. Son de dos clases:
    - Un bug que ya se había corregido y vuelve a aparecer. En Jira, lo correcto es reabrir el ticket o enlazarlo al anterior.
    - Un cambio del sprint 2 que rompe algo del sprint 1, aunque esté en otra parte del juego.
- **Reglas:** se mantienen las del catálogo (docs/bugs.md):
  - Ningún bug impide seguir jugando.
  - Ningún bug depende del azar.
  - El autor hace los commits.

## Resumen

27 bugs: 7 heredados, 15 nuevos y 5 regresiones. Por dificultad: 13 fáciles, 9 medios y 5 difíciles.

| ID | Tipo | Fallo | Historia (sprint) | Dificultad |
|---|---|---|---|---|
| B-03 | Heredado | La Pala comprada no llega al inventario | HU-17 (2) | Fácil |
| B-05 | Heredado | Vender 3 Semillas da 10 monedas, no 15 | HU-18 (2) | Medio |
| B-12 | Heredado | La Manzana no sube la energía entre 90 y 99 | HU-14 (2) | Difícil |
| B-13 | Heredado | El cofre 2 se puede volver a abrir | HU-12 (2) | Difícil |
| B-15 | Heredado | Dormir con 20 de energía la deja en 50 | HU-24 (2) | Difícil |
| B-24 | Heredado | Correr gasta la mitad de energía | HU-76 (2) | Difícil |
| B-10 | Heredado | Guardar en el lago guarda la posición de la entrada | HU-04 (1) | Difícil |
| B-33 | Nuevo | Sembrar no gasta la semilla | HU-42 (2) | Fácil |
| B-34 | Nuevo | El manzano da fruta cada día, no cada 2 días | HU-45 (2) | Medio |
| B-35 | Nuevo | Se puede talar un tronco sin Hacha | HU-50 (2) | Medio |
| B-36 | Nuevo | "Has pescado un Trucha" | HU-49 (2) | Fácil |
| B-37 | Nuevo | "Has tirado demasiado tarde" al tirar antes de tiempo | HU-48 (2) | Fácil |
| B-38 | Nuevo | En el resumen del día, cosechas y peces están intercambiados | HU-39 (2) | Medio |
| B-39 | Nuevo | La barra de energía sigue verde entre 26 y 50 | HU-80 (2) | Medio |
| B-40 | Nuevo | Una parcela regada no se ve más oscura | HU-43 (2) | Fácil |
| B-41 | Nuevo | Al cambiar de zona se deja de correr | HU-81 (2) | Fácil |
| B-42 | Nuevo | En "¿Dormir?" la E no confirma | HU-82 (2) | Fácil |
| B-43 | Nuevo | El pedido del día 2 paga 10 monedas, no 15 | HU-54 (2) | Medio |
| B-44 | Nuevo | El cartel de la granja muestra el texto del cartel del lago | HU-12 (2) | Fácil |
| B-45 | Nuevo | Al dormir no aparece "Partida guardada" | HU-25 (2) | Fácil |
| B-46 | Nuevo | La Tarta de moras da 25 de energía, no 35 | HU-84 (2) | Medio |
| B-47 | Nuevo | En el minijuego de pesca no suena el carrete | HU-87 (2) | Medio |
| B-48 | Regresión | Vuelve B-04: "Salir" → "No" cierra el juego | HU-05 (1) | Fácil |
| B-49 | Regresión | Vuelve B-02: al entrar en la tienda se aparece lejos de la puerta | HU-08 (1) | Fácil |
| B-50 | Regresión | "Recibiste 1 Manzanas de parte del alcalde" | HU-65 (1) | Fácil |
| B-51 | Regresión | Después de dormir, el reloj avanza el doble de rápido | HU-22 (1) | Medio |
| B-52 | Regresión | Tras cerrar el inventario con Escape, Escape ya no abre la pausa | HU-26 (1) | Medio |

Los heredados se siembran igual que en valtrigo-sembrado. Sus fichas completas están en docs/bugs.md.

## Bugs nuevos

### B-33 · Día 2, granja · HU-42
- **Fallo:** al sembrar, la semilla no se gasta: el inventario mantiene la misma cantidad.
- **Esperado:** se gasta 1 unidad (HU-42).
- **Severidad:** media. Se puede sembrar todo el huerto con una sola semilla.
- **Cómo se siembra:** en GameScene, al sembrar desde SeedScene, no llamar a `removeItem` con la semilla.

### B-34 · Días 1 a 3, granja · HU-45
- **Fallo:** el manzano vuelve a tener una Manzana al día siguiente de recogerla.
- **Esperado:** una Manzana nueva cada 2 días.
- **Severidad:** baja.
- **Cómo se siembra:** en la comprobación de fruta del manzano, comparar `applePickedDay` con 1 día en vez de con 2.
- **Para qué sirve:** probar un valor que depende del paso de los días, no solo de una acción.

### B-35 · Día 3, bosque · HU-50
- **Fallo:** sin Hacha, E junto a un tronco lo tala igualmente: da Leña y gasta energía.
- **Esperado:** aparece "Necesitas un Hacha" y el tronco sigue ahí.
- **Severidad:** media.
- **Cómo se siembra:** en la recogida de recursos, saltarse la comprobación de herramienta del tronco.
- **Para qué sirve:** probar también el caso negativo, que es el que suele quedarse sin probar.

### B-36 · Día 2 o 3, lago, por la mañana · HU-49
- **Fallo:** al pescar una Trucha aparece "Has pescado un Trucha de 34 cm".
- **Esperado:** "una Trucha".
- **Severidad:** baja. Es un fallo de texto.
- **Cómo se siembra:** en src/data/fish.json, poner el artículo de la Trucha a "un".

### B-37 · Día 2 en adelante, lago · HU-48
- **Fallo:** si se pulsa E antes de "¡Pica!", aparece "Has tirado demasiado tarde".
- **Esperado:** "Has tirado demasiado pronto".
- **Severidad:** baja. El mensaje confunde al jugador.
- **Cómo se siembra:** cambiar el texto en GameScene (sección de la pesca).

### B-38 · Día 2 en adelante, al dormir · HU-39
- **Fallo:** el resumen del día muestra en "Cosechas" los peces pescados y en "Peces", las cosechas.
- **Esperado:** cada cifra en su línea.
- **Severidad:** baja.
- **Cómo se siembra:** en DaySummaryScene, intercambiar `harvests` y `fish`.
- **Para qué sirve:** solo se ve si el día tiene una cifra distinta en cada línea. Con 0 y 0 pasa desapercibido, así que obliga a preparar los datos de la prueba.

### B-39 · Cualquier día · HU-80
- **Fallo:** la barra de energía sigue verde hasta 26 y pasa directamente a roja en 25.
- **Esperado:** amarilla de 26 a 50.
- **Severidad:** baja.
- **Cómo se siembra:** en HudScene, comparar el umbral del verde con 25 en vez de con 50.
- **Para qué sirve:** practicar los valores límite (50, 51, 26 y 25).

### B-40 · Día 2, granja · HU-43 · Bug visual
- **Fallo:** al regar una parcela se gasta la energía y la parcela queda regada (crece al día siguiente), pero no se ve más oscura.
- **Esperado:** una parcela regada se ve más oscura hasta el día siguiente (HU-43).
- **Severidad:** baja. El indicador "E" sigue desapareciendo sobre las parcelas regadas.
- **Cómo se siembra:** en GameScene, al dibujar las parcelas, no aplicar `WATERED_TINT`.

### B-41 · Día 1 en adelante, cualquier zona · HU-81
- **Fallo:** al cruzar una puerta corriendo, el personaje llega andando a la otra zona.
- **Esperado:** sigue corriendo (HU-81, escenario 5).
- **Severidad:** baja.
- **Cómo se siembra:** en GameScene, al crear la zona, poner a andar al personaje.

### B-42 · Día 1 en adelante, casa del jugador · HU-82
- **Fallo:** en el cuadro "¿Dormir?", la E no confirma. Solo funciona Enter.
- **Esperado:** E confirma, igual que Enter.
- **Severidad:** baja. Se puede seguir con Enter.
- **Cómo se siembra:** abrir el cuadro de la cama sin `withE`.

### B-43 · Día 2, plaza (tablón) · HU-54
- **Fallo:** el tablón anuncia "Recompensa: 15 monedas" por "Moras para la mermelada", pero al entregar el pedido solo se reciben 10.
- **Esperado:** 15 monedas.
- **Severidad:** media.
- **Cómo se siembra:** en src/systems/orders.ts, restar 5 monedas al cobrar el pedido del día 2.
- **Para qué sirve:** comprobar el resultado (el dinero), no solo el texto que se muestra.

### B-44 · Día 1 o 2, granja · HU-12
- **Fallo:** el cartel de la entrada de la granja muestra el texto del cartel de la entrada del lago.
- **Esperado:** cada cartel muestra su propio texto.
- **Severidad:** baja. La pista del cartel queda fuera de lugar.
- **Cómo se siembra:** en GameScene, al crear los carteles, usar el texto del lago para el de la granja.

### B-45 · Día 1 en adelante, casa del jugador · HU-25
- **Fallo:** al dormir en la cama, la partida se guarda pero no aparece el mensaje "Partida guardada".
- **Esperado:** aparece brevemente "Partida guardada" (HU-25).
- **Severidad:** baja. "Continuar" carga bien la partida.
- **Cómo se siembra:** en `sleepUntilMorning` (GameScene), no mostrar el mensaje al dormir en la cama. Guardar desde la pausa sigue mostrándolo.
- **Para qué sirve:** separar lo que se ve (el mensaje) de lo que pasa (el guardado). Hay que comprobar las dos cosas.

### B-46 · Día 3 en adelante, casa del jugador · HU-84
- **Fallo:** al comerse la Tarta de moras, la energía sube 25.
- **Esperado:** sube 35 (HU-84).
- **Severidad:** baja.
- **Cómo se siembra:** en src/data/items.json, poner la energía de la Tarta de moras a 25.
- **Para qué sirve:** comprobar el efecto de un objeto con un número exacto, sin quedarse en que "sube la energía".

### B-47 · Día 2 en adelante, lago · HU-87
- **Fallo:** durante el minijuego de pesca no suena el carrete mientras el pez está dentro de la zona verde. Los demás sonidos de la pesca sí suenan.
- **Esperado:** suena el carrete (HU-87).
- **Severidad:** baja.
- **Cómo se siembra:** en GameScene (`updateFishingGame`), no reproducir `fishReel`.
- **Para qué sirve:** probar también el sonido, no solo lo que se ve.

## Regresiones

### B-48 · Menú principal · HU-05 · Bug que vuelve
- **Fallo:** el mismo que B-04. En "¿Salir del juego?", "No" también cierra el juego.
- **Severidad:** alta, como B-04. Para seguir jugando: recargar y "Continuar".
- **Cómo se siembra:** volver a introducir B-04 en `exit()` (src/scenes/MenuScene.ts).
- **Para qué sirve:** quien lo reportó en el sprint 1 debería reabrir su ticket o enlazar el nuevo al anterior. También sirve para explicar por qué se vuelve a probar lo que ya funcionaba.

### B-49 · Día 1, tienda · HU-08 · Bug que vuelve
- **Fallo:** el mismo que B-02. Al entrar en la tienda, el personaje aparece en la esquina de arriba a la izquierda y no junto a la puerta.
- **Severidad:** media.
- **Cómo se siembra:** volver a introducir B-02 en `tienda()` (tools/generar-mapas.mjs) y regenerar los mapas.

### B-50 · Día 1, plaza · HU-65 · Efecto colateral
- **Fallo:** al completar el encargo del alcalde aparece "Recibiste 1 Manzanas de parte del alcalde".
- **Esperado:** "Recibiste Manzana de parte del alcalde".
- **Severidad:** baja.
- **Cómo se siembra:** en el mensaje de "Recibiste…", usar siempre la forma con cantidad y plural.
- **Para qué sirve:** es una regresión creíble. El texto cambia como efecto de los plurales de los objetos nuevos del sprint 2.

### B-51 · Día 2 en adelante · HU-22 · Efecto colateral
- **Fallo:** después de dormir en la cama, el reloj avanza 2 minutos por segundo durante todo el día siguiente. Se corrige al cargar la partida o al dormirse a medianoche.
- **Esperado:** 1 minuto por segundo.
- **Severidad:** media. El día dura la mitad.
- **Cómo se siembra:** en `sleepUntilMorning` (GameScene), activar un multiplicador del reloj que no se quita. Solo al dormir en la cama, no a medianoche.
- **Para qué sirve:** dormir es del sprint 2 y rompe el reloj del sprint 1. La HU-22 ya se dio por buena, pero hay que volver a probarla.

### B-52 · Cualquier día · HU-26 · Efecto colateral
- **Fallo:** si se cierra el inventario con Escape, Escape deja de abrir la pausa hasta que se cambia de zona. Si se cierra con I, no pasa nada raro.
- **Esperado:** Escape abre la pausa.
- **Severidad:** media. Basta con cruzar una puerta para que vuelva a funcionar.
- **Cómo se siembra:** en InventoryScene, al cerrar con Escape, dejar activado en GameScene un indicador que bloquea la pausa y que solo se limpia al crear la zona.

## Decisiones de la revisión

- **B-51 solo al dormir en la cama, no a medianoche.** Así la condición es una sola y fácil de reproducir: dormir y medir el reloj al día siguiente. A medianoche se restaura la última partida guardada, así que el bug se corregiría solo.
- **Descartado: el cofre 1 se ve abierto antes de abrirlo.** El jugador podía darlo por vacío y no conseguir el Engranaje de cobre. Sin él no se completa el encargo 4, así que en la práctica bloqueaba la partida.
- **Descartado: la Pala vuelve a aparecer en la granja.** Daba Palas gratis y entonces nadie compraría una, que es lo que hace falta para encontrar B-03.
- **Tests:** las historias no se cambian (ya están en Jira), así que algunos bugs no los detecta ningún test. Por ejemplo, el escenario 2 de HU-22 no duerme antes de medir, así que no ve B-51.
- **Resultado de la batería:** 28 tests fallan y 346 pasan. Todos los fallos corresponden a un bug sembrado. B-10, B-12, B-13, B-43, B-44, B-46, B-51 y B-52 no los detecta ningún test y se han comprobado a mano.
