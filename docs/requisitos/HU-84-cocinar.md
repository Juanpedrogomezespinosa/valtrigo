# HU-84. Cocinar

# HU-84. Cocinar

Como jugador, quiero cocinar platos con lo que cultivo, pesco y recojo para recuperar más energía y ganar más dinero.

Criterios de aceptación:

- En la casa del jugador hay un fogón, que es un obstáculo. Al pulsar E junto a él se abre la pantalla “Fogón” con las recetas.
- Hay cuatro recetas. Cada una da un plato que se come desde el inventario o se vende en la tienda:
  - Sopa de setas: 2 Setas y 1 Nabo. Da 40 de energía y se vende por 45 monedas.
  - Tarta de moras: 3 Moras y 1 Manzana. Da 35 de energía y se vende por 50 monedas.
  - Carpa asada: 1 Carpa y 1 Zanahoria. Da 50 de energía y se vende por 80 monedas.
  - Guiso de calabaza: 1 Calabaza, 1 Nabo y 1 Seta. Da 80 de energía y se vende por 150 monedas.
- La pantalla muestra cada receta con sus ingredientes y cuántos tiene el jugador de cada uno (por ejemplo, “Seta 1/2”). ↑ ↓ eligen la receta, E o Enter la cocinan y Escape cierra la pantalla.
- Al cocinar se gastan los ingredientes, se recibe 1 plato y aparece el mensaje “Has cocinado [plato]”. La pantalla sigue abierta. Cocinar no gasta energía.
- Si faltan ingredientes, aparece “Te faltan ingredientes” y no se gasta nada.
- Si el plato no cabe en el inventario, contando las casillas que dejan libres los ingredientes, aparece “Inventario lleno” y no se gasta nada.
- Como el inventario, la pantalla del fogón no detiene el tiempo y el personaje no se mueve mientras está abierta.
- El día 5, la lista de tareas (HU-63) incluye “Cocina un plato en el fogón de tu casa”.
Escenario 1: Abrir el fogón

- Dado que el jugador está junto al fogón de su casa
- Cuando pulsa E
- Entonces se abre la pantalla “Fogón” con las cuatro recetas
Escenario 2: Cocinar

- Dado que el jugador tiene 2 Setas y 1 Nabo y tiene abierta la pantalla del fogón
- Cuando elige “Sopa de setas” y pulsa E
- Entonces pierde las 2 Setas y el Nabo
- Y recibe 1 Sopa de setas
- Y aparece el mensaje “Has cocinado Sopa de setas”
Escenario 3: Faltan ingredientes

- Dado que el jugador tiene 1 Seta y 1 Nabo y tiene abierta la pantalla del fogón
- Cuando elige “Sopa de setas” y pulsa E
- Entonces aparece el mensaje “Te faltan ingredientes”
- Y el inventario no cambia
Escenario 4: Inventario lleno

- Dado que el jugador tiene las 20 casillas del inventario ocupadas, entre ellas una con 4 Moras y otra con 2 Manzanas
- Cuando cocina “Tarta de moras”
- Entonces aparece el mensaje “Inventario lleno”
- Y el inventario no cambia
Escenario 5: Comer un plato

- Dado que el jugador tiene 50 de energía y 1 Carpa asada
- Cuando la usa desde el inventario
- Entonces su energía es 100
Escenario 6: Vender un plato

- Dado que el jugador tiene 1 Guiso de calabaza y la tienda está abierta
- Cuando lo vende
- Entonces recibe 150 monedas
