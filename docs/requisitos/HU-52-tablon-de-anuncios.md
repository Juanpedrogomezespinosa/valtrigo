# HU-52. Tablón de anuncios

# HU-52. Tablón de anuncios

Como jugador, quiero leer pedidos en un tablón de la plaza para tener tareas cada día.

Criterios de aceptación:

- En la plaza hay un tablón de anuncios. Al pulsar E junto a él se muestra el pedido del día, con las opciones “Aceptar” y “Rechazar”.
- Cada día tiene un pedido fijo, siempre el mismo para ese día. Día 1: 3 Leñas. Día 2: 2 Moras. Día 3: 1 Trucha. Día 4: 2 Nabos. Día 5: 3 Setas. Día 6: 1 Carpa. A partir del día 7 se repite la lista desde el día 1.
- El pedido del día solo se puede aceptar ese día. Una vez aceptado, el tablón muestra “Ya has aceptado el pedido de hoy”.
- Si se rechaza, se puede volver a leer y aceptar ese mismo día.
- Los pedidos aceptados se entregan en el tablón (HU-54).
Escenario 1: Leer el pedido

- Dado que es el día 1
- Cuando el jugador pulsa E junto al tablón
- Entonces aparece el pedido “Leña para el horno”, que pide 3 Leñas
Escenario 2: Aceptar

- Dado que el tablón muestra el pedido del día
- Cuando el jugador pulsa “Aceptar”
- Entonces el pedido aparece en la lista de objetivos
Escenario 3: Ya aceptado

- Dado que el jugador ha aceptado el pedido de hoy
- Cuando vuelve a pulsar E junto al tablón
- Entonces aparece el mensaje “Ya has aceptado el pedido de hoy”
Escenario 4: Mismo pedido cada partida

- Dado que dos partidas distintas están en el día 3
- Cuando el jugador lee el tablón en cada una
- Entonces las dos muestran el mismo pedido
