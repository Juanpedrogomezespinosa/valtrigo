# Bugs - solucionario (TestRail)

# Bugs - solucionario

Catálogo de los fallos que se siembran en el juego para el curso de testing manual. Documento para el profesor: es el solucionario, así que no hay que compartirlo con el alumnado. Los IDs (B-01, B-02...) se usan como referencia en TestRail y en los commits de la siembra (`B-XX: descripción breve del fallo (HU-YY)`).

## Reglas de la siembra

- **Ningún bug impide seguir jugando.** Todos tienen una forma de continuar: otro camino, otra fuente del objeto, recargar la partida o simplemente ignorarlo. Si al sembrar uno resulta que bloquea la partida, hay que cambiarlo.
- Cada bug incumple una historia de docs/requisitos/ y hace fallar al menos un test de esa historia (ver "Test que lo detecta"). Si el test sigue pasando, el bug no está bien sembrado.
- Cada bug es un cambio mínimo y va en su propio commit (skill siembra-bugs).
- Los bugs visuales se comparan con el glosario visual (docs/glosario/README.md), que muestra cada gráfico tal y como debe verse.

## Cómo leer cada entrada

- **Fallo:** lo que ve el jugador.
- **Cómo reproducirlo:** pasos desde una situación normal de juego.
- **Resultado esperado / Resultado real:** como en un caso de prueba.
- **Condición:** lo que tiene que darse para que aparezca (solo en los medios y difíciles).
- **Severidad:** impacto en el jugador. *Alta*: rompe una regla del juego o hace perder algo. *Media*: el juego sigue pero algo no funciona como debe. *Baja*: detalle visual o de comodidad.
- **Por qué está:** qué aprende a detectar el alumnado con este bug.
- **Cómo se siembra:** el cambio en el código, para quien lo introduce.
- **No bloquea porque:** por qué se puede seguir jugando.
- **Test que lo detecta:** el escenario de la historia que falla con el bug.

## Resumen

| ID | Fallo | Día y lugar | Historia | Dificultad | Severidad |
|---|---|---|---|---|---|
| B-01 | Se atraviesa la mesa de casa | Día 1, casa del jugador | HU-07 | Fácil | Baja |
| B-02 | Al entrar en la tienda se aparece lejos de la puerta | Día 1, tienda | HU-08 | Fácil | Media |
| B-03 | La Pala comprada no llega al inventario | Día 1-2, tienda | HU-17 | Fácil | Alta |
| B-04 | "Salir" → "No" cierra el juego | Menú principal | HU-05 | Fácil | Alta |
| B-17 | Un árbol de la plaza es rojo | Día 1, plaza | HU-69 | Fácil | Baja |
| B-18 | Bruno tiene aspecto de mujer | Día 3, bosque | HU-71 | Fácil | Baja |
| B-19 | La Manzana tiene el icono de la Calabaza | Día 1, inventario | HU-13 | Fácil | Baja |
| B-05 | Vender 3 Semillas da 10 monedas, no 15 | Día 1-4, tienda | HU-18 | Medio | Media |
| B-06 | El encargo del alcalde no da la Manzana | Día 1, plaza | HU-20 | Medio | Media |
| B-07 | Oscurece a las 19:30, no a las 20:00 | Día 1-2, cualquier zona exterior | HU-23 | Medio | Baja |
| B-08 | Falta una licencia en los créditos | Menú principal | HU-35 | Medio | Baja |
| B-09 | El texto del granjero no se lee bien | Día 2, granja | HU-36 | Medio | Baja |
| B-20 | El retrato del granjero es el del alcalde | Día 2, granja | HU-10 | Medio | Baja |
| B-21 | La Sopa de setas no gasta el Nabo | Día 5, casa del jugador | HU-84 | Medio | Media |
| B-22 | La Regadera grande gasta tres riegos | Día 4-5, granja | HU-85 | Medio | Media |
| B-23 | Se puede beber de la fuente varias veces al día | Día 1, plaza | HU-75 | Medio | Media |
| B-10 | Guardar en el lago guarda la posición de la entrada | Día 3, lago | HU-04 | Difícil | Media |
| B-11 | La ayuda en las esquinas no funciona en el cercado | Día 2, granja | HU-07 | Difícil | Media |
| B-12 | La Manzana no sube la energía entre 90 y 99 | Día 2-3, cualquier zona | HU-14 | Difícil | Media |
| B-13 | El cofre 2 se puede volver a abrir | Día 5, torre | HU-12 | Difícil | Baja |
| B-14 | Silenciar, guardar y reanudar devuelve la música | Cualquier día, pausa | HU-30 | Difícil | Media |
| B-15 | Dormir con 20 de energía la deja en 50 | Día 2+, casa del jugador | HU-24 | Difícil | Media |
| B-16 | Tab deja el juego sin sonido ni teclado | Cualquier día | HU-30 | Difícil | Media |
| B-24 | Correr gasta la mitad de energía | Día 1+, cualquier zona | HU-76 | Difícil | Baja |

