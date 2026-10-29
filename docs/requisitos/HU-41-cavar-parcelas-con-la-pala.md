# HU-41. Cavar parcelas con la Pala

# HU-41. Cavar parcelas con la Pala

Como jugador, quiero cavar la tierra de la granja para poder sembrar.

Criterios de aceptación:

- La granja tiene un huerto de 6×4 parcelas. Solo se puede cavar en ellas.
- Al pulsar E junto a una parcela sin cavar, con una Pala en el inventario, la parcela queda cavada y se gastan 8 de energía (HU-76).
- Sin Pala aparece el mensaje “Necesitas una Pala” y la parcela no cambia.
- Una parcela cavada sigue cavada los días siguientes.
Escenario 1: Cavar

- Dado que el jugador tiene una Pala y 100 de energía
- Cuando pulsa E junto a una parcela sin cavar
- Entonces la parcela queda cavada
- Y la energía es 92
Escenario 2: Sin Pala

- Dado que el jugador no tiene ninguna Pala
- Cuando pulsa E junto a una parcela sin cavar
- Entonces aparece el mensaje “Necesitas una Pala”
- Y la parcela no cambia
Escenario 3: Fuera del huerto

- Dado que el jugador tiene una Pala
- Cuando pulsa E en cualquier otro sitio de la granja
- Entonces no se cava nada
Escenario 4: Al día siguiente

- Dado que el jugador ha cavado una parcela
- Cuando duerme y empieza el día siguiente
- Entonces la parcela sigue cavada
