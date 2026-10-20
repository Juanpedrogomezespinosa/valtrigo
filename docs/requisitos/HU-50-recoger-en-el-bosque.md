# HU-50. Recoger en el bosque

# HU-50. Recoger en el bosque

Como jugador, quiero recoger lo que da el bosque para conseguir comida y cosas que vender.

Criterios de aceptación:

- En el bosque hay puntos fijos: 4 de Setas, 3 de Moras y 5 troncos.
- Al pulsar E junto a un punto de Setas o de Moras, se recoge 1 unidad, se gasta 1 de energía y el punto desaparece.
- Al pulsar E junto a un tronco, con un Hacha en el inventario, se tala: se recibe 1 Leña, se gastan 5 de energía y el tronco desaparece. Sin Hacha aparece el mensaje “Necesitas un Hacha”.
- Al empezar cada día, todos los puntos y troncos vuelven a aparecer.
- Si no cabe en el inventario, aparece “Inventario lleno” y el punto o el tronco siguen ahí.
- Precios de venta: Setas 8 monedas, Moras 5 y Leña 3. Las Setas dan 10 de energía y las Moras 5; la Leña no se puede comer.
Escenario 1: Recoger

- Dado que el jugador está junto a un punto de Setas
- Cuando pulsa E
- Entonces aparece 1 Seta en el inventario
- Y el punto desaparece
Escenario 2: Talar

- Dado que el jugador tiene un Hacha y 100 de energía
- Cuando pulsa E junto a un tronco
- Entonces aparece 1 Leña en el inventario
- Y la energía es 95
- Y el tronco desaparece
Escenario 3: Sin Hacha

- Dado que el jugador no tiene ningún Hacha
- Cuando pulsa E junto a un tronco
- Entonces aparece el mensaje “Necesitas un Hacha”
- Y el tronco sigue en el bosque
Escenario 4: Vuelve al día siguiente

- Dado que el jugador ha recogido un punto de Setas
- Cuando duerme y empieza el día siguiente
- Entonces el punto vuelve a estar en el bosque
Escenario 5: Inventario lleno

- Dado que el inventario está completo
- Cuando el jugador pulsa E junto a un punto de Moras
- Entonces aparece el mensaje “Inventario lleno”
- Y el punto sigue en el bosque