19 de los 24 bugs se pueden encontrar en los días 1 y 2 (unos 30 minutos de juego), para que dé tiempo a encontrarlos en una sesión de clase.

## Fáciles: visibles en los primeros minutos

### B-01 · Día 1, casa del jugador · HU-07

- **Fallo:** el personaje atraviesa la mesa de la casa.
- **Cómo reproducirlo:** en la casa del jugador, caminar hacia la mesa (a la derecha, junto a la silla) desde cualquier lado.
- **Resultado esperado:** el personaje se detiene junto a la mesa, como con cualquier mueble.
- **Resultado real:** el personaje pasa por encima de la mesa.
- **Severidad:** baja.
- **Por qué está:** es el primer fallo que se encuentra al explorar. Enseña a probar las colisiones de cada obstáculo por separado y no dar por hecho que, si un mueble funciona, funcionan todos.
- **Cómo se siembra:** quitar la casilla de la mesa de la capa `obstaculos` de la casa y dibujarla en la capa `suelo` (tools/generar-mapas.mjs, `casa()`, y volver a generar los mapas).
- **No bloquea porque:** atravesar un mueble no impide nada.
- **Test que lo detecta:** ninguno todavía. Propuesta: añadir a HU-07 el escenario "Mueble" (caminar hacia la mesa de la casa y detenerse junto a ella) antes de sembrar.

### B-02 · Día 1, puerta de la tienda · HU-08

- **Fallo:** al entrar en la tienda, el personaje aparece en la esquina de arriba a la izquierda y no junto a la puerta.
- **Cómo reproducirlo:** desde la plaza, cruzar la puerta de la tienda.
- **Resultado esperado:** el personaje aparece junto a la puerta, mirando hacia dentro.
- **Resultado real:** aparece en la otra punta de la tienda.
- **Severidad:** media.
- **Por qué está:** enseña a comprobar las transiciones entre zonas, que son de lo primero que falla en un juego, y a reportar con precisión dónde aparece el personaje.
- **Cómo se siembra:** mover el punto `llegada-plaza` de la tienda a la casilla libre (2, 2), en la esquina de arriba a la izquierda (tools/generar-mapas.mjs, `tienda()`, y volver a generar los mapas).
- **No bloquea porque:** la casilla de llegada es libre y se puede caminar hasta la vendedora o la puerta.
- **Test que lo detecta:** HU-08, escenario 1 ("Entrar a la tienda").

### B-03 · Día 1 o 2, tienda · HU-17

- **Fallo:** al comprar una Pala se descuentan 30 monedas, pero la Pala no aparece en el inventario.
- **Cómo reproducirlo:** con la tienda abierta y al menos 30 monedas, comprar una Pala y abrir el inventario con I.
- **Resultado esperado:** la Pala aparece en el inventario y el dinero baja 30 monedas.
- **Resultado real:** el dinero baja 30 monedas, pero la Pala no aparece.
- **Severidad:** alta (se pierde dinero).
- **Por qué está:** enseña a comprobar los dos lados de una transacción (lo que se paga y lo que se recibe) y no quedarse con el mensaje o el sonido de compra.
- **Cómo se siembra:** en `buy()` (src/systems/economy.ts), no llamar a `addItem` cuando el objeto es la Pala.
- **No bloquea porque:** hay una Pala gratis en el suelo de la granja, junto al granero.
- **Test que lo detecta:** HU-17, escenario 1 ("Compra correcta").

