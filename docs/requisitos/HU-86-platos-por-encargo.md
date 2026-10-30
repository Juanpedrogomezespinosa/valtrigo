# HU-86. Platos por encargo

# HU-86. Platos por encargo

Como jugador, quiero que los vecinos y el tablón me pidan platos cocinados para que cocinar (HU-84) tenga más sentido.

Criterios de aceptación:

- Dos vecinos ofrecen misiones secundarias (HU-72) que piden un plato:
  - Día 5, Bruno, “Algo caliente para el bosque”: entregarle 1 Sopa de setas. 60 monedas.
  - Día 6, Tomás, “La cena de Tomás”: entregarle 1 Carpa asada. 90 monedas.
- El tablón de anuncios (HU-52) pide platos los días 5 y 6 (y los días 11 y 12, cuando se repiten los pedidos):
  - Día 5, “Sopa para el comedor”: 1 Sopa de setas. Recompensa: 70 monedas.
  - Día 6, “Guiso para la feria”: 1 Guiso de calabaza. Recompensa: 200 monedas.
- Estos pedidos y misiones funcionan igual que los demás: se aceptan, se entregan y se cobran como dicen HU-52 a HU-54 y HU-72 a HU-74.
Escenario 1: Misión de un plato

- Dado que es el día 5, el jugador tiene 1 Sopa de setas y habla con Bruno
- Cuando acepta “Algo caliente para el bosque” y vuelve a hablar con él
- Entonces aparece el mensaje “Misión completada”
- Y el jugador pierde la Sopa de setas y recibe 60 monedas
Escenario 2: Pedido de un plato en el tablón

- Dado que es el día 6 y el jugador está junto al tablón
- Cuando pulsa E
- Entonces aparece el pedido “Guiso para la feria”, que pide 1 Guiso de calabaza
Escenario 3: Entregar un pedido de un plato

- Dado que el jugador tiene activo el pedido del día 5 y 1 Sopa de setas
- Cuando pulsa E junto al tablón
- Entonces aparece el mensaje “Pedido completado”
- Y el jugador pierde la Sopa de setas y recibe 70 monedas
