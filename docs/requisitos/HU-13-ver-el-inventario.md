# HU-13. Ver el inventario

# HU-13. Ver el inventario

Como jugador, quiero ver mi inventario para saber qué objetos tengo.

Criterios de aceptación:

- Al pulsar I se abre el inventario y al pulsar I o Escape se cierra.
- Cada objeto muestra su icono, su nombre y su cantidad.
- El inventario tiene 20 casillas (30 con la Mochila grande, HU-85); las casillas libres se muestran vacías.
- Con el inventario abierto, el personaje no se mueve.
Escenario 1: Abrir el inventario con objetos

- Dado que el jugador tiene 3 Manzanas y 1 Pala
- Cuando pulsa I
- Entonces se muestra el inventario con la Manzana con cantidad 3 y la Pala con cantidad 1
Escenario 2: Inventario vacío

- Dado que el jugador no tiene objetos
- Cuando pulsa I
- Entonces se muestran las 20 casillas vacías
Escenario 3: Cerrar el inventario

- Dado que el inventario está abierto
- Cuando el jugador pulsa I o Escape
- Entonces el inventario se cierra y el juego continúa
Escenario 4: Movimiento bloqueado

- Dado que el inventario está abierto
- Cuando el jugador pulsa la flecha derecha
- Entonces el personaje no se mueve