### B-04 · Menú principal · HU-05

- **Fallo:** al pulsar "Salir" y después "No", el juego se cierra en lugar de volver al menú.
- **Cómo reproducirlo:** en el menú principal, activar "Salir" y elegir "No".
- **Resultado esperado:** se cierra el cuadro y el menú queda con "Salir" seleccionada.
- **Resultado real:** aparece la pantalla de despedida, como si se hubiera elegido "Sí".
- **Severidad:** alta (hace justo lo contrario de lo que pide el jugador).
- **Por qué está:** enseña a probar todas las respuestas de un cuadro de confirmación, no solo la que se usa normalmente.
- **Cómo se siembra:** en `exit()` (src/scenes/MenuScene.ts), cerrar el juego con cualquier respuesta del cuadro de confirmación.
- **No bloquea porque:** la partida guardada no se toca; basta con recargar la página y pulsar "Continuar".
- **Test que lo detecta:** HU-05, escenario 2 ("Cancelar la salida").

### B-17 · Día 1, plaza · HU-69 · Bug visual

- **Fallo:** el árbol alto otoñal que hay al noreste de la casa del jugador (casillas 12, 6 y 12, 7 de la plaza) es rojo.
- **Cómo reproducirlo:** salir de la casa del jugador y mirar los árboles de la derecha.
- **Resultado esperado:** los árboles son verdes u otoñales (amarillos), como en el glosario ("Árbol alto verde" y "Árbol alto otoñal").
- **Resultado real:** uno de ellos es rojo.
- **Severidad:** baja.
- **Por qué está:** enseña a usar una referencia (el glosario) para reportar fallos visuales, y a describirlos con precisión: cuál es el árbol y dónde está.
- **Cómo se siembra:** en GameScene, al crear la capa de obstáculos de la plaza, teñir de rojo (`tint`) las casillas (12, 6) y (12, 7).
- **No bloquea porque:** solo cambia el color.
- **Test que lo detecta:** ninguno todavía. Propuesta: añadir a HU-69 la comprobación de que ninguna casilla de árbol está teñida (escenario 1, "del mismo color").

### B-18 · Día 3, bosque · HU-71 · Bug visual

- **Fallo:** Bruno, el leñador, tiene el aspecto de una mujer.
- **Cómo reproducirlo:** ir al bosque entre las 07:00 y las 19:00 y buscar a Bruno.
- **Resultado esperado:** Bruno se ve como en el glosario (personaje "Bruno").
- **Resultado real:** se ve con la hoja de otro personaje, una mujer, aunque su nombre y su retrato son los de Bruno.
- **Severidad:** baja.
- **Por qué está:** enseña a comprobar que lo que se ve coincide con lo que se dice (nombre y retrato frente al sprite) usando el glosario.
- **Cómo se siembra:** en GameScene (`addNpc`), usar para Bruno la hoja de la vendedora.
- **No bloquea porque:** Bruno sigue hablando y dando sus misiones.
- **Test que lo detecta:** ninguno todavía. Propuesta: añadir a HU-71 la comprobación de que cada vecino usa su propia hoja (escenario 3, "Bruno en el bosque").

### B-19 · Día 1, inventario · HU-13 · Bug visual

