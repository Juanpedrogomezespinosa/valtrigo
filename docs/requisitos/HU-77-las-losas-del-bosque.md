# HU-77. Las losas del bosque

# HU-77. Las losas del bosque

Como jugador, quiero resolver un acertijo escondido en el bosque para descubrir sus secretos.

Criterios de aceptación:

- En un claro escondido del bosque, al que se llega por un sendero desde el camino principal, hay 9 losas de piedra en una cuadrícula de 3×3.
- Junto a las losas hay un cartel: “Pisa todas las piedras, pero ninguna dos veces.”
- Al pisar una losa apagada, se enciende.
- Al pisar una losa que ya estaba encendida, todas se apagan y aparece “Las losas se apagan”.
- Al encenderse las 9, aparece “Las losas brillan” y el jugador recibe 60 monedas y 2 Semillas de calabaza. Si las Semillas no caben en el inventario, aparece “Inventario lleno” y la última losa no se enciende: se puede volver a pisar cuando haya sitio.
- Una vez resuelto, las losas se quedan encendidas para siempre y pisarlas no hace nada. El acertijo solo se puede resolver una vez.
- Si el jugador sale del bosque sin resolverlo, las losas se apagan.
Escenario 1: Encender una losa

- Dado que todas las losas están apagadas
- Cuando el jugador pisa una losa
- Entonces esa losa se enciende
Escenario 2: Pisar una losa encendida

- Dado que hay 3 losas encendidas
- Cuando el jugador vuelve a pisar una de ellas
- Entonces todas las losas se apagan
- Y aparece “Las losas se apagan”
Escenario 3: Resolver el acertijo

- Dado que hay 8 losas encendidas y el jugador tiene 100 monedas
- Cuando pisa la que falta
- Entonces aparece “Las losas brillan”
- Y el jugador tiene 160 monedas y 2 Semillas de calabaza
Escenario 4: Acertijo resuelto

- Dado que el acertijo ya está resuelto
- Cuando el jugador vuelve a pisar una losa
- Entonces las losas siguen encendidas y no recibe nada más
Escenario 5: Salir del bosque

- Dado que hay 4 losas encendidas
- Cuando el jugador sale del bosque y vuelve
- Entonces todas las losas están apagadas
