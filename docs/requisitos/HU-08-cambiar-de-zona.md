# HU-08. Cambiar de zona

# HU-08. Cambiar de zona

Como jugador, quiero entrar a edificios y cambiar de zona para explorar el pueblo.

Criterios de aceptación:

- El juego tiene 6 zonas conectadas por puertas.
- Al cruzar una puerta, la pantalla se funde a negro en 0,5 segundos y el personaje aparece junto a la puerta de la zona de destino.
- Durante la transición no se puede mover al personaje.
Escenario 1: Entrar a la tienda

- Dado que el jugador está frente a la puerta de la tienda del pueblo
- Cuando camina sobre la puerta
- Entonces la pantalla se funde a negro en 0,5 segundos
- Y el personaje aparece en el interior de la tienda, junto a la puerta de salida
Escenario 2: Salir de la tienda

- Dado que el jugador está dentro de la tienda
- Cuando camina sobre la puerta de salida
- Entonces vuelve a la zona exterior junto a la puerta de la tienda
Escenario 3: Transición en curso

- Dado que una transición de zona está en curso
- Cuando el jugador pulsa las flechas
- Entonces el personaje no se mueve hasta que termina el fundido