- **Fallo:** la Manzana se ve con el icono de la Calabaza en el inventario.
- **Cómo reproducirlo:** conseguir una Manzana (recompensa del encargo del alcalde o del manzano) y abrir el inventario.
- **Resultado esperado:** la Manzana tiene su icono rojo, como en el glosario.
- **Resultado real:** tiene el icono de la Calabaza, aunque el nombre dice "Manzana".
- **Severidad:** baja.
- **Por qué está:** enseña a revisar que cada objeto muestra su propio icono y a no fiarse solo del texto.
- **Cómo se siembra:** en InventoryScene, usar `objeto-calabaza` como textura cuando el objeto es la Manzana.
- **No bloquea porque:** la Manzana funciona igual.
- **Test que lo detecta:** HU-13, escenario 1 ("Abrir el inventario con objetos").

## Medios: requieren comprobar un valor o un momento

### B-05 · Día 1 a 4, tienda · HU-18

- **Fallo:** al vender 3 Semillas (5 monedas cada una) se reciben 10 monedas, no 15.
- **Cómo reproducirlo:** tener 3 Semillas, venderlas una a una en la pestaña "Vender" y revisar el dinero.
- **Resultado esperado:** el dinero sube 15 monedas.
- **Resultado real:** sube 10: la tercera venta no da dinero.
- **Severidad:** media.
- **Por qué está:** enseña a hacer las cuentas en vez de fiarse de que "el dinero ha subido", y a probar acciones repetidas, no solo una.
- **Cómo se siembra:** en `sellOne()` (src/systems/economy.ts), no sumar el precio cuando a la casilla le quedan exactamente 3 unidades antes de vender. Con 3 Semillas, la primera venta no da dinero; con 5, la tercera.
- **No bloquea porque:** solo se pierden 5 monedas.
- **Test que lo detecta:** HU-18, escenario 2 ("Venta de varias unidades").

### B-06 · Día 1, plaza, con el alcalde · HU-20

- **Fallo:** al entregar la Carta del alcalde se reciben las 50 monedas, pero no la Manzana.
- **Cómo reproducirlo:** completar el encargo 1 y revisar el inventario.
- **Resultado esperado:** 50 monedas y 1 Manzana, con el aviso "Recibiste Manzana de parte del alcalde".
- **Resultado real:** solo las 50 monedas; el aviso sí aparece.
- **Severidad:** media.
- **Por qué está:** enseña a contrastar el aviso con el estado real (el inventario) y a revisar todas las partes de una recompensa.
- **Cómo se siembra:** en `completeQuest()` (src/systems/quests.ts), no añadir los objetos de la recompensa del encargo 1.
- **No bloquea porque:** el manzano de la granja da Manzanas cada dos días.
- **Test que lo detecta:** HU-20, escenario 1 ("Completar el encargo").

### B-07 · Día 1 o 2, cualquier zona exterior · HU-23

- **Fallo:** la pantalla empieza a oscurecerse a las 19:30, no a las 20:00.
- **Cómo reproducirlo:** esperar en una zona exterior hasta las 19:30 y mirar la pantalla.
- **Resultado esperado:** a las 19:59 la luz es normal; a las 20:00 empieza a oscurecer.
- **Resultado real:** ya está oscureciendo a las 19:30.
- **Severidad:** baja.
- **Por qué está:** enseña a probar los momentos límite de una regla de tiempo (justo antes y justo después).
- **Cómo se siembra:** en `darkness()` (src/systems/time.ts), empezar el atardecer a las 19:30.
- **No bloquea porque:** solo cambia la luz.
- **Test que lo detecta:** HU-23, escenario 2 ("Antes del atardecer").

### B-08 · Menú principal, créditos · HU-35

- **Fallo:** en los créditos falta la licencia de Ninja Adventure.
- **Cómo reproducirlo:** abrir "Créditos" en el menú principal y revisar la lista de recursos.
- **Resultado esperado:** cada recurso externo aparece con su autor y su licencia.
- **Resultado real:** Ninja Adventure aparece sin licencia.
- **Severidad:** baja (pero es un incumplimiento legal en un juego publicado).
- **Por qué está:** enseña que los textos legales también se prueban, comparándolos con la lista de recursos usados.
- **Cómo se siembra:** dejar vacía la licencia de Ninja Adventure en src/data/credits.json (se ve "Pixel-boy y AAA · " sin nada detrás).
- **No bloquea porque:** no afecta a la partida.
- **Test que lo detecta:** HU-35, escenario 2 ("Contenido de los créditos").

