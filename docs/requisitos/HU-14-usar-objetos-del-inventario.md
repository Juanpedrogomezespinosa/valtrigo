# HU-14. Usar objetos del inventario

# HU-14. Usar objetos del inventario

Como jugador, quiero usar objetos como las manzanas para recuperar energía.

Criterios de aceptación:

- Desde el inventario, el jugador selecciona un objeto y pulsa Enter para usarlo.
- Una Manzana recupera 15 puntos de energía, sin superar el máximo de 100.
- Al usar un objeto consumible se reduce su cantidad en 1. Si la cantidad llega a 0, el objeto desaparece del inventario.
- Si la energía está al máximo, la Manzana no se consume.
- La energía aparece en la esquina superior derecha de la pantalla, debajo del dinero, con el formato “Energía: [actual]/100”.
Escenario 1: Usar una Manzana

- Dado que el jugador tiene 3 Manzanas y 60 puntos de energía
- Cuando usa una Manzana
- Entonces la energía sube a 75
- Y la cantidad de Manzanas pasa a 2
Escenario 2: Usar el último objeto

- Dado que el jugador tiene 1 Manzana
- Cuando la usa
- Entonces la Manzana desaparece del inventario
Escenario 3: Energía al máximo

- Dado que el jugador tiene 100 puntos de energía y 1 Manzana
- Cuando la usa
- Entonces la energía se mantiene en 100
- Y la Manzana no se consume
Escenario 4: Objeto no consumible

- Dado que el jugador selecciona la Pala
- Cuando pulsa Enter
- Entonces aparece el mensaje “No se puede usar”
Escenario 5: Ver la energía

- Dado que el jugador tiene 60 puntos de energía
- Cuando usa una Manzana
- Entonces la interfaz pasa de “Energía: 60/100” a “Energía: 75/100”

