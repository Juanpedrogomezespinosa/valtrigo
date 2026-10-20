# HU-48. Pescar en el lago

# HU-48. Pescar en el lago

Como jugador, quiero pescar en el lago para conseguir peces y venderlos.

Criterios de aceptación:

- Al pulsar E mirando al agua del lago, a menos de una casilla, con una Caña de pescar en el inventario, el personaje lanza la caña y se gastan 3 de energía.
- Entre 2 y 5 segundos después aparece “¡Pica!”. Si el jugador pulsa E antes de que pase 1 segundo, el pez va al inventario. Si tarda más, aparece “Se ha escapado”.
- Si pulsa E antes de que aparezca “¡Pica!”, aparece “Has tirado demasiado pronto” y no pesca nada.
- Pulsar una flecha recoge la caña sin pescar nada. La energía gastada no se devuelve.
- Mientras pesca, el personaje no se mueve. Escape abre la pausa y la pesca continúa al reanudar.
- Si el pez no cabe en el inventario, aparece “Inventario lleno” y se pierde.
- Sin Caña de pescar aparece el mensaje “Necesitas una Caña de pescar”.
Escenario 1: Pescar a tiempo

- Dado que el jugador tiene una Caña de pescar y está mirando al agua
- Cuando pulsa E y vuelve a pulsar E menos de 1 segundo después de que aparezca “¡Pica!”
- Entonces aparece un pez en el inventario
- Y la energía ha bajado 3
Escenario 2: Demasiado tarde

- Dado que aparece “¡Pica!”
- Cuando el jugador no pulsa E en 1 segundo
- Entonces aparece el mensaje “Se ha escapado”
- Y el inventario no cambia
Escenario 3: Demasiado pronto

- Dado que el jugador ha lanzado la caña y aún no ha aparecido “¡Pica!”
- Cuando pulsa E
- Entonces aparece el mensaje “Has tirado demasiado pronto”
- Y el inventario no cambia
Escenario 4: Recoger la caña

- Dado que el jugador ha lanzado la caña
- Cuando pulsa una flecha
- Entonces deja de pescar sin pescar nada
Escenario 5: Sin caña

- Dado que el jugador no tiene ninguna Caña de pescar
- Cuando pulsa E mirando al agua
- Entonces aparece el mensaje “Necesitas una Caña de pescar”