### B-09 · Día 2, granja · HU-36

- **Fallo:** el texto de los diálogos del granjero tiene un contraste de 3:1, por debajo del mínimo de 4,5:1.
- **Cómo reproducirlo:** hablar con el granjero y medir el contraste del texto con una herramienta (por ejemplo, un cuentagotas y una calculadora de contraste WCAG).
- **Resultado esperado:** contraste de 4,5:1 o más, como el resto de textos.
- **Resultado real:** el texto gris claro sobre el fondo del cuadro se lee mal (unos 3:1).
- **Severidad:** baja.
- **Por qué está:** introduce las pruebas de accesibilidad y la medición objetiva frente a "a mí se me lee bien".
- **Cómo se siembra:** en `showLine()` (src/scenes/DialogScene.ts), usar el gris #707070 (2,99:1 sobre el fondo del cuadro) cuando habla el granjero.
- **No bloquea porque:** el texto se sigue pudiendo leer, aunque cuesta.
- **Test que lo detecta:** HU-36, escenario 1 ("Contraste en diálogos"), que habla con el granjero.

### B-20 · Día 2, granja · HU-10 · Bug visual

- **Fallo:** al hablar con el granjero, el retrato del cuadro de diálogo es el del alcalde.
- **Cómo reproducirlo:** hablar con el granjero y comparar el retrato con el glosario ("Retratos").
- **Resultado esperado:** el retrato del granjero.
- **Resultado real:** el retrato del alcalde, con el nombre "Granjero" encima.
- **Severidad:** baja.
- **Por qué está:** enseña a revisar cada parte de una pantalla (nombre, retrato y texto) y a cruzar datos entre personajes.
- **Cómo se siembra:** en GameScene (`talkTo`), usar `retrato-alcalde` como retrato del granjero.
- **No bloquea porque:** el diálogo funciona igual.
- **Test que lo detecta:** HU-10, escenario 1 ("Iniciar un diálogo").

### B-21 · Día 5, casa del jugador · HU-84

- **Fallo:** al cocinar una Sopa de setas se gastan las 2 Setas, pero no el Nabo.
- **Cómo reproducirlo:** con 2 Setas y 1 Nabo, cocinar una Sopa de setas en el fogón y revisar el inventario.
- **Resultado esperado:** desaparecen las 2 Setas y el Nabo, y aparece 1 Sopa de setas.
- **Resultado real:** el Nabo sigue en el inventario.
- **Severidad:** media (se puede cocinar más de lo que se debería).
- **Por qué está:** los fallos que benefician al jugador también son fallos. Enseña a revisar cada ingrediente de una receta, no solo el resultado.
- **Cómo se siembra:** en `cook()` (src/systems/cooking.ts), no quitar el último ingrediente (el Nabo) cuando el plato es la Sopa de setas.
- **No bloquea porque:** sobra un Nabo.
- **Test que lo detecta:** HU-84, escenario 2 ("Cocinar").

### B-22 · Día 4 o 5, granja · HU-85

- **Fallo:** con la Regadera grande, regar tres parcelas gasta 12 de energía en vez de 4.
- **Cómo reproducirlo:** comprar la Regadera grande, sembrar tres parcelas seguidas y regar la del medio.
- **Resultado esperado:** se riegan las tres y la energía baja 4.
- **Resultado real:** se riegan las tres y la energía baja 12.
- **Severidad:** media (la mejora es peor de lo que promete).
- **Por qué está:** enseña a comprobar que una mejora hace exactamente lo que anuncia, midiendo el antes y el después.
- **Cómo se siembra:** en GameScene (`workPlot`), gastar un riego más (`work('water')`) por cada parcela de los lados que se riega.
- **No bloquea porque:** solo se gasta más energía; se recupera durmiendo o comiendo.
- **Test que lo detecta:** HU-85, escenario 6 ("Regadera grande").

