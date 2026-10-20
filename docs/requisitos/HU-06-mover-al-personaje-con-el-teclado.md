# HU-06. Mover al personaje con el teclado

# HU-06. Mover al personaje con el teclado

Como jugador, quiero mover a mi personaje con las flechas o WASD para explorar el mundo.

Criterios de aceptación:

- El personaje se mueve en cuatro direcciones (arriba, abajo, izquierda y derecha) con las flechas y con WASD.
- El personaje se mueve a velocidad constante y mira en la dirección del movimiento.
- Si se pulsan dos direcciones a la vez, el personaje se mueve en la última pulsada, sin diagonales.
- Con el menú de pausa abierto, el personaje no se mueve.
Escenario 1: Movimiento con las flechas

- Dado que el jugador está en una zona sin obstáculos
- Cuando mantiene pulsada la flecha derecha durante 1 segundo
- Entonces el personaje se desplaza hacia la derecha a velocidad constante
- Y mira hacia la derecha
Escenario 2: Movimiento con WASD

- Dado que el jugador está en una zona sin obstáculos
- Cuando pulsa la tecla W
- Entonces el personaje se desplaza hacia arriba
- Y mira hacia arriba
Escenario 3: Dos direcciones a la vez

- Dado que el jugador está en una zona sin obstáculos
- Cuando pulsa la flecha arriba y, sin soltarla, la flecha derecha
- Entonces el personaje se mueve hacia la derecha
Escenario 4: Movimiento bloqueado en pausa

- Dado que el menú de pausa está abierto
- Cuando el jugador pulsa la flecha derecha
- Entonces el personaje no se mueve

