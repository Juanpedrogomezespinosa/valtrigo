# HU-69. Árboles completos

# HU-69. Árboles completos

Como jugador, quiero que los árboles se vean completos para que el mundo tenga un aspecto cuidado.

Criterios de aceptación:

- En las zonas exteriores (plaza, granja, lago y bosque) hay árboles altos, de dos casillas, y árboles pequeños, de una. Unos son verdes y otros otoñales.
- Un árbol alto tiene la copa en la casilla de arriba y el tronco en la de abajo, y las dos partes son del mismo árbol: ningún árbol aparece cortado ni mezcla un árbol verde con uno otoñal.
- Todas las casillas de un árbol, alto o pequeño, son obstáculos (HU-07).
Escenario 1: Árboles altos completos

- Dado que el jugador está en una zona exterior
- Cuando hay un árbol alto en pantalla
- Entonces se ven su copa y su tronco, uno debajo del otro y del mismo color
Escenario 2: Ningún árbol cortado

- Dado que el jugador está en una zona exterior
- Cuando recorre la zona
- Entonces no hay ninguna copa sin tronco ni ningún tronco sin copa
Escenario 3: Árboles sólidos

- Dado que hay un árbol alto encima del personaje
- Cuando el jugador camina hacia él
- Entonces el personaje se detiene junto al tronco