### B-23 · Día 1, plaza · HU-75

- **Fallo:** "Beber" en la fuente recupera energía todas las veces, no solo una al día.
- **Cómo reproducirlo:** beber de la fuente, gastar algo de energía y volver a beber el mismo día.
- **Resultado esperado:** la segunda vez aparece "Ya has bebido hoy" y la energía no sube.
- **Resultado real:** la energía vuelve a subir 15.
- **Severidad:** media (energía infinita).
- **Por qué está:** enseña a repetir una acción que tiene un límite ("una vez al día") para comprobar que el límite existe.
- **Cómo se siembra:** en `drink()` (src/systems/fountain.ts), no comprobar `fountainDay`.
- **No bloquea porque:** solo da ventaja.
- **Test que lo detecta:** HU-75, escenario 2 ("Beber dos veces el mismo día").

## Difíciles: solo aparecen con una condición concreta

### B-10 · Día 3, lago · HU-04

- **Fallo:** al guardar desde la pausa estando en el lago, se guarda la posición de la entrada del lago (al norte, junto al camino de la plaza) en vez de la del personaje. Al continuar la partida, el personaje aparece en la entrada.
- **Condición:** guardar desde la pausa estando en el lago.
- **Cómo reproducirlo:** en el lago, ir a un sitio lejos de la entrada (por ejemplo, la orilla del este), abrir la pausa, "Guardar partida", salir al menú principal y pulsar "Continuar".
- **Resultado esperado:** el personaje aparece donde se guardó.
- **Resultado real:** aparece en la entrada del lago. Además, justo después de guardar, "Salir al menú principal" pregunta por cambios sin guardar, porque la partida guardada no coincide con la actual.
- **Severidad:** media.
- **Por qué está:** enseña a probar el guardado en distintas zonas y a comprobarlo cargando la partida, no solo mirando el mensaje "Partida guardada".
- **Cómo se siembra:** en `saveGame()` (src/scenes/PauseScene.ts), guardar la posición (15, 1) cuando la zona es el lago.
- **No bloquea porque:** el personaje aparece en una casilla libre del lago y puede ir a donde estaba.
- **Test que lo detecta:** ninguno todavía. Propuesta: añadir a HU-04 el escenario "Guardar en el lago y continuar".

### B-11 · Día 2, granja · HU-07

- **Fallo:** en la entrada del cercado del granero, la ayuda en las esquinas no funciona: si el personaje llega un poco desviado, se queda parado contra el muro.
- **Condición:** llegar a la entrada del cercado sin estar alineado con ella.
- **Cómo reproducirlo:** en la granja, caminar hacia arriba hacia la entrada del cercado (casilla 6, 9) desde un poco a la izquierda.
- **Resultado esperado:** el personaje se desliza de lado hasta alinearse y entra (HU-07, ayuda en las esquinas).
- **Resultado real:** se queda parado contra el muro hasta que el jugador se alinea a mano.
- **Severidad:** media.
- **Por qué está:** enseña a probar el mismo comportamiento en varios sitios: en otros huecos la ayuda funciona y en este no.
- **Cómo se siembra:** en `cornerSlide()` (src/entities/Player.ts), no buscar hueco cuando la zona es la granja.
- **No bloquea porque:** alineándose a mano se entra; además, el cercado es opcional.
- **Test que lo detecta:** HU-07, escenario 5 ("Hueco estrecho").

### B-12 · Día 2 o 3, cualquier zona · HU-14

