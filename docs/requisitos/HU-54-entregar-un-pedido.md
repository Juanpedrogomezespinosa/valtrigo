# HU-54. Entregar un pedido

# HU-54. Entregar un pedido

Como jugador, quiero entregar los pedidos en el tablón para cobrar la recompensa de los pedidos del tablón.

Criterios de aceptación:

- Al pulsar E junto al tablón con un pedido activo cuyos objetos están en el inventario, se entregan los objetos, se cobra la recompensa y aparece el mensaje “Pedido completado”.
- Si hay varios pedidos que se pueden entregar, se entregan todos.
- Recompensas: Día 1, 20 monedas. Día 2, 15 monedas. Día 3, 30 monedas. Día 4, 40 monedas y 2 Semillas de zanahoria. Día 5, 30 monedas. Día 6, 25 monedas.
- Antes de entregar, se comprueba que la recompensa cabe en el inventario. Si no cabe, aparece “Inventario lleno” y el pedido sigue activo.
Escenario 1: Entregar

- Dado que el jugador tiene activo el pedido “Leña para el horno” y 3 Leñas
- Cuando pulsa E junto al tablón
- Entonces aparece el mensaje “Pedido completado”
- Y el jugador recibe 20 monedas
- Y las 3 Leñas desaparecen del inventario
Escenario 2: Faltan objetos

- Dado que el jugador tiene activo el pedido “Leña para el horno” y 2 Leñas
- Cuando pulsa E junto al tablón
- Entonces el pedido sigue activo
- Y las Leñas siguen en el inventario
Escenario 3: Inventario lleno

- Dado que el jugador tiene activo el pedido del día 4, 2 Nabos y el inventario completo con otros objetos
- Cuando pulsa E junto al tablón
- Entonces aparece el mensaje “Inventario lleno”
- Y el pedido sigue activo
