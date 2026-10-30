# HU-85. Mejoras

# HU-85. Mejoras

Como jugador, quiero comprar mejoras en la tienda para trabajar mejor y tener algo en lo que gastar el dinero.

Criterios de aceptación:

- La tienda tiene una tercera pestaña, “Mejoras”, a la derecha de “Vender”. Muestra las mejoras con su precio, o “Comprada” si ya se tiene.
- Hay tres mejoras:
  - Mochila grande (150 monedas): el inventario pasa de 20 a 30 casillas.
  - Regadera grande (120 monedas): al regar una parcela también se riegan las de sus dos lados, si están sembradas y sin regar. Se gasta la energía de un solo riego.
  - Caña buena (100 monedas): el pez pica entre 1 y 3 segundos después de lanzar la caña (en vez de entre 2 y 5) y, después de “¡Pica!”, hay 2 segundos para pulsar E (en vez de 1).
- Cada mejora se compra una sola vez. E o Enter sobre una mejora comprada muestra “Ya tienes esta mejora” y no cobra nada.
- Al comprar se comprueba el horario de la tienda (“La tienda está cerrada”) y el dinero (“Dinero insuficiente”). Una compra correcta reproduce el efecto de compra (HU-32).
- Las mejoras no ocupan inventario, no se pueden vender y se guardan con la partida.
- “Las dos parcelas de los lados” son las que están a la izquierda y a la derecha de la parcela regada, vistas desde el personaje.
- El día 4, la lista de tareas (HU-63) incluye “Compra una mejora en la tienda”.
Escenario 1: Ver las mejoras

- Dado que el jugador tiene la tienda abierta en “Vender”
- Cuando pulsa la flecha derecha
- Entonces aparece la pestaña “Mejoras” con la Mochila grande, la Regadera grande y la Caña buena y sus precios
Escenario 2: Comprar una mejora

- Dado que el jugador tiene 200 monedas y está en la pestaña “Mejoras”
- Cuando compra la Mochila grande
- Entonces tiene 50 monedas
- Y la Mochila grande aparece como “Comprada”
Escenario 3: Dinero insuficiente

- Dado que el jugador tiene 50 monedas y está en la pestaña “Mejoras”
- Cuando intenta comprar la Caña buena
- Entonces aparece el mensaje “Dinero insuficiente”
- Y sigue teniendo 50 monedas
Escenario 4: Mejora ya comprada

- Dado que el jugador tiene la Caña buena y 200 monedas
- Cuando intenta comprarla otra vez
- Entonces aparece el mensaje “Ya tienes esta mejora”
- Y sigue teniendo 200 monedas
Escenario 5: Mochila grande

- Dado que el jugador tiene la Mochila grande y 20 casillas ocupadas
- Cuando recoge un objeto nuevo
- Entonces el objeto ocupa la casilla 21
- Y el inventario muestra 30 casillas
Escenario 6: Regadera grande

- Dado que el jugador tiene la Regadera grande y una Regadera, y tres parcelas seguidas sembradas y sin regar
- Cuando riega la del medio
- Entonces las tres parcelas quedan regadas
- Y solo se gasta la energía de un riego
Escenario 7: Caña buena

- Dado que el jugador tiene la Caña buena y una Caña de pescar
- Cuando lanza la caña
- Entonces “¡Pica!” aparece como mucho 3 segundos después
- Y hay 2 segundos para pulsar E