- **Fallo:** al usar una Manzana con la energía entre 90 y 99, la Manzana se gasta pero la energía no sube.
- **Condición:** energía entre 90 y 99.
- **Cómo reproducirlo:** con 95 de energía, usar una Manzana desde el inventario.
- **Resultado esperado:** la energía sube hasta 100 (sin pasarse).
- **Resultado real:** la Manzana desaparece y la energía sigue en 95.
- **Severidad:** media (se pierde un objeto).
- **Por qué está:** ejercicio de valores límite: con 60 funciona, con 100 no se gasta, y el fallo está en la franja intermedia.
- **Cómo se siembra:** en `useSlot()` (src/systems/inventory.ts), no sumar energía cuando la que se tiene es 90 o más.
- **No bloquea porque:** solo se pierde una Manzana.
- **Test que lo detecta:** ninguno todavía. Propuesta: añadir a HU-14 el escenario "Energía casi al máximo" (95 → 100).

### B-13 · Día 5, torre de la relojera · HU-12

- **Fallo:** el cofre 2 se puede volver a abrir y da otro Péndulo de oro.
- **Condición:** salir de la torre menos de 3 segundos después de abrir el cofre.
- **Cómo reproducirlo:** abrir el cofre 2 del almacén de la torre, salir corriendo por la puerta y volver a entrar.
- **Resultado esperado:** el cofre sigue abierto y vacío.
- **Resultado real:** el cofre está cerrado y se puede abrir otra vez.
- **Severidad:** baja.
- **Por qué está:** enseña que los fallos de tiempo (condiciones de carrera) solo aparecen si se prueba deprisa.
- **Cómo se siembra:** en GameScene (`addChest`), anotar el cofre 2 en `openedChests` con un temporizador de 3 segundos de la escena. Al cambiar de zona la escena se reinicia y el temporizador se pierde.
- **No bloquea porque:** solo se obtiene un Péndulo de más.
- **Test que lo detecta:** ninguno todavía. Propuesta: añadir a HU-12 el escenario "Salir justo después de abrir un cofre".

### B-14 · Cualquier día, pausa · HU-30

- **Fallo:** al silenciar, guardar desde la pausa y reanudar, la música vuelve a sonar.
- **Condición:** guardar desde la pausa con el sonido silenciado.
- **Cómo reproducirlo:** activar "Silenciar" en las opciones, abrir la pausa, "Guardar partida" y "Continuar".
- **Resultado esperado:** el juego sigue en silencio.
- **Resultado real:** la música vuelve a sonar (y la opción sigue diciendo que está silenciado).
- **Severidad:** media.
- **Por qué está:** enseña a combinar opciones (silencio + guardado) en lugar de probarlas por separado.
- **Cómo se siembra:** en `saveGame()` (src/scenes/PauseScene.ts), quitar el silencio de Phaser (`this.sound.mute = false`) al guardar.
- **No bloquea porque:** se puede volver a silenciar.
- **Test que lo detecta:** ninguno todavía. Propuesta: añadir a HU-30 el escenario "Silencio después de guardar".

### B-15 · Día 2 en adelante, casa del jugador · HU-24

- **Fallo:** al dormir con la energía a 20 o menos, la energía sube a 50, no a 100.
- **Condición:** dormir en la cama con 20 de energía o menos.
- **Cómo reproducirlo:** gastar energía trabajando hasta 20 o menos y dormir en la cama.
- **Resultado esperado:** al día siguiente la energía es 100.
- **Resultado real:** es 50.
- **Severidad:** media.
- **Por qué está:** valores límite y estados: con energía alta parece funcionar, el fallo solo aparece si se llega cansado.
- **Cómo se siembra:** en `wakeUp()` (src/systems/sleep.ts), poner 50 si la energía de la partida de la que se parte (la del momento de acostarse) era 20 o menos.
- **No bloquea porque:** 50 de energía bastan para trabajar, y se puede comer.
- **Test que lo detecta:** HU-24, escenario 4 ("Energía baja").

### B-16 · Cualquier día y zona · HU-30

