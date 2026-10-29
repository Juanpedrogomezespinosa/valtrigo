# HU-43. Regar con la Regadera

# HU-43. Regar con la Regadera

Como jugador, quiero regar mis cultivos para que crezcan.

Criterios de aceptación:

- Al pulsar E junto a una parcela sembrada y sin regar ese día, con una Regadera en el inventario, la parcela queda regada y se gastan 4 de energía (HU-76).
- Una parcela regada se ve más oscura hasta el día siguiente.
- Una parcela ya regada ese día no se puede volver a regar.
- Sin Regadera aparece el mensaje “Necesitas una Regadera”.
- Al empezar cada día, todas las parcelas quedan sin regar.
Escenario 1: Regar

- Dado que el jugador tiene una Regadera y 100 de energía
- Cuando pulsa E junto a una parcela sembrada y sin regar
- Entonces la parcela queda regada
- Y la energía es 96
Escenario 2: Ya regada

- Dado que la parcela ya está regada ese día
- Cuando el jugador pulsa E junto a ella
- Entonces no se gasta energía
Escenario 3: Sin Regadera

- Dado que el jugador no tiene ninguna Regadera
- Cuando pulsa E junto a una parcela sembrada
- Entonces aparece el mensaje “Necesitas una Regadera”
Escenario 4: Nuevo día

- Dado que el jugador ha regado una parcela
- Cuando duerme y empieza el día siguiente
- Entonces la parcela está sin regar
