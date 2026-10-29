# HU-82. Confirmar con E

# HU-82. Confirmar con E

Como jugador, quiero hacer todas las acciones de la partida con la E para no tener que cambiar de tecla.

Criterios de aceptación:

- Durante la partida, todo lo que se confirma con Enter se confirma también con E: comprar y vender en la tienda, usar un objeto del inventario, “¿Dormir?” y “¿Inscribirte en el concurso de pesca?”, las opciones de los diálogos, colocar piezas en el mecanismo del reloj, elegir semilla o cosecha, y el menú de pausa con su cuadro de confirmación.
- La E con la que se abre una pantalla no confirma nada en ella: para confirmar hay que volver a pulsarla.
- Las ayudas de la parte de abajo de esas pantallas indican la E (por ejemplo, “E: colocar”).
- En el menú principal, las opciones, la pantalla del nombre y la del aspecto se sigue confirmando con Enter (en el nombre, la E es una letra).
- La tabla de controles (HU-33) muestra “Usar objeto: E o Enter”.
Escenario 1: Comprar con E

- Dado que el jugador está en la tienda con la Pala seleccionada y 100 monedas
- Cuando pulsa E
- Entonces compra una Pala y le quedan 70 monedas
Escenario 2: Usar un objeto con E

- Dado que el jugador tiene 60 puntos de energía y una Manzana seleccionada en el inventario
- Cuando pulsa E
- Entonces la energía sube a 75
Escenario 3: Dormir con E

- Dado que el jugador está junto a la cama
- Cuando pulsa E, elige “Sí” y vuelve a pulsar E
- Entonces se duerme
Escenario 4: La E que abre no confirma

- Dado que el jugador está junto a la cama
- Cuando pulsa E
- Entonces aparece “¿Dormir?” y sigue abierto
Escenario 5: Menú de pausa con E

- Dado que el menú de pausa está abierto con “Continuar” seleccionado
- Cuando el jugador pulsa E
- Entonces la partida se reanuda