- **Fallo:** al pulsar Tab, el juego se queda sin música ni efectos y deja de responder al teclado hasta que se hace clic en él.
- **Condición:** pulsar Tab durante la partida o en un menú.
- **Cómo reproducirlo:** pulsar Tab y después intentar moverse.
- **Resultado esperado:** Tab no hace nada.
- **Resultado real:** el foco pasa a la barra del navegador; el juego pierde el sonido y el teclado.
- **Severidad:** media.
- **Por qué está:** fallo real encontrado al jugar. Enseña a probar teclas que el juego no usa y la integración con el navegador.
- **Cómo se siembra:** quitar en main.ts el listener que anula la acción por defecto de Tab.
- **No bloquea porque:** un clic en el juego lo recupera.
- **Test que lo detecta:** HU-30, escenario 4 ("Tecla Tab").

### B-24 · Día 1 en adelante, cualquier zona · HU-76

- **Fallo:** correr gasta 1 punto de energía cada 6 segundos, no cada 3.
- **Condición:** correr (Mayús) durante un rato y medir.
- **Cómo reproducirlo:** activar correr con 100 de energía, correr 30 segundos seguidos con un cronómetro y mirar la energía.
- **Resultado esperado:** unos 10 puntos menos.
- **Resultado real:** unos 5 puntos menos.
- **Severidad:** baja.
- **Por qué está:** un fallo que solo se ve midiendo con cuidado. Enseña a cronometrar y a comparar con el requisito en lugar de "parece que gasta".
- **Cómo se siembra:** en GameScene (`spendRunningEnergy`), usar 6000 ms en vez de `RUN_ENERGY_MS` (3000).
- **No bloquea porque:** solo da ventaja.
- **Test que lo detecta:** HU-76, escenario 2 ("Correr gasta energía").

## Trampas: no son bugs

Comportamientos que pueden parecer fallos pero son lo que piden las historias. Sirven para que el alumnado aprenda a consultar el requisito antes de reportar.

- La cámara no se mueve dentro de la casa del jugador ni en los interiores pequeños, porque la zona es más pequeña que la pantalla (HU-09).
- Fuera del horario de la tienda (de 07:00 a 19:00), al caminar hacia la puerta aparece "La tienda está cerrada, vuelve a las 7" y no se entra. Si el jugador está dentro cuando cierra, la vendedora dice "La tienda está cerrada" (HU-17).
- Al dormirse a medianoche, el progreso no guardado del día se pierde (HU-24 y HU-25).
- El inventario, la tienda, la lista de objetivos y el fogón no detienen el reloj; solo la pausa lo para (HU-13 y HU-22).
- La torre está cerrada hasta el día 5 (HU-57), y la relojera solo está de 09:00 a 22:00 (HU-64).
- Los NPC desaparecen fuera de su horario (HU-40 y HU-71). El alcalde no está a partir de las 20:00.
- Pedro solo aparece el día 7, en la feria (HU-58).
- El día 7 el jugador se despierta a las 12:00, no a las 06:00 (HU-58).
- El día 7 los vecinos solo dicen su frase de la feria y no ofrecen misiones (HU-71).
- Una misión con hora límite que no se completa a tiempo desaparece de la lista como fallida (HU-74).
- El tablón solo deja aceptar un pedido al día y como mucho 3 activos (HU-52 y HU-53).
- Los pedidos de los días 5 y 6 piden platos cocinados, no ingredientes (HU-86).
- Al cocinar con el inventario lleno, el plato cabe si los ingredientes dejan una casilla libre (HU-84).
- La Regadera grande no riega las parcelas de los lados que no están sembradas o que ya están regadas (HU-85).
- Mayús activa y desactiva correr: no hay que mantenerla pulsada (HU-81). Correr gasta energía y con 10 o menos no se puede (HU-76).
- E confirma en las pantallas de la partida, pero en el menú principal, las opciones y el nombre solo confirma Enter (HU-82).

## Caso de prueba de ejemplo: B-03

- **Precondición:** tienda abierta, 100 monedas, inventario vacío.
- **Pasos:** hablar con la vendedora, comprar una Pala y abrir el inventario con I.
- **Resultado esperado:** la Pala aparece en el inventario con cantidad 1 y el dinero queda en 70 monedas.
- **Resultado real:** el dinero queda en 70 monedas, pero la Pala no aparece en el inventario.
