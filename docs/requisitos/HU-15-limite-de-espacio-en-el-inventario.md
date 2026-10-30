# HU-15. Límite de espacio en el inventario

# HU-15. Límite de espacio en el inventario

Como jugador, quiero que el inventario tenga un límite de espacios para tener que decidir qué guardar.

Criterios de aceptación:

- El inventario tiene 20 casillas (30 con la Mochila grande, HU-85).
- Cada casilla admite hasta 99 unidades del mismo objeto. Al llegar a 99, el resto ocupa una casilla nueva.
- Si no hay casillas libres ni espacio parcial del mismo objeto, el objeto no se recoge y aparece el mensaje “Inventario lleno”.
Escenario 1: Inventario completo

- Dado que el inventario tiene las 20 casillas ocupadas por objetos distintos
- Cuando el jugador recoge una Pala nueva
- Entonces aparece el mensaje “Inventario lleno”
- Y la Pala no se añade al inventario
Escenario 2: Apilar hasta 99

- Dado que el jugador tiene 98 Semillas en una casilla y hay casillas libres
- Cuando recoge 3 Semillas
- Entonces la primera casilla queda con 99 Semillas
- Y se ocupa una casilla nueva con 2 Semillas
Escenario 3: Completar una casilla sin espacio libre

- Dado que el inventario tiene las 20 casillas ocupadas y una de ellas tiene 98 Semillas
- Cuando el jugador recoge 1 Semilla
- Entonces la casilla pasa a 99 Semillas
- Y el inventario no cambia de número de casillas ocupadas

